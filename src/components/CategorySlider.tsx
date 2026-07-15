'use client';

import { memo, startTransition, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Slider from 'react-slick';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { } from '@tanstack/react-query';

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

  // --- LOGICS NOT CHANGED ---
  const displayCategories = useMemo(() => {
    if (categories.length > 0) {
      return categories;
    }

    return [
      {
        id: 'featured',
        name: 'Featured Picks',
        image: '/images/hero2.webp',
      },
    ];
  }, [categories]);

  // Dynamic slides limit logic is kept exactly same, unaffected.
  const slidesToShow = Math.max(1, Math.min(displayCategories.length, 6));

  // --- NEW: Detect if we are on a Landing Page ---
  const isLandingPage = useMemo(() => {
    return pathname?.startsWith('/collections/') && pathname !== '/collections/';
  }, [pathname]);

  // --- NEW: Landing Page Specific Settings ---
  // Isme variableWidth aur safe bounds hain taake overlapping aur extra space dono khatam hon.
  const landingPageSettings = useMemo(() => ({
    arrows: false,
    dots: false,
    infinite: displayCategories.length > 3, // Safe infinite logic
    speed: 450,
    slidesToShow: 1, // Base (will be overriden by responsive)
    slidesToScroll: 1,
    swipeToSlide: true,
    variableWidth: true, // Crucial to avoid overlapping when many items exist
    responsive: [
      {
        breakpoint: 1920,
        settings: {
          slidesToShow: 1,
          infinite: displayCategories.length > 6,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          infinite: displayCategories.length > 3, // Tablet bound
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          infinite: displayCategories.length > 2, // Mobile bound
        },
      },
    ],
  }), [displayCategories.length]);

  // --- NEW: Home Page Settings (YOUR ORIGINAL SETTINGS) ---
  const homePageSettings = useMemo(() => ({
    arrows: false,
    dots: false,
    infinite: displayCategories.length > slidesToShow,
    speed: 450,
    slidesToShow,
    slidesToScroll: 1,
    swipeToSlide: true,
    responsive: [
      { breakpoint: 1920, settings: { slidesToShow: Math.max(1, Math.min(displayCategories.length, 6)) } },
      { breakpoint: 1536, settings: { slidesToShow: Math.max(1, Math.min(displayCategories.length, 5)) } },
      { breakpoint: 1280, settings: { slidesToShow: Math.max(1, Math.min(displayCategories.length, 4)) } },
      { breakpoint: 1024, settings: { slidesToShow: Math.max(1, Math.min(displayCategories.length, 3)) } },
      { breakpoint: 768, settings: { slidesToShow: Math.max(1, Math.min(displayCategories.length, 2)) } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  }), [displayCategories.length, slidesToShow]);

  // --- NEW: Final Settings Switch ---
  const finalSliderSettings = useMemo(() => {
    return isLandingPage ? landingPageSettings : homePageSettings;
  }, [isLandingPage, landingPageSettings, homePageSettings]);


  const resolvedActiveSlug = useMemo(() => {
    if (activeSlug) {
      return activeSlug;
    }

    if (!pathname) {
      return '';
    }

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
    // Use provided preview products when available; do NOT trigger any
    // network requests from the homepage. If `category.products` is not
    // present, show a placeholder image/initial instead.
    const arrayProducts: any[] = Array.isArray(category.products) ? category.products : [];

    const representativeImage = arrayProducts[0]?.image || arrayProducts[0]?.img || category.image;

    return (
      <div className={`h-full flex-shrink-0 ${isLandingPage ? 'px-2 sm:px-3 min-w-max' : 'px-4 sm:px-6 md:px-8 w-full'}`}>
        <button
          type="button"
          onClick={() => handleCategoryClick(category.id)}
          className={`w-full transition-all duration-300 ${resolvedActiveSlug.toLowerCase() === category.id.toLowerCase() ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
        >
          <div className="flex flex-col items-center text-center">
            {/* Swapped layout static responsive sizing */}
            <div className={`relative mb-3 h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 overflow-hidden rounded-full border-2 transition duration-300 flex-shrink-0 ${resolvedActiveSlug.toLowerCase() === category.id.toLowerCase() ? 'border-slate-900' : 'border-slate-200'}`}>
              {representativeImage ? (
                // Use next/image for proper optimization
                <Image
                  src={representativeImage}
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 6rem, (max-width: 1024px) 7rem, 8rem"
                  priority={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 px-2 text-center text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {category.name}
                </div>
              )}
            </div>
            {/* Fonts responsive scaled */}
            <p className={`text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${resolvedActiveSlug.toLowerCase() === category.id.toLowerCase() ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
              {category.name}
            </p>

            {arrayProducts.length > 0 ? (
              <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap max-w-full">
                {arrayProducts.slice(0, 3).map((product: any, index: number) => (
                  <div key={`${category.id}-${index}`} className="relative h-5 w-5 sm:h-6 sm:w-6 overflow-hidden rounded-full border border-white bg-slate-100 shadow-sm flex-shrink-0">
                    {product.img || product.image ? (
                      <Image src={product.img || product.image} alt={product.name || category.name} fill className="object-cover" sizes="1.5rem" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[7px] uppercase tracking-[0.2em] text-slate-500">
                        {category.name.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
                {arrayProducts.length > 3 ? (
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-400 flex-shrink-0">+{arrayProducts.length - 3}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </button>
      </div>
    );
  }

  return (
    // Section wrapper max-width bounds inside mobile viewports
    <section className="w-full max-w-full overflow-hidden border-b border-slate-200 bg-white py-6 md:py-8 relative">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-12">
        {/* Changed grid layout dynamic for small screens */}
        <div className="grid items-center gap-4 sm:gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          {/* Label text alignment is responsive */}
          <div className="text-center xl:text-left">
            <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-slate-500">Shop Collection</p>
          </div>

          {/* Slider wrapper limits layout overflow boundaries */}
          <div className="relative w-full max-w-full overflow-hidden px-1 sm:px-2">
            
            {/* Left Button - repositioned slightly offset for mobile so it never goes off-screen */}
            <button
              type="button"
              onClick={() => sliderRef.current?.slickPrev()}
              className="absolute left-1 sm:left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1.5 sm:p-2 shadow-sm transition hover:shadow-md hover:bg-slate-50 active:scale-95"
              aria-label="Previous category"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600" />
            </button>

            {/* Strict width wrapper targeting react-slick layout */}
            {/* Added px-8/px-10 to balance dynamic slider boundaries seamlessly */}
            <div className="w-full px-8 sm:px-10">
              {/* Changed settings pass-through to dynamic switch */}
              <Slider ref={sliderRef} {...finalSliderSettings}>
                {displayCategories.map((category) => (
                  <CategoryTile key={category.id} category={category} />
                ))}
              </Slider>
            </div>

            {/* Right Button - repositioned slightly offset for mobile so it never goes off-screen */}
            <button
              type="button"
              onClick={() => sliderRef.current?.slickNext()}
              className="absolute right-1 sm:right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1.5 sm:p-2 shadow-sm transition hover:shadow-md hover:bg-slate-50 active:scale-95"
              aria-label="Next category"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600" />
            </button>
            
          </div>
        </div>
      </div>
    </section>
  );
});

export default CategorySlider;