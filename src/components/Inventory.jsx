import React from 'react';

export default function Inventory({ data }) {
    // Stats with circular progress
    const stats = [
        { label: "Total Stock", percentage: 85, color: "#E5A93A" },
        { label: "Sold Out", percentage: 40, color: "#22c55e" },
        { label: "Production", percentage: 65, color: "#3b82f6" }
    ];

    return (
        <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl font-normal tracking-widest text-white uppercase mb-8">Inventory Control</h2>

            {/* Circular Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-[#0F0F0F] border border-neutral-900 p-6 rounded-xl flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">{stat.label}</span>
                        <div className="relative w-16 h-16">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" className="text-neutral-800 stroke-current" strokeWidth="3" />
                                <circle cx="18" cy="18" r="16" fill="none" className="stroke-current" stroke={stat.color} strokeWidth="3"
                                    strokeDasharray={`${stat.percentage}, 100`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold">{stat.percentage}%</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-[#0F0F0F] border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#141414] border-b border-neutral-900">
                        <tr>
                            <th className="px-6 py-4 text-[10px] text-neutral-500 uppercase">Product Name</th>
                            <th className="px-6 py-4 text-[10px] text-neutral-500 uppercase">Tag</th>
                            <th className="px-6 py-4 text-[10px] text-neutral-500 uppercase text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/50">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-[#121212] transition-colors">
                                <td className="px-6 py-4 text-sm text-white font-medium">{item.title}</td>
                                <td className="px-6 py-4 text-xs text-neutral-400">{item.tag}</td>
                                <td className="px-6 py-4 text-right"><span className="text-[#E5A93A] text-[10px] font-bold">IN STOCK</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}