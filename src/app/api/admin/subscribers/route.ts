import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Subscriber } from '@/models/Subscriber';

export async function GET() {
  try {
    await connectDB();
    const subs = await Subscriber.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(subs);
  } catch (error) {
    console.error('Admin get subscribers error', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
