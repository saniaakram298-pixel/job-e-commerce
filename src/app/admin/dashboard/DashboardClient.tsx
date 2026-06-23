"use client";
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    LayoutGrid, Package, Layers, Truck, Sun, Moon,
    LogOut, ArrowUpRight, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuth';
import { Home, Collection as CollectionAdmin } from './Collections';
import { Inventory } from './Inventory';
import { Orders } from './Orders';

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
    initialError?: string | null;
}

async function fetchCollectionsFromApi(): Promise<CollectionItem[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
        const res = await fetch('/api/collections', {
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

        if (Array.isArray(data)) {
            return data;
        }

        if (data?.collections && Array.isArray(data.collections)) {
            return data.collections;
        }

        return [];
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

export default function AtelierDashboardClient({ collections: initialCollections, initialError }: DashboardClientProps) {
    const router = useRouter();
    const { logout, user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [manualRetryCount, setManualRetryCount] = useState(0);

    const query = useQuery<CollectionItem[], Error>({
        queryKey: ['admin-collections', manualRetryCount],
        queryFn: fetchCollectionsFromApi,
        initialData: initialCollections,
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: false,
        refetchOnMount: 'always',
        retry: 3,
        retryDelay: (attemptIndex: number) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
    });

    const { data: collections = [], error, isLoading, isFetching, refetch } = query;

    const serverError = error?.message ?? initialError ?? null;
    const isRetrying = isFetching && collections.length > 0;
    const isInitialLoad = isLoading && collections.length === 0;
    const hasError = serverError !== null && collections.length === 0;

    const handleManualRetry = async () => {
        setManualRetryCount((prev) => prev + 1);
        await refetch();
    };

    const userName = user?.firstName || "Admin";

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const stats = useMemo(() => {
        const safeCollections = Array.isArray(collections) ? collections : [];
        const totalStock = safeCollections.reduce((acc: number, curr: CollectionItem) => acc + (curr.stock || 0), 0);
        const totalValue = safeCollections.reduce((acc: number, curr: CollectionItem) => acc + (curr.price || 0), 0);
        return {
            totalItems: safeCollections.length,
            stock: totalStock,
            value: totalValue.toLocaleString(),
            lowStock: safeCollections.filter((c: CollectionItem) => c.stock < 5).length
        };
    }, [collections]);

    const toggleTheme = () => setDarkMode(!darkMode);

    return (
        <div className={`flex h-screen font-sans transition-colors duration-500 ${darkMode ? 'bg-[#0A0A0A] text-gray-200' : 'bg-[#F9F9F9] text-gray-900'}`}>
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 ${darkMode ? 'bg-[#0F0F0F] border-neutral-900' : 'bg-white border-neutral-200'} border-r transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col justify-between py-6 px-4`}>
                <div className="space-y-8">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.3em]">Atelier</p>
                                <h2 className="text-xl font-black">Admin</h2>
                            </div>
                            <button onClick={() => setIsSidebarOpen(false)} className="text-neutral-500 hover:text-[#E5A93A]">X</button>
                        </div>
                    </div>
                    <nav className="space-y-1">
                        {[
                            { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-4 h-4" /> },
                            { id: 'home', label: 'Home', icon: <Layers className="w-4 h-4" /> },
                            { id: 'orders', label: 'Orders', icon: <Truck className="w-4 h-4" /> },
                            { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === tab.id ? (darkMode ? 'bg-[#141414] text-[#E5A93A] border border-neutral-800' : 'bg-[#E5A93A]/10 text-[#8C6219] border border-[#E5A93A]/20') : 'text-neutral-500 hover:text-[#E5A93A]'}`}
                            >
                                {tab.icon}
                                <span className="text-sm font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={toggleTheme}
                        className="w-full rounded-xl border border-neutral-800 px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] transition hover:border-[#E5A93A]"
                    >
                        {darkMode ? <Sun className="inline-block w-4 h-4 mr-2" /> : <Moon className="inline-block w-4 h-4 mr-2" />}
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <div className="rounded-2xl border border-neutral-800 p-4 bg-opacity-80 bg-white/5">
                        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Welcome back</p>
                        <h3 className="mt-2 text-lg font-black">{userName}</h3>
                        <p className="text-sm text-neutral-400">Manage collections, orders and inventory.</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] text-red-600 transition hover:bg-red-500/20 hover:border-red-500/50 flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
                {isInitialLoad && (
                    <div className="mb-8 rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6 text-sm text-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-blue-200"></div>
                            <div>
                                <h2 className="font-bold text-white">Loading Dashboard</h2>
                                <p>Connecting to MongoDB and fetching your inventory...</p>
                            </div>
                        </div>
                    </div>
                )}

                {hasError && (
                    <div className="mb-8 rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100 space-y-4">
                        <div>
                            <h2 className="font-bold text-white">Dashboard Data Unavailable</h2>
                            <p>{serverError}</p>
                            <p className="mt-2 text-neutral-300 text-xs">
                                This usually means MongoDB is temporarily unreachable or the query timed out. Verify that:
                            </p>
                            <ul className="mt-1 ml-4 text-xs space-y-1 text-neutral-300 list-disc">
                                <li>Your MONGODB_URI is correctly configured in .env.local</li>
                                <li>Your MongoDB Atlas IP whitelist includes your current IP</li>
                                <li>Your MongoDB cluster is running and accessible</li>
                            </ul>
                        </div>
                        <button
                            onClick={handleManualRetry}
                            disabled={isFetching}
                            className="px-6 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 text-sm font-semibold uppercase tracking-[0.2em] transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isFetching ? 'Retrying...' : 'Retry Now'}
                        </button>
                    </div>
                )}

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
                
                {activeTab === 'overview' && (
                    <div className="animate-in fade-in duration-700 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard darkMode={darkMode} label="Total Collections" value={stats.totalItems.toString()} icon={<Layers size={16} />} />
                            <StatCard darkMode={darkMode} label="Total Stock" value={stats.stock.toString()} icon={<Package size={16} />} />
                            <StatCard darkMode={darkMode} label="Revenue Potential" value={`$${stats.value}`} icon={<ArrowUpRight size={16} />} />
                            <StatCard darkMode={darkMode} label="Inventory Alerts" value={stats.lowStock.toString()} icon={<AlertCircle size={16} className="text-red-500" />} />
                        </div>
                    </div>
                )}

                {activeTab === 'home' && (
                    <div className="space-y-10">
                        <Home 
                            collections={collections} 
                            onUpdate={() => refetch().then(() => {})}
                            isLoading={isFetching}
                        />
                        <CollectionAdmin 
                            collections={collections} 
                            onUpdate={() => refetch().then(() => {})} 
                            isLoading={isFetching}
                        />
                    </div>
                )}
                {activeTab === 'orders' && <Orders />}
                {activeTab === 'inventory' && <Inventory />}
            </main>
        </div>
    );
}

function StatCard({ label, value, trend, icon, darkMode }: { label: string, value: string, trend?: string, icon: React.ReactNode, darkMode: boolean }) {
    return (
        <div className={`p-6 rounded-xl border transition-all group ${darkMode ? 'bg-[#0F0F0F] border-neutral-900 hover:border-[#E5A93A]/50' : 'bg-white border-neutral-200 hover:border-[#E5A93A] shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] text-neutral-500 tracking-widest uppercase">{label}</p>
                <div className={`${darkMode ? 'text-neutral-700 group-hover:text-[#E5A93A]' : 'text-neutral-300 group-hover:text-[#E5A93A]'} transition-colors`}>{icon}</div>
            </div>
            <h3 className={`text-2xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-black'}`}>{value}</h3>
            {trend && <p className="text-[10px] text-[#E5A93A] mt-2 font-bold uppercase">{trend}</p>}
        </div>
    );
}
