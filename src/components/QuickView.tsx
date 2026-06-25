'use client';

import React from 'react';

export default function QuickView({ product, onClose }: { product: any; onClose: ()=>void }) {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white max-w-2xl w-full p-6 z-60 rounded">
        <div className="flex gap-6">
          <div className="w-1/2">
            <img src={product.img || product.images?.[0] || '/images/hero.png'} alt={product.name} className="w-full h-auto object-cover" />
          </div>
          <div className="w-1/2">
            <h3 className="text-xl font-serif mb-2">{product.name}</h3>
            <p className="text-sm text-stone-500 mb-4">{product.cat || product.category}</p>
            <p className="text-lg font-medium mb-4">{product.price}</p>
            <p className="text-sm text-neutral-600 mb-4">{product.description || ''}</p>
            <button onClick={onClose} className="px-4 py-2 bg-black text-white rounded">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
