'use client';

import { useCallback, useEffect, useState } from 'react';
import { ToastContainer, type ToastProps } from './Toast';

type ToastEventDetail = {
  message?: string;
  type?: ToastProps['type'];
  duration?: number;
};

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (message: string, type: ToastProps['type'], duration?: number) => {
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  useEffect(() => {
    try {
      localStorage.setItem('__sws_storage_probe__', '1');
      localStorage.removeItem('__sws_storage_probe__');
    } catch {
      pushToast('Local storage unavailable', 'error');
    }

    const handleToastRequest = (event: Event) => {
      const toastEvent = event as CustomEvent<ToastEventDetail>;
      const message = toastEvent.detail?.message;
      const type = toastEvent.detail?.type;

      if (!message || !type) {
        return;
      }

      pushToast(message, type, toastEvent.detail?.duration);
    };

    window.addEventListener('sws:toast', handleToastRequest);
    return () => window.removeEventListener('sws:toast', handleToastRequest);
  }, [pushToast]);

  return <ToastContainer toasts={toasts} onDismiss={dismissToast} />;
}
