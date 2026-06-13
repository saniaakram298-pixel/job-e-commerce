import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
export const dynamic = 'force-dynamic';

/**
 * GET /api/products/featured
 * Fetches all featured products
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const featured = await Product.find({ featured: true, active: true })
      .select('name description price discountPrice images category tags rating featured')
      .sort({ createdAt: -1 });

    return createSuccessResponse({
      products: featured,
      total: featured.length,
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return createErrorResponse('Failed to fetch featured products', 500);
  }
}
