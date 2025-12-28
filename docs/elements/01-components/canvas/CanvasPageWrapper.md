# CanvasPageWrapper

## Overview

The CanvasPageWrapper is a layout component that wraps the entire canvas editing interface. It manages the overall structure including the toolbar, canvas area, and inspector panel positioning, along with error boundary handling and loading states.

## Location

```
src/features/canvas/components/CanvasPageWrapper.tsx
```

## Purpose

- Provide layout structure for the canvas editing interface
- Position toolbar, canvas, and inspector panels
- Handle loading states during project initialization
- Provide error boundary for canvas-related errors
- Manage responsive layout behavior

## Dependencies

- `@/components/ui/ErrorBoundary` - Error handling
- `@/components/ui/LoadingSpinner` - Loading states
- `@/features/canvas/components/Toolbar` - Top toolbar
- `@/features/canvas/components/CanvasContainer` - Main canvas
- `@/features/canvas/components/InspectorPanel` - Right panel
- `@/features/canvas/store/projectStore` - Project state

## Layout

```
┌─────────────────────────────────────────────────────────┐
│                      Toolbar                            │
├───────────────────────────────────────────┬─────────────┤
│                                           │             │
│                                           │  Inspector  │
│              CanvasContainer              │    Panel    │
│                                           │             │
│                                           │             │
│                                           │             │
├───────────────────────────────────────────┴─────────────┤
│                      StatusBar                          │
└─────────────────────────────────────────────────────────┘
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `projectId` | `string` | Yes | Current project ID |
| `children` | `ReactNode` | No | Optional child content |

## Component Implementation

```tsx
interface CanvasPageWrapperProps {
  projectId: string;
  children?: React.ReactNode;
}

export function CanvasPageWrapper({ projectId, children }: CanvasPageWrapperProps) {
  const { isLoading, error, project } = useProject(projectId);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="canvas-page-wrapper loading">
        <LoadingSpinner size="lg" label="Loading project..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="canvas-page-wrapper error">
        <div className="error-container">
          <h2>Failed to load project</h2>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="canvas-page-wrapper not-found">
        <h2>Project not found</h2>
        <Link href="/dashboard">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={<CanvasErrorFallback />}
      onError={logCanvasError}
    >
      <div className="canvas-page-wrapper">
        {/* Top Toolbar */}
        <Toolbar projectId={projectId} />

        {/* Main Content Area */}
        <div className="canvas-main">
          {/* Canvas Area */}
          <div className="canvas-area">
            <CanvasContainer />
            <StatusBar />
          </div>

          {/* Inspector Panel */}
          <InspectorPanel
            collapsed={inspectorCollapsed}
            onToggle={() => setInspectorCollapsed(!inspectorCollapsed)}
          />
        </div>

        {/* Optional children (modals, overlays) */}
        {children}
      </div>
    </ErrorBoundary>
  );
}
```

## Responsive Behavior

```typescript
// Breakpoints for responsive layout
const BREAKPOINTS = {
  mobile: 640,    // Stack vertically
  tablet: 1024,   // Collapsible inspector
  desktop: 1280,  // Full layout
};

// Inspector auto-collapse on smaller screens
useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth < BREAKPOINTS.tablet) {
      setInspectorCollapsed(true);
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## Styling

```css
.canvas-page-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #f5f5f5;
}

.canvas-page-wrapper.loading,
.canvas-page-wrapper.error,
.canvas-page-wrapper.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Allow flex shrinking */
}

.error-container {
  text-align: center;
  padding: 40px;
}

.error-container h2 {
  color: #d32f2f;
  margin-bottom: 16px;
}

.error-container button {
  margin-top: 16px;
  padding: 8px 24px;
  background: #1976D2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .canvas-main {
    flex-direction: column;
  }
}
```

## Error Fallback

```tsx
function CanvasErrorFallback() {
  return (
    <div className="canvas-error-fallback">
      <h2>Something went wrong</h2>
      <p>The canvas encountered an error. Please try refreshing the page.</p>
      <div className="error-actions">
        <button onClick={() => window.location.reload()}>
          Refresh Page
        </button>
        <Link href="/dashboard">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
```

## Usage

```tsx
// In pages/canvas/[id].tsx
import { CanvasPageWrapper } from '@/features/canvas/components/CanvasPageWrapper';

export default function CanvasPage() {
  const { id } = useParams();

  return (
    <CanvasPageWrapper projectId={id}>
      {/* Modals rendered here */}
      <ExportDialog />
      <SettingsModal />
    </CanvasPageWrapper>
  );
}
```

## Related Elements

- [CanvasPage](./CanvasPage.md) - Page component that uses wrapper
- [CanvasContainer](./CanvasContainer.md) - Main canvas component
- [Toolbar](./Toolbar.md) - Top toolbar
- [InspectorPanel](../inspector/InspectorPanel.md) - Right panel
- [ErrorBoundary](../ui/ErrorBoundary.md) - Error handling

## Testing

```typescript
describe('CanvasPageWrapper', () => {
  it('renders loading state', () => {
    vi.mocked(useProject).mockReturnValue({
      isLoading: true,
      error: null,
      project: null,
    });

    render(<CanvasPageWrapper projectId="test-id" />);

    expect(screen.getByText('Loading project...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.mocked(useProject).mockReturnValue({
      isLoading: false,
      error: new Error('Failed to load'),
      project: null,
    });

    render(<CanvasPageWrapper projectId="test-id" />);

    expect(screen.getByText('Failed to load project')).toBeInTheDocument();
  });

  it('renders not found state', () => {
    vi.mocked(useProject).mockReturnValue({
      isLoading: false,
      error: null,
      project: null,
    });

    render(<CanvasPageWrapper projectId="test-id" />);

    expect(screen.getByText('Project not found')).toBeInTheDocument();
  });

  it('renders full layout when project loaded', () => {
    vi.mocked(useProject).mockReturnValue({
      isLoading: false,
      error: null,
      project: mockProject,
    });

    render(<CanvasPageWrapper projectId="test-id" />);

    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-container')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-panel')).toBeInTheDocument();
  });

  it('toggles inspector panel', () => {
    vi.mocked(useProject).mockReturnValue({
      isLoading: false,
      error: null,
      project: mockProject,
    });

    render(<CanvasPageWrapper projectId="test-id" />);

    const toggleButton = screen.getByLabelText('Toggle inspector');
    fireEvent.click(toggleButton);

    expect(screen.getByTestId('inspector-panel')).toHaveClass('collapsed');
  });
});
```
