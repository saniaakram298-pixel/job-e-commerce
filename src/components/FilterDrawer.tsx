'use client';

import React from 'react';

export default function FilterDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <div className={`fixed inset-0 z-50 transition-opacity ${open ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full md:w-[420px] bg-white z-60 transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-xl">Filters</h3>
            <button onClick={onClose} className="text-stone-500">Close</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Category</label>
              <select className="w-full border p-2 rounded">
                <option>All</option>
                <option>Bridal</option>
                <option>Groom</option>
                <option>Formal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Size</label>
              <div className="flex gap-2 flex-wrap">
                {['XS','S','M','L','XL'].map(s=> (
                  <button key={s} className="px-3 py-1 border rounded text-sm">{s}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Price</label>
              <input type="range" min={0} max={10000} className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
