'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Order } from '@/types';
import { api } from '@/lib/client';
import PendingOrdersAlert from '@/components/admin/PendingOrdersAlert';
import { useRouter } from 'next/navigation';
import { useOrdersStore } from '@/hooks/useOrdersStore';

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

function isValidImageUrl(value?: string | null) {
  if (!value) return false;
  const s = value.trim();
  if (!s) return false;
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:') || s.startsWith('/');
}

function normalizeImageSrc(value?: string | null) {
  if (!value) return '/images/hero.png';

  const trimmed = value.trim();
  if (!trimmed) return '/images/hero.png';

  if (isValidImageUrl(trimmed)) return trimmed;

  return `/${trimmed.replace(/^\/+/, '')}`;
}

function getProductImageSrc(productId: Order['items'][number]['productId']) {
  if (typeof productId === 'object' && productId) {
    const candidate = (productId as { img?: string; images?: string[] }).img || (productId as { images?: string[] }).images?.[0];
    return normalizeImageSrc(candidate);
  }

  if (typeof productId === 'string' && isValidImageUrl(productId)) {
    return normalizeImageSrc(productId);
  }

  return '/images/hero.png';
}

// Orders are fetched directly (no TanStack Query, no lazy-loading) to ensure
// instant display and avoid structural streaming.

