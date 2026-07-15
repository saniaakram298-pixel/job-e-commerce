import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { getTotalStock } from '@/lib/productStock';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const offset = parseInt(searchParams.get('offset') || String((page - 1) * limit), 10);
    const category = searchParams.get('category');
    const collection = searchParams.get('collection');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = { active: true, isTrending: true };
    if (category) query.category = category;
    if (collection) query.collection = collection;
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { collection: { $regex: searchRegex } },
        { category: { $regex: searchRegex } },
      ];
    }

    const products = await Product.find(query)
      .select('name description price discountPrice images img category collection stock sizes colors featured isBestSeller isTrending active createdAt updatedAt')
      .skip(Math.max(0, offset))
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Product.countDocuments(query);

    const serializedProducts = (products || []).map((product: any) => ({
      _id: product._id?.toString?.() ?? String(product._id),
      title: product.name || product.title || 'Untitled product',
      name: product.name || product.title || 'Untitled product',
      price: Number(product.price || 0),
      discountPrice: product.discountPrice != null ? Number(product.discountPrice) : undefined,
      img: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.img || '',
      images: Array.isArray(product.images) ? product.images : [],
      category: product.category || '',
      collection: product.collection || '',
      stock: getTotalStock(product),
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
      trending: Boolean(product.isTrending),
      active: product.active !== false,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return createSuccessResponse(
      {
        products: serializedProducts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      'Trending products fetched successfully'
    );
  } catch (error) {
    console.error('Get trending products error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
