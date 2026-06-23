import { connectDB } from '@/lib/mongodb';
import { Collection } from '@/models/Collection';
import { Product } from '@/models/Product';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';
export const dynamic = 'force-dynamic';

function normalizeTags(tags: any, fallbackTag: string): string[] {
  if (Array.isArray(tags)) return tags.filter(Boolean).map(String);
  if (typeof tags === 'string' && tags.trim()) return [tags.trim()];
  return [fallbackTag];
}

function normalizeSizes(sizes: any, fallbackStock: number): Array<{ size: string; stock: number }> {
  if (!Array.isArray(sizes)) return [{ size: 'Free Size', stock: Number(fallbackStock) || 0 }];
  return sizes
    .map((item: any) => ({ size: String(item?.size || '').trim(), stock: Number(item?.stock || 0) }))
    .filter(sizeItem => sizeItem.size);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 });
    }

    const body = await request.json();
    const existingCollection = await Collection.findById(id);

    if (!existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const existingData = existingCollection.toObject ? (existingCollection.toObject() as any) : existingCollection;
    const fallbackTag = String(body.collection ?? existingData.collection ?? '').trim() || 'Collection';
    const tags = body.tags !== undefined ? normalizeTags(body.tags, fallbackTag) : existingData.tags || [];
    const sizes = body.sizes !== undefined
      ? normalizeSizes(body.sizes, (body.stock ?? existingData.stock) || 0)
      : existingData.sizes || normalizeSizes(undefined, (body.stock ?? existingData.stock) || 0);
    const updatedStock = body.stock !== undefined
      ? Number(body.stock) || sizes.reduce((sum: number, item: any) => sum + item.stock, 0)
      : existingData.stock;

    if (body.title !== undefined) existingCollection.set('title', String(body.title || existingData.title));
    if (body.collection !== undefined) existingCollection.set('collection', String(body.collection || existingData.collection));
    if (body.category !== undefined) existingCollection.set('category', String(body.category || existingData.category));
    if (body.price !== undefined) existingCollection.set('price', Number(body.price) || 0);
    if (body.description !== undefined) existingCollection.set('description', String(body.description || existingData.description || ''));
    if (body.img !== undefined) existingCollection.set('img', String(body.img || existingData.img));
    if (body.video !== undefined) existingCollection.set('video', body.video ? String(body.video) : null);
    if (body.tags !== undefined || body.collection !== undefined) existingCollection.set('tags', tags);
    if (body.sizes !== undefined) existingCollection.set('sizes', sizes);
    existingCollection.set('stock', updatedStock);

    const savedCollection = await existingCollection.save();

    try {
      const pid = (savedCollection as any).productId;
      const productUpdate: any = {
        name: savedCollection.title,
        description: savedCollection.description || savedCollection.title,
        price: savedCollection.price || 0,
        category: savedCollection.category,
        collection: savedCollection.collection || String(savedCollection.tags?.[0] || '').trim(),
        images: savedCollection.img ? [savedCollection.img] : [],
        tags: savedCollection.tags && savedCollection.tags.length > 0
          ? savedCollection.tags
          : [savedCollection.collection || ''],
        sizes: savedCollection.sizes || [{ size: 'Free Size', stock: savedCollection.stock || 0 }],
        stock: savedCollection.stock || 0,
        active: true,
      };

      if (pid && mongoose.Types.ObjectId.isValid(String(pid))) {
        await Product.findByIdAndUpdate(pid, productUpdate, { new: true });
      } else {
        await Product.findOneAndUpdate({ name: savedCollection.title }, productUpdate, { new: true });
      }
    } catch (syncErr) {
      console.warn('Failed to sync mirrored Product on collection update:', syncErr);
    }

    try {
      revalidatePath('/');
      revalidatePath('/products');
    } catch (e) {
      /* non-fatal */
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

    return NextResponse.json(plain, { status: 200 });
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 });
    }

    const deletedCollection = await Collection.findByIdAndDelete(id);

    if (!deletedCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    try {
      const pid = (deletedCollection as any).productId;
      if (pid && mongoose.Types.ObjectId.isValid(String(pid))) {
        await Product.findByIdAndDelete(pid);
      } else {
        const collectionValue = String(
          deletedCollection.collection || deletedCollection.tags?.[0] || deletedCollection.title || ''
        ).trim();
        await Product.findOneAndDelete({ collection: collectionValue });
      }
    } catch (syncErr) {
      console.warn('Failed to delete mirrored Product on collection delete:', syncErr);
    }

    try {
      revalidatePath('/');
      revalidatePath('/products');
    } catch (e) {
      /* non-fatal */
    }

    return NextResponse.json({ message: 'Collection deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
