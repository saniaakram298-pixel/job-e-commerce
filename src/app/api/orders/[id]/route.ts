import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const order = await Order.findById(params.id);
    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    return createSuccessResponse(order, 'Order fetched successfully');
  } catch (error) {
    console.error('Get order error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
