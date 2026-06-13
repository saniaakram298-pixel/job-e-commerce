"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getCategoryDisplayName, fetchProductsByCategory } from '@/lib/categoryData';
import { ProductCategory } from '@/models/Product';
import { ChevronDown, Grid3x3, List } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
  tags?: string[];
  category?: string;
  featured: boolean;
}

export default function CategoryPage() {
  const params = useParams();
  const categoryParam = params.category as string;
  const category = categoryParam?.toLowerCase().replace(/-/g, '-') as ProductCategory;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [scrolled, setScrolled] = useState(false);

  const itemsPerPage = 20;

  // Fetch products when category or page changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchProductsByCategory(category, page, itemsPerPage);
        
        if (result.products.length === 0 && page === 1) {
          setError(`No products found in ${getCategoryDisplayName(category)}`);
        }

        setProducts(result.products);
        setTotalPages(result.pages);
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchData();
    }
  }, [category, page]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categoryName = getCategoryDisplayName(category);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar scrolled={scrolled} />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            {categoryName}
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            Explore our complete collection of {categoryName.toLowerCase()} products,
            carefully curated for you.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="w-full py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Filters & View Toggle */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewType('grid')}
                className={`p-2 rounded-lg transition ${
                  viewType === 'grid'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Grid view"
              >
                <Grid3x3 size={20} />
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`p-2 rounded-lg transition ${
                  viewType === 'list'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="List view"
              >
                <List size={20} />
              </button>
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="trending">Trending</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" size={18} />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-semibold">Loading products...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <p className="text-red-600 font-semibold text-lg">{error}</p>
            </div>
          )}

          {/* Products Grid/List */}
          {!loading && !error && products.length > 0 && (
            <>
              <div
                className={
                  viewType === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'
                    : 'space-y-6 mb-12'
                }
              >
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    _id={product._id}
                    name={product.name}
                    price={product.price}
                    discountPrice={product.discountPrice}
                    images={product.images}
                    tags={product.tags}
                    category={category}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-8 border-t border-gray-200">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = page > 3 ? page - 2 + i : i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 rounded-lg font-semibold transition ${
                          page === pageNum
                            ? 'bg-gray-900 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg mb-4">No products available in this category yet.</p>
              <a
                href="/collections"
                className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-semibold"
              >
                Explore All Collections
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
