import React from 'react';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import OrderPrint from '@/components/admin/OrderPrint';

interface PageProps {
  params: { id: string };
}

function formatDate(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function Page({ params }: PageProps) {
  const { id } = params;

  await connectDB();

  const orderDoc = await Order.findById(id).lean();
  if (!orderDoc) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">Order not found.</div>
      </div>
    );
  }

  // Ensure the object is serializable for client components
  const order = JSON.parse(JSON.stringify(orderDoc));

  return (
    <div className="p-6">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Order #{order.orderNumber ?? order._id}</h1>
            <p className="text-sm text-slate-600">{order.customerName || 'Guest'} · {order.customerEmail || 'No email'}</p>
            <p className="text-xs text-slate-500 mt-1">Placed on {formatDate(order.createdAt)}</p>
          </div>

          <div className="flex items-center gap-2">
            <OrderPrint order={order} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Shipping Address</h2>
            <div className="text-sm text-slate-700">
              <div>{order.shippingAddress?.street}</div>
              <div>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</div>
              <div>{order.shippingAddress?.country}</div>
            </div>

            <h2 className="text-sm font-semibold mt-4">Billing Address</h2>
            <div className="text-sm text-slate-700">
              <div>{order.billingAddress?.street}</div>
              <div>{order.billingAddress?.city}, {order.billingAddress?.state} {order.billingAddress?.zipCode}</div>
              <div>{order.billingAddress?.country}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Order Summary</h2>
            <div className="text-sm text-slate-700">
              <div>Order Status: <strong className="capitalize">{order.orderStatus}</strong></div>
              <div>Payment Method: {order.paymentMethod || 'N/A'}</div>
              <div>Total: <strong>${Number(order.totalPrice || 0).toFixed(2)}</strong></div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3">Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-xs text-slate-500">Product</th>
                  <th className="px-4 py-2 text-xs text-slate-500">Quantity</th>
                  <th className="px-4 py-2 text-xs text-slate-500">Price</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((it: any, idx: number) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-4 py-3">{it.name}</td>
                    <td className="px-4 py-3">{it.quantity}</td>
                    <td className="px-4 py-3">${Number(it.price || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3">Follow-up Notes</h2>
          {order.followUpNotes && order.followUpNotes.length > 0 ? (
            <div className="space-y-3">
              {order.followUpNotes.map((n: any, i: number) => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-white p-3">
                  <p className="text-sm text-slate-700">{n.message}</p>
                  <p className="mt-2 text-xs text-slate-500">{n.sentBy || 'admin'} • {formatDate(n.timestamp)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No follow-up notes.</p>
          )}
        </div>
      </div>
    </div>
  );
}
