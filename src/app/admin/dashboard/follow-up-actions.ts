'use server';

import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';

export async function sendFollowUpReminder(orderId: string, reminderMessage: string, adminName: string = 'admin') {
  try {
    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.followUpNotes) {
      order.followUpNotes = [];
    }

    order.followUpNotes.push({
      message: reminderMessage,
      timestamp: new Date(),
      sentBy: adminName,
    });

    await order.save();

    revalidatePath('/admin/dashboard');

    return {
      success: true,
      message: 'Reminder sent successfully',
      followUpNotes: order.followUpNotes,
    };
  } catch (error: any) {
    console.error('[sendFollowUpReminder] error:', error);
    throw new Error(error?.message || 'Failed to send reminder');
  }
}
