"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product as SharedProduct } from '@/types';
import Hero from '@/components/Hero';
import ProductDetailModal from '@/components/ProductDetailClient';
import BackButton from '@/components/BackButton';
import Navbar from '@/components/Navbar';
const PAGE_LIMIT = 20;
const ITEM_STAGGER_MS = 10;

type CollectionProduct = Partial<SharedProduct> & {
  id: string;
  _id: string;
  name: string;
  title: string;
  price: string;
  numericPrice: number;
  img: string;
  category: string;
  createdAt: string;
  description?: string;
  tags?: string[];
  sizes?: Array<{ size: string; stock: number }>;
  stock?: number;
  collection?: string;
};
interface Section {
  title: string;
  category: string;
  items: CollectionProduct[];
}
interface CollectionsFetchResponse {
  collections: CollectionProduct[];
  categories: string[];
  currentCategory?: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
interface CollectionsClientProps {
  initialData?: CollectionsFetchResponse | null;
}
async function fetchCategoryProducts(category: string): Promise<CollectionProduct[]> {
  const response = await fetch(`/api/collections?category=${encodeURIComponent(category)}&page=1&limit=${PAGE_LIMIT}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to load category ${category}: ${response.status} ${response.statusText} ${body}`);
  }
  const payload = await response.json();
  return payload.collections ?? [];
}
export default function CollectionsClient({ initialData }: CollectionsClientProps) {
  const initialCategories = initialData?.categories ?? [];
  const primaryCategory = initialData?.currentCategory ?? initialCategories[0] ?? 'General';
  const [sections, setSections] = useState<Section[]>(() => {
    if (!initialData?.collections?.length) return [];
    return [
      {
        title: `${primaryCategory} Collection`,
        category: primaryCategory,
        items: initialData.collections,
      },
    ];
  });
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const startedLoading = useRef(false);
  useEffect(() => {
    const categoriesToLoad = initialCategories.filter((category) => category !== primaryCategory);
    if (!categoriesToLoad.length) {
      setIsLoadingCategories(false);
      return;
    }
    if (startedLoading.current) return;
    startedLoading.current = true;
    let cancelled = false;
    async function loadCategoriesInParallel() {
      try {
        const categoryPromises = categoriesToLoad.map(async (category) => {
          const items = await fetchCategoryProducts(category);
          return { category, items };
        });

        const results = await Promise.all(categoryPromises);
        if (cancelled) return;

        setSections((prev) => [
          ...prev,
          ...results.map(({ category, items }) => ({
            title: `${category} Collection`,
            category,
            items,
          })),
        ]);
      } catch (error: any) {
        if (!cancelled) {
          setFetchError(error?.message || String(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCategories(false);
        }
      }
    }

    loadCategoriesInParallel();
    return () => {
      cancelled = true;
    };
  }, [initialCategories, primaryCategory]);
  const [selectedProduct, setSelectedProduct] = useState<Partial<SharedProduct> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const totalStock = useMemo(
    () => sections.reduce((sum, section) => sum + section.items.reduce((inner, item) => inner + (item.stock ?? 0), 0), 0),
    [sections]
  );
  const heroImage = useMemo(() => {
    const firstWithImage = sections.flatMap((section) => section.items).find((product) => Boolean(product.img));
    return firstWithImage?.img || '/images/hero1.webp';
  }, [sections]);
  const heroTitle = useMemo(() => (sections.length === 0 ? 'The Atelier' : 'Modern Elegance'), [sections.length]);
  const heroSubtitle = useMemo(() => {
    const productCount = sections.reduce((sum, section) => sum + section.items.length, 0);
    if (productCount === 0) {
      return 'Fresh arrivals and timeless staples will appear here as soon as products are added.';
    }
    return `${productCount} products loaded across ${sections.length} categories, with the next group arriving instantly.`;
  }, [sections]);
  const allProductsCount = sections.reduce((sum, section) => sum + section.items.length, 0);
  const handleViewDetails = (product: CollectionProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };
  return (
    <main className="min-h-screen bg-white text-stone-900 relative">
      <Navbar scrolled={scrolled} />
      {selectedProduct && (
        <ProductDetailModal product={selectedProduct} isOpen={isModalOpen} onClose={handleCloseModal} />
      )}
      <Hero
        data={{
          title: heroTitle,
          subtitle: heroSubtitle,
          imagePath: heroImage,
          images: [heroImage, '/images/hero1.webp'],
          href: '/collections',
          buttonText: 'Explore Collections',
        }}
      />
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="md:col-span-1">
            <div className="sticky top-24 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Categories</h2>
              <ul className="space-y-2">
                {initialCategories.map((category) => (
                  <li key={category}>
                    <Link href={`/collections/${category.toLowerCase()}`} className="text-sm text-stone-700 hover:underline">
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-3xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                <p className="font-semibold">Streaming</p>
                <p>{sections.length} / {initialCategories.length} categories loaded</p>
                <p>{allProductsCount} products visible</p>
              </div>
            </div>
          </aside>
          <div className="md:col-span-3">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <BackButton />
              <div className="text-right text-xs uppercase tracking-[0.32em] text-stone-500">
                {isLoadingCategories ? 'Loading next category...' : 'Categories loaded'}
              </div>
            </div>
            {fetchError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-8 text-center text-rose-700">
                <p>{fetchError}</p>
              </div>
            ) : sections.length === 0 ? (
              <div className="space-y-8 py-24 text-stone-500">
                <div className="mx-auto max-w-3xl rounded-3xl border border-stone-200 bg-stone-50 p-8 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Loading collections</p>
                      <h2 className="mt-2 text-3xl font-semibold text-stone-900">Preparing your categories</h2>
                    </div>
                    <div className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs uppercase tracking-[0.24em] text-stone-500">
                      {isLoadingCategories ? 'Streaming now' : 'Almost ready'}
                    </div>
                  </div>
                  <LoadingSkeletonGrid rows={2} cols={3} />
                </div>
              </div>
            ) : (
              <>
                {sections.map((section, sectionIndex) => (
                  <div key={section.category} className="mb-24">
                    <div className="mb-6 flex items-center justify-between gap-4 rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-stone-500">{section.title}</p>
                        <p className="mt-1 text-2xl font-semibold text-stone-900">{section.items.length} products</p>
                      </div>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs uppercase tracking-[0.22em] text-stone-500">
                        Category {sectionIndex + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {section.items.map((item, itemIndex) => (
                        <ProductCard
                          key={item.id}
                          item={item}
                          delayMs={(sectionIndex * section.items.length + itemIndex) * ITEM_STAGGER_MS}
                          onViewDetails={() => handleViewDetails(item)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {isLoadingCategories && (
                  <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-stone-500">
                    Next category is arriving now...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
function ProductCard({ item, delayMs, onViewDetails }: { item: CollectionProduct; delayMs: number; onViewDetails: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);
  return (
    <div
      className={`group cursor-pointer overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
      style={{ transitionDelay: `${delayMs}ms` }}
      onClick={onViewDetails}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
        <Image
          src={item.img || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80'}
          alt={item.name || item.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          loading="lazy"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="space-y-3 p-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.32em] text-stone-400">{item.category}</p>
          <h3 className="font-serif text-lg leading-tight text-stone-950 line-clamp-2">{item.name || item.title}</h3>
        </div>
        <p className="text-sm font-semibold text-stone-900">{item.price}</p>
        <a
          href={`/product/${item.id}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex w-full items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
        >
          View Details
        </a>
      </div>
    </div>
  );
}

function LoadingSkeletonGrid({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows * cols }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="h-64 bg-stone-200 animate-pulse" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-24 rounded-full bg-stone-200 animate-pulse" />
            <div className="h-6 w-3/4 rounded-full bg-stone-200 animate-pulse" />
            <div className="h-5 w-1/2 rounded-full bg-stone-200 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
