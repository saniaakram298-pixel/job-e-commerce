"use client";

import Image from "next/image";
import { memo } from "react";
import { ChevronRight } from "lucide-react";

function StaticVideoSection() {
  return (
    <section className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] flex items-center justify-center bg-[#0A0A0A] overflow-hidden">
      {/* BIG BACKGROUND LETTERS */}
      <h1 className="absolute left-[2%] md:left-[5%] text-[120px] md:text-[180px] lg:text-[220px] font-serif text-white/5 select-none pointer-events-none">
        U
      </h1>
      <h1 className="absolute right-[2%] md:right-[5%] text-[120px] md:text-[180px] lg:text-[220px] font-serif text-white/5 select-none pointer-events-none">
        G
      </h1>

      {/* MOBILE LAYOUT */}
      <div className="lg:hidden w-full h-full flex flex-col items-center justify-center px-4 z-30">
        <div className="relative h-[300px] sm:h-[400px] w-full max-w-[300px] mb-8 overflow-hidden">
          <video
            className="h-full w-full object-cover rounded-lg"
            playsInline
            muted
            autoPlay
            loop
            preload="auto"
          >
            <source src="/video/20267.webm" type="video/webm" />
          </video>
          <div className="absolute bottom-4 left-4 text-white">
            <p className="text-[8px] uppercase tracking-[0.2em] opacity-70">Location</p>
            <p className="text-[10px] italic">Paris, Rue de Rivoli</p>
          </div>
        </div>

        <div className="text-center space-y-4">
          <span className="text-[#C5A059] text-[9px] tracking-[0.3em] uppercase font-medium">
            Vol. 04 / Issue 26
          </span>

          <h2 className="text-white text-4xl md:text-5xl font-serif leading-[1.1] tracking-tight">
            THE NEW<br />REALISM
          </h2>

          <p className="text-white/60 max-w-[280px] leading-relaxed text-xs md:text-sm font-light mx-auto">
            An exploration of texture, light, and the quiet power of understated luxury. Spring / Summer 2026.
          </p>

          <button className="mt-6 flex items-center justify-center gap-3 text-white text-[9px] uppercase tracking-[0.2em] group mx-auto">
            <span>View Catalogue</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex w-full h-full items-center justify-between px-8 xl:px-16">
        {/* LEFT CONTENT */}
        <div className="w-1/3 flex flex-col justify-center z-30">
          <span className="text-[#C5A059] text-[11px] tracking-[0.3em] uppercase mb-6 font-medium">
            Vol. 04 / Issue 26
          </span>

          <h2 className="text-white text-7xl font-serif leading-[0.95] tracking-tight mb-8">
            THE NEW<br />REALISM
          </h2>

          <p className="text-white/70 max-w-[300px] leading-relaxed text-sm font-light mb-10">
            An exploration of texture, light, and the quiet power of understated luxury. Spring / Summer 2026 captures the essence of modern élégance.
          </p>

          <button className="flex items-center gap-4 text-white text-[11px] uppercase tracking-[0.25em] group w-fit">
            <div className="w-8 h-[1px] bg-white group-hover:w-16 transition-all duration-300"></div>
            <span>View Catalogue</span>
          </button>
        </div>

        {/* CENTER VIDEO */}
        <div className="w-1/3 h-full flex items-center justify-center z-20">
          <div className="relative h-[90%] aspect-[9/16] overflow-hidden rounded-2xl shadow-2xl">
            <video
              className="h-full w-full object-cover"
              playsInline
              muted
              autoPlay
              loop
              preload="auto"
            >
              <source src="/video/20267.webm" type="video/webm" />
            </video>

            {/* DARK OVERLAY */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

            {/* LOCATION TAG */}
            <div className="absolute bottom-6 left-6 text-white z-30">
              <p className="text-[8px] uppercase tracking-[0.2em] opacity-70">Location</p>
              <p className="text-[11px] italic font-light">Paris, Rue de Rivoli</p>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT - RED BORDER FRAME */}
        <div className="w-1/3 h-[58%] flex flex-col justify-between items-center border-2 border-black-300 rounded-3xl px-6 py-12 z-30">
          {/* TOP - SUSTAINABILITY */}
          <div className="text-center space-y-3">
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#C5A059] font-medium">
              Sustainability Mark
            </p>

            <p className="text-white/80 text-xs leading-tight italic font-light max-w-[200px]">
              "Every thread tells a story of ethical craftsmanship and environmental mindfulness."
            </p>
          </div>

          {/* MIDDLE - PRODUCT IMAGE */}
          <div className="flex justify-center py-4">
            <div className="relative w-[110px] h-[140px] overflow-hidden rounded-lg shadow-lg border border-white/10">
              <Image
                src="/images/dress.png"
                alt="Dress"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* BOTTOM - STATS */}
          <div className="text-center space-y-1">
            <p className="text-5xl font-bold text-white leading-none">350+</p>
            <p className="text-[9px] uppercase tracking-[0.25em] text-white/70 font-medium">
              Artisanal Pieces
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(StaticVideoSection);