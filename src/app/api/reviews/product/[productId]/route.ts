import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return createErrorResponse('Invalid product ID', 400);
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || '1');
    const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit') || '10')));
    const skip = Math.max(0, (page - 1) * limit);

    const [reviews, total, product] = await Promise.all([
      Review.find({ productId, status: 'approved' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ productId, status: 'approved' }),
      Product.findById(productId).select('averageRating totalReviews').lean(),
    ]);

    const averageRating = Number(product?.averageRating ?? 0);
    const totalReviews = Number(product?.totalReviews ?? total);

    return createSuccessResponse(
      {
        reviews,
        averageRating,
        totalReviews,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      'Reviews fetched successfully'
    );
  } catch (error) {
    console.error('Get product reviews error', error);
    return createErrorResponse('Server error', 500);
  }
}
