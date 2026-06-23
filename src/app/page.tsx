import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Collection } from '@/models/Collection';
import { Arrival } from '@/types';
import { CategoryWithProducts, CategoryProduct } from '@/lib/categoryData';
import { ProductCategory } from '@/types/product';
import dynamicImport from 'next/dynamic';

const HomePageClient = dynamicImport(() => import('@/components/HomePageClient'), {
  loading: () => <div className="h-screen bg-white" />,
  ssr: true,
});

export const revalidate = 60;
export const dynamic = 'force-dynamic';

const categoryOrder: ProductCategory[] = [
  'bridal',
  'groom',
  'formal',
  'informal',
  'children',
  'men',
  'women',
  'old-people',
  'young',
  'accessories',
];

const categoryDisplayNames: Record<string, string> = {
  bridal: 'Bridal',
  groom: 'Groom',
  formal: 'Formal',
  informal: 'Informal',
  children: 'Children',
  men: 'Men',
  women: 'Women',
  'old-people': 'Old People',
  young: 'Young',
  accessories: 'Accessories',
};

const normalizeValue = (value: any) =>
  String(value || '')
    .toLowerCase()
    .replace(/[-_\s]/g, '');

const getPriceText = (value: any) => {
  const amount = Number(value);
  return `$${Number.isFinite(amount) ? amount : 0}`.replace(/^(\$\d+)(?:\.(\d{1,2}))?$/, (_match, dollars, cents) =>
    `${dollars}.${(cents || '00').padEnd(2, '0')}`
  );
};

async function fetchHomeCategories(): Promise<CategoryWithProducts[]> {
  try {
    await connectDB();

    // 1. Fetch all products efficiently with only needed fields
    const allProducts = await Product.find({
      category: { $in: categoryOrder },
      active: true,
    })
      .select('name price discountPrice images category featured createdAt tags stock')
      .sort({ createdAt: -1 })
      .lean();

    // 2. Group data in code
    return categoryOrder.map((category) => {
      const filtered = allProducts.filter((p) => p.category === category);
      
      return {
        category,
        name: categoryDisplayNames[category] || category,
        products: filtered.slice(0, 10).map((product: any): CategoryProduct => ({
          _id: String(product._id),
          name: product.name || 'Untitled product',
          price: Number(product.price ?? 0),
          discountPrice: product.discountPrice != null ? Number(product.discountPrice) : undefined,
          images: Array.isArray(product.images) ? product.images : [],
          category: category as ProductCategory,
          featured: Boolean(product.featured),
          createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : new Date().toISOString(),
          tags: Array.isArray(product.tags) ? product.tags : [],
          stock: Number(product.stock ?? 0),
        })),
        total: filtered.length,
      };
    }).filter((item) => item.total > 0);
  } catch (error) {
    console.error('Error fetching home categories:', error);
    return [];
  }
}

async function fetchHomeBestSellers(): Promise<Arrival[]> {
  try {
    await connectDB();

    const newArrivals = await Product.find({ active: true })
      .select('name description price discountPrice images category tags rating featured collection stock')
      .sort({ createdAt: -1 })
      .limit(8)
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
      return collectionKey === 'bestseller' || hasBestSellerTag;
    });

    let bestSellersToSet = filteredBestSellers.length > 0
      ? filteredBestSellers
      : mappedArrivals.slice(0, 4);

    if (bestSellersToSet.length === 0) {
      const adminCollections = await Collection.find().lean();
      const adminMapped = (Array.isArray(adminCollections) ? adminCollections : []).map((item: any) => ({
        id: String(item._id),
        name: item.title || 'Untitled collection',
        img: item.img || '/api/placeholder/400/500',
        price: getPriceText(item.price),
        cat: item.category,
        collectionName: item.tag || item.collection || '',
        tags: normalizeTags(item.tags || item.tag),
      }));

      const adminBestSellers = adminMapped.filter((item) => {
        const collectionKey = normalizeValue(item.collectionName);
        const hasBestSellerTag = item.tags?.some((tag: string) => ['bestseller', 'bestsellers'].includes(tag)) ?? false;
        return collectionKey === 'bestseller' || hasBestSellerTag;
      });

      bestSellersToSet = adminBestSellers.length > 0 ? adminBestSellers : adminMapped.slice(0, 4);
    }

    return bestSellersToSet;
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    return [];
  }
}

async function fetchHomeNewArrivals(): Promise<Arrival[]> {
  try {
    await connectDB();

    const newArrivals = await Product.find({ active: true })
      .select('name description price discountPrice images category tags rating featured collection createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return (Array.isArray(newArrivals) ? newArrivals : []).map((product: any, index: number): Arrival => ({
      id: String(product._id ?? index),
      _id: String(product._id ?? index),
      name: product.name || 'Untitled product',
      img:
        Array.isArray(product.images) && product.images.length > 0
          ? product.images[0]
          : '/images/hero1.webp',
      price: getPriceText(product.discountPrice != null ? product.discountPrice : product.price),
      cat: product.category || '',
      category: product.category || '',
      images: Array.isArray(product.images)
        ? product.images.filter((img: string) => typeof img === 'string' && !img.startsWith('blob:'))
        : [],
      collectionName: product.collection || '',
      tags: Array.isArray(product.tags) ? product.tags.map((tag: any) => normalizeValue(tag)) : [],
      rating: product.rating,
      featured: product.featured,
      collection: product.collection || '',
      stock: Number(product.stock ?? 0),
    }));
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    return [];
  }
}

export default async function Home() {
  const [categories, bestSellers, newArrivals] = await Promise.all([
    fetchHomeCategories(),
    fetchHomeBestSellers(),
    fetchHomeNewArrivals(),
  ]);

  return <HomePageClient categories={categories} bestSellers={bestSellers} newArrivals={newArrivals} />;
}
