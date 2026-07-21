'use client';

import { useEffect, useRef, useState } from 'react';
import { Arrival } from '@/types';
import { useRouter } from 'next/navigation';
import Slider from 'react-slick';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BestSellersProps {
    arrivals: Arrival[];
}

export default function BestSellers({ arrivals }: BestSellersProps) {
    const router = useRouter();

    const [products, setProducts] = useState<Arrival[]>([]);
    const [loading, setLoading] = useState(false);

    const sliderRef = useRef<Slider | null>(null);

    const placeholderImg =
        'https://images.unsplash.com/photo-1441984904996-e0b6ba687e12?q=80&w=800';

    // ✅ CACHE LOAD
    useEffect(() => {
        const cached = localStorage.getItem('best_sellers_cache');
        if (cached) {
            setProducts(JSON.parse(cached));
        }
    }, []);

    // ✅ FETCH
    useEffect(() => {
        if (products.length === 0 && (!arrivals || arrivals.length === 0)) {
            let active = true;

            const load = async () => {
                setLoading(true);
                try {
                    const res = await fetch('/api/products/best-seller?limit=20');
                    const data = await res.json();
                    const items = data?.data?.products || [];

                    if (active) {
                        setProducts(items);
                        localStorage.setItem(
                            'best_sellers_cache',
                            JSON.stringify(items)
                        );
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            };

            load();
            return () => {
                active = false;
            };
        } else if (arrivals?.length > 0) {
            setProducts(arrivals);
        }
    }, [arrivals]);

    const displayItems = products.slice(0, 20);

    return (
        <section className="bg-stone-50 py-4 xs:py-5 sm:py-8 md:py-12 lg:py-16 xl:py-20">
            <div className="max-w-[1440px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-12">

                {/* HEADER */}
                <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 xs:gap-4 mb-4 xs:mb-5 sm:mb-6 md:mb-8">
                    <h2 className="text-xl xs:text-2xl sm:text-2xl md:text-3xl font-semibold">Best Sellers</h2>

                    <div className="flex gap-1 xs:gap-1.5 sm:gap-2">
                        <button
                            onClick={() => sliderRef.current?.slickPrev()}
                            className="w-8 xs:w-9 sm:w-10 h-8 xs:h-9 sm:h-10 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
                            aria-label="Previous"
                        >
                            <ChevronLeft size={16} className="xs:hidden" />
                            <ChevronLeft size={18} className="hidden xs:block" />
                        </button>

                        <button
                            onClick={() => sliderRef.current?.slickNext()}
                            className="w-8 xs:w-9 sm:w-10 h-8 xs:h-9 sm:h-10 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
                            aria-label="Next"
                        >
                            <ChevronRight size={16} className="xs:hidden" />
                            <ChevronRight size={18} className="hidden xs:block" />
                        </button>
                    </div>
                </div>

                {loading && <p className="text-xs xs:text-sm text-slate-600 mb-4">Loading...</p>}

                {/* ✅ SLIDER */}
                <Slider
                    ref={sliderRef}
                    arrows={false}
                    dots={false}
                    infinite={false}
                    speed={500}
                    slidesToShow={5}
                    slidesToScroll={1}
                    swipeToSlide
                    responsive={[
                        { breakpoint: 1536, settings: { slidesToShow: 5, slidesToScroll: 1 } },
                        { breakpoint: 1280, settings: { slidesToShow: 4, slidesToScroll: 1 } },
                        { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 1 } },
                        { breakpoint: 768, settings: { slidesToShow: 2.5, slidesToScroll: 1 } },
                        { breakpoint: 640, settings: { slidesToShow: 1.5, slidesToScroll: 1 } },
                        { breakpoint: 480, settings: { slidesToShow: 1.1, slidesToScroll: 1 } },
                    ]}
                >
                    {displayItems.map((item, idx) => (
                        <div key={item._id || item.id || idx} className="px-1.5 xs:px-2 sm:px-2.5 md:px-3">
                            <ProductCard
                                item={item}
                                router={router}
                                placeholderImg={placeholderImg}
                            />
                        </div>
                    ))}
                </Slider>
            </div>
        </section>
    );
}

/* ✅ PRODUCT CARD */

function ProductCard({ item, router, placeholderImg }: any) {
    const id = item._id || item.id;

    const images = item.images?.length
        ? item.images
        : [item.img || placeholderImg];

    const mainImg = images[0];

    const [hoverImg, setHoverImg] = useState(mainImg);

    return (
        <div className="group relative bg-white rounded-lg xs:rounded-xl sm:rounded-[1.25rem] md:rounded-[1.5rem] overflow-hidden border border-slate-200 hover:shadow-lg xs:hover:shadow-xl transition-all duration-500 hover:-translate-y-0.5 xs:hover:-translate-y-1 sm:hover:-translate-y-2 cursor-pointer">

            {/* IMAGE */}
            <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">

                <img
                    src={hoverImg}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    alt={item.name || item.title}
                />

               

                {/* OVERLAY */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-500" />

                {/* THUMBNAILS */}
                {images.length > 1 && (
                    <div className="absolute bottom-2 xs:bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1 xs:gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 transition">
                        {images.slice(0, 4).map((img: string, i: number) => (
                            <img
                                key={i}
                                src={img}
                                onMouseEnter={() => setHoverImg(img)}
                                onMouseLeave={() => setHoverImg(mainImg)}
                                className="w-7 xs:w-8 sm:w-9 md:w-10 h-7 xs:h-8 sm:h-9 md:h-10 object-cover border border-slate-200 rounded cursor-pointer hover:scale-110 transition"
                                alt={`Thumbnail ${i + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* VIEW BUTTON */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/product/${id}`);
                    }}
                    className="absolute bottom-8 xs:bottom-10 sm:bottom-12 md:bottom-14 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition bg-black text-white px-3 xs:px-3.5 sm:px-4 py-1.5 xs:py-1.5 sm:py-2 text-[11px] xs:text-xs sm:text-sm rounded-md xs:rounded-lg whitespace-nowrap"
                    aria-label="View Product"
                >
                    View Product
                </button>
            </div>

            {/* CONTENT */}
            <div className="p-2 xs:p-2.5 sm:p-3 md:p-4">
                <h4 className="text-xs xs:text-sm sm:text-base font-semibold line-clamp-1 text-slate-900">
                    {item.name || item.title}
                </h4>

                <p className="font-bold text-sm xs:text-base sm:text-lg mt-1.5 xs:mt-2 text-slate-900">
                    ${item.price || 240}
                </p>
            </div>
        </div>
    );
}