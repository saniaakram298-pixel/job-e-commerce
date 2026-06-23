'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
}

interface SalesChartProps {
  data: ChartData[];
  darkMode?: boolean;
}

const SalesChart: React.FC<SalesChartProps> = ({ data, darkMode = false }) => {
  return (
    <div className={`p-6 rounded-xl border transition-all ${darkMode ? 'bg-[#0F0F0F] border-neutral-900' : 'bg-white border-neutral-200 shadow-sm'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Sales Overview - Last 7 Days
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
              color: darkMode ? '#f3f4f6' : '#1f2937',
            }}
            formatter={(value: any) => {
              if (typeof value === 'number') {
                // Check if it's a large number (revenue) or small number (orders)
                return value > 100 ? `$${value.toFixed(2)}` : value;
              }
              return value;
            }}
          />
          <Legend 
            wrapperStyle={{
              paddingTop: '20px',
              color: darkMode ? '#f3f4f6' : '#1f2937',
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#E5A93A"
            strokeWidth={2}
            dot={{ fill: '#E5A93A', r: 4 }}
            activeDot={{ r: 6 }}
            name="Revenue ($)"
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Orders"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
