'use client';

import React, { useState } from 'react';
import { getTotalStock } from '@/lib/productStock';

import { useRouter } from "next/navigation";
import { Product, Arrival } from '@/types';
import { useCart } from '@/context/CartContext';
import { buildGuestOrderPayload } from '@/lib/orderPayloads';
import { toastManager } from '@/lib/toast';
import ProductReviews from '@/components/ProductReviews';
import router from 'next/dist/client/router';

interface ProductDetailClientProps {
  product: Partial<Product> | null;
  isOpen?: boolean;
  onClose?: () => void;
}

function normalizeSizes(sizes: unknown) {
  if (!Array.isArray(sizes)) return [];
  return sizes
    .map((entry: any) => ({
      size: String(entry?.size ?? '').trim(),
      stock: Number(entry?.stock ?? 0),
    }))
    .filter((entry) => entry.size);
}

function normalizeColors(colors: unknown) {
  if (!Array.isArray(colors)) return [];
  return colors
    .map((entry: any) => ({
      color: String(entry?.color ?? '').trim(),
      stock: Number(entry?.stock ?? 0),
    }))
    .filter((entry) => entry.color);
}

function normalizeImages(images: unknown, fallback?: unknown) {
  const safeImages = Array.isArray(images)
    ? images.filter((img) => typeof img === 'string')
    : [];
  if (safeImages.length > 0) return safeImages;
  return typeof fallback === 'string' && fallback ? [fallback] : [];
}

