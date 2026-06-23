'use client';

import { Arrival } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface BestSellersProps {
    arrivals: Arrival[];
}

export default function BestSellers({ arrivals }: BestSellersProps) {
    const router = useRouter();
    const { addToCart } = useCart();

    const placeholderImg = "https://images.unsplash.com/photo-1441984904996-e0b6ba687e12?q=80&w=800";

    const normalize = (s: any = '') => String(s).toLowerCase().replace(/[-_\s]/g, '');

    // --- FLEXIBLE DATABASE BEST SELLER FILTER ---
    const databaseBestSellers = arrivals?.filter((item: any) => {
        // 1. Image Check
        const imgPath = item.images?.[0] || item.img;
        const hasValidImg = imgPath && imgPath.trim() !== "";

        // 2. Collection Route/Name Check (Handles singular, plural, spaces & hyphens)
        const collectionValue = normalize(item.collectionName || item.collection || '');
        const isInBestSellerCollection = ['bestseller', 'bestsellers'].includes(collectionValue);

        // 3. Tags Array Check (Cleans spaces and hyphens like "Best Seller" -> "bestseller")
        const tags = Array.isArray(item.tags) ? item.tags : item.tags ? [item.tags] : [];
        const hasBestSellerTag = tags.some((tag: string) => {
            const cleanTag = normalize(tag);
            return ['bestseller', 'bestsellers', 'topseller'].includes(cleanTag);
        });

        // 4. Featured Flag Fallback
        const isFeatured = item.featured === true;

        return hasValidImg && (isInBestSellerCollection || hasBestSellerTag || isFeatured);
    }) || [];

    // Fallback Safeguard: Agar strict filter se koi product nahi milta, 
    // toh database ke pehle 4 active items fallback mein show ho jayein taake UI empty na rahe.
    const displayItems = databaseBestSellers.length > 0 ? databaseBestSellers : arrivals?.slice(0, 4);

    return (
        <section className="bg-stone-50 py-20 border-y border-stone-100">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12">

                {/* --- HEADER --- */}
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-bold block mb-2">
                            The Favorites
                        </span>
                        <h2 className="font-serif text-4xl tracking-tighter italic text-stone-900">
                            Best Sellers
                        </h2>
                    </div>

                    <Link
                        href="/collections/best-sellers"
                        className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold text-stone-500 hover:text-stone-900 transition-all border-b border-stone-200 hover:border-stone-900 pb-1"
                    >
                        View All
                        <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">
                            north_east
                        </span>
                    </Link>
                </div>

                {/* --- CARDS DISPLAY (HORIZONTAL SCROLL) --- */}
                <div className="flex overflow-x-auto space-x-6 md:space-x-8 pb-10 no-scrollbar snap-x snap-mandatory scroll-smooth pt-4">
                    {displayItems?.map((item: any, idx: number) => {
                        
                        const productImg = item.images?.[0] || item.img || placeholderImg;

                        return (
                            <div
                                key={item._id || item.id || idx}
                                onClick={() => (item._id || item.id) && router.push(`/product/${item._id || item.id}`)}
                                className="min-w-[290px] md:min-w-[360px] max-w-[360px] group cursor-pointer snap-start bg-white border border-stone-200/80 rounded-sm p-4 shadow-sm hover:shadow-md transition-all duration-300 ease-out"
                            >
                                {/* Card Image Container */}
                                <div className="aspect-[4/5] overflow-hidden bg-stone-100 relative rounded-sm">
                                    <img
                                        src={productImg}
                                        alt={item.name || "Best Seller"}
                                        className="w-full h-full object-cover transition-transform duration-[1.2s] cubic-bezier(0.4, 0, 0.2, 1) group-hover:scale-105"
                                        loading="lazy"
                                    />

                                    {/* Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-stone-900 text-white text-[8px] px-2.5 py-1 uppercase tracking-[0.2em] font-bold rounded-xs shadow-xs">
                                            Trending
                                        </span>
                                    </div>
                                </div>

                                {/* Card Details Area */}
                                <div className="mt-5 space-y-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className="font-serif text-lg tracking-tight text-stone-800 line-clamp-1 group-hover:text-stone-900 transition-colors">
                                            {item.name || item.title || `Curated Piece 0${idx + 1}`}
                                        </h4>
                                        <p className="font-mono text-sm text-stone-900 font-bold bg-stone-50 px-2 py-0.5 rounded-sm whitespace-nowrap">
                                            {typeof item.price === 'number' ? `$${item.price}` : (item.price || '$240')}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                                        <p className="text-[9px] text-stone-400 uppercase tracking-[0.15em]">
                                            Premium Collection
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addToCart({
                                                        id: item.id || item._id,
                                                        _id: item._id,
                                                        name: item.name || item.title,
                                                        img: productImg,
                                                        price: String(item.price ?? 0),
                                                        cat: item.category || item.collection || 'Best Seller',
                                                        category: item.category || item.collection || 'Best Seller',
                                                        images: item.images ? [item.images[0]] : [],
                                                    });
                                                }}
                                                className="text-[10px] uppercase tracking-[0.2em] font-bold text-white bg-stone-900 px-3 py-2 rounded-sm hover:bg-stone-800 transition"
                                            >
                                                Add to Cart
                                            </button>
                                            <span className="text-[10px] text-stone-900 opacity-0 group-hover:opacity-100 font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-1 translate-x-2 group-hover:translate-x-0">
                                                View Details 
                                                <span className="text-[12px] font-normal">→</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </section>
    );
}