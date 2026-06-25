import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Review } from '@/models/Review';

export async function GET(req: Request) {
  try {
    await connectDB();
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Admin get reviews error', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
