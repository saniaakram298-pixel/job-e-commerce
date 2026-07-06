import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import CategoryPageClient from '../../category/[categoryName]/CategoryPageClient';

interface CategoriesPageProps {
  params: { slug: string };
}

async function fetchCategoryProducts(slug: string, page: number = 1, limit: number = 20) {
  try {
    await connectDB();
    
    const decodedSlug = decodeURIComponent(slug);
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(20, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;
    
   const [products, total] = await Promise.all([
  Product.find({ category: decodedSlug, active: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(safeLimit)
    .select('_id name price discountPrice img images category stock sizes colors description collection')
    .lean()
    .exec(),

  Product.countDocuments({ category: decodedSlug, active: true }),
]);

    const sanitized = (products || []).map((item: any) => {
      const serialized: any = {
        _id: item._id?.toString?.() ?? String(item._id),
        title: item.name || item.title,
        price: item.price,
        discountPrice: item.discountPrice,
        img: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.img,
        category: item.category,
        stock: item.stock,
        description: item.description,
        collection: item.collection,
      };

      // Serialize sizes array if it exists
      if (item.sizes && Array.isArray(item.sizes)) {
        serialized.sizes = item.sizes.map((s: any) => ({
          size: s.size,
          stock: s.stock,
        }));
      }

      // Serialize colors array if it exists
      if (item.colors && Array.isArray(item.colors)) {
        serialized.colors = item.colors.map((c: any) => ({
          color: c.color,
          stock: c.stock,
        }));
      }

      return serialized;
    });

    return { products: sanitized, error: null, total, page: safePage, limit: safeLimit };
  } catch (error: any) {
    console.error('[admin/dashboard/categories] fetchCategoryProducts error:', error?.message ?? error);
    return {
      products: [],
      error: error?.message || 'Failed to load products',
      total: 0,
      page: 1,
      limit: 20,
    };
  }
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { products, error } = await fetchCategoryProducts(params.slug);
  const decodedSlug = decodeURIComponent(params.slug);

  return (
    <CategoryPageClient
      categoryName={decodedSlug}
      initialProducts={products}
      initialError={error}
    />
  );
}