export default function ProductDetailClient({ product, isOpen, onClose }: ProductDetailClientProps) {
  const { addToCart } = useCart();

  const safeProduct = {
    _id: String(product?._id || ''),
    name: String(product?.name || 'Product'),
    description: String(product?.description || ''),
    price: typeof product?.price === 'number' ? product.price : Number(product?.price) || 0,
    images: normalizeImages(product?.images, product?.img),
    sizes: normalizeSizes(product?.sizes),
    colors: normalizeColors(product?.colors),
    collection: String(product?.collection || ''),
    category: String(product?.category || ''),
    careInstructions: String(product?.careInstructions || ''),
  };

  const [selectedSize, setSelectedSize] = useState<string>(
    safeProduct.sizes[0]?.size || ''
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    safeProduct.colors[0]?.color || ''
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');

  if (!product) {
    return null;
  }

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setShowOrderForm(false);
      setOrderMessage('');
    }
  };

  const orderItems = [
    {
      productId: safeProduct._id,
      name: safeProduct.name,
      quantity: 1,
      price: safeProduct.price,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    },
  ];

  const handleProceed = () => {
    setShowOrderForm(true);
    setOrderMessage('');
    setOrderSuccess('');
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim() || !customerEmail.trim() || !street.trim() || !city.trim() || !stateName.trim() || !zipCode.trim() || !country.trim()) {
      setOrderMessage('Please fill in all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      setOrderMessage('Please enter a valid email address.');
      return;
    }

    const confirm = window.confirm('Do you want to confirm your order?');
    if (!confirm) return;

    setIsSubmittingOrder(true);
    setOrderMessage('');

    try {
      const payload = buildGuestOrderPayload({
        type: 'guest',
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress: {
          street,
          city,
          state: stateName,
          zipCode,
          country,
        },
        billingAddress: {
          street,
          city,
          state: stateName,
          zipCode,
          country,
        },
        paymentMethod: 'cash-on-delivery',
        items: orderItems.map((item) => ({
          ...item,
          productId: String(item.productId || ''),
        })),
        totalPrice: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      });

      const response = await fetch('/api/guest-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || 'Failed to place the order');
      }

      setOrderSuccess('Order placed successfully! A confirmation email was sent.');
      setOrderMessage('');
    } catch (error: any) {
      setOrderMessage(error?.message || 'Unable to submit order. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const selectedSizeStock =
    safeProduct.sizes.find((entry) => entry.size === selectedSize)?.stock ?? 0;
  const hasSizeOptions = safeProduct.sizes.length > 0;
  const totalStock = getTotalStock({ sizes: safeProduct.sizes, colors: safeProduct.colors });
  const canAddToCart = !hasSizeOptions || selectedSizeStock > 0;
  const mainImage =
    safeProduct.images[selectedImageIndex] || safeProduct.images[0] || '';
  const hasGallery = safeProduct.images.length > 1;

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]">
      <nav className="p-8 flex justify-between items-center border-b border-stone-200 sticky top-0 bg-[#fcf9f8]/90 backdrop-blur-md z-50">
      
      {/* BACK BUTTON */}
     <button
  onClick={() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  }}
  className="text-[10px] font-bold tracking-[0.3em] uppercase hover:opacity-50 transition-all"
>
  ← Back
</button>

      {/* LOGO */}
      <div className="text-xl font-serif italic font-bold tracking-tighter">
        THE ATELIER
      </div>

      <div className="w-20" />
    </nav>

      <main className="max-w-[1400px] mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="flex flex-col gap-6">
          <div className="flex gap-6 items-start">
            <div className="flex flex-col gap-3 w-28">
              {safeProduct.images?.map((image, index) => (
                <button
                  key={image + index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative overflow-hidden rounded-sm border transition ${
                    selectedImageIndex === index ? 'border-black' : 'border-stone-200'
                  }`}
                >
                  <img src={image} alt={`${safeProduct.name} thumbnail ${index + 1}`} className="w-full h-24 object-cover" />
                </button>
              ))}
            </div>

            <div className="relative aspect-[3/4] bg-stone-200 overflow-hidden shadow-2xl flex-1">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={`${safeProduct.name} product image`}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-stone-500">No image available</div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 border border-stone-100 italic shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2">Atelier Privilege</p>
            <p className="text-sm font-serif leading-relaxed">{safeProduct.description || safeProduct.careInstructions}</p>
          </div>
        </div>

        <div className="space-y-12">
          <div className="space-y-4">
            <p className="text-[10px] font-bold tracking-[0.5em] text-stone-400 uppercase">{safeProduct.collection || safeProduct.category}</p>
            <h1 className="text-6xl font-serif italic tracking-tighter leading-none">{safeProduct.name}</h1>
            <div className="flex items-center gap-6">
              <p className="text-3xl font-bold tracking-tighter">${safeProduct.price.toLocaleString()}</p>
              {totalStock > 0 ? (
                <span className="text-[9px] font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full uppercase tracking-widest">In Stock</span>
              ) : (
                <span className="text-[9px] font-bold bg-red-50 text-red-700 px-3 py-1 rounded-full uppercase tracking-widest">Sold Out</span>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-bold uppercase tracking-widest">Select Size</p>
              {selectedSizeStock > 0 && selectedSizeStock < 5 && (
                <p className="text-[9px] text-orange-600 font-bold uppercase italic animate-pulse">Low Stock: {selectedSizeStock} left</p>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              {safeProduct.sizes.map((entry) => (
                <button
                  key={entry.size}
                  type="button"
                  disabled={entry.stock <= 0}
                  onClick={() => setSelectedSize(entry.size)}
                  className={`w-24 h-20 border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                    entry.stock <= 0
                      ? 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed line-through'
                      : selectedSize === entry.size
                      ? 'bg-black text-white border-black scale-105 shadow-lg'
                      : 'bg-white border-stone-200 hover:border-black'
                  }`}
                >
                  <span>{entry.size}</span>
                  <span className="text-[9px] font-normal">{entry.stock > 0 ? `${entry.stock} left` : 'Out of stock'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-[10px] font-bold uppercase tracking-widest">Color: <span className="text-stone-400 font-normal">{selectedColor || safeProduct.colors[0]?.color || 'Standard'}</span></p>
            <div className="flex flex-wrap gap-4">
              {safeProduct.colors.map((entry) => (
                <button
                  key={entry.color}
                  type="button"
                  onClick={() => setSelectedColor(entry.color)}
                  className={`px-4 py-3 border text-[11px] uppercase tracking-[0.15em] transition ${
                    selectedColor === entry.color ? 'border-black bg-black text-white' : 'border-stone-200 hover:border-black'
                  }`}
                >
                  {entry.color}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <button
              type="button"
              disabled={!canAddToCart}
              onClick={() => {
                if (!canAddToCart) {
                  toastManager.error('This size is currently out of stock');
                  return;
                }

                const cartItem: Arrival = {
                  id: safeProduct._id,
                  name: safeProduct.name,
                  img: safeProduct.images[0] || product?.img || '',
                  price: String(safeProduct.price),
                  cat: safeProduct.category || safeProduct.collection,
                  category: safeProduct.category || safeProduct.collection,
                  images: safeProduct.images,
                  updatedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                };

                addToCart(cartItem, 1, hasSizeOptions ? selectedSize : undefined, selectedColor || undefined);
                toastManager.success('Added to cart');
                handleProceed();
                setDrawerOpen(true);
              }}
              className={`w-full py-7 rounded-none border border-black bg-black text-white text-base uppercase tracking-[0.2em] transition hover:bg-stone-900 disabled:bg-stone-200 disabled:text-stone-400 disabled:border-stone-200`}
            >
              {canAddToCart ? 'Add to Cart' : 'Sold Out'}
            </button>
          </div>

          <div className="pt-12 border-t border-stone-200 space-y-8">
            <div>
              <p className="text-[10px] font-bold uppercase mb-4 tracking-[0.3em]">The Craftsmanship</p>
              <p className="text-sm text-stone-600 leading-relaxed font-light italic">
                {safeProduct.description}
              </p>
            </div>
          </div>
        </div>
      </main>

      <div className="max-w-[1400px] mx-auto px-8 pb-20">
        <ProductReviews productId={safeProduct._id} productName={safeProduct.name} />
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end">
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => toggleDrawer(false)}
          />
          <aside className="relative w-full max-w-md h-full bg-white shadow-2xl border-l border-stone-200 p-8 overflow-y-auto transform transition-transform duration-300 translate-x-0">
            <button
              type="button"
              onClick={() => toggleDrawer(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-900"
            >
              Close
            </button>
            <div className="space-y-6 mt-8">
              <div className="flex gap-4 items-center">
                <div className="w-24 h-24 bg-stone-100 rounded-sm overflow-hidden">
                  <img
                    src={safeProduct.images[0] || product?.img || '/api/placeholder/100/100'}
                    alt={`${safeProduct.name} thumbnail`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm text-stone-500 uppercase tracking-[0.3em]">Added to Cart</p>
                  <h2 className="text-2xl font-serif italic tracking-tighter">{safeProduct.name}</h2>
                  <p className="text-lg font-bold mt-2">${safeProduct.price.toLocaleString()}</p>
                </div>
              </div>

              {!showOrderForm ? (
                <div className="space-y-4">
                  <p className="text-sm text-stone-600">Your item is ready. Proceed to complete the order below.</p>
                  <button
                    type="button"
                    onClick={handleProceed}
                    className="w-full px-6 py-4 border border-black bg-black text-white uppercase tracking-[0.2em]"
                  >
                    Proceed
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Contact Details</p>
                    <div className="mt-4 space-y-4">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Name"
                        className="w-full border border-stone-200 px-4 py-3 outline-none focus:border-black"
                      />
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full border border-stone-200 px-4 py-3 outline-none focus:border-black"
                      />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Phone"
                        className="w-full border border-stone-200 px-4 py-3 outline-none focus:border-black"
                      />
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Street"
                        className="w-full border border-stone-200 px-4 py-3 outline-none focus:border-black"
                      />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full border border-stone-200 px-4 py-3 outline-none focus:border-black"
                      />
                      <input
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        placeholder="State"
                        className="w-full border border-stone-200 px-4 py-3 outline-none focus:border-black"
                      />
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="ZIP Code"
                        className="w-full border border-stone-200 px-4 py-3 outline-none focus:border-black"
                      />
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="Country"
                        className="w-full border border-stone-200 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {orderMessage && <p className="text-sm text-red-600">{orderMessage}</p>}
                    {orderSuccess && <p className="text-sm text-green-600">{orderSuccess}</p>}
                    <button
                      type="button"
                      onClick={handleSubmitOrder}
                      disabled={isSubmittingOrder}
                      className="w-full px-6 py-4 border border-black bg-black text-white uppercase tracking-[0.2em] disabled:bg-stone-400"
                    >
                      {isSubmittingOrder ? 'Placing Order...' : 'Submit Order'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}