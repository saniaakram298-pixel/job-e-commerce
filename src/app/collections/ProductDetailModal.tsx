"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Arrival } from '@/types';

interface Product {
  id: string;
  _id: string;
  name: string;
  title: string;
  price: string;
  numericPrice: number;
  img: string;
  images?: string[];
  category: string;
  createdAt: string;
  description?: string;
  tags?: string[];
  sizes?: Array<{ size: string; stock: number }>;
  stock?: number;
  collection?: string;
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addToCart, clearCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    // reset selections when modal opens or product changes
    setSelectedImageIndex(0);
    setSelectedSize(null);
    setQuantity(1);
  }, [product?.id, isOpen]);

  if (!isOpen || !product) return null;

  // Get all product images (detail images from admin + main image)
  const displayImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.img
    ? [product.img]
    : [];

  // Get the currently selected image for the main display
  const mainImage = displayImages[selectedImageIndex] || product.img;

  const handleAddToCart = () => {
    const selectedImg = mainImage || product.img;

    const arrival: Arrival = {
      id: (product as any).productId || product._id || product.id,
      name: product.title || product.name,
      img: selectedImg,
      price: product.price,
      images: [selectedImg],
      category: product.category,
      collectionName: product.collection,
      _id: (product as any).productId || product._id,
    } as unknown as Arrival;

    // Clear existing cart so only this product appears in checkout
    try {
      clearCart();
    } catch (e) {
      // ignore
    }

    addToCart(arrival, quantity, selectedSize || undefined);
    onClose();
    // Navigate to checkout page after adding to cart
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="sticky top-4 right-4 z-10 float-right p-2 hover:bg-stone-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-stone-600" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-12">
            {/* Product Image */}
            <div className="flex items-start justify-center">
              <div className="flex gap-6 items-start w-full">
                {/* Thumbnails Grid - Detail Images from Admin */}
                <div className="grid gap-4 w-28">
                  {displayImages.map((image, index) => (
                    <button
                      key={image + index}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative overflow-hidden rounded-sm border transition ${
                        selectedImageIndex === index ? 'border-black' : 'border-stone-200'
                      }`}
                    >
                      <img src={image} alt={`${product.name} thumbnail ${index + 1}`} className="w-full h-24 object-cover" />
                    </button>
                  ))}
                </div>

                {/* Main Product Image */}
                <div className="relative aspect-[3/4] bg-stone-200 overflow-hidden rounded-lg flex-1">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={`${product.name} product image`}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-500">No image available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="flex flex-col justify-between">
              {/* Header Info */}
              <div>
                <div className="mb-2">
                  <span className="inline-block px-3 py-1 bg-stone-100 text-[10px] uppercase tracking-widest text-stone-600 rounded-full font-bold">
                    {product.category}
                  </span>
                </div>

                <h1 className="font-serif text-4xl md:text-5xl italic mb-4">
                  {product.title}
                </h1>

                <div className="flex items-baseline gap-2 mb-6">
                  <p className="text-3xl font-bold text-stone-900">
                    {product.price}
                  </p>
                  {product.stock !== undefined && (
                    <span
                      className={`text-sm font-semibold ${
                        product.stock > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : 'Out of stock'}
                    </span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-8">
                    <p className="text-stone-700 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mb-8">
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-3">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-stone-100 text-stone-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-8">
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-4">
                      Select Size
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {product.sizes.map((sizeOption) => (
                        <button
                          key={sizeOption.size}
                          onClick={() => setSelectedSize(sizeOption.size)}
                          disabled={sizeOption.stock === 0}
                          className={`py-2 px-3 border rounded-lg text-sm font-semibold transition-all ${
                            selectedSize === sizeOption.size
                              ? 'bg-stone-900 text-white border-stone-900'
                              : sizeOption.stock === 0
                              ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                              : 'bg-white text-stone-900 border-stone-300 hover:border-stone-900'
                          }`}
                        >
                          {sizeOption.size}
                          {sizeOption.stock === 0 && <span className="block text-[10px]">OOS</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity & Add to Cart */}
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-3">
                    Quantity
                  </p>
                  <div className="flex items-center gap-4 border border-stone-300 rounded-lg w-fit">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-stone-100 transition-colors"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(
                            product.stock || 10,
                            quantity + 1
                          )
                        )
                      }
                      className="px-4 py-2 hover:bg-stone-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={
                    product.stock === 0 ||
                    (product.sizes && product.sizes.length > 0 && !selectedSize)
                  }
                  className={`w-full py-4 px-6 rounded-lg font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
                    product.stock === 0 ||
                    (product.sizes && product.sizes.length > 0 && !selectedSize)
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
              </div>

              {/* Additional Info removed per request (Collection, Product ID, Added) */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
