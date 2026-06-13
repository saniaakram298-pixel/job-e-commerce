"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
// ... baki imports same rahengy

export default function Collections() {
    // ... aapke purane states yahan aayenge
    const [rawProducts, setRawProducts] = useState<any[]>([]); // Original flat data from DB
    const [activeSections, setActiveSections] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const parsedData = await api.get('/collections', false);
                const collectionsData = Array.isArray(parsedData)
                    ? parsedData
                    : Array.isArray(parsedData?.collections)
                        ? parsedData.collections
                        : [];

                setRawProducts(collectionsData);

                const structuredData: any[] = [];
                collectionsData.forEach((adminItem: any) => {
                    const categoryName = adminItem.category || 'General';
                    const matchedSection = structuredData.find(
                        section => section.category.toLowerCase() === categoryName.toLowerCase()
                    );

                    const newItem = {
                        id: adminItem._id,
                        name: adminItem.title,
                        price: `$${adminItem.price}`,
                        numericPrice: Number(adminItem.price),
                        img: adminItem.img || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80',
                        category: categoryName,
                    };

                    if (matchedSection) {
                        matchedSection.items.push(newItem);
                    } else {
                        structuredData.push({
                            title: `${categoryName} Collection`,
                            category: categoryName,
                            items: [newItem],
                        });
                    }
                });
                setActiveSections(structuredData);
            } catch (error) {
                console.error('Error fetching collections:', error);
                setRawProducts([]);
                setActiveSections([]);
            }
        };
        fetchDashboardData();
    }, []);

    // LOGIC 1: New Arrivals (Puri inventory ke latest 10 items)
    // Is logic ko update karein (Line 58 ke qareeb)
    const newArrivals = useMemo(() => {
        return [...rawProducts]
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA; // Latest products ko top par lane ke liye
            })
            .slice(0, 10);
    }, [rawProducts]);

    return (
        <main className="min-h-screen bg-white text-stone-900 relative">
            {/* Navbar & Admin Panel Toggle (Same as before) */}

            {/* Hero Section */}
            <div className="h-[65vh] relative flex items-center justify-center bg-stone-200">
                <Image src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80" alt="Hero" fill className="object-cover opacity-70" priority />
                <div className="relative z-10 text-center text-white">
                    <h1 className="font-serif text-7xl md:text-9xl italic tracking-tighter">Atelier</h1>
                </div>
            </div>

            {/* LOGIC 1: NEW ARRIVALS SECTION (Hero ke foran baad) */}
            <section className="max-w-[1440px] mx-auto px-6 py-20 bg-stone-50">
                <div className="mb-12 text-center">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-bold mb-2 block">Freshly Added</span>
                    <h2 className="font-serif text-5xl italic">New Arrivals</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {newArrivals.map((item) => (
                        <ProductCard key={item._id} item={item} />
                    ))}
                </div>
            </section>

            {/* LOGIC 2: CATEGORIES (With 10 items limit) */}
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-24">
                {activeSections.map((section, idx) => {
                    const displayItems = section.items.slice(0, 10); // Sirf pehly 10 items
                    const hasMore = section.items.length > 10;

                    return (
                        <div key={idx} className="mb-32">
                            <div className="flex items-end justify-between mb-12 border-b border-stone-100 pb-8">
                                <h2 className="font-serif text-4xl italic">{section.title}</h2>
                                {hasMore && (
                                    <Link href={`/collections/${section.category.toLowerCase()}`} className="text-[10px] uppercase tracking-widest font-bold border-b border-black">
                                        View Full Collection ({section.items.length})
                                    </Link>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {displayItems.map((item: any) => (
                                    <ProductCard key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </main>
    );
}

// Chota reusable component safai ke liye
function ProductCard({ item }: { item: any }) {
    return (
        <div className="group cursor-pointer">
            <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                <Image src={item.img} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <h3 className="font-serif text-lg mt-4">{item.name || item.title}</h3>
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{item.price}</p>
        </div>
    );
}