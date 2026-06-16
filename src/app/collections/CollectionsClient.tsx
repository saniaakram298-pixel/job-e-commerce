"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductDetailModal from './ProductDetailModal';
import BackButton from '@/components/BackButton';

interface Product {
  id: string;
  _id: string;
  name: string;
  title: string;
  price: string;
  numericPrice: number;
  img: string;
  category: string;
  createdAt: string;
  description?: string;
  tags?: string[];
  sizes?: Array<{ size: string; stock: number }>;
  stock?: number;
  collection?: string;
}

interface Section {
  title: string;
  category: string;
  items: Product[];
}

interface CollectionsClientProps {
  initialRawProducts: Product[];
  initialActiveSections: Section[];
}

export default function CollectionsClient({ 
  initialRawProducts = [], 
  initialActiveSections = [] 
}: CollectionsClientProps) {
  const [rawProducts, setRawProducts] = useState<Product[]>(initialRawProducts);
  const [activeSections, setActiveSections] = useState<Section[]>(initialActiveSections);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  useEffect(() => {
    // Only fetch if no initial data was provided
    if (initialRawProducts.length === 0) {
      const fetchDashboardData = async () => {
        try {
          setIsLoading(true);
          setError(null);

          const apiUrl = new URL('/api/collections', window.location.origin);
          apiUrl.searchParams.set('page', '1');
          apiUrl.searchParams.set('limit', '1000');

          const response = await fetch(apiUrl.toString(), { cache: 'no-store' });
          const parsedData = await response.json();

          if (!response.ok) {
            throw new Error(parsedData?.error || 'Failed to fetch collections');
          }

          const collectionsData = Array.isArray(parsedData)
            ? parsedData
            : Array.isArray(parsedData?.collections)
              ? parsedData.collections
              : [];

          setRawProducts(collectionsData || []);

          const structuredData: Section[] = [];
          collectionsData.forEach((adminItem: any) => {
            const categoryName = adminItem.category || 'General';
            const matchedSection = structuredData.find(
              section => section.category.toLowerCase() === categoryName.toLowerCase()
            );

            const newItem = {
              id: adminItem._id,
              _id: adminItem._id,
              name: adminItem.title,
              title: adminItem.title,
              price: `$${adminItem.price}`,
              numericPrice: Number(adminItem.price),
              img: adminItem.img || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80',
              category: categoryName,
              createdAt: adminItem.createdAt,
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
        } finally {
          setIsLoading(false);
        }
      };
      fetchDashboardData();
    }
  }, [initialRawProducts.length]);

  // LOGIC 1: New Arrivals (Puri inventory ke latest 10 items)
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
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Navbar & Admin Panel Toggle (Same as before) */}

      {/* Hero Section */}
      <div className="h-[65vh] relative flex items-center justify-center bg-stone-200">
        <Image src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80" alt="Hero" fill className="object-cover opacity-70" priority />
        <div className="relative z-10 text-center text-white">
          <h1 className="font-serif text-7xl md:text-9xl italic tracking-tighter">Collection</h1>
        </div>
      </div>

      {/* Back Button Section */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-12">
        <BackButton />
      </div>

      {/* LOGIC 1: NEW ARRIVALS SECTION (Hero ke foran baad) */}
      <section className="max-w-[1440px] mx-auto px-6 py-20 bg-stone-50">
        <div className="mb-12 text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-bold mb-2 block">Freshly Added</span>
          <h2 className="font-serif text-5xl italic">New Arrivals</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {newArrivals.length > 0 ? (
            newArrivals.map((item) => (
              <ProductCard 
                key={item.id || item._id} 
                item={item}
                onViewDetails={() => handleViewDetails(item)}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-stone-500 py-16">
              {isLoading ? 'Loading collections...' : 'No products available in this category yet.'}
            </div>
          )}
        </div>
        {error && (
          <p className="text-center text-sm text-red-500 mt-6">{error}</p>
        )}
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
                  <ProductCard 
                    key={item.id} 
                    item={item}
                    onViewDetails={() => handleViewDetails(item)}
                  />
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
function ProductCard({ item, onViewDetails }: { item: any; onViewDetails: () => void }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 rounded-lg">
        <Image 
          src={item.img} 
          alt={item.name} 
          fill 
          className="object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        {/* View Details Button - Visible on Hover */}
        <button
          onClick={onViewDetails}
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors duration-300 opacity-0 group-hover:opacity-100"
        >
          <span className="px-6 py-2 bg-white text-stone-900 font-bold uppercase tracking-widest text-sm rounded-lg transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            View Details
          </span>
        </button>
      </div>
      <h3 className="font-serif text-lg mt-4 line-clamp-2">{item.name || item.title}</h3>
      <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{item.price}</p>
    </div>
  );
}
