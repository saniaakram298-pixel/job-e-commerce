"use client";

import { memo } from "react";

function StaticVideoSection() {
  return (
    <section className="relative w-full h-[600px] flex items-center justify-center bg-[#0A0A0A] overflow-hidden">
      
      {/* LEFT: Editorial Content */}
      <div className="hidden lg:flex w-1/3 flex-col justify-center pl-16 z-30">
        <span className="text-[#C5A059] text-[10px] tracking-[0.3em] uppercase mb-4 font-medium">Vol. 04 / Issue 26</span>
        <h2 className="text-white text-6xl font-serif leading-[0.9] tracking-tighter">
          THE NEW<br />REALISM
        </h2>
        <p className="text-white/60 mt-6 max-w-[280px] leading-relaxed text-sm font-light">
          An exploration of texture, light, and the quiet power of understated luxury. Spring / Summer 2026.
        </p>
        <button className="mt-8 flex items-center gap-4 text-white text-[10px] uppercase tracking-[0.2em]">
          <div className="w-8 h-[1px] bg-white"></div> View Catalogue
        </button>
      </div>

      {/* CENTER: Portrait Video (Fixed Ratio) */}
      <div className="h-full w-auto aspect-[9/16] relative">
        <video
          className="h-full w-full object-cover" 
          playsInline muted autoPlay loop preload="auto"
        >
          <source src="/video/20267.webm" type="video/webm" />
        </video>
        {/* Location Tag (Bottom Left of Video) */}
        <div className="absolute bottom-6 left-6 text-white z-30">
          <p className="text-[8px] uppercase tracking-[0.2em] opacity-70">Location</p>
          <p className="text-[10px] italic">Paris, Rue de Rivoli</p>
        </div>
      </div>

      {/* RIGHT: Stats/Sustainability Column */}
      <div className="hidden lg:flex w-1/3 flex-col justify-between py-12 pr-16 z-30">
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/50">Sustainability Mark</p>
          <p className="text-white/80 text-sm max-w-[200px] ml-auto mt-2 italic">
            "Every thread tells a story of ethical craftsmanship and environmental mindfulness."
          </p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-bold text-white">350+</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Artisanal Pieces</p>
        </div>
      </div>

    </section>
  );
}

export default memo(StaticVideoSection);