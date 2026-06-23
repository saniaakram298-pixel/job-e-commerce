'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Order } from '@/types';
import { api } from '@/lib/client';
import PendingOrdersAlert from '@/components/admin/PendingOrdersAlert';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const statusLabels: Record<string, { label: string; badge: string }> = {
  pending: { label: 'Pending', badge: 'bg-amber-100 text-amber-700' },
  processing: { label: 'Processing', badge: 'bg-sky-100 text-sky-700' },
  shipped: { label: 'Shipped', badge: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Delivered', badge: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-700' },
};

export const Orders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');

  const { data: orders = [], isLoading, error } = useQuery<Order[], Error>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const response = await api.get<{ success?: boolean; data?: Order[] } | Order[]>('/orders', true);
      if (Array.isArray(response)) {
        return response;
      }
      return response?.data ?? [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        [
          order.orderNumber?.toString(),
          order.customerName,
          order.customerEmail,
          order.paymentMethod,
        ].some((value) => value?.toString().toLowerCase().includes(normalizedSearch));
      return matchesStatus && matchesSearch;
    });
  }, [orders, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <PendingOrdersAlert />

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="min-w-0 flex-1">
            <label htmlFor="order-search" className="sr-only">
              Search orders
            </label>
            <input
              id="order-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search orders by number, name, email, or payment method"
              className="input-base"
            />
          </div>

          <div className="flex h-12 min-w-[220px] items-center gap-3">
            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as any)}
              className="input-base"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-neutral-200 bg-slate-100 p-10 text-center text-sm text-slate-500">
            Loading orders…
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            {error.message || 'Unable to fetch orders.'}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-neutral-200">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Order</th>
                    <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Customer</th>
                    <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Email</th>
                    <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Status</th>
                    <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Total</th>
                    <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Payment</th>
                    <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                        No orders match your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const status = statusLabels[order.orderStatus] || statusLabels.pending;
                      return (
                        <tr key={order._id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4 font-semibold text-slate-900">#{order.orderNumber}</td>
                          <td className="px-6 py-4 text-slate-600">{order.customerName || 'Guest'}</td>
                          <td className="px-6 py-4 text-slate-600">{order.customerEmail || '—'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-semibold">${Number(order.totalPrice).toFixed(2)}</td>
                          <td className="px-6 py-4 text-slate-600 capitalize">{order.paymentMethod || 'N/A'}</td>
                          <td className="px-6 py-4 text-slate-600">{formatDate(order.createdAt)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
