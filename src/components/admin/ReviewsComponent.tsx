'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/client';
import { Star, MessageSquare, AlertCircle, Check } from 'lucide-react';

interface Review {
  _id: string;
  name: string;
  email?: string;
  rating: number;
  message: string;
  createdAt: string;
  approved?: boolean;
  productId?: string;
}

interface ReviewsComponentProps {
  darkMode?: boolean;
}

const ReviewsComponent: React.FC<ReviewsComponentProps> = ({ darkMode = false }) => {
  const [filterApproved, setFilterApproved] = useState<'all' | 'approved' | 'pending'>('all');

  const { data: reviews = [], isLoading, refetch } = useQuery<Review[], Error>({
    queryKey: ['admin-all-reviews', filterApproved],
    queryFn: async () => {
      const res = await api.get('/admin/reviews', true);
      const allReviews = res?.data ?? res ?? [];
      
      if (filterApproved === 'approved') {
        return allReviews.filter((r: Review) => r.approved);
      } else if (filterApproved === 'pending') {
        return allReviews.filter((r: Review) => !r.approved);
      }
      return allReviews;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const totalReviews = reviews.length;
  const approvedCount = reviews.filter(r => r.approved).length;
  const pendingCount = reviews.filter(r => !r.approved).length;
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const handleApproveReview = async (reviewId: string) => {
    try {
      await api.post(`/admin/reviews/${reviewId}/approve`, {}, true);
      refetch();
    } catch (error) {
      console.error('Failed to approve review:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
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
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#0F0F0F] border-neutral-900' : 'bg-white border-neutral-200 shadow-sm'}`}>
      {/* Header Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <MessageSquare className="w-5 h-5 text-[#E5A93A]" />
            All Reviews
          </h3>
          <span className={`text-2xl font-bold ${darkMode ? 'text-[#E5A93A]' : 'text-[#8C6219]'}`}>
            {totalReviews}
          </span>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-black/20 border border-neutral-800' : 'bg-neutral-50 border border-neutral-200'}`}>
            <p className={`text-[10px] uppercase tracking-wider ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
              Average Rating
            </p>
            <p className={`text-xl font-bold mt-1 ${darkMode ? 'text-[#E5A93A]' : 'text-[#8C6219]'}`}>
              {averageRating}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-black/20 border border-neutral-800' : 'bg-neutral-50 border border-neutral-200'}`}>
            <p className={`text-[10px] uppercase tracking-wider ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
              Approved
            </p>
            <p className={`text-xl font-bold mt-1 text-green-600`}>
              {approvedCount}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-black/20 border border-neutral-800' : 'bg-neutral-50 border border-neutral-200'}`}>
            <p className={`text-[10px] uppercase tracking-wider ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
              Pending
            </p>
            <p className={`text-xl font-bold mt-1 text-orange-600`}>
              {pendingCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        {(['all', 'approved', 'pending'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setFilterApproved(filter)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition ${
              filterApproved === filter
                ? darkMode
                  ? 'bg-[#E5A93A]/20 text-[#E5A93A] border border-[#E5A93A]/30'
                  : 'bg-[#E5A93A]/10 text-[#8C6219] border border-[#E5A93A]/30'
                : darkMode
                ? 'text-neutral-500 border border-neutral-800 hover:text-[#E5A93A]'
                : 'text-gray-600 border border-neutral-200 hover:text-[#8C6219]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`h-24 rounded-lg animate-pulse ${darkMode ? 'bg-neutral-900' : 'bg-gray-100'}`}
            />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {reviews.map((review) => (
            <div
              key={review._id}
              className={`p-3 rounded-lg border transition ${darkMode ? 'border-neutral-800 bg-black/20 hover:border-[#E5A93A]/50' : 'border-neutral-200 bg-neutral-50 hover:border-[#E5A93A]'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {review.name}
                    </p>
                    {review.approved && (
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    )}
                    {!review.approved && (
                      <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className={`text-xs truncate ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                    {review.email || 'No email provided'}
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-neutral-500' : 'text-gray-600'}`}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="mb-2">
                {renderStars(review.rating)}
              </div>

              {/* Message */}
              <p className={`text-sm line-clamp-2 mb-2 ${darkMode ? 'text-neutral-400' : 'text-gray-700'}`}>
                {review.message}
              </p>

              {/* Action Button */}
              {!review.approved && (
                <button
                  type="button"
                  onClick={() => handleApproveReview(review._id)}
                  className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded transition ${
                    darkMode
                      ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Approve
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={`flex items-center justify-center h-32 ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>
          <p>No reviews found</p>
        </div>
      )}
    </div>
  );
};

export default ReviewsComponent;
