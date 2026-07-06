'use client';

import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle');

  const submit = async (e: any) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (res.ok && json.ok) setStatus('ok'); else setStatus('error');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="mt-6">
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 items-center">
        <input
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="px-4 py-3 rounded bg-white text-black w-full"
        />
        <button type="submit" className="px-6 py-3 bg-stone-900 text-white rounded">
          {status === 'loading' ? 'Saving...' : 'Subscribe'}
        </button>
      </form>
      {status === 'ok' && <p className="text-sm text-green-400 mt-2">Subscribed — thank you!</p>}
      {status === 'error' && <p className="text-sm text-red-400 mt-2">Unable to subscribe.</p>}
    </div>
  );
}
