"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { X, ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  _id: string;
  name: string;
  title: string;
  price: string;
  numericPrice: number;
  img: string;
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

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    console.log('Adding to cart:', {
      productId: product.id,
      quantity,
      selectedSize,
    });
    // TODO: Implement add to cart functionality
    alert(`Added ${quantity} item(s) to cart${selectedSize ? ` - Size: ${selectedSize}` : ''}`);
    onClose();
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
              <div className="relative w-full aspect-[3/4] bg-stone-100 overflow-hidden rounded-lg">
                <Image
                  src={product.img}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
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

              {/* Additional Info */}
              <div className="mt-8 pt-8 border-t border-stone-200 space-y-3 text-sm text-stone-600">
                <p>
                  <span className="font-semibold text-stone-900">Collection:</span>{' '}
                  {product.collection || 'General'}
                </p>
                <p>
                  <span className="font-semibold text-stone-900">Product ID:</span>{' '}
                  <code className="text-xs bg-stone-100 px-2 py-1 rounded">
                    {product.id}
                  </code>
                </p>
                <p>
                  <span className="font-semibold text-stone-900">Added:</span>{' '}
                  {new Date(product.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
