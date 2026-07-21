'use client';

import { memo, startTransition, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Slider from 'react-slick';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface CategorySliderItem {
  id: string;
  name: string;
  image?: string;
  products?: Array<{ id?: string; name?: string; image?: string; price?: string }>;
}

interface CategorySliderProps {
  categories: CategorySliderItem[];
  activeSlug?: string;
  onCategorySelect?: (slug: string) => void;
}

const CategorySlider = memo(function CategorySlider({
  categories,
  activeSlug,
  onCategorySelect,
}: CategorySliderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sliderRef = useRef<Slider | null>(null);

  // ✅ REMOVE DUPLICATES + FALLBACK
  const displayCategories = useMemo(() => {
    const source =
      categories.length > 0
        ? categories
        : [
            {
              id: 'featured',
              name: 'Featured Picks',
              image: '/images/hero2.webp',
            },
          ];

    // 🔥 UNIQUE FILTER
    return source.filter(
      (item, index, self) =>
        index === self.findIndex((c) => c.id === item.id)
    );
  }, [categories]);

  const isLandingPage = useMemo(() => {
    return pathname?.startsWith('/collections/') && pathname !== '/collections/';
  }, [pathname]);

  // ✅ FINAL FIXED SETTINGS
  const finalSliderSettings = useMemo(() => ({
    arrows: false,
    dots: false,
    infinite: false, // ❌ IMPORTANT FIX
    speed: 450,
    swipeToSlide: true,

    slidesToShow: 1,
    variableWidth: true,
    centerMode: true,
    centerPadding: isLandingPage ? "40px" : "0px",

    responsive: [
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1.2,
          infinite: false,
          variableWidth: false,
          centerMode: false,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          infinite: false,
        },
      },
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 4,
          infinite: false,
        },
      },
      {
        breakpoint: 9999,
        settings: {
          slidesToShow: 6,
          infinite: false,
        },
      },
    ],
  }), [isLandingPage]);

  const resolvedActiveSlug = useMemo(() => {
    if (activeSlug) return activeSlug;
    if (!pathname) return '';
    const match = pathname.match(/^\/collections\/([^/]+)/i);
    return match?.[1] || '';
  }, [activeSlug, pathname]);

  const handleCategoryClick = useCallback(
    (slug: string) => {
      onCategorySelect?.(slug);
      startTransition(() => {
        router.push(`/collections/${slug}`);
      });
    },
    [onCategorySelect, router]
  );

  if (!displayCategories.length) return null;

  function CategoryTile({ category }: { category: CategorySliderItem }) {
    const arrayProducts: any[] = Array.isArray(category.products) ? category.products : [];
    const representativeImage =
      arrayProducts[0]?.image || arrayProducts[0]?.img || category.image;

    return (
      <div className="px-2 w-[95px] sm:w-[110px] md:w-full">
        <button
          type="button"
          onClick={() => handleCategoryClick(category.id)}
          className={`w-full transition-all duration-300 ${
            resolvedActiveSlug.toLowerCase() === category.id.toLowerCase()
              ? 'opacity-100'
              : 'opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`relative mb-3 h-20 w-20 sm:h-24 sm:w-24 md:h-24 md:w-24 lg:h-28 lg:w-28 overflow-hidden rounded-full border-2 ${
                resolvedActiveSlug.toLowerCase() === category.id.toLowerCase()
                  ? 'border-slate-900'
                  : 'border-slate-200'
              }`}
            >
              {representativeImage ? (
                <Image
                  src={representativeImage}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[9px] text-slate-500">
                  {category.name}
                </div>
              )}
            </div>

            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em]">
              {category.name}
            </p>
          </div>
        </button>
      </div>
    );
  }

  return (
    <section className="w-full overflow-hidden border-b border-slate-200 bg-white py-6 md:py-8">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-12">
        <div className="grid items-center gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">

          <div className="text-center xl:text-left">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Shop Collection
            </p>
          </div>

          <div className="relative w-full overflow-hidden">

            {/* LEFT */}
            <button
              onClick={() => sliderRef.current?.slickPrev()}
              className="flex absolute left-2 top-1/2 z-20 -translate-y-1/2 bg-white/90 backdrop-blur p-2 rounded-full shadow-md hover:scale-105 transition"
            >
              <ChevronLeft size={18} />
            </button>

            <Slider ref={sliderRef} {...finalSliderSettings}>
              {displayCategories.map((category) => (
                <CategoryTile key={category.id} category={category} />
              ))}
            </Slider>

            {/* RIGHT */}
            <button
              onClick={() => sliderRef.current?.slickNext()}
              className="flex absolute right-2 top-1/2 z-20 -translate-y-1/2 bg-white/90 backdrop-blur p-2 rounded-full shadow-md hover:scale-105 transition"
            >
              <ChevronRight size={18} />
            </button>

          </div>
        </div>
      </div>
    </section>
  );
});

export default CategorySlider;