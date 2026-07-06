'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Arrival } from '@/types';

interface CartItem extends Arrival {
  quantity: number;
  size?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Arrival, quantity?: number, size?: string) => void;
  updateQuantity: (id: string | number, quantity: number, size?: string) => void;
  removeFromCart: (id: string | number, size?: string) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getSafeStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [persistCart, setPersistCart] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    const storage = getSafeStorage();
    if (!storage) return;

    try {
      const savedCart = storage.getItem('atelier-cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (e) {
      console.error('Failed to parse cart', e);
    }
  }, []);

  useEffect(() => {
    if (!isMounted || !persistCart) return;

    const storage = getSafeStorage();
    if (!storage) return;

    try {
      const lightweightCart = cart.map(({ images, ...item }) => item);
      storage.setItem('atelier-cart', JSON.stringify(lightweightCart));
    } catch (error: unknown) {
      const isQuotaError =
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

      if (isQuotaError) {
        console.warn('LocalStorage full ho gaya hai.');
        setPersistCart(false);
      }
    }
  }, [cart, isMounted, persistCart]);

  const addToCart = (product: Arrival, quantity: number = 1, size?: string) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === product.id && (item.size || undefined) === (size || undefined));

      if (existingIndex >= 0) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [...prevCart, { ...product, quantity, ...(size ? { size } : {}) }];
    });
  };

  const updateQuantity = (id: string | number, quantity: number, size?: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && (item.size || undefined) === (size || undefined)
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const removeFromCart = (id: string | number, size?: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.id === id && (item.size || undefined) === (size || undefined)))
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};