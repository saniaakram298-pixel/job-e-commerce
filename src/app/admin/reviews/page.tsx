import { useEffect, useState } from 'react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/reviews').then((r) => r.json()).then((data) => setReviews(Array.isArray(data) ? data : []));
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 ml-64 p-8">
        <h1 className="font-serif text-3xl mb-6">Customer Reviews</h1>
        <div className="grid grid-cols-1 gap-4">
          {reviews.map((r) => (
            <div key={r._id} className="p-4 border rounded bg-white">
              <div className="flex justify-between items-center mb-2">
                <strong>{r.name}</strong>
                <span className="text-sm text-stone-500">{r.rating}/5</span>
              </div>
              <p className="text-sm text-neutral-700">{r.message}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
