'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/client';
import { TrendingUp, Award } from 'lucide-react';

interface BestSeller {
  _id: string;
  title: string;
  category: string;
  totalSales: number;
  quantity: number;
  revenue: number;
  img?: string;
}

interface BestSellersProps {
  darkMode?: boolean;
}

const BestSellers: React.FC<BestSellersProps> = ({ darkMode = false }) => {
  const { data: bestSellers = [], isLoading } = useQuery<BestSeller[], Error>({
    queryKey: ['admin-best-sellers'],
    queryFn: async () => {
      const res = await api.get('/admin/best-sellers', true);
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
            <Award className="w-5 h-5 text-[#E5A93A]" />
            Best Sellers
          </h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
            Top performing products by sales
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`h-16 rounded-lg animate-pulse ${darkMode ? 'bg-neutral-900' : 'bg-gray-100'}`}
            />
          ))}
        </div>
      ) : bestSellers.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {bestSellers.map((product, index) => (
            <div
              key={product._id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition ${darkMode ? 'border-neutral-800 bg-black/20 hover:border-[#E5A93A]/50' : 'border-neutral-200 bg-neutral-50 hover:border-[#E5A93A]'}`}
            >
              {/* Rank Badge */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                index === 1 ? 'bg-gray-300/20 text-gray-600' :
                index === 2 ? 'bg-orange-300/20 text-orange-600' :
                darkMode ? 'bg-neutral-900 text-neutral-400' : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>

              {/* Product Image */}
              {product.img && (
                <img
                  src={product.img}
                  alt={product.title}
                  className="w-12 h-12 rounded object-cover"
                />
              )}

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {product.title}
                </p>
                <p className={`text-xs truncate ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                  {product.category}
                </p>
              </div>

              {/* Stats */}
              <div className="text-right whitespace-nowrap ml-4">
                <div className={`font-semibold flex items-center gap-1 justify-end ${darkMode ? 'text-[#E5A93A]' : 'text-[#8C6219]'}`}>
                  <TrendingUp className="w-4 h-4" />
                  {product.quantity} sold
                </div>
                <p className={`text-xs ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                  ${product.revenue.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`flex items-center justify-center h-32 ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>
          <p>No sales data available</p>
        </div>
      )}
    </div>
  );
};

export default BestSellers;
