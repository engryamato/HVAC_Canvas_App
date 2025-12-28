# ErrorBoundary

## Overview

The ErrorBoundary component catches JavaScript errors in child components, logs them, and displays a fallback UI instead of crashing the entire application. It includes a specialized `CanvasErrorBoundary` wrapper for canvas-specific error handling.

## Location

```
src/components/ErrorBoundary.tsx
```

## Purpose

- Catch and contain rendering errors in child components
- Display user-friendly error messages
- Provide recovery options (retry, reload)
- Log errors for debugging
- Prevent full application crashes

## Dependencies

- React `Component` class (for error boundary lifecycle)
- React `ErrorInfo` for error details

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | Yes | Child components to wrap |
| `fallback` | `ReactNode` | No | Custom fallback UI |
| `onError` | `(error: Error, info: ErrorInfo) => void` | No | Error callback |
| `onReset` | `() => void` | No | Called when user clicks retry |

## State

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}
```

## Lifecycle Methods

### getDerivedStateFromError

```typescript
static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
  return { hasError: true, error };
}
```

### componentDidCatch

```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  // Log error details
  console.error('ErrorBoundary caught an error:', error, errorInfo);

  // Update state with error info
  this.setState({ errorInfo });

  // Call optional error callback
  this.props.onError?.(error, errorInfo);
}
```

## Default Fallback UI

```
┌─────────────────────────────────────────┐
│                                         │
│            ⚠️ Something went wrong      │
│                                         │
│   An error occurred while rendering     │
│   this component.                       │
│                                         │
│   ┌───────────┐  ┌─────────────────┐   │
│   │   Retry   │  │  Reload Page    │   │
│   └───────────┘  └─────────────────┘   │
│                                         │
│   ▶ Show error details                  │
│                                         │
└─────────────────────────────────────────┘
```

## Component Implementation

```tsx
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-fallback">
          <h2>Something went wrong</h2>
          <p>An error occurred while rendering this component.</p>
          <div className="error-actions">
            <button onClick={this.handleReset}>Retry</button>
            <button onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.toString()}</pre>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## CanvasErrorBoundary

Specialized wrapper for canvas-specific errors:

```tsx
export function CanvasErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="canvas-error">
          <h2>Canvas Error</h2>
          <p>The canvas encountered an error. Your work has been auto-saved.</p>
          <button onClick={() => window.location.reload()}>
            Reload Canvas
          </button>
        </div>
      }
      onError={(error) => {
        // Attempt to save current state before crash
        console.error('Canvas error:', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Usage Examples

### Basic Usage

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MainContent />
    </ErrorBoundary>
  );
}
```

### With Custom Fallback

```tsx
<ErrorBoundary
  fallback={<div>Oops! Something broke. Please refresh.</div>}
>
  <RiskyComponent />
</ErrorBoundary>
```

### With Error Callback

```tsx
<ErrorBoundary
  onError={(error, info) => {
    // Send to error tracking service
    errorTracker.captureException(error, { extra: info });
  }}
>
  <Dashboard />
</ErrorBoundary>
```

### Canvas Page Usage

```tsx
import { CanvasErrorBoundary } from '@/components/ErrorBoundary';

function CanvasPage() {
  return (
    <CanvasErrorBoundary>
      <CanvasContainer />
    </CanvasErrorBoundary>
  );
}
```

## Styling

```css
.error-boundary-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin: 20px;
}

.error-boundary-fallback h2 {
  color: #dc2626;
  margin-bottom: 8px;
}

.error-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.error-actions button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

details {
  margin-top: 16px;
  text-align: left;
  max-width: 600px;
}

details pre {
  background: #f5f5f5;
  padding: 12px;
  overflow-x: auto;
  font-size: 12px;
}
```

## Error Types Caught

| Error Type | Example | Handled |
|------------|---------|---------|
| Render errors | `undefined.map()` | ✅ Yes |
| Lifecycle errors | Error in `useEffect` | ✅ Yes |
| Event handler errors | `onClick` throws | ❌ No* |
| Async errors | Promise rejection | ❌ No* |
| Server errors | API failures | ❌ No* |

*These require try-catch or other error handling

## Related Elements

- [CanvasContainer](../canvas/CanvasContainer.md) - Uses CanvasErrorBoundary
- [Toast](./Toast.md) - For non-fatal error notifications
- [LoadingIndicator](./LoadingIndicator.md) - Loading states

## Testing

```typescript
describe('ErrorBoundary', () => {
  const ThrowingComponent = () => {
    throw new Error('Test error');
  };

  it('catches errors and displays fallback', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('displays custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Custom error</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('calls onError callback', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('resets error state on retry', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    const ConditionalThrow = () => {
      if (shouldThrow) throw new Error('Test');
      return <div>Success</div>;
    };

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    shouldThrow = false;
    fireEvent.click(screen.getByText('Retry'));

    expect(screen.getByText('Success')).toBeInTheDocument();
    spy.mockRestore();
  });
});
```
