'use client'

import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

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
          <p>{this.state.error?.message ?? 'An unexpected error occurred.'}</p>
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
      )
    }

    return this.props.children
  }
}

