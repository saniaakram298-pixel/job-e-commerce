import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Arrival } from '@/types';
import HomePageClient from '@/components/HomePageClient';
import { getSharedCategoryCatalog } from '@/lib/categoryCatalog';

export const revalidate = 60;
export const dynamic = 'force-dynamic';


const normalizeValue = (value: any) =>
  String(value || '')
    .toLowerCase()
    .replace(/[-_\s]/g, '');

const normalizeCategoryKey = (value: any) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const getPriceText = (value: any) => {
  const amount = Number(value);
  return `$${Number.isFinite(amount) ? amount : 0}`.replace(/^(\$\d+)(?:\.(\d{1,2}))?$/, (_match, dollars, cents) =>
    `${dollars}.${(cents || '00').padEnd(2, '0')}`
  );
};

async function fetchHomeCategories(): Promise<Array<{ slug: string; name: string; productCount: number; image?: string }>> {
  try {
    await connectDB();

    const sharedCategories = await getSharedCategoryCatalog();
    if (sharedCategories.length === 0) {
      return [];
    }

    const categoriesWithImages = await Promise.all(
      sharedCategories.map(async (category: { slug: string; name: string; productCount: number }) => {
        const representativeProduct = await Product.findOne({ active: true, category: category.slug })
          .sort({ createdAt: -1 })
          .select('images img')
          .lean();

        const image = Array.isArray(representativeProduct?.images) && representativeProduct.images.length > 0
          ? representativeProduct.images[0]
          : representativeProduct?.img || '';

        return {
          slug: category.slug,
          name: category.name,
          productCount: category.productCount,
          image: String(image || ''),
        };
      })
    );

    return categoriesWithImages.filter((item) => item.slug);
  } catch (error) {
    console.error('Error fetching home categories:', error);
    return [];
  }
}

async function fetchHomeBestSellers(): Promise<Arrival[]> {
  try {
    await connectDB();

    const newArrivals = await Product.find({ active: true })
      .select('name description price discountPrice images category tags rating featured isBestSeller isTrending collection stock')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    const normalizeTags = (tags: any) =>
      (Array.isArray(tags) ? tags : tags ? [tags] : []).map((tag: any) => normalizeValue(tag));

    const mappedArrivals: Arrival[] = newArrivals.map((product: any) => ({
      id: String(product._id || product.id),
      name: product.name || 'Untitled product',
      img: Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : '/api/placeholder/400/500',
      price: getPriceText(product.discountPrice != null ? product.discountPrice : product.price),
      cat: product.category || '',
      collectionName: product.collection || '',
      tags: normalizeTags(product.tags),
      stock: Number(product.stock ?? 0),
    }));

    const filteredBestSellers = mappedArrivals.filter((item) => {
      const collectionKey = normalizeValue(item.collectionName);
      const hasBestSellerTag = item.tags?.some((tag: string) => ['bestseller', 'bestsellers'].includes(tag)) ?? false;
      return item.isBestSeller || collectionKey === 'bestseller' || hasBestSellerTag;
    });

    let bestSellersToSet = filteredBestSellers.length > 0
      ? filteredBestSellers
      : mappedArrivals.slice(0, 4);

    return bestSellersToSet;
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    return [];
  }
}

export default async function Home() {
const [categories, bestSellers] = await Promise.all([
    fetchHomeCategories(),
    fetchHomeBestSellers(),
  ]);

  return <HomePageClient categories={categories} bestSellers={bestSellers} />;
}
