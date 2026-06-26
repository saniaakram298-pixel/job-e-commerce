"use client";

import { useState, useEffect, useMemo } from 'react';
import { Arrival } from '@/types';
import { CategoryWithProducts } from '@/lib/categoryData';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TrustBadges from '@/components/TrustBadges';
import NewArrivals from '@/components/NewArrivalsClient';
import BestSellers from '@/components/BestSellers';
import DepartmentsWithData from '@/components/DepartmentsWithData';
import LimitedEditions from '@/components/LimitedEditions';
import BrandStory from '@/components/BrandStory';
import Footer from '@/components/Footer';
import Reviews from '@/components/Reviews';
import WhatsAppButton from '@/components/WhatsAppButton';
import FilterStrip from '@/components/FilterStrip';
import FilterDrawer from '@/components/FilterDrawer';
import SearchOverlay from '@/components/SearchOverlay';

const trustBadges = [
  { icon: 'public', title: 'Global Shipping', desc: 'Express delivery' },
  { icon: 'verified', title: 'Authentic Craft', desc: 'Certified quality' },
  { icon: 'lock', title: 'Secure Checkout', desc: '100% Protected' },
  { icon: 'auto_awesome', title: 'Bespoke Service', desc: 'Tailored for you' },
];

const heroData = {
  title: 'The Atelier',
  buttonText: 'Explore Collection',
  imagePath: '/images/hero1.webp',
  href: '/collections',
};

interface HomePageClientProps {
  bestSellers: Arrival[];
  newArrivals?: Arrival[];
  categories?: CategoryWithProducts[];
}

export default function HomePageClient({ bestSellers, newArrivals = [], categories = [] }: HomePageClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [budget, setBudget] = useState(5000);
  const [showFilters, setShowFilters] = useState(false);

  const homepageSummary = useMemo(() => {
    const productMap = new Map<string, number>();

    const addProduct = (id: string | undefined, stock?: number) => {
      if (!id) return;
      const existingStock = productMap.get(id) ?? 0;
      productMap.set(id, existingStock + (stock ?? 0));
    };

    categories.forEach((category) => {
      category.products.forEach((product) => addProduct(product._id, product.stock));
    });

    bestSellers.forEach((product) => addProduct(product.id || product._id, product.stock));
    newArrivals.forEach((product) => addProduct(product.id || product._id, product.stock));

    const totalProducts = productMap.size;
    const totalStock = Array.from(productMap.values()).reduce((sum, stockValue) => sum + stockValue, 0);

    return {
      totalProducts,
      totalStock,
    };
  }, [categories, bestSellers, newArrivals]);

  const heroDataWithStats = {
    ...heroData,
    subtitle: `${homepageSummary.totalProducts} products available on the homepage with ${homepageSummary.totalStock} items in stock`,
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar scrolled={scrolled} />
      <Hero data={heroDataWithStats} />
      <TrustBadges badges={trustBadges} />

      <main className="max-w-[1440px] mx-auto px-6 md:px-12 space-y-20 py-12">
        <NewArrivals initialArrivals={newArrivals} />
        <BestSellers arrivals={bestSellers} />

        {/* Thin filter/sort strip above collections/products */}
        <FilterStrip onOpenFilters={() => setShowFilters(true)} />

        <DepartmentsWithData budget={budget} setBudget={setBudget} initialCategories={categories} />
        <LimitedEditions />
        <BrandStory />
        <Reviews />
      </main>

      <Footer />
      <WhatsAppButton />

      {/* Filter drawer for mobile */}
      <FilterDrawer open={showFilters} onClose={() => setShowFilters(false)} />

      {/* Global search overlay */}
      <SearchOverlay />
    </div>
  );
}
