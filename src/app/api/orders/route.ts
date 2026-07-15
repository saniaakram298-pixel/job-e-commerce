import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Cart } from '@/models/Cart';
import { Product } from '@/models/Product';
import { User } from '@/models/User';
import { createErrorResponse, createSuccessResponse, getAuthToken, getUserIdFromToken } from '@/lib/response';
import { sendOrderConfirmationEmail } from '@/lib/email';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return createErrorResponse('Invalid token', 401);
    }

    try {
      await connectDB();
    } catch (connErr: any) {
      console.error('Get orders - DB connect failed:', connErr?.message || connErr);
      return createErrorResponse('Database temporarily unavailable', 503);
    }

    // If the requester is an admin, return all orders; otherwise return user's orders
    const requestingUser = await User.findById(userId);
    if (!requestingUser) {
      return createErrorResponse('User not found', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (requestingUser.role !== 'admin') {
      query.userId = userId;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    const productIds = Array.from(
      new Set(
        (orders as Array<Record<string, any>>)
          .flatMap((order: Record<string, any>) => order.items || [])
          .map((item: Record<string, any>) => {
            const productRef = item?.productId;
            if (productRef && typeof productRef === 'object' && !Array.isArray(productRef)) {
              const objectIdValue = (productRef as Record<string, any>)._id || (productRef as Record<string, any>).id;
              return objectIdValue ? String(objectIdValue) : null;
            }
            return productRef ? String(productRef) : null;
          })
          .filter(Boolean)
      )
    );

    const productLookup = new Map<string, Record<string, any>>();
    if (productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } })
        .select('name images img')
        .lean();

      for (const product of products as Array<Record<string, any>>) {
        productLookup.set(String(product._id), product);
      }
    }

    for (const order of orders as Array<Record<string, any>>) {
      for (const item of order.items || []) {
        const productRef = item.productId;
        const hasProductDetails = productRef && typeof productRef === 'object' && !Array.isArray(productRef) && ('img' in productRef || 'images' in productRef);

        if (!hasProductDetails && productRef) {
          const productId = typeof productRef === 'object' && !Array.isArray(productRef)
            ? String((productRef as Record<string, any>)._id || (productRef as Record<string, any>).id || '')
            : String(productRef);

          if (productId) {
            const product = productLookup.get(productId);
            if (product) {
              item.productId = product;
            }
          }
        }
      }
    }

    return createSuccessResponse(
      {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      'Orders fetched successfully'
    );
  } catch (error) {
    console.error('Get orders error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    const body = await request.json();

    // Guest checkout path: allow creating an order without auth when body.type === 'guest'
    if (!token && body && body.type === 'guest') {
      await connectDB();

      const { shippingAddress, billingAddress, paymentMethod, items } = body;
      const customerObj = body.customer || {};
      const customerEmail = body.customerEmail || customerObj.email || body.email;
      const customerName = body.customerName || (customerObj.firstName || '') + (customerObj.lastName ? ' ' + customerObj.lastName : '') || undefined;
      const totalPrice = body.totalPrice || body.total || 0;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return createErrorResponse('No items provided for guest order', 400);
      }

      // Validate and decrement stock similar to guest-orders route
      for (const item of items as Array<Record<string, any>>) {
        const productId = String(item.productId || item.id || item._id || '');
        const quantity = Number(item.quantity || item.qty || 1);
        const size = item.size;
        const color = item.color;

        if (!productId || !quantity || quantity <= 0) {
          return createErrorResponse(`Invalid item details in order: productId=${productId}, quantity=${quantity}`, 400);
        }

        // If size provided
        if (size) {
          const normalizedSize = (size || '').trim();
          const updatedProduct = await Product.findOneAndUpdate(
            { _id: productId, 'sizes.size': new RegExp(`^${normalizedSize}$`, 'i'), 'sizes.stock': { $gte: quantity } },
            { $inc: { 'sizes.$.stock': -quantity } },
            { new: true }
          );
          if (!updatedProduct) {
            return createErrorResponse(`Product "${item.name || productId}" with size "${size}" is out of stock or not found`, 400);
          }
        } else if (color) {
          const normalizedColor = (color || '').trim();
          const updatedProduct = await Product.findOneAndUpdate(
            { _id: productId, 'colors.color': new RegExp(`^${normalizedColor}$`, 'i'), 'colors.stock': { $gte: quantity } },
            { $inc: { 'colors.$.stock': -quantity } },
            { new: true }
          );
          if (!updatedProduct) {
            return createErrorResponse(`Product "${item.name || productId}" with color "${color}" is out of stock or not found`, 400);
          }
        } else {
          const product = await Product.findById(productId);
          if (!product) {
            return createErrorResponse(`Product "${item.name || productId}" not found in database`, 400);
          }
        }
      }

      const lastOrder = await Order.findOne({ orderNumber: { $exists: true } }).sort({ orderNumber: -1 }).select('orderNumber');
      const nextOrderNumber = lastOrder?.orderNumber ? lastOrder.orderNumber + 1 : 1;

      const order = new Order({
        userId: undefined,
        orderNumber: nextOrderNumber,
        items,
        totalPrice: totalPrice || 0,
        shippingAddress,
        billingAddress,
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        customerEmail: customerEmail || undefined,
        customerName: customerName || undefined,
      });

      await order.save();

      try {
        await sendOrderConfirmationEmail({
          to: customerEmail,
          subject: 'Your Atelier Order Confirmation',
          text: `Thank you for your order, ${customerName || ''}! Order total: $${(totalPrice || 0).toFixed ? (totalPrice || 0).toFixed(2) : totalPrice}`,
          html: `<div><h2>Thank you for your order${customerName ? ', ' + customerName : ''}!</h2><p>Order total: <strong>$${(totalPrice || 0).toFixed ? (totalPrice || 0).toFixed(2) : totalPrice}</strong></p></div>`,
        });
      } catch (emailErr) {
        console.warn('Guest order email failed:', emailErr);
      }

      return NextResponse.json({ success: true, message: 'Order created successfully', data: order, orderId: order._id }, { status: 201 });
    }

    // Authenticated user flow
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return createErrorResponse('Invalid token', 401);
    }

    const { shippingAddress, billingAddress, paymentMethod } = body;

    await connectDB();

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return createErrorResponse('Cart is empty', 400);
    }

    for (const item of cart.items as Array<Record<string, any>>) {
      const productId = String(item.productId || item.id || item._id || '');
      const quantity = Number(item.quantity) || 0;
      const size = item.size;
      const color = item.color;

      if (!productId || !quantity || quantity <= 0) {
        return createErrorResponse('Invalid cart item', 400);
      }

      if (size) {
        const normalizedSize = String(size).trim();
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: productId,
            'sizes.size': new RegExp(`^${normalizedSize}$`, 'i'),
            'sizes.stock': { $gte: quantity },
          },
          {
            $inc: { 'sizes.$.stock': -quantity },
          },
          { new: true }
        );

        if (!updatedProduct) {
          return createErrorResponse(`Product "${item.name || productId}" with size "${size}" is out of stock`, 400);
        }
      } else if (color) {
        const normalizedColor = String(color).trim();
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: productId,
            'colors.color': new RegExp(`^${normalizedColor}$`, 'i'),
            'colors.stock': { $gte: quantity },
          },
          {
            $inc: { 'colors.$.stock': -quantity },
          },
          { new: true }
        );

        if (!updatedProduct) {
          return createErrorResponse(`Product "${item.name || productId}" with color "${color}" is out of stock`, 400);
        }
      } else {
        const product = await Product.findById(productId);
        if (!product) {
          return createErrorResponse(`Product "${item.name || productId}" not found`, 400);
        }
      }
    }

    const lastOrder = await Order.findOne({ orderNumber: { $exists: true } }).sort({ orderNumber: -1 }).select('orderNumber');
    const nextOrderNumber = lastOrder?.orderNumber ? lastOrder.orderNumber + 1 : 1;

    const order = new Order({
      userId,
      orderNumber: nextOrderNumber,
      items: cart.items,
      totalPrice: cart.totalPrice,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
    });

    await order.save();

    await Cart.deleteOne({ userId });

    return NextResponse.json({ success: true, message: 'Order created successfully', data: order, orderId: order._id }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
