import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { IProduct, Product } from '@/models/Product';
import { User } from '@/models/User';
import {
  createErrorResponse,
  createSuccessResponse,
  getAuthToken,
  getUserIdFromToken,
} from '@/lib/response';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { buildGuestOrderPayload } from '@/lib/orderPayloads';
import { createOrderTransaction, OrderCreationError } from '@/lib/orderTransactions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) return createErrorResponse('Unauthorized', 401);

    const userId = getUserIdFromToken(token);
    if (!userId) return createErrorResponse('Invalid token', 401);

    const connection = await connectDB();
    if (!connection) return createErrorResponse('Database temporarily unavailable', 503);

    const requestingUser = await User.findById(userId);
    if (!requestingUser) return createErrorResponse('User not found', 401);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};
    if (requestingUser.role !== 'admin') query.userId = userId;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    const productIds = Array.from(new Set(
      orders.flatMap((order) => order.items.map((item) => String(item.productId))).filter(Boolean)
    ));

    const productLookup = new Map<string, Pick<IProduct, '_id' | 'name' | 'images' | 'img'>>();
    if (productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } }).select('name images img').lean();
      for (const product of products) productLookup.set(String(product._id), product);
    }

    const ordersWithProducts = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        productId: productLookup.get(String(item.productId)) ?? item.productId,
      })),
    }));

    return createSuccessResponse({
      orders: ordersWithProducts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }, 'Orders fetched successfully');
  } catch (error) {
    console.error('Get orders error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = getAuthToken(request);

    if (!token && body?.type === 'guest') {
      const payload = buildGuestOrderPayload(body);
      const order = await createOrderTransaction({
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        customerPhone: payload.customerPhone,
        shippingAddress: payload.shippingAddress,
        billingAddress: payload.billingAddress,
        paymentMethod: payload.paymentMethod,
        items: payload.items,
      });

      try {
        await sendOrderConfirmationEmail({
          to: order.customerEmail!,
          subject: 'Your Atelier Order Confirmation',
          text: `Thank you for your order, ${order.customerName}! Order total: $${order.totalPrice.toFixed(2)}`,
          html: `<div><h2>Thank you for your order, ${order.customerName}!</h2><p>Order total: <strong>$${order.totalPrice.toFixed(2)}</strong></p></div>`,
        });
      } catch (emailError) {
        console.error('Guest order email failed:', emailError);
      }

      return NextResponse.json(
        { success: true, message: 'Order created successfully', data: order, orderId: order._id },
        { status: 201 }
      );
    }

    if (!token) return createErrorResponse('Unauthorized', 401);
    const userId = getUserIdFromToken(token);
    if (!userId) return createErrorResponse('Invalid token', 401);

    const order = await createOrderTransaction({
      userId,
      shippingAddress: body.shippingAddress,
      billingAddress: body.billingAddress ?? body.shippingAddress,
      paymentMethod: body.paymentMethod,
    });

    return NextResponse.json(
      { success: true, message: 'Order created successfully', data: order, orderId: order._id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof OrderCreationError) {
      return createErrorResponse(error.message, error.status);
    }
    console.error('Create order error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
