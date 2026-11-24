import mongoose, { ClientSession, Types } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Cart } from '@/models/Cart';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { User } from '@/models/User';
import { incrementOrderNumberCounter, initializeOrderNumberCounter } from '@/lib/orderNumber';

export interface CheckoutItemInput {
  productId?: unknown;
  id?: unknown;
  _id?: unknown;
  quantity?: unknown;
  size?: unknown;
  color?: unknown;
}

export interface CheckoutOrderInput {
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: unknown;
  billingAddress?: unknown;
  paymentMethod?: unknown;
  items?: CheckoutItemInput[];
}

export class OrderCreationError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'OrderCreationError';
  }
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

function normalizeAddress(value: unknown): Address {
  const address = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const normalized = {
    street: String(address.street || address.address || '').trim(),
    city: String(address.city || '').trim(),
    state: String(address.state || '').trim(),
    zipCode: String(address.zipCode || '').trim(),
    country: String(address.country || '').trim(),
  };
  if (Object.values(normalized).some((part) => !part)) {
    throw new OrderCreationError('A complete shipping and billing address is required', 400);
  }
  return normalized;
}

function normalizeVariant(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || value.trim().length > 100) {
    throw new OrderCreationError(`Invalid ${label} selection`, 400);
  }
  return value.trim();
}

async function reserveInventory(
  item: CheckoutItemInput,
  session: ClientSession
): Promise<{ productId: Types.ObjectId; name: string; quantity: number; price: number; size?: string; color?: string }> {
  const rawId = item.productId ?? item.id ?? item._id;
  const productId = typeof rawId === 'string' ? rawId.trim() : '';
  const quantity = Number(item.quantity);
  const size = normalizeVariant(item.size, 'size');
  const color = normalizeVariant(item.color, 'color');

  if (!Types.ObjectId.isValid(productId)) {
    throw new OrderCreationError('Invalid product ID', 400);
  }
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new OrderCreationError('Quantity must be a positive whole number', 400);
  }

  const product = await Product.findOne({ _id: productId, active: true })
    .select('name price discountPrice sizes colors stock')
    .session(session)
    .lean();

  if (!product) {
    throw new OrderCreationError('Product not found or unavailable', 404);
  }

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const selectedSize = size
    ? sizes.find((variant) => variant.size?.toLowerCase() === size.toLowerCase())
    : undefined;
  const selectedColor = color
    ? colors.find((variant) => variant.color?.toLowerCase() === color.toLowerCase())
    : undefined;

  if (size && !selectedSize) throw new OrderCreationError('Selected size is not available for this product', 400);
  if (color && !selectedColor) throw new OrderCreationError('Selected color is not available for this product', 400);
  if (sizes.length > 0 && !size) throw new OrderCreationError('Select a size before checkout', 400);
  if (colors.length > 0 && !color) throw new OrderCreationError('Select a color before checkout', 400);

  const conditions: Record<string, unknown>[] = [];
  const arrayFilters: Record<string, unknown>[] = [];
  const increments: Record<string, number> = {};

  if (selectedSize) {
    conditions.push({ sizes: { $elemMatch: { size: selectedSize.size, stock: { $gte: quantity } } } });
    arrayFilters.push({ 'sizeVariant.size': selectedSize.size, 'sizeVariant.stock': { $gte: quantity } });
    increments['sizes.$[sizeVariant].stock'] = -quantity;
  }
  if (selectedColor) {
    conditions.push({ colors: { $elemMatch: { color: selectedColor.color, stock: { $gte: quantity } } } });
    arrayFilters.push({ 'colorVariant.color': selectedColor.color, 'colorVariant.stock': { $gte: quantity } });
    increments['colors.$[colorVariant].stock'] = -quantity;
  }
  if (!selectedSize && !selectedColor) {
    conditions.push({ stock: { $gte: quantity } });
    increments.stock = -quantity;
  }

  const inventoryUpdate = await Product.updateOne(
    { _id: product._id, active: true, $and: conditions },
    { $inc: increments },
    { session, ...(arrayFilters.length ? { arrayFilters } : {}) }
  );
  if (inventoryUpdate.modifiedCount !== 1) {
    throw new OrderCreationError(`Insufficient stock for "${product.name}"`, 409);
  }

  const rawPrice = Number(product.discountPrice ?? product.price);
  if (!Number.isFinite(rawPrice) || rawPrice < 0) {
    throw new OrderCreationError('Product has an invalid price', 409);
  }
  const price = Math.round(rawPrice * 100) / 100;

  return {
    productId: new Types.ObjectId(productId),
    name: product.name,
    quantity,
    price,
    ...(selectedSize ? { size: selectedSize.size } : {}),
    ...(selectedColor ? { color: selectedColor.color } : {}),
  };
}

