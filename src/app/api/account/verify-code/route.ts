import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { VerificationCode } from '@/models/VerificationCode';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const code = String(body?.code || '').trim();

    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return createErrorResponse('A valid email is required.', 400);
    }

    if (!/^[0-9]{4}$/.test(code)) {
      return createErrorResponse('A valid 4-digit code is required.', 400);
    }

    await connectDB();

    const verification = await VerificationCode.findOne({ email, code, used: false }).sort({ createdAt: -1 });
    if (!verification) {
      return createErrorResponse('Invalid or expired verification code.', 401);
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      return createErrorResponse('Verification code has expired.', 401);
    }

    verification.used = true;
    await verification.save();

    const user = await User.findOne({ email });
    const query: any = { $or: [{ customerEmail: email }] };
    if (user) {
      query.$or.push({ userId: String(user._id) });
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .select('orderNumber totalPrice paymentStatus orderStatus createdAt items')
      .populate({ path: 'items.productId', select: 'img images' })
      .lean();

    for (const order of orders as Array<Record<string, any>>) {
      for (const item of order.items || []) {
        const productRef = item.productId;
        const hasProductDetails = productRef && typeof productRef === 'object' && ('img' in productRef || 'images' in productRef);

        if (!hasProductDetails && productRef) {
          const product = await Product.findById(productRef).select('img images').lean();
          if (product) {
            item.productId = product;
          }
        }
      }
    }

    return createSuccessResponse({ orders }, 'Email verified, orders loaded successfully.');
  } catch (error) {
    console.error('Verify account code error:', error);
    return createErrorResponse('Unable to verify the code.', 500);
  }
}
