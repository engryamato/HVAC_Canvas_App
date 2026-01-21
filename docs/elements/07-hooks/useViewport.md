# useViewport Hook

## Overview

The useViewport hook manages canvas pan and zoom interactions, including middle mouse drag, space+drag panning, and mouse wheel zooming. It provides screen-to-canvas coordinate conversion essential for entity positioning.

## Location

```
src/features/canvas/hooks/useViewport.ts
```

## Purpose

- Handle pan interactions (middle mouse or space+drag)
- Handle zoom with mouse wheel (centered on cursor)
- Convert screen coordinates to canvas coordinates
- Track pan and zoom state
- Manage cursor styles during pan mode

## Hook Signature

```typescript
export function useViewport({ canvasRef }: UseViewportOptions): {
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };
  isPanning: boolean;
}
```

## Options

```typescript
interface UseViewportOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}
```

## Pan Controls

- **Middle Mouse Button**: Hold and drag to pan
- **Space + Left Mouse**: Hold space, then click and drag to pan
- Cursor changes to "grab" during space-pan mode

## Zoom Controls

- **Mouse Wheel Up**: Zoom in (centered on cursor position)
- **Mouse Wheel Down**: Zoom out (centered on cursor position)

## Functions

### screenToCanvas

Convert screen pixel coordinates to canvas world coordinates.

```typescript
screenToCanvas(screenX: number, screenY: number): { x: number; y: number }
```

**Formula:**
```typescript
canvasX = (screenX - rect.left - panX) / zoom
canvasY = (screenY - rect.top - panY) / zoom
```

**Example:**
```typescript
// Mouse at screen (500, 300)
// Canvas pan: (100, 50), zoom: 1.5
const canvas = screenToCanvas(500, 300);
// canvas = { x: (500-100)/1.5, y: (300-50)/1.5 }
// canvas = { x: 266.67, y: 166.67 }
```

## Usage Examples

### Basic Viewport Setup

```typescript
import { useRef } from 'react';
import { useViewport } from '@/features/canvas/hooks/useViewport';

function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { screenToCanvas, isPanning } = useViewport({ canvasRef });

  const handleClick = (e: React.MouseEvent) => {
    const canvasCoords = screenToCanvas(e.clientX, e.clientY);
    console.log('Canvas coordinates:', canvasCoords);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    />
  );
}
```

### With Entity Creation

```typescript
const { screenToCanvas } = useViewport({ canvasRef });

const handleCanvasClick = (e: React.MouseEvent) => {
  if (currentTool === 'room') {
    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    // Create room at canvas position
    const room = createRoom({ x, y });
    createEntity(room);
  }
};
```

### Coordinate Debugging

```typescript
const { screenToCanvas } = useViewport({ canvasRef });

const handleMouseMove = (e: React.MouseEvent) => {
  const canvas = screenToCanvas(e.clientX, e.clientY);
  const viewport = useViewportStore.getState();

  console.log({
    screen: { x: e.clientX, y: e.clientY },
    canvas,
    viewport: { panX: viewport.panX, panY: viewport.panY, zoom: viewport.zoom },
  });
};
```

## Event Handling

### Pan Events

```typescript
// Start pan
handleMouseDown(e: MouseEvent): void
  → Set isPanning = true if middle mouse or space+left
  → Store start position

// During pan
handleMouseMove(e: MouseEvent): void
  → Calculate delta from last position
  → Call viewport.pan(deltaX, deltaY)
  → Update last position

// End pan
handleMouseUp(): void
  → Set isPanning = false
```

### Zoom Events

```typescript
handleWheel(e: WheelEvent): void
  → Get mouse position relative to canvas
  → If deltaY < 0: zoomIn(mouseX, mouseY)
  → If deltaY > 0: zoomOut(mouseX, mouseY)
  → Zoom centered on mouse cursor
```

### Keyboard Events

```typescript
handleKeyDown(e: KeyboardEvent): void
  → If Space pressed: Set cursor to 'grab'

handleKeyUp(e: KeyboardEvent): void
  → If Space released: Reset cursor
```

## Testing

```typescript
describe('useViewport', () => {
  it('converts screen to canvas coordinates', () => {
    const { result } = renderHook(() => useViewport({ canvasRef }));

    // Set viewport state
    useViewportStore.getState().setPan(100, 50);
    useViewportStore.getState().zoomTo(2.0);

    const canvas = result.current.screenToCanvas(500, 300);

    // (500 - 100) / 2 = 200
    // (300 - 50) / 2 = 125
    expect(canvas).toEqual({ x: 200, y: 125 });
  });

  it('enables panning on middle mouse', () => {
    const { result } = renderHook(() => useViewport({ canvasRef }));

    const mouseDown = new MouseEvent('mousedown', { button: 1 });
    canvasRef.current?.dispatchEvent(mouseDown);

    expect(result.current.isPanning).toBe(true);
  });

  it('zooms with mouse wheel', () => {
    renderHook(() => useViewport({ canvasRef }));

    const initialZoom = useViewportStore.getState().zoom;

    const wheelEvent = new WheelEvent('wheel', { deltaY: -100 });
    canvasRef.current?.dispatchEvent(wheelEvent);

    const newZoom = useViewportStore.getState().zoom;
    expect(newZoom).toBeGreaterThan(initialZoom);
  });
});
```

## Related Elements

- [viewportStore](../02-stores/viewportStore.md)
- [useSelection](./useSelection.md)
- [useMarquee](./useMarquee.md)
