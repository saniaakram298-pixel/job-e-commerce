import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import ProductDetailClient from '@/components/ProductDetailClient';

interface ProductDetailPageProps {
  params: { id: string };
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
    images: Array.isArray(product.images) ? product.images : [],
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    colors: Array.isArray(product.colors) ? product.colors : [],
    careInstructions: product.careInstructions || '',
    createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
    updatedAt: product.updatedAt instanceof Date ? product.updatedAt.toISOString() : product.updatedAt,
  };

  return <ProductDetailClient product={serializableProduct} />;
}
