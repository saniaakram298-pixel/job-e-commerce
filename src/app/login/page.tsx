"use client";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    // Abhi ke liye hum simple check laga rahe hain bina DB ke
    if (email === "admin@atelier.com" && password === "admin123") {
      alert("Login Successful! Redirecting to Dashboard...");
      router.push('/admin/dashboard'); // Yeh line redirect karegi
    } else {
      alert("Invalid Credentials! Try: admin@atelier.com / admin123");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="font-serif text-4xl tracking-tighter italic">Welcome Back</h2>
          <p className="text-stone-400 text-[10px] uppercase tracking-[0.3em] mt-2">Sign in to your account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <input
              type="email"
              required
              className="w-full border-b border-stone-200 py-3 outline-none focus:border-black transition-colors uppercase text-[10px] tracking-widest"
              placeholder="Email Address"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              className="w-full border-b border-stone-200 py-3 outline-none focus:border-black transition-colors uppercase text-[10px] tracking-widest"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-4 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-stone-800 transition-all"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}