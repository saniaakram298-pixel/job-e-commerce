import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Review, syncProductReviewStats } from '@/models/Review';
import { createErrorResponse, createSuccessResponse, getAuthToken } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    await connectDB();
    const { id } = await params;

    const review = await Review.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );

    if (!review) {
      return createErrorResponse('Review not found', 404);
    }

    await syncProductReviewStats(review.productId as string);

    return createSuccessResponse(review, 'Review approved successfully');
  } catch (error) {
    console.error('Review approval error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
