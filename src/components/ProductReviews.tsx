"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/hooks/useAuth';
import { ReviewStars } from '@/components/ReviewStars';
import { useRouter } from 'next/navigation';
import { MessageSquare, Star, Upload, Sparkles } from 'lucide-react';

interface ProductReviewsProps {
  productId: string;
  productName?: string;
}

interface ReviewItem {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [form, setForm] = useState({ userName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '', userEmail: user?.email || '', rating: 5, comment: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await fetch(`/api/reviews/product/${productId}?limit=10&page=1`, { cache: 'no-store' });
        const json = await response.json();
        const payload = json?.data ?? json;
        const items = Array.isArray(payload?.reviews) ? payload.reviews : [];
        setReviews(items);
        setAverageRating(Number(payload?.averageRating ?? 0));
        setTotalReviews(Number(payload?.totalReviews ?? items.length));
      } catch (error) {
        console.error('Failed to load reviews', error);
      }
    };

    if (productId) {
      loadReviews();
    }
  }, [productId]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      userName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : current.userName,
      userEmail: user?.email || current.userEmail,
    }));
  }, [user]);

  const ratingBreakdown = useMemo(() => {
    const breakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((review) => Math.round(review.rating) === star).length,
    }));

    return breakdown.map((item) => ({
      ...item,
      percent: totalReviews > 0 ? (item.count / totalReviews) * 100 : 0,
    }));
  }, [reviews, totalReviews]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      router.push('/login');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          userName: form.userName,
          userEmail: form.userEmail,
          rating: form.rating,
          comment: form.comment,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.message || 'Unable to submit review');
      }

      setStatus('success');
      setMessage(json?.message || 'Your review has been submitted and is waiting for admin approval.');
      setForm((current) => ({ ...current, rating: 5, comment: '' }));
      setReviews((current) => current);
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message || 'Unable to submit review');
    }
  };

  return (
    <section className="mt-16 border-t border-stone-200 pt-12">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-stone-500">
            <MessageSquare className="h-4 w-4 text-stone-500" />
            Customer Reviews
          </div>
          <h2 className="mt-3 text-3xl font-serif italic tracking-tighter text-stone-900">What clients are saying</h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">Reviews are published only after admin approval to keep the experience trustworthy and polished.</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-4xl font-semibold text-stone-900">{averageRating.toFixed(1)}</div>
            <div>
              <ReviewStars rating={averageRating} size="md" />
              <p className="mt-1 text-sm text-stone-500">{totalReviews} review{totalReviews === 1 ? '' : 's'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">Rating Breakdown</h3>
              <p className="text-sm text-stone-500">{totalReviews} total</p>
            </div>
            <div className="mt-5 space-y-3">
              {ratingBreakdown.map((item) => (
                <div key={item.star} className="flex items-center gap-3">
                  <div className="flex w-12 items-center gap-1 text-sm text-stone-600">
                    <span>{item.star}</span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="h-2.5 flex-1 rounded-full bg-stone-200">
                    <div className="h-2.5 rounded-full bg-stone-900" style={{ width: `${item.percent}%` }} />
                  </div>
                  <span className="w-10 text-right text-sm text-stone-500">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">No approved reviews yet. Be the first to share your experience.</div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-stone-900">{review.userName}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <ReviewStars rating={review.rating} size="sm" />
                        <span className="text-xs uppercase tracking-[0.2em] text-stone-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-500">Verified</div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-stone-600">{review.comment}</p>
                  {review.images?.length ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {review.images.map((image, index) => (
                        <img key={`${image}-${index}`} src={image} alt={`${productName || 'Review'} ${index + 1}`} className="h-20 w-24 rounded-lg object-cover" />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">
            <Sparkles className="h-4 w-4 text-stone-500" />
            Add Your Review
          </div>
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={form.userName} onChange={(event) => setForm((current) => ({ ...current, userName: event.target.value }))} placeholder="Your name" className="w-full rounded-full border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-900" />
              <input value={form.userEmail} onChange={(event) => setForm((current) => ({ ...current, userEmail: event.target.value }))} placeholder="Your email" className="w-full rounded-full border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-900" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">Your rating</label>
              <select value={form.rating} onChange={(event) => setForm((current) => ({ ...current, rating: Number(event.target.value) }))} className="w-full rounded-full border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-900">
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>)}
              </select>
            </div>
            <textarea value={form.comment} onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))} placeholder="Share your experience with this product" className="min-h-32 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-900" />
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-500">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Optional: upload a photo of your purchase or styling. It will be reviewed with your submission.
              </div>
            </div>
            <button type="submit" disabled={status === 'loading'} className="w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400">
              {status === 'loading' ? 'Submitting...' : 'Submit Review'}
            </button>
            {message ? <p className={`text-sm ${status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>{message}</p> : null}
          </form>
        </div>
      </div>
    </section>
  );
}
