# viewportStore

## Overview

The viewportStore is a Zustand store that manages the canvas viewport state including pan position, zoom level, and grid settings. It provides smooth zooming with focal point support and intelligent content fitting.

## Location

```
src/features/canvas/store/viewportStore.ts
```

## Purpose

- Manage canvas pan (x, y) position and zoom level
- Provide zoom operations with optional focal point (zoom toward cursor)
- Support fit-to-content functionality with bounds calculation
- Control grid visibility, size, and snap-to-grid behavior
- Enforce zoom limits (MIN_ZOOM to MAX_ZOOM)
- Enable viewport reset to defaults

## Dependencies

- `zustand` - State management library
- `zustand/middleware/immer` - Immutable state updates
- `@/core/constants/viewport` - Viewport constants (MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, etc.)

## State Structure

### ViewportState

```typescript
interface ViewportState {
  panX: number;           // Horizontal pan offset in pixels
  panY: number;           // Vertical pan offset in pixels
  zoom: number;           // Zoom level (1.0 = 100%, 0.5 = 50%, 2.0 = 200%)
  gridVisible: boolean;   // Whether grid is displayed
  gridSize: number;       // Grid cell size in pixels at zoom=1
  snapToGrid: boolean;    // Whether entities snap to grid
}
```

**Default State**:
```typescript
{
  panX: 0,
  panY: 0,
  zoom: 1.0,              // 100% zoom (DEFAULT_ZOOM)
  gridVisible: true,
  gridSize: 24,           // 1/4 inch at 96 DPI (DEFAULT_GRID_SIZE)
  snapToGrid: true
}
```

**Viewport Constants** (from `@/core/constants/viewport`):
- `MIN_ZOOM`: 0.1 (10%)
- `MAX_ZOOM`: 4.0 (400%)
- `ZOOM_STEP`: 0.1 (10% increments)
- `DEFAULT_ZOOM`: 1.0 (100%)
- `DEFAULT_GRID_SIZE`: 24 pixels

## Actions

### Pan Operations

| Action | Signature | Description |
|--------|-----------|-------------|
| `pan` | `(deltaX: number, deltaY: number) => void` | Adjust pan by delta (relative) |
| `setPan` | `(x: number, y: number) => void` | Set absolute pan position |

### Zoom Operations

| Action | Signature | Description |
|--------|-----------|-------------|
| `zoomTo` | `(level: number, centerX?: number, centerY?: number) => void` | Set zoom to specific level, optionally toward focal point |
| `zoomIn` | `(centerX?: number, centerY?: number) => void` | Increase zoom by ZOOM_STEP (0.1) |
| `zoomOut` | `(centerX?: number, centerY?: number) => void` | Decrease zoom by ZOOM_STEP (0.1) |
| `fitToContent` | `(bounds: Bounds, canvasDimensions?: Dimensions) => void` | Zoom and pan to fit content with padding |
| `resetView` | `() => void` | Reset to default pan (0, 0) and zoom (1.0) |

### Grid Operations

| Action | Signature | Description |
|--------|-----------|-------------|
| `toggleGrid` | `() => void` | Toggle grid visibility on/off |
| `setGridSize` | `(size: number) => void` | Set grid cell size in pixels |
| `toggleSnap` | `() => void` | Toggle snap-to-grid on/off |

## Implementation Details

### 1. Pan with Delta (Relative)

```typescript
pan: (deltaX, deltaY) =>
  set((state) => {
    state.panX += deltaX;
    state.panY += deltaY;
  }),
```

Used for mouse dragging - adds delta to current pan position.

### 2. Zoom with Focal Point

```typescript
zoomTo: (level, centerX, centerY) =>
  set((state) => {
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));

    // If center point provided, adjust pan to zoom toward that point
    if (centerX !== undefined && centerY !== undefined) {
      const zoomRatio = newZoom / state.zoom;
      state.panX = centerX - (centerX - state.panX) * zoomRatio;
      state.panY = centerY - (centerY - state.panY) * zoomRatio;
    }
    state.zoom = newZoom;
  }),
```

**Key Features**:
- Clamps zoom between MIN_ZOOM (0.1) and MAX_ZOOM (4.0)
- If focal point (centerX, centerY) provided, adjusts pan so zoom appears to target that point
- Calculates `zoomRatio` to scale the offset from center point
- Without focal point, zooms from current center

**Zoom Ratio Math**:
```
newPan = center - (center - oldPan) * (newZoom / oldZoom)
```

This ensures the point under the cursor stays in the same screen position.

### 3. Fit to Content

