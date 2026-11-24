import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Subscriber } from '@/models/Subscriber';
import { requireAdminUser } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authorization = await requireAdminUser(request);
    if (authorization.response) return authorization.response;

    await connectDB();
    const subs = await Subscriber.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(subs);
  } catch (error) {
    console.error('Admin get subscribers error', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