export const Orders: React.FC = () => {
  const router = useRouter();

  // Edit modal state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editDraft, setEditDraft] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');

  // orders state (persisted in a shared store for instant UI updates)
  const {
    orders,
    initialized,
    isLoading: storeLoading,
    error: storeError,
    initializeOrders,
    setLoading,
    setError,
    optimisticUpdateOrder,
    optimisticRemoveOrder,
  } = useOrdersStore();
  const [visibleCount, setVisibleCount] = useState(10);
  const [error, setLocalError] = useState<Error | null>(null);
  // keep these flags to avoid changing UI conditionals
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [isLoadingMoreOrders, setIsLoadingMoreOrders] = useState(false);

  // bulk selection
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  // Fetch all orders at once (no lazy loading)
  const fetchAllOrdersRef = useRef<Promise<Order[]> | null>(null);
  const fetchAllOrders = useCallback(async (silent = false) => {
    if (fetchAllOrdersRef.current) return fetchAllOrdersRef.current;
    const promise = (async () => {
      if (!silent) {
        setLoading(true);
      }
      setLocalError(null);
      setError(null);
      try {
        const response = await api.get<{ orders?: Order[]; pagination?: { total?: number; pages?: number } } | Order[]>(`/orders?limit=50`, true);
        const payload = Array.isArray(response) ? { orders: response, pagination: { total: response.length, pages: 1 } } : (response as any)?.data ?? response;
        const allOrders = Array.isArray(payload?.orders) ? payload.orders : [];
        initializeOrders(allOrders);
        setVisibleCount(Math.min(10, allOrders.length));
        setHasMoreOrders(false);
        return allOrders;
      } catch (err: any) {
        console.error('Failed to load orders', err);
        const loadError = err instanceof Error ? err : new Error('Failed to load orders');
        setLocalError(loadError);
        setError(loadError.message);
        return [] as Order[];
      } finally {
        setLoading(false);
        setIsLoadingMoreOrders(false);
        fetchAllOrdersRef.current = null;
      }
    })();
    fetchAllOrdersRef.current = promise;
    return promise;
  }, [initializeOrders, setError, setLoading]);

  const loadInitialOrders = useCallback(async () => {
    await fetchAllOrders(!initialized || orders.length === 0);
  }, [fetchAllOrders, initialized, orders.length]);

  useEffect(() => {
    void loadInitialOrders();
  }, [loadInitialOrders]);

  // fetch pending follow-ups (used for badge and follow-up count)
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const pendingRefreshTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const refreshPendingOrders = useCallback((delay = 250) => {
    if (pendingRefreshTimerRef.current) {
      window.clearTimeout(pendingRefreshTimerRef.current);
      pendingRefreshTimerRef.current = null;
    }
    pendingRefreshTimerRef.current = window.setTimeout(async () => {
      pendingRefreshTimerRef.current = null;
      try {
        const resp = await api.get<{ success: boolean; data: any[] } | any[]>('/admin/pending-orders', true);
        const data = Array.isArray(resp) ? resp : (resp as any)?.data ?? [];
        if (isMountedRef.current) setPendingOrders(data);
      } catch (err) {
        console.error('Failed to fetch pending orders', err);
        if (isMountedRef.current) setPendingOrders([]);
      }
    }, delay) as unknown as number;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    // initial load
    refreshPendingOrders(0);
    return () => {
      isMountedRef.current = false;
      if (pendingRefreshTimerRef.current) {
        window.clearTimeout(pendingRefreshTimerRef.current);
        pendingRefreshTimerRef.current = null;
      }
    };
  }, [refreshPendingOrders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const stableFiltered = orders.filter((order) => statusFilter === 'all' || order.orderStatus === statusFilter);
    if (!normalizedSearch) return stableFiltered;
    return stableFiltered.filter((order) =>
      [order.orderNumber?.toString(), order.customerName, order.customerEmail, order.paymentMethod].some((value) =>
        value?.toString().toLowerCase().includes(normalizedSearch)
      )
    );
  }, [orders, statusFilter, searchTerm]);

  // handlers

  async function handleStatusChange(orderId: string, newStatus: string) {
    const previousOrder = orders.find((order) => order._id === orderId);
    optimisticUpdateOrder(orderId, { orderStatus: newStatus as Order['orderStatus'] });
    try {
      await api.patch(`/orders/${orderId}`, { orderStatus: newStatus }, true);
      await fetchAllOrders(true);
      refreshPendingOrders();
    } catch (err) {
      console.error('Failed to update status', err);
      if (previousOrder) {
        optimisticUpdateOrder(orderId, { orderStatus: previousOrder.orderStatus });
      }
    }
  }

  async function applyBulkAction(action: 'shipped' | 'delivered' | 'cancelled' | 'processing') {
    const ids = Object.entries(selectedIds).filter(([, v]) => v).map(([k]) => k);
    if (!ids.length) return;
    const previousOrders = orders.filter((order) => ids.includes(order._id));
    ids.forEach((id) => {
      optimisticUpdateOrder(id, { orderStatus: action });
    });
    try {
      try {
        await api.patch('/orders/bulk', { ids, status: action }, true);
      } catch (bulkErr) {
        await Promise.all(ids.map((id) => api.patch(`/orders/${id}`, { orderStatus: action }, true)));
      }
      setSelectedIds({});
      await fetchAllOrders(true);
      refreshPendingOrders();
    } catch (err) {
      console.error('Bulk action failed', err);
      previousOrders.forEach((order) => {
        optimisticUpdateOrder(order._id, { orderStatus: order.orderStatus });
      });
    }
  }

  async function handleDeleteOrder(orderId: string) {
    if (!confirm('Delete this order? This action cannot be undone.')) return;
    const previousOrder = orders.find((order) => order._id === orderId);
    optimisticRemoveOrder(orderId);
    try {
      await api.delete(`/orders/${orderId}`, true);
      await fetchAllOrders(true);
      refreshPendingOrders();
    } catch (err) {
      console.error('Failed to delete order', err);
      if (previousOrder) {
        initializeOrders([...orders.filter((order) => order._id !== orderId), previousOrder]);
      }
      alert('Failed to delete order');
    }
  }

  function openEditModal(order: Order) {
    setEditingOrder(order);
    setEditDraft({
      orderStatus: order.orderStatus,
      items: (order.items || []).map((it) => ({ size: it.size || '', color: it.color || '', productId: it.productId })),
    });
    setIsEditOpen(true);
  }

  function closeEditModal() {
    setIsEditOpen(false);
    setEditingOrder(null);
    setEditDraft(null);
  }

  async function saveEdit() {
    if (!editingOrder || !editDraft) return;
    const previousOrder = orders.find((order) => order._id === editingOrder._id);
    optimisticUpdateOrder(editingOrder._id, {
      orderStatus: editDraft.orderStatus,
      items: (editDraft.items || []).map((it: any, index: number) => ({
        ...((previousOrder?.items?.[index] as any) || {}),
        size: it.size || undefined,
        color: it.color || undefined,
      })),
    });
    try {
      const payload: any = { orderStatus: editDraft.orderStatus, items: [] };
      for (let i = 0; i < (editDraft.items || []).length; i++) {
        const it = editDraft.items[i];
        payload.items.push({ index: i, size: it.size || undefined, color: it.color || undefined });
      }

      await api.patch(`/orders/${editingOrder._id}`, payload, true);
      await fetchAllOrders(true);
      refreshPendingOrders();
      closeEditModal();
    } catch (err) {
      console.error('Failed to save order edits', err);
      if (previousOrder) {
        optimisticUpdateOrder(editingOrder._id, previousOrder);
      }
      alert('Failed to save order changes');
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

  const visibleOrders = filteredOrders.slice(0, Math.max(visibleCount, orders.length));

  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm, statusFilter]);

  // hero stats derived from orders (no logic change)
  const [overview, setOverview] = useState<{ totalRevenue: number; totalOrders: number; totalCollections: number } | null>(null);

  // compute hero stats from the current store-backed order list
  const {
    totalOrders,
    pendingCount,
    shippingCount,
    deliveringCount,
    processingCount,
    cancelledCount,
    followUpCount,
  } = useMemo(() => {
    const totalOrders = orders.length;
    const pendingCount = orders.filter((o) => o.orderStatus === 'pending').length;
    const shippingCount = orders.filter((o) => !!o.trackingNumber).length;
    const deliveringCount = orders.filter((o) => o.orderStatus === 'shipped').length;
    const processingCount = orders.filter((o) => o.orderStatus === 'processing').length;
    const cancelledCount = orders.filter((o) => o.orderStatus === 'cancelled').length;
    const followUpCount = Array.isArray(pendingOrders) ? pendingOrders.length : 0;
    return { totalOrders, pendingCount, shippingCount, deliveringCount, processingCount, cancelledCount, followUpCount };
  }, [orders, pendingOrders]);

  // Fetch admin overview counters from backend; fallback to live product inventory counts.
  const fetchAdminOverview = useCallback(async () => {
    try {
      const resp = await api.get<{ totalRevenue?: number; totalOrders?: number; totalCollections?: number }>('/admin/overview', true);
      const data = (resp as any) ?? {};
      const totalRevenue = typeof data.totalRevenue === 'number' ? data.totalRevenue : orders.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
      const totalOrders = typeof data.totalOrders === 'number' ? data.totalOrders : orders.length;
      const totalCollections = typeof data.totalCollections === 'number'
        ? data.totalCollections
        : 0;
      setOverview({ totalRevenue, totalOrders, totalCollections });
    } catch (err) {
      const totalRevenue = orders.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
      const totalOrders = orders.length;
      setOverview({ totalRevenue, totalOrders, totalCollections: 0 });
    }
  }, [orders]);

  useEffect(() => {
    void fetchAdminOverview();
  }, [fetchAdminOverview]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchAllOrders(true);
      refreshPendingOrders(0);
      void fetchAdminOverview();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [fetchAllOrders, fetchAdminOverview, refreshPendingOrders]);

  const displayTotals = useMemo(() => {
    const totalRevenue = overview?.totalRevenue ?? orders.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
    const totalOrdersVal = overview?.totalOrders ?? orders.length;
    const totalCollections = overview?.totalCollections ?? 0;
    return { totalRevenue, totalOrdersVal, totalCollections };
  }, [overview, orders]);

  const [activeTab, setActiveTab] = useState<'table' | 'followups'>('table');

  useEffect(() => {
    // reserved for side effects when pendingOrders changes (kept minimal to avoid logic changes)
  }, [pendingOrders]);

  return (
    <>
    {error && (
      <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 flex items-center justify-between">
        <div className="text-sm">Failed to load orders: {error?.message || 'Unknown error'}</div>
        <div>
          <button
            onClick={() => {
              void fetchAllOrders();
            }}
            className="ml-4 inline-flex items-center rounded-md bg-amber-600 px-3 py-1 text-sm font-medium text-white hover:bg-amber-700"
          >
            Retry
          </button>
        </div>
      </div>
    )}
    <main className="space-y-6 p-6">
      {/* Order status summary */}
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

              {storeLoading && orders.length === 0 ? (
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
                    <table className="min-w-[1040px] w-full text-left text-sm">
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
                          <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Image</th>
                          <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Size</th>
                          <th className="px-6 py-4 uppercase tracking-widest text-xs text-slate-500">Color</th>
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
                            <td colSpan={10} className="px-6 py-8 text-center text-sm text-slate-500">
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
                                <td className="px-6 py-4">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {order.items?.length ? (
                                      order.items.map((item, index) => {
                                        const imageSrc = getProductImageSrc(item.productId);
                                        return (
                                          <div
                                            key={`${order._id}-${index}`}
                                            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                                          >
                                            <img
                                              src={imageSrc}
                                              alt={item.name || `Product ${index + 1}`}
                                              className="h-full w-full object-cover"
                                              loading="lazy"
                                              onError={(event) => {
                                                const target = event.currentTarget as HTMLImageElement;
                                                target.src = '/images/hero.png';
                                              }}
                                            />
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <span className="text-xs text-slate-400">No image</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {order.items?.length ? (
                                      order.items.map((item, index) => (
                                        <span key={`${order._id}-size-${index}`} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                                          {item.size || '—'}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-slate-400">—</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {order.items?.length ? (
                                      order.items.map((item, index) => (
                                        <div key={`${order._id}-color-${index}`} className="flex items-center gap-2">
                                          {item.color ? (
                                            <span className="flex items-center gap-2">
                                              <span
                                                aria-hidden
                                                style={{ backgroundColor: item.color }}
                                                className="inline-block h-3 w-3 rounded-full border border-slate-200"
                                              />
                                              <span className="text-xs text-slate-700">{item.color}</span>
                                            </span>
                                          ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-xs text-slate-400">—</span>
                                    )}
                                  </div>
                                </td>
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
                                      onClick={() => openEditModal(order)}
                                      className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteOrder(order._id)}
                                      className="rounded-2xl border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-700"
                                    >
                                      Delete
                                    </button>

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

                    {hasMoreOrders && !isLoadingMoreOrders ? (
                      <button
                        type="button"
                        onClick={() => {
                          setVisibleCount((v) => v + 10);
                          // No-op for load more when using fetch-all strategy.
                        }}
                        className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-700"
                      >
                        Load more
                      </button>
                    ) : !hasMoreOrders && filteredOrders.length > 10 ? (
                      <div className="text-sm text-slate-500">All {filteredOrders.length} orders loaded</div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {isEditOpen && editingOrder && editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeEditModal} />
          <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold">Edit Order #{editingOrder.orderNumber}</h3>
            <div className="mt-4 space-y-4">
              <label className="block text-sm">Status</label>
              <select
                value={editDraft.orderStatus}
                onChange={(e) => setEditDraft((d: any) => ({ ...d, orderStatus: e.target.value }))}
                className="input-base"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <div>
                <div className="text-sm font-medium">Items</div>
                <div className="mt-2 space-y-2">
                  {editDraft.items.map((it: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1 text-sm">Item {idx + 1}</div>
                      <input
                        placeholder="Size"
                        value={it.size}
                        onChange={(e) => {
                          const next = { ...editDraft };
                          next.items[idx].size = e.target.value;
                          setEditDraft(next);
                        }}
                        className="input-base w-32"
                      />
                      <input
                        placeholder="Color"
                        value={it.color}
                        onChange={(e) => {
                          const next = { ...editDraft };
                          next.items[idx].color = e.target.value;
                          setEditDraft(next);
                        }}
                        className="input-base w-32"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={closeEditModal} className="rounded-2xl px-4 py-2">Cancel</button>
                <button type="button" onClick={saveEdit} className="rounded-2xl bg-slate-800 px-4 py-2 text-white">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
    </>
  );
};