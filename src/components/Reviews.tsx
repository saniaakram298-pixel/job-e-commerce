'use client';

import { useEffect, useState } from 'react';

interface ReviewForm {
  name: string;
  message: string;
  rating: number;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [form, setForm] = useState<ReviewForm>({ name: '', message: '', rating: 5 });
  const [status, setStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle');

  useEffect(() => {
    fetch('/api/reviews').then((r) => r.json()).then((data) => setReviews(Array.isArray(data) ? data : []));
  }, []);

  const submit = async (e: any) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/reviews', { method: 'POST', body: JSON.stringify(form), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus('ok');
        setForm({ name: '', message: '', rating: 5 });
      } else setStatus('error');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <section className="bg-white text-black py-12">
      <div className="max-w-[1100px] mx-auto px-6">
        <h3 className="text-2xl font-serif mb-4">Customer Reviews</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {reviews.length === 0 && <p className="text-sm text-neutral-500">No reviews yet — be the first!</p>}
            {reviews.map((r) => (
              <div key={r._id} className="p-4 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <strong>{r.name}</strong>
                  <span className="text-sm text-stone-500">{r.rating}/5</span>
                </div>
                <p className="text-sm text-neutral-600">{r.message}</p>
              </div>
            ))}
          </div>

          <div>
            <form onSubmit={submit} className="space-y-4">
              <input value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} placeholder="Your name" className="w-full px-4 py-3 border rounded" />
              <select value={String(form.rating)} onChange={(e)=>setForm({...form, rating: Number(e.target.value)})} className="w-full px-4 py-3 border rounded">
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Okay</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Terrible</option>
              </select>
              <textarea value={form.message} onChange={(e)=>setForm({...form, message: e.target.value})} placeholder="Your review" className="w-full px-4 py-3 border rounded h-28" />
              <div className="flex items-center gap-4">
                <button type="submit" className="px-6 py-3 bg-black text-white rounded">{status==='loading'?'Sending...':'Submit Review'}</button>
                {status==='ok' && <span className="text-green-500">Thanks! Your review will appear after approval.</span>}
                {status==='error' && <span className="text-red-500">Unable to submit review.</span>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
