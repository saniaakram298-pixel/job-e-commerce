/**
 * Sub-Category Session Store
 * Persists subcategory and product data throughout admin session until logout
 * Uses Zustand for state management with lazy loading support
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface SubcategoryProduct {
  _id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  img: string;
  images: string[];
  category: string;
  subcategory: string;
  stock: number;
  sizes?: Array<{ size: string; stock: number }>;
  colors?: Array<{ color: string; stock: number }>;
  tags?: string[];
  collection?: string;
  featured?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubcategoryData {
  category: string;
  subcategory: string;
  products: SubcategoryProduct[];
  total: number;
  loadedCount: number;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
}

interface SubcategoryStoreState {
  // Data storage
  subcategoriesData: Map<string, SubcategoryData>;
  
  // Load tracking
  loadedPages: Map<string, Set<number>>;
  
  // Methods
  initializeSubcategory: (category: string, subcategory: string, total: number) => void;
  addProducts: (category: string, subcategory: string, products: SubcategoryProduct[], pageNumber: number) => void;
  getSubcategoryData: (category: string, subcategory: string) => SubcategoryData | undefined;
  setLoading: (category: string, subcategory: string, loading: boolean) => void;
  setError: (category: string, subcategory: string, error: string | null) => void;
  hasPageLoaded: (category: string, subcategory: string, pageNumber: number) => boolean;
  markPageLoaded: (category: string, subcategory: string, pageNumber: number) => void;
  clearSubcategory: (category: string, subcategory: string) => void;
  clearAll: () => void;
  setSubcategorySnapshot: (category: string, subcategory: string, snapshot: SubcategoryData) => void;
  optimisticRemoveProduct: (category: string, subcategory: string, productId: string) => void;
  optimisticUpdateProduct: (category: string, subcategory: string, productId: string, updates: Partial<SubcategoryProduct>) => void;
  getLoadedProducts: (category: string, subcategory: string) => SubcategoryProduct[];
  getTotalProducts: (category: string, subcategory: string) => number;
}

const getKey = (category: string, subcategory: string) => `${category}|${subcategory}`;

const serializeSubcategoryData = (map: Map<string, SubcategoryData>) =>
  Object.fromEntries(
    [...map.entries()].map(([key, value]) => [
      key,
      {
        ...value,
        products: value.products ?? [],
      },
    ])
  );

const deserializeSubcategoryData = (data: Record<string, any>) =>
  new Map(
    Object.entries(data).map(([key, value]) => [
      key,
      {
        ...value,
        products: Array.isArray(value?.products) ? value.products : [],
      },
    ])
  );

const serializeLoadedPages = (map: Map<string, Set<number>>) =>
  Object.fromEntries([...map.entries()].map(([key, value]) => [key, Array.from(value)]));

const deserializeLoadedPages = (data: Record<string, number[]>) =>
  new Map(Object.entries(data).map(([key, value]) => [key, new Set(Array.isArray(value) ? value : [])]));

export const useSubcategoryStore = create<SubcategoryStoreState>()(
  persist(
    (set, get) => ({
      subcategoriesData: new Map(),
      loadedPages: new Map(),

      initializeSubcategory: (category: string, subcategory: string, total: number) => {
    const key = getKey(category, subcategory);
    set((state) => {
      const newData = new Map(state.subcategoriesData);
      if (!newData.has(key)) {
        newData.set(key, {
          category,
          subcategory,
          products: [],
          total,
          loadedCount: 0,
          isLoading: true,
          hasMore: total > 0,
          error: null,
        });
      }
      return { subcategoriesData: newData };
    });
  },

  addProducts: (category: string, subcategory: string, products: SubcategoryProduct[], pageNumber: number) => {
    const key = getKey(category, subcategory);
    set((state) => {
      const newData = new Map(state.subcategoriesData);
      const existing = newData.get(key);

      if (existing) {
        const updatedProducts = [...existing.products, ...products];
        newData.set(key, {
          ...existing,
          products: updatedProducts,
          loadedCount: updatedProducts.length,
          isLoading: false,
          hasMore: updatedProducts.length < existing.total,
          error: null,
        });
      }

      return { subcategoriesData: newData };
    });

    // Mark page as loaded
    get().markPageLoaded(category, subcategory, pageNumber);
  },

  getSubcategoryData: (category: string, subcategory: string) => {
    const key = getKey(category, subcategory);
    return get().subcategoriesData.get(key);
  },

  setLoading: (category: string, subcategory: string, loading: boolean) => {
    const key = getKey(category, subcategory);
    set((state) => {
      const newData = new Map(state.subcategoriesData);
      const existing = newData.get(key);

      if (existing) {
        newData.set(key, { ...existing, isLoading: loading });
      }

      return { subcategoriesData: newData };
    });
  },

  setError: (category: string, subcategory: string, error: string | null) => {
    const key = getKey(category, subcategory);
    set((state) => {
      const newData = new Map(state.subcategoriesData);
      const existing = newData.get(key);

      if (existing) {
        newData.set(key, {
          ...existing,
          error,
          isLoading: false,
        });
      }

      return { subcategoriesData: newData };
    });
  },

  hasPageLoaded: (category: string, subcategory: string, pageNumber: number) => {
    const key = getKey(category, subcategory);
    return get().loadedPages.get(key)?.has(pageNumber) ?? false;
  },

  markPageLoaded: (category: string, subcategory: string, pageNumber: number) => {
    const key = getKey(category, subcategory);
    set((state) => {
      const newPages = new Map(state.loadedPages);
      const pageSet = newPages.get(key) || new Set();
      pageSet.add(pageNumber);
      newPages.set(key, pageSet);

      return { loadedPages: newPages };
    });
  },

  clearSubcategory: (category: string, subcategory: string) => {
    const key = getKey(category, subcategory);
    set((state) => {
      const newData = new Map(state.subcategoriesData);
      const newPages = new Map(state.loadedPages);

      newData.delete(key);
      newPages.delete(key);

      return { subcategoriesData: newData, loadedPages: newPages };
    });
  },

  clearAll: () => {
    set({ subcategoriesData: new Map(), loadedPages: new Map() });
  },

  setSubcategorySnapshot: (category: string, subcategory: string, snapshot: SubcategoryData) => {
    const key = getKey(category, subcategory);
    set((state) => {
      const newData = new Map(state.subcategoriesData);
      newData.set(key, snapshot);
      return { subcategoriesData: newData };
    });
  },

  optimisticRemoveProduct: (category: string, subcategory: string, productId: string) => {
    const key = getKey(category, subcategory);
    set((state) => {
      const newData = new Map(state.subcategoriesData);
      const existing = newData.get(key);

      if (!existing) {
        return state;
      }

      const filteredProducts = existing.products.filter((product) => product._id !== productId);
      const nextTotal = Math.max(0, existing.total - 1);

      newData.set(key, {
        ...existing,
        products: filteredProducts,
        total: nextTotal,
        loadedCount: filteredProducts.length,
        hasMore: filteredProducts.length < nextTotal,
        isLoading: false,
        error: null,
      });

      return { subcategoriesData: newData };
    });
  },

  optimisticUpdateProduct: (category: string, subcategory: string, productId: string, updates: Partial<SubcategoryProduct>) => {
    const key = getKey(category, subcategory);
    set((state) => {
      const newData = new Map(state.subcategoriesData);
      const existing = newData.get(key);

      if (!existing) {
        return state;
      }

      const updatedProducts = existing.products.map((product) =>
        product._id === productId ? { ...product, ...updates } : product
      );

      newData.set(key, {
        ...existing,
        products: updatedProducts,
        loadedCount: updatedProducts.length,
        isLoading: false,
        error: null,
      });

      return { subcategoriesData: newData };
    });
  },

  getLoadedProducts: (category: string, subcategory: string) => {
    const data = get().getSubcategoryData(category, subcategory);
    return data?.products ?? [];
  },

  getTotalProducts: (category: string, subcategory: string) => {
    const data = get().getSubcategoryData(category, subcategory);
    return data?.total ?? 0;
  },
    }),
    {
      name: 'subcategory-dashboard-cache',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return undefined as never;
        }
        return sessionStorage;
      }),
      partialize: (state) => ({
        subcategoriesData: serializeSubcategoryData(state.subcategoriesData),
        loadedPages: serializeLoadedPages(state.loadedPages),
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<SubcategoryStoreState> & {
          subcategoriesData?: Record<string, any>;
          loadedPages?: Record<string, number[]>;
        };

        return {
          ...currentState,
          ...state,
          subcategoriesData: deserializeSubcategoryData(state.subcategoriesData ?? {}),
          loadedPages: deserializeLoadedPages(state.loadedPages ?? {}),
        };
      },
    }
  )
);

/**
 * Hook to fetch products for a subcategory with lazy loading
 * Automatically tracks loaded pages and prevents duplicate requests
 */
