'use client';

import { useState } from 'react';

interface NewsletterProps {
  title?: string;
  description?: string;
  placeholder?: string;
}

export default function Newsletter({
  title = "Stay Connected",
  description = "Subscribe to our newsletter for exclusive previews, insider events, and curated collections delivered to your inbox.",
  placeholder = "Enter your email address"
}: NewsletterProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success || data.alreadySubscribed) {
        setStatus('success');
        setMessage(data.alreadySubscribed
          ? 'You\'re already subscribed!'
          : 'Thank you for subscribing!');
        setEmail('');
        setTimeout(() => setStatus('idle'), 4000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <section className="relative bg-black text-white py-20 px-6 lg:px-12 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Title */}
        <h2 className="font-serif text-5xl lg:text-6xl font-light mb-6">
          {title}
        </h2>

        {/* Description */}
        <p className="font-sans text-lg text-white/80 mb-12 leading-relaxed">
          {description}
        </p>

        {/* Newsletter Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              required
              disabled={status === 'loading' || status === 'success'}
              className="w-full pl-6 pr-32 py-4 bg-white/10 text-white placeholder-white/50 font-sans text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="absolute right-2 px-8 py-2 bg-white text-black font-sans text-sm uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {status === 'loading' ? 'Loading...' : 'Subscribe'}
            </button>
          </div>

          {/* Status Messages */}
          <div className="mt-6 min-h-8 flex items-center justify-center">
            {status === 'success' && (
              <div className="text-green-400 font-sans text-sm">
                ✓ {message}
              </div>
            )}
            {status === 'error' && (
              <div className="text-red-400 font-sans text-sm">
                ⚠ {message}
              </div>
            )}
          </div>
        </form>

        {/* Footer text */}
        <p className="font-sans text-xs text-white/60 mt-8 tracking-wider">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}
