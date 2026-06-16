"use client";
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';

interface DashboardAuthWrapperProps {
  children: ReactNode;
}

export default function DashboardAuthWrapper({ children }: DashboardAuthWrapperProps) {
  const router = useRouter();
  const { user, token } = useAuthStore();

  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!user || !token) {
      console.log('[DashboardAuthWrapper] No user or token found, redirecting to login');
      router.replace('/login');
    }
  }, [user, token, router]);

  // Show loading or placeholder while checking auth
  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Verifying Access...</h2>
          <p className="text-gray-500">Redirecting to login if not authenticated.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
