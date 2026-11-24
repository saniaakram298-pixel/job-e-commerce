"use client";
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';

interface DashboardAuthWrapperProps {
  children: ReactNode;
}

export default function DashboardAuthWrapper({ children }: DashboardAuthWrapperProps) {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, isInitialized, router]);

  if (!isInitialized || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Verifying Access...</h2>
          <p className="text-gray-500">Verifying your admin session.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
