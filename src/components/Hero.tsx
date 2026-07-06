'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { HeroData } from '@/types';
import RotatingProductShowcase from './RotatingProductShowcase';
import { useEffect, useState } from 'react';

interface HeroProps {
  data: HeroData;
  showRotatingProduct?: boolean;
  rotatingProductImages?: string[];
}

export default function Hero({ data, showRotatingProduct = true, rotatingProductImages }: HeroProps) {
  const backgroundImage = data.imagePath;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Default product showcase images - high-quality fashion products
const defaultProductImages = useMemo(() => [
  '/rotation/gown-0.webp',
  '/rotation/gown-60.webp',
  '/rotation/gown-120.webp',
  '/rotation/gown-180.webp',
  '/rotation/gown-240.webp',
  '/rotation/gown-300.webp',
], []);

  const productImages = useMemo(() => rotatingProductImages || defaultProductImages, [rotatingProductImages, defaultProductImages]);

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.8s ease-out 0.2s forwards;
        }
      `}</style>
      
      {/* Bento Grid Hero Section */}
      <section className="relative w-full bg-black overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt="Hero background"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
        </div>

        {/* Bento Grid Container */}
        <div className="relative z-10 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-20 max-w-7xl mx-auto min-h-[700px] md:min-h-[600px] lg:min-h-[700px]">
            
            {/* Left Column - Rotation Product Showcase */}
            {showRotatingProduct && (
              <div className={`lg:col-span-2 flex items-center justify-center ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                <div className="relative h-[450px] w-full max-w-[320px] md:max-w-[350px] bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl hover:border-white/20 transition-all duration-300">
                  <RotatingProductShowcase
                    imageSequence={productImages}
                    rotationSpeed={100}
                    height={400}
                    showAngleIndicator={false}
                    onProductClick={() => {
                      // Handle product click
                    }}
                  />
                </div>
              </div>
            )}

            {/* Right Column - Content Stack */}
            <div className="lg:col-span-2 flex flex-col justify-center space-y-6 md:space-y-8">
              
              {/* Overline/Label */}
              <div className={`${isVisible ? 'animate-slide-in-left' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-white/60 font-light">
                  NEW COLLECTION • 2026
                </p>
              </div>

              {/* Main Heading - Asymmetric Typography */}
              <div className={`space-y-2 ${isVisible ? 'animate-slide-in-left' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-white">
                  Break<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
                    The Mold
                  </span>
                </h1>
              </div>

              {/* Subheading */}
              <div className={`${isVisible ? 'animate-slide-in-left' : 'opacity-0'}`} style={{ animationDelay: '0.5s' }}>
                <p className="text-sm md:text-base text-white/70 font-light leading-relaxed max-w-sm">
                  Curated pieces that challenge convention. Elevate your aesthetic with designs crafted for those who refuse to blend in.
                </p>
              </div>

              {/* Stats or Features - Mini Grid */}
              <div className={`grid grid-cols-2 gap-4 pt-4 ${isVisible ? 'animate-slide-in-left' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
                <div className="border-l border-white/20 pl-4">
                  <p className="text-2xl md:text-3xl font-black text-white">350+</p>
                  <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Styles</p>
                </div>
                <div className="border-l border-white/20 pl-4">
                  <p className="text-2xl md:text-3xl font-black text-white">47K</p>
                  <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Curators</p>
                </div>
              </div>

              {/* CTA Button */}
              {data.buttonText && data.href ? (
                <div className={`pt-4 ${isVisible ? 'animate-slide-in-left' : 'opacity-0'}`} style={{ animationDelay: '0.7s' }}>
                  <Link
                    href={data.href}
                    className="inline-flex items-center justify-center px-8 md:px-10 py-3 md:py-4 bg-white text-black font-bold uppercase tracking-widest text-sm md:text-base rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl"
                  >
                    {data.buttonText}
                    <svg className="w-4 md:w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ) : null}
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
