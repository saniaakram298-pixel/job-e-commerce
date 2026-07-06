'use client';

import Link from 'next/link';
import { Arrival } from '@/types';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import QuickView from './QuickView';

interface ProductCardClientProps {
    product: Arrival;
}

export default function ProductCardClient({ product }: ProductCardClientProps) {
    const { addToCart } = useCart();
    const [quick, setQuick] = useState<any>(null);

    return (
        <div className="min-w-[280px] md:min-w-[320px] lg:min-w-[350px] group snap-start">
            <div className="bg-stone-50 aspect-[3/4] mb-6 overflow-hidden relative">
                <div className="absolute top-4 left-4 z-10">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[9px] tracking-widest uppercase font-bold text-black">
                        New
                    </span>
                </div>

                <img
                    src={product.img || product.images?.[0] || '/images/hero.png'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />

                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6 space-x-3">
                    <button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    addToCart(product);
  }}
  className="w-full bg-black text-white py-3 text-[10px] uppercase tracking-widest translate-y-0 sm:translate-y-4 sm:group-hover:translate-y-0 transition-transform duration-500 hover:bg-stone-800"
>
  Quick Add
</button>
                    <button
                        onClick={() => setQuick(product)}
                        className="absolute top-4 right-4 bg-white/95 text-black px-3 py-2 text-[11px] rounded opacity-0 group-hover:opacity-100 transition"
                        aria-label="Quick view"
                    >
                        Quick View
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="font-serif text-lg tracking-tight text-black">
                    {product.name}
                </h3>
                <p className="text-stone-400 text-[11px] uppercase tracking-widest">
                    {product.cat || product.category}
                </p>
                <div className="flex justify-between items-center mt-2">
                    <p className="text-black text-sm font-medium">
                        {product.price}
                    </p>
                    <Link
                        href={`/product/${product._id || product.id}`}
                        className="text-[10px] text-stone-500 underline underline-offset-4 hover:text-black transition-all uppercase tracking-tighter"
                    >
                        View Details
                    </Link>
                </div>
            </div>

            {quick && <QuickView product={quick} onClose={() => setQuick(null)} />}
        </div>
    );
}
