'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/client';
import { Star, MessageSquare } from 'lucide-react';

interface Review {
  _id: string;
  name: string;
  email?: string;
  rating: number;
  message: string;
  createdAt: string;
  productId?: string;
}

interface ReviewsOverviewProps {
  darkMode?: boolean;
}

const ReviewsOverview: React.FC<ReviewsOverviewProps> = ({ darkMode = false }) => {
  const { data: reviews = [], isLoading } = useQuery<Review[], Error>({
    queryKey: ['admin-reviews-overview'],
    queryFn: async () => {
      const res = await api.get('/admin/reviews-weekly', true);
      return res?.data ?? res ?? [];
    },
    staleTime: 1000 * 60 * 10,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-300 text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`p-6 rounded-2xl border transition-all ${darkMode ? 'bg-[#0F0F0F] border-neutral-900' : 'bg-white border-neutral-200 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <MessageSquare className="w-5 h-5 text-[#E5A93A]" />
            Recent Reviews
          </h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
            Weekly customer feedback
          </p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${darkMode ? 'text-[#E5A93A]' : 'text-[#8C6219]'}`}>
            {averageRating}
          </div>
          <p className={`text-xs mt-1 ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
            Avg Rating
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`h-20 rounded-lg animate-pulse ${darkMode ? 'bg-neutral-900' : 'bg-gray-100'}`}
            />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {reviews.slice(0, 5).map((review) => (
            <div
              key={review._id}
              className={`p-3 rounded-lg border transition ${darkMode ? 'border-neutral-800 bg-black/20 hover:border-[#E5A93A]/50' : 'border-neutral-200 bg-neutral-50 hover:border-[#E5A93A]'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {review.name}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {renderStars(review.rating)}
              </div>
              <p className={`text-sm line-clamp-2 ${darkMode ? 'text-neutral-400' : 'text-gray-700'}`}>
                {review.message}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className={`flex items-center justify-center h-32 ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>
          <p>No reviews yet</p>
        </div>
      )}
    </div>
  );
};

export default ReviewsOverview;
