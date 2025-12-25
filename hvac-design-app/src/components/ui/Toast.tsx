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

export function Toast({ id, message, type = 'info', duration = 5000, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss?.(id), duration);
    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[type]}`} role="status" onClick={() => onDismiss?.(id)}>
      <span>{message}</span>
      <button className={styles.close}>×</button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: ToastProps[];
  onDismiss?: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
