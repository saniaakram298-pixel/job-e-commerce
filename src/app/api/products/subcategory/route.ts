/**
 * API Route: GET /api/products/subcategory
 * Fetches products for a specific subcategory with lazy loading support
 * NO TIMEOUTS - Processes all queries without time constraints
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { getTotalStock } from '@/lib/productStock';

export const dynamic = 'force-dynamic';

const getProductStock = (product: any) => getTotalStock(product);

export async function GET(request: NextRequest) {
  try {
    // NO CONNECTION TIMEOUT - Let query complete as needed
    const connection = await connectDB();
    if (!connection) {
      return createErrorResponse('Database unavailable', 503);
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const sort = searchParams.get('sort') || 'newest';

    // Validate required parameters
    if (!category || !subcategory) {
      return createErrorResponse('Missing category or subcategory parameter', 400);
    }

    const skip = (page - 1) * limit;

    // Build query without any timeout constraints
    const query: any = {
      active: true,
      category: { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      subcategory: { $regex: new RegExp(`^${subcategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    };

    // Build sort object
    let sortObj: any = { createdAt: -1 }; // Default newest first
    switch (sort) {
      case 'price-low':
        sortObj = { price: 1 };
        break;
      case 'price-high':
        sortObj = { price: -1 };
        break;
      case 'trending':
        sortObj = { rating: -1, createdAt: -1 };
        break;
      case 'best-seller':
        sortObj = { isBestSeller: -1, createdAt: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    // Execute queries - NO TIMEOUTS
    const [products, total] = await Promise.all([
      Product.find(query)
        .select(
          'name description price discountPrice images img category subcategory collection stock sizes colors featured isBestSeller isTrending active createdAt updatedAt'
        )
        .skip(skip)
        .limit(limit)
        .sort(sortObj)
        .lean(),
      Product.countDocuments(query),
    ]);

    // Serialize products
    const serializedProducts = (products || []).map((product: any) => ({
      _id: product._id?.toString?.() ?? String(product._id),
      title: product.name || product.title || 'Untitled product',
      name: product.name || product.title || 'Untitled product',
      price: Number(product.price || 0),
      discountPrice: product.discountPrice != null ? Number(product.discountPrice) : undefined,
      img: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.img || '',
      images: Array.isArray(product.images) ? product.images : [],
      category: product.category || '',
      subcategory: product.subcategory || '',
      collection: product.collection || '',
      stock: getProductStock(product),
      sizes: Array.isArray(product.sizes)
        ? product.sizes.map((size: any) => ({ size: size.size, stock: size.stock }))
        : [],
      colors: Array.isArray(product.colors)
        ? product.colors.map((color: any) => ({ color: color.color, stock: color.stock }))
        : [],
      description: product.description || '',
      featured: Boolean(product.featured),
      isBestSeller: Boolean(product.isBestSeller),
      isTrending: Boolean(product.isTrending),
      active: product.active !== false,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return createSuccessResponse(
      {
        data: {
          category,
          subcategory,
          products: serializedProducts,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      },
      'Products fetched successfully'
    );
  } catch (error) {
    console.error('Get subcategory products error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}
