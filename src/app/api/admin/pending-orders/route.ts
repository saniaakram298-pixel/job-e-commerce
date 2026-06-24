import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { getAuthToken, getUserIdFromToken } from '@/lib/response';
import { User } from '@/models/User';
import { sendOrderConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    // Verify admin access
    const requestingUser = await User.findById(userId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 48);
    const orders = await Order.find({
      orderStatus: { $in: ['pending', 'processing'] },
      createdAt: { $lt: cutoff },
    })
      .sort({ createdAt: 1 })
      .lean();

    const data = orders.map((order) => ({
      ...order,
      _id: order._id?.toString?.() ?? order._id,
      createdAt: order.createdAt?.toISOString?.() ?? order.createdAt,
      updatedAt: order.updatedAt?.toISOString?.() ?? order.updatedAt,
      followUpNotes: order.followUpNotes?.map((note: { message: string; timestamp?: Date | string; sentBy?: string }) => ({
        ...note,
        timestamp: note.timestamp?.toString?.() ?? new Date().toISOString(),
      })) ?? [],
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[admin/pending-orders] GET error:', error);
    return NextResponse.json({ success: false, error: 'Unable to load pending orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    // Verify admin access
    const requestingUser = await User.findById(userId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, message, sentBy } = body ?? {};

    if (!orderId || !message) {
      return NextResponse.json({ success: false, error: 'Missing orderId or message' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (!order.followUpNotes) {
      order.followUpNotes = [];
    }

    order.followUpNotes.push({
      message,
      timestamp: new Date(),
      sentBy: sentBy || 'admin',
    });

    await order.save();

    if (!order.customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Customer email not available for this order' },
        { status: 400 }
      );
    }

    try {
      await sendOrderConfirmationEmail({
        to: order.customerEmail,
        subject: `Reminder: Follow-up on order #${order.orderNumber ?? order._id}`,
        text: message,
        html: `<div style="font-family: Arial, sans-serif; line-height:1.5;">${message
          .split('\n')
          .map((line: string) => `<p>${line}</p>`)
          .join('')}</div>`,
      });
    } catch (emailError) {
      console.error('[admin/pending-orders] Email send failed:', emailError);
      return NextResponse.json({ success: false, error: 'Failed to send reminder email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { orderId: order._id?.toString?.(), followUpNotes: order.followUpNotes } });
  } catch (error) {
    console.error('[admin/pending-orders] POST error:', error);
    return NextResponse.json({ success: false, error: 'Unable to add follow-up note' }, { status: 500 });
  }
}
