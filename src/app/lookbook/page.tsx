"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import BackButton from '@/components/BackButton';

interface LookbookItem {
    id: string;
    title: string;
    subtitle: string;
    img: string;
    gridClass: string;
    tip: string;
}

// Default data as fallback
const defaultLookbookData: LookbookItem[] = [
    {
        id: "1",
        title: "Material Transcendence",
        subtitle: "Silk & Drape",
        img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=2000",
        gridClass: "md:col-span-7 md:row-span-2",
        tip: "Pair with: Chunky gold jewelry and sleek back hair for a high-fashion evening look."
    },
    {
        id: "2",
        title: "The Silent Revolution",
        subtitle: "Structured Blazer",
        img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000",
        gridClass: "md:col-span-5 md:row-span-1",
        tip: "Style with: Oversized trousers and pointed boots to balance the sharp silhouette."
    },
    {
        id: "3",
        title: "Metropolitan Muse",
        subtitle: "Tonal Dressing",
        img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000",
        gridClass: "md:col-span-5 md:row-span-1",
        tip: "Dressing Sense: Stick to one color palette (Beige/Sand) for an expensive, quiet-luxury vibe."
    },
    {
        id: "4",
        title: "Architectural Canvas",
        subtitle: "Outerwear Concept",
        img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=2000",
        gridClass: "md:col-span-12 md:h-[60vh]",
        tip: "Layering Tip: Wear a thin turtleneck underneath to add depth without adding bulk."
    },
    {
        id: "5",
        title: "Monochrome Edge",
        subtitle: "Leather & Texture",
        img: "https://images.unsplash.com/photo-1542060717-d5862217f259?q=80&w=2000",
        gridClass: "md:col-span-4",
        tip: "Pro Tip: Mix textures like leather with soft wool to create visual interest in an all-black outfit."
    },
    {
        id: "6",
        title: "The Minimalist Bag",
        subtitle: "Accessories",
        img: "https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=2000",
        gridClass: "md:col-span-4",
        tip: "Key Pairing: A structured tote balances loose, flowy silhouettes perfectly."
    },
    {
        id: "7",
        title: "Sculpted Footwear",
        subtitle: "Essential Boots",
        img: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=2000",
        gridClass: "md:col-span-4",
        tip: "Footwear: Square-toe boots are the 2026 standard for a modern, sharp finish."
    }
];

export default function LookbookPage() {
    const [lookbookData, setLookbookData] = useState<LookbookItem[]>(defaultLookbookData);
    const [loading, setLoading] = useState(true);

    // Fetch lookbook items from MongoDB
    useEffect(() => {
        const fetchLookbook = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/collections');
                if (res.ok) {
                        const maybe = await res.json().catch(() => null);
                        const items = Array.isArray(maybe) ? maybe : maybe?.collections ?? [];
                        // Filter for "lookbook" category
                        const lookbookItems = items.filter((item: any) => item.category === 'lookbook');

                    if (lookbookItems.length > 0) {
                        const gridClasses = [
                            "md:col-span-7 md:row-span-2",
                            "md:col-span-5 md:row-span-1",
                            "md:col-span-5 md:row-span-1",
                            "md:col-span-12 md:h-[60vh]",
                            "md:col-span-4",
                            "md:col-span-4",
                            "md:col-span-4"
                        ];

                        const mappedItems: LookbookItem[] = lookbookItems.map((item: any, index: number) => ({
                            id: item._id || `look-${index}`,
                            title: item.title,
                            subtitle: item.tag || "Collection",
                            img: item.img,
                            gridClass: gridClasses[index % gridClasses.length],
                            tip: item.description || "Discover the style behind this look."
                        }));
                        setLookbookData(mappedItems);
                    } else {
                        setLookbookData(defaultLookbookData);
                    }
                } else {
                    console.error('Failed to fetch lookbook');
                    setLookbookData(defaultLookbookData);
                }
            } catch (error) {
                console.error('Error fetching lookbook:', error);
                setLookbookData(defaultLookbookData);
            } finally {
                setLoading(false);
            }
        };

        fetchLookbook();
    }, []);
    <main className="min-h-screen bg-[#faf9f6] text-[#1a1a1a] selection:bg-black selection:text-white">

        <div className="max-w-[1600px] mx-auto px-6 pt-20">
            {/* Back Button */}
            <div className="mb-12">
                <BackButton />
            </div>

            {/* 2. PAGE HEADER */}
            <header className="max-w-2xl mb-24">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-7xl md:text-8xl font-serif italic leading-[0.9] tracking-tighter mb-8"
                >
                    Visions of <br /> Excellence.
                </motion.h2>
                <p className="text-[11px] uppercase tracking-[0.3em] text-stone-400 font-bold max-w-sm leading-relaxed">
                    A curated look into the textures and silhouettes of the upcoming season.
                </p>
            </header>

            {/* 3. THE BENTO LOOKBOOK GRID */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 auto-rows-[minmax(300px,_auto)]">
                {loading ? (
                    <div className="col-span-full text-center text-stone-400">Loading lookbook...</div>
                ) : (
                    lookbookData.map((look, index) => (
                        <motion.div
                            key={look.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className={`${look.gridClass} group relative overflow-hidden bg-stone-100`}
                        >
                            {/* Image Container */}
                            <div className="relative w-full h-full overflow-hidden">
                                <Image
                                    src={look.img}
                                    alt={look.title}
                                    fill
                                    className="object-cover grayscale hover:grayscale-0 transition-all duration-[2s] ease-out group-hover:scale-105"
                                />

                                {/* Minimal Overlay Information */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                                    <span className="text-[9px] text-white/70 uppercase tracking-[0.4em] mb-2">{look.subtitle}</span>
                                    <h3 className="text-white text-2xl font-serif italic">{look.title}</h3>
                                </div>

                                {/* Styling Tip Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-center items-center p-10 text-center">
                                    <p className="text-white/60 text-[10px] uppercase tracking-[0.3em] mb-4">Styling Note</p>
                                    <p className="text-white text-sm font-serif italic leading-relaxed">
                                        {look.tip}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* 4. FOOTER QUOTE */}
            <footer className="py-40 text-center space-y-12">
                <div className="h-[60px] w-[1px] bg-stone-300 mx-auto" />
                <h4 className="text-4xl md:text-6xl font-serif italic text-stone-300 leading-tight">
                    "Fashion is the armor <br /> of reality."
                </h4>
                <Link href="/new-arrivals" className="inline-block px-12 py-5 bg-black text-white text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-stone-800 transition-all">
                    Shop The Collection
                </Link>
            </footer>
        </div>
    </main>
    ;
}