'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, AlertCircle } from 'lucide-react';
import Fuse from 'fuse.js';
import { useRouter } from 'next/navigation';
import { useClickAway } from 'react-use';

interface Product {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  image?: string;
}

export default function SmartSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const router = useRouter();
  const ref = useRef(null);

  // Initialize Fuse.js with product data
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setAllProducts(data.products || []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };

    fetchProducts();
  }, []);

  // Perform fuzzy search when query changes
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setError('');
      return;
    }

    if (allProducts.length === 0) {
      setError('No products available');
      return;
    }

    setIsLoading(true);

    // Configure Fuse.js options for typo tolerance and relevance
    const fuse = new Fuse(allProducts, {
      keys: ['name', 'description', 'category'],
      threshold: 0.4, // Allows for typos and partial matches
      minMatchCharLength: 2,
      ignoreLocation: true,
      useExtendedSearch: true,
      distance: 100,
    });

    try {
      const searchResults = fuse.search(query);
      
      // Limit results to top 8 and check if results are irrelevant
      const limitedResults = searchResults.slice(0, 8).map((result: any) => result.item);
      
      if (searchResults.length === 0 && query.length > 0) {
        setError(`No results found for "${query}". Try a different search.`);
        setResults([]);
      } else {
        setError('');
        setResults(limitedResults);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, allProducts]);

  // Close dropdown when clicking outside
  useClickAway(ref, () => setIsOpen(false));

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
    setQuery('');
    setIsOpen(false);
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setError('');
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Search products... (handles typos)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 bg-white border border-stone-300 rounded-lg
                     focus:outline-none focus:ring-1 focus:ring-stone-500 focus:border-transparent
                     transition-all duration-200 text-sm text-stone-900 placeholder-stone-500"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
        {query && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-stone-100 rounded"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-stone-400" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (query.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-lg shadow-lg z-50">
          {isLoading && (
            <div className="p-4 text-center text-stone-600">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Searching...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 flex items-start gap-3 bg-stone-50 border-t border-stone-200">
              <AlertCircle className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-stone-600">{error}</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <ul className="max-h-96 overflow-y-auto">
              {results.map((product, index) => (
                <li
                  key={product._id}
                  className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50 transition-colors"
                >
                  <button
                    onClick={() => handleProductClick(product._id)}
                    className="w-full text-left p-3 flex items-center gap-3"
                  >
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {product.name}
                      </p>
                      {product.category && (
                        <p className="text-xs text-stone-500">{product.category}</p>
                      )}
                    </div>
                    {product.price && (
                      <p className="text-sm font-medium text-stone-600 flex-shrink-0">
                        ${product.price}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!isLoading && results.length === 0 && !error && query.length > 0 && (
            <div className="p-4 text-center text-stone-500 text-sm">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
