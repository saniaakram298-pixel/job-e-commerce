import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Cart } from '@/models/Cart';
import { createErrorResponse, createSuccessResponse, getAuthToken, getUserIdFromToken } from '@/lib/response';
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

    await connectDB();

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    return createSuccessResponse(orders, 'Orders fetched successfully');
  } catch (error) {
    console.error('Get orders error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return createErrorResponse('Invalid token', 401);
    }

    const body = await request.json();
    const { shippingAddress, billingAddress, paymentMethod } = body;

    await connectDB();

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return createErrorResponse('Cart is empty', 400);
    }

    const order = new Order({
      userId,
      items: cart.items,
      totalPrice: cart.totalPrice,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
    });

    await order.save();

    // Clear cart
    await Cart.deleteOne({ userId });

    return createSuccessResponse(order, 'Order created successfully', 201);
  } catch (error) {
    console.error('Create order error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
