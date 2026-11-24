'use client';

import { PropsWithChildren, useEffect } from 'react';
import { useAuthStore } from '@/hooks/useAuth';

export default function AuthSessionProvider({ children }: PropsWithChildren) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return children;
}
