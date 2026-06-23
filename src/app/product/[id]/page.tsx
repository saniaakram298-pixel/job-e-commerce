import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import ProductDetailClient from '@/components/ProductDetailClient';

interface ProductDetailPageProps {
  params: { id: string };
}

function normalizeProductSizes(sizes: unknown) {
  if (!Array.isArray(sizes)) return [];
  return sizes
    .map((item: any) => ({
      size: String(item?.size ?? '').trim(),
      stock: Number(item?.stock ?? 0),
    }))
    .filter((entry) => entry.size);
}

function normalizeProductColors(colors: unknown) {
  if (!Array.isArray(colors)) return [];
  return colors
    .map((item: any) => ({
      color: String(item?.color ?? '').trim(),
      stock: Number(item?.stock ?? 0),
    }))
    .filter((entry) => entry.color);
}

function normalizeProductImages(images: unknown, fallback?: unknown) {
  const safeImages = Array.isArray(images)
    ? images.filter((img) => typeof img === 'string')
    : [];
  if (safeImages.length > 0) return safeImages;
  return typeof fallback === 'string' && fallback ? [fallback] : [];
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return (
      <div className="p-20 text-center font-serif italic text-2xl">
        Product not found.
      </div>
    );
  }

  await connectDB();
  const product = await Product.findById(params.id).lean();

  if (!product) {
    return (
      <div className="p-20 text-center font-serif italic text-2xl">
        Product not found.
      </div>
    );
  }

  const serializableProduct = {
    ...product,
    _id: String(product._id),
    name: product.name || 'Product',
    description: product.description || '',
    price: typeof product.price === 'number' ? product.price : Number(product.price) || 0,
    collection: product.collection || '',
    category: product.category || '',
    images: normalizeProductImages(product.images, product.img),
    sizes: normalizeProductSizes(product.sizes),
    colors: normalizeProductColors(product.colors),
    careInstructions: product.careInstructions || '',
    createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
    updatedAt: product.updatedAt instanceof Date ? product.updatedAt.toISOString() : product.updatedAt,
  };

  return <ProductDetailClient product={serializableProduct} />;
}
