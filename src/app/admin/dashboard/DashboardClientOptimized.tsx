'use client';

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import {
  LayoutGrid, Package, Layers, Truck, Sun, Moon,
  LogOut, ArrowUpRight, AlertCircle, Bell, Search,
  UserCircle2, ChevronDown, Home as HomeIcon, ExternalLink, X,
} from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuth';
import { api } from '@/lib/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { DashboardSkeleton, TabContentSkeleton } from '@/components/DashboardSkeleton';
import { useToast } from '@/hooks/useToast';

// Dynamic imports for heavy components with loading fallbacks
const Collections = dynamic(() => import('./Collections').then(mod => ({ default: mod.Home })), {
  loading: () => <TabContentSkeleton />,
});

const Inventory = dynamic(() => import('./Inventory').then(mod => ({ default: mod.Inventory })), {
  loading: () => <TabContentSkeleton />,
});

const Orders = dynamic(() => import('./Orders').then(mod => ({ default: mod.Orders })), {
  loading: () => <TabContentSkeleton />,
});

const AnalyticsDashboard = dynamic(() => import('./AnalyticsDashboard'), {
  loading: () => <TabContentSkeleton />,
});

const ProductsLog = dynamic(() => import('@/components/admin/ProductsLog').then(mod => ({ default: mod.ProductsLog })), {
  loading: () => <TabContentSkeleton />,
});

const ReviewsComponent = dynamic(() => import('@/components/admin/ReviewsComponent'), {
  loading: () => <TabContentSkeleton />,
});

const ActivityLogComponent = dynamic(() => import('@/components/admin/ActivityLog'), {
  loading: () => <TabContentSkeleton />,
});

const CategoryView = dynamic(() => import('@/components/admin/CategoryView'), {
  loading: () => <TabContentSkeleton />,
});

const RevenueChart = dynamic(() => import('@/components/admin/RevenueChart'), {
  loading: () => <div className="rounded-2xl border border-neutral-200 bg-white p-6 h-80 animate-pulse" />,
});

const RepeatedOrders = dynamic(() => import('@/components/admin/RepeatedOrdersSection'), {
  loading: () => <div className="rounded-2xl border border-neutral-200 bg-white p-6 h-64 animate-pulse" />,
});

const BestSellers = dynamic(() => import('@/components/admin/BestSellersSection'), {
  loading: () => <div className="rounded-2xl border border-neutral-200 bg-white p-6 h-80 animate-pulse" />,
});

const ReviewsOverview = dynamic(() => import('@/components/admin/ReviewsOverview'), {
  loading: () => <div className="rounded-2xl border border-neutral-200 bg-white p-6 h-64 animate-pulse" />,
});

interface CollectionItem {
  _id: string;
  title: string;
  tag: string;
  img: string;
  video?: string;
  category: string;
  stock: number;
  price: number;
  description: string;
}

interface DashboardClientProps {
  collections: CollectionItem[];
  total?: number;
  initialError?: string | null;
}

