'use client';

import { useEffect, useMemo, useState } from 'react';
import { Arrival } from '@/types';
import { useRouter } from 'next/navigation';

interface BestSellersProps {
    arrivals: Arrival[];
}

export default function BestSellers({ arrivals }: BestSellersProps) {
    const router = useRouter();
    const [products, setProducts] = useState<Arrival[]>(arrivals || []);
    const [loading, setLoading] = useState(false);

    const placeholderImg = 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e12?q=80&w=800';

    useEffect(() => {
        if (!arrivals || arrivals.length === 0) {
            let active = true;
            const loadBestSellers = async () => {
                setLoading(true);
                try {
                    const response = await fetch('/api/products/best-seller?limit=12');
                    if (!response.ok) throw new Error('Unable to load best sellers');
                    const payload = await response.json();
                    const items = Array.isArray(payload?.data?.products) ? payload.data.products : [];
                    if (active) setProducts(items as Arrival[]);
                } catch (error) {
                    console.error('Failed to load best sellers:', error);
                    if (active) setProducts([]);
                } finally {
                    if (active) setLoading(false);
                }
            };

            void loadBestSellers();
            return () => {
                active = false;
            };
        }
    }, [arrivals]);

    const normalize = (s: any = '') => String(s).toLowerCase().replace(/[-_\s]/g, '');

    const databaseBestSellers = useMemo(() => {
        const source = products.length > 0 ? products : arrivals || [];
        return (source || []).filter((item: any) => {
            const imgPath = item.images?.[0] || item.img;
            const hasValidImg = imgPath && imgPath.trim() !== '';
            const collectionValue = normalize(item.collectionName || item.collection || '');
            const isInBestSellerCollection = ['bestseller', 'bestsellers'].includes(collectionValue);
            const tags = Array.isArray(item.tags) ? item.tags : item.tags ? [item.tags] : [];
            const hasBestSellerTag = tags.some((tag: string) => {
                const cleanTag = normalize(tag);
                return ['bestseller', 'bestsellers', 'topseller'].includes(cleanTag);
            });
            const isFeatured = item.featured === true;
            const explicitBestSeller = item.isBestSeller === true;
            return hasValidImg && (explicitBestSeller || isInBestSellerCollection || hasBestSellerTag || isFeatured);
        });
    }, [arrivals, products]);

    const displayItems = (databaseBestSellers.length > 0 ? databaseBestSellers : products.length > 0 ? products : arrivals || []).slice(0, 60);
    const rows = Array.from({ length: 3 }, (_, index) => displayItems.slice(index * 20, index * 20 + 20));

    return (
        <section className="bg-stone-50 py-20 border-y border-stone-100">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12">
                <div className="space-y-10">
                    {loading && products.length === 0 ? (
                        <div className="text-sm text-stone-500">Loading featured products…</div>
                    ) : null}
                    {rows.map((row, rowIndex) => (
                        row.length > 0 ? (
                            <div key={rowIndex} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {row.map((item: any, idx: number) => {
                                    const productImg = item.images?.[0] || item.img || placeholderImg;

                                    return (
                                        <div
                                            key={item._id || item.id || `${rowIndex}-${idx}`}
                                            onClick={() => (item._id || item.id) && router.push(`/product/${item._id || item.id}`)}
                                            className="group cursor-pointer overflow-hidden rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md"
                                        >
                                            <div className="aspect-[4/5] overflow-hidden bg-stone-100 relative rounded-sm">
                                                <img
                                                    src={productImg}
                                                    alt={item.name || item.title || 'Best Seller'}
                                                    className="w-full h-full object-cover transition-transform duration-[1.2s] cubic-bezier(0.4, 0, 0.2, 1) group-hover:scale-105"
                                                    loading="lazy"
                                                />

                                                <div className="absolute top-3 left-3">
                                                    <span className="bg-stone-900 text-white text-[8px] px-2.5 py-1 uppercase tracking-[0.2em] font-bold rounded-xs shadow-xs">
                                                        Best Seller
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-5 space-y-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-serif text-lg tracking-tight text-stone-800 line-clamp-1 group-hover:text-stone-900 transition-colors">
                                                        {item.name || item.title || `Curated Piece 0${rowIndex * 20 + idx + 1}`}
                                                    </h4>
                                                    <p className="font-mono text-sm text-stone-900 font-bold bg-stone-50 px-2 py-0.5 rounded-sm whitespace-nowrap">
                                                        {typeof item.price === 'number' ? `$${item.price}` : (item.price || '$240')}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                                                    <p className="text-[9px] text-stone-400 uppercase tracking-[0.15em]">
                                                        Premium Collection
                                                    </p>
                                                    <span className="text-[10px] text-stone-900 opacity-0 group-hover:opacity-100 font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-1 translate-x-2 group-hover:translate-x-0">
                                                        View Details
                                                        <span className="text-[12px] font-normal">→</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : null
                    ))}
                </div>
            </div>
        </section>
    );
}
