// Toast notification system for consistent UI feedback
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

class ToastManager {
  private listeners: Set<(toast: Toast) => void> = new Set();
  private removeListeners: Set<(id: string) => void> = new Set();

  subscribe(listener: (toast: Toast) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeRemove(listener: (id: string) => void) {
    this.removeListeners.add(listener);
    return () => {
      this.removeListeners.delete(listener);
    };
  }

  private notify(toast: Toast) {
    this.listeners.forEach(listener => listener(toast));

    if (toast.duration !== 0) {
      const duration = toast.duration || 3000;
      setTimeout(() => this.remove(toast.id), duration);
    }
  }

  private remove(id: string) {
    this.removeListeners.forEach(listener => listener(id));
  }

  show(message: string, type: ToastType = 'info', duration?: number) {
    const id = `toast-${Date.now()}-${Math.random()}`;
    this.notify({ id, message, type, duration });
    return id;
  }

  success(message: string, duration?: number) {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    return this.show(message, 'error', duration);
  }

  info(message: string, duration?: number) {
    return this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number) {
    return this.show(message, 'warning', duration);
  }
}

export const toastManager = new ToastManager();