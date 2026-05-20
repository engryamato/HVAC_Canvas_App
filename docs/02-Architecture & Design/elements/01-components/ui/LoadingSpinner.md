# LoadingSpinner

## Overview

The LoadingSpinner is a simple, lightweight animated spinner component used to indicate loading states. It's a minimal alternative to LoadingIndicator for cases where only a basic spinner is needed.

## Location

```
src/components/ui/LoadingSpinner.tsx
```

## Purpose

- Display a simple animated loading indicator
- Provide accessible loading announcements
- Support optional label text
- Maintain minimal bundle size for simple use cases

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | No | `'md'` | Spinner size |
| `label` | `string` | No | - | Text label below spinner |
| `className` | `string` | No | - | Additional CSS classes |

## Visual Layout

```
Small (sm):     Medium (md):    Large (lg):
    ◜               ◜                ◜
   ◝ ◞             ◝ ◞              ◝ ◞
    ◟               ◟                ◟
  16x16           24x24            32x32

With Label:
    ◜
   ◝ ◞
    ◟
 Loading...
```

## Component Implementation

```tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  label,
  className,
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const pixelSize = sizeMap[size];

  return (
    <div
      className={cn('loading-spinner-container', className)}
      role="status"
      aria-live="polite"
    >
      <svg
        className="loading-spinner-svg"
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="spinner-track"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.25"
        />
        <path
          className="spinner-head"
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {label && <span className="spinner-label">{label}</span>}

      <span className="sr-only">
        {label || 'Loading...'}
      </span>
    </div>
  );
}
```

## Styling

```css
.loading-spinner-container {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #1976D2;
}

.loading-spinner-svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner-track {
  opacity: 0.25;
}

.spinner-head {
  opacity: 1;
}

.spinner-label {
  font-size: 14px;
  color: #666;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner-svg {
    animation: none;
    opacity: 0.7;
  }
}
```

## Usage Examples

### Basic Spinner

```tsx
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function DataLoader() {
  const { isLoading } = useData();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <DataContent />;
}
```

### With Label

```tsx
<LoadingSpinner label="Loading projects..." />
```

### Different Sizes

```tsx
// Small - for inline/button use
<LoadingSpinner size="sm" />

// Medium - default
<LoadingSpinner size="md" />

// Large - for page-level loading
<LoadingSpinner size="lg" label="Loading..." />
```

### In a Button

```tsx
function SaveButton({ saving, onSave }) {
  return (
    <button onClick={onSave} disabled={saving}>
      {saving ? (
        <>
          <LoadingSpinner size="sm" />
          <span>Saving...</span>
        </>
      ) : (
        'Save'
      )}
    </button>
  );
}
```

### Centered in Container

```tsx
<div className="flex items-center justify-center h-64">
  <LoadingSpinner size="lg" label="Loading canvas..." />
</div>
```

## Accessibility

| Feature | Implementation |
|---------|----------------|
| ARIA | `role="status"`, `aria-live="polite"` |
| Screen Reader | Hidden text announces loading state |
| Motion | Respects `prefers-reduced-motion` |

## Comparison with LoadingIndicator

| Feature | LoadingSpinner | LoadingIndicator |
|---------|----------------|------------------|
| Size | Minimal | More features |
| Overlay | No | Yes |
| Message | Label only | Full message |
| Variants | No | PageLoader, ButtonLoader |
| Use case | Simple loading | Complex loading states |

## Related Elements

- [LoadingIndicator](./LoadingIndicator.md) - Full-featured loading component
- [IconButton](./IconButton.md) - Uses spinner for loading state

## Testing

```typescript
describe('LoadingSpinner', () => {
  it('renders spinner', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<LoadingSpinner label="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('has accessible loading text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...', { selector: '.sr-only' })).toBeInTheDocument();
  });

  it('uses custom label for screen reader', () => {
    render(<LoadingSpinner label="Fetching data" />);
    expect(screen.getByText('Fetching data', { selector: '.sr-only' })).toBeInTheDocument();
  });

  it('applies size classes', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```