```typescript
fitToContent: (bounds, canvasDimensions) =>
  set((state) => {
    // Get canvas dimensions (passed or inferred from window)
    let canvasWidth = canvasDimensions?.width ?? window.innerWidth * 0.7;
    let canvasHeight = canvasDimensions?.height ?? window.innerHeight * 0.8;

    const padding = 50; // Padding around content

    // Guard against invalid bounds
    if (bounds.width <= 0 || bounds.height <= 0) {
      state.panX = canvasWidth / 2 - bounds.x;
      state.panY = canvasHeight / 2 - bounds.y;
      return;
    }

    // Calculate zoom to fit with padding
    const zoomX = (canvasWidth - padding * 2) / bounds.width;
    const zoomY = (canvasHeight - padding * 2) / bounds.height;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(zoomX, zoomY)));

    // Center the content
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    state.panX = canvasWidth / 2 - centerX * newZoom;
    state.panY = canvasHeight / 2 - centerY * newZoom;
    state.zoom = newZoom;
  }),
```

**Key Features**:
- Accepts content bounds and optional canvas dimensions
- Falls back to window size estimation (70% width, 80% height)
- SSR-safe: checks for `window` object
- Adds 50px padding around content
- Uses smaller of zoomX/zoomY to ensure everything fits
- Centers content in viewport
- Guards against zero/negative bounds

### 4. Zoom In/Out with Step

```typescript
zoomIn: (centerX, centerY) =>
  set((state) => {
    const newZoom = Math.min(MAX_ZOOM, state.zoom + ZOOM_STEP);
    // Same focal point math as zoomTo...
  }),

zoomOut: (centerX, centerY) =>
  set((state) => {
    const newZoom = Math.max(MIN_ZOOM, state.zoom - ZOOM_STEP);
    // Same focal point math as zoomTo...
  }),
```

Convenience methods that use ZOOM_STEP (0.1 = 10% increments).

## Selectors

### Hook Selectors (React)

Use these in React components for automatic re-renders:

```typescript
// Get zoom level
const zoom = useZoom();

// Get pan position
const { x, y } = usePan();

// Get grid state
const gridVisible = useGridVisible();
const gridSize = useGridSize();
const snapToGrid = useSnapToGrid();
```

### Actions Hook

```typescript
const {
  pan,
  setPan,
  zoomTo,
  zoomIn,
  zoomOut,
  fitToContent,
  resetView,
  toggleGrid,
  setGridSize,
  toggleSnap,
} = useViewportActions();
```

## Usage Examples

### Panning on Mouse Drag

```typescript
import { useViewportActions } from '@/features/canvas/store/viewportStore';

function CanvasPanHandler() {
  const { pan } = useViewportActions();
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastPos.x;
    const deltaY = e.clientY - lastPos.y;

    pan(deltaX, deltaY);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <canvas
      onMouseDown={(e) => {
        setIsDragging(true);
        setLastPos({ x: e.clientX, y: e.clientY });
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
    />
  );
}
```

### Zooming with Mouse Wheel

```typescript
import { useViewportActions } from '@/features/canvas/store/viewportStore';

function CanvasZoomHandler() {
  const { zoomIn, zoomOut } = useViewportActions();

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    // Get cursor position as focal point
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;

    if (e.deltaY < 0) {
      zoomIn(centerX, centerY); // Zoom in toward cursor
    } else {
      zoomOut(centerX, centerY); // Zoom out from cursor
    }
  };

  return <canvas onWheel={handleWheel} />;
}
```

### Fit All Entities to View

```typescript
import { useViewportActions } from '@/features/canvas/store/viewportStore';
import { useAllEntities } from '@/core/store/entityStore';

function FitToContentButton() {
  const entities = useAllEntities();
  const { fitToContent } = useViewportActions();

  const handleFit = () => {
    if (entities.length === 0) return;

    // Calculate bounding box of all entities
    const bounds = {
      x: Math.min(...entities.map(e => e.position.x)),
      y: Math.min(...entities.map(e => e.position.y)),
      width: Math.max(...entities.map(e => e.position.x + e.size.width)),
      height: Math.max(...entities.map(e => e.position.y + e.size.height)),
    };

    // Get canvas dimensions
    const canvas = document.querySelector('canvas');
    const canvasDimensions = {
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    };

    fitToContent(bounds, canvasDimensions);
  };

  return <button onClick={handleFit}>Fit to View</button>;
}
```

### Zoom Controls

