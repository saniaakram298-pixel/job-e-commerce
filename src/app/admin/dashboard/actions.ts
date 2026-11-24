'use server';

import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { getNextOrderNumber } from '@/lib/orderNumber';

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error('Invalid order status');
  }

  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  if (order.orderNumber == null) {
    order.orderNumber = await getNextOrderNumber();
  }

  order.orderStatus = newStatus as any;
  await order.save();

  revalidatePath('/admin/dashboard');

  return {
    success: true,
    orderId: order._id.toString(),
    orderStatus: order.orderStatus,
  };
}
