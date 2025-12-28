# Toast

## Overview

The Toast component provides non-blocking notification messages that appear temporarily and auto-dismiss. It supports multiple types (success, error, warning, info) and includes a ToastContainer for managing multiple simultaneous notifications.

## Location

```
src/components/ui/Toast.tsx
```

## Purpose

- Display temporary notification messages
- Provide visual feedback for user actions
- Support multiple notification types
- Auto-dismiss after configurable duration
- Allow manual dismissal
- Queue and stack multiple toasts

## Dependencies

- React state for toast management
- CSS animations for enter/exit
- `createPortal` for rendering outside component tree

## Toast Types

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| `success` | Green | ✓ | Action completed successfully |
| `error` | Red | ✕ | Action failed, error occurred |
| `warning` | Yellow/Orange | ⚠ | Caution, potential issue |
| `info` | Blue | ℹ | General information |

## Visual Layout

```
                                    ┌─────────────────────────────────┐
                                    │ ✓  Project saved successfully   │ ✕
                                    └─────────────────────────────────┘
                                    ┌─────────────────────────────────┐
                                    │ ⚠  Unsaved changes              │ ✕
                                    └─────────────────────────────────┘
                                    ┌─────────────────────────────────┐
                                    │ ✕  Export failed: Network error │ ✕
                                    └─────────────────────────────────┘

Position: Bottom-right corner
Stacking: Newest on bottom
```

## Props

### Toast Component

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `id` | `string` | Yes | - | Unique toast identifier |
| `type` | `'success' \| 'error' \| 'warning' \| 'info'` | No | `'info'` | Toast style |
| `message` | `string` | Yes | - | Notification message |
| `duration` | `number` | No | `5000` | Auto-dismiss time (ms) |
| `dismissible` | `boolean` | No | `true` | Show close button |
| `onDismiss` | `(id: string) => void` | Yes | - | Dismiss callback |

### ToastContainer

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `position` | `'top-right' \| 'bottom-right' \| 'top-left' \| 'bottom-left'` | No | `'bottom-right'` | Toast position |
| `maxToasts` | `number` | No | `5` | Maximum visible toasts |

## useToast Hook

```typescript
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UseToastReturn {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Convenience methods
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
}
```

## Component Implementation

```tsx
// Toast Component
function Toast({
  id,
  type = 'info',
  message,
  duration = 5000,
  dismissible = true,
  onDismiss,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300); // Wait for exit animation
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={cn('toast', `toast-${type}`, { exiting: isExiting })}
      role="alert"
      aria-live="polite"
    >
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      {dismissible && (
        <button
          className="toast-close"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// Toast Container
function ToastContainer({
  position = 'bottom-right',
  maxToasts = 5,
}: ToastContainerProps) {
  const { toasts, removeToast } = useToast();

  const visibleToasts = toasts.slice(-maxToasts);

  return createPortal(
    <div className={cn('toast-container', `toast-${position}`)}>
      {visibleToasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={removeToast}
        />
      ))}
    </div>,
    document.body
  );
}

// useToast Hook
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = nanoid();
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    return addToast({ type: 'success', message, duration });
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    return addToast({ type: 'error', message, duration });
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    return addToast({ type: 'warning', message, duration });
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    return addToast({ type: 'info', message, duration });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };
}
```

## Styling

```css
/* Container positioning */
.toast-container {
  position: fixed;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  pointer-events: none;
}

.toast-bottom-right {
  bottom: 0;
  right: 0;
}

.toast-top-right {
  top: 0;
  right: 0;
}

.toast-bottom-left {
  bottom: 0;
  left: 0;
}

.toast-top-left {
  top: 0;
  left: 0;
}

/* Toast styles */
.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  animation: slideIn 0.3s ease-out;
  max-width: 400px;
}

.toast.exiting {
  animation: slideOut 0.3s ease-in forwards;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Type variants */
.toast-success {
  background: #e8f5e9;
  border-left: 4px solid #4caf50;
  color: #2e7d32;
}

.toast-error {
  background: #ffebee;
  border-left: 4px solid #f44336;
  color: #c62828;
}

.toast-warning {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  color: #e65100;
}

.toast-info {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  color: #1565c0;
}

.toast-icon {
  font-size: 18px;
}

.toast-message {
  flex: 1;
  font-size: 14px;
}

.toast-close {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  opacity: 0.6;
  padding: 4px;
}

.toast-close:hover {
  opacity: 1;
}
```

## Usage Examples

### Basic Usage

```tsx
import { useToast, ToastContainer } from '@/components/ui/Toast';

function App() {
  return (
    <>
      <MainContent />
      <ToastContainer />
    </>
  );
}

function SaveButton() {
  const { success, error } = useToast();

  const handleSave = async () => {
    try {
      await saveProject();
      success('Project saved successfully!');
    } catch (err) {
      error('Failed to save project. Please try again.');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Different Types

```tsx
const { success, error, warning, info } = useToast();

// Success
success('Changes saved');

// Error
error('Connection failed');

// Warning
warning('You have unsaved changes');

// Info
info('New version available');
```

### Custom Duration

```tsx
// Stay for 10 seconds
success('Export complete! Check your downloads folder.', 10000);

// Never auto-dismiss (duration = 0)
error('Critical error occurred. Please refresh the page.', 0);
```

### Programmatic Dismissal

```tsx
const { addToast, removeToast } = useToast();

const toastId = addToast({
  type: 'info',
  message: 'Processing...',
  duration: 0, // Don't auto-dismiss
});

// Later, dismiss it manually
removeToast(toastId);
```

## Accessibility

| Feature | Implementation |
|---------|----------------|
| ARIA | `role="alert"`, `aria-live="polite"` |
| Keyboard | Close button accessible |
| Screen Reader | Announces toast content |
| Focus | Does not steal focus |

## Related Elements

- [ErrorBoundary](./ErrorBoundary.md) - Error handling
- [LoadingIndicator](./LoadingIndicator.md) - Loading states
- [ConfirmDialog](../dashboard/ConfirmDialog.md) - Blocking confirmations

## Testing

```typescript
describe('Toast', () => {
  it('renders message', () => {
    render(
      <Toast id="1" message="Test message" onDismiss={vi.fn()} />
    );
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('displays correct icon for type', () => {
    render(
      <Toast id="1" type="success" message="Success" onDismiss={vi.fn()} />
    );
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('calls onDismiss when close clicked', () => {
    const onDismiss = vi.fn();
    render(<Toast id="1" message="Test" onDismiss={onDismiss} />);

    fireEvent.click(screen.getByLabelText('Dismiss notification'));

    // Wait for animation
    waitFor(() => expect(onDismiss).toHaveBeenCalledWith('1'));
  });

  it('auto-dismisses after duration', async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(<Toast id="1" message="Test" duration={3000} onDismiss={onDismiss} />);

    vi.advanceTimersByTime(3300); // duration + animation

    expect(onDismiss).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('useToast', () => {
  it('adds toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success('Test');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test');
  });

  it('removes toast', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      toastId = result.current.success('Test');
    });

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});
```
