"use client";

import { useState, useEffect } from 'react';
import { Arrival, Category } from '@/types';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TrustBadges from '@/components/TrustBadges';
import NewArrivals from '@/components/NewArrivalsClient';
import BestSellers from '@/components/BestSellers';
import DepartmentsWithData from '@/components/DepartmentsWithData';
import BrandStory from '@/components/BrandStory';
import Testimonials from '@/components/Testimonials';
import LimitedEditions from '@/components/LimitedEditions';
import SocialGallery from '@/components/SocialGallery';
import EditorialSection from '@/components/EditorialSection';
import InstagramFeed from '@/components/InstagramFeed';
import NewsletterHome from '@/components/NewsletterHome';
import Footer from '@/components/Footer';

const socialImages: string[] = [
  '1515886657647-981c35c363ad',
  '1490481651871-ab68de25d43d',
  '1485230895905-ec40ba36b9bc',
  '1539109136881-3be0616acf4b',
  '1496747611176-843222e1e57c',
  '1509631179647-0177331693ae',
];

const trustBadges = [
  { icon: 'public', title: 'Global Shipping', desc: 'Express delivery' },
  { icon: 'verified', title: 'Authentic Craft', desc: 'Certified quality' },
  { icon: 'lock', title: 'Secure Checkout', desc: '100% Protected' },
  { icon: 'auto_awesome', title: 'Bespoke Service', desc: 'Tailored for you' },
];

const heroData = {
  title: 'The Atelier',
  buttonText: 'Explore Collection',
  imagePath: '/images/hero.png',
  href: '/collections',
};

interface HomePageClientProps {
  categories: Category[];
  bestSellers: Arrival[];
}

export default function HomePageClient({ categories, bestSellers }: HomePageClientProps) {
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

      {categories.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-12">
          <div className="mb-10 text-center">
            <span className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-bold block mb-3">
              Explore by Category
            </span>
            <h2 className="font-serif text-4xl tracking-tight">Featured Categories</h2>
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div key={category.id} className="overflow-hidden rounded-3xl bg-stone-100 shadow-sm">
                <img
                  src={category.img}
                  alt={category.name}
                  className="h-64 w-full object-cover"
                />
                <div className="p-6">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500 mb-2">
                    {category.id}
                  </p>
                  <h3 className="font-serif text-2xl tracking-tight">{category.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <NewArrivals />
      <BestSellers arrivals={bestSellers} />
      <DepartmentsWithData budget={budget} setBudget={setBudget} />
      <BrandStory />
      <Testimonials />
      <LimitedEditions />
      <SocialGallery socialImages={socialImages} />
      <EditorialSection />
      <InstagramFeed />
      <NewsletterHome />
      <Footer />
    </div>
  );
}