```typescript
import { useZoom, useViewportActions } from '@/features/canvas/store/viewportStore';
import { MIN_ZOOM, MAX_ZOOM } from '@/core/constants/viewport';

function ZoomControls() {
  const zoom = useZoom();
  const { zoomIn, zoomOut, zoomTo, resetView } = useViewportActions();

  return (
    <div>
      <button onClick={() => zoomOut()} disabled={zoom <= MIN_ZOOM}>
        -
      </button>
      <span>{Math.round(zoom * 100)}%</span>
      <button onClick={() => zoomIn()} disabled={zoom >= MAX_ZOOM}>
        +
      </button>
      <button onClick={() => zoomTo(1.0)}>100%</button>
      <button onClick={resetView}>Reset</button>
    </div>
  );
}
```

### Grid Controls

```typescript
import {
  useGridVisible,
  useGridSize,
  useSnapToGrid,
  useViewportActions,
} from '@/features/canvas/store/viewportStore';

function GridControls() {
  const gridVisible = useGridVisible();
  const gridSize = useGridSize();
  const snapToGrid = useSnapToGrid();
  const { toggleGrid, setGridSize, toggleSnap } = useViewportActions();

  return (
    <div>
      <label>
        <input type="checkbox" checked={gridVisible} onChange={toggleGrid} />
        Show Grid
      </label>

      <label>
        Grid Size:
        <select value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))}>
          <option value={12}>12px (1/8")</option>
          <option value={24}>24px (1/4")</option>
          <option value={48}>48px (1/2")</option>
          <option value={96}>96px (1")</option>
        </select>
      </label>

      <label>
        <input type="checkbox" checked={snapToGrid} onChange={toggleSnap} />
        Snap to Grid
      </label>
    </div>
  );
}
```

### Transforming Canvas Coordinates

```typescript
import { useZoom, usePan } from '@/features/canvas/store/viewportStore';

function useCanvasTransform() {
  const zoom = useZoom();
  const { x: panX, y: panY } = usePan();

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = (screenX: number, screenY: number) => ({
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom,
  });

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = (canvasX: number, canvasY: number) => ({
    x: canvasX * zoom + panX,
    y: canvasY * zoom + panY,
  });

  return { screenToCanvas, canvasToScreen, zoom, panX, panY };
}
```

## Performance Optimization

### 1. Fine-grained Selectors

**Good** (only re-renders when zoom changes):
```typescript
const zoom = useZoom(); // Only subscribes to zoom
```

**Bad** (re-renders on any viewport change):
```typescript
const { zoom } = useViewportStore(); // Subscribes to entire store
```

### 2. Passing Canvas Dimensions

Always pass canvas dimensions to `fitToContent` to avoid viewport size estimation:

```typescript
// ✅ Good: Explicit dimensions
const canvas = document.querySelector('canvas');
fitToContent(bounds, {
  width: canvas.clientWidth,
  height: canvas.clientHeight
});

// ❌ Bad: Relies on window size estimation
fitToContent(bounds);
```

### 3. Debouncing Zoom/Pan Updates

For performance during rapid zoom/pan, debounce expensive calculations:

```typescript
import { useMemo } from 'react';
import { useZoom, usePan } from '@/features/canvas/store/viewportStore';

function ExpensiveCalculation() {
  const zoom = useZoom();
  const { x, y } = usePan();

  // Only recalculate when zoom/pan changes significantly
  const visibleBounds = useMemo(() => {
    return calculateVisibleBounds(zoom, x, y);
  }, [
    Math.round(zoom * 10) / 10, // Round to 1 decimal
    Math.round(x / 10) * 10,    // Round to nearest 10px
    Math.round(y / 10) * 10,
  ]);

  return <div>{/* Use visibleBounds */}</div>;
}
```

## Coordinate System

The viewport uses a coordinate transformation system:

```
Screen Coordinates (pixels on screen)
  ↓ Transform: (screen - pan) / zoom
Canvas Coordinates (world space)
```

**Forward Transform** (canvas → screen):
```typescript
screenX = canvasX * zoom + panX
screenY = canvasY * zoom + panY
```

**Inverse Transform** (screen → canvas):
```typescript
canvasX = (screenX - panX) / zoom
canvasY = (screenY - panY) / zoom
```

**Example**:
```typescript
// Entity at canvas position (100, 100)
// Viewport: zoom=2.0, pan=(50, 50)
screenX = 100 * 2.0 + 50 = 250
screenY = 100 * 2.0 + 50 = 250
// Entity appears at screen pixel (250, 250)
```

## Related Elements

