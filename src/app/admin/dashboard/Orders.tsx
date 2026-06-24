'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Order } from '@/types';
import { api } from '@/lib/client';
import PendingOrdersAlert from '@/components/admin/PendingOrdersAlert';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');

  // pagination / load more
  const [visibleCount, setVisibleCount] = useState(12);

  // bulk selection
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  const { data: orders = [], isLoading, error } = useQuery<Order[], Error>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const response = await api.get<{ success?: boolean; data?: Order[] } | Order[]>('/orders', true);
      if (Array.isArray(response)) return response;
      return (response as any)?.data ?? [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // fetch pending follow-ups (used for badge and follow-up count)
  const { data: pendingOrders = [] } = useQuery<any[], Error>({
    queryKey: ['admin-pending-orders'],
    queryFn: async () => {
      const resp = await api.get<{ success: boolean; data: any[] }>('/admin/pending-orders', true);
      if (Array.isArray(resp)) return resp;
      return resp?.data ?? [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
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

  // handlers

  async function handleStatusChange(orderId: string, newStatus: string) {
    try {
      await api.patch(`/orders/${orderId}`, { orderStatus: newStatus }, true);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      // keep follow-ups in sync
      queryClient.invalidateQueries({ queryKey: ['admin-pending-orders'] });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  }

  async function applyBulkAction(action: 'shipped' | 'delivered' | 'cancelled' | 'processing') {
    const ids = Object.entries(selectedIds).filter(([, v]) => v).map(([k]) => k);
    if (!ids.length) return;
    try {
      await Promise.all(ids.map((id) => api.patch(`/orders/${id}`, { orderStatus: action }, true)));
      setSelectedIds({});
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      // keep follow-ups in sync after bulk changes
      queryClient.invalidateQueries({ queryKey: ['admin-pending-orders'] });
    } catch (err) {
      console.error('Bulk action failed', err);
    }
  }

  function toggleSelectAll(checked: boolean, visibleList: Order[]) {
    const next: Record<string, boolean> = { ...selectedIds };
    visibleList.forEach((o) => (next[o._id] = checked));
    setSelectedIds(next);
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function exportToCSV(rows: Order[]) {
    if (!rows.length) return;
    const headers = ['OrderNumber', 'Customer', 'Email', 'Status', 'Total', 'Payment', 'Date'];
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [
          `#${r.orderNumber}`,
          `"${(r.customerName || '').replace(/"/g, '""')}"`,
          (r.customerEmail || ''),
          (r.orderStatus || ''),
          Number(r.totalPrice || 0).toFixed(2),
          (r.paymentMethod || ''),
          formatDate(r.createdAt || ''),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const visibleOrders = filteredOrders.slice(0, visibleCount);

  // hero stats derived from orders (no logic change)
  const totalOrders = orders.length;
  const pendingCount = orders.filter((o) => o.orderStatus === 'pending').length;
  const shippingCount = orders.filter((o) => !!o.trackingNumber).length;
  const deliveringCount = orders.filter((o) => o.orderStatus === 'shipped').length;
  const processingCount = orders.filter((o) => o.orderStatus === 'processing').length;
  const cancelledCount = orders.filter((o) => o.orderStatus === 'cancelled').length;
  const followUpCount = Array.isArray(pendingOrders) ? pendingOrders.length : 0;

  const [activeTab, setActiveTab] = useState<'table' | 'followups'>('table');

  useEffect(() => {
    // reserved for side effects when pendingOrders changes (kept minimal to avoid logic changes)
  }, [pendingOrders]);

  return (
    <main className="space-y-6 p-6">
      {/* Hero stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm">
          <div className="text-xs text-slate-500">Total Orders</div>
          <div className="mt-2 text-lg font-semibold">{totalOrders}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm">
          <div className="text-xs text-slate-500">Pending</div>
          <div className="mt-2 text-lg font-semibold">{pendingCount}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm">
          <div className="text-xs text-slate-500">Shipping</div>
          <div className="mt-2 text-lg font-semibold">{shippingCount}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm">
          <div className="text-xs text-slate-500">Delivering</div>
          <div className="mt-2 text-lg font-semibold">{deliveringCount}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm">
          <div className="text-xs text-slate-500">Processing</div>
          <div className="mt-2 text-lg font-semibold">{processingCount}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm">
          <div className="text-xs text-slate-500">Cancelled</div>
          <div className="mt-2 text-lg font-semibold">{cancelledCount}</div>
        </div>
      </div>

      {/* Follow-ups card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm w-56">
        <div className="text-xs text-slate-500">Active follow-ups</div>
        <div className="mt-2 text-lg font-semibold">{followUpCount}</div>
      </div>

      {/* Tabs */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <button
            className={`px-4 py-2 rounded-2xl ${activeTab === 'table' ? 'bg-slate-100' : 'bg-transparent'}`}
            onClick={() => setActiveTab('table')}
          >
            Order Table
          </button>

          <button
            className={`relative px-4 py-2 rounded-2xl ${activeTab === 'followups' ? 'bg-slate-100' : 'bg-transparent'}`}
            onClick={() => setActiveTab('followups')}
          >
            Follow-ups
            {followUpCount > 0 && (
              <span className="absolute -top-1 -right-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs w-5 h-5">{followUpCount}</span>
            )}
          </button>
        </div>

        <div className="mt-4">
          {activeTab === 'followups' ? (
            <PendingOrdersAlert />
          ) : (
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div className="min-w-0 flex-1">
                  <label htmlFor="order-search" className="sr-only">Search orders</label>
                  <input
                    id="order-search"
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search orders by number, name, email, or payment method"
                    className="input-base"
                  />
                </div>

                <div className="flex items-center gap-3">
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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => exportToCSV(filteredOrders)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700"
                    >
                      Export CSV
                    </button>
                  </div>
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
                          <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">
                            <input
                              type="checkbox"
                              aria-label="select all"
                              checked={visibleOrders.every((o) => selectedIds[o._id]) && visibleOrders.length > 0}
                              onChange={(e) => toggleSelectAll(e.target.checked, visibleOrders)}
                            />
                          </th>
                          <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Order</th>
                          <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Customer</th>
                          <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Email</th>
                          <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Status</th>
                          <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500 text-right">Total</th>
                          <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Payment</th>
                          <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Date</th>
                          <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-6 py-8 text-center text-sm text-slate-500">
                              No orders match your search or filter.
                            </td>
                          </tr>
                        ) : (
                          visibleOrders.map((order) => {
                            const status = statusLabels[order.orderStatus] || statusLabels.pending;
                            return (
                              <tr key={order._id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-6 py-4">
                                  <input
                                    type="checkbox"
                                    checked={!!selectedIds[order._id]}
                                    onChange={() => toggleSelectOne(order._id)}
                                  />
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-900">#{order.orderNumber}</td>
                                <td className="px-6 py-4 text-slate-600">{order.customerName || 'Guest'}</td>
                                <td className="px-6 py-4 text-slate-600">{order.customerEmail || '—'}</td>
                                <td className="px-6 py-4">
                                  <select
                                    value={order.orderStatus}
                                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </td>
                                <td className="px-6 py-4 text-slate-900 font-semibold text-right">${Number(order.totalPrice).toFixed(2)}</td>
                                <td className="px-6 py-4 text-slate-600 capitalize">{order.paymentMethod || 'N/A'}</td>
                                <td className="px-6 py-4 text-slate-600">{formatDate(order.createdAt)}</td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => router.push(`/admin/orders/${order._id}`)}
                                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                                    >
                                      View
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-600">{selectedCount} selected</div>
                      <select id="bulk-action" className="input-base h-10" defaultValue="">
                        <option value="">Bulk actions</option>
                        <option value="processing">Mark Processing</option>
                        <option value="shipped">Mark Shipped</option>
                        <option value="delivered">Mark Delivered</option>
                        <option value="cancelled">Mark Cancelled</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const sel = (document.getElementById('bulk-action') as HTMLSelectElement)?.value;
                          if (!sel) return;
                          applyBulkAction(sel as any);
                        }}
                        className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700"
                      >
                        Apply
                      </button>
                    </div>

                    {visibleCount < filteredOrders.length ? (
                      <button
                        type="button"
                        onClick={() => setVisibleCount((v) => v + 12)}
                        className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-700"
                      >
                        Load more
                      </button>
                    ) : filteredOrders.length > 12 ? (
                      <div className="text-sm text-slate-500">All {filteredOrders.length} orders loaded</div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};