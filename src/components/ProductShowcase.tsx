"use client";

import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
  tags?: string[];
  category?: string;
  description?: string;
  averageRating?: number;
  totalReviews?: number;
  rating?: number;
}

interface ProductShowcaseProps {
  title?: string;
  description?: string;
  limit?: number;
  category?: string;
  featured?: boolean;
}

export default function ProductShowcase({
  title = "Featured Collection",
  description = "Discover our curated selection of premium fashion",
  limit = 12,
  category,
  featured = false,
}: ProductShowcaseProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (category) params.append('category', category);
        if (featured) params.append('featured', 'true');
        params.append('page', '1');

        const response = await fetch(`/api/products?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        
        if (data.success && data.data.products) {
          setProducts(data.data.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit, category, featured]);

  return (
    <section className="w-full py-16 md:py-24 px-4 md:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            {title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-semibold mt-4">Loading products...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12 bg-white rounded-2xl border border-red-200">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-600 font-semibold">No products available</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                _id={product._id}
                name={product.name}
                price={product.price}
                discountPrice={product.discountPrice}
                images={product.images}
                tags={product.tags}
                category={product.category}
                description={product.description}
                averageRating={product.averageRating || product.rating || 0}
                totalReviews={product.totalReviews || 0}
              />
            ))}
          </div>
        )}

        {/* View All Button */}
        {!loading && !error && products.length > 0 && (
          <div className="text-center mt-16">
            <a
              href="/products"
              className="inline-block bg-gray-900 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
            >
              View All Products →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
