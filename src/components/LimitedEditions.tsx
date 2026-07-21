'use client';

export default function LimitedEditions() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 relative">

        {/* HEADER */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-stone-400 font-bold">
            The Archive
          </span>

          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-tighter mt-2">
            Limited Editions
          </h2>
        </div>

        {/* IMAGE */}
        <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] overflow-hidden group rounded-2xl">

          <img
            src="/images/editorial.png"
            alt="Embroidery Detail"
            className="w-full h-full object-cover transition duration-1000 group-hover:scale-105"
          />

          {/* OVERLAY */}
          <div className="absolute inset-0 bg-black/30" />

          {/* CARD */}
          <div
            className="
              absolute 
              bottom-4 left-1/2 -translate-x-1/2

              sm:top-1/2 sm:left-6 md:left-20 
              sm:-translate-y-1/2 sm:translate-x-0

              w-[85%] 
              sm:w-[300px] 
              md:w-[340px] 
              lg:w-[400px]

              backdrop-blur-xl bg-white/20 border border-white/30
              p-4 sm:p-5 md:p-6 lg:p-8
              rounded-2xl shadow-xl z-10
            "
          >

            <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-white/80">
              Special Edition
            </span>

            <h3 className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl mt-3 mb-3 sm:mb-4 leading-tight italic text-white">
              Hand-Embroidered Velvet Gown
            </h3>

            <p className="text-white/80 text-[10px] sm:text-xs leading-relaxed font-light mb-4 sm:mb-6">
              A timeless piece requiring 240 hours of handwork. Inspired by
              vintage botanical motifs.
            </p>

            {/* PRICE ONLY (button removed) */}
            <div className="flex justify-between items-center">
              <span className="text-sm sm:text-base md:text-lg font-medium tracking-tight text-white">
                €4,200
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}