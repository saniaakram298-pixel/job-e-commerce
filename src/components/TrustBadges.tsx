'use client';

import { TrustBadge } from '@/types';

interface TrustBadgesProps {
  badges: TrustBadge[];
}

export default function TrustBadges({ badges }: TrustBadgesProps) {
  return (
    <section className="bg-stone-50 border-y border-stone-100 py-12">
      <div className="max-w-[1440px] mx-auto px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {badges.map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center space-y-2 group">
            <span className="material-symbols-outlined text-stone-400 group-hover:text-black transition-colors">
              {item.icon}
            </span>
            <h5 className="text-[10px] uppercase tracking-widest font-bold">{item.title}</h5>
            <p className="text-[9px] text-stone-500 uppercase tracking-tighter">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
