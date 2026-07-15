import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { createErrorResponse, createSuccessResponse, getAuthToken } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    await connectDB();
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    const normalizedReviews = (reviews || []).map((review: any) => ({
      ...review,
      _id: review._id?.toString?.() ?? String(review._id),
      name: review.userName || review.name || 'Anonymous',
      email: review.userEmail || review.email || '',
      message: review.comment || review.message || '',
      approved: review.status === 'approved' || review.approved === true,
      status: review.status || (review.approved ? 'approved' : 'pending'),
    }));
    return createSuccessResponse(normalizedReviews, 'Reviews retrieved successfully');
  } catch (error) {
    console.error('Admin get reviews error', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
