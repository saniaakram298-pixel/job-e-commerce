import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Order } from '@/types';

interface OrdersStoreState {
  orders: Order[];
  initialized: boolean;
  isLoading: boolean;
  error: string | null;
  setOrders: (orders: Order[]) => void;
  initializeOrders: (orders: Order[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  optimisticUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
  optimisticRemoveOrder: (orderId: string) => void;
  resetOrders: () => void;
}

export const useOrdersStore = create<OrdersStoreState>()(
  persist(
    (set) => ({
      orders: [],
      initialized: false,
      isLoading: false,
      error: null,

      setOrders: (orders) => set({ orders, initialized: true, isLoading: false, error: null }),

      initializeOrders: (orders) => set({ orders, initialized: true, isLoading: false, error: null }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error, isLoading: false }),

      optimisticUpdateOrder: (orderId, updates) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order._id === orderId ? { ...order, ...updates } : order
          ),
        })),

      optimisticRemoveOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((order) => order._id !== orderId),
        })),

      resetOrders: () => set({ orders: [], initialized: false, isLoading: false, error: null }),
    }),
    {
      name: 'admin-orders-cache',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return undefined as never;
        }
        return sessionStorage;
      }),
      partialize: (state) => ({
        orders: state.orders,
        initialized: state.initialized,
      }),
    }
  )
);
