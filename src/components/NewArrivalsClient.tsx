'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCardClient from './ProductCardClient';
import { Arrival } from '@/types';
import { ArrowRight } from 'lucide-react';

interface NewArrivalsClientProps {
  initialArrivals?: Arrival[];
}

export default function NewArrivalsClient({ initialArrivals = [] }: NewArrivalsClientProps) {
  const [displayArrivals, setDisplayArrivals] = useState<Arrival[]>(initialArrivals);
  const [loading, setLoading] = useState(initialArrivals.length === 0);

  useEffect(() => {
    if (initialArrivals.length > 0) {
      setLoading(false);
      return;
    }

    let mounted = true;
    async function fetchArrivals() {
      try {
        setLoading(true);
        const res = await fetch('/api/products/new-arrivals');
        const json = await res.json();
        const data = json?.data?.products || json?.products || [];
        if (!mounted) return;
        setDisplayArrivals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch new arrivals:', err);
        if (mounted) setDisplayArrivals([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchArrivals();
    return () => { mounted = false; };
  }, [initialArrivals.length]);

  return (
    <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 bg-white">
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 border-b border-stone-100 pb-6">
        <div>
          <h2 className="font-serif text-4xl tracking-tighter uppercase italic text-black">New Arrivals</h2>
          <p className="text-stone-400 text-xs tracking-widest mt-2 uppercase">Spring / Summer 2026 Collection</p>
        </div>
        <Link href="/collections" className="text-[10px] uppercase tracking-[0.2em] border-b border-black pb-1 hover:text-stone-500 transition-colors">View All Arrivals</Link>
      </div>

      <div className="flex overflow-x-auto gap-8 pb-10 scrollbar-hide snap-x snap-mandatory">
        {loading ? (
          <div className="w-full text-center py-20 text-stone-400">Loading...</div>
        ) : displayArrivals.length > 0 ? (
          <>
            {displayArrivals.map((product) => (
              <ProductCardClient key={String(product._id ?? product.id)} product={product} />
            ))}

            {displayArrivals.length >= 10 && (
              <Link href="/collections" className="min-w-[280px] md:min-w-[320px] flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-2xl bg-stone-50/50 hover:bg-stone-50 transition-all group p-6 snap-start">
                <div className="p-4 bg-white rounded-full shadow-sm border border-stone-100 group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-5 h-5 text-black" />
                </div>
                <span className="text-xs uppercase tracking-widest font-bold text-black mt-4">View More Items</span>
                <span className="text-[10px] text-stone-400 mt-1 uppercase tracking-tight">Explore Full Collection</span>
              </Link>
            )}
          </>
        ) : (
          <div className="w-full text-center text-stone-400 py-20">No arrivals found.</div>
        )}
      </div>
    </section>
  );
}
