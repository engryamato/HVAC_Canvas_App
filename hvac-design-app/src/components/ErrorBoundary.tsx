'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Show error details (for development) */
  showDetails?: boolean;
  /** Error callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Recovery callback */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
    textAlign: 'center' as const,
    minHeight: '300px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    margin: '1rem',
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 0.5rem 0',
  },
  message: {
    fontSize: '1rem',
    color: '#666',
    margin: '0 0 1.5rem 0',
    maxWidth: '400px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'white',
    backgroundColor: '#1976d2',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  secondaryButton: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#333',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  details: {
    marginTop: '1.5rem',
    textAlign: 'left' as const,
    width: '100%',
    maxWidth: '600px',
  },
  detailsSummary: {
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#666',
    marginBottom: '0.5rem',
  },
  errorStack: {
    padding: '1rem',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    overflow: 'auto',
    maxHeight: '200px',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;

      return (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            background: '#fff3cd',
            color: '#7c4700',
            borderRadius: '12px',
            margin: '1rem',
          }}
        >
          <h1>Something went wrong</h1>
          <p>{error?.message ?? 'An unexpected error occurred.'}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#1976d2', color: '#fff' }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component for common error boundaries
 */
export function CanvasErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div style={{ ...styles.container, backgroundColor: '#fafafa' }}>
          <div style={styles.icon}>🎨</div>
          <h1 style={styles.title}>Canvas Error</h1>
          <p style={styles.message}>
            The canvas encountered an error. Your work has been auto-saved.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={styles.primaryButton}
          >
            Reload Canvas
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
