'use client';

import Link from 'next/link';

export default function BrandStory() {
  return (
    <section className="py-24 bg-[#faf9f6]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* VIDEO SIDE */}
        <div className="relative aspect-[4/5] overflow-hidden bg-stone-200">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-all duration-[2s] ease-in-out"
          >
            <source src="/video/story.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Subtle Overlay */}
          <div className="absolute inset-0 border-[15px] border-[#faf9f6]/30 pointer-events-none" />
        </div>

        {/* TEXT SIDE */}
        <div className="space-y-8 max-w-lg">
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-bold block">
              The Craft
            </span>
            <h2 className="font-serif text-5xl md:text-6xl tracking-tighter leading-[1.1] italic">
              Handcrafted <br /> Excellence <br /> Since 2026
            </h2>
          </div>

          <p className="text-stone-600 font-light leading-relaxed text-sm md:text-base">
            Har piece ko bariiki se design kiya gaya hai. Hum sirf kapray nahi
            banate, hum aik legacy create kar rahe hain jo ane wale saalon tak
            aapke sath rahegi.
            <span className="block mt-4 italic font-medium text-black">
              "Quality hamara imaan hai."
            </span>
          </p>

          <div className="pt-4">
            <Link
              href="/about"
              className="inline-block border-b border-black pb-2 text-[10px] uppercase tracking-[0.5em] font-bold hover:opacity-50 transition-all"
            >
              Read Our Story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
