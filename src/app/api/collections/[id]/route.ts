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
    const fallbackTag = String(body.collection || '').trim() || 'Collection';
    const tags = normalizeTags(body.tags, fallbackTag);
    const sizes = normalizeSizes(body.sizes, body.stock || 0);

    const updatedCollection = await Collection.findByIdAndUpdate(
      id,
      {
        title: body.title,
        collection: body.collection,
        img: body.img,
        video: body.video || null,
        category: body.category,
        stock: Number(body.stock || sizes.reduce((sum: number, item: any) => sum + item.stock, 0)),
        price: Number(body.price || 0),
        description: body.description || '',
        tags,
        sizes,
      },
      { new: true }
    );

    if (!updatedCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    try {
      const pid = (updatedCollection as any).productId;
      const productUpdate: any = {
        name: updatedCollection.title,
        description: updatedCollection.description || updatedCollection.title,
        price: updatedCollection.price || 0,
        category: updatedCollection.category,
        collection: updatedCollection.collection || String(updatedCollection.tags?.[0] || '').trim(),
        images: updatedCollection.img ? [updatedCollection.img] : [],
        tags: updatedCollection.tags && updatedCollection.tags.length > 0
          ? updatedCollection.tags
          : [updatedCollection.collection || ''],
        sizes: updatedCollection.sizes || [{ size: 'Free Size', stock: updatedCollection.stock || 0 }],
        active: true,
      };

      if (pid && mongoose.Types.ObjectId.isValid(String(pid))) {
        await Product.findByIdAndUpdate(pid, productUpdate, { new: true });
      } else {
        await Product.findOneAndUpdate({ name: updatedCollection.title }, productUpdate, { new: true });
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

    return NextResponse.json(updatedCollection, { status: 200 });
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
