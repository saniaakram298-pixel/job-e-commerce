'use client';

import React from 'react';
import { LayoutGrid, Package, Truck, Plus } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsModalOpen?: () => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'home', label: 'Home', icon: Package },
  { id: 'orders', label: 'Orders', icon: Truck },
];

export default function Sidebar({ activeTab, setActiveTab, setIsModalOpen }: SidebarProps) {
  return (
    <aside className="w-64 bg-[#0F0F0F] border-r border-neutral-900 flex flex-col justify-between py-6 px-4 h-screen sticky top-0">
      <div>
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E5A93A] to-[#8C6219] flex items-center justify-center text-black font-bold">
            A
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">The</p>
            <h1 className="text-white text-xl font-black">Atelier</h1>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left ${
                  isActive
                    ? 'bg-[#141414] text-[#E5A93A] border border-neutral-800'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#E5A93A]' : ''}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={() => setIsModalOpen?.()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#E5A93A]/30 bg-[#E5A93A]/5 text-[#E5A93A] hover:bg-[#E5A93A]/10 transition"
      >
        <Plus className="w-4 h-4" />
        Add Collection
      </button>
    </aside>
  );
}
