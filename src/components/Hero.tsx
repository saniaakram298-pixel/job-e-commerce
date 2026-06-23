'use client';

import Link from 'next/link';
import { HeroData } from '@/types';

interface HeroProps {
  data: HeroData;
}

export default function Hero({ data }: HeroProps) {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      <img
        src={data.imagePath}
        alt="Hero Banner"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-white text-center p-6">
        <h1 className="font-serif text-6xl md:text-[100px] leading-tight tracking-tighter mb-8 drop-shadow-2xl">
          {data.title}
        </h1>
        {data.subtitle && (
          <p className="max-w-3xl text-sm md:text-base text-white/80 mb-6 leading-relaxed">
            {data.subtitle}
          </p>
        )}
        <Link
          href={data.href}
          className="inline-block px-8 py-4 bg-transparent text-white border border-white/50 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all duration-300"
        >
          {data.buttonText}
        </Link>
      </div>
    </section>
  );
}
