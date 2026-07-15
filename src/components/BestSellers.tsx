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
        <section className="bg-stone-50 py-20">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Best Sellers</h2>

                    <div className="flex gap-2">
                        <button
                            onClick={() => sliderRef.current?.slickPrev()}
                            className="w-10 h-10 rounded-full border flex items-center justify-center"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <button
                            onClick={() => sliderRef.current?.slickNext()}
                            className="w-10 h-10 rounded-full border flex items-center justify-center"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {loading && <p>Loading...</p>}

                {/* ✅ SLIDER */}
                <Slider
                    ref={sliderRef}
                    arrows={false}
                    dots={false}
                    infinite={false}
                    speed={500}
                    slidesToShow={5}
                    slidesToScroll={1}
                    responsive={[
                        { breakpoint: 1280, settings: { slidesToShow: 4 } },
                        { breakpoint: 1024, settings: { slidesToShow: 3 } },
                        { breakpoint: 640, settings: { slidesToShow: 2 } },
                    ]}
                >
                    {displayItems.map((item, idx) => (
                        <div key={item._id || item.id || idx} className="px-2">
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
        <div className="group relative bg-white rounded-md overflow-hidden border hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer">

            {/* IMAGE */}
            <div className="relative aspect-[4/5] overflow-hidden">

                <img
                    src={hoverImg}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                />

                {/* BADGE */}
                <div className="absolute top-3 left-3 z-10">
                    <span className="bg-black text-white text-[10px] px-3 py-1 rounded uppercase tracking-wider">
                        Best Seller
                    </span>
                </div>

                {/* OVERLAY */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-500" />

                {/* THUMBNAILS */}
                {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        {images.slice(0, 4).map((img: string, i: number) => (
                            <img
                                key={i}
                                src={img}
                                onMouseEnter={() => setHoverImg(img)}
                                onMouseLeave={() => setHoverImg(mainImg)}
                                className="w-10 h-10 object-cover border rounded cursor-pointer hover:scale-110 transition"
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
                    className="absolute bottom-14 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition bg-black text-white px-4 py-2 text-xs rounded"
                >
                    View Product
                </button>
            </div>

            {/* CONTENT */}
            <div className="p-4">
                <h4 className="text-sm font-semibold line-clamp-1">
                    {item.name || item.title}
                </h4>

                <p className="font-bold text-sm mt-2">
                    ${item.price || 240}
                </p>
            </div>
        </div>
    );
}