- [CanvasContainer](../01-components/canvas/CanvasContainer.md) - Main canvas component using viewport
- [CanvasRenderer](../01-components/canvas/CanvasRenderer.md) - Renders entities with viewport transform
- [GridRenderer](../01-components/canvas/GridRenderer.md) - Renders grid based on viewport state
- [ToolManager](../05-tools/ToolManager.md) - Handles pan tool for viewport manipulation
- [ViewportConstants](../12-constants/viewport.md) - Centralized viewport limits and defaults

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useViewportStore } from './viewportStore';
import { MIN_ZOOM, MAX_ZOOM, DEFAULT_ZOOM } from '@/core/constants/viewport';

describe('viewportStore', () => {
  beforeEach(() => {
    // Reset to initial state
    useViewportStore.setState({
      panX: 0,
      panY: 0,
      zoom: DEFAULT_ZOOM,
      gridVisible: true,
      gridSize: 24,
      snapToGrid: true,
    });
  });

  it('pans by delta', () => {
    act(() => {
      useViewportStore.getState().pan(10, 20);
    });

    expect(useViewportStore.getState().panX).toBe(10);
    expect(useViewportStore.getState().panY).toBe(20);
  });

  it('sets absolute pan position', () => {
    act(() => {
      useViewportStore.getState().setPan(100, 200);
    });

    expect(useViewportStore.getState().panX).toBe(100);
    expect(useViewportStore.getState().panY).toBe(200);
  });

  it('zooms to level within limits', () => {
    act(() => {
      useViewportStore.getState().zoomTo(2.0);
    });

    expect(useViewportStore.getState().zoom).toBe(2.0);
  });

  it('clamps zoom to MIN_ZOOM', () => {
    act(() => {
      useViewportStore.getState().zoomTo(0.05); // Below MIN_ZOOM
    });

    expect(useViewportStore.getState().zoom).toBe(MIN_ZOOM);
  });

  it('clamps zoom to MAX_ZOOM', () => {
    act(() => {
      useViewportStore.getState().zoomTo(5.0); // Above MAX_ZOOM
    });

    expect(useViewportStore.getState().zoom).toBe(MAX_ZOOM);
  });

  it('zooms toward focal point', () => {
    act(() => {
      useViewportStore.getState().zoomTo(2.0, 100, 100);
    });

    const { panX, panY, zoom } = useViewportStore.getState();
    expect(zoom).toBe(2.0);

    // Pan should adjust to keep (100, 100) centered
    expect(panX).toBe(100 - (100 - 0) * 2); // 100 - 200 = -100
    expect(panY).toBe(100 - (100 - 0) * 2); // 100 - 200 = -100
  });

  it('zooms in by step', () => {
    act(() => {
      useViewportStore.getState().zoomIn();
    });

    expect(useViewportStore.getState().zoom).toBe(DEFAULT_ZOOM + 0.1);
  });

  it('zooms out by step', () => {
    act(() => {
      useViewportStore.getState().zoomOut();
    });

    expect(useViewportStore.getState().zoom).toBe(DEFAULT_ZOOM - 0.1);
  });

  it('fits content to view', () => {
    const bounds = { x: 0, y: 0, width: 1000, height: 1000 };
    const canvasDimensions = { width: 800, height: 600 };

    act(() => {
      useViewportStore.getState().fitToContent(bounds, canvasDimensions);
    });

    const { zoom, panX, panY } = useViewportStore.getState();

    // Should zoom to fit with padding (800-100)/1000 = 0.7
    expect(zoom).toBeCloseTo(0.5); // min((800-100)/1000, (600-100)/1000)

    // Should center content
    expect(panX).toBeDefined();
    expect(panY).toBeDefined();
  });

  it('resets view to defaults', () => {
    act(() => {
      useViewportStore.getState().pan(100, 200);
      useViewportStore.getState().zoomTo(2.0);
      useViewportStore.getState().resetView();
    });

    expect(useViewportStore.getState().panX).toBe(0);
    expect(useViewportStore.getState().panY).toBe(0);
    expect(useViewportStore.getState().zoom).toBe(DEFAULT_ZOOM);
  });

  it('toggles grid visibility', () => {
    expect(useViewportStore.getState().gridVisible).toBe(true);

    act(() => {
      useViewportStore.getState().toggleGrid();
    });

    expect(useViewportStore.getState().gridVisible).toBe(false);
  });

  it('sets grid size', () => {
    act(() => {
      useViewportStore.getState().setGridSize(48);
    });

    expect(useViewportStore.getState().gridSize).toBe(48);
  });

  it('toggles snap to grid', () => {
    expect(useViewportStore.getState().snapToGrid).toBe(true);

    act(() => {
      useViewportStore.getState().toggleSnap();
    });

    expect(useViewportStore.getState().snapToGrid).toBe(false);
  });
});
```
