"use client";

import { useQuery } from '@tanstack/react-query';

async function fetchJSON(url: string) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await fetchJSON('/api/categories');
      return data?.categories || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCategoryProducts(categorySlug: string, limit = 3) {
  return useQuery<any[]>({
    queryKey: ['category-products', categorySlug, limit],
    queryFn: async () => {
      if (!categorySlug) return [];
      const data = await fetchJSON(`/api/products?category=${encodeURIComponent(categorySlug)}&limit=${limit}`);
      // API returns { products } or { data: { products } }
      if (Array.isArray(data?.products)) return data.products;
      if (Array.isArray(data?.data?.products)) return data.data.products;
      return [];
    },
    enabled: Boolean(categorySlug),
    staleTime: 1000 * 60,
  });
}