export function useSubcategoryProducts(category: string | null, subcategory: string | null) {
  const store = useSubcategoryStore();

  const fetchNextPage = async (pageNumber: number = 1, limit: number = 12) => {
    if (!category || !subcategory) return { products: [], error: null };

    // Check if this page is already loaded
    if (store.hasPageLoaded(category, subcategory, pageNumber)) {
      const data = store.getSubcategoryData(category, subcategory);
      return { products: data?.products ?? [], error: null };
    }

    // Initialize if not exists
    if (!store.getSubcategoryData(category, subcategory)) {
      // First, get total count
      try {
        store.setLoading(category, subcategory, true);
        const countResponse = await fetch(
          `/api/products/subcategory/count?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`
        );

        if (!countResponse.ok) {
          throw new Error('Failed to get product count');
        }

        const countData = await countResponse.json();
        const total = countData.data?.total ?? 0;

        store.initializeSubcategory(category, subcategory, total);
      } catch (error) {
        store.setError(category, subcategory, error instanceof Error ? error.message : 'Failed to initialize subcategory');
        return { products: [], error: error instanceof Error ? error.message : 'Failed to initialize' };
      }
    }

    // Fetch products for this page
    try {
      store.setLoading(category, subcategory, true);

      const response = await fetch(
        `/api/products/subcategory?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}&page=${pageNumber}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      const products = Array.isArray(data?.data?.products) ? data.data.products : [];

      store.addProducts(category, subcategory, products, pageNumber);

      return { products, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
      store.setError(category, subcategory, errorMessage);
      return { products: [], error: errorMessage };
    }
  };

  const getLoadedProducts = () => {
    if (!category || !subcategory) return [];
    return store.getLoadedProducts(category, subcategory);
  };

  const getTotal = () => {
    if (!category || !subcategory) return 0;
    return store.getTotalProducts(category, subcategory);
  };

  const getData = () => {
    if (!category || !subcategory) return undefined;
    return store.getSubcategoryData(category, subcategory);
  };

  return {
    fetchNextPage,
    getLoadedProducts,
    getTotal,
    getData,
    clearData: () => category && subcategory && store.clearSubcategory(category, subcategory),
    clearAll: () => store.clearAll(),
  };
}
