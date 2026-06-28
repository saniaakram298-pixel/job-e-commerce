import { NextRequest, NextResponse } from 'next/server';
import { createGuestOrderResponse } from '@/lib/orderActions';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return createGuestOrderResponse(body);
  } catch (error: any) {
    console.error('[guest-orders] Create order failed:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
