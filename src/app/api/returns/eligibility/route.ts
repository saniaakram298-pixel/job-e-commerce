import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { createErrorResponse, createSuccessResponse, getAuthToken, getUserIdFromToken } from '@/lib/response';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    const userId = token ? getUserIdFromToken(token) : null;

    await connectDB();
    let requestingUser: any = null;
    if (userId) {
      requestingUser = await User.findById(userId);
      if (!requestingUser) {
        return createErrorResponse('User not found', 401);
      }
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const email = searchParams.get('email')?.trim().toLowerCase() || '';
    if (!orderId) {
      return createErrorResponse('Order ID is required', 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    const matchesUser = Boolean(
      (userId && String(order.userId || '') === String(userId)) ||
      (requestingUser?.email && String(order.customerEmail || '').toLowerCase() === String(requestingUser.email).toLowerCase()) ||
      (email && String(order.customerEmail || '').toLowerCase() === email)
    );
    if (!matchesUser) {
      return createErrorResponse('You are not authorized to access this order.', 403);
    }

    const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : order.updatedAt ? new Date(order.updatedAt) : null;
    const expiresAt = deliveredAt ? new Date(deliveredAt) : null;
    if (expiresAt) {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    const now = new Date();
    const eligible = order.orderStatus === 'delivered' && expiresAt && now <= expiresAt;

    return createSuccessResponse({
      eligible,
      orderStatus: order.orderStatus,
      deliveredAt: deliveredAt?.toISOString() || null,
      expiresAt: expiresAt?.toISOString() || null,
      message: eligible
        ? 'This order is eligible for return.'
        : order.orderStatus !== 'delivered'
          ? 'Returns are only available for delivered orders.'
          : 'This order cannot be returned because the 7 days return period has expired.',
    }, 'Return eligibility checked successfully');
  } catch (error: any) {
    console.error('Return eligibility error:', error);
    return createErrorResponse(error.message || 'Unable to check return eligibility', 500);
  }
}
