"use client";
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import BackButton from '@/components/BackButton';
import { useAuthStore } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setLocalError("");

    try {
      await login(email, password);
      // The auth store will trigger redirect via useEffect
    } catch (err) {
      setLocalError(error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      {/* Back Button */}
      <div className="absolute top-8 left-8">
        <BackButton />
      </div>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="font-serif text-4xl tracking-tighter mb-2">THE ATELIER</h1>
          <p className="text-stone-400 text-sm uppercase tracking-[0.3em] mt-2">Sign in to your account</p>
        </div>

        {/* Error Message */}
        {(localError || error) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
            {localError || error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-600">
          <p className="font-semibold">Test Credentials:</p>
          <p>Email: admin@theatelier.com</p>
          <p>Password: admin123456</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="text-sm uppercase tracking-[0.3em] text-stone-500 mb-2 block">Email</label>
              <input
                type="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full border border-stone-200 rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-stone-900 transition"
              />
            </div>
            <div>
              <label className="text-sm uppercase tracking-[0.3em] text-stone-500 mb-2 block">Password</label>
              <input
                type="password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full border border-stone-200 rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-stone-900 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-4 text-sm font-bold uppercase tracking-[0.3em] hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-stone-500">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="font-semibold underline underline-offset-4 hover:text-stone-900">
            Create one
          </a>
        </div>
      </div>
    </div>
  );
}