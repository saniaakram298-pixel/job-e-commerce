'use client';

export default function Testimonials() {
  return (
    <section className="py-24 border-t border-stone-100">
      <div className="max-w-[900px] mx-auto px-6 text-center">
        <span className="material-symbols-outlined text-stone-300 text-4xl mb-6">
          format_quote
        </span>
        <div className="space-y-8">
          <p className="font-serif text-2xl md:text-3xl italic tracking-tight leading-relaxed">
            "The attention to detail in the hand-embroidered collection is unlike
            anything I've seen in modern luxury. Truly a masterpiece."
          </p>
          <div className="flex flex-col items-center">
            <div className="w-10 h-[1px] bg-stone-300 mb-4"></div>
            <h6 className="text-[10px] uppercase tracking-[0.3em] font-bold">
              Victoria R. — Paris
            </h6>
          </div>
        </div>
      </div>
    </section>
  );
}
