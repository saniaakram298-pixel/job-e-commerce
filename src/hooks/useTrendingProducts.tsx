"use client";

import { QueryClient, useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Arrival } from '@/types';

async function fetchJSON(url: string) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

export function makeQueryClient() {
  return new QueryClient();
}

export function useTrendingProducts(limit = 60): UseQueryResult<{ products: Arrival[]; total: number }, unknown> {
  return useQuery<{ products: Arrival[]; total: number }>({
    queryKey: ['trending-products', limit],
    queryFn: async () => {
      const url = `/api/products/trending?offset=0&limit=${encodeURIComponent(String(limit))}`;
      const data = await fetchJSON(url);
      const rawProducts = Array.isArray(data?.data?.products)
        ? data.data.products
        : Array.isArray(data?.products)
        ? data.products
        : [];

      const items = rawProducts.map((product: any) => ({
        ...(product as any),
        _id: product._id || product.id,
        id: product.id || product._id || String(product._id || product.id || ''),
        images: product.images ?? ((product as any).img ? [(product as any).img] : []),
        img: product.img || (Array.isArray(product.images) && product.images[0]) || '',
        category: product.category || product.cat || '',
        cat: product.cat || product.category || '',
        isTrending: product.isTrending ?? product.trending ?? false,
        trending: product.trending ?? product.isTrending ?? false,
      }));

      return {
        products: items,
        total: items.length,
      };
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
