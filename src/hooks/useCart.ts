import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';

interface CartStore {
  items: CartItem[];
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  setCart: (items: CartItem[], totalPrice: number) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      totalPrice: 0,

      addItem: (item: CartItem) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.productId === item.productId && i.size === item.size && i.color === item.color
          );

          if (existingItem) {
            existingItem.quantity += item.quantity;
          } else {
            state.items.push(item);
          }

          const newTotal = state.items.reduce((total, i) => total + i.price * i.quantity, 0);
          return { items: state.items, totalPrice: newTotal };
        });
      },

      removeItem: (productId: string, size?: string, color?: string) => {
        set((state) => {
          const filtered = state.items.filter(
            (i) => !(i.productId === productId && i.size === size && i.color === color)
          );
          const newTotal = filtered.reduce((total, i) => total + i.price * i.quantity, 0);
          return { items: filtered, totalPrice: newTotal };
        });
      },

      updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => {
        set((state) => {
          const item = state.items.find(
            (i) => i.productId === productId && i.size === size && i.color === color
          );
          if (item) {
            item.quantity = quantity;
          }
          const newTotal = state.items.reduce((total, i) => total + i.price * i.quantity, 0);
          return { items: state.items, totalPrice: newTotal };
        });
      },

      clearCart: () => {
        set({ items: [], totalPrice: 0 });
      },

      setCart: (items: CartItem[], totalPrice: number) => {
        set({ items, totalPrice });
      },
    }),
    {
      name: 'cart-store',
    }
  )
);
