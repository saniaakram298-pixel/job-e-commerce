"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product as SharedProduct } from '@/types';
import ProductDetailModal from '@/components/ProductDetailClient';
import BackButton from '@/components/BackButton';
import Navbar from '@/components/Navbar';

const PAGE_LIMIT = 8; // 🔥 fast load
const ITEM_STAGGER_MS = 10;

type CollectionProduct = Partial<SharedProduct> & {
  id: string;
  _id: string;
  name: string;
  title: string;
  price: string;
  numericPrice: number;
  img: string;
  category: string;
  createdAt: string;
  stock?: number;
};

interface Section {
  title: string;
  category: string;
  items: CollectionProduct[];
}

interface CollectionsFetchResponse {
  collections: CollectionProduct[];
  categories: string[];
  currentCategory?: string;
}

interface Props {
  initialData?: CollectionsFetchResponse | null;
}

async function fetchCategoryProducts(category: string) {
  const res = await fetch(`/api/collections?category=${category}&limit=${PAGE_LIMIT}`);
  const data = await res.json();
  return data.collections ?? [];
}

export default function CollectionsClient({ initialData }: Props) {
  const initialCategories = initialData?.categories ?? [];
  const primaryCategory = initialData?.currentCategory ?? initialCategories[0];

  const [sections, setSections] = useState<Section[]>([
    {
      title: `${primaryCategory} Collection`,
      category: primaryCategory,
      items: initialData?.collections ?? [],
    },
  ]);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const started = useRef(false);

  // 🔥 AUTO CAROUSEL
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => prev + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // 🔥 SEQUENTIAL LOAD (FAST)
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const load = async () => {
      const rest = initialCategories.filter(c => c !== primaryCategory);

      for (const cat of rest) {
        const items = await fetchCategoryProducts(cat);

        setSections(prev => [
          ...prev,
          { title: `${cat} Collection`, category: cat, items }
        ]);
      }

      setIsLoadingCategories(false);
    };

    load();
  }, []);

  const currentImages = useMemo(() => {
    const current = sections.find(s => s.category === primaryCategory);
    return current?.items?.slice(0, 4) ?? [];
  }, [sections, primaryCategory]);

  return (
    <main className="min-h-screen bg-white">
      <Navbar scrolled={false} />

      {/* 🔥 NEW HERO SECTION */}
     <section className="grid md:grid-cols-2 gap-12 items-center px-6 md:px-20 py-20">

  {/* LEFT CONTENT */}
  <div className="space-y-6">
    <h1 className="text-6xl md:text-7xl font-serif italic tracking-tight text-neutral-900">
      Atelier
    </h1>

    <p className="text-lg text-neutral-500 max-w-md leading-relaxed">
      Discover refined silhouettes, timeless cuts, and modern elegance crafted for every moment.
    </p>

    <button className="mt-4 border border-black px-6 py-3 text-sm hover:bg-black hover:text-white transition">
      Explore Collection
    </button>
  </div>

  {/* RIGHT CAROUSEL */}
  <div className="relative h-[420px] flex items-center justify-center">

    {currentImages.map((img, index) => {
      const position = (index - carouselIndex) % currentImages.length;

      return (
        <div
          key={index}
          className={`absolute transition-all duration-700 ease-in-out rounded-2xl overflow-hidden shadow-lg
          
          ${position === 0 ? "z-30 scale-100 opacity-100" : ""}
          ${position === -1 || position === currentImages.length - 1 ? "z-20 scale-90 -translate-x-32 opacity-60" : ""}
          ${position === 1 || position === -(currentImages.length - 1) ? "z-20 scale-90 translate-x-32 opacity-60" : ""}
          ${Math.abs(position) > 1 ? "opacity-0 scale-75" : ""}
          
          `}
          style={{ width: "260px", height: "360px" }}
        >
          <Image
            src={img.img}
            alt=""
            fill
            className="object-cover"
          />
        </div>
      );
    })}
  </div>

</section>

      {/* MAIN GRID */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-4 gap-8">

          {/* SIDEBAR */}
          <aside>
            {initialCategories.map(cat => (
              <Link key={cat} href={`/collections/${cat}`}>
                <p className="py-1 hover:underline">{cat}</p>
              </Link>
            ))}
          </aside>

          {/* PRODUCTS */}
          <div className="md:col-span-3">

            <BackButton />

            {sections.map((section, idx) => (
              <div key={section.category} className="mb-16">
                <h2 className="text-2xl font-semibold mb-6">
                  {section.title}
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                  {section.items.map((item, i) => (
                    <ProductCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}

            {isLoadingCategories && (
              <p className="text-center text-gray-400">
                Loading more...
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ProductCard({ item }: { item: CollectionProduct }) {
  return (
    <div className="border rounded-xl overflow-hidden hover:shadow-lg transition">
      <div className="relative h-72">
        <Image src={item.img} alt="" fill className="object-cover" />
      </div>

      <div className="p-4">
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-sm text-gray-500">{item.price}</p>
      </div>
    </div>
  );
}