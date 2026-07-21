'use client';

import React, { useMemo, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutGrid, Package, Layers, Truck, Sun, Moon,
  LogOut, ArrowUpRight, AlertCircle, Bell, Search,
  UserCircle2, ChevronDown, Home as HomeIcon, ExternalLink, X,
} from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuth';
import { useSubcategoryStore } from '@/hooks/useSubcategoryStore';
import { api } from '@/lib/client';
import { Home } from './Collections';
import { Inventory } from './Inventory';
import { Orders } from './Orders';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { DashboardSkeleton, TabContentSkeleton } from '@/components/DashboardSkeleton';

// DYNAMIC IMPORTS - Code splitting for instant dashboard load
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

const ReturnOrdersComponent = dynamic(() => import('@/components/admin/ReturnOrders'), {
  loading: () => <TabContentSkeleton />,
});

const CategoryView = dynamic(() => import('@/components/admin/CategoryView'), {
  loading: () => <TabContentSkeleton />,
});

const SubcategoryView = dynamic(() => import('@/components/admin/SubcategoryView'), {
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
    try {
        const res = await fetch('/api/collections?page=1&limit=1000', {
            cache: 'no-store',
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
        throw error;
    }
}

export default function AtelierDashboardClient({ collections: initialCollections, total: initialTotal, initialError }: DashboardClientProps) {
    const router = useRouter();
    const { logout, user, token } = useAuthStore();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [manualRetryCount, setManualRetryCount] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [showUploadForm, setShowUploadForm] = useState(false);

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

    const { data: productInventory } = useQuery<{ total: number }, Error>({
        queryKey: ['admin-product-count'],
        queryFn: async () => {
            const headers: HeadersInit = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            const response = await fetch('/api/products?limit=1&page=1&sort=newest', {
                cache: 'no-store',
                headers,
            });
            if (!response.ok) {
                throw new Error('Failed to load product count');
            }
            const data = await response.json();
            return {
                total: Number(data?.pagination?.total ?? data?.total ?? 0),
            };
        },
        staleTime: 1000 * 30,
        refetchOnWindowFocus: false,
        retry: 2,
    });

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

    const queryClient = useQueryClient();

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

    const normalizedOrders = Array.isArray(orders) ? orders : [];
    const normalizedPendingOrders = Array.isArray(pendingOrders) ? pendingOrders : [];

    const { data: adminCategories = [] } = useQuery<{ slug: string; name: string; productCount: number }[], Error>({
        queryKey: ['admin-categories'],
        queryFn: async () => {
            const headers: HeadersInit = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            const response = await fetch('/api/categories', {
                cache: 'no-store',
                headers,
            });
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
        staleTime: 1000 * 30,
        refetchOnWindowFocus: false,
        refetchOnMount: 'always',
        retry: 2,
    });

    const { data: adminStats } = useQuery<{
        totalRevenue: number;
        totalOrders: number;
        totalProducts: number;
        pendingOrders: number;
        totalCustomers: number;
    }, Error>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            try {
                const headers: HeadersInit = {};
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }
                const response = await fetch('/api/admin/stats', {
                    cache: 'no-store',
                    headers,
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData?.message || `Failed to load stats (${response.status})`);
                }
                const data = await response.json();
                return (data?.data || {
                    totalRevenue: 0,
                    totalOrders: 0,
                    totalProducts: 0,
                    pendingOrders: 0,
                    totalCustomers: 0,
                }) as {
                    totalRevenue: number;
                    totalOrders: number;
                    totalProducts: number;
                    pendingOrders: number;
                    totalCustomers: number;
                };
            } catch (err) {
                console.error('[admin-stats] Error:', err);
                return {
                    totalRevenue: 0,
                    totalOrders: 0,
                    totalProducts: 0,
                    pendingOrders: 0,
                    totalCustomers: 0,
                };
            }
        },
        refetchOnMount: 'always',
        staleTime: 1000 * 30,
        retry: 2,
        enabled: Boolean(token),
    });

    const serverError = error?.message ?? initialError ?? null;
    const isRetrying = isFetching && collections.length > 0;
    const isInitialLoad = isLoading && collections.length === 0;
    const hasError = serverError !== null && collections.length === 0;

    const handleManualRetry = async () => {
        setManualRetryCount((prev) => prev + 1);
        await refetch();
    };

    const userName = user?.firstName || "Admin";
    const userEmail = user?.email || 'admin@theatelier.com';
    const normalizedSearch = searchQuery.trim().toLowerCase();
    
    // Sidebar menu items for search
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

        const matchedOrders = normalizedOrders.filter((order: any) =>
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
        // Clear all subcategory data from session on logout
        useSubcategoryStore.getState().clearAll();
        logout();
        window.location.href = '/login';
    };

    const handleCategorySelect = (categoryName: string) => {
        setSelectedCategory(categoryName);
        setActiveTab('category');
    };

    const handleSubcategorySelect = (categoryName: string, subcategoryName: string) => {
        setSelectedCategory(categoryName);
        setSelectedSubcategory(subcategoryName);
        setActiveTab('subcategory');
    };

    const handleNotificationClick = (orderId: string, orderStatus: string) => {
        // Add to dismissed notifications
        const newDismissed = new Set(dismissedNotifications);
        newDismissed.add(orderId);
        setDismissedNotifications(newDismissed);
        
        // Navigate to orders tab
        setActiveTab('orders');
        setShowNotificationDropdown(false);
    };

    const getNotifications = () => {
        const pendingOrdersForNotifications = normalizedOrders
            .filter((order: any) => ['pending', 'processing'].includes(order.orderStatus))
            .filter((order: any) => !dismissedNotifications.has(order._id));

        const followUps = normalizedPendingOrders
            .filter((order: any) => !dismissedNotifications.has(order._id));

        return [...pendingOrdersForNotifications, ...followUps].slice(0, 5);
    };

    const notifications = getNotifications();

    const stats = useMemo(() => {
        const safeCollections = Array.isArray(collections) ? collections : [];
        const totalStock = safeCollections.reduce((acc: number, curr: CollectionItem) => acc + (curr.stock || 0), 0);
        const totalValue = safeCollections.reduce((acc: number, curr: CollectionItem) => acc + (curr.price || 0), 0);
        
        // Use server stats if available, otherwise fall back to manual calculation
        const totalOrdersValue = (adminStats?.totalOrders ?? 0) || normalizedOrders.length;
        const totalRevenueValue = (adminStats?.totalRevenue ?? 0) || normalizedOrders.reduce((acc: number, curr: any) => acc + Number(curr.totalPrice || 0), 0);
        
        const totalFollowUps = normalizedPendingOrders.length;
        const liveProductCount = Number(productInventory?.total ?? 0);
        
        return {
            totalItems: liveProductCount > 0 ? liveProductCount : (Number.isFinite(totalItems) && totalItems > 0 ? totalItems : safeCollections.length),
            stock: totalStock,
            value: totalValue.toLocaleString(),
            lowStock: safeCollections.filter((c: CollectionItem) => c.stock < 5).length,
            totalOrders: totalOrdersValue,
            totalRevenue: typeof totalRevenueValue === 'number' ? totalRevenueValue.toLocaleString() : '0',
            totalFollowUps,
        };
    }, [collections, orders, pendingOrders, productInventory, totalItems, adminStats]);

    const notificationCount = useMemo(() => {
        const pendingOrderCount = normalizedOrders.filter((order: any) => ['pending', 'processing'].includes(order.orderStatus)).length;
        return pendingOrderCount + normalizedPendingOrders.length;
    }, [normalizedOrders, normalizedPendingOrders]);
    

   const overviewCards = [
    {
        label: 'Total Products',
        value: (productInventory?.total ?? 0).toString(), // ✅ FIXED
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

    const toggleTheme = () => setDarkMode(!darkMode);

    return (
       <div className={`flex h-screen overflow-hidden font-sans ${darkMode ? 'bg-[#0A0A0A] text-gray-200' : 'bg-[#F9F9F9] text-gray-900'}`}>
  
  {/* Desktop Sidebar */}
  <div className="hidden md:block md:w-64 md:fixed md:inset-y-0 z-40">
    <AdminSidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onCategorySelect={handleCategorySelect}
                    categories={Array.isArray(adminCategories) ? adminCategories.map((category) => ({ id: category.slug, label: category.name })) : []}
                    darkMode={darkMode}
                    onLogout={handleLogout} isSidebarOpen={false} onClose={function (): void {
                        throw new Error('Function not implemented.');
                    } }    />
  </div>

  {/* Mobile Sidebar */}
  <AdminSidebar
    activeTab={activeTab}
    onTabChange={setActiveTab}
    onCategorySelect={handleCategorySelect}
    categories={Array.isArray(adminCategories) ? adminCategories.map((category) => ({ id: category.slug, label: category.name })) : []}
    isSidebarOpen={isSidebarOpen}
    onClose={() => setIsSidebarOpen(false)}
    darkMode={darkMode}
    onLogout={handleLogout}
  />

  {/* Main Content */}
  <main className="flex-1 md:ml-64 overflow-y-auto p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
    <div className="mb-4 md:hidden">
      <button
        type="button"
        onClick={() => setIsSidebarOpen(true)}
        className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-[#E5A93A] hover:text-[#8C6219] dark:border-neutral-800 dark:bg-[#111111] dark:text-gray-200"
      >
        ☰ Menu
      </button>
    </div>
                {isInitialLoad && (
                    <div className="mb-4 xs:mb-5 sm:mb-6 md:mb-8 rounded-2xl xs:rounded-2xl sm:rounded-3xl border border-blue-500/30 bg-blue-500/10 p-3 xs:p-4 sm:p-5 md:p-6 text-xs xs:text-sm text-blue-100">
                        <div className="flex items-center gap-2 xs:gap-3">
                            <div className="animate-spin rounded-full h-3 xs:h-4 sm:h-5 w-3 xs:w-4 sm:w-5 border-2 border-blue-400 border-t-blue-200"></div>
                            <div>
                                <h2 className="font-bold text-white text-xs xs:text-sm sm:text-base">Loading Dashboard</h2>
                                <p className="text-xs xs:text-xs sm:text-sm mt-0.5">Connecting to MongoDB and fetching your inventory...</p>
                            </div>
                        </div>
                    </div>
                )}

                {isRetrying && (
                    <div className="mb-4 xs:mb-5 sm:mb-6 md:mb-8 rounded-2xl xs:rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-amber-500/10 p-2 xs:p-3 sm:p-4 text-xs xs:text-sm text-amber-100">
                        <div className="flex items-center gap-1.5 xs:gap-2">
                            <div className="animate-spin rounded-full h-3 xs:h-4 sm:h-5 w-3 xs:w-4 sm:w-5 border-2 border-amber-400 border-t-amber-200"></div>
                            <p className="text-xs xs:text-xs sm:text-sm">Refreshing inventory from server...</p>
                        </div>
                    </div>
                )}

                {serverError && !hasError && collections.length > 0 && (
                    <div className="mb-4 xs:mb-5 sm:mb-6 md:mb-8 rounded-2xl xs:rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-amber-500/10 p-2 xs:p-3 sm:p-4 text-xs xs:text-sm text-amber-100">
                        <p>{serverError} (showing cached data)</p>
                    </div>
                )}
                
                {activeTab === 'overview' && (
                    <div className="animate-in fade-in duration-700 space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-8">
                        {/* Welcome Card */}
                        <div className={`rounded-lg xs:rounded-xl sm:rounded-2xl border ${darkMode ? 'border-neutral-800 bg-[#0F0F0F]' : 'border-neutral-200 bg-white'} p-3 xs:p-4 sm:p-5 md:p-6 mb-4 xs:mb-5 sm:mb-6`}>
                            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-[0.2em] xs:tracking-[0.3em] text-neutral-500">Welcome back</p>
                                    <h3 className="mt-1 xs:mt-2 text-base xs:text-lg sm:text-xl md:text-2xl font-black truncate">{userName}</h3>
                                    <p className="text-xs xs:text-xs sm:text-sm text-neutral-400 mt-1 xs:mt-1.5">Manage collections, orders and inventory.</p>
                                </div>
                                <button
                                    onClick={() => router.push('/')}
                                    className={`flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-xl transition text-xs xs:text-xs sm:text-sm whitespace-nowrap ${darkMode ? 'bg-[#E5A93A]/10 text-[#E5A93A] hover:bg-[#E5A93A]/20' : 'bg-[#E5A93A]/10 text-[#8C6219] hover:bg-[#E5A93A]/20'}`}
                                >
                                    <ExternalLink className="w-3 xs:w-4 h-3 xs:h-4" />
                                    <span className="hidden xs:inline">Visit Site</span>
                                    <span className="xs:hidden">Site</span>
                                </button>
                                
                            </div>
                        </div>

                        <div className="mb-4 xs:mb-5 sm:mb-6 md:mb-8 flex flex-col gap-3 xs:gap-4 rounded-2xl xs:rounded-2xl sm:rounded-3xl border border-neutral-200/80 bg-white/80 p-3 xs:p-4 sm:p-5 md:p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
                            <div className="flex-1 min-w-0">
                                <label htmlFor="dashboard-search" className="sr-only">Search dashboard</label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-2.5 xs:left-3 top-1/2 h-3 xs:h-4 w-3 xs:w-4 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        id="dashboard-search"
                                        type="search"
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder="Search..."
                                        className={`w-full rounded-lg xs:rounded-xl sm:rounded-2xl border bg-transparent py-2 xs:py-2.5 sm:py-3 pl-8 xs:pl-10 pr-3 xs:pr-4 text-xs xs:text-sm outline-none transition ${darkMode ? 'border-neutral-800 text-gray-200 placeholder:text-neutral-500' : 'border-neutral-200 text-gray-900 placeholder:text-neutral-400'}`}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
                                <button
  className="md:hidden p-2"
  onClick={() => setIsSidebarOpen(true)}
>
  ☰
</button>
                                {/* Visit Site Button */}
                                <button
                                    type="button"
                                    onClick={() => router.push('/')}
                                    className={`flex items-center gap-1 xs:gap-1.5 px-2 xs:px-3 py-1.5 xs:py-2 rounded-full xs:rounded-lg border transition text-xs ${darkMode ? 'border-neutral-800 text-gray-200 hover:border-[#E5A93A]' : 'border-neutral-200 text-gray-700 hover:border-[#E5A93A]'}`}
                                    title="Visit Site"
                                >
                                    <ExternalLink className="h-3 xs:h-4 w-3 xs:w-4" />
                                    <span className="hidden sm:inline">Site</span>
                                </button>
                                
                                {/* Notification Dropdown */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                                        className={`relative rounded-full border p-1.5 xs:p-2 transition ${darkMode ? 'border-neutral-800 text-gray-200 hover:border-[#E5A93A]' : 'border-neutral-200 text-gray-700 hover:border-[#E5A93A]'}`}
                                    >
                                        <Bell className="h-3.5 xs:h-4 w-3.5 xs:w-4" />
                                        {notificationCount > 0 && (
                                            <span className="absolute -right-1 -top-1 inline-flex h-4 xs:h-5 min-w-[1rem] xs:min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 xs:px-1.5 text-[8px] xs:text-[10px] font-semibold text-white">
                                                {notificationCount}
                                            </span>
                                        )}
                                    </button>
                                    
                                    {/* Notification Dropdown Menu */}
                                    {showNotificationDropdown && (
                                        <div className={`absolute right-0 z-10 mt-2 w-64 xs:w-72 sm:w-80 rounded-lg xs:rounded-xl sm:rounded-2xl border p-2 xs:p-3 shadow-lg ${darkMode ? 'border-neutral-800 bg-[#111111]' : 'border-neutral-200 bg-white'}`}>
                                            <div className="flex items-center justify-between mb-2 xs:mb-3">
                                                <p className="text-xs xs:text-xs sm:text-sm font-semibold">Notifications</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNotificationDropdown(false)}
                                                    className="text-neutral-500 hover:text-neutral-700"
                                                >
                                                    <X className="h-3 xs:h-4 w-3 xs:w-4" />
                                                </button>
                                            </div>
                                            {notifications.length > 0 ? (
                                                <div className="space-y-1 max-h-64 xs:max-h-72 sm:max-h-80 overflow-y-auto">
                                                    {notifications.map((notification: any) => (
                                                        <button
                                                            key={notification._id}
                                                            type="button"
                                                            onClick={() => handleNotificationClick(notification._id, notification.orderStatus)}
                                                            className={`w-full text-left flex items-start justify-between rounded-lg border px-2 xs:px-3 py-1.5 xs:py-2 transition text-xs xs:text-xs sm:text-sm ${darkMode ? 'border-neutral-800 bg-black/20 hover:border-[#E5A93A]/50' : 'border-neutral-200 bg-neutral-50 hover:border-[#E5A93A]'}`}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs xs:text-xs sm:text-sm font-semibold truncate">{notification.customerName || 'Customer Order'}</p>
                                                                <p className="text-[10px] xs:text-[10px] sm:text-xs text-neutral-500">Order #{notification.orderNumber || notification._id?.toString()?.slice(-6)}</p>
                                                                <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-neutral-400 uppercase mt-0.5">{notification.orderStatus}</p>
                                                            </div>
                                                            <span className="rounded-full bg-[#E5A93A]/10 px-1.5 xs:px-2 py-0.5 text-[7px] xs:text-[8px] sm:text-[9px] font-semibold uppercase text-[#8C6219] ml-2 whitespace-nowrap">
                                                                {notification.orderStatus === 'pending' ? 'Pending' : 'Processing'}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs xs:text-xs sm:text-sm text-neutral-500 py-3 text-center">No notifications</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Theme Toggle */}
                                <button
                                    type="button"
                                    onClick={() => setDarkMode(!darkMode)}
                                    className={`rounded-full border p-1.5 xs:p-2 transition ${darkMode ? 'border-neutral-800 text-gray-200 hover:border-[#E5A93A]' : 'border-neutral-200 text-gray-700 hover:border-[#E5A93A]'}`}
                                    title={darkMode ? 'Light Mode' : 'Dark Mode'}
                                >
                                    {darkMode ? <Sun className="h-3.5 xs:h-4 w-3.5 xs:w-4" /> : <Moon className="h-3.5 xs:h-4 w-3.5 xs:w-4" />}
                                </button>
                                
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowProfileMenu((prev) => !prev)}
                                        className={`flex items-center gap-1.5 xs:gap-2 rounded-full border px-2.5 xs:px-3 py-1.5 xs:py-2 transition text-xs xs:text-xs sm:text-sm ${darkMode ? 'border-neutral-800 text-gray-200 hover:border-[#E5A93A]' : 'border-neutral-200 text-gray-700 hover:border-[#E5A93A]'}`}
                                    >
                                        <UserCircle2 className="h-4 xs:h-5 w-4 xs:w-5" />
                                        <span className="font-semibold hidden xs:inline truncate max-w-[80px]">{userName}</span>
                                        <ChevronDown className="h-3.5 xs:h-4 w-3.5 xs:w-4" />
                                    </button>
                                    {showProfileMenu && (
                                        <div className={`absolute right-0 z-10 mt-2 w-56 xs:w-64 rounded-lg xs:rounded-xl sm:rounded-2xl border p-2 xs:p-3 shadow-lg ${darkMode ? 'border-neutral-800 bg-[#111111]' : 'border-neutral-200 bg-white'}`}>
                                            <div className="border-b border-neutral-200/70 pb-2 xs:pb-3 dark:border-neutral-800">
                                                <p className="text-xs xs:text-xs sm:text-sm font-semibold">{userName}</p>
                                                <p className="text-[10px] xs:text-[10px] sm:text-xs text-neutral-500">{userEmail}</p>
                                            </div>
                                            <div className="mt-1.5 xs:mt-2 space-y-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowProfileMenu(false);
                                                        router.push('/');
                                                    }}
                                                    className={`flex w-full items-center gap-2 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-xs sm:text-sm transition ${darkMode ? 'text-gray-200 hover:bg-neutral-900' : 'text-gray-700 hover:bg-neutral-100'}`}
                                                >
                                                    <HomeIcon className="h-3.5 xs:h-4 w-3.5 xs:w-4" />
                                                    Home
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowProfileMenu(false);
                                                        handleLogout();
                                                    }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-xs sm:text-sm text-red-600 transition hover:bg-red-500/10"
                                                >
                                                    <LogOut className="h-3.5 xs:h-4 w-3.5 xs:w-4" />
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {normalizedSearch && (
                            <div className={`rounded-lg xs:rounded-xl sm:rounded-2xl border p-3 xs:p-4 sm:p-5 md:p-6 mb-4 xs:mb-5 sm:mb-6 md:mb-8 ${darkMode ? 'border-neutral-800 bg-[#111111]' : 'border-neutral-200 bg-white'}`}>
                                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3">
                                    <p className="text-xs xs:text-xs sm:text-sm font-semibold">Search results</p>
                                    <span className="text-[10px] xs:text-[10px] sm:text-xs uppercase tracking-[0.15em] xs:tracking-[0.2em] text-neutral-500">{searchResults.length} found</span>
                                </div>
                                {searchResults.length > 0 ? (
                                    <div className="mt-3 xs:mt-4 space-y-1.5 xs:space-y-2">
                                        {searchResults.map((result: any, index) => (
                                            <button
                                                key={`${result.type}-${index}`}
                                                onClick={result.action}
                                                type="button"
                                                className={`w-full flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1.5 xs:gap-2 rounded-lg xs:rounded-xl border px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-left transition text-xs xs:text-xs sm:text-sm ${darkMode ? 'border-neutral-800 bg-black/20 hover:border-[#E5A93A]/50' : 'border-neutral-200 bg-neutral-50 hover:border-[#E5A93A]'}`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs xs:text-xs sm:text-sm font-semibold truncate">{result.label}</p>
                                                    <p className="text-[10px] xs:text-[10px] sm:text-xs text-neutral-500 truncate">{result.detail}</p>
                                                </div>
                                                <span className="rounded-full bg-[#E5A93A]/10 px-1.5 xs:px-2 sm:px-2.5 py-0.5 xs:py-1 text-[8px] xs:text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.1em] xs:tracking-[0.2em] text-[#8C6219] whitespace-nowrap">
                                                    {result.type}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-3 xs:mt-4 text-xs xs:text-xs sm:text-sm text-neutral-500">No matches found across sidebar, components, orders, or admin details.</p>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2.5 xs:gap-3 sm:gap-4 md:gap-6">
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

                        {/* Revenue Chart */}
                        <RevenueChart darkMode={darkMode} />

                        {/* Repeated Orders and Reviews Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-5 sm:gap-6 md:gap-8">
                            <RepeatedOrders darkMode={darkMode} />
                            <ReviewsOverview darkMode={darkMode} />
                        </div>

                        {/* Best Sellers */}
                        <BestSellers darkMode={darkMode} />
                    </div>
                )}

                {activeTab === 'home' && (
                    <div className="space-y-8">
                        {/* Analytics Dashboard - Above Categories */}
                        <AnalyticsDashboard
                            onCategorySelect={handleCategorySelect}
                            onCategoryCreated={() => {
                              queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
                              queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
                              queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
                              queryClient.invalidateQueries({ queryKey: ['admin-product-count'] });
                            }}
                        />
                    </div>
                )}
                {activeTab === 'orders' && <Orders />}
                {activeTab === 'inventory' && <Inventory />}
                {activeTab === 'products' && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <ProductsLog
                            darkMode={darkMode}
                            categoryFilter={selectedCategory || undefined}
                            onRefresh={() => {
                                setManualRetryCount((prev) => prev + 1);
                                refetch();
                            }}
                        />
                    </div>
                )}
                {activeTab === 'reviews' && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <ReviewsComponent darkMode={darkMode} />
                    </div>
                )}
                {activeTab === 'return orders' && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <ReturnOrdersComponent />
                    </div>
                )}
                {activeTab === 'activity' && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <ActivityLogComponent darkMode={darkMode} />
                    </div>
                )}

                {activeTab === 'category' && selectedCategory && (
                    <div className="animate-in fade-in duration-700">
                        <CategoryView
                            categoryName={selectedCategory}
                            onBack={() => setActiveTab('overview')}
                            darkMode={darkMode}
                        />
                    </div>
                )}

                {activeTab === 'subcategory' && selectedCategory && selectedSubcategory && (
                    <div className="animate-in fade-in duration-700">
                        <SubcategoryView
                            categoryName={selectedCategory}
                            subcategoryName={selectedSubcategory}
                            onBack={() => {
                                setSelectedSubcategory(null);
                                setActiveTab('category');
                            }}
                            darkMode={darkMode}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ label, value, trend, icon, darkMode, onClick }: { label: string, value: string, trend?: string, icon: React.ReactNode, darkMode: boolean, onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full p-3 xs:p-4 sm:p-5 md:p-6 rounded-lg xs:rounded-xl sm:rounded-[1.25rem] md:rounded-2xl border transition-all group text-left ${darkMode ? 'bg-[#0F0F0F] border-neutral-900 hover:border-[#E5A93A]/50' : 'bg-white border-neutral-200 hover:border-[#E5A93A] shadow-sm'} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
        >
            <div className="flex justify-between items-start mb-2.5 xs:mb-3 sm:mb-4">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-neutral-500 tracking-widest uppercase font-medium">{label}</p>
                <div className={`${darkMode ? 'text-neutral-700 group-hover:text-[#E5A93A]' : 'text-neutral-300 group-hover:text-[#E5A93A]'} transition-colors h-3.5 xs:h-4 sm:h-5 w-3.5 xs:w-4 sm:w-5`}>{icon}</div>
            </div>
            <h3 className={`text-lg xs:text-xl sm:text-2xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-black'}`}>{value}</h3>
            {trend && <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-[#E5A93A] mt-1.5 xs:mt-2 font-bold uppercase">{trend}</p>}
        </button>
    );
}