export function isReplicaSetRequired(error: unknown): boolean {
  const candidate = error as { code?: number; message?: string };
  const message = (candidate?.message || '').toLowerCase();
  return candidate?.code === 20 ||
    message.includes('transactions are only allowed') ||
    message.includes('does not support transactions') ||
    message.includes('replica set');
}

export async function createOrderTransaction(input: CheckoutOrderInput) {
  const connection = await connectDB();
  if (!connection) {
    throw new OrderCreationError('Database temporarily unavailable', 503);
  }
  if (!input.userId && (!Array.isArray(input.items) || input.items.length === 0)) {
    throw new OrderCreationError('Order must contain at least one item', 400);
  }

  const customerName = String(input.customerName || '').trim();
  const customerEmail = String(input.customerEmail || '').trim().toLowerCase();
  if (!input.userId && (!customerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))) {
    throw new OrderCreationError('Valid customer name and email are required', 400);
  }
  const shippingAddress = normalizeAddress(input.shippingAddress);
  const billingAddress = normalizeAddress(input.billingAddress ?? input.shippingAddress);
  const paymentMethod = String(input.paymentMethod || 'cash-on-delivery').trim();

  await initializeOrderNumberCounter();
  const session = await mongoose.startSession();
  let createdOrder: InstanceType<typeof Order> | null = null;
  try {
    await session.withTransaction(async () => {
      const user = input.userId ? await User.findById(input.userId).session(session) : null;
      if (input.userId && !user) {
        throw new OrderCreationError('Authenticated user not found', 401);
      }

      const cart = input.userId
        ? await Cart.findOne({ userId: input.userId }).session(session)
        : null;
      const checkoutItems = input.userId ? cart?.items : input.items;
      if (input.userId && (!cart || cart.items.length === 0)) {
        throw new OrderCreationError('Cart is empty', 400);
      }
      if (!Array.isArray(checkoutItems) || checkoutItems.length === 0) {
        throw new OrderCreationError('Order must contain at least one item', 400);
      }

      const resolvedName = input.userId
        ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
        : customerName;
      const resolvedEmail = input.userId ? user?.email.toLowerCase() : customerEmail;
      if (!resolvedName || !resolvedEmail) {
        throw new OrderCreationError('Customer name and email are required', 400);
      }

      const orderItems = [];
      for (const item of checkoutItems) {
        orderItems.push(await reserveInventory(item, session));
      }

      const totalPrice =
        orderItems.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;
      const orderNumber = await incrementOrderNumberCounter(session);

      const [order] = await Order.create(
        [{
          userId: input.userId,
          orderNumber,
          customerName: resolvedName,
          customerEmail: resolvedEmail,
          customerPhone: String(input.customerPhone || '').trim(),
          items: orderItems,
          totalPrice,
          shippingAddress,
          billingAddress,
          paymentMethod,
          paymentStatus: 'pending',
          inventoryReserved: true,
          orderStatus: 'pending',
        }],
        { session }
      );
      createdOrder = order;

      if (input.userId) {
        await Cart.deleteOne({ userId: input.userId }).session(session);
      }
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } catch (error) {
    if (isReplicaSetRequired(error)) {
      throw new OrderCreationError(
        'MongoDB transactions require a replica set. Configure a local single-node replica set or use MongoDB Atlas.',
        503
      );
    }
    throw error;
  } finally {
    await session.endSession();
  }

  if (!createdOrder) {
    throw new OrderCreationError('Order could not be created', 500);
  }
  return createdOrder;
}
