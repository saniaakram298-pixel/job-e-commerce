'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface Product {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  collection?: string;
  price?: number;
  images?: string[];
}

async function fetchSearchResults(query: string) {
  const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=24`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch search results');
  }

  const json = await response.json();
  return (json.data?.products ?? []) as Product[];
}

export default function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const onToggle = (e: Event) => setOpen(Boolean((e as CustomEvent).detail));
    window.addEventListener('atelier:toggle-search', onToggle as EventListener);
    return () => window.removeEventListener('atelier:toggle-search', onToggle as EventListener);
  }, []);

  const query = useQuery<Product[], Error>({
    queryKey: ['search-products', searchTerm],
    queryFn: () => fetchSearchResults(searchTerm),
    enabled: open && searchTerm.trim().length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const results: Product[] = query.data ?? [];
  const { isLoading, isError, error } = query;

  const handleClose = () => {
    setOpen(false);
    setSearchTerm('');
  };

  const handleResultClick = (productId: string) => {
    setOpen(false);
    router.push(`/products/${productId}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative z-60 w-full max-w-2xl bg-white rounded-lg p-6 shadow-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <input
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products, collections..."
              className="w-full px-4 py-3 border rounded outline-none focus:ring-2 focus:ring-stone-400"
            />
            <button
              onClick={handleClose}
              className="px-4 py-3 bg-black text-white rounded hover:bg-stone-800 transition"
            >
              Close
            </button>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
            Type a product name, category, collection, or description to search.
          </div>

          <div className="max-h-[430px] overflow-y-auto rounded-lg border border-stone-200 bg-white">
            {searchTerm.trim().length === 0 ? (
              <div className="p-6 text-stone-500">Start typing to search products...</div>
            ) : isLoading ? (
              <div className="p-6 text-stone-600">Searching products…</div>
            ) : isError ? (
              <div className="p-6 text-red-600">
                {(error as Error)?.message || 'Unable to fetch search results.'}
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-stone-500">No products found for &quot;{searchTerm}&quot;.</div>
            ) : (
              <ul>
                {results.map((product) => (
                  <li key={product._id} className="border-b border-stone-100 last:border-b-0">
                    <button
                      onClick={() => handleResultClick(product._id)}
                      className="w-full text-left p-4 flex items-center gap-4 hover:bg-stone-50 transition"
                    >
                      <div className="flex-shrink-0 h-16 w-16 overflow-hidden rounded bg-stone-100">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-stone-900 truncate">{product.name}</p>
                        <p className="text-xs text-stone-500 truncate">
                          {product.collection ?? product.category ?? 'Product'}
                        </p>
                      </div>
                      {product.price != null && (
                        <span className="text-sm font-medium text-stone-700">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
