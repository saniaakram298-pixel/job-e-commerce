"use client";

import { useState, useEffect } from 'react';
import { Arrival } from '@/types';
import { CategoryWithProducts } from '@/lib/categoryData';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TrustBadges from '@/components/TrustBadges';
import NewArrivals from '@/components/NewArrivalsClient';
import BestSellers from '@/components/BestSellers';
import DepartmentsWithData from '@/components/DepartmentsWithData';
import Footer from '@/components/Footer';

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
      <Hero data={heroData} />
      <TrustBadges badges={trustBadges} />

      <main className="max-w-[1440px] mx-auto px-6 md:px-12 space-y-20 py-12">
        <NewArrivals initialArrivals={newArrivals} />
        <BestSellers arrivals={bestSellers} />
        <DepartmentsWithData budget={budget} setBudget={setBudget} initialCategories={categories} />
      </main>

      <Footer />
    </div>
  );
}
