import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    const orders = await Order.find({ customerEmail: email.toLowerCase().trim() })
      .sort({ createdAt: -1 })
      .populate({ path: 'items.productId', select: 'name images img' })
      .lean();

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('[api/account/orders] GET error:', error.message || error);
    return NextResponse.json({ success: false, message: 'Unable to load orders' }, { status: 500 });
  }
}
