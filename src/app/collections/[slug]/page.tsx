import dynamic from 'next/dynamic';
import { cache, Suspense } from 'react';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import CollectionPageClient from '@/components/CollectionPageClient';
import { CategoryProduct, CategoryWithProducts } from '@/lib/categoryData';
import { getSharedCategoryCatalog } from '@/lib/categoryCatalog';
import type { ProductCategory } from '@/types/product';

const CollectionProductsClient = dynamic(
  () => import('@/components/CollectionProductsClient'),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="aspect-[3/4] animate-pulse bg-stone-200" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-stone-200" />
            </div>
          </div>
        ))}
      </div>
    ),
  }
);

interface ServerProduct {
  id: string;
  name: string;
  price: number;
  image: string;
}

const buildStrictCategoryProductQuery = (categorySlug: string) => {
  const normalizedSlug = String(categorySlug || '').trim().toLowerCase();

  // Build a flexible regex from the slug so it matches stored category names
  // regardless of separators (spaces, hyphens, underscores).
  const words = normalizedSlug.split(/[^a-z0-9]+/).filter(Boolean);
  const escapedWords = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = `^${escapedWords.join('[\\s\\-_]*')}$`;
  const flexibleRegex = new RegExp(pattern, 'i');

  return {
    active: true,
    $or: [
      { category: { $regex: flexibleRegex } },
      { subcategory: { $regex: flexibleRegex } },
    ],
  };
};

const fetchCategoriesForPage = cache(async (): Promise<CategoryWithProducts[]> => {
  try {
    const sharedCategories = await getSharedCategoryCatalog();

    // IMPORTANT: Do NOT perform Product.findOne for every category here.
    // That was causing background DB work for adjacent categories when
    // navigating to a collection. Instead return metadata only; product
    // lists and representative images are loaded lazily and/or for the
    // current category only via fetchInitialProducts.
    const categoryMeta = sharedCategories.map((category) => ({
      category: (category.slug as ProductCategory) || 'accessories',
      name: category.name,
      products: [],
      total: category.productCount || 0,
      image: category.image || '',
    }));

    return categoryMeta;
  } catch (error) {
    console.error('Error fetching categories for page:', error);
    return [];
  }
});

const fetchInitialProducts = cache(async (slug: string, limit = 4): Promise<{ products: ServerProduct[]; total: number }> => {
  try {
    await connectDB();

    const categoryQuery = buildStrictCategoryProductQuery(slug);

    let [results, total] = await Promise.all([
      Product.find(categoryQuery)
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('_id name price images img category')
        .lean(),
      Product.countDocuments(categoryQuery),
    ]);

    if ((total || 0) === 0 && slug) {
      try {
        const lookupSlug = String(slug || '').trim().toLowerCase();
        const catDoc = await (await import('@/models/Category')).Category.findOne({ slug: lookupSlug }).lean();

        const altQueries: any[] = [];
        altQueries.push({ category: String(slug) });
        if (catDoc) {
          if (catDoc.name) {
            altQueries.push({ category: catDoc.name });
            altQueries.push({ subcategory: catDoc.name });
          }
          if (catDoc.slug) {
            altQueries.push({ category: catDoc.slug });
            altQueries.push({ subcategory: catDoc.slug });
          }
          if (catDoc._id) {
            altQueries.push({ category: String(catDoc._id) });
            altQueries.push({ subcategory: String(catDoc._id) });
          }
        }

        const fallbackQuery = { active: true, $or: altQueries };

        const fbResults = await Product.find(fallbackQuery)
          .sort({ createdAt: -1 })
          .limit(limit)
          .select('_id name price images img category')
          .lean();

        const fbTotal = await Product.countDocuments(fallbackQuery);

        if ((fbResults || []).length > 0 || fbTotal > 0) {
          results = fbResults;
          total = fbTotal;
        }
      } catch (err) {
        console.error('Collections fallback lookup error:', err);
      }
    }

    const products: ServerProduct[] = (results as any[]).map((p) => ({
      id: String(p._id || p.id),
      name: p.name,
      price: Number(p.price || 0),
      image: Array.isArray(p.images) && p.images.length ? p.images[0] : p.img || '/images/arrival-1.png',
    }));

    return { products, total };
  } catch (error) {
    console.error('Error fetching initial products:', error);
    return { products: [], total: 0 };
  }
});

export async function generateStaticParams() {
  try {
    const categories = await getSharedCategoryCatalog();
    return categories.map((cat: any) => ({
      slug: cat.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export const revalidate = 3600;

export default async function Page({
  params,
}: {
  params: { slug: string };
}) {
  const slug = decodeURIComponent(params.slug || '');

  if (!slug) {
    notFound();
  }

  const currentCategoryName = slug.replace(/-/g, ' ');

  try {
    const allCategories = await fetchCategoriesForPage();

    // Fetch initial page of products for this category on the server so the
    // CollectionProductsClient can render immediately without falling into
    // the "No products found" empty state. This avoids client-only fetches
    // for the first batch and ensures SEO/UX correctness.
    const initial = await fetchInitialProducts(slug, 4);

    return (
      <CollectionPageClient
        currentSlug={slug}
        categories={allCategories}
        currentCategoryName={currentCategoryName}
        currentCategoryImage={initial.products[0]?.image || ''}
        currentCategoryProducts={initial.products}
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12">
          <header className="mb-8 animate-in fade-in duration-300">
            <h1 className="text-3xl font-semibold capitalize">{currentCategoryName} Collection</h1>
            <p className="mt-2 text-sm text-stone-600">
              Showing products for the <span className="font-medium">&quot;{currentCategoryName}&quot;</span> category.
            </p>
          </header>

          <Suspense fallback={null}>
            <CollectionProductsClient
              products={initial.products}
              totalProducts={initial.total}
              categorySlug={slug}
              initialVisibleCount={4}
              batchSize={4}
            />
          </Suspense>
        </div>
      </CollectionPageClient>
    );
  } catch (error: any) {
    console.error('Collections page error:', error?.message || error);
    return (
      <div className="min-h-screen bg-white text-stone-900">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            <h2 className="text-lg font-semibold">Unable to load collection</h2>
            <p className="mt-2">{String(error?.message || 'Unknown error')}</p>
          </div>
        </div>
      </div>
    );
  }
}