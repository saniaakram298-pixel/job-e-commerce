'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    fetchProductsByCategories,
    CategoryWithProducts,
    getCategoryDisplayName,
    ProductCategory,
} from '@/lib/categoryData';
import { formatNumber } from '@/lib/price';
import { useCart } from '@/context/CartContext';

interface DepartmentsProps {
    budget: number;
    setBudget: (budget: number) => void;
    initialCategories?: CategoryWithProducts[];
}

export default function DepartmentsWithData({
    budget,
    setBudget,
    initialCategories = [],
}: DepartmentsProps) {
    const { addToCart } = useCart();
    const filteredInitialCategories = initialCategories.filter((cat) => cat.category !== 'new-arrival');
    const [categories, setCategories] = useState<CategoryWithProducts[]>(filteredInitialCategories);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(filteredInitialCategories.length === 0);
    const router = useRouter();

    // Convert admin collection items into storefront categories if product grouping fails
    const mapAdminCollectionsToCategories = (adminCollections: any[]): CategoryWithProducts[] => {
        const grouped: Record<string, CategoryWithProducts> = {};

        adminCollections.forEach((item) => {
            const category = (String(item.category || 'accessories').toLowerCase() as ProductCategory);
            const categoryKey = category;
            const categoryName = getCategoryDisplayName(category);

            if (!grouped[categoryKey]) {
                grouped[categoryKey] = {
                    category: categoryKey,
                    name: categoryName,
                    products: [],
                    total: 0,
                };
            }

            grouped[categoryKey].products.push({
                _id: item._id,
                name: item.title,
                price: Number(item.price || 0),
                discountPrice: item.discountPrice ? Number(item.discountPrice) : undefined,
                images: item.images || (item.img ? [item.img] : []),
                category: categoryKey,
                featured: Boolean(item.featured),
                createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
                tags: Array.isArray(item.tags) ? item.tags : item.tag ? [item.tag] : [],
            });
            grouped[categoryKey].total = grouped[categoryKey].products.length;
        });

        return Object.values(grouped).filter((cat) => cat.total > 0);
    };

    // Fetch categories with products
    useEffect(() => {
        if (filteredInitialCategories.length > 0) {
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                let data = await fetchProductsByCategories(undefined, 10);
                let filteredData = data.filter((cat) => cat.category !== 'new-arrival');

                if (filteredData.length === 0) {
                    const collectionsRes = await fetch('/api/collections');
                    if (collectionsRes.ok) {
                        const maybe = await collectionsRes.json().catch(() => null);
                        const adminCollections = Array.isArray(maybe) ? maybe : maybe?.collections ?? [];
                        filteredData = mapAdminCollectionsToCategories(adminCollections);
                    }
                }

                setCategories(filteredData);
            } catch (error) {
                console.error('Failed to fetch collections:', error);
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filteredInitialCategories.length]);

    const defaultImages: Record<string, string> = {
        'men': 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=800',
        'women': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800',
        'children': 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?q=80&w=800',
        'bridal': 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800',
        'groom': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800',
        'shoes': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800',
        'formal': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800',
        'informal': 'https://images.unsplash.com/photo-1441896133855-c99409d3e5b7?q=80&w=800',
        
        'accessories': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800',
        'young': 'https://images.unsplash.com/photo-1515521396207-6461f1028e57?q=80&w=800',
        'old-people': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800',
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
                            Our Collections
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

                {/* --- LOADING STATE --- */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-stone-600 font-semibold">Loading collections...</p>
                        </div>
                    </div>
                )}

                {/* --- DYNAMIC ROWS --- */}
                {!loading && categories.length > 0 && (
                    <div className="space-y-32">
                        {categories.map((cat, index) => (
                            <div key={cat.category} className="group/row">
                                {/* Category Header */}
                                <div className="flex items-center justify-between mb-8 px-2">
                                    <div className="flex items-center gap-6">
                                        <span className="text-[11px] font-mono text-stone-300 font-medium">
                                            / {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <h3 className="font-serif text-3xl md:text-4xl tracking-tight group-hover/row:italic transition-all duration-700">
                                            {cat.name}
                                        </h3>
                                        <span className="text-stone-400 text-sm ml-4">
                                            ({cat.total} items)
                                        </span>
                                    </div>
                                    <Link
                                        href={`/collections/${cat.category}`}
                                        className="group/link flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400 hover:text-stone-900 transition-all"
                                    >
                                        View All
                                        <span className="material-symbols-outlined text-xs transition-transform group-hover/link:translate-x-2">
                                            east
                                        </span>
                                    </Link>
                                </div>

                                {/* Horizontal Scroll Cards */}
                                <div className="relative">
                                    <div className="flex overflow-x-auto gap-8 pb-10 no-scrollbar snap-x snap-mandatory scroll-smooth">
                                        {cat.products.length > 0 ? (
                                            cat.products.map((product, idx) => (
                                                <div
                                                    key={product._id}
                                                    onClick={() => router.push(`/product/${product._id}`)}
                                                    className="min-w-[300px] md:min-w-[400px] aspect-[4/5] relative overflow-hidden bg-stone-100 snap-start group cursor-pointer"
                                                >
                                                    <img
                                                        src={product.images?.[0] || defaultImages[cat.category] || defaultImages.default}
                                                        alt={product.name}
                                                        className="absolute inset-0 w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = defaultImages.default;
                                                        }}
                                                    />

                                                    {/* Sophisticated Glass Overlay */}
                                                    <div className="absolute inset-x-4 bottom-4 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 bg-white/10 backdrop-blur-xl border border-white/20 rounded-sm">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <p className="text-white text-[9px] uppercase tracking-[0.2em] mb-1 opacity-80">
                                                                    {cat.name} Collection
                                                                </p>
                                                                <h4 className="text-white font-serif italic text-xl line-clamp-2">
                                                                    {product.name}
                                                                </h4>
                                                            </div>
                                                            <span className="text-white font-medium text-sm whitespace-nowrap ml-4">
                                                                ${formatNumber(product.price, 0)}
                                                            </span>
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                addToCart({
                                                                    id: product._id,
                                                                    _id: product._id,
                                                                    name: product.name,
                                                                    img: product.images?.[0] || defaultImages[cat.category] || defaultImages.default,
                                                                    price: String(product.price || 0),
                                                                    cat: product.category || cat.name,
                                                                    category: product.category || cat.name,
                                                                    images: product.images ?? [],
                                                                    createdAt: new Date().toISOString(),
                                                                    updatedAt: new Date().toISOString(),
                                                                });
                                                            }}
                                                            className="w-full py-3 bg-white text-black text-[10px] uppercase tracking-widest font-bold hover:bg-stone-900 hover:text-white transition-colors duration-300"
                                                        >
                                                            Add to Cart
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            // Placeholder cards if no products
                                            [1, 2, 3, 4, 5, 6].map((idx) => (
                                                <div
                                                    key={idx}
                                                    className="min-w-[300px] md:min-w-[400px] aspect-[4/5] relative overflow-hidden bg-stone-200 snap-start animate-pulse"
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- EMPTY STATE --- */}
                {!loading && categories.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-stone-600 text-lg mb-6">No collections available yet.</p>
                        <p className="text-stone-500">Products will appear here as you add them to the Admin Dashboard.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
