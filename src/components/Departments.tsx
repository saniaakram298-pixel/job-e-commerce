'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Category } from '@/types';
import { useRouter } from 'next/navigation';
import { formatNumber } from '@/lib/price';

interface DepartmentsProps {
    categories: Category[];
    budget: number;
    setBudget: (budget: number) => void;
}

export default function Departments({
    categories,
    budget,
    setBudget,
}: DepartmentsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const defaultImages: Record<string, string> = {
        'men': 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=800',
        'women': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800',
        'children': 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?q=80&w=800',
        'bridal': 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800',
        'groom': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800',
        'shoes': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800',
        'default': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800'
    };

    return (
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-12">
            <div className="flex flex-col space-y-24">

                {/* --- SECTION HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-100 pb-10">
                    <div className="text-center md:text-left">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-bold block mb-3">
                            The Atelier / Collections
                        </span>
                        <h2 className="font-serif text-5xl tracking-tighter italic">
                            Our Departments
                        </h2>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-100 w-full md:w-auto">
                        <div className="relative w-full sm:w-64">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-sm">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Find your style..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-stone-200 py-2.5 pl-10 pr-4 rounded-lg text-[11px] uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all"
                            />
                        </div>

                        <div className="flex flex-col w-full sm:w-64 space-y-1">
                            <div className="flex justify-between text-[9px] uppercase tracking-tighter text-stone-500 font-bold">
                                <span>Max Budget</span>
                                <span className="text-stone-900">${budget}</span>
                            </div>
                            <input
                                type="range"
                                min="50"
                                max="5000"
                                value={budget}
                                onChange={(e) => setBudget(parseInt(e.target.value))}
                                className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                            />
                        </div>
                    </div>
                </div>

                {/* --- DYNAMIC ROWS --- */}
                <div className="space-y-32">
                    {categories.map((cat, index) => (
                        <div key={cat.id} className="group/row">
                            {/* Category Header */}
                            <div className="flex items-center justify-between mb-8 px-2">
                                <div className="flex items-center gap-6">
                                    <span className="text-[11px] font-mono text-stone-300 font-medium">/ 0{index + 1}</span>
                                    <h3 className="font-serif text-3xl md:text-4xl tracking-tight group-hover/row:italic transition-all duration-700">
                                        {cat.name}
                                    </h3>
                                </div>
                                <Link
                                    href={`/collections/${cat.id}`}
                                    className="group/link flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400 hover:text-stone-900 transition-all"
                                >
                                    Explore All
                                    <span className="material-symbols-outlined text-xs transition-transform group-hover/link:translate-x-2">
                                        east
                                    </span>
                                </Link>
                            </div>

                            {/* Horizontal Scroll Cards */}
                            <div className="relative">
                                <div className="flex overflow-x-auto gap-8 pb-10 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                    {/* Agar products nahi hain to 6 placeholder cards dikhao */}
                                    {(cat.products && cat.products.length > 0 ? cat.products : [1, 2, 3, 4, 5, 6]).map((item: any, idx: number) => {
                                        // Image Logic
                                        const displayImg = item.img ||
                                            (!cat.img?.includes('placeholder') ? cat.img : null) ||
                                            defaultImages[cat.name.toLowerCase()] ||
                                            defaultImages.default;

                                        return (
                                            <div
                                                key={item.id || idx}
                                                onClick={() => router.push(`/collections/${cat.id}`)}
                                                className="min-w-[300px] md:min-w-[400px] aspect-[4/5] relative overflow-hidden bg-stone-100 snap-start group cursor-pointer"
                                            >
                                                <img
                                                    src={displayImg}
                                                    alt={item.name || cat.name}
                                                    className="absolute inset-0 w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                                                />

                                                {/* Sophisticated Glass Overlay */}
                                                <div className="absolute inset-x-4 bottom-4 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 bg-white/10 backdrop-blur-xl border border-white/20 rounded-sm">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <p className="text-white text-[9px] uppercase tracking-[0.2em] mb-1 opacity-80">
                                                                Edition {new Date().getFullYear()}
                                                            </p>
                                                            <h4 className="text-white font-serif italic text-xl">
                                                                {item.name || `Premium ${cat.name} Style`}
                                                            </h4>
                                                        </div>
                                                        <span className="text-white font-medium text-sm">
                                                            ${formatNumber(Math.random() * 800 + 100, 0)}
                                                        </span>
                                                    </div>

                                                    <button className="w-full py-3 bg-white text-black text-[10px] uppercase tracking-widest font-bold hover:bg-stone-900 hover:text-white transition-colors duration-300">
                                                        View Product
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </section>
    );
}