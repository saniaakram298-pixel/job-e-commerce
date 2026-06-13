import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Collection } from '@/models/Collection';
import { Arrival, Category } from '@/types';
import HomePageClient from '@/components/HomePageClient';

export const dynamic = 'force-dynamic';

const categoryOrder = [
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

async function fetchHomeCategories(): Promise<Category[]> {
  await connectDB();

  const products = await Product.find({
    active: true,
    category: { $in: categoryOrder },
    images: { $exists: true, $ne: [] },
  })
    .select('images category')
    .sort({ createdAt: -1 })
    .lean();

  const latestByCategory = products.reduce<Record<string, any>>((acc, product) => {
    const categoryId = String(product.category || '');
    if (!acc[categoryId] && Array.isArray(product.images) && product.images.length > 0) {
      acc[categoryId] = product;
    }
    return acc;
  }, {});

  return categoryOrder
    .map((categoryId) => {
      const product = latestByCategory[categoryId];
      if (!product) return null;

      return {
        id: categoryId,
        name: categoryDisplayNames[categoryId] || categoryId,
        img: product.images[0],
        products: [] as number[],
      };
    })
    .filter((item): item is Category => item !== null);
}

async function fetchHomeBestSellers(): Promise<Arrival[]> {
  await connectDB();

  const newArrivals = await Product.find({ active: true })
    .select('name description price discountPrice images category tags rating featured collection')
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
}

export default async function Home() {
  const categories = await fetchHomeCategories();
  const bestSellers = await fetchHomeBestSellers();

  return <HomePageClient categories={categories} bestSellers={bestSellers} />;
}
