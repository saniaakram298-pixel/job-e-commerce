"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { InfiniteData, QueryFunctionContext, useInfiniteQuery } from '@tanstack/react-query';
import ProductDetailModal from './ProductDetailModal';
import BackButton from '@/components/BackButton';

interface Product {
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
}

interface Section {
  title: string;
  category: string;
  items: Product[];
}

interface CollectionsFetchResponse {
  collections: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const PAGE_LIMIT = 20;
const collectionsQueryKey = ['collections', PAGE_LIMIT] as const;

type CollectionsQueryKey = typeof collectionsQueryKey;

export default function CollectionsClient() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isError,
    isLoading,
    refetch,
  } = useInfiniteQuery<CollectionsFetchResponse, Error, InfiniteData<CollectionsFetchResponse>, typeof collectionsQueryKey, number>({
    queryKey: collectionsQueryKey,
    queryFn: async ({ pageParam = 1 }: QueryFunctionContext<typeof collectionsQueryKey, number>) => {
      const page = Number(pageParam) || 1;
      const apiUrl = new URL('/api/collections', window.location.origin);
      apiUrl.searchParams.set('page', String(page));
      apiUrl.searchParams.set('limit', String(PAGE_LIMIT));

      const response = await fetch(apiUrl.toString());
      const parsedData = await response.json();

      if (!response.ok) {
        throw new Error(parsedData?.error || 'Failed to load collections');
      }

      return {
        collections: Array.isArray(parsedData.collections) ? parsedData.collections : [],
        pagination: parsedData.pagination || { page, limit: PAGE_LIMIT, total: 0, pages: 1 },
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.pagination.page + 1;
      return nextPage <= lastPage.pagination.pages ? nextPage : undefined;
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
   placeholderData: (previousData: any, previousQuery: any) => previousData,
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const allProducts = useMemo(() => {
    return data?.pages?.flatMap((page) =>
      page.collections.map((product: Product) => ({
        ...product,
        id: product.id || product._id,
      }))
    ) ?? [];
  }, [data]);

  const totalStock = useMemo(() => {
    return allProducts.reduce((sum, product) => sum + (product.stock ?? 0), 0);
  }, [allProducts]);

  const activeSections = useMemo<Section[]>(() => {
    const sections: Section[] = [];

    allProducts.forEach((product: Product) => {
      const categoryName = product.category || 'General';
      const matchedSection = sections.find(
        (section) => section.category.toLowerCase() === categoryName.toLowerCase()
      );
      const item: Product = {
        ...product,
        category: categoryName,
      };

      if (matchedSection) {
        matchedSection.items.push(item);
      } else {
        sections.push({
          title: `${categoryName} Collection`,
          category: categoryName,
          items: [item],
        });
      }
    });

    return sections;
  }, [allProducts]);

  const errorMessage = isError ? error?.message || 'Unable to load collections.' : null;

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleRetry = () => {
    refetch();
  };

  const newArrivals = useMemo(() => {
    return [...allProducts]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [allProducts]);

  return (
    <main className="min-h-screen bg-white text-stone-900 relative">
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <div className="h-[65vh] relative flex items-center justify-center bg-stone-200">
        <Image src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80" alt="Hero" fill className="object-cover opacity-70" priority />
        <div className="relative z-10 text-center text-white">
          <h1 className="font-serif text-7xl md:text-9xl italic tracking-tighter">Collection</h1>
          <p className="mt-4 text-base md:text-lg text-white/80 max-w-3xl mx-auto">
            Showing {allProducts.length} products{data?.pages?.[0]?.pagination?.total ? ` of ${data.pages[0].pagination.total}` : ''} across the collection, with {totalStock} items currently in stock.
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-12">
        <BackButton />
      </div>

      <section className="max-w-[1440px] mx-auto px-6 py-20 bg-stone-50">
        <div className="mb-12 text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-bold mb-2 block">Freshly Added</span>
          <h2 className="font-serif text-5xl italic">New Arrivals</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {newArrivals.length > 0 ? (
            newArrivals.map((item) => (
              <ProductCard
                key={item.id || item._id}
                item={item}
                onViewDetails={() => handleViewDetails(item)}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-stone-500 py-16">
              {isLoading ? 'Loading collections...' : 'No products available in this category yet.'}
            </div>
          )}
        </div>
        {errorMessage && (
          <div className="mt-6 text-center text-sm text-red-500">
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 inline-flex items-center justify-center rounded-md border border-stone-900 px-4 py-2 text-sm font-semibold text-stone-900"
            >
              Retry
            </button>
          </div>
        )}
      </section>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-24">
        {activeSections.map((section, idx) => {
          const displayItems = section.items.slice(0, 10);
          const hasMore = section.items.length > 10;

          return (
            <div key={idx} className="mb-32">
              <div className="flex items-end justify-between mb-12 border-b border-stone-100 pb-8">
                <h2 className="font-serif text-4xl italic">{section.title}</h2>
                {hasMore && (
                  <Link href={`/collections/${section.category.toLowerCase()}`} className="text-[10px] uppercase tracking-widest font-bold border-b border-black">
                    View Full Collection ({section.items.length})
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayItems.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onViewDetails={() => handleViewDetails(item)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        <div ref={loadMoreRef} className="h-24 flex items-center justify-center">
          {isFetchingNextPage ? (
            <div className="text-sm text-stone-500">Loading more products...</div>
          ) : hasNextPage ? (
            <div className="text-sm text-stone-400">Scroll to load more</div>
          ) : (
            !isLoading && <div className="text-sm text-stone-400">No more products to load.</div>
          )}
        </div>
      </div>
    </main>
  );
}

function ProductCard({ item, onViewDetails }: { item: Product; onViewDetails: () => void }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 rounded-lg">
        <Image
          src={item.img || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80'}
          alt={item.name || item.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <button
          onClick={onViewDetails}
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors duration-300 opacity-0 group-hover:opacity-100"
        >
          <span className="px-6 py-2 bg-white text-stone-900 font-bold uppercase tracking-widest text-sm rounded-lg transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            View Details
          </span>
        </button>
      </div>
      <h3 className="font-serif text-lg mt-4 line-clamp-2">{item.name || item.title}</h3>
      <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{item.price}</p>
    </div>
  );
}
