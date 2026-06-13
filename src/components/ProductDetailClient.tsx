'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const safeProduct = {
    name: product.name || 'Product',
    description: product.description || '',
    price: typeof product.price === 'number' ? product.price : Number(product.price) || 0,
    images: Array.isArray(product.images) ? product.images : [],
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    colors: Array.isArray(product.colors) ? product.colors : [],
    collection: product.collection || '',
    category: product.category || '',
    careInstructions: product.careInstructions || '',
  };

  const [selectedSize, setSelectedSize] = useState<string>(
    safeProduct.sizes[0]?.size || ''
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    safeProduct.colors[0]?.color || ''
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  const selectedSizeStock =
    safeProduct.sizes.find((entry) => entry.size === selectedSize)?.stock ?? 0;
  const mainImage =
    safeProduct.images[selectedImageIndex] || safeProduct.images[0] || '/images/hero.png';

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]">
      <nav className="p-8 flex justify-between items-center border-b border-stone-200 sticky top-0 bg-[#fcf9f8]/90 backdrop-blur-md z-50">
        <Link href="/new-arrivals" className="text-[10px] font-bold tracking-[0.3em] uppercase hover:opacity-50 transition-all">
          ← Back to Collection
        </Link>
        <div className="text-xl font-serif italic font-bold tracking-tighter">THE ATELIER</div>
        <div className="w-20" />
      </nav>

      <main className="max-w-[1400px] mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-6">
          <div className="relative aspect-[3/4] bg-stone-200 overflow-hidden shadow-2xl">
            <Image
              src={mainImage}
              alt={`${product.name} product image`}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            {product.images?.map((image, index) => (
              <button
                key={image + index}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={`relative aspect-[3/4] overflow-hidden rounded-sm border transition ${
                  selectedImageIndex === index ? 'border-black' : 'border-stone-200'
                }`}
              >
                <Image src={image} alt={`${product.name} thumbnail ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>

          <div className="bg-white p-8 border border-stone-100 italic shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2">Atelier Privilege</p>
            <p className="text-sm font-serif leading-relaxed">{product.careInstructions || product.description}</p>
          </div>
        </div>

        <div className="space-y-12">
          <div className="space-y-4">
            <p className="text-[10px] font-bold tracking-[0.5em] text-stone-400 uppercase">{product.collection || product.category}</p>
            <h1 className="text-6xl font-serif italic tracking-tighter leading-none">{product.name}</h1>
            <div className="flex items-center gap-6">
              <p className="text-3xl font-bold tracking-tighter">${product.price.toLocaleString()}</p>
              {selectedSizeStock > 0 ? (
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
              {product.sizes?.map((entry) => (
                <button
                  key={entry.size}
                  type="button"
                  disabled={entry.stock <= 0}
                  onClick={() => setSelectedSize(entry.size)}
                  className={`w-16 h-16 border text-[11px] font-bold transition-all flex items-center justify-center ${
                    entry.stock <= 0
                      ? 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed line-through'
                      : selectedSize === entry.size
                      ? 'bg-black text-white border-black scale-105 shadow-lg'
                      : 'bg-white border-stone-200 hover:border-black'
                  }`}
                >
                  {entry.size}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-[10px] font-bold uppercase tracking-widest">Color: <span className="text-stone-400 font-normal">{selectedColor || product.colors?.[0]?.color || 'Standard'}</span></p>
            <div className="flex flex-wrap gap-4">
              {product.colors?.map((entry) => (
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
              disabled={selectedSizeStock === 0}
              className={`w-full py-7 text-[11px] font-bold tracking-[0.5em] uppercase transition-all shadow-xl ${
                selectedSizeStock === 0
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-stone-800 active:scale-[0.98]'
              }`}
            >
              {selectedSizeStock > 0 ? 'Add to Bag' : 'Sold Out'}
            </button>
          </div>

          <div className="pt-12 border-t border-stone-200 space-y-8">
            <div>
              <p className="text-[10px] font-bold uppercase mb-4 tracking-[0.3em]">The Craftsmanship</p>
              <p className="text-sm text-stone-600 leading-relaxed font-light italic">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
