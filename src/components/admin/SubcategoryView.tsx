'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Package, ArrowLeft, Download, Upload, Trash2, Edit2, Eye, Plus } from 'lucide-react';
import { useSubcategoryProducts, useSubcategoryStore } from '@/hooks/useSubcategoryStore';
import { getTotalStock } from '@/lib/productStock';

interface SubcategoryViewProps {
  categoryName: string;
  subcategoryName: string;
  onBack: () => void;
  darkMode: boolean;
}

export default function SubcategoryView({
  categoryName,
  subcategoryName,
  onBack,
  darkMode,
}: SubcategoryViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showProductForm, setShowProductForm] = useState(false);

  const store = useSubcategoryStore();
  const hasHydrated = useSubcategoryStore.persist.hasHydrated();
  const { fetchNextPage, getLoadedProducts, getData } = useSubcategoryProducts(categoryName, subcategoryName);

  const handleLoadMore = useCallback(async (pageNum: number = currentPage) => {
    setIsLoadingMore(true);
    try {
      await fetchNextPage(pageNum, pageSize);
      setCurrentPage(pageNum);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchNextPage, pageSize, currentPage]);

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Delete this product permanently?')) return;

    const previousData = store.getSubcategoryData(categoryName, subcategoryName);
    store.optimisticRemoveProduct(categoryName, subcategoryName, productId);

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Delete error:', error);
      if (previousData) {
        store.setSubcategorySnapshot(categoryName, subcategoryName, previousData);
      }
      alert('Failed to delete product');
    }
  };

  const handleUpdate = async (productId: string, updatedData: any) => {
    const previousData = store.getSubcategoryData(categoryName, subcategoryName);
    store.optimisticUpdateProduct(categoryName, subcategoryName, productId, updatedData);

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }
    } catch (error) {
      console.error('Update error:', error);
      if (previousData) {
        store.setSubcategorySnapshot(categoryName, subcategoryName, previousData);
      }
      alert('Failed to update product');
    }
  };

  // Load initial data when component mounts, but reuse persisted cache first
  useEffect(() => {
    if (!hasHydrated) return;

    const existingData = store.getSubcategoryData(categoryName, subcategoryName);
    if (existingData && existingData.products.length > 0) {
      return;
    }

    handleLoadMore(1);
  }, [categoryName, subcategoryName, hasHydrated, store, handleLoadMore]);

  const subcategoryData = getData();
  const loadedProducts = getLoadedProducts();

  const formattedSubcategoryName = useMemo(() => {
    return subcategoryName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [subcategoryName]);

  const formattedCategoryName = useMemo(() => {
    return categoryName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [categoryName]);

  return (
    <div className={`${darkMode ? 'bg-[#0A0A0A] text-gray-200' : 'bg-gray-50 text-gray-900'} min-h-screen p-6`}>
      {/* Header with back button */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-amber-700" />
          <div>
            <h1 className="text-3xl font-bold">{formattedCategoryName}</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Sub-category: {formattedSubcategoryName}
            </p>
          </div>
        </div>
      </div>

      {/* Stats and Controls */}
      <div className={`mb-6 rounded-lg p-4 ${darkMode ? 'bg-[#1A1A1A] border-gray-800' : 'bg-white border-gray-200'} border flex items-center justify-between`}>
        <div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Products</p>
          <p className="text-2xl font-bold">{subcategoryData?.total ?? 0}</p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Loaded: {loadedProducts.length} / Remaining: {Math.max(0, (subcategoryData?.total ?? 0) - loadedProducts.length)}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowProductForm(!showProductForm)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Error Message */}
      {subcategoryData?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {subcategoryData.error}
        </div>
      )}

      {/* Loading State */}
      {subcategoryData?.isLoading && loadedProducts.length === 0 && (
        <div className="mb-8 rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6 text-sm text-blue-100">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-blue-200"></div>
            <div>
              <h2 className="font-bold text-white">Loading Products</h2>
              <p>Fetching products from {formattedSubcategoryName}...</p>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {loadedProducts.map((product) => (
          <div
            key={product._id}
            className={`rounded-lg border ${darkMode ? 'bg-[#1A1A1A] border-gray-800' : 'bg-white border-gray-200'} overflow-hidden hover:shadow-lg transition-shadow`}
          >
            {/* Product Image */}
            <div className="relative h-48 bg-gray-200 overflow-hidden">
              {product.img ? (
                <img
                  src={product.img}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                  <Package className="w-8 h-8 text-gray-500" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-bold text-sm line-clamp-2 mb-2">{product.name}</h3>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-amber-700">₹{product.price}</p>
                  {product.discountPrice && (
                    <p className={`text-xs line-through ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      ₹{product.discountPrice}
                    </p>
                  )}
                </div>
                <p className={`text-xs px-2 py-1 rounded ${getTotalStock(product) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  Stock: {getTotalStock(product)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    // Open edit modal
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-blue-600 hover:bg-blue-50 rounded transition-colors text-sm"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    // Open view modal
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-green-600 hover:bg-green-50 rounded transition-colors text-sm"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {subcategoryData?.hasMore && !isLoadingMore && (
        <div className="flex justify-center mb-8">
          <button
            onClick={() => handleLoadMore(currentPage + 1)}
            className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium"
          >
            Load More Products
          </button>
        </div>
      )}

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="flex justify-center mb-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-700 border-t-amber-200"></div>
        </div>
      )}

      {/* Empty State */}
      {!subcategoryData?.isLoading && loadedProducts.length === 0 && !subcategoryData?.error && (
        <div className={`rounded-lg border-2 border-dashed ${darkMode ? 'border-gray-700' : 'border-gray-300'} p-12 text-center`}>
          <Package className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            No products yet
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mb-4`}>
            Add your first product to get started
          </p>
          <button
            onClick={() => setShowProductForm(true)}
            className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
          >
            Add First Product
          </button>
        </div>
      )}
    </div>
  );
}
