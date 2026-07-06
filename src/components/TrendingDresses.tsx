"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Slider from "react-slick";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Arrival } from "@/types";
import { useRouter } from "next/navigation";

const ROW_SIZE = 20;
const INITIAL_BATCH = 4;
const MAX_PRODUCTS = 60;

function formatPrice(value: string | number | undefined) {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return "$0";
  return `$${amount.toFixed(0)}`;
}

function PlaceholderCard() {
  return (
    <div className="h-full rounded-[1.75rem] border border-slate-200 bg-white shadow-sm p-4">
      <div className="h-[280px] w-full rounded-[1.5rem] bg-slate-200" />
      <div className="mt-5 space-y-3">
        <div className="h-5 w-3/4 rounded-full bg-slate-200" />
        <div className="h-5 w-1/2 rounded-full bg-slate-200" />
        <div className="h-4 w-1/3 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Arrival }) {
  const router = useRouter();
  const imageUrl = product.images?.[0] || product.img || "/api/placeholder/400/500";
  const price = formatPrice(product.price);

  return (
    <button
      type="button"
      onClick={() => router.push(`/product/${product._id || product.id}`)}
      className="group h-full text-left"
    >
      <div className="h-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="relative h-[280px] w-full overflow-hidden bg-slate-100">
          <Image
            src={imageUrl}
            alt={product.name || "Trending Dress"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 280px"
          />
        </div>

        <div className="p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Trending Dress
          </p>
          <h3 className="mt-3 text-base font-semibold text-slate-900 line-clamp-2">
            {product.name || "Elegant Dress"}
          </h3>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-lg font-bold text-slate-900">{price}</span>
            <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
              {product.category || product.cat || "Women"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function TrendingDresses() {
  const [products, setProducts] = useState<Arrival[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [nextOffset, setNextOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sliderRefs = useRef<Array<Slider | null>>([]);

  const loadProducts = async (offset: number, limit: number) => {
    setLoadingMore(true);

    try {
      const response = await fetch(`/api/products/trending?offset=${offset}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Unable to load trending dresses");
      }

      const payload = await response.json();
      console.log('Trending products payload:', payload);

      const rawProducts = Array.isArray(payload?.data?.products)
        ? payload.data.products
        : Array.isArray(payload?.products)
          ? payload.products
          : [];

      const items = rawProducts.filter((product: any) => {
        const isTrending = product?.isTrending === true || product?.trending === true;
        return isTrending;
      });

      console.log('Trending products received:', { count: items.length, items });

      const total = Number(payload?.data?.pagination?.total ?? payload?.pagination?.total ?? items.length) || items.length;
      const cappedTotal = Math.min(total, MAX_PRODUCTS);

      setProducts((prev) => {
        const merged = [...prev, ...items];
        return merged.slice(0, cappedTotal);
      });
      setTotalProducts(cappedTotal);
      setNextOffset(offset + items.length);
    } catch (err) {
      setError((err as Error).message || "Failed to load trending dresses.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      if (!active) return;
      await loadProducts(0, INITIAL_BATCH);
    };

    void init();
    return () => {
      active = false;
    };
  }, []);

  const rowCount = Math.max(1, Math.ceil(Math.max(totalProducts, products.length) / ROW_SIZE));
  const rows = useMemo<Array<Array<Arrival | null>>>(
    () =>
      Array.from({ length: rowCount }, (_, rowIndex) =>
        Array.from({ length: ROW_SIZE }, (_, colIndex) => {
          const productIndex = rowIndex * ROW_SIZE + colIndex;
          return (products[productIndex] ?? null) as Arrival | null;
        })
      ),
    [products, rowCount]
  );

  const handleAfterChange = useCallback(
    (rowIndex: number, currentSlide: number) => {
      const rowStart = rowIndex * ROW_SIZE;
      const loadedInRow = Math.max(0, Math.min(ROW_SIZE, products.length - rowStart));
      const shouldLoadMore = currentSlide + 2 >= loadedInRow && products.length < totalProducts && !loadingMore;

      if (shouldLoadMore) {
        void loadProducts(nextOffset, 1);
      }
    },
    [products.length, totalProducts, loadingMore, nextOffset]
  );

  const getSliderSettings = (rowIndex: number) => ({
    arrows: false,
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: 3,
    slidesToScroll: 1,
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 1280,
        settings: { slidesToShow: 3 },
      },
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1.05 },
      },
    ],
    afterChange: (current: number) => handleAfterChange(rowIndex, current),
  });

  const handleNavigation = (rowIndex: number, direction: "prev" | "next") => {
    const slider = sliderRefs.current[rowIndex];
    if (!slider) return;
    if (direction === "prev") {
      slider.slickPrev();
    } else {
      slider.slickNext();
    }
  };

  return (
    <section className="bg-white py-16 border-t border-slate-200">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm tracking-[0.35em] uppercase text-slate-500">Trending Dresses</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Discover the latest trending dresses
            </h2>
          </div>
          <div className="text-sm text-slate-500">
            {loading && "Loading trending dresses..."}
            {loadingMore && !loading && "Loading more..."}
            {error && <span className="text-red-600">{error}</span>}
            {!loading && !error && products.length === 0 && <span>No trending dresses found.</span>}
          </div>
        </div>

        <div className="space-y-12">
          {rows.map((row, rowIndex) => (
            <div key={`trending-row-${rowIndex}`} className="rounded-[2rem] bg-slate-50 p-5 shadow-sm">
              <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Row {rowIndex + 1}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {row.filter(Boolean).length > 0 ? `${row.filter(Boolean).length} items` : "Loading..."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleNavigation(rowIndex, "prev")}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
                    aria-label={`Previous row ${rowIndex + 1}`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigation(rowIndex, "next")}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
                    aria-label={`Next row ${rowIndex + 1}`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <Slider
                  ref={(slider) => {
                    sliderRefs.current[rowIndex] = slider;
                  }}
                  {...getSliderSettings(rowIndex)}
                >
                  {(loading ? new Array(INITIAL_BATCH).fill(null) : row).map((product, idx) => (
                    <div key={`card-${rowIndex}-${idx}`} className="px-3">
                      {product ? <ProductCard product={product} /> : <PlaceholderCard />}
                    </div>
                  ))}
                </Slider>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
