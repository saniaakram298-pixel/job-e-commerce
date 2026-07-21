'use client';

import { useMemo, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Breadcrumb from '@/components/Breadcrumb';
import CategorySlider from '@/components/CategorySlider';
import { CategoryWithProducts } from '@/lib/categoryData';

interface SliderProductPreview {
  id?: string;
  name?: string;
  image?: string;
  img?: string;
}

interface CollectionPageClientProps {
  currentSlug: string;
  categories: CategoryWithProducts[];
  currentCategoryName: string;
  currentCategoryImage?: string;
  currentCategoryProducts?: SliderProductPreview[];
  children: React.ReactNode;
}

export default function CollectionPageClient({
  currentSlug,
  categories,
  currentCategoryName,
  currentCategoryImage,
  currentCategoryProducts,
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
 
    href: '/account',
    subtitle: 'Discover timeless pieces curated for your wardrobe.',
  }), []);

  const sliderCategories = useMemo(
    () =>
      categories.map((category) => {
        const isCurrentCategory = String(category.category || '').toLowerCase() === currentSlug.toLowerCase();
        const resolvedImage = category.image || (isCurrentCategory ? currentCategoryImage : '') || '';
        const resolvedProducts = (isCurrentCategory ? currentCategoryProducts : category.products || []).map((product) => ({
          image: product?.image || product?.img || '',
          img: product?.img || '',
        }));

        return {
          id: category.category,
          name: category.name,
          image: resolvedImage,
          products: resolvedProducts,
        };
      }),
    [categories, currentCategoryImage, currentCategoryProducts, currentSlug]
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