import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Subscriber } from '@/models/Subscriber';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    await connectDB();

    const existing = await Subscriber.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ ok: true, message: 'Already subscribed' });
    }

    await Subscriber.create({ email });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Subscribe error', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