async function fetchCollectionsFromApi(): Promise<{ collections: CollectionItem[]; total: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch('/api/collections?page=1&limit=1000', {
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const error = new Error(data?.error || 'Unable to load collections from the API.');
      (error as any).status = res.status;
      throw error;
    }

    const data = await res.json();
    const collections = Array.isArray(data.collections) ? data.collections : [];
    const total = typeof data?.pagination?.total === 'number' ? data.pagination.total : collections.length;

    return { collections, total };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout: MongoDB query took too long');
      (timeoutError as any).status = 503;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default function AtelierDashboardClient({
  collections: initialCollections,
  total: initialTotal,
  initialError,
}: DashboardClientProps) {
  const router = useRouter();
  const { logout, user, token } = useAuthStore();
  const { error: showError } = useToast();
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [manualRetryCount, setManualRetryCount] = useState(0);

  const queryClient = useQueryClient();

  // Collections Query - Main data
  const query = useQuery<{ collections: CollectionItem[]; total: number }, Error>({
    queryKey: ['admin-collections', manualRetryCount],
    queryFn: fetchCollectionsFromApi,
    initialData: { collections: initialCollections, total: initialTotal ?? initialCollections?.length ?? 0 },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    placeholderData: (previousData: any) => previousData,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
  });

  const collections = query.data?.collections ?? initialCollections ?? [];
  const totalItems = query.data?.total ?? collections.length;
  const { error, isLoading, isFetching, refetch } = query;

  // Orders Query - Lazy loaded
  const { data: orders = [] } = useQuery<any[], Error>({
    queryKey: ['dashboard-orders'],
    queryFn: async () => {
      const response = await api.get<{ success?: boolean; data?: any[] } | any[]>('/orders', true);
      if (Array.isArray(response)) return response;
      return (response as any)?.data ?? [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: Boolean(token),
  });

  // Pending Orders Query - Lazy loaded
  const { data: pendingOrders = [] } = useQuery<any[], Error>({
    queryKey: ['dashboard-pending-orders'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: any[] }>('/admin/pending-orders', true);
      if (Array.isArray(response)) return response;
      return (response as any)?.data ?? [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    enabled: Boolean(token),
  });

  // Categories Query - Lazy loaded
  const { data: adminCategories = [] } = useQuery<{ slug: string; name: string; productCount: number }[], Error>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      const data = await response.json();
      return Array.isArray(data.categories)
        ? data.categories.map((cat: any) => ({
          slug: String(cat.slug || cat.name || '').trim(),
          name: String(cat.name || cat.slug || '').trim(),
          productCount: Number(cat.productCount || 0),
        }))
        : [];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const serverError = error?.message ?? initialError ?? null;
  const isRetrying = isFetching && collections.length > 0;
  const isInitialLoad = isLoading && collections.length === 0;
  const hasError = serverError !== null && collections.length === 0;

  const handleManualRetry = async () => {
    setManualRetryCount((prev) => prev + 1);
    await refetch();
  };

  const userName = user?.firstName || 'Admin';
  const userEmail = user?.email || 'admin@theatelier.com';
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'home', label: 'Home', icon: <Layers className="w-4 h-4" /> },
    { id: 'products', label: 'Products Log', icon: <Package className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <Truck className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
  ];

  const searchResults = useMemo(() => {
    if (!normalizedSearch) return [];

    const matchedCollections = (collections || []).filter((item: CollectionItem) =>
      [item.title, item.tag, item.category, item.description].some((value) =>
        value?.toString().toLowerCase().includes(normalizedSearch)
      )
    );

    const matchedOrders = (orders || []).filter((order: any) =>
      [order.orderNumber, order.customerName, order.customerEmail].some((value) =>
        value?.toString().toLowerCase().includes(normalizedSearch)
      )
    );

    const matchedSidebar = sidebarItems.filter((item) =>
      item.label.toLowerCase().includes(normalizedSearch)
    );

    const matchesAdmin = [userName, userEmail].some((value) => value?.toLowerCase().includes(normalizedSearch));

    return [
      ...matchedSidebar.slice(0, 2).map((item) => ({
        type: 'Sidebar',
        label: item.label,
        detail: `Navigate to ${item.label}`,
        action: () => setActiveTab(item.id),
      })),
      ...matchedCollections.slice(0, 3).map((item: CollectionItem) => ({
        type: 'Component',
        label: item.title,
        detail: `${item.category || 'Collection'} • ${item.tag || 'Featured'}`,
      })),
      ...matchedOrders.slice(0, 3).map((order: any) => ({
        type: 'Order',
        label: order.customerName || `Order #${order.orderNumber || order._id}`,
        detail: order.customerEmail || 'Customer contact unavailable',
      })),
      ...(matchesAdmin ? [{ type: 'Admin', label: userName, detail: userEmail }] : []),
    ];
  }, [collections, orders, normalizedSearch, userEmail, userName]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setActiveTab('category');
  };

  const handleNotificationClick = (orderId: string, orderStatus: string) => {
    const newDismissed = new Set(dismissedNotifications);
    newDismissed.add(orderId);
    setDismissedNotifications(newDismissed);
    setActiveTab('orders');
    setShowNotificationDropdown(false);
  };

  const getNotifications = () => {
    const pendingOrdersList = (orders || [])
      .filter((order: any) => ['pending', 'processing'].includes(order.orderStatus))
      .filter((order: any) => !dismissedNotifications.has(order._id));

    return [...pendingOrdersList].slice(0, 5);
  };

  const notifications = getNotifications();

  const stats = useMemo(() => {
    const safeCollections = Array.isArray(collections) ? collections : [];
    const totalStock = safeCollections.reduce((acc: number, curr: CollectionItem) => acc + (curr.stock || 0), 0);
    const totalValue = safeCollections.reduce((acc: number, curr: CollectionItem) => acc + (curr.price || 0), 0);
    const totalOrdersCount = Array.isArray(orders) ? orders.length : 0;
    const totalRevenue = Array.isArray(orders)
      ? orders.reduce((acc: number, curr: any) => acc + Number(curr.totalPrice || 0), 0)
      : 0;
    const totalFollowUps = Array.isArray(pendingOrders) ? pendingOrders.length : 0;

    return {
      totalItems,
      stock: totalStock,
      value: totalValue.toLocaleString(),
      lowStock: safeCollections.filter((c: CollectionItem) => c.stock < 5).length,
      totalOrders: totalOrdersCount,
      totalRevenue: totalRevenue.toLocaleString(),
      totalFollowUps,
    };
  }, [collections, orders, pendingOrders, totalItems]);

  const notificationCount = useMemo(() => {
    const pendingOrderCount = (orders || []).filter((order: any) => ['pending', 'processing'].includes(order.orderStatus)).length;
    return pendingOrderCount + (Array.isArray(pendingOrders) ? pendingOrders.length : 0);
  }, [orders, pendingOrders]);

  const overviewCards = [
    {
      label: 'Total Collections',
      value: stats.totalItems.toString(),
      icon: <Layers size={16} />,
      onClick: () => setActiveTab('home'),
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: <Truck size={16} />,
      onClick: () => setActiveTab('orders'),
    },
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue}`,
      icon: <ArrowUpRight size={16} />,
      onClick: () => setActiveTab('orders'),
    },
    {
      label: 'Total Follow-ups',
      value: stats.totalFollowUps.toString(),
      icon: <AlertCircle size={16} className="text-red-500" />,
      onClick: () => setActiveTab('orders'),
    },
  ];

  return (
    <div
      className={`flex h-screen font-sans transition-colors duration-500 ${
        darkMode ? 'bg-[#0A0A0A] text-gray-200' : 'bg-[#F9F9F9] text-gray-900'
      }`}
    >
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCategorySelect={handleCategorySelect}
        categories={adminCategories.map((category) => ({ id: category.slug, label: category.name }))}
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        darkMode={darkMode}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
        <div className="mb-4 md:hidden">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-[#E5A93A] hover:text-[#8C6219] dark:border-neutral-800 dark:bg-[#111111] dark:text-gray-200"
          >
            ☰ Menu
          </button>
        </div>
        {/* Show skeleton on initial load */}
        {isInitialLoad && <DashboardSkeleton />}

        {/* Show refreshing indicator without blocking UI */}
        {isRetrying && (
          <div className="mb-8 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-400 border-t-amber-200"></div>
              <p>Refreshing inventory from server...</p>
            </div>
          </div>
        )}

        {serverError && !hasError && collections.length > 0 && (
          <div className="mb-8 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p>{serverError} (showing cached data)</p>
          </div>
        )}

        {/* Overview Tab - Renders immediately */}
        {activeTab === 'overview' && !isInitialLoad && (
          <div className="animate-in fade-in duration-700 space-y-8">
            {/* Welcome Card */}
            <div className={`rounded-2xl border ${darkMode ? 'border-neutral-800 bg-[#0F0F0F]' : 'border-neutral-200 bg-white'} p-4 mb-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Welcome back</p>
                  <h3 className="mt-2 text-lg font-black">{userName}</h3>
                  <p className="text-sm text-neutral-400">Manage collections, orders and inventory.</p>
                </div>
                <button
                  onClick={() => router.push('/')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                    darkMode
                      ? 'bg-[#E5A93A]/10 text-[#E5A93A] hover:bg-[#E5A93A]/20'
                      : 'bg-[#E5A93A]/10 text-[#8C6219] hover:bg-[#E5A93A]/20'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit Site
                </button>
              </div>
            </div>

            {/* Search and Controls Bar */}
            <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-neutral-200/80 bg-white/80 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <label htmlFor="dashboard-search" className="sr-only">
                  Search dashboard
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="dashboard-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search components, orders, clients, admin"
                    className={`w-full rounded-2xl border bg-transparent py-3 pl-10 pr-4 text-sm outline-none transition ${
                      darkMode
                        ? 'border-neutral-800 text-gray-200 placeholder:text-neutral-500'
                        : 'border-neutral-200 text-gray-900 placeholder:text-neutral-400'
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Visit Site Button */}
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border transition ${
                    darkMode
                      ? 'border-neutral-800 text-gray-200 hover:border-[#E5A93A]'
                      : 'border-neutral-200 text-gray-700 hover:border-[#E5A93A]'
                  }`}
                  title="Visit Site"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>

                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                    className={`relative rounded-full border p-2.5 transition ${
                      darkMode
                        ? 'border-neutral-800 text-gray-200 hover:border-[#E5A93A]'
                        : 'border-neutral-200 text-gray-700 hover:border-[#E5A93A]'
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                    {notificationCount > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                        {notificationCount}
                      </span>
                    )}
                  </button>

                  {showNotificationDropdown && (
                    <div className={`absolute right-0 z-10 mt-2 w-80 rounded-2xl border p-3 shadow-lg ${darkMode ? 'border-neutral-800 bg-[#111111]' : 'border-neutral-200 bg-white'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold">Notifications</p>
                        <button
                          type="button"
                          onClick={() => setShowNotificationDropdown(false)}
                          className="text-neutral-500 hover:text-neutral-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {notifications.length > 0 ? (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {notifications.map((notification: any) => (
                            <button
                              key={notification._id}
                              type="button"
                              onClick={() => handleNotificationClick(notification._id, notification.orderStatus)}
                              className={`w-full text-left flex items-start justify-between rounded-lg border px-3 py-2 transition ${
                                darkMode
                                  ? 'border-neutral-800 bg-black/20 hover:border-[#E5A93A]/50'
                                  : 'border-neutral-200 bg-neutral-50 hover:border-[#E5A93A]'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{notification.customerName || 'Customer Order'}</p>
                                <p className="text-xs text-neutral-500">Order #{notification.orderNumber || notification._id?.toString()?.slice(-6)}</p>
                                <p className="text-[10px] text-neutral-400 uppercase mt-1">{notification.orderStatus}</p>
                              </div>
                              <span className="rounded-full bg-[#E5A93A]/10 px-2 py-1 text-[9px] font-semibold uppercase text-[#8C6219] ml-2 whitespace-nowrap">
                                {notification.orderStatus === 'pending' ? 'Pending' : 'Processing'}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-500 py-4 text-center">No notifications</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={() => setDarkMode(!darkMode)}
                  className={`rounded-full border p-2.5 transition ${
                    darkMode
                      ? 'border-neutral-800 text-gray-200 hover:border-[#E5A93A]'
                      : 'border-neutral-200 text-gray-700 hover:border-[#E5A93A]'
                  }`}
                  title={darkMode ? 'Light Mode' : 'Dark Mode'}
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* Profile Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowProfileMenu((prev) => !prev)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 transition ${
                      darkMode
                        ? 'border-neutral-800 text-gray-200 hover:border-[#E5A93A]'
                        : 'border-neutral-200 text-gray-700 hover:border-[#E5A93A]'
                    }`}
                  >
                    <UserCircle2 className="h-5 w-5" />
                    <span className="text-sm font-semibold">{userName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {showProfileMenu && (
                    <div className={`absolute right-0 z-10 mt-2 w-64 rounded-2xl border p-3 shadow-lg ${darkMode ? 'border-neutral-800 bg-[#111111]' : 'border-neutral-200 bg-white'}`}>
                      <div className="border-b border-neutral-200/70 pb-3 dark:border-neutral-800">
                        <p className="text-sm font-semibold">{userName}</p>
                        <p className="text-xs text-neutral-500">{userEmail}</p>
                      </div>
                      <div className="mt-2 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            router.push('/');
                          }}
                          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                            darkMode ? 'text-gray-200 hover:bg-neutral-900' : 'text-gray-700 hover:bg-neutral-100'
                          }`}
                        >
                          <HomeIcon className="h-4 w-4" />
                          Home
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleLogout();
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-500/10"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Search Results */}
            {normalizedSearch && (
              <div className={`rounded-3xl border p-4 ${darkMode ? 'border-neutral-800 bg-[#111111]' : 'border-neutral-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Search results</p>
                  <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">{searchResults.length} found</span>
                </div>
                {searchResults.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {searchResults.map((result: any, index) => (
                      <button
                        key={`${result.type}-${index}`}
                        onClick={result.action}
                        type="button"
                        className={`w-full flex items-start justify-between rounded-2xl border px-3 py-2 text-left transition ${
                          darkMode
                            ? 'border-neutral-800 bg-black/20 hover:border-[#E5A93A]/50'
                            : 'border-neutral-200 bg-neutral-50 hover:border-[#E5A93A]'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold">{result.label}</p>
                          <p className="text-xs text-neutral-500">{result.detail}</p>
                        </div>
                        <span className="rounded-full bg-[#E5A93A]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C6219]">
                          {result.type}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-neutral-500">
                    No matches found across sidebar, components, orders, or admin details.
                  </p>
                )}
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewCards.map((card) => (
                <StatCard
                  key={card.label}
                  darkMode={darkMode}
                  label={card.label}
                  value={card.value}
                  icon={card.icon}
                  onClick={card.onClick}
                />
              ))}
            </div>

            {/* Dynamic Components with Suspense */}
            <Suspense fallback={<div className="rounded-2xl border border-neutral-200 bg-white p-6 h-80 animate-pulse" />}>
              <RevenueChart darkMode={darkMode} />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<div className="rounded-2xl border border-neutral-200 bg-white p-6 h-64 animate-pulse" />}>
                <RepeatedOrders darkMode={darkMode} />
              </Suspense>
              <Suspense fallback={<div className="rounded-2xl border border-neutral-200 bg-white p-6 h-64 animate-pulse" />}>
                <ReviewsOverview darkMode={darkMode} />
              </Suspense>
            </div>

            <Suspense fallback={<div className="rounded-2xl border border-neutral-200 bg-white p-6 h-80 animate-pulse" />}>
              <BestSellers darkMode={darkMode} />
            </Suspense>
          </div>
        )}

        {/* Home Tab */}
        {activeTab === 'home' && (
          <Suspense fallback={<TabContentSkeleton />}>
            <AnalyticsDashboard
              onCategorySelect={handleCategorySelect}
              onCategoryCreated={() =>
                queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'admin-categories' })
              }
            />
          </Suspense>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <Suspense fallback={<TabContentSkeleton />}>
            <Orders />
          </Suspense>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <Suspense fallback={<TabContentSkeleton />}>
            <Inventory />
          </Suspense>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <Suspense fallback={<TabContentSkeleton />}>
            <ProductsLog
              darkMode={darkMode}
              categoryFilter={selectedCategory || undefined}
              onRefresh={() => {
                setManualRetryCount((prev) => prev + 1);
                refetch();
              }}
            />
          </Suspense>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <Suspense fallback={<TabContentSkeleton />}>
            <ReviewsComponent darkMode={darkMode} />
          </Suspense>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <Suspense fallback={<TabContentSkeleton />}>
            <ActivityLogComponent darkMode={darkMode} />
          </Suspense>
        )}

        {/* Category View */}
        {activeTab === 'category' && selectedCategory && (
          <Suspense fallback={<TabContentSkeleton />}>
            <CategoryView
              categoryName={selectedCategory}
              onBack={() => setActiveTab('overview')}
              darkMode={darkMode}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  icon,
  darkMode,
  onClick,
}: {
  label: string;
  value: string;
  trend?: string;
  icon: React.ReactNode;
  darkMode: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-6 rounded-xl border transition-all group text-left ${
        darkMode
          ? 'bg-[#0F0F0F] border-neutral-900 hover:border-[#E5A93A]/50'
          : 'bg-white border-neutral-200 hover:border-[#E5A93A] shadow-sm'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] text-neutral-500 tracking-widest uppercase">{label}</p>
        <div
          className={`${
            darkMode ? 'text-neutral-700 group-hover:text-[#E5A93A]' : 'text-neutral-300 group-hover:text-[#E5A93A]'
          } transition-colors`}
        >
          {icon}
        </div>
      </div>
      <h3 className={`text-2xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-black'}`}>
        {value}
      </h3>
      {trend && <p className="text-[10px] text-[#E5A93A] mt-2 font-bold uppercase">{trend}</p>}
    </button>
  );
}
