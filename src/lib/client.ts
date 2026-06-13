/**
 * Client-side API utilities for making authenticated requests
 */

import { useAuthStore } from '@/hooks/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;

  let headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth token if needed
  if (requiresAuth) {
    const { token } = useAuthStore.getState();
    if (token) {
      headers = {
        ...headers,
        Authorization: `Bearer ${token}`,
      };
    } else {
      throw new Error('Authentication required');
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, requiresAuth?: boolean) =>
    apiRequest<T>(endpoint, { method: 'GET', requiresAuth }),

  post: <T = any>(endpoint: string, body?: any, requiresAuth?: boolean) =>
    apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body), requiresAuth }),

  put: <T = any>(endpoint: string, body?: any, requiresAuth?: boolean) =>
    apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), requiresAuth }),

  delete: <T = any>(endpoint: string, requiresAuth?: boolean) =>
    apiRequest<T>(endpoint, { method: 'DELETE', requiresAuth }),

  patch: <T = any>(endpoint: string, body?: any, requiresAuth?: boolean) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), requiresAuth }),
};
