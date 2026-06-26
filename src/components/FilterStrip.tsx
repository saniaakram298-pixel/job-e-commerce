'use client';

import React from 'react';

export default function FilterStrip({ onOpenFilters }: { onOpenFilters?: () => void }) {
  return (
    <div className="w-full bg-white border-b border-stone-100 py-3">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between">
        <div className="text-sm text-stone-600">Filter & Sort</div>
        <div className="hidden md:flex items-center gap-4">
          <button className="text-sm px-3 py-2 border rounded">Category</button>
          <button className="text-sm px-3 py-2 border rounded">Size</button>
          <button className="text-sm px-3 py-2 border rounded">Price</button>
        </div>
        {/* Mobile sticky button */}
        <div className="md:hidden">
          <button
            onClick={() => onOpenFilters && onOpenFilters()}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-white border px-4 py-2 rounded shadow-md"
          >
            Filter & Sort
          </button>
        </div>
      </div>
    </div>
  );
}
