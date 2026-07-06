'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import ProductUploadForm from './components/ProductUploadForm';
import CategoryProductList from './components/CategoryProductList';

interface Product {
  _id: string;
  title: string;
  price: number;
  discountPrice?: number;
  img: string;
  category: string;
  stock: number;
  sizes?: Array<{ size: string; stock: number }>;
  colors?: Array<{ color: string; stock: number }>;
  description?: string;
  collection?: string;
}

interface CategoryPageClientProps {
  categoryName: string;
  initialProducts: Product[];
  initialError: string | null;
}

export default function CategoryPageClient({
  categoryName,
  initialProducts,
  initialError,
}: CategoryPageClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [error, setError] = useState<string | null>(initialError);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setProducts(initialProducts);
    setError(initialError);
  }, [initialProducts, initialError]);

  const handleProductAdded = useCallback(() => {
    // Trigger refresh by incrementing the key
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleProductsUpdated = useCallback((updatedProducts: Product[]) => {
    setProducts(updatedProducts);
  }, []);

  const formattedCategoryName = categoryName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-amber-700" />
          <h1 className="text-3xl font-bold text-gray-800">{formattedCategoryName}</h1>
        </div>
        <p className="text-gray-600 mt-2">Manage products for the {formattedCategoryName} category</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
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
