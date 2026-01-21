# ZoomControls

## Overview

The ZoomControls component provides buttons for zooming in/out, resetting zoom to 100%, and fitting the canvas content to view. It displays the current zoom level as a percentage.

## Location

```
src/features/canvas/components/ZoomControls.tsx
```

## Purpose

- Provide zoom in/out buttons
- Display current zoom percentage
- Reset zoom to 100%
- Fit all content to view
- Offer alternative to mouse wheel zooming

## Dependencies

- `@/features/canvas/store/viewportStore` - Zoom state and actions
- `@/components/ui/IconButton` - Control buttons

## Layout

```
┌─────────────────────────────────┐
│  [-]  100%  [+]  [Fit]  [Reset] │
└─────────────────────────────────┘
   ↑     ↑     ↑     ↑       ↑
 Zoom  Zoom  Zoom   Fit    Reset
 Out   Level  In   Content  100%
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `className` | `string` | No | Additional CSS classes |

## Component Implementation

```tsx
export function ZoomControls({ className }: { className?: string }) {
  const zoom = useZoom();
  const { zoomIn, zoomOut, zoomTo, fitToContent, resetView } = useViewportActions();

  // Format zoom as percentage
  const zoomPercentage = Math.round(zoom * 100);

  // Check if at zoom limits
  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  return (
    <div className={cn('zoom-controls', className)} data-testid="zoom-controls">
      {/* Zoom Out */}
      <IconButton
        icon={<MinusIcon />}
        onClick={zoomOut}
        disabled={!canZoomOut}
        tooltip="Zoom Out (-)"
        size="sm"
        ariaLabel="Zoom out"
      />

      {/* Zoom Percentage Display */}
      <button
        className="zoom-display"
        onClick={resetView}
        title="Click to reset to 100%"
      >
        {zoomPercentage}%
      </button>

      {/* Zoom In */}
      <IconButton
        icon={<PlusIcon />}
        onClick={zoomIn}
        disabled={!canZoomIn}
        tooltip="Zoom In (+)"
        size="sm"
        ariaLabel="Zoom in"
      />

      <div className="zoom-divider" />

      {/* Fit to Content */}
      <IconButton
        icon={<FitIcon />}
        onClick={fitToContent}
        tooltip="Fit to Content"
        size="sm"
        ariaLabel="Fit canvas to content"
      />

      {/* Reset View */}
      <IconButton
        icon={<ResetIcon />}
        onClick={resetView}
        tooltip="Reset View (0)"
        size="sm"
        ariaLabel="Reset zoom to 100%"
      />
    </div>
  );
}
```

## Zoom Levels

| Zoom | Percentage | Description |
|------|------------|-------------|
| 0.10 | 10% | Minimum zoom |
| 0.25 | 25% | Very zoomed out |
| 0.50 | 50% | Zoomed out |
| 1.00 | 100% | Default / 1:1 |
| 1.50 | 150% | Slightly zoomed in |
| 2.00 | 200% | Zoomed in |
| 4.00 | 400% | Maximum zoom |

## Zoom Increment

```typescript
const ZOOM_STEP = 0.1; // 10% increment

function zoomIn() {
  setZoom(Math.min(zoom + ZOOM_STEP, MAX_ZOOM));
}

function zoomOut() {
  setZoom(Math.max(zoom - ZOOM_STEP, MIN_ZOOM));
}
```

## Fit to Content

The "Fit to Content" function calculates the optimal zoom and pan to show all entities:

```typescript
function fitToContent() {
  const allEntities = useEntityStore.getState().allIds;
  if (allEntities.length === 0) {
    resetView();
    return;
  }

  // Calculate bounds of all entities
  const bounds = calculateAllEntityBounds();

  // Calculate required zoom to fit bounds in viewport
  const viewportWidth = canvasWidth;
  const viewportHeight = canvasHeight;
  const padding = 50; // pixels

  const scaleX = (viewportWidth - padding * 2) / bounds.width;
  const scaleY = (viewportHeight - padding * 2) / bounds.height;
  const newZoom = Math.min(scaleX, scaleY, MAX_ZOOM);

  // Calculate pan to center content
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const newPanX = viewportWidth / 2 - centerX * newZoom;
  const newPanY = viewportHeight / 2 - centerY * newZoom;

  setZoom(newZoom);
  setPan(newPanX, newPanY);
}
```

## Styling
 
The component uses Tailwind + Glassmorphism:
- **Container**: `bg-white/80 backdrop-blur-sm border shadow-sm rounded-lg`
- **Button**: `hover:bg-slate-100 active:scale-95 text-slate-700`
- **Divider**: `w-px h-4 bg-slate-200 mx-1`

## Keyboard Shortcuts

The zoom controls also respond to keyboard shortcuts handled by `useKeyboardShortcuts`:

| Key | Action |
|-----|--------|
| `+` or `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset to 100% |

## Usage

```tsx
import { ZoomControls } from '@/features/canvas/components/ZoomControls';

function CanvasFooter() {
  return (
    <div className="canvas-footer">
      <StatusBar />
      <ZoomControls />
    </div>
  );
}
```

## Positioning

The ZoomControls are typically positioned in the bottom-right corner of the canvas:

```tsx
<div className="canvas-footer">
  <StatusBar />  {/* Left side */}
  <ZoomControls />  {/* Right side */}
</div>
```

## Related Elements

- [ViewportStore](../../02-stores/viewportStore.md) - Zoom state
- [StatusBar](./StatusBar.md) - Shows zoom percentage
- [CanvasContainer](./CanvasContainer.md) - Applies zoom transform
- [IconButton](../ui/IconButton.md) - Control buttons
- [useKeyboardShortcuts](../../07-hooks/useKeyboardShortcuts.md) - Keyboard zoom

## Testing

```typescript
describe('ZoomControls', () => {
  beforeEach(() => {
    useViewportStore.setState({ zoom: 1.0 });
  });

  it('displays current zoom percentage', () => {
    render(<ZoomControls />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays correct percentage at different zoom levels', () => {
    useViewportStore.setState({ zoom: 1.5 });
    render(<ZoomControls />);
    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('zooms in when plus button clicked', () => {
    render(<ZoomControls />);
    fireEvent.click(screen.getByLabelText('Zoom in'));
    expect(useViewportStore.getState().zoom).toBe(1.1);
  });

  it('zooms out when minus button clicked', () => {
    render(<ZoomControls />);
    fireEvent.click(screen.getByLabelText('Zoom out'));
    expect(useViewportStore.getState().zoom).toBe(0.9);
  });

  it('disables zoom in at max zoom', () => {
    useViewportStore.setState({ zoom: 4.0 }); // MAX_ZOOM
    render(<ZoomControls />);
    expect(screen.getByLabelText('Zoom in')).toBeDisabled();
  });

  it('disables zoom out at min zoom', () => {
    useViewportStore.setState({ zoom: 0.1 }); // MIN_ZOOM
    render(<ZoomControls />);
    expect(screen.getByLabelText('Zoom out')).toBeDisabled();
  });

  it('resets view when percentage clicked', () => {
    useViewportStore.setState({ zoom: 1.5 });
    render(<ZoomControls />);

    fireEvent.click(screen.getByText('150%'));

    expect(useViewportStore.getState().zoom).toBe(1.0);
  });

  it('fits to content when fit button clicked', () => {
    const fitToContent = vi.fn();
    useViewportStore.setState({ fitToContent });

    render(<ZoomControls />);
    fireEvent.click(screen.getByLabelText('Fit canvas to content'));

    expect(fitToContent).toHaveBeenCalled();
  });
});
```
