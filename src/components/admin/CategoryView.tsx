'use client';

import React, { useState, useMemo } from 'react';
import { Package, ArrowLeft } from 'lucide-react';
import ProductUploadForm from '@/app/admin/dashboard/category/[categoryName]/components/ProductUploadForm';
import CategoryProductList from '@/app/admin/dashboard/category/[categoryName]/components/CategoryProductList';
import { useCategoryProducts, useInvalidateCategoryCache } from '@/hooks/useCategoryCache';

interface CategoryViewProps {
  categoryName: string;
  onBack: () => void;
  darkMode: boolean;
}

export default function CategoryView({ categoryName, onBack, darkMode }: CategoryViewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: products = [], isLoading, error } = useCategoryProducts(categoryName);
  const { invalidateCategory } = useInvalidateCategoryCache();

  const handleProductAdded = () => {
    // Invalidate cache for this category to trigger refetch
    invalidateCategory(categoryName);
    // Trigger refresh of the product list
    setRefreshKey((prev) => prev + 1);
  };

  const handleProductsUpdated = () => {
    invalidateCategory(categoryName);
  };

  const formattedCategoryName = useMemo(() => {
    return categoryName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [categoryName]);

  return (
    <div className={`${darkMode ? 'bg-[#0A0A0A] text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header with back button */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-amber-700" />
          <h1 className="text-3xl font-bold">{formattedCategoryName}</h1>
        </div>
        <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage products for the {formattedCategoryName} category
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error?.message || 'Failed to load products'}
        </div>
      )}

      {/* Loading State */}
      {isLoading && products.length === 0 && (
        <div className="mb-8 rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6 text-sm text-blue-100">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-blue-200"></div>
            <div>
              <h2 className="font-bold text-white">Loading Products</h2>
              <p>Fetching products for {formattedCategoryName}...</p>
            </div>
          </div>
        </div>
      )}

      {/* Product Upload Form */}
      <div className="mb-8">
        <ProductUploadForm
          category={categoryName}
          onProductAdded={handleProductAdded}
        />
      </div>

      {/* Product List */}
      <div>
        <CategoryProductList
          categoryName={categoryName}
          refreshKey={refreshKey}
          onProductsUpdated={handleProductsUpdated}
          initialProducts={products}
        />
      </div>
    </div>
  );
}
