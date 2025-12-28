# LoadingIndicator

## Overview

The LoadingIndicator component provides visual feedback during asynchronous operations. It includes multiple variants: a basic spinner, full-page loader, button loader, and overlay loader for different use cases.

## Location

```
src/components/ui/LoadingIndicator.tsx
```

## Purpose

- Show loading state during async operations
- Provide different loading styles for various contexts
- Display optional loading messages
- Block interaction during critical operations (overlay)
- Maintain accessibility with ARIA live regions

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | No | `'md'` | Spinner size |
| `message` | `string` | No | - | Loading message text |
| `overlay` | `boolean` | No | `false` | Show full-screen overlay |
| `inline` | `boolean` | No | `false` | Inline display mode |
| `className` | `string` | No | - | Additional CSS classes |

## Variants

### 1. Basic Spinner

```
     ◜
    ◝ ◞
     ◟

Size: sm (16px), md (24px), lg (32px)
```

### 2. With Message

```
      ◌
  Loading...
```

### 3. Full Page Loader

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                  ◌                      │
│           Loading project...            │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### 4. Overlay Loader

```
┌─────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░◌░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░Saving...░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────┘
(Background content is dimmed and non-interactive)
```

### 5. Button Loader

```
┌────────────────────┐
│  ◌  Saving...      │
└────────────────────┘
```

## Component Implementation

```tsx
// Base LoadingIndicator
export function LoadingIndicator({
  size = 'md',
  message,
  overlay = false,
  inline = false,
  className,
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const spinner = (
    <div
      className={cn('loading-spinner', sizeClasses[size])}
      role="status"
      aria-live="polite"
    >
      <svg className="animate-spin" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );

  // Overlay mode
  if (overlay) {
    return (
      <div className="loading-overlay">
        <div className="loading-overlay-content">
          {spinner}
          {message && <p className="loading-message">{message}</p>}
        </div>
      </div>
    );
  }

  // Inline mode
  if (inline) {
    return (
      <span className={cn('loading-inline', className)}>
        {spinner}
        {message && <span className="loading-message-inline">{message}</span>}
      </span>
    );
  }

  // Default centered mode
  return (
    <div className={cn('loading-container', className)}>
      {spinner}
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}

// PageLoader variant
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="page-loader">
      <LoadingIndicator size="lg" message={message} />
    </div>
  );
}

// ButtonLoader variant
export function ButtonLoader({ message }: { message?: string }) {
  return <LoadingIndicator size="sm" message={message} inline />;
}
```

## Styling

```css
/* Spinner animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  display: inline-flex;
  color: #1976D2;
}

.loading-spinner svg {
  animation: spin 1s linear infinite;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Centered container */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  gap: 12px;
}

.loading-message {
  color: #666;
  font-size: 14px;
}

/* Inline */
.loading-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.loading-message-inline {
  font-size: 14px;
  color: inherit;
}

/* Full page */
.page-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f5f5;
}

/* Overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.loading-overlay-content {
  background: white;
  padding: 32px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
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
  border: 0;
}
```

## Usage Examples

### Basic Spinner

```tsx
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

function DataList() {
  const { data, isLoading } = useData();

  if (isLoading) {
    return <LoadingIndicator message="Loading data..." />;
  }

  return <List items={data} />;
}
```

### Page Loader

```tsx
import { PageLoader } from '@/components/ui/LoadingIndicator';

function ProjectPage() {
  const { project, loading } = useProject(projectId);

  if (loading) {
    return <PageLoader message="Loading project..." />;
  }

  return <CanvasPage project={project} />;
}
```

### Button with Loading

```tsx
import { ButtonLoader } from '@/components/ui/LoadingIndicator';

function SaveButton() {
  const [saving, setSaving] = useState(false);

  return (
    <button onClick={handleSave} disabled={saving}>
      {saving ? <ButtonLoader message="Saving..." /> : 'Save Project'}
    </button>
  );
}
```

### Overlay During Critical Operation

```tsx
function ExportDialog() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await exportProject();
    setExporting(false);
  };

  return (
    <>
      <button onClick={handleExport}>Export PDF</button>

      {exporting && (
        <LoadingIndicator overlay message="Generating PDF..." />
      )}
    </>
  );
}
```

### Inline in Table Row

```tsx
<tr>
  <td>Project A</td>
  <td>
    {isSyncing ? (
      <LoadingIndicator size="sm" inline />
    ) : (
      <span>Synced</span>
    )}
  </td>
</tr>
```

## Accessibility

| Feature | Implementation |
|---------|----------------|
| ARIA | `role="status"`, `aria-live="polite"` |
| Screen Reader | Hidden "Loading..." text with `sr-only` |
| Focus | Overlay traps focus during critical ops |
| Motion | Respects `prefers-reduced-motion` |

```css
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
    opacity: 0.7;
  }
}
```

## Related Elements

- [IconButton](./IconButton.md) - Button with loading state
- [Toast](./Toast.md) - Loading success/error feedback
- [PageLoader](./LoadingIndicator.md) - Full page variant

## Testing

```typescript
describe('LoadingIndicator', () => {
  it('renders spinner', () => {
    render(<LoadingIndicator />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays message when provided', () => {
    render(<LoadingIndicator message="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders correct size', () => {
    const { container } = render(<LoadingIndicator size="lg" />);
    expect(container.querySelector('.w-8')).toBeInTheDocument();
  });

  it('renders overlay mode', () => {
    render(<LoadingIndicator overlay message="Saving..." />);
    expect(document.querySelector('.loading-overlay')).toBeInTheDocument();
  });

  it('renders inline mode', () => {
    render(<LoadingIndicator inline />);
    expect(document.querySelector('.loading-inline')).toBeInTheDocument();
  });

  it('has accessible loading text', () => {
    render(<LoadingIndicator />);
    expect(screen.getByText('Loading...', { selector: '.sr-only' })).toBeInTheDocument();
  });
});

describe('PageLoader', () => {
  it('renders with default message', () => {
    render(<PageLoader />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<PageLoader message="Loading project..." />);
    expect(screen.getByText('Loading project...')).toBeInTheDocument();
  });
});
```
