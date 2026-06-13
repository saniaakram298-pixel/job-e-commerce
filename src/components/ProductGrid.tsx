'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, X } from 'lucide-react';
import { formatCurrency } from '@/lib/price';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  description: string;
  images: string[];
  category: string;
  featured?: boolean;
}

interface ProductGridProps {
  products?: Product[];
  onAddToCart?: (product: Product) => void;
}

export default function ProductGrid({ products = [], onAddToCart }: ProductGridProps) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('default');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = ['All', 'women', 'men', 'accessories'];

  useEffect(() => {
    filterAndSortProducts();
  }, [products, selectedCategory, sortBy]);

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b._id).getTime() - new Date(a._id).getTime());
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product._id);
    if (existingItem) {
      setCart(
        cart.map(item =>
          item.id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product._id,
          name: product.name,
          price: product.discountPrice || product.price,
          image: product.images[0],
          quantity: 1,
        },
      ]);
    }
    onAddToCart?.(product);
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="relative bg-white py-20 px-6 lg:px-12">
      {/* Section Title */}
      <motion.div
        className="max-w-7xl mx-auto mb-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="font-serif text-4xl lg:text-5xl font-light mb-4">
          Curated Collection
        </h2>
        <div className="w-12 h-px bg-black"></div>
      </motion.div>

      <div className="max-w-7xl mx-auto">
        {/* Filters and Sorting */}
        <motion.div
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Category Filter */}
          <div className="flex gap-4 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 font-sans text-sm uppercase tracking-widest transition-all ${
                  selectedCategory === category
                    ? 'bg-black text-white'
                    : 'bg-white text-black border border-black hover:bg-black hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Sort and Cart */}
          <div className="flex gap-6 items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-black font-sans text-sm uppercase tracking-widest focus:outline-none focus:bg-black focus:text-white cursor-pointer"
            >
              <option value="default">Sort</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>

            <button
              onClick={() => setShowCart(!showCart)}
              className="relative px-4 py-2 border border-black font-sans text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-2"
            >
              <ShoppingBag size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Product Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {filteredProducts.map(product => (
            <motion.div
              key={product._id}
              variants={itemVariants}
              className="group"
            >
              <div className="relative overflow-hidden mb-4 bg-surface-container-low aspect-square">
                <motion.img
                  src={product.images[0] || 'https://via.placeholder.com/400'}
                  alt={product.name}
                  className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                />

                {/* Quick Add Button */}
                <motion.button
                  onClick={() => handleAddToCart(product)}
                  className="absolute inset-0 w-full h-full bg-black/0 group-hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  <span className="text-white font-sans text-sm uppercase tracking-widest px-8 py-3 border border-white">
                    Quick Add
                  </span>
                </motion.button>

                {/* Wishlist Button */}
                <button
                  onClick={() => handleToggleWishlist(product._id)}
                  className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white transition-all z-10"
                >
                  <Heart
                    size={20}
                    className={wishlist.includes(product._id) ? 'fill-red-500 text-red-500' : ''}
                  />
                </button>

                {/* Tags */}
                {product.featured && (
                  <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 font-sans text-xs uppercase tracking-widest">
                    Featured
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-3">
                <h3 className="font-serif text-lg font-light">{product.name}</h3>
                <p className="font-sans text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>

                {/* Price */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="font-sans font-semibold text-lg">
                    ${product.discountPrice || product.price}
                  </span>
                  {product.discountPrice && (
                    <span className="font-sans text-sm line-through text-gray-400">
                      ${product.price}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* No Products Found */}
        {filteredProducts.length === 0 && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="font-serif text-2xl text-gray-500">No products found</p>
          </motion.div>
        )}
      </div>

      {/* Shopping Cart Sidebar */}
      <motion.div
        className={`fixed right-0 top-0 h-screen w-96 bg-white shadow-2xl z-50 ${
          showCart ? '' : 'hidden'
        }`}
        initial={{ x: 400 }}
        animate={showCart ? { x: 0 } : { x: 400 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-serif text-2xl font-light">Your Cart</h2>
            <button onClick={() => setShowCart(false)} className="p-2">
              <X size={24} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-8">
            {cart.length === 0 ? (
              <p className="text-gray-500 font-sans text-center py-8">
                Your cart is empty
              </p>
            ) : (
              cart.map(item => (
                <motion.div
                  key={item.id}
                  className="flex gap-4 pb-4 border-b border-gray-200"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover filter grayscale"
                  />
                  <div className="flex-1">
                    <h3 className="font-serif text-sm">{item.name}</h3>
                    <p className="font-sans text-sm text-gray-600">
                      ${item.price} × {item.quantity}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </motion.div>
              ))
            )}
          </div>

          {/* Total and Checkout */}
          {cart.length > 0 && (
            <>
              <div className="border-t border-gray-200 pt-4 pb-6">
                <div className="flex justify-between items-center font-serif text-lg mb-6">
                  <span>Total:</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <button className="w-full bg-black text-white py-4 font-sans uppercase text-sm tracking-widest hover:bg-gray-900 transition-all">
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Overlay */}
      {showCart && (
        <motion.div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setShowCart(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </section>
  );
}
