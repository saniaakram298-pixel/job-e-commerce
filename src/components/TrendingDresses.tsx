"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import Image from "next/image";
import Slider from "react-slick";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Arrival } from "@/types";
import { useTrendingProducts, makeQueryClient } from '@/hooks/useTrendingProducts';

const ROW_SIZE = 20;
const INITIAL_BATCH = 4;
const MAX_PRODUCTS = 60;
const TRENDING_CACHE_KEY = "trending-dresses-cache-v1";

type CachedTrendingData = {
  products: Arrival[];
  signature: string;
};

function formatPrice(value: string | number | undefined) {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return "$0";
  return `$${amount.toFixed(0)}`;
}

function getProductKey(product: Arrival | null | undefined) {
  return product?._id || product?.id || product?.name || "";
}

function getProductSignature(products: Arrival[]) {
  return products
    .map((product) => `${getProductKey(product)}:${product?.updatedAt || product?.createdAt || ""}`)
    .join("|");
}

function mergeUniqueProducts(previous: Arrival[], incoming: Arrival[]) {
  const merged: Arrival[] = [...previous];
  const seen = new Set<string>();

  merged.forEach((product) => {
    const key = getProductKey(product);
    if (key) seen.add(key);
  });

  incoming.forEach((product) => {
    const key = getProductKey(product);
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(product);
  });

  return merged;
}

function readCachedProducts() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(TRENDING_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedTrendingData;
  } catch {
    return null;
  }
}

function writeCachedProducts(products: Arrival[], signature: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      TRENDING_CACHE_KEY,
      JSON.stringify({
        products,
        signature,
      })
    );
  } catch {
    // ignore storage failures
  }
}

function getImageUrl(product: Arrival) {
  const images = product.images ?? ((product as any).img ? [(product as any).img] : []);
  if (Array.isArray(images) && images.length > 0) {
    const first = images.find(Boolean) as any;
    if (!first) return "/api/placeholder/400/500";
    if (typeof first === "string") return first;
    if (first?.url) return first.url;
    if (first?.src) return first.src;
    if (first?.image) return first.image;
  }

  if ((product as any).img) return (product as any).img;
  if ((product as any).imageUrl) return (product as any).imageUrl;
  return "/api/placeholder/400/500";
}

