import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Arrival } from '@/types';
import HomePageClient from '@/components/HomePageClient';
import { getSharedCategoryCatalog } from '@/lib/categoryCatalog';
import { getTotalStock } from '@/lib/productStock';

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

const escapeRegex = (value: string) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildCategoryProductQuery = (category: { slug: string; name: string }) => {
  const candidateValues = Array.from(
    new Set(
      [
        String(category?.slug || '').trim(),
        String(category?.name || '').trim(),
        normalizeCategoryKey(category?.slug),
        normalizeCategoryKey(category?.name),
      ].filter(Boolean)
    )
  );

  const categoryMatches = candidateValues.flatMap((value) => [
    { category: { $regex: new RegExp(`^${escapeRegex(value)}$`, 'i') } },
    { subcategory: { $regex: new RegExp(`^${escapeRegex(value)}$`, 'i') } },
  ]);

  const tagValues = candidateValues.flatMap((value) => [value, normalizeValue(value)]);

  return {
    active: true,
    $or: [
      ...categoryMatches,
      { tags: { $in: tagValues } },
      {
        tags: {
          $elemMatch: {
            $regex: new RegExp(`(${candidateValues.map(escapeRegex).join('|')})`, 'i'),
          },
        },
      },
    ],
  };
};

const getPriceText = (value: any) => {
  const amount = Number(value);
  return `$${Number.isFinite(amount) ? amount : 0}`.replace(/^(\$\d+)(?:\.(\d{1,2}))?$/, (_match, dollars, cents) =>
    `${dollars}.${(cents || '00').padEnd(2, '0')}`
  );
};

async function fetchHomeCategories(): Promise<Array<{ slug: string; name: string; productCount: number; image?: string; products?: Array<{ id: string; name: string; image: string; price?: string }> }>> {
  try {
    await connectDB();

    const sharedCategories = await getSharedCategoryCatalog();
    console.log(`[HomePage] Fetched ${sharedCategories.length} categories from shared catalog`);

    if (sharedCategories.length === 0) {
      console.warn('[HomePage] No categories found in shared catalog, using fallbacks');
      return [
        { slug: 'featured', name: 'Featured Picks', productCount: 0, image: '/images/hero2.webp', products: [] },
        { slug: 'new-arrivals', name: 'New Arrivals', productCount: 0, image: '/images/hero1.webp', products: [] },
        { slug: 'best-sellers', name: 'Best Sellers', productCount: 0, image: '/images/arrival-1.png', products: [] },
      ];
    }

    // For homepage, do NOT fetch product documents for each category.
    // Only return category metadata (slug, name, productCount, optional image placeholder).
    // Actual product lists must be loaded lazily on the collection page.
    const categoriesMeta = sharedCategories.map((category: { slug: string; name: string; productCount: number; image?: string }) => ({
      slug: category.slug,
      name: category.name,
      productCount: category.productCount || 0,
      image: category.image || '',
      products: [],
    }));

    console.log(`[HomePage] Returning ${categoriesMeta.length} category metadata entries (no products loaded)`);
    return categoriesMeta;
  } catch (error) {
    console.error('[HomePage] Error in fetchHomeCategories:', error);
    return [];
  }
}

async function fetchHomeBestSellers(): Promise<Arrival[]> {
  try {
    await connectDB();

    const bestSellerProducts = await Product.find({ active: true, isBestSeller: true })
      .select('name description price discountPrice images category tags rating featured isBestSeller isTrending collection stock updatedAt createdAt')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    const normalizeTags = (tags: any) =>
      (Array.isArray(tags) ? tags : tags ? [tags] : []).map((tag: any) => normalizeValue(tag));

    const mappedArrivals: Arrival[] = bestSellerProducts.map((product: any) => ({
      id: String(product._id || product.id),
      name: product.name || 'Untitled product',
      img: Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : '/api/placeholder/400/500',
      price: getPriceText(product.discountPrice != null ? product.discountPrice : product.price),
      cat: product.category || '',
      collectionName: product.collection || '',
      tags: normalizeTags(product.tags),
      stock: getTotalStock(product),
      updatedAt: product.updatedAt || '',
      createdAt: product.createdAt || '',
      isBestSeller: Boolean(product.isBestSeller),
      isTrending: Boolean(product.isTrending),
      featured: Boolean(product.featured),
    }));

    return mappedArrivals;
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    return [];
  }
}

async function HomePageData() {
  const [categories, bestSellers] = await Promise.all([
    fetchHomeCategories(),
    fetchHomeBestSellers(),
  ]);

  return <HomePageClient categories={categories} bestSellers={bestSellers} />;
}

export default function Home() {
  return <HomePageData />;
}
