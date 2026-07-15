import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { getTotalStock } from '@/lib/productStock';
import CategoryPageClient from './CategoryPageClient';

const getProductStock = (product: any) => getTotalStock(product);

interface CategoryPageProps {
  params: { categoryName: string };
}

async function fetchCategoryProducts(categoryName: string, page: number = 1, limit: number = 1000) {
  try {
    await connectDB();

    const decodedCategory = decodeURIComponent(categoryName);
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(1000, Math.max(1, Number(limit) || 1000));
    const skip = (safePage - 1) * safeLimit;
    const normalizedCategory = decodedCategory.trim().toLowerCase();
    const safeCategory = normalizedCategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const categoryQuery: any = {
      active: true,
      $or: [
        { category: { $regex: new RegExp(`^${safeCategory}$`, 'i') } },
        { category: { $regex: new RegExp(safeCategory, 'i') } },
        { tags: { $in: [decodedCategory, normalizedCategory] } },
      ],
    };

    const [products, total] = await Promise.all([
      Product.find(categoryQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .select('_id name price discountPrice img images category stock sizes colors description collection tags subcategory')
        .lean()
        .exec(),

      Product.countDocuments(categoryQuery),
    ]);

    const sanitized = (products || []).map((item: any) => {
      const serialized: any = {
        _id: item._id?.toString?.() ?? String(item._id),
        title: item.name || item.title,
        price: item.price,
        discountPrice: item.discountPrice,
        img: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.img,
        category: item.category,
        stock: getProductStock(item),
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
    console.error('[admin/dashboard/category] fetchCategoryProducts error:', error?.message ?? error);
    return {
      products: [],
      error: error?.message || 'Failed to load products',
      total: 0,
      page: 1,
      limit: 20,
    };
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { products, error } = await fetchCategoryProducts(params.categoryName);
  const decodedCategory = decodeURIComponent(params.categoryName);

  return (
    <CategoryPageClient
      categoryName={decodedCategory}
      initialProducts={products}
      initialError={error}
    />
  );
}
