'use client';

import { useEffect } from 'react';
import styles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: (id: string) => void;
}

export function Toast({ id, message, type = 'info', duration = 5000, onDismiss }: Readonly<ToastProps>) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss?.(id), duration);
    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDismiss?.(id);
    }
  };

  return (
    <output
      className={`${styles.toast} ${styles[type]}`}
      aria-live="polite"
      data-testid={`toast-${type}`}
      onClick={() => onDismiss?.(id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <span>{message}</span>
      <button className={styles.close} aria-label="Dismiss notification">×</button>
    </output>
  );
}

export interface ToastContainerProps {
  toasts: ToastProps[];
  onDismiss?: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: Readonly<ToastContainerProps>) {
  return (
    <div className={styles.container} data-testid="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
