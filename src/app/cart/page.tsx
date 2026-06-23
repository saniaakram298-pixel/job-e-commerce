"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/price';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useCart();

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cart]
  );

  return (
    <div>
      <header className="fixed top-0 w-full z-50 px-6 md:px-12 py-6 flex justify-between items-center bg-stone-50/80 backdrop-blur-xl">
        <div className="font-serif text-2xl font-bold tracking-widest text-primary uppercase">
          THE ATELIER
        </div>
        <nav className="hidden md:flex space-x-12">
          <Link href="/" className="text-secondary hover:text-primary uppercase tracking-widest text-xs">
            Home
          </Link>
          <Link href="/collections" className="text-secondary hover:text-primary uppercase tracking-widest text-xs">
            Collections
          </Link>
        </nav>
        <div className="flex items-center space-x-6">
          <Link href="/wishlist" className="material-symbols-outlined text-primary text-[24px]">favorite</Link>
          <Link href="/cart" className="material-symbols-outlined text-primary text-[24px]">shopping_bag</Link>
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 md:px-12 max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-serif text-5xl tracking-tighter">Shopping Bag</h1>
          <Link href="/" className="text-xs uppercase tracking-widest font-semibold text-stone-600 hover:text-stone-900 transition-colors">
            ← Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {cart.length === 0 ? (
                <div className="rounded-3xl border border-stone-200 bg-stone-50 p-12 text-center text-stone-500">
                  Your cart is empty. Add items from home or collections to continue.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={`${item.id}-${item.size || 'default'}`} className="flex flex-col gap-6 pb-8 border-b border-surface-variant md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-6">
                      <div className="w-24 h-32 bg-surface-container-low flex-shrink-0 overflow-hidden rounded-xl">
                        <img
                          src={item.img || item.images?.[0] || '/api/placeholder/100/150'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg mb-2">{item.name}</h3>
                        {item.size && (
                          <p className="text-sm text-secondary mb-2">Size: {item.size}</p>
                        )}
                        <p className="text-sm text-secondary mb-4">{item.cat || item.category}</p>

                        <div className="flex items-center gap-4">
                          <label className="text-sm uppercase tracking-widest font-bold">Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, Number(e.target.value), item.size)}
                            className="w-16 border-b border-outline-variant py-1 text-center focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 text-right md:items-end">
                      <p className="text-lg font-light">{formatCurrency(Number(item.price) * item.quantity)}</p>
                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="text-primary text-sm uppercase tracking-widest hover:text-primary-fixed"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-surface-container-low p-8 sticky top-32 rounded-3xl border border-stone-200">
              <h2 className="font-serif text-2xl mb-6 tracking-tighter">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>$25.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatCurrency(subtotal * 0.08)}</span>
                </div>
              </div>
              <div className="border-t border-surface-variant pt-4 mb-6">
                <div className="flex justify-between font-serif text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal + 25 + subtotal * 0.08)}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="w-full inline-flex justify-center px-6 py-4 bg-primary text-on-primary text-sm uppercase tracking-widest font-bold text-center hover:bg-primary-container transition block"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/collections"
                className="w-full inline-flex justify-center px-6 py-4 border border-outline-variant text-sm uppercase tracking-widest font-bold text-center hover:bg-surface-container-high transition block mt-4"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
