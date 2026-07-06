'use client';

import { useMemo, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Breadcrumb from '@/components/Breadcrumb';
import CategorySlider from '@/components/CategorySlider';
import { CategoryWithProducts } from '@/lib/categoryData';

interface CollectionPageClientProps {
  currentSlug: string;
  categories: CategoryWithProducts[];
  currentCategoryName: string;
  children: React.ReactNode;
}

export default function CollectionPageClient({
  currentSlug,
  categories,
  currentCategoryName,
  children,
}: CollectionPageClientProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroData = useMemo(() => ({
    title: 'Modern Elegance',
    buttonText: 'Go to My Account',
    imagePath: '/images/hero2.webp',
    images: [
      '/images/hero1.webp',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=80&fm=webp',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80&fm=webp',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80&fm=webp',
    ],
    href: '/account',
    subtitle: 'Discover timeless pieces curated for your wardrobe.',
  }), []);

  const sliderCategories = useMemo(
    () =>
      categories.map((category) => ({
        id: category.category,
        name: category.name,
        image: category.image || '',
        products: (category.products || []).map((product) => ({
          image: Array.isArray(product.images) && product.images.length > 0
            ? product.images[0]
            : '',
        })),
      })),
    [categories]
  );

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <Navbar scrolled={scrolled} />
      <Hero data={heroData} showRotatingProduct={false} />

      <section className="border-b border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-6 md:px-12">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: currentCategoryName || 'Collections' }]} />
          <CategorySlider categories={sliderCategories} activeSlug={currentSlug} />
        </div>
      </section>

      {children}
    </div>
  );
}