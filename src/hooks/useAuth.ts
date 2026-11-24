import { create } from 'zustand';
import { User } from '@/types/auth';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  refreshSession: () => Promise<User | null>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

interface AuthApiResponse {
  success: boolean;
  message?: string;
  data?: { user?: User };
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized || get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem('auth-store');
        } catch (storageError) {
          console.warn('Unable to remove a legacy browser auth store:', storageError);
        }
      }

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (response.status === 401) {
        set({ user: null });
        return;
      }

      const data = (await response.json()) as AuthApiResponse;
      if (!response.ok || !data.data?.user) {
        throw new Error(data.message || 'Unable to verify your session');
      }
      set({ user: data.data.user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to verify your session';
      set({ user: null, error: message });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  refreshSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (response.status === 401) {
        set({ user: null, isInitialized: true });
        return null;
      }

      const data = (await response.json()) as AuthApiResponse;
      if (!response.ok || !data.data?.user) {
        throw new Error(data.message || 'Unable to verify your session');
      }
      set({ user: data.data.user, isInitialized: true });
      return data.data.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to verify your session';
      set({ user: null, error: message });
      throw error;
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as AuthApiResponse;
      if (!response.ok || !data.data?.user) {
        throw new Error(data.message || 'Login failed');
      }
      set({ user: data.data.user, isInitialized: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (email, password, firstName, lastName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      const data = (await response.json()) as AuthApiResponse;
      if (!response.ok || !data.data?.user) {
        throw new Error(data.message || 'Signup failed');
      }
      set({ user: data.data.user, isInitialized: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!response.ok) {
        const data = (await response.json()) as AuthApiResponse;
        throw new Error(data.message || 'Unable to end your session');
      }
      set({ user: null, isInitialized: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to end your session';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
