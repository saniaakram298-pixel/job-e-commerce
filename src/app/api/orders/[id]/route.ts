import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

// Pehle se mojood GET function...
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const order = await Order.findById(params.id);
    if (!order) return createErrorResponse('Order not found', 404);
    return createSuccessResponse(order, 'Order fetched successfully');
  } catch (error) {
    return createErrorResponse('Internal server error', 500);
  }
}

// Yahan PATCH function add karo:
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await request.json(); // Ismein 'orderStatus' hoga
    
    const updatedOrder = await Order.findByIdAndUpdate(
      params.id,
      { $set: { orderStatus: body.orderStatus } },
      { new: true }
    );

    if (!updatedOrder) {
      return createErrorResponse('Order not found', 404);
    }

    return createSuccessResponse(updatedOrder, 'Order status updated successfully');
  } catch (error) {
    console.error('Patch order error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}