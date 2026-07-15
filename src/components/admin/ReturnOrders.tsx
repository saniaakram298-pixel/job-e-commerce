'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/client';
import { Package, CheckCircle2, XCircle, Eye, Image as ImageIcon, Video, Mail, CalendarDays } from 'lucide-react';

interface ReturnOrderItem {
  _id: string;
  orderId?: {
    _id: string;
    orderNumber?: number;
    customerName?: string;
    customerEmail?: string;
    totalPrice?: number;
    orderStatus?: string;
    deliveredAt?: string;
  };
  productId?: {
    _id: string;
    name?: string;
    img?: string;
    images?: string[];
  };
  customerName?: string;
  email?: string;
  customerEmail?: string;
  reason?: string;
  description?: string;
  images?: string[];
  video?: string;
  status?: string;
  adminMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ReturnOrders() {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState<Record<string, string>>({});

  const { data: returns = [], isLoading, refetch } = useQuery<ReturnOrderItem[], Error>({
    queryKey: ['admin-return-requests'],
    queryFn: async () => {
      const response = await api.get<{ success?: boolean; data?: ReturnOrderItem[] } | ReturnOrderItem[]>('/returns?scope=admin', true);
      if (Array.isArray(response)) return response;
      return response?.data ?? [];
    },
    staleTime: 10000,
  });

  const groupedReturns = useMemo(() => {
    return (returns || []).slice().sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [returns]);

  const handleDecision = async (returnId: string, status: 'approved' | 'rejected') => {
    setProcessingId(returnId);
    try {
      await api.patch('/returns', { returnId, status, adminMessage: adminMessage[returnId] || '' }, true);
      await queryClient.invalidateQueries({ queryKey: ['admin-return-requests'] });
      await refetch();
    } catch (error: any) {
      console.error('Return decision error:', error);
      alert(error?.message || 'Unable to update return request');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">Return management</p>
          <h2 className="mt-2 text-2xl font-semibold text-neutral-900">Return Orders</h2>
        </div>
        <div className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700">
          {groupedReturns.length} request{groupedReturns.length === 1 ? '' : 's'}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-sm text-neutral-600">Loading return requests...</div>
      ) : groupedReturns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-sm text-neutral-600">
          No return requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {groupedReturns.map((item) => (
            <div key={item._id} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                      <Package className="h-3.5 w-3.5" /> Return ID {String(item._id).slice(-6)}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : item.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.status || 'pending'}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-neutral-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">Order</p>
                      <p className="mt-1 font-semibold text-neutral-900">#{item.orderId?.orderNumber || '—'}</p>
                      <p className="text-sm text-neutral-600">{item.orderId?.customerName || item.customerName || 'Customer'}</p>
                      <p className="text-sm text-neutral-500">{item.orderId?.customerEmail || item.email || item.customerEmail || 'No email'}</p>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">Product</p>
                      <p className="mt-1 font-semibold text-neutral-900">{item.productId?.name || 'Product'}</p>
                      <p className="text-sm text-neutral-600">Reason: {item.reason || 'No reason provided'}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-3 text-sm text-neutral-700">
                    <p className="font-medium">{item.description || 'No additional details provided.'}</p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-neutral-600">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-neutral-200"><CalendarDays className="h-3.5 w-3.5" /> {new Date(item.createdAt || '').toLocaleDateString()}</span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-neutral-200"><Mail className="h-3.5 w-3.5" /> {item.email || item.customerEmail || 'No email'}</span>
                  </div>

                  {(item.images?.length || item.video) ? (
                    <div className="flex flex-wrap gap-3">
                      {item.images?.map((image, index) => (
                        <a key={`${image}-${index}`} href={image} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
                          <ImageIcon className="h-4 w-4" /> Image {index + 1}
                        </a>
                      ))}
                      {item.video ? (
                        <a href={item.video} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
                          <Video className="h-4 w-4" /> Video
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="w-full max-w-md space-y-3 lg:ml-4">
                  <label className="block text-sm font-medium text-neutral-700">Admin message</label>
                  <textarea
                    value={adminMessage[item._id] || ''}
                    onChange={(event) => setAdminMessage((prev) => ({ ...prev, [item._id]: event.target.value }))}
                    className="min-h-[96px] w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
                    placeholder="Add a note for the customer"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecision(item._id, 'approved')}
                      disabled={processingId === item._id}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(item._id, 'rejected')}
                      disabled={processingId === item._id}
                      className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
