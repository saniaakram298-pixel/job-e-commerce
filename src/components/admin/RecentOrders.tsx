'use client';

import React from 'react';
import { Order } from '@/types';
import { TrendingUp, Package, Clock } from 'lucide-react';

interface RecentOrdersProps {
  orders: Order[];
  darkMode?: boolean;
  onViewDetails?: (order: Order) => void;
}

const RecentOrders: React.FC<RecentOrdersProps> = ({ orders, darkMode = false, onViewDetails }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return { bg: 'bg-yellow-100/10', text: 'text-yellow-600', label: 'Pending' };
      case 'shipped':
        return { bg: 'bg-blue-100/10', text: 'text-blue-600', label: 'Shipped' };
      case 'delivered':
        return { bg: 'bg-green-100/10', text: 'text-green-600', label: 'Delivered' };
      case 'cancelled':
        return { bg: 'bg-red-100/10', text: 'text-red-600', label: 'Cancelled' };
      default:
        return { bg: 'bg-gray-100/10', text: 'text-gray-600', label: status };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`p-6 rounded-xl border transition-all ${darkMode ? 'bg-[#0F0F0F] border-neutral-900' : 'bg-white border-neutral-200 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <Package className="w-5 h-5" />
          Recent Orders
        </h3>
        <span className={`text-sm font-medium ${darkMode ? 'text-neutral-400' : 'text-gray-500'}`}>
          Last 5 Orders
        </span>
      </div>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className={`p-6 text-center ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent orders</p>
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = getStatusColor(order.orderStatus || 'pending');
            const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;

            return (
              <div
                key={String(order._id)}
                onClick={() => onViewDetails?.(order)}
                className={`p-4 rounded-lg border transition-all cursor-pointer group ${
                  darkMode
                    ? 'border-neutral-800 hover:border-[#E5A93A]/50 hover:bg-neutral-900/50'
                    : 'border-neutral-200 hover:border-[#E5A93A] hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Order #{order.orderNumber}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-gray-500'}`}>
                      {order.customerName || 'Guest'} • {formatDate(order.createdAt || '')}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {firstItem && (
                      <>
                        <span className={darkMode ? 'text-neutral-400' : 'text-gray-600'}>
                          {(firstItem as any).name}
                        </span>
                        {order.items && order.items.length > 1 && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-600'}`}>
                            +{order.items.length - 1} more
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <p className={`font-semibold flex items-center gap-1 ${darkMode ? 'text-[#E5A93A]' : 'text-[#8C6219]'}`}>
                    <TrendingUp className="w-4 h-4" />
                    ${Number(order.totalPrice).toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentOrders;
