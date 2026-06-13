'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface LookItem {
  id: string;
  image: string;
  name: string;
  price: number;
  category: string;
}

interface CompleteTheLookProps {
  mainImage?: string;
  items?: LookItem[];
}

const defaultItems: LookItem[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1595961636902-5f9a5f7db70c?w=200&q=80',
    name: 'Luxury Watch',
    price: 450,
    category: 'accessories',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1633114291990-a24caea7ae3e?w=200&q=80',
    name: 'Leather Bag',
    price: 320,
    category: 'accessories',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1543897917-f5b763be60fb?w=200&q=80',
    name: 'Designer Sunglasses',
    price: 280,
    category: 'accessories',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1508520735340-6ca438aaadfa?w=200&q=80',
    name: 'Silk Scarf',
    price: 180,
    category: 'accessories',
  },
];

export default function CompleteTheLook({
  mainImage = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  items = defaultItems,
}: CompleteTheLookProps) {
  const [selectedItem, setSelectedItem] = useState<LookItem | null>(null);
  const [mainDisplayImage, setMainDisplayImage] = useState(mainImage);

  const handleItemClick = (item: LookItem) => {
    setSelectedItem(item);
    setMainDisplayImage(item.image);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="relative bg-white py-20 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif text-4xl lg:text-5xl font-light mb-4">
            Complete The Look
          </h2>
          <div className="w-12 h-px bg-black"></div>
          <p className="font-sans text-gray-600 mt-4 max-w-2xl">
            Curate your perfect ensemble by selecting complementary pieces. Click on any item to explore styling options.
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Image */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="relative overflow-hidden bg-surface-container-low aspect-square group"
              key={mainDisplayImage}
            >
              <motion.img
                src={mainDisplayImage}
                alt="Main look"
                className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500"></div>
            </motion.div>
          </motion.div>

          {/* Complementary Items */}
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h3 className="font-serif text-2xl font-light mb-6">Accessories</h3>

            {items.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => handleItemClick(item)}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className={`w-full text-left p-4 border-2 transition-all ${
                  selectedItem?.id === item.id
                    ? 'border-black bg-black/5'
                    : 'border-gray-200 hover:border-black'
                }`}
              >
                <div className="flex gap-4 items-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover filter grayscale"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-sm">{item.name}</h4>
                    <p className="font-sans text-sm text-gray-600">${item.price}</p>
                    <span className="text-xs uppercase tracking-widest text-gray-500">
                      {item.category}
                    </span>
                  </div>
                  <motion.div
                    animate={selectedItem?.id === item.id ? { opacity: 1 } : { opacity: 0 }}
                    className="text-black"
                  >
                    →
                  </motion.div>
                </div>
              </motion.button>
            ))}

            {/* Add to Bag Button */}
            {selectedItem && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-8 bg-black text-white py-4 font-sans uppercase text-sm tracking-widest hover:bg-gray-900 transition-all"
              >
                Add {selectedItem.name} to Bag
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Grid of Additional Looks */}
        <motion.div
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {items.map((item) => (
            <motion.button
              key={`grid-${item.id}`}
              variants={itemVariants}
              onClick={() => handleItemClick(item)}
              className="group relative overflow-hidden aspect-square cursor-pointer"
            >
              <motion.img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
                whileHover={{ scale: 1.1 }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all">
                <span className="text-white font-sans text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                  {item.name}
                </span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
