'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/client';
import { Repeat2, TrendingUp } from 'lucide-react';

interface RepeatedOrder {
  customerId: string;
  customerName: string;
  customerEmail: string;
  repeatCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

interface RepeatedOrdersProps {
  darkMode?: boolean;
}

const RepeatedOrders: React.FC<RepeatedOrdersProps> = ({ darkMode = false }) => {
  const { data: repeatedOrders = [], isLoading } = useQuery<RepeatedOrder[], Error>({
    queryKey: ['admin-repeated-orders'],
    queryFn: async () => {
      const res = await api.get('/admin/repeated-orders', true);
      return res?.data ?? res ?? [];
    },
    staleTime: 1000 * 60 * 10,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  return (
    <div className={`p-6 rounded-2xl border transition-all ${darkMode ? 'bg-[#0F0F0F] border-neutral-900' : 'bg-white border-neutral-200 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Repeat2 className="w-5 h-5 text-[#E5A93A]" />
            Repeated Orders
          </h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
            Customers with multiple purchases
          </p>
        </div>
        <span className={`text-2xl font-bold ${darkMode ? 'text-[#E5A93A]' : 'text-[#8C6219]'}`}>
          {repeatedOrders.length}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`h-12 rounded-lg animate-pulse ${darkMode ? 'bg-neutral-900' : 'bg-gray-100'}`}
            />
          ))}
        </div>
      ) : repeatedOrders.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {repeatedOrders.map((order) => (
            <div
              key={order.customerId}
              className={`flex items-center justify-between p-3 rounded-lg border transition ${darkMode ? 'border-neutral-800 bg-black/20 hover:border-[#E5A93A]/50' : 'border-neutral-200 bg-neutral-50 hover:border-[#E5A93A]'}`}
            >
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {order.customerName}
                </p>
                <p className={`text-xs truncate ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                  {order.customerEmail}
                </p>
              </div>
              <div className="text-right ml-4 whitespace-nowrap">
                <div className={`font-semibold flex items-center gap-1 justify-end ${darkMode ? 'text-[#E5A93A]' : 'text-[#8C6219]'}`}>
                  <TrendingUp className="w-4 h-4" />
                  {order.repeatCount} orders
                </div>
                <p className={`text-xs ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                  ${order.totalSpent.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`flex items-center justify-center h-32 ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>
          <p>No repeated orders yet</p>
        </div>
      )}
    </div>
  );
};

export default RepeatedOrders;
