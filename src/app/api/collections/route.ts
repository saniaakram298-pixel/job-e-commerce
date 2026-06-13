import { connectDB } from '@/lib/mongodb';
import { Collection } from '@/models/Collection';
import { Product } from '@/models/Product';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

function normalizeTags(tags: any): string[] {
  if (Array.isArray(tags)) return tags.filter(Boolean).map(String);
  if (typeof tags === 'string' && tags.trim()) return [tags.trim()];
  return [];
}

function normalizeSizes(sizes: any, stockFallback: number): Array<{ size: string; stock: number }> {
  if (!Array.isArray(sizes)) return [{ size: 'Free Size', stock: Number(stockFallback) || 0 }];
  return sizes
    .map((item: any) => ({ size: String(item?.size || '').trim(), stock: Number(item?.stock || 0) }))
    .filter(sizeItem => sizeItem.size);
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '12', 10)));
    const skip = (page - 1) * limit;

    const totalCount = await Collection.countDocuments();
    const collections = await Collection.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const sanitizedCollections = collections.map(item => ({
      ...item,
      _id: item._id?.toString?.() ?? item._id,
      productId: item.productId?.toString?.() ?? item.productId,
    }));

    return NextResponse.json(
      {
        collections: sanitizedCollections,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.max(1, Math.ceil(totalCount / limit)),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[api/collections] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections', details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const title = String(body.title || body.name || '').trim();
    const collection = String(body.collection || 'new-arrival').trim();
    const category = String(body.category || 'accessories').trim();
    const img = String(body.img || (Array.isArray(body.images) ? body.images[0] : '') || '').trim();
    const description = String(body.description || '').trim();
    const price = Number(body.price || 0);
    const tags = normalizeTags(body.tags && body.tags.length ? body.tags : [body.tag || collection]);
    const sizes = normalizeSizes(body.sizes, body.stock || 0);
    const stock = Number(body.stock ?? sizes.reduce((sum, item) => sum + item.stock, 0)) || 0;

    if (!title || !collection || !category || !img) {
      return NextResponse.json({ error: 'Missing required fields: title, collection, category, img' }, { status: 400 });
    }

    const newCollection = new Collection({
      title,
      collection,
      category,
      img,
      tags,
      sizes,
      stock,
      price,
      description,
    });

    const savedCollection = await newCollection.save();

    try {
      const productPayload = {
        name: title,
        description: description || title,
        price,
        collection,
        category,
        images: img ? [img] : [],
        materials: body.materials || [],
        sizes,
        colors: body.colors || [],
        tags: tags.length > 0 ? tags : [collection],
        rating: body.rating || 0,
        featured: body.featured || false,
        active: body.active !== undefined ? body.active : true,
      };

      const newProduct = new Product(productPayload);
      const savedProduct = await newProduct.save();
      (savedCollection as any).productId = savedProduct._id;
      await savedCollection.save();

      revalidatePath('/');
      revalidatePath('/products');
    } catch (mirrorError) {
      console.warn('Collection saved but product mirror failed:', mirrorError);
    }

    const plain = (savedCollection as any).toObject ? (savedCollection as any).toObject() : savedCollection;
    if (plain._id && typeof plain._id !== 'string') plain._id = String(plain._id);
    if (plain.productId && typeof plain.productId !== 'string') plain.productId = String(plain.productId);

    return NextResponse.json(plain, { status: 201 });
  } catch (error: any) {
    console.error('Final Error Handler:', error);
    return NextResponse.json({
      error: 'Failed to create collection',
      details: error.message,
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    let id: string | null | undefined = url.searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        id = undefined;
      }
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });
    }

    const deletedCollection = await Collection.findByIdAndDelete(id);
    if (!deletedCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    try {
      const productId = (deletedCollection as any).productId;
      if (productId && mongoose.Types.ObjectId.isValid(String(productId))) {
        await Product.findByIdAndDelete(productId);
      } else {
        const collectionValue = String(deletedCollection.collection || deletedCollection.tags?.[0] || deletedCollection.title || '').trim();
        await Product.findOneAndDelete({ collection: collectionValue });
      }
    } catch (deleteMirrorError) {
      console.warn('Failed to delete mirrored product for collection:', deleteMirrorError);
    }

    revalidatePath('/');
    revalidatePath('/products');

    return NextResponse.json({ message: 'Collection deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
