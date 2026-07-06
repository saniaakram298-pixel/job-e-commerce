"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Arrival } from "@/types";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBadges from "@/components/TrustBadges";
import BestSellers from "@/components/BestSellers";
import  TrendingDresses  from "@/components/TrendingDresses";
import StaticVideoSection from "@/components/StaticVideoSection";
import LimitedEditions from "@/components/LimitedEditions";
import BrandStory from "@/components/BrandStory";
import Footer from "@/components/Footer";
import Reviews from "@/components/Reviews";
import WhatsAppButton from "@/components/WhatsAppButton";
import FilterDrawer from "@/components/FilterDrawer";
import SearchOverlay from "@/components/SearchOverlay";
import CategorySlider from "@/components/CategorySlider";

const trustBadges = [
  { icon: "public", title: "Global Shipping", desc: "Express delivery" },
  { icon: "verified", title: "Authentic Craft", desc: "Certified quality" },
  { icon: "lock", title: "Secure Checkout", desc: "100% Protected" },
  { icon: "auto_awesome", title: "Bespoke Service", desc: "Tailored for you" },
];

interface HomePageClientProps {
  bestSellers: Arrival[];
  categories?: Array<{
    slug: string;
    name: string;
    productCount?: number;
    image?: string;
  }>;
}

export default function HomePageClient({
  bestSellers,
  categories = [],
}: HomePageClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  // ✅ SIMPLE HERO (no product dependency)
  const heroData = useMemo(
    () => ({
      title: "Modern Elegance",
      buttonText: "Go to My Account",
      imagePath: "/images/hero2.webp",
      images: [
        "/images/hero1.webp",
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b",
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f",
        "https://images.unsplash.com/photo-1483985988355-763728e1935b",
      ],
      href: "/account",
      subtitle: "Discover timeless pieces curated for your wardrobe.",
    }),
    []
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ SIMPLE CATEGORY CARDS (FIXED)
  const collectionCards = categories.map((category) => ({
    id: category.slug,
    name: category.name,
    image: category.image || "",
  }));

  const handleCategoryClick = (slug: string) => {
    setIsNavigating(true);
    startTransition(() => {
      router.push(`/collections/${slug}`);
    });

    window.setTimeout(() => {
      setIsNavigating(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar scrolled={scrolled} />
      <Hero data={heroData} />

      <CategorySlider
        categories={collectionCards}
        onCategorySelect={handleCategoryClick}
      />

      {isNavigating && (
        <div className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4 py-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm text-slate-700 shadow-lg backdrop-blur">
            <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
            Opening collection...
          </div>
        </div>
      )}

      {/* ✅ BEST SELLERS */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-8">
        <BestSellers arrivals={bestSellers} />
      </section>

      {/* ✅ TRENDING DRESSES */}
      <TrendingDresses />

      {/* ✅ STATIC 2026 VIDEO */}
      <StaticVideoSection />

      {/* ✅ OTHER SECTIONS */}
      <main className="max-w-[1440px] mx-auto px-6 md:px-12 space-y-20 py-12">
        <LimitedEditions />
        <BrandStory />
        <Reviews />
      </main>

      <TrustBadges badges={trustBadges} />
      <Footer />
      <WhatsAppButton />

      <FilterDrawer open={showFilters} onClose={() => setShowFilters(false)} />
      <SearchOverlay />
    </div>
  );
}