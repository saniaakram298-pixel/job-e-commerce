"use client";
import React from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 p-6 space-y-8">
        <h2 className="font-serif text-xl font-bold tracking-widest">ATELIER ADMIN</h2>
        <nav className="flex flex-col space-y-4">
          <Link href="/admin/dashboard" className="text-sm font-medium text-black">Dashboard</Link>
          <Link href="/admin/products" className="text-sm text-stone-500 hover:text-black">Products</Link>
          <Link href="/admin/orders" className="text-sm text-stone-500 hover:text-black">Orders</Link>
          <Link href="/" className="text-sm text-red-500 pt-10">Exit Store</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <header className="flex justify-between items-center mb-10">
          <h1 className="font-serif text-3xl italic">Overview</h1>
          <div className="bg-white px-4 py-2 rounded shadow-sm text-xs font-bold uppercase tracking-widest">
            Admin Mode
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 border border-stone-100 shadow-sm">
            <p className="text-stone-400 text-[10px] uppercase tracking-widest mb-2">Total Sales</p>
            <p className="text-2xl font-bold">$12,450.00</p>
          </div>
          <div className="bg-white p-6 border border-stone-100 shadow-sm">
            <p className="text-stone-400 text-[10px] uppercase tracking-widest mb-2">Active Orders</p>
            <p className="text-2xl font-bold">24</p>
          </div>
          <div className="bg-white p-6 border border-stone-100 shadow-sm">
            <p className="text-stone-400 text-[10px] uppercase tracking-widest mb-2">Inventory Items</p>
            <p className="text-2xl font-bold">148</p>
          </div>
        </div>
      </main>
    </div>
  );
}