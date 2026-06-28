import { NextRequest } from 'next/server';
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

    // Get reviews from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const reviews = await Review.find({
      createdAt: { $gte: sevenDaysAgo },
    }).sort({ createdAt: -1 }).lean();

    return createSuccessResponse(reviews, 'Weekly reviews retrieved');
  } catch (error) {
    console.error('Weekly reviews error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
