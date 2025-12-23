'use client';

import React from 'react';
import styles from './LoadingIndicator.module.css';

interface LoadingIndicatorProps {
  /** Size of the spinner */
  size?: 'small' | 'medium' | 'large';
  /** Loading message to display */
  message?: string;
  /** Whether to show as an overlay */
  overlay?: boolean;
  /** Whether to show as inline */
  inline?: boolean;
  /** Additional className */
  className?: string;
}

export function LoadingIndicator({
  size = 'medium',
  message,
  overlay = false,
  inline = false,
  className = '',
}: LoadingIndicatorProps) {
  const spinner = (
    <div className={`${styles.spinner} ${styles[size]}`}>
      <div className={styles.circle} />
      <div className={styles.circle} />
      <div className={styles.circle} />
    </div>
  );

  if (inline) {
    return (
      <span className={`${styles.inline} ${className}`}>
        {spinner}
        {message && <span className={styles.inlineMessage}>{message}</span>}
      </span>
    );
  }

  if (overlay) {
    return (
      <div className={`${styles.overlay} ${className}`}>
        <div className={styles.content}>
          {spinner}
          {message && <p className={styles.message}>{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {spinner}
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}

/**
 * Full-page loading indicator
 */
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className={styles.pageLoader}>
      <LoadingIndicator size="large" message={message} />
    </div>
  );
}

/**
 * Button loading state
 */
export function ButtonLoader({ className = '' }: { className?: string }) {
  return <LoadingIndicator size="small" inline className={className} />;
}

export default LoadingIndicator;
