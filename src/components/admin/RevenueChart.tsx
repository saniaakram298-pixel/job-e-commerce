'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/client';
import { Calendar } from 'lucide-react';

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  darkMode?: boolean;
}

type TimePeriod = 'weekly' | 'monthly' | 'yearly';

const RevenueChart: React.FC<RevenueChartProps> = ({ darkMode = false }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');

  const { data: chartData = [], isLoading } = useQuery<RevenueData[], Error>({
    queryKey: ['admin-revenue', timePeriod],
    queryFn: async () => {
      const endpoint = 
        timePeriod === 'weekly' ? '/admin/revenue/weekly' :
        timePeriod === 'monthly' ? '/admin/revenue/monthly' :
        '/admin/revenue/yearly';
      
      const res = await api.get(endpoint, true);
      return res?.data ?? res ?? [];
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  return (
    <div className={`p-6 rounded-2xl border transition-all ${darkMode ? 'bg-[#0F0F0F] border-neutral-900' : 'bg-white border-neutral-200 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Revenue Overview
          </h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
            {timePeriod === 'weekly' && 'Last 7 days'}
            {timePeriod === 'monthly' && 'Last 30 days'}
            {timePeriod === 'yearly' && 'Last 12 months'}
          </p>
        </div>
        <div className="flex gap-2">
          {(['weekly', 'monthly', 'yearly'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition uppercase tracking-wide ${
                timePeriod === period
                  ? darkMode
                    ? 'bg-[#E5A93A]/20 text-[#E5A93A] border border-[#E5A93A]/30'
                    : 'bg-[#E5A93A]/10 text-[#8C6219] border border-[#E5A93A]/30'
                  : darkMode
                  ? 'text-neutral-500 hover:text-[#E5A93A]'
                  : 'text-gray-600 hover:text-[#8C6219]'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className={`h-80 rounded-lg animate-pulse ${darkMode ? 'bg-neutral-900' : 'bg-gray-100'}`} />
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={darkMode ? '#404040' : '#e5e7eb'}
            />
            <XAxis
              dataKey="date"
              stroke={darkMode ? '#9ca3af' : '#6b7280'}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke={darkMode ? '#9ca3af' : '#6b7280'}
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${darkMode ? '#404040' : '#e5e7eb'}`,
                borderRadius: '8px',
              }}
              formatter={(value: any) => `$${value.toLocaleString()}`}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#E5A93A" name="Revenue ($)" />
            <Bar dataKey="orders" fill="#8C6219" name="Orders" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className={`h-80 flex items-center justify-center ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>
          <p>No revenue data available</p>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;