function PlaceholderCard() {
  return (
    <div className="h-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="aspect-[4/5] w-full rounded-[1.5rem] bg-slate-200" />
      <div className="mt-4 space-y-3">
        <div className="h-5 w-3/4 rounded-full bg-slate-200" />
        <div className="h-5 w-1/2 rounded-full bg-slate-200" />
        <div className="h-4 w-1/3 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onAddToCart,
}: {
  product: Arrival;
  onAddToCart: (product: Arrival) => void;
}) {
  const router = useRouter();

  const images =
    product.images?.length
      ? product.images
      : [(product as any).img || "/api/placeholder/400/500"];

  const mainImg = getImageUrl(product);

  const [hoverImg, setHoverImg] = useState(mainImg);

  const price = formatPrice(product.price);

  const goToProduct = () => {
    router.push(`/product/${product._id || product.id}`);
  };

  return (
    <div
      onClick={goToProduct}
      className="group h-full text-left cursor-pointer"
    >
      <div className="h-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

        {/* IMAGE */}
        <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">

          {/* BADGE */}
          <span className="absolute left-3 top-3 z-20 inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase text-white">
            Trending
          </span>

          {/* MAIN IMAGE */}
          <Image
            src={hoverImg}
            alt={product.name || "Trending"}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />

          {/* OVERLAY */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-500" />

          {/* THUMBNAILS */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
              {images.slice(0, 4).map((img: any, i: number) => {
                const src =
                  typeof img === "string"
                    ? img
                    : img?.url || img?.src || img?.image;

                return (
                  <img
                    key={i}
                    src={src}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setHoverImg(src);
                    }}
                    onMouseLeave={(e) => {
                      e.stopPropagation();
                      setHoverImg(mainImg);
                    }}
                    className="w-10 h-10 object-cover border rounded cursor-pointer hover:scale-110 transition"
                  />
                );
              })}
            </div>
          )}

          {/* ADD TO CART BUTTON */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="absolute bottom-14 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 
            group-hover:opacity-100 group-hover:translate-y-0 transition 
            bg-black text-white px-4 py-2 text-xs rounded"
          >
            Add to Cart
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-5">
          <h3 className="mt-2 text-base font-semibold text-slate-900 line-clamp-2">
            {product.name || "Elegant Dress"}
          </h3>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-lg font-bold text-slate-900">
              {price}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToProduct();
              }}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-black hover:text-white transition"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrendingDresses() {
  const cachedProducts = readCachedProducts();
  const initialProducts = cachedProducts?.products ?? [];

  const [cartCount, setCartCount] = useState(0);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) queryClientRef.current = makeQueryClient();

  // Use TanStack Query to fetch trending products with persistent cache
  const trendingQuery = useTrendingProducts(MAX_PRODUCTS);

  const products = trendingQuery.data?.products ?? initialProducts;
  const totalProducts = trendingQuery.data?.total ?? products.length;
  const loading = trendingQuery.isLoading && products.length === 0;
  const loadingMore = trendingQuery.isFetching && products.length > 0;

  const error = trendingQuery.error ? String((trendingQuery.error as any)?.message ?? trendingQuery.error) : null;
  const sliderRefs = useRef<Array<Slider | null>>([]);
  const cartTimerRef = useRef<number | null>(null);

  const handleAddToCart = useCallback((product: Arrival) => {
    setCartCount((prev) => prev + 1);
    setCartMessage(`${product.name || "This item"} added to cart`);

    if (cartTimerRef.current) {
      window.clearTimeout(cartTimerRef.current);
    }

    cartTimerRef.current = window.setTimeout(() => {
      setCartMessage(null);
    }, 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (cartTimerRef.current) {
        window.clearTimeout(cartTimerRef.current);
      }
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
    <QueryClientProvider client={queryClientRef.current!}>
      <section className="border-t border-slate-200 bg-white py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
              Trending edit
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Curated for the moment
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 shadow-sm">
              {cartCount} {cartCount === 1 ? "item" : "items"} in cart
            </div>

            {cartMessage ? (
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                {cartMessage}
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-6 sm:space-y-8 lg:space-y-10">
          {rows.map((row, rowIndex) => (
            <div
              key={`trending-row-${rowIndex}`}
              className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-3 shadow-[0_10px_40px_rgba(15,23,42,0.04)] sm:p-4 lg:p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
                <div className="text-sm text-slate-500">
                  {loading
                    ? "Loading latest picks..."
                    : `${row.filter(Boolean).length} curated styles`}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleNavigation(rowIndex, "prev")}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
                    aria-label={`Previous row ${rowIndex + 1}`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavigation(rowIndex, "next")}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
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
                  arrows={false}
                  dots={false}
                  infinite={false}
                  speed={400}
                  slidesToShow={4}
                  slidesToScroll={1}
                  swipeToSlide
                  responsive={[
                    { breakpoint: 1536, settings: { slidesToShow: 4 } },
                    { breakpoint: 1280, settings: { slidesToShow: 3 } },
                    { breakpoint: 1024, settings: { slidesToShow: 2 } },
                    { breakpoint: 640, settings: { slidesToShow: 1.05 } },
                  ]}
                >
                  {(loading ? new Array(INITIAL_BATCH).fill(null) : row).map((product, idx) => (
                    <div key={`card-${rowIndex}-${idx}`} className="px-2 sm:px-3">
                      {product ? (
                        <ProductCard product={product} onAddToCart={handleAddToCart} />
                      ) : (
                        <PlaceholderCard />
                      )}
                    </div>
                  ))}
                </Slider>
              </div>
            </div>
          ))}
        </div>
      </div>
      </section>
    </QueryClientProvider>
  );
}