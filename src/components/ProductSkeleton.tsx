'use client';

/**
 * ProductSkeleton Component
 * Displays skeleton loaders for products while data is loading
 * Used for above-the-fold optimization
 */

export function ProductSkeletonCard() {
  return (
    <div className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[3/4] overflow-hidden bg-stone-200" />

      {/* Content skeleton */}
      <div className="space-y-2 p-4">
        {/* Product name skeleton */}
        <div className="h-5 bg-stone-200 rounded w-3/4" />
        
        {/* Price skeleton */}
        <div className="h-4 bg-stone-200 rounded w-1/3" />
      </div>
    </div>
  );
}

interface ProductSkeletonGridProps {
  count?: number;
  columns?: number;
}

/**
 * ProductSkeletonGrid
 * Displays multiple skeleton cards for grid layout
 * Perfect for above-the-fold loading state
 */
export function ProductSkeletonGrid({ count = 4, columns = 3 }: ProductSkeletonGridProps) {
  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeletonCard key={`skeleton-${index}`} />
      ))}
    </div>
  );
}

/**
 * FullPageProductSkeleton
 * Complete page skeleton including header and grid
 * Renders immediately on navigation for instant UI
 */
export function FullPageProductSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-3 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-1/3" />
        <div className="h-4 bg-stone-200 rounded w-1/2" />
      </div>

      {/* Info bar skeleton */}
      <div className="h-5 bg-stone-200 rounded w-1/4 animate-pulse" />

      {/* Product grid skeleton */}
      <ProductSkeletonGrid count={4} columns={3} />
    </div>
  );
}

export default ProductSkeletonCard;
