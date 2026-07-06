import { useCallback } from 'react';
import { toastManager, ToastType } from '@/lib/toast';

export function useToast() {
  const show = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    return toastManager.show(message, type, duration);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    return toastManager.success(message, duration);
  }, []);

  const error = useCallback((message: string, duration?: number) => {
    return toastManager.error(message, duration);
  }, []);

  const info = useCallback((message: string, duration?: number) => {
    return toastManager.info(message, duration);
  }, []);

  const warning = useCallback((message: string, duration?: number) => {
    return toastManager.warning(message, duration);
  }, []);

  return { show, success, error, info, warning };
}
