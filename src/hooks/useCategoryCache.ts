import { create } from 'zustand';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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

interface CategoryCacheState {
  categoryCache: Record<string, Product[]>;
  setCategoryProducts: (category: string, products: Product[]) => void;
  getCategoryProducts: (category: string) => Product[] | null;
  clearCategoryCache: (category?: string) => void;
}

export const useCategoryCacheStore = create<CategoryCacheState>((set, get) => ({
  categoryCache: {},
  
  setCategoryProducts: (category: string, products: Product[]) =>
    set((state) => ({
      categoryCache: {
        ...state.categoryCache,
        [category]: products,
      },
    })),

  getCategoryProducts: (category: string) => {
    const state = get();
    return state.categoryCache[category] || null;
  },

  clearCategoryCache: (category?: string) =>
    set((state) => {
      if (!category) {
        return { categoryCache: {} };
      }
      const newCache = { ...state.categoryCache };
      delete newCache[category];
      return { categoryCache: newCache };
    }),
}));

/**
 * Hook to fetch and cache products by category
 * Uses Zustand for client-side cache + TanStack Query for data fetching
 */
export function useCategoryProducts(category: string | null) {
  const queryClient = useQueryClient();
  const { getCategoryProducts, setCategoryProducts } = useCategoryCacheStore();

  const query = useQuery<Product[], Error>({
    queryKey: ['category-products', category],
    queryFn: async () => {
      if (!category) return [];

      // Check cache first
      const cached = getCategoryProducts(category);
      if (cached) {
        return cached;
      }

      // Fetch from API
     

      try {
        const response = await fetch(
          `/api/products?category=${encodeURIComponent(category)}&page=1&limit=20&sort=newest`,
          
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch products for category: ${category}`);
        }

        const data = await response.json();
        const products = Array.isArray(data?.data?.products) ? data.data.products : [];

        // Properly serialize products
        const serialized = products.map((item: any) => ({
          _id: item._id?.toString?.() ?? String(item._id),
          title: item.title || item.name || 'Untitled product',
          name: item.name || item.title || 'Untitled product',
          price: Number(item.price || 0),
          discountPrice: item.discountPrice != null ? Number(item.discountPrice) : undefined,
          img: item.img || (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : ''),
          images: Array.isArray(item.images) ? item.images : [],
          category: item.category || '',
          stock: Number(item.stock ?? 0),
          description: item.description || '',
          collection: item.collection || '',
          sizes: Array.isArray(item.sizes)
            ? item.sizes.map((s: any) => ({ size: s.size, stock: s.stock }))
            : [],
          colors: Array.isArray(item.colors)
            ? item.colors.map((c: any) => ({ color: c.color, stock: c.stock }))
            : [],
        }));

        // Store in cache
        setCategoryProducts(category, serialized);
        return serialized;
      } catch (error) {
        console.error(`Error fetching products for category ${category}:`, error);
        throw error;
      } 
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!category,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  return query;
}

/**
 * Invalidate category cache when products are added/updated/deleted
 */
export function useInvalidateCategoryCache() {
  const queryClient = useQueryClient();
  const { clearCategoryCache } = useCategoryCacheStore();

  return {
    invalidateCategory: (category: string) => {
      clearCategoryCache(category);
      queryClient.invalidateQueries({ queryKey: ['category-products', category] });
    },
    invalidateAll: () => {
      clearCategoryCache();
      queryClient.invalidateQueries({ queryKey: ['category-products'] });
    },
  };
}
