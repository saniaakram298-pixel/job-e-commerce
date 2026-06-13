"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
    LayoutGrid, Package, Layers, Truck, Sun, Moon,
    Bell, LogOut, ArrowUpRight, AlertCircle
} from 'lucide-react';
import { Home, Collection as CollectionAdmin } from './Collections';
import { NewArrivals } from './NewArrivals';
import { Editorial } from './Editorial';
import { Inventory } from './Inventory';
import { Orders } from './Orders';

interface Collection {
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

export default function AtelierDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [darkMode, setDarkMode] = useState(false);

    const userName = "Sania";

    // Data Fetching logic (MongoDB connection)
    const fetchCollections = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/collections', { cache: 'no-store' });
            const data = await res.json();
            if (Array.isArray(data)) {
                setCollections(data);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    const stats = useMemo(() => {
        const totalStock = collections.reduce((acc, curr) => acc + (curr.stock || 0), 0);
        const totalValue = collections.reduce((acc, curr) => acc + (curr.price || 0), 0);
        return {
            totalItems: collections.length,
            stock: totalStock,
            value: totalValue.toLocaleString(),
            lowStock: collections.filter(c => c.stock < 5).length
        };
    }, [collections]);

    const toggleTheme = () => setDarkMode(!darkMode);

    return (
        <div className={`flex h-screen font-sans transition-colors duration-500 ${darkMode ? 'bg-[#0A0A0A] text-gray-200' : 'bg-[#F9F9F9] text-gray-900'}`}>
            {/* Sidebar Code (Same as before) */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 ${darkMode ? 'bg-[#0F0F0F] border-neutral-900' : 'bg-white border-neutral-200'} border-r transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col justify-between py-6 px-4`}>
                {/* ... Sidebar contents ... */}
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
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
                {/* Header ... */}
                
                {activeTab === 'overview' && (
                    <div className="animate-in fade-in duration-700 space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard darkMode={darkMode} label="Total Collections" value={stats.totalItems.toString()} icon={<Layers size={16} />} />
                            <StatCard darkMode={darkMode} label="Total Stock" value={stats.stock.toString()} icon={<Package size={16} />} />
                            <StatCard darkMode={darkMode} label="Revenue Potential" value={`$${stats.value}`} icon={<ArrowUpRight size={16} />} />
                            <StatCard darkMode={darkMode} label="Inventory Alerts" value={stats.lowStock.toString()} icon={<AlertCircle size={16} className="text-red-500" />} />
                        </div>
                        
                        {/* ... Graph & Recent Archive Section (Collections dynamic map) ... */}
                    </div>
                )}

                {/* Database-Connected Child Components */}
                {activeTab === 'home' && (
                    <div className="space-y-10">
                        <Home 
                            collections={collections} 
                            onUpdate={fetchCollections} 
                        />
                        <CollectionAdmin 
                            collections={collections} 
                            onUpdate={fetchCollections} 
                        />
                    </div>
                )}
                {activeTab === 'orders' && <Orders orders={[]} />}
                {activeTab === 'inventory' && <Inventory collections={collections} />}
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