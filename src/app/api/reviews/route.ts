import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Review, syncProductReviewStats } from '@/models/Review';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse, getAuthToken, getUserIdFromToken } from '@/lib/response';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const status = searchParams.get('status') || 'approved';
    const limit = Number(searchParams.get('limit') || '20');
    const page = Number(searchParams.get('page') || '1');
    const skip = Math.max(0, (page - 1) * limit);

    const filter: any = {};
    if (productId) {
      filter.productId = productId;
    }
    if (status) {
      filter.status = status;
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: reviews, count: reviews.length });
  } catch (error) {
    console.error('Get reviews error', error);
    return createErrorResponse('Server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return createErrorResponse('Authentication required', 401);
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return createErrorResponse('Invalid authentication token', 401);
    }

    const body = await request.json();
    const productId = String(body.productId || '').trim();
    const userName = String(body.userName || '').trim();
    const userEmail = String(body.userEmail || '').trim();
    const comment = String(body.comment || '').trim();
    const rating = Number(body.rating || 0);
    const images = Array.isArray(body.images) ? body.images.filter((img: unknown) => typeof img === 'string' && img.trim()) : [];

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return createErrorResponse('Invalid product ID', 400);
    }

    if (!userName || !comment || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return createErrorResponse('Please provide a valid name, rating, and comment', 400);
    }

    await connectDB();

    const product = await Product.findById(productId).lean();
    if (!product) {
      return createErrorResponse('Product not found', 404);
    }

    const existingReview = await Review.findOne({ productId, userId, status: { $in: ['pending', 'approved'] } });
    if (existingReview) {
      return createErrorResponse('You have already submitted a review for this product', 409);
    }

    const createdReview = await Review.create({
      productId,
      userId,
      userName,
      userEmail: userEmail || undefined,
      rating,
      comment,
      images,
      status: 'pending',
    });

    await syncProductReviewStats(productId);

    return createSuccessResponse(
      {
        review: createdReview,
        message: 'Your review has been submitted and is waiting for admin approval.',
      },
      'Review submitted successfully'
    );
  } catch (error) {
    console.error('Post review error', error);
    return createErrorResponse('Server error', 500);
  }
}
