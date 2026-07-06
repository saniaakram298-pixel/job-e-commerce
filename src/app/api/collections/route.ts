import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Collection } from '@/models/Collection';

export const dynamic = 'force-dynamic';

function normalizeCategory(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = normalizeCategory(searchParams.get('category'));
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '100');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (category) {
      query.category = category;
    }

    const [collections, total] = await Promise.all([
      Collection.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Collection.countDocuments(query),
    ]);

    const normalizedCollections = (collections || []).map((item: any) => ({
      _id: String(item._id),
      title: item.title || 'Untitled product',
      description: item.description || '',
      price: Number(item.price || 0),
      discountPrice: item.discountPrice != null ? Number(item.discountPrice) : undefined,
      collection: item.collection || 'new-arrival',
      category: item.category || '',
      img: item.img || '',
      images: Array.isArray(item.images) ? item.images : [],
      tags: Array.isArray(item.tags) ? item.tags : [],
      stock: Number(item.stock || 0),
      sizes: Array.isArray(item.sizes) ? item.sizes : [],
      colors: Array.isArray(item.colors) ? item.colors : [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      collections: normalizedCollections,
      categories: Array.from(new Set((normalizedCollections as any[]).map((item) => item.category).filter(Boolean))),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / Math.max(limit, 1)),
      },
    });
  } catch (error: any) {
    console.error('[api/collections] GET error:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const normalizedCategory = normalizeCategory(String(body.category || 'general'));
    const productData = {
      title: body.title,
      description: body.description || '',
      price: Number(body.price || 0),
      discountPrice: body.discountPrice != null ? Number(body.discountPrice) : undefined,
      category: normalizedCategory || 'general',
      collection: body.collection || 'new-arrival',
      img: body.img || '',
      images: Array.isArray(body.images) ? body.images : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      stock: Number(body.stock || 0),
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      colors: Array.isArray(body.colors) ? body.colors : [],
    };

    const newItem = await Collection.create(productData);

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      ...newItem.toObject(),
    }, { status: 201 });
  } catch (error: any) {
    console.error('[api/collections] POST error:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create collection' },
      { status: 500 }
    );
  }
}
