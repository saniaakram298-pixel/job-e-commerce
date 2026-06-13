import React from 'react';
import { LayoutGrid, Package, LogOut, Plus } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, setIsModalOpen }) {
    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid },
        { id: 'inventory', label: 'Inventory', icon: Package },
    ];

    return (
        <aside className="w-64 bg-[#0F0F0F] border-r border-neutral-900 flex flex-col justify-between py-6 px-4 h-screen sticky top-0">
            <div>
                <div className="flex items-center gap-3 px-2 mb-10">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E5A93A] to-[#8C6219] flex items-center justify-center text-black font-bold">A</div>
                    <h1 className="text-white font-semibold">Atelier</h1>
                </div>
                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === item.id ? 'bg-[#141414] text-white border border-neutral-800' : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-[#E5A93A]' : ''}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#E5A93A]/30 rounded-lg bg-[#E5A93A]/5 text-[#E5A93A] hover:bg-[#E5A93A]/10"
            >
                <Plus className="w-4 h-4" /> New Collection
            </button>
        </aside>
    );
}