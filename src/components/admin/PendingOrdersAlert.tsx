'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { api } from '@/lib/client';
import { Order } from '@/types';

interface PendingOrder extends Order {
  createdAt: string;
  followUpNotes?: Array<{ message: string; timestamp: string; sentBy?: string }>;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getHoursOld(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60)));
}

export default function PendingOrdersAlert() {
  const queryClient = useQueryClient();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string>('');

  const { data: pendingOrders = [], isLoading, isError } = useQuery<PendingOrder[], Error>({
    queryKey: ['admin-pending-orders'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: PendingOrder[] }>('/admin/pending-orders', true);
      if (Array.isArray(response)) {
        return response;
      }
      return response?.data ?? [];
    },
    staleTime: 1000 * 60,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const mutation = useMutation({
    mutationFn: async ({ orderId, message }: { orderId: string; message: string }) => {
      return api.post('/admin/pending-orders', { orderId, message, sentBy: 'admin' }, true);
    },
    onSuccess: () => {
      setStatusMessage('Reminder sent successfully.');
      queryClient.invalidateQueries(['admin-pending-orders']);
    },
    onError: (error: any) => {
      setStatusMessage(error?.message || 'Unable to send reminder.');
    },
  });

  const sortedOrders = useMemo(
    () =>
      pendingOrders.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [pendingOrders]
  );

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-red-200 flex items-center justify-center text-red-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Pending orders loading…</p>
            <p className="text-sm text-red-700/80">Checking for orders older than 48 hours.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || sortedOrders.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-red-600">Pending Follow-up</p>
          <h2 className="mt-2 text-2xl font-semibold">Orders pending 48+ hours</h2>
          <p className="mt-2 text-sm text-red-700/90 max-w-2xl">
            These orders have been waiting for a follow-up and may require immediate action from your team.
          </p>
        </div>
        <div className="rounded-3xl bg-white/90 px-4 py-3 text-center text-sm font-semibold text-red-800 shadow-sm">
          {sortedOrders.length} urgent order{sortedOrders.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {sortedOrders.map((order) => {
          const isExpanded = expandedOrderId === order._id;
          const hoursOld = getHoursOld(order.createdAt);
          const defaultMessage = `Hi ${order.customerName || 'Customer'},\n\nWe noticed your order #${order.orderNumber} is still pending. Please let us know if you need help completing it or if there are any questions regarding your shipment.`;

          return (
            <div key={order._id} className="rounded-3xl border border-red-200 bg-white p-5 text-gray-900 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Order #{order.orderNumber}</p>
                  <p className="text-sm text-neutral-500">
                    {order.customerName || 'Guest'} · {order.customerEmail || 'No email'}
                  </p>
                  <p className="text-sm text-neutral-500">Placed on {formatDate(order.createdAt)} · {hoursOld} hours ago</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                    {order.orderStatus?.toUpperCase()}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                    ${Number(order.totalPrice).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    {isExpanded ? 'Hide details' : 'View details'}
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-6 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Follow-up history</p>
                      {order.followUpNotes && order.followUpNotes.length > 0 ? (
                        <div className="mt-3 space-y-3">
                          {order.followUpNotes.map((note, index) => (
                            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-3">
                              <p className="text-sm text-slate-700">{note.message}</p>
                              <p className="mt-2 text-xs text-slate-500">{note.sentBy || 'admin'} • {formatDate(note.timestamp)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">No follow-up notes yet.</p>
                      )}
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Send reminder</p>
                      <textarea
                        rows={4}
                        value={messageDrafts[order._id] ?? defaultMessage}
                        onChange={(event) =>
                          setMessageDrafts((prev) => ({ ...prev, [order._id]: event.target.value }))
                        }
                        className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const message = messageDrafts[order._id] ?? defaultMessage;
                          mutation.mutate({ orderId: order._id, message });
                        }}
                        disabled={mutation.isLoading}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Send className="w-4 h-4" />
                        Send reminder
                      </button>
                      {statusMessage ? <p className="mt-3 text-sm text-amber-700">{statusMessage}</p> : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
