'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Order } from '@/types';
import { api } from '@/lib/client';
import SalesChart from './SalesChart';
import RecentOrders from './RecentOrders';
import { DollarSign, ShoppingCart, Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
}

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
}

interface DashboardProps {
  darkMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ darkMode = false }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats, Error, DashboardStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats', true);
      return res?.data ?? res;
    },
    staleTime: 1000 * 10,
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Fetch weekly sales data
  const { data: chartData, isLoading: chartLoading } = useQuery<ChartData[], Error, ChartData[]>({
    queryKey: ['admin-sales-weekly'],
    queryFn: async () => {
      const res = await api.get('/admin/sales/weekly', true);
      return res?.data ?? res ?? [];
    },
    staleTime: 1000 * 60,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Fetch recent orders from the API and keep data automatically fresh
  const {
    data: recentOrders = [],
    isLoading: recentOrdersLoading,
  } = useQuery<Order[], Error, Order[]>({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const res = await api.get('/orders', true);
      const orders = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.orders)
        ? res.orders
        : Array.isArray(res)
        ? res
        : [];
      return orders.slice(0, 5);
    },
    staleTime: 10000,
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const StatCard = ({
    label,
    value,
    icon: Icon,
    trend,
    subtext,
  }: {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className: string }>;
    trend?: string;
    subtext?: string;
  }) => (
    <div className={`p-6 rounded-xl border transition-all group ${darkMode ? 'bg-[#0F0F0F] border-neutral-900 hover:border-[#E5A93A]/50' : 'bg-white border-neutral-200 hover:border-[#E5A93A] shadow-sm'}`}>
      <div className="flex justify-between items-start mb-4">
        <p className={`text-[10px] font-semibold tracking-widest uppercase ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
          {label}
        </p>
        <div className={`${darkMode ? 'text-neutral-700 group-hover:text-[#E5A93A]' : 'text-neutral-300 group-hover:text-[#E5A93A]'} transition-colors`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <h3 className={`text-3xl font-bold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
        {value}
      </h3>
      {trend && (
        <p className="text-[12px] text-[#E5A93A] font-semibold uppercase flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </p>
      )}
      {subtext && (
        <p className={`text-[10px] mt-1 ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>
          {subtext}
        </p>
      )}
    </div>
  );

  const isLoading = statsLoading || chartLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Dashboard Overview
        </h1>
        <p className={`mt-1 ${darkMode ? 'text-neutral-400' : 'text-gray-600'}`}>
          Real-time business metrics and sales analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`h-32 rounded-xl border animate-pulse ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-gray-100 border-neutral-200'}`}
              />
            ))}
          </>
        ) : (
          <>
            <StatCard
              label="Total Revenue"
              value={`$${(stats?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={DollarSign}
              trend="Last 30 days"
              subtext={`${stats?.totalOrders || 0} orders processed`}
            />
            <StatCard
              label="Total Orders"
              value={stats?.totalOrders || 0}
              icon={ShoppingCart}
              trend="All time"
              subtext={`${stats?.pendingOrders || 0} pending`}
            />
            <StatCard
              label="Pending Orders"
              value={stats?.pendingOrders || 0}
              icon={Clock}
              trend="Awaiting action"
              subtext="Requires attention"
            />
            <StatCard
              label="Total Customers"
              value={stats?.totalCustomers || 0}
              icon={Users}
              trend="All time"
              subtext="Unique customers"
            />
          </>
        )}
      </div>

      {/* Charts and Orders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          {chartLoading ? (
            <div className={`h-80 rounded-xl border animate-pulse ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-gray-100 border-neutral-200'}`} />
          ) : (
            <SalesChart data={chartData || []} darkMode={darkMode} />
          )}
        </div>

        {/* Recent Orders Card */}
        <RecentOrders 
          orders={recentOrders} 
          darkMode={darkMode}
          onViewDetails={setSelectedOrder}
        />
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`relative w-full max-w-3xl mx-4 rounded-lg border shadow-lg overflow-auto max-h-[90vh] ${darkMode ? 'bg-[#0F0F0F] border-neutral-900' : 'bg-white border-neutral-200'}`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Order Details
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className={`text-2xl font-light ${darkMode ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                    Order Number
                  </p>
                  <p className={`mt-2 text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    #{selectedOrder.orderNumber}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                    Customer
                  </p>
                  <p className={`mt-2 text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedOrder.customerName || 'Guest'}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                  Order Status
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100/10 text-yellow-600">
                    {selectedOrder.orderStatus?.charAt(0).toUpperCase() + (selectedOrder.orderStatus?.slice(1) || '')}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                  Items
                </p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded-lg border flex justify-between items-center ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-gray-50 border-neutral-200'}`}>
                      <div>
                        <p className={darkMode ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
                          {item.name}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>
                          Qty: {item.quantity}
                          {item.size && ` • Size: ${item.size}`}
                          {item.color && ` • Color: ${item.color}`}
                        </p>
                      </div>
                      <p className={darkMode ? 'text-[#E5A93A] font-semibold' : 'text-[#8C6219] font-semibold'}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                    Shipping Address
                  </p>
                  <div className={`text-sm space-y-1 ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>
                    <p>{selectedOrder.shippingAddress?.street}</p>
                    <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}</p>
                    <p>{selectedOrder.shippingAddress?.country}</p>
                  </div>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                    Billing Address
                  </p>
                  <div className={`text-sm space-y-1 ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>
                    <p>{selectedOrder.billingAddress?.street}</p>
                    <p>{selectedOrder.billingAddress?.city}, {selectedOrder.billingAddress?.state} {selectedOrder.billingAddress?.zipCode}</p>
                    <p>{selectedOrder.billingAddress?.country}</p>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className={`p-4 rounded-lg border-t-2 ${darkMode ? 'border-t-[#E5A93A] bg-neutral-900' : 'border-t-[#E5A93A] bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Order Total
                  </p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-[#E5A93A]' : 'text-[#8C6219]'}`}>
                    ${Number(selectedOrder.totalPrice).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
