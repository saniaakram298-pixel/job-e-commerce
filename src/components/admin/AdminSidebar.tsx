"use client";

import React from 'react';
import Link from 'next/link';
import {
  LayoutGrid, Package, Layers, Truck, LogOut, MessageSquare, Activity, 
  ChevronDown, TagIcon
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCategorySelect?: (category: string) => void;
  categories?: Array<{ id: string; label: string }>;
  isSidebarOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onLogout: () => void;
}

const DEFAULT_CATEGORIES = [
  { id: 'bridal', label: 'Bridal' },
  { id: 'groom', label: 'Groom' },
  { id: 'formal', label: 'Formal' },
  { id: 'informal', label: 'Informal' },
  { id: 'children', label: 'Children' },
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'old-people', label: 'Old People' },
  { id: 'young', label: 'Young' },
  { id: 'new-arrival', label: 'New Arrivals' },
  { id: 'accessories', label: 'Accessories' },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  onCategorySelect,
  categories,
  isSidebarOpen,
  onClose,
  darkMode,
  onLogout,
}) => {
  const [expandCategories, setExpandCategories] = React.useState(false);

  const mainMenuItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'products', label: 'Products Log', icon: <Package className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <Truck className="w-4 h-4" /> },
    { id: 'return orders', label: 'Return Orders', icon: <Package className="w-4 h-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'activity', label: 'Activity Log', icon: <Activity className="w-4 h-4" /> },
  ];

  const handleCategoryClick = (categoryId: string) => {
    // Trigger category view in the dashboard
    onTabChange('category');
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 ${
        darkMode ? 'bg-[#0F0F0F] border-neutral-900' : 'bg-white border-neutral-200'
      } border-r transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col justify-between py-6 px-4`}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em]">Atelier</p>
              <h2 className="text-xl font-black">Admin</h2>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-[#E5A93A]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          {mainMenuItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                activeTab === tab.id
                  ? darkMode
                    ? 'bg-[#141414] text-[#E5A93A] border border-neutral-800'
                    : 'bg-[#E5A93A]/10 text-[#8C6219] border border-[#E5A93A]/20'
                  : 'text-neutral-500 hover:text-[#E5A93A]'
              }`}
            >
              {tab.icon}
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Categories Section */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-2">
          {/* AnalyticDashboard Button */}
          <button
            onClick={() => onTabChange('home')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'home'
                ? darkMode
                  ? 'bg-[#141414] text-[#E5A93A] border border-neutral-800'
                  : 'bg-[#E5A93A]/10 text-[#8C6219] border border-[#E5A93A]/20'
                : 'text-neutral-500 hover:text-[#E5A93A]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">AnalyticDashboard</span>
          </button>

          {/* Categories Button */}
          <button
            onClick={() => setExpandCategories(!expandCategories)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all ${
              expandCategories
                ? darkMode
                  ? 'bg-[#141414] text-[#E5A93A] border border-neutral-800'
                  : 'bg-[#E5A93A]/10 text-[#8C6219] border border-[#E5A93A]/20'
                : 'text-neutral-500 hover:text-[#E5A93A]'
            }`}
          >
            <div className="flex items-center gap-3">
              <TagIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Categories</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${expandCategories ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Category List */}
          {expandCategories && (
            <div className="mt-2 space-y-1 pl-2">
              {(categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES).map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    handleCategoryClick(category.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                    darkMode
                      ? 'text-neutral-400 hover:text-[#E5A93A] hover:bg-neutral-800/50'
                      : 'text-neutral-600 hover:text-[#8C6219] hover:bg-[#E5A93A]/5'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-[#E5A93A]/60"></div>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <div className="space-y-4">
        <button
          onClick={onLogout}
          className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] text-red-600 transition hover:bg-red-500/20 hover:border-red-500/50 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};
