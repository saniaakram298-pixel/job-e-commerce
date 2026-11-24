import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { isReplicaSetRequired } from '@/lib/orderTransactions';
import { createErrorResponse, createSuccessResponse, requireAdminUser, requireAuthenticatedUser } from '@/lib/response';

export const dynamic = 'force-dynamic';

// Pehle se mojood GET function...
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authorization = await requireAuthenticatedUser(request);
    if (authorization.response || !authorization.user) {
      return authorization.response || createErrorResponse('Unauthorized', 401);
    }

    await connectDB();
    const order = await Order.findById(params.id).populate({ path: 'items.productId', select: 'name images img' }).lean();
    if (!order) return createErrorResponse('Order not found', 404);
    if (
      authorization.user.role !== 'admin' &&
      String(order.userId) !== String(authorization.user._id)
    ) {
      return createErrorResponse('Order access denied', 403);
    }

    for (const item of (order as any).items || []) {
      const productRef = item.productId;
      const hasProductDetails = productRef && typeof productRef === 'object' && ('img' in productRef || 'images' in productRef);
      if (!hasProductDetails && productRef) {
        const product = await Product.findById(productRef).select('name images img').lean();
        if (product) {
          item.productId = product;
        }
      }
    }

    return createSuccessResponse(order, 'Order fetched successfully');
  } catch {
    return createErrorResponse('Internal server error', 500);
  }
}

// Yahan PATCH function add karo:
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authorization = await requireAdminUser(request);
    if (authorization.response) return authorization.response;

    await connectDB();
    const body = await request.json();
    const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (body.orderStatus && !allowed.includes(body.orderStatus)) {
      return createErrorResponse('Invalid orderStatus value', 400);
    }

    const session = await mongoose.startSession();
    let updatedOrder = null;
    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(params.id).session(session);
        if (!order) throw new Error('ORDER_NOT_FOUND');

        if (body.orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
          for (const item of order.items || []) {
            const productId = item.productId;
            const quantity = Number(item.quantity);
            if (!productId || !Number.isSafeInteger(quantity) || quantity <= 0) {
              throw new Error('INVALID_RESERVED_ORDER_ITEM');
            }

            const increments: Record<string, number> = {};
            const arrayFilters: Record<string, unknown>[] = [];
            const conditions: Record<string, unknown>[] = [];
            if (item.size) {
              const escapedSize = String(item.size).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const sizeRegex = new RegExp(`^${escapedSize}$`, 'i');
              conditions.push({ sizes: { $elemMatch: { size: sizeRegex } } });
              arrayFilters.push({ 'sizeVariant.size': sizeRegex });
              increments['sizes.$[sizeVariant].stock'] = quantity;
            }
            if (item.color && (order.inventoryReserved || !item.size)) {
              const escapedColor = String(item.color).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const colorRegex = new RegExp(`^${escapedColor}$`, 'i');
              conditions.push({ colors: { $elemMatch: { color: colorRegex } } });
              arrayFilters.push({ 'colorVariant.color': colorRegex });
              increments['colors.$[colorVariant].stock'] = quantity;
            }
            if (!item.size && !item.color && order.inventoryReserved) {
              conditions.push({ stock: { $exists: true } });
              increments.stock = quantity;
            }

            const result = await Product.updateOne(
              { _id: productId, $and: conditions },
              { $inc: increments },
              { session, ...(arrayFilters.length ? { arrayFilters } : {}) }
            );
            if (result.modifiedCount !== 1) throw new Error('RESERVED_INVENTORY_NOT_FOUND');
          }
          order.inventoryReserved = false;
        }

        if (body.orderStatus) order.orderStatus = body.orderStatus;

        if (Array.isArray(body.items)) {
          for (const update of body.items) {
            let idx = -1;
            if (typeof update.index === 'number' && update.index >= 0 && update.index < order.items.length) {
              idx = update.index;
            } else if (update.productId) {
              idx = order.items.findIndex((item) => String(item.productId) === String(update.productId));
            }
            if (idx === -1) continue;
            if (typeof update.size === 'string') order.items[idx].size = update.size;
            if (typeof update.color === 'string') order.items[idx].color = update.color;
          }
        }

        await order.save({ session });
        updatedOrder = order;
      });
    } finally {
      await session.endSession();
    }

    if (!updatedOrder) return createErrorResponse('Order not found', 404);
    return createSuccessResponse(updatedOrder, 'Order updated successfully');
  } catch (error) {
    console.error('Patch order error:', error);
    if (isReplicaSetRequired(error)) {
      return createErrorResponse('MongoDB transactions require a replica set. Use MongoDB Atlas or configure a local replica set.', 503);
    }
    if (error instanceof Error && error.message === 'ORDER_NOT_FOUND') {
      return createErrorResponse('Order not found', 404);
    }
    if (error instanceof Error && error.message === 'RESERVED_INVENTORY_NOT_FOUND') {
      return createErrorResponse('Could not restore reserved inventory', 409);
    }
    return createErrorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authorization = await requireAdminUser(request);
    if (authorization.response) return authorization.response;

    await connectDB();

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await Order.findById(params.id).session(session);
      if (!order) {
        await session.abortTransaction();
        session.endSession();
        return createErrorResponse('Order not found', 404);
      }

      // Remove the order (follow-up notes are embedded so removing order removes them)
      await Order.deleteOne({ _id: params.id }).session(session);

      // If there were a separate FollowUps collection, we'd remove linked entries here.

      await session.commitTransaction();
      session.endSession();
      return createSuccessResponse({ orderId: params.id }, 'Order deleted successfully');
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error('Delete order transaction error:', err);
      return createErrorResponse('Failed to delete order', 500);
    }
  } catch (error) {
    console.error('Delete order error:', error);
    if (isReplicaSetRequired(error)) {
      return createErrorResponse('MongoDB transactions require a replica set. Use MongoDB Atlas or configure a local replica set.', 503);
    }
    return createErrorResponse('Internal server error', 500);
  }
}