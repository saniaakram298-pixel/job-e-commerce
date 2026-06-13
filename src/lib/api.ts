import { apiRequest } from './client';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export function createResponse<T>(
  success: boolean,
  message: string,
  data?: T,
  error?: string
): ApiResponse<T> {
  return {
    success,
    message,
    ...(data && { data }),
    ...(error && { error }),
  };
}

// API client for making requests
export const api = {
  get: async <T = any>(endpoint: string, options = {}) => {
    return apiRequest<T>(endpoint, { method: 'GET', ...options });
  },
  post: async <T = any>(endpoint: string, body?: any, options = {}) => {
    return apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body), ...options });
  },
  put: async <T = any>(endpoint: string, body?: any, options = {}) => {
    return apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options });
  },
  delete: async <T = any>(endpoint: string, options = {}) => {
    return apiRequest<T>(endpoint, { method: 'DELETE', ...options });
  },
};
