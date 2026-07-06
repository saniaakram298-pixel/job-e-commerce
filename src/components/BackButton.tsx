"use client";
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.replace('/')}
      className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-semibold uppercase tracking-widest text-stone-600 hover:text-stone-900 transition-colors duration-300 group"
    >
      <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
      Back to Home
    </button>
  );
}
