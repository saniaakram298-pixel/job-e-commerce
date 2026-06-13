'use client';

export default function LimitedEditions() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-bold">
            The Archive
          </span>
          <h2 className="font-serif text-4xl tracking-tighter mt-2">
            Limited Editions
          </h2>
        </div>
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden group">
          <img
            src="/images/editorial.png"
            alt="Embroidery Detail"
            className="w-full h-full object-cover transition duration-1000 group-hover:scale-105"
          />
          <div className="absolute top-1/2 left-6 md:left-20 -translate-y-1/2 bg-white p-8 md:p-12 max-w-sm shadow-2xl z-10">
            <span className="text-[9px] uppercase tracking-[0.3em] text-stone-400">
              Special Edition
            </span>
            <h3 className="font-serif text-3xl mt-4 mb-6 leading-tight italic">
              Hand-Embroidered Velvet Gown
            </h3>
            <p className="text-stone-500 text-xs leading-relaxed font-light mb-8">
              A timeless piece requiring 240 hours of handwork. Inspired by
              vintage botanical motifs.
            </p>
            <div className="flex justify-between items-end">
              <span className="text-lg font-medium tracking-tighter">€4,200</span>
              <button className="bg-black text-white px-8 py-3 text-[10px] uppercase tracking-widest hover:bg-stone-800 transition">
                Explore Area
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
