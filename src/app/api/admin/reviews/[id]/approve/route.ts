import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { createErrorResponse, createSuccessResponse, getAuthToken, getUserIdFromToken } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    await connectDB();

    const reviewId = params.id;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { approved: true },
      { new: true }
    );

    if (!review) {
      return createErrorResponse('Review not found', 404);
    }

    return createSuccessResponse(review, 'Review approved successfully');
  } catch (error) {
    console.error('Review approval error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
