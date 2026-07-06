import dynamic from 'next/dynamic';
import { cache, Suspense } from 'react';
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

const fetchCategoriesForPage = cache(async (): Promise<CategoryWithProducts[]> => {
  try {
    const sharedCategories = await getSharedCategoryCatalog();

    const categoryProducts = await Promise.all(
      sharedCategories.map(async (category) => {
        const representativeProduct = await Product.findOne({ active: true, category: category.slug })
          .sort({ createdAt: -1 })
          .select('images img name price category featured createdAt tags stock')
          .lean();

        const image = Array.isArray(representativeProduct?.images) && representativeProduct.images.length > 0
          ? representativeProduct.images[0]
          : representativeProduct?.img || '';

        const productShape: CategoryProduct = {
          _id: String(representativeProduct?._id || ''),
          name: String(representativeProduct?.name || category.name),
          price: Number(representativeProduct?.price || 0),
          images: image ? [image] : [],
          category: (category.slug as ProductCategory) || 'accessories',
          featured: Boolean(representativeProduct?.featured),
          createdAt: representativeProduct?.createdAt ? String(representativeProduct.createdAt) : new Date().toISOString(),
          tags: Array.isArray(representativeProduct?.tags) ? representativeProduct.tags : [],
        };

        return {
          category: (category.slug as ProductCategory) || 'accessories',
          name: category.name,
          products: image ? [productShape] : [],
          total: category.productCount || 0,
          image,
        };
      })
    );

    return categoryProducts;
  } catch (error) {
    console.error('Error fetching categories for page:', error);
    return [];
  }
});

const fetchInitialProducts = cache(async (slug: string, limit = 4): Promise<{ products: ServerProduct[]; total: number }> => {
  try {
    await connectDB();

    const [results, total] = await Promise.all([
      Product.find({ category: { $regex: `^${slug}$`, $options: 'i' }, active: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('_id name price images img')
        .lean(),
      Product.countDocuments({ category: { $regex: `^${slug}$`, $options: 'i' }, active: true }),
    ]);

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

  try {
    const [{ products, total }, allCategories] = await Promise.all([
      fetchInitialProducts(slug, 4),
      fetchCategoriesForPage(),
    ]);

    const currentCategoryName = slug.replace(/-/g, ' ');

    return (
      <CollectionPageClient
        currentSlug={slug}
        categories={allCategories}
        currentCategoryName={currentCategoryName}
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
              products={products}
              totalProducts={total}
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