/**
 * API Route: GET /api/products/subcategory/count
 * Returns the total number of products in a subcategory
 * Used for initializing lazy loading in the admin dashboard
 * NO TIMEOUTS - Let query complete naturally
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // NO CONNECTION TIMEOUT - Process query completely
    const connection = await connectDB();
    if (!connection) {
      return createErrorResponse('Database unavailable', 503);
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');

    // Validate required parameters
    if (!category || !subcategory) {
      return createErrorResponse('Missing category or subcategory parameter', 400);
    }

    // Build query for counting - NO TIMEOUT
    const query: any = {
      active: true,
      category: { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      subcategory: { $regex: new RegExp(`^${subcategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    };

    // Count documents - NO TIMEOUT
    const total = await Product.countDocuments(query);

    return createSuccessResponse(
      {
        data: {
          category,
          subcategory,
          total,
        },
      },
      'Product count retrieved successfully'
    );
  } catch (error) {
    console.error('Get subcategory count error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}
