import { connectDB, withQueryTimeout } from '@/lib/mongodb';
import { Collection } from '@/models/Collection';
import { Product } from '@/models/Product';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

function normalizeTags(tags: any, fallbackTag?: string): string[] {
  if (Array.isArray(tags)) return tags.filter(Boolean).map(String);
  if (typeof tags === 'string' && tags.trim()) return [tags.trim()];
  return fallbackTag ? [fallbackTag] : [];
}

function normalizeSizes(sizes: any, stockFallback: number): Array<{ size: string; stock: number }> {
  if (!Array.isArray(sizes)) return [{ size: 'Free Size', stock: Number(stockFallback) || 0 }];
  return sizes
    .map((item: any) => ({ size: String(item?.size || '').trim(), stock: Number(item?.stock || 0) }))
    .filter(sizeItem => sizeItem.size);
}

/**
 * Classify if error is transient (503) or permanent (500)
 */
function isTransientError(error: any): boolean {
  const message = (error?.message || '').toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('ehostunreach') ||
    message.includes('enetunreach') ||
    error.name === 'MongoNetworkError' ||
    error.name === 'MongoNetworkTimeoutError' ||
    error.name === 'MongoServerSelectionError'
  );
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = parsePositiveInt(url.searchParams.get('page'), 1);
    const limit = Math.min(50, parsePositiveInt(url.searchParams.get('limit'), 20));
    const skip = (page - 1) * limit;
    const category = url.searchParams.get('category')?.trim() || undefined;
    const collectionParam = url.searchParams.get('collection')?.trim() || undefined;

    const query: Record<string, any> = {};
    if (category) query.category = category;
    if (collectionParam) query.collection = collectionParam;

    const selectFields = 'title name price img category collection stock description tags sizes createdAt';
    const queryLabel = `Collections-Query-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    console.time(queryLabel);
    let collections: any[] = [];
    let totalCount = 0;
    try {
      const hintIndex = query.category
        ? { category: 1, createdAt: -1 }
        : query.collection
        ? { collection: 1, createdAt: -1 }
        : { createdAt: -1 };

      try {
        [collections, totalCount] = await Promise.all([
          withQueryTimeout(
            () =>
              Collection.find(query)
                .hint(hintIndex)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select(selectFields)
                .lean()
                .maxTimeMS(20000)
                .exec(),
            25000
          ),
          query.category || query.collection
            ? withQueryTimeout(() => Collection.countDocuments(query).maxTimeMS(10000).exec(), 15000)
            : withQueryTimeout(() => Collection.estimatedDocumentCount().maxTimeMS(10000).exec(), 15000),
        ]);
      } catch (primaryErr: any) {
        console.warn('[api/collections] Primary query failed, attempting fast fallback:', primaryErr?.message ?? primaryErr);

        // Fast fallback: return a small, recent sample without hints and with a short limit
        try {
          const fallbackLimit = Math.min(limit, 20);
          collections = await Collection.find(query)
            .sort({ createdAt: -1 })
            .limit(fallbackLimit)
            .select(selectFields)
            .lean()
            .exec();
        } catch (fallbackFindErr: any) {
          console.error('[api/collections] Fallback find also failed:', fallbackFindErr?.message ?? fallbackFindErr);
          collections = [];
        }

        try {
          if (query.category || query.collection) {
            totalCount = await Collection.countDocuments(query).maxTimeMS(5000).exec();
          } else {
            totalCount = await Collection.estimatedDocumentCount().maxTimeMS(5000).exec();
          }
        } catch (fallbackCountErr: any) {
          console.warn('[api/collections] Fallback count failed, using sample length:', fallbackCountErr?.message ?? fallbackCountErr);
          totalCount = collections.length;
        }
      }
    } finally {
      console.timeEnd(queryLabel);
    }

    const sanitizedCollections = (collections || []).map(item => ({
      ...item,
      _id: item._id?.toString?.() ?? item._id,
      productId: item.productId?.toString?.() ?? item.productId,
      sizes: Array.isArray(item.sizes)
        ? item.sizes.map((size: any) => ({
            size: String(size?.size ?? '').trim(),
            stock: Number(size?.stock ?? 0),
          }))
        : [],
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
    console.error('[api/collections] GET error:', error?.message ?? error);
    const isTransient = isTransientError(error);
    const statusCode = isTransient ? 503 : 500;

    return NextResponse.json(
      {
        error: 'Failed to fetch collections',
        details: error?.message ?? String(error),
        transient: isTransient,
      },
      { status: statusCode }
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
    const tags = normalizeTags(body.tags && body.tags.length ? body.tags : [body.tag || collection], collection);
    const sizes = normalizeSizes(body.sizes, Number(body.stock ?? 0));
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
        img,
        images: Array.isArray(body.images) && body.images.length > 0 ? body.images : img ? [img] : [],
        materials: Array.isArray(body.materials) ? body.materials : [],
        sizes,
        colors: Array.isArray(body.colors) ? body.colors : [],
        tags: tags.length > 0 ? tags : [collection],
        rating: body.rating || 0,
        stock,
        featured: body.featured || false,
        active: body.active !== undefined ? body.active : true,
      };

      const newProduct = new Product(productPayload);
      const savedProduct = await newProduct.save();
      (savedCollection as any).productId = savedProduct._id;
      await savedCollection.save();

      revalidatePath('/');
      revalidatePath('/products');
      revalidatePath('/collections');
    } catch (mirrorError) {
      console.warn('Collection saved but product mirror failed:', mirrorError);
    }

    const plain = (savedCollection as any).toObject ? (savedCollection as any).toObject() : savedCollection;
    if (plain._id && typeof plain._id !== 'string') plain._id = String(plain._id);
    if (plain.productId && typeof plain.productId !== 'string') plain.productId = String(plain.productId);
    if (Array.isArray(plain.sizes)) {
      plain.sizes = plain.sizes.map((size: any) => ({
        size: String(size?.size ?? '').trim(),
        stock: Number(size?.stock ?? 0),
      }));
    }

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
    revalidatePath('/collections');

    return NextResponse.json({ message: 'Collection deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
