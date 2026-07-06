"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { formatCurrency } from '@/lib/price';

interface ProductCardProps {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
  tags?: string[];
  category?: string;
  description?: string;
  stock?: number;
}

export default function ProductCard({
  _id,
  name,
  price,
  discountPrice,
  images,
  tags = [],
  category = 'Featured',
  description = '',
  stock = 0
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = images?.[0] || '/api/placeholder/400/500';
  const displayPrice = discountPrice || price;
  const discount = discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0;

  const getBadgeColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'sale':
        return 'bg-red-500';
      case 'bonus':
        return 'bg-green-500';
      case 'new':
        return 'bg-blue-500';
      case 'new arrival':
        return 'bg-blue-500';
      case 'limited edition':
        return 'bg-purple-500';
      case 'featured':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="group relative h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
      {/* Image Container */}
      <Link href={`/product/${_id}`} className="relative block w-full h-64 md:h-72 overflow-hidden bg-gray-100">
        {/* Badges */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-10">
          {tags && tags.length > 0 && tags.map((tag, index) => (
            <span
              key={index}
              className={`${getBadgeColor(tag)} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-tighter`}
            >
              {tag}
            </span>
          ))}
          {discount > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        {/* Image */}
        <img
          src={imageError ? '/api/placeholder/400/500' : imageUrl}
          alt={name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>

        {/* Wishlist Button */}
        <button
          onClick={(event) => {
            event.preventDefault();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2.5 rounded-full hover:bg-white transition-colors z-20 group-hover:scale-110 transform duration-300"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
            }`}
          />
        </button>
      </Link>

      <div className="border-t border-gray-100 bg-white px-4 py-3 sm:px-5">
        <Link
          href={`/product/${_id}`}
          className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
        >
          View Details
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        {/* Product Info */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">
            {category}
          </p>
          <h3 className="text-base md:text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {name}
          </h3>
          {description && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{description}</p>
          )}
          
          {/* Yahan add karein (Line 113) */}
          <div className="mt-2">
            {stock > 0 ? (
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                In Stock ({stock})
              </span>
            ) : (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                Out of Stock
              </span>
            )}
          </div>

        </div>

        {/* Price Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-baseline gap-3">
            <span className="text-xl md:text-2xl font-black text-gray-900">
              {formatCurrency(displayPrice)}
            </span>
            {discountPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
