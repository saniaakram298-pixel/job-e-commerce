import Link from 'next/link';
import { Arrival } from '@/types';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { formatCurrency } from '@/lib/price';
import ProductCardClient from './ProductCardClient';
import { ArrowRight } from 'lucide-react'; // Ek sleek arrow icon ke liye

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

async function getNewArrivals(): Promise<Arrival[]> {
    try {
        await connectDB();

        // Database se maximum 10 latest active products hi fetch hongi
        const products = await Product.find({ active: true })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const mappedArrivals = products.map((product: any, index: number) => {
            const priceValue = product.discountPrice ?? product.price ?? 0;

            // 🔥 FIX: blob URL ko ignore karo
            let imageUrl = '/images/hero.png';

            if (Array.isArray(product.images) && product.images.length > 0) {
                const firstImage = product.images[0];

                if (firstImage && !firstImage.startsWith('blob:')) {
                    imageUrl = firstImage;
                }
            }

            return {
                id: String(product._id ?? index),
                name: product.name || 'Untitled Product',
                img: imageUrl,
                price: formatCurrency(priceValue),
                cat: product.category || 'Uncategorized',
                category: product.category || 'Uncategorized',

                // 🔥 extra safety: images array bhi clean karo
                images: Array.isArray(product.images)
                    ? product.images.filter((img: string) => !img.startsWith('blob:'))
                    : [],
                collectionName: product.collection || 'Uncategorized',
                tags: Array.isArray(product.tags) ? product.tags : [],
                averageRating: Number(product.averageRating ?? product.rating ?? 0),
                totalReviews: Number(product.totalReviews ?? 0),
                updatedAt: product.updatedAt || new Date().toISOString(),
                createdAt: product.createdAt || new Date().toISOString(),
            } satisfies Arrival;
        });

        return Array.from(
            new Map(mappedArrivals.map((item) => [item.id, item])).values()
        );
    } catch (error) {
        console.error('Database fetch error:', error);
        return [];
    }
}

export default async function NewArrivals() {
    const displayArrivals = await getNewArrivals();

    return (
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 bg-white">
            <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 border-b border-stone-100 pb-6">
                <div>
                    <h2 className="font-serif text-4xl tracking-tighter uppercase italic text-black">
                        New Arrivals
                    </h2>
                    <p className="text-stone-400 text-xs tracking-widest mt-2 uppercase">
                        Spring / Summer 2026 Collection
                    </p>
                </div>
                <Link
                    href="/collections"
                    className="text-[10px] uppercase tracking-[0.2em] border-b border-black pb-1 hover:text-stone-500 transition-colors"
                >
                    View All Arrivals
                </Link>
            </div>

            <div className="flex overflow-x-auto gap-8 pb-10 scrollbar-hide snap-x snap-mandatory">
                {displayArrivals.length > 0 ? (
                    <>
                        {displayArrivals.map((product) => (
                            <ProductCardClient key={product.id} product={product} />
                        ))}

                        {/* 🔥 AUTOMATIC REDIRECT CARD: Agar 10 items poore hain, to end me ye card show hoga */}
                        {displayArrivals.length >= 10 && (
                            <Link 
                                href="/collections"
                                className="min-w-[280px] md:min-w-[320px] flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-2xl bg-stone-50/50 hover:bg-stone-50 transition-all group p-6 snap-start"
                            >
                                <div className="p-4 bg-white rounded-full shadow-sm border border-stone-100 group-hover:scale-110 transition-transform">
                                    <ArrowRight className="w-5 h-5 text-black" />
                                </div>
                                <span className="text-xs uppercase tracking-widest font-bold text-black mt-4">
                                    View More Items
                                </span>
                                <span className="text-[10px] text-stone-400 mt-1 uppercase tracking-tight">
                                    Explore Full Collection
                                </span>
                            </Link>
                        )}
                    </>
                ) : (
                    <div className="w-full text-center text-stone-400 py-20">
                        No arrivals found.
                    </div>
                )}
            </div>
        </section>
    );
}