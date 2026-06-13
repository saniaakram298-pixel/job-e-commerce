"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface EditorialStory {
    id: string;
    category: string;
    title: string;
    description: string;
    img: string;
    size: string;
}

const defaultEditorialStories: EditorialStory[] = [
    {
        id: "1",
        category: "The Origin",
        title: "The Alchemy of Thread",
        description: "Explore the journey of our signature linen, from the raw fibers of northern Italy to the hands of our master tailors in Lahore.",
        img: "https://images.unsplash.com/photo-1558603668-6570496b66f8?q=80&w=2000",
        size: "md:col-span-8"
    },
    {
        id: "2",
        category: "Visual Identity",
        title: "The Monochrome Shift",
        description: "Why 2026 is moving away from logos and towards texture-driven luxury.",
        img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2000",
        size: "md:col-span-4"
    },
    {
        id: "3",
        category: "Sustainability",
        title: "Legacy in Every Stitch",
        description: "Our commitment to zero-waste pattern cutting and the revival of traditional embroidery.",
        img: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2000",
        size: "md:col-span-12"
    }
];

export default function EditorialPage() {
    const [editorialStories, setEditorialStories] = useState<EditorialStory[]>(defaultEditorialStories);
    const [loading, setLoading] = useState(true);

    // Fetch editorial from MongoDB API
    useEffect(() => {
        const fetchEditorial = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/collections');
                if (res.ok) {
                    const data = await res.json();
                    // Filter collections with category "editorial"
                    const editorialCollections = data.filter((item: any) => item.category === 'editorial');

                    if (editorialCollections.length > 0) {
                        // Map to Story format
                        const mappedStories: EditorialStory[] = editorialCollections.map((item: any, index: number) => ({
                            id: item._id || `story-${index}`,
                            category: item.tag || "Editorial",
                            title: item.title,
                            description: item.description || "Discover the story behind this piece.",
                            img: item.img,
                            size: index === 0 ? "md:col-span-8" : index === 1 ? "md:col-span-4" : "md:col-span-12"
                        }));
                        setEditorialStories(mappedStories);
                    } else {
                        setEditorialStories(defaultEditorialStories);
                    }
                } else {
                    console.error('Failed to fetch editorial');
                    setEditorialStories(defaultEditorialStories);
                }
            } catch (error) {
                console.error('Error fetching editorial:', error);
                setEditorialStories(defaultEditorialStories);
            } finally {
                setLoading(false);
            }
        };

        fetchEditorial();
    }, []);
    return (
    <main className="min-h-screen bg-[#faf9f6] text-[#1a1a1a]">

        {/* 1. HERO SECTION */}
        {/* 1. HERO SECTION WITH VIDEO BACKGROUND */}
        <section className="relative h-screen flex flex-col justify-center items-center px-6 text-center overflow-hidden">

            {/* Background Video - Brightness thori kam taake text uthay */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover brightness-[0.6] contrast-[1.1]"
            >
                <source src="/video/vedio2.mp4" type="video/mp4" />
            </video>

            {/* Professional Gradient Overlay - Ye watermark ki visibility kam karega aur text ko clear karega */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />

            {/* Hero Content */}
            <div className="relative z-10 text-white max-w-5xl">
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] uppercase tracking-[0.8em] text-stone-300 mb-8 block font-medium"
                >
                    Volume I • Issue 2026
                </motion.span>

                {/* Heading ko mazeed elegant banaya gaya hai */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-6xl md:text-[10rem] font-serif italic leading-none tracking-tight"
                    style={{ fontWeight: 200 }}
                >
                    The <span className="block md:inline">editorial.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="max-w-lg mt-16 mx-auto text-xs md:text-sm text-stone-300 font-light leading-relaxed tracking-wide italic border-t border-white/20 pt-8"
                >
                    "A space where craftsmanship meets narrative. We explore the soul behind the silhouette and the stories woven into our fabric."
                </motion.p>
            </div>
        </section>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-[1px] h-12 bg-stone-300 animate-pulse" />
        </div>


        {/* 2. MAIN STORIES GRID */}
        <section className="max-w-[1440px] mx-auto px-6 py-24">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24">
                {loading ? (
                    <div className="col-span-full text-center text-stone-400">Loading editorial stories...</div>
                ) : (
                    editorialStories.map((story, index) => (
                        <motion.div
                            key={story.id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className={`${story.size} space-y-8 group cursor-pointer`}
                        >
                            <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
                                <Image
                                    src={story.img}
                                    alt={story.title}
                                    fill
                                    className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                            </div>

                            <div className="max-w-xl space-y-4">
                                <span className="text-[9px] uppercase tracking-[0.4em] text-stone-400 font-bold">
                                    {story.category}
                                </span>
                                <h3 className="text-4xl md:text-5xl font-serif italic tracking-tighter">
                                    {story.title}
                                </h3>
                                <p className="text-stone-500 text-sm leading-relaxed font-light">
                                    {story.description}
                                </p>
                                <Link
                                    href={`/editorial/${story.id}`}
                                    className="inline-block pt-2 border-b border-black text-[9px] uppercase tracking-[0.4em] font-bold"
                                >
                                    Read Article
                                </Link>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </section>

        {/* 3. QUOTE SECTION */}
        <section className="py-32 bg-stone-100/50 text-center px-6">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="w-12 h-[1px] bg-stone-400 mx-auto" />
                <h2 className="text-3xl md:text-5xl font-serif italic leading-snug">
                    "In a world of mass production, the deliberate hand-stitch is a form of quiet rebellion."
                </h2>
                <p className="text-[10px] uppercase tracking-[0.5em] text-stone-400">— Our Lead Tailor</p>
            </div>
        </section>

        {/* 4. FOOTER CALL TO ACTION */}
        <section className="py-24 text-center">
            <Link href="/collections" className="group">
                <span className="text-[10px] uppercase tracking-[0.6em] text-stone-400 block mb-4 group-hover:text-black transition-colors">Back to commerce</span>
                <span className="text-4xl md:text-6xl font-serif italic border-b border-black/10 pb-4 group-hover:border-black transition-all">Shop The Collection</span>
            </Link>
        </section>

    </main >
     ) ;
}