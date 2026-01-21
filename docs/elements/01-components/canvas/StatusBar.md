# StatusBar

## Overview

The StatusBar component displays real-time information about the canvas state including cursor position, zoom level, grid status, and selection count. It's positioned at the bottom of the canvas editor.

## Location

```
src/features/canvas/components/StatusBar.tsx
```

## Purpose

- Display cursor position in canvas coordinates
- Show current zoom level percentage
- Indicate grid visibility and snap status
- Display count of selected entities
- Provide quick visual reference for canvas state

## Dependencies

- `@/features/canvas/store/viewportStore` - Zoom and grid state
- `@/features/canvas/store/selectionStore` - Selection state
- Mouse position from CanvasContainer (via context or prop)

## Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  X: 120  Y: 85  │  Zoom: 100%  │  Grid: On  Snap: On  │  2 entities selected │
└─────────────────────────────────────────────────────────────────────────────┘
     ↑                   ↑               ↑                        ↑
  Position            Zoom          Grid Status            Selection Count
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `mousePosition` | `{ x: number; y: number } \| null` | No | Current mouse position |
| `className` | `string` | No | Additional CSS classes |

## Component Implementation

```tsx
interface StatusBarProps {
  mousePosition?: { x: number; y: number } | null;
  className?: string;
}

export function StatusBar({ mousePosition, className }: StatusBarProps) {
  const zoom = useZoom();
  const gridVisible = useGridVisible();
  const snapToGrid = useSnapToGrid();
  const selectionCount = useSelectionCount();

  // Format position values
  const formatPosition = (value: number | undefined) => {
    if (value === undefined || value === null) return '—';
    return Math.round(value).toString();
  };

  // Format zoom as percentage
  const formatZoom = (zoomValue: number) => {
    return `${Math.round(zoomValue * 100)}%`;
  };

  return (
    <div className={cn('status-bar', className)} data-testid="status-bar">
      {/* Mouse Position */}
      <div className="status-section">
        <span className="status-label">X:</span>
        <span className="status-value">
          {formatPosition(mousePosition?.x)}
        </span>
        <span className="status-label">Y:</span>
        <span className="status-value">
          {formatPosition(mousePosition?.y)}
        </span>
      </div>

      <div className="status-divider" />

      {/* Zoom Level */}
      <div className="status-section">
        <span className="status-label">Zoom:</span>
        <span className="status-value">{formatZoom(zoom)}</span>
      </div>

      <div className="status-divider" />

      {/* Grid Status */}
      <div className="status-section">
        <span className={cn('status-indicator', { active: gridVisible })}>
          Grid: {gridVisible ? 'On' : 'Off'}
        </span>
        <span className={cn('status-indicator', { active: snapToGrid })}>
          Snap: {snapToGrid ? 'On' : 'Off'}
        </span>
      </div>

      <div className="status-divider" />

      {/* Selection Count */}
      <div className="status-section">
        {selectionCount > 0 ? (
          <span className="status-selection">
            {selectionCount} {selectionCount === 1 ? 'entity' : 'entities'} selected
          </span>
        ) : (
          <span className="status-selection-empty">No selection</span>
        )}
      </div>
    </div>
  );
}
```

## Styling
 
The component uses Tailwind utility classes:
- **Bar**: `h-8 bg-slate-100 border-t flex items-center px-4 text-xs text-slate-600 justify-between shrink-0`
- **Section**: `flex items-center gap-4`
- **Divider**: `h-4 w-px bg-slate-300`
- **Value**: `font-mono font-medium text-slate-900`

## Usage

```tsx
import { StatusBar } from '@/features/canvas/components/StatusBar';

function CanvasPage() {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  return (
    <div className="canvas-layout">
      <CanvasContainer onMouseMove={setMousePos} />
      <StatusBar mousePosition={mousePos} />
    </div>
  );
}
```

## Status Indicators

### Position Display

```
X: 120  Y: 85
```

- Shows canvas coordinates (not screen coordinates)
- Updates in real-time as mouse moves
- Shows "—" when mouse is outside canvas

### Zoom Display

```
Zoom: 100%
Zoom: 150%
Zoom: 50%
```

- Shows current zoom as percentage
- Range: 10% to 400%

### Grid Status

```
Grid: On   Grid: Off
Snap: On   Snap: Off
```

- Blue highlight when active
- Gray when inactive

### Selection Count

```
No selection
1 entity selected
3 entities selected
```

- Shows count of selected entities
- Uses singular/plural correctly

## Related Elements

- [CanvasPage](./CanvasPage.md) - Parent layout
- [CanvasContainer](./CanvasContainer.md) - Provides mouse position
- [ZoomControls](./ZoomControls.md) - Zoom control buttons
- [ViewportStore](../../02-stores/viewportStore.md) - Zoom/grid state
- [SelectionStore](../../02-stores/selectionStore.md) - Selection state

## Testing

```typescript
describe('StatusBar', () => {
  it('displays mouse position', () => {
    render(<StatusBar mousePosition={{ x: 120, y: 85 }} />);

    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('displays dash when no mouse position', () => {
    render(<StatusBar mousePosition={null} />);

    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('displays zoom percentage', () => {
    useViewportStore.setState({ zoom: 1.5 });

    render(<StatusBar />);

    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('shows grid status', () => {
    useViewportStore.setState({ gridVisible: true });

    render(<StatusBar />);

    expect(screen.getByText('Grid: On')).toBeInTheDocument();
  });

  it('shows snap status', () => {
    useViewportStore.setState({ snapToGrid: false });

    render(<StatusBar />);

    expect(screen.getByText('Snap: Off')).toBeInTheDocument();
  });

  it('shows selection count', () => {
    useSelectionStore.setState({ selectedIds: ['a', 'b', 'c'] });

    render(<StatusBar />);

    expect(screen.getByText('3 entities selected')).toBeInTheDocument();
  });

  it('shows singular for single selection', () => {
    useSelectionStore.setState({ selectedIds: ['a'] });

    render(<StatusBar />);

    expect(screen.getByText('1 entity selected')).toBeInTheDocument();
  });

  it('shows no selection message', () => {
    useSelectionStore.setState({ selectedIds: [] });

    render(<StatusBar />);

    expect(screen.getByText('No selection')).toBeInTheDocument();
  });
});
```
