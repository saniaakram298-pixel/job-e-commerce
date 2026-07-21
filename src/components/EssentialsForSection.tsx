"use client";

import Image from "next/image";
import { memo } from "react";
import { ArrowRight } from "lucide-react";

interface EssentialItem {
  id: string;
  title: string;
  category: string;
  image: string;
}

const essentialItems: EssentialItem[] = [
  {
    id: "1",
    title: "Denim Suit Top / Ivory",
    category: "OUTERWEAR",
    image: "/images/arrival-2.png",
  },
  {
    id: "2",
    title: "Atelier Clutch / Black",
    category: "ACCESSORIES",
    image: "/images/arrival-3.png",
  },
  {
    id: "3",
    title: "Evening Ensemble",
    category: "EDITORIAL",
    image: "/images/essentials-3.webp",
  },
];

function EssentialsForSection() {
  return (
    <section className="relative w-full bg-[#0A0A0A] py-16 lg:py-24 px-4 md:px-8 xl:px-16">
      {/* HEADER */}
      <div className="mb-12 lg:mb-16 text-center">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white mb-4 tracking-tight">
          Essential Forms
        </h2>
        <p className="text-[#C5A059] text-xs md:text-sm tracking-[0.3em] uppercase font-medium">
          THE SS26 EDITORIAL SELECTION
        </p>
      </div>

      {/* GRID LAYOUT */}
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* LEFT - LARGE IMAGE */}
<div className="relative h-[500px] md:h-[700px] lg:h-full">
            <Image
              src="/images/3.webp"
              alt="Essential Forms Main"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          </div>

          {/* RIGHT - GRID OF PRODUCTS AND LARGE IMAGE */}
          <div className="flex flex-col gap-6 lg:gap-8">
            {/* TOP - 2 PRODUCT CARDS */}
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              {essentialItems.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-[3/4] overflow-hidden rounded-xl shadow-lg cursor-pointer"
                >
                  <Image
  src={item.image}
  alt={item.title}
  fill
  className="object-cover group-hover:scale-110 transition-transform duration-500"
 />

                  {/* DARK OVERLAY */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* PRODUCT INFO */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-[8px] uppercase tracking-[0.2em] text-[#C5A059] font-medium mb-1">
                      {item.category}
                    </p>
                    <p className="text-xs md:text-sm font-light line-clamp-2">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* BOTTOM - LARGE IMAGE */}
            <div className="relative h-[250px] md:h-[320px] lg:h-[340px] overflow-hidden rounded-2xl shadow-2xl group">
              <Image
                src="/images/2.png"
                alt="Essential Forms Secondary"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>

        {/* CTA BUTTON */}
        
      </div>
    </section>
  );
}

export default memo(EssentialsForSection);
