import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
export const dynamic = 'force-dynamic';

/**
 * GET /api/products/new-arrivals
 * Fetches 8 most recently added products (regardless of category)
 * Query params:
 * - limit: number of products to return (default: 8)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');

    const newArrivals = await Product.find({ active: true })
      .select('name description price discountPrice images category tags rating featured createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);

    return createSuccessResponse({
      products: newArrivals,
      total: newArrivals.length,
    });
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    return createErrorResponse('Failed to fetch new arrivals', 500);
  }
}
