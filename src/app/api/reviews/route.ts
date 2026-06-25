import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Review } from '@/models/Review';

export async function GET() {
  try {
    await connectDB();
    const reviews = await Review.find({ approved: true }).sort({ createdAt: -1 }).limit(20).lean();
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Get reviews error', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const message = String(body.message || '').trim();
    const rating = Number(body.rating || 5);

    if (!name || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await connectDB();
    const created = await Review.create({ name, message, rating, productId: body.productId || null });
    return NextResponse.json({ ok: true, review: created });
  } catch (error) {
    console.error('Post review error', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
