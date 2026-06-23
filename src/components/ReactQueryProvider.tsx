"use client";

import { PropsWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Intelligent retry logic:
 * - Retry transient errors (5xx, network timeouts)
 * - Skip permanent errors (4xx)
 * - Use exponential backoff
 */
function shouldRetry(failureCount: number, error: any): boolean {
  // Don't retry on client errors
  if (error?.status >= 400 && error?.status < 500) {
    return false;
  }

  // Retry transient server errors (5xx) and network errors
  if (error?.status >= 500 || error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
    return failureCount < 3;
  }

  // Retry generic network errors up to 2 times
  if (failureCount < 2) {
    return true;
  }

  return false;
}

export default function ReactQueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Intelligent retry strategy with exponential backoff
            retry: (failureCount, error) => shouldRetry(failureCount, error),
            retryDelay: (attemptIndex) => {
              // Exponential backoff: 1s, 2s, 4s, 8s
              return Math.min(1000 * Math.pow(2, attemptIndex), 10000);
            },
            // Mark data as stale after 2 minutes of inactivity
            staleTime: 1000 * 60 * 2,
            // Don't refetch when window regains focus
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Retry mutations on transient failures
            retry: (failureCount, error) => shouldRetry(failureCount, error),
            retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
