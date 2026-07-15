'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, PieProps } from 'recharts';
import { Package, Grid3x3 } from 'lucide-react';
import { PieLabelRenderProps } from 'recharts';

interface CategoryData {
  slug: string;
  name: string;
  productCount: number;
}

interface AnalyticsDashboardProps {
  onCategorySelect?: (categorySlug: string) => void;
  onCategoryCreated?: () => void;
}

const COLORS = ['#8b7355', '#a0826d', '#b59985', '#c9b0a0', '#d4bfb1', '#d9c8bd', '#dfd0c4', '#e8d9cc', '#f0e4d9', '#f5ede4'];
const ANALYTICS_CACHE_KEY = 'analytics-dashboard-cache-v1';
const ANALYTICS_CACHE_TTL_MS = 1000 * 60 * 10;

function readCachedAnalytics() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(ANALYTICS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return parsed as {
      categories: CategoryData[];
      totalCategories: number;
      totalProducts: number;
      cachedAt: number;
    };
  } catch (err) {
    console.warn('Failed to read analytics cache', err);
    return null;
  }
}

function writeCachedAnalytics(payload: { categories: CategoryData[]; totalCategories: number; totalProducts: number }) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      ANALYTICS_CACHE_KEY,
      JSON.stringify({
        ...payload,
        cachedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('Failed to save analytics cache', err);
  }
}

function isAnalyticsCacheFresh(cached: { cachedAt?: number } | null) {
  if (!cached?.cachedAt) return false;
  return Date.now() - cached.cachedAt < ANALYTICS_CACHE_TTL_MS;
}

export default function AnalyticsDashboard({ onCategorySelect, onCategoryCreated }: AnalyticsDashboardProps) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    void fetchCategoryData(false);
    
    // Set up auto-refresh every 30 seconds to catch new additions
    const interval = setInterval(() => {
      void fetchCategoryData(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const applyAnalyticsSnapshot = (snapshot: { categories: CategoryData[]; totalCategories: number; totalProducts: number }) => {
    setCategories(snapshot.categories);
    setTotalCategories(snapshot.totalCategories);
    setTotalProducts(snapshot.totalProducts);
    setError(null);
    setLoading(false);
  };

  const fetchCategoryData = async (forceRefresh = false) => {
    const cached = readCachedAnalytics();

    if (!forceRefresh && cached && isAnalyticsCacheFresh(cached)) {
      applyAnalyticsSnapshot({
        categories: cached.categories,
        totalCategories: cached.totalCategories,
        totalProducts: cached.totalProducts,
      });
      return;
    }

    if (!cached || forceRefresh) {
      setLoading(true);
    }

    try {
      const response = await fetch('/api/categories', { cache: 'no-store' });
      const data = await response.json();

      if (data.success) {
        const fetchedCategories = Array.isArray(data.categories)
          ? data.categories.map((cat: any) => ({
              slug: String(cat.slug || cat.name || '').trim(),
              name: String(cat.name || cat.slug || '').trim(),
              productCount: Number(cat.productCount || 0),
            }))
          : [];

        const nextTotalCategories = Number.isFinite(Number(data.totalCategories))
          ? Number(data.totalCategories)
          : fetchedCategories.length;
        const nextTotalProducts = fetchedCategories.reduce((sum: number, cat: CategoryData) => sum + cat.productCount, 0);

        const nextSnapshot = {
          categories: fetchedCategories,
          totalCategories: nextTotalCategories,
          totalProducts: nextTotalProducts,
        };

        writeCachedAnalytics(nextSnapshot);
        applyAnalyticsSnapshot(nextSnapshot);
      } else if (cached) {
        applyAnalyticsSnapshot({
          categories: cached.categories,
          totalCategories: cached.totalCategories,
          totalProducts: cached.totalProducts,
        });
      } else {
        setError(data.error || 'Failed to fetch categories');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      if (cached) {
        applyAnalyticsSnapshot({
          categories: cached.categories,
          totalCategories: cached.totalCategories,
          totalProducts: cached.totalProducts,
        });
      } else {
        setError('Failed to load category data');
        setLoading(false);
      }
    }
  };

  const handleCreateCategory = async () => {
    setModalError(null);
    const name = newCategoryName.trim();
    if (!name) {
      setModalError('Category name is required.');
      return;
    }

    setSubmittingCategory(true);

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: newCategoryDescription }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setModalError(data.error || data.message || 'Failed to create category');
        return;
      }

      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowAddCategoryModal(false);
      setModalError(null);
      setError(null);
      await fetchCategoryData(true);
      onCategoryCreated?.();
    } catch (err) {
      console.error('Error creating category:', err);
      setModalError('Unable to create category. Please try again.');
    } finally {
      setSubmittingCategory(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <Grid3x3 className="w-6 h-6 text-amber-700" />
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Analytics</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowAddCategoryModal(true)}
          className="inline-flex items-center justify-center rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
        >
          + Add Category
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Create New Category</h3>
                <p className="text-sm text-gray-500">Add a category that can be used across products and the admin dashboard.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setModalError(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {modalError}
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Category Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="e.g. Evening Wear"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />

              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newCategoryDescription}
                onChange={(event) => setNewCategoryDescription(event.target.value)}
                placeholder="Optional description for this category"
                rows={4}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setModalError(null);
                }}
                className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={submittingCategory}
                className="rounded-2xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingCategory ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Categories Card */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-700 text-sm font-medium mb-2">Total Categories</p>
              <p className="text-4xl font-bold text-amber-900">{categories.length > 0 ? categories.length : totalCategories}</p>
            </div>
            <Grid3x3 className="w-12 h-12 text-amber-600 opacity-30" />
          </div>
        </div>

        {/* Total Products Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-2">Total Products</p>
              <p className="text-4xl font-bold text-blue-900">{totalProducts}</p>
            </div>
            <Package className="w-12 h-12 text-blue-600 opacity-30" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm cursor-pointer hover:shadow-lg hover:border-amber-400 transition-all">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Products by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categories} onClick={(state: any) => {
                const payload = state?.activePayload?.[0]?.payload;
                if (payload?.slug) {
                  onCategorySelect?.(payload.slug);
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  cursor={{ fill: 'rgba(139, 115, 85, 0.1)' }}
                />
                <Bar dataKey="productCount" fill="#8b7355" radius={[8, 8, 0, 0]} onClick={(data: any) => {
                  onCategorySelect?.(data?.payload?.slug || data.name);
                }} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">Click any bar to view category details</p>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm cursor-pointer hover:shadow-lg hover:border-amber-400 transition-all">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribution Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: PieLabelRenderProps) => {
                    const labelName = String(props.name || '');
                    const labelValue = typeof props.value === 'number' ? props.value : Number(props.value || 0);
                    return `${labelName}: ${labelValue}`;
                  }}
                  outerRadius={80}
                  fill="#8b7355"
                  dataKey="productCount"
                  onClick={(entry: any) => {
                    onCategorySelect?.(entry?.payload?.slug || entry.name);
                  }}
                  cursor="pointer"
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">Click any segment to view category details</p>
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <div
              key={category.slug || index}
              onClick={() => onCategorySelect?.(category.slug)}
              className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-amber-400 hover:shadow-md cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 capitalize">{category.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{category.productCount} products</p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                >
                  {category.productCount}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
