'use client';

import { memo, startTransition, useCallback, useEffect, useMemo, useRef } from 'react';
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
  products?: Array<{ image?: string }>;
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
  const prefetchedRef = useRef<Set<string>>(new Set());

  const prefetchRoute = useCallback(
    async (slug: string) => {
      const route = `/collections/${slug}`;
      if (prefetchedRef.current.has(route)) {
        return;
      }

      prefetchedRef.current.add(route);

      try {
        await router.prefetch(route);
      } catch {
        prefetchedRef.current.delete(route);
      }
    },
    [router]
  );

  useEffect(() => {
    void Promise.all(categories.map((category) => prefetchRoute(category.id)));
  }, [categories, prefetchRoute]);

  const slidesToShow = Math.max(1, Math.min(categories.length, 5));

  const sliderSettings = useMemo(
    () => ({
      arrows: false,
      dots: false,
      infinite: categories.length > slidesToShow,
      speed: 450,
      slidesToShow,
      slidesToScroll: 1,
      swipeToSlide: true,
      responsive: [
        { breakpoint: 1280, settings: { slidesToShow: Math.max(1, Math.min(categories.length, 4)) } },
        { breakpoint: 1024, settings: { slidesToShow: Math.max(1, Math.min(categories.length, 3)) } },
        { breakpoint: 768, settings: { slidesToShow: Math.max(1, Math.min(categories.length, 2)) } },
        { breakpoint: 640, settings: { slidesToShow: 1 } },
      ],
    }),
    [categories.length, slidesToShow]
  );

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

  if (!categories.length) {
    return null;
  }

  return (
    <section className="border-b border-slate-200 bg-white py-8">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <div className="grid items-center gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Shop Collection</p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => sliderRef.current?.slickPrev()}
              className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 shadow-sm transition hover:shadow-md"
              aria-label="Previous category"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>

            <Slider ref={sliderRef} {...sliderSettings}>
              {categories.map((category) => {
                const isActive = resolvedActiveSlug.toLowerCase() === category.id.toLowerCase();
                return (
                  <div key={category.id} className="px-2">
                    <button
                      type="button"
                      onMouseEnter={() => {
                        void prefetchRoute(category.id);
                      }}
                      onFocus={() => {
                        void prefetchRoute(category.id);
                      }}
                      onClick={() => handleCategoryClick(category.id)}
                      className={`w-full transition-all ${isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div
                          className={`relative mb-3 h-32 w-32 overflow-hidden rounded-full border-2 transition ${
                            isActive ? 'border-slate-900' : 'border-slate-200'
                          }`}
                        >
                          {category.products?.[0]?.image || category.image ? (
                            <Image
                              src={category.products?.[0]?.image || category.image || '/images/arrival-1.png'}
                              alt={category.name}
                              fill
                              className="object-cover"
                              sizes="8rem"
                              priority={false}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-100 px-2 text-center text-[10px] uppercase tracking-[0.2em] text-slate-500">
                              {category.name}
                            </div>
                          )}
                        </div>
                        <p className={`text-xs uppercase tracking-[0.2em] ${isActive ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                          {category.name}
                        </p>
                      </div>
                    </button>
                  </div>
                );
              })}
            </Slider>

            <button
              type="button"
              onClick={() => sliderRef.current?.slickNext()}
              className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 shadow-sm transition hover:shadow-md"
              aria-label="Next category"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

export default CategorySlider;