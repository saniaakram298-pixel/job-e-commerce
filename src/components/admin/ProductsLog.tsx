"use client";

import React, { useEffect, useState } from 'react';
import { Search, Eye, Trash2, ArrowRight } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  img?: string;
  createdAt: string;
  featured?: boolean;
  active?: boolean;
  stock?: number;
  sizes?: Array<{ size: string; stock: number }>;
  colors?: Array<{ color: string; stock: number }>;
}

interface ProductsLogProps {
  darkMode?: boolean;
  onRefresh?: () => void;
  categoryFilter?: string;
}

export const ProductsLog: React.FC<ProductsLogProps> = ({ darkMode = false, onRefresh, categoryFilter }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    'all',
    'bridal',
    'groom',
    'formal',
    'informal',
    'children',
    'men',
    'women',
    'old-people',
    'young',
    'new-arrival',
    'accessories',
  ];

  const calculateTotalStock = (product: Product): number => {
    if (product.stock !== undefined) return product.stock;
    let total = 0;
    if (Array.isArray(product.sizes)) {
      total += product.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
    }
    if (Array.isArray(product.colors)) {
      total += product.colors.reduce((sum, c) => sum + (c.stock || 0), 0);
    }
    return total;
  };

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = selectedCategory === 'all'
        ? '/api/products?limit=100&sort=newest'
        : `/api/products?category=${selectedCategory}&limit=100&sort=newest`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load products');

      const data = await response.json();
      const fetchedProducts = Array.isArray(data.products) ? data.products : [];
      setProducts(fetchedProducts.slice(0, 50)); // Show latest 50 products
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryFilter && categoryFilter.trim() && categoryFilter !== 'all') {
      setSelectedCategory(categoryFilter);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Delete this product permanently?')) return;

    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      setProducts(prev => prev.filter(p => p._id !== productId));
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const handleViewOnFrontend = (productId: string, category: string) => {
    window.open(`/products/${category}/${productId}`, '_blank');
  };

  const bgClass = darkMode ? 'bg-[#0F0F0F] border-neutral-800' : 'bg-white border-neutral-200';
  const inputClass = darkMode
    ? 'bg-neutral-900 border-neutral-700 text-gray-200 placeholder:text-neutral-500'
    : 'bg-white border-neutral-200 text-gray-900 placeholder:text-neutral-400';

  return (
    <div className={`rounded-2xl border ${bgClass} p-6 space-y-6`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Log</h2>
          <p className="text-sm opacity-60">Recently added products - Auto-synced from admin submissions</p>
        </div>
        <button
          onClick={loadProducts}
          className="px-4 py-2 bg-[#E5A93A] text-black font-semibold rounded-lg hover:bg-[#d49830] transition"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium transition ${
              selectedCategory === cat
                ? 'bg-[#E5A93A] text-black'
                : darkMode
                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
            }`}
          >
            {cat === 'all' ? 'All Products' : cat.replace('-', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-12 opacity-60">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E5A93A] border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm">Loading products...</p>
        </div>
      ) : products.length > 0 ? (
        <div className={`overflow-x-auto rounded-lg border ${darkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
          <table className="w-full text-sm">
            <thead>
              <tr
                className={`${
                  darkMode
                    ? 'bg-neutral-900 border-b border-neutral-800'
                    : 'bg-neutral-50 border-b border-neutral-200'
                } text-[11px] font-bold uppercase tracking-wider opacity-60`}
              >
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr
                  key={product._id}
                  className={`${
                    darkMode
                      ? 'border-b border-neutral-800 hover:bg-neutral-800/50'
                      : 'border-b border-neutral-200 hover:bg-neutral-50'
                  } transition`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0] || product.img || '/placeholder.jpg'}
                        alt={product.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs opacity-60 truncate">{product.description?.slice(0, 40)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        darkMode
                          ? 'bg-neutral-800 text-neutral-300'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {product.category.replace('-', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#E5A93A]">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={calculateTotalStock(product) > 5 ? 'text-green-600' : 'text-orange-600'}>
                      {calculateTotalStock(product)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewOnFrontend(product._id, product.category)}
                        title="View on frontend"
                        className="p-1.5 rounded hover:bg-[#E5A93A]/20 text-[#E5A93A] transition"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        title="Delete product"
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className={`py-12 text-center rounded-lg ${darkMode ? 'bg-neutral-900' : 'bg-neutral-100'}`}
        >
          <Search className="w-12 h-12 opacity-20 mx-auto mb-3" />
          <p className="opacity-60">No products found in this category</p>
        </div>
      )}
    </div>
  );
};
