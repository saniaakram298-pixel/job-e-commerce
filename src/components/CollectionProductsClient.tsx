'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { ProductSkeletonCard, ProductSkeletonGrid } from './ProductSkeleton';

interface CollectionProduct {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface CollectionProductsClientProps {
  products: CollectionProduct[];
  totalProducts: number;
  categorySlug: string;
  initialVisibleCount?: number;
  batchSize?: number;
}

/**
 * CollectionProductsClient - OPTIMIZED FOR INSTANT NAVIGATION
 * 
 * Key Features:
 * ✅ Shows initial 4 products instantly (server-rendered)
 * ✅ Skeleton placeholders for remaining products (visible but not loaded)
 * ✅ Infinite scroll with Intersection Observer
 * ✅ No blocking API calls
 * ✅ Lazy loading of images
 * ✅ Efficient state management with useCallback
 */
export default function CollectionProductsClient({
  products,
  totalProducts,
  categorySlug,
  initialVisibleCount = 4,
  batchSize = 4,
}: CollectionProductsClientProps) {
  const [loadedProducts, setLoadedProducts] = useState<CollectionProduct[]>(products || []);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(totalProducts > (products?.length || 0));
  const [isInitialized, setIsInitialized] = useState(true);
  
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isFetchingRef = useRef(false);

  // Calculate remaining skeleton placeholders
  const reservedCount = Math.max(0, totalProducts - loadedProducts.length);

  // Reset when category changes
  useEffect(() => {
    setLoadedProducts(products || []);
    setPage(1);
    setLoadingMore(false);
    setHasMoreProducts(totalProducts > (products?.length || 0));
    setIsInitialized(true);
    isFetchingRef.current = false;
  }, [categorySlug, products, totalProducts]);

  /**
   * Fetch more products - runs in background without blocking UI
   */
  const fetchMoreProducts = useCallback(async () => {
    if (loadingMore || !hasMoreProducts || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoadingMore(true);

    try {
      const response = await fetch(
        `/api/products?category=${encodeURIComponent(categorySlug)}&page=${page + 1}&limit=${batchSize}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error('Unable to load more products');
      }

      const data = await response.json();
      const payload = data?.data ?? data;
      const nextProducts = Array.isArray(payload?.products)
        ? payload.products.map((product: any) => ({
            id: String(product._id || product.id || ''),
            name: product.name || 'Untitled product',
            price: Number(product.price || 0),
            image: product.img || product.image || '/images/arrival-1.png',
          }))
        : [];

      if (nextProducts.length > 0) {
        const updatedProducts = [...loadedProducts, ...nextProducts];
        setLoadedProducts(updatedProducts);
        setPage((prev) => prev + 1);
        setHasMoreProducts(updatedProducts.length < totalProducts);
      } else {
        setHasMoreProducts(false);
      }
    } catch (error) {
      console.error('Failed to load more collection products:', error);
      setHasMoreProducts(false);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [categorySlug, page, loadingMore, hasMoreProducts, loadedProducts, batchSize]);

  /**
   * Intersection Observer for infinite scroll
   * Loads products when user scrolls near bottom
   */
  useEffect(() => {
    if (!sentinelRef.current || !hasMoreProducts) {
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !loadingMore && !isFetchingRef.current) {
          void fetchMoreProducts();
        }
      },
      { rootMargin: '220px 0px', threshold: 0.01 }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMoreProducts, loadingMore, fetchMoreProducts]);

  // Empty state
  if (!products?.length && totalProducts === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-8 text-center text-sm text-stone-600">
        <p className="font-medium">No products found</p>
        <p className="mt-1 text-xs text-stone-500">Check back soon for new items in this collection.</p>
      </div>
    );
  }

  return (
    <>
      {/* Product count display */}
      <div className="mb-4 flex items-center justify-between text-sm text-stone-600">
        <span>
          Showing <strong>{loadedProducts.length}</strong> of <strong>{totalProducts}</strong> products
        </span>
        {hasMoreProducts && !loadingMore && (
          <span className="text-xs uppercase tracking-[0.25em] text-stone-400 animate-pulse">
            Scroll to reveal more
          </span>
        )}
      </div>

      {/* Product Grid with Skeletons */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Loaded products */}
        {loadedProducts.map((product) => (
          <div
            key={product.id}
            className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <Link href={`/product/${product.id}`} className="block">
              <div className="aspect-[3/4] overflow-hidden bg-stone-100">
                <img
                  src={product.image || '/images/arrival-1.png'}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            </Link>

            <div className="space-y-3 p-4">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-stone-900 line-clamp-2">{product.name}</h2>
                <p className="text-sm text-stone-600">${Number(product.price || 0).toFixed(2)}</p>
              </div>

              <Link
                href={`/product/${product.id}`}
                className="inline-flex w-full items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}

        {/* Skeleton placeholders for remaining products */}
        {reservedCount > 0 && <ProductSkeletonGrid count={Math.min(reservedCount, batchSize)} columns={3} />}
      </div>

      {/* Infinite scroll sentinel */}
      {hasMoreProducts && (
        <div ref={sentinelRef} className="mt-12 flex justify-center py-8">
          <div className="flex items-center gap-2 text-sm text-stone-500">
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading more products...</span>
              </>
            ) : (
              <span className="text-xs text-stone-400">Scroll for more</span>
            )}
          </div>
        </div>
      )}
    </>
  );
}