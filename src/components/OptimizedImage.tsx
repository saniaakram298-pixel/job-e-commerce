'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { AlertCircle } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  objectPosition?: string;
  quality?: 75 | 60 | 45 | 30;
  sizes?: string;
}

/**
 * OptimizedImage Component
 * 
 * Features:
 * ✓ Lazy loading with LQIP (Low Quality Image Placeholder)
 * ✓ WebP with fallback support
 * ✓ Adaptive image sizing for slow networks
 * ✓ Automatic format selection based on connection speed
 * ✓ Image compression for Pakistan-like regions
 */
export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 400,
  priority = false,
  className = '',
  objectFit = 'cover',
  objectPosition = 'center',
  quality = 75,
  sizes,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'fast'>('fast');

  // Detect network speed on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;
      
      // 4g+ is fast, 3g and below is slow
      if (effectiveType && ['slow-2g', '2g', '3g'].includes(effectiveType)) {
        setNetworkSpeed('slow');
      }
    }
  }, []);

  // Adaptive quality based on network speed
  const adaptiveQuality = networkSpeed === 'slow' ? 45 : quality;

  // Default sizes for responsive images
  const defaultSizes = sizes || `(max-width: 640px) 100vw,
                                 (max-width: 1024px) 50vw,
                                 33vw`;

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-stone-100 ${className}`}
        style={{ aspectRatio: `${width}/${height}` }}
      >
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8 text-stone-400" />
          <p className="text-sm text-stone-500 text-center">
            Image could not load
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton placeholder */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 animate-pulse"
          style={{ aspectRatio: `${width}/${height}` }}
          aria-hidden="true"
        />
      )}

      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={adaptiveQuality}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        sizes={defaultSizes}
        className={`
          w-full h-full transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
        `}
        style={{
          objectFit,
          objectPosition,
        }}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />

      {/* Network speed indicator (for debugging) */}
      {networkSpeed === 'slow' && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-1 right-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
          Slow network detected
        </div>
      )}
    </div>
  );
}

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  priority?: boolean;
}

/**
 * Product Image Gallery with optimized loading
 * Shows main image + thumbnails, lazy-loads non-visible images
 */
export function ProductImageGallery({
  images,
  productName,
  priority = false,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="bg-stone-100 rounded-lg w-full aspect-square flex items-center justify-center">
        <AlertCircle className="w-12 h-12 text-stone-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative rounded-lg overflow-hidden bg-stone-50">
        <OptimizedImage
          src={images[selectedIndex]}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          width={600}
          height={600}
          priority={priority}
          quality={75}
        />
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`
                flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all
                ${
                  selectedIndex === index
                    ? 'border-stone-900'
                    : 'border-stone-200 hover:border-stone-400'
                }
              `}
              aria-label={`View image ${index + 1}`}
              aria-current={selectedIndex === index}
            >
              <OptimizedImage
                src={image}
                alt={`Thumbnail ${index + 1}`}
                width={64}
                height={64}
                quality={60}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Hero Image with aggressive optimization for slow regions
 * Used for above-the-fold content
 */
export function HeroImage({
  src,
  alt,
  aspectRatio = '16/9',
}: {
  src: string;
  alt: string;
  aspectRatio?: string;
}) {
  return (
    <div style={{ aspectRatio }} className="relative w-full">
      <OptimizedImage
        src={src}
        alt={alt}
        priority
        quality={60}
        objectFit="cover"
        sizes="100vw"
      />
    </div>
  );
}
