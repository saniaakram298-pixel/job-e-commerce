import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Review, syncProductReviewStats } from '@/models/Review';
import { createErrorResponse, createSuccessResponse, getAuthToken, getUserIdFromToken } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return createErrorResponse('Invalid authentication token', 401);
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status || '').trim();

    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return createErrorResponse('Invalid status', 400);
    }

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { status, adminResponse: body.adminResponse || undefined },
      { new: true }
    );

    if (!updatedReview) {
      return createErrorResponse('Review not found', 404);
    }

    await syncProductReviewStats(updatedReview.productId as string);

    return createSuccessResponse(updatedReview, 'Review updated successfully');
  } catch (error) {
    console.error('Admin review update error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
