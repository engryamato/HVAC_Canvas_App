# CanvasContainer

## Overview

The CanvasContainer is the core rendering component of the HVAC Canvas application. It manages the HTML5 Canvas 2D context, handles viewport transformations (pan/zoom), renders all entities, processes tool interactions, and maintains the animation loop.

## Location

```
src/features/canvas/components/CanvasContainer.tsx
```

## Purpose

- Render the main drawing canvas using pure Canvas 2D API
- Apply viewport transformations (pan, zoom)
- Render grid overlay when enabled
- Render all entities (rooms, ducts, equipment, fittings, notes)
- Forward mouse and keyboard events to the active tool
- Manage canvas resize handling
- Maintain 60fps render loop

## Dependencies

- `@/core/store/entityStore` - Entity state
- `@/features/canvas/store/viewportStore` - Pan/zoom state
- `@/features/canvas/store/selectionStore` - Selection state
- `@/core/store/canvas.store` - Active tool
- Canvas tools (`SelectTool`, `RoomTool`, `DuctTool`, etc.)
- Entity renderers (`RoomRenderer`, `DuctRenderer`, `EquipmentRenderer`)

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `width` | `number` | No | Canvas width (defaults to container) |
| `height` | `number` | No | Canvas height (defaults to container) |
| `className` | `string` | No | Additional CSS classes |

## Internal State

```typescript
// Refs
const canvasRef = useRef<HTMLCanvasElement>(null);
const containerRef = useRef<HTMLDivElement>(null);
const animationFrameRef = useRef<number>();

// Tool instances
const toolsRef = useRef<Map<ToolType, ITool>>();

// Mouse position for status bar
const [mousePos, setMousePos] = useState<Point | null>(null);
```

## Rendering Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                  Render Loop (60fps)                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Clear Canvas                                        │
│     └── ctx.clearRect(0, 0, width, height)              │
│                                                         │
│  2. Apply Viewport Transform                            │
│     ├── ctx.save()                                      │
│     ├── ctx.translate(panX, panY)                       │
│     └── ctx.scale(zoom, zoom)                           │
│                                                         │
│  3. Render Grid (if visible)                            │
│     └── Draw grid lines based on gridSize               │
│                                                         │
│  4. Render Entities (sorted by zIndex)                  │
│     ├── RoomRenderer.render(rooms)                      │
│     ├── DuctRenderer.render(ducts)                      │
│     ├── EquipmentRenderer.render(equipment)             │
│     ├── FittingRenderer.render(fittings)                │
│     └── NoteRenderer.render(notes)                      │
│                                                         │
│  5. Render Selection Highlights                         │
│     └── Draw selection handles for selected entities    │
│                                                         │
│  6. Render Tool Overlay                                 │
│     └── activeTool.onRender(ctx)                        │
│                                                         │
│  7. Restore Context                                     │
│     └── ctx.restore()                                   │
│                                                         │
│  8. Schedule Next Frame                                 │
│     └── requestAnimationFrame(render)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Event Handling

### Mouse Events

```typescript
const handleMouseDown = useCallback((e: React.MouseEvent) => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;

  // Convert to canvas coordinates
  const canvasX = (screenX - panX) / zoom;
  const canvasY = (screenY - panY) / zoom;

  // Forward to active tool
  activeTool?.onMouseDown({
    screenX,
    screenY,
    canvasX,
    canvasY,
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey,
    altKey: e.altKey,
    button: e.button,
  });
}, [activeTool, panX, panY, zoom]);
```

### Wheel Event (Zoom)

```typescript
const handleWheel = useCallback((e: WheelEvent) => {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Zoom toward cursor position
  const zoomDelta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
  zoomTo(zoom + zoomDelta, { x: mouseX, y: mouseY });
}, [zoom, zoomTo]);
```

## Grid Rendering

```typescript
const renderGrid = (ctx: CanvasRenderingContext2D) => {
  if (!gridVisible) return;

  const { width, height } = ctx.canvas;

  // Calculate visible area in canvas coordinates
  const startX = Math.floor(-panX / zoom / gridSize) * gridSize;
  const startY = Math.floor(-panY / zoom / gridSize) * gridSize;
  const endX = Math.ceil((width - panX) / zoom / gridSize) * gridSize;
  const endY = Math.ceil((height - panY) / zoom / gridSize) * gridSize;

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1 / zoom;  // Consistent line width regardless of zoom

  // Vertical lines
  for (let x = startX; x <= endX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }
};
```

## Resize Handling

```typescript
useEffect(() => {
  const handleResize = () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Match container size
    const { width, height } = container.getBoundingClientRect();

    // Handle device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale context for device pixel ratio
    const ctx = canvas.getContext('2d');
    ctx?.scale(dpr, dpr);
  };

  handleResize();
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## Component Structure

```tsx
return (
  <div
    ref={containerRef}
    className={cn('canvas-container', className)}
    style={{ width: '100%', height: '100%', overflow: 'hidden' }}
  >
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
      style={{ cursor: getCursor() }}
    />
  </div>
);
```

## Performance Optimizations

1. **requestAnimationFrame** - Syncs with display refresh rate
2. **Entity sorting once** - Sort by zIndex only when entities change
3. **Viewport culling** - Only render visible entities
4. **Canvas caching** - Cache static elements when possible
5. **Event throttling** - Throttle mousemove during intensive operations

```typescript
// Memoize sorted entities
const sortedEntities = useMemo(() => {
  return [...entities].sort((a, b) => a.zIndex - b.zIndex);
}, [entities]);

// Viewport culling
const visibleEntities = useMemo(() => {
  const viewBounds = getViewBounds(panX, panY, zoom, width, height);
  return sortedEntities.filter((e) => boundsIntersect(getEntityBounds(e), viewBounds));
}, [sortedEntities, panX, panY, zoom, width, height]);
```

## Coordinate Systems

```
Screen Coordinates          Canvas Coordinates
(pixels from top-left)      (after pan/zoom transform)

(0,0)─────────────▶ X       (0,0)─────────────▶ X
│                           │
│  ┌────────────┐           │  Entities are
│  │   Canvas   │           │  positioned here
│  │   Element  │           │
│  └────────────┘           │
▼                           ▼
Y                           Y

Conversion:
canvasX = (screenX - panX) / zoom
canvasY = (screenY - panY) / zoom

screenX = canvasX * zoom + panX
screenY = canvasY * zoom + panY
```

## Usage

```tsx
import { CanvasContainer } from '@/features/canvas/components/CanvasContainer';

function CanvasPage() {
  return (
    <div className="flex h-screen">
      <Toolbar />
      <div className="flex-1">
        <CanvasContainer />
      </div>
      <InspectorPanel />
    </div>
  );
}
```

## Related Elements

- [CanvasPage](./CanvasPage.md) - Parent page component
- [Toolbar](./Toolbar.md) - Tool selection toolbar
- [StatusBar](./StatusBar.md) - Cursor position display
- [ZoomControls](./ZoomControls.md) - Zoom buttons
- [ViewportStore](../02-stores/viewportStore.md) - Pan/zoom state
- [SelectionStore](../02-stores/selectionStore.md) - Selection state
- [BaseTool](../04-tools/BaseTool.md) - Tool interface
- [RoomRenderer](../05-renderers/RoomRenderer.md) - Room rendering

## Testing

```typescript
describe('CanvasContainer', () => {
  it('renders without crashing', () => {
    render(<CanvasContainer />);
    expect(screen.getByRole('img')).toBeInTheDocument();  // canvas
  });

  it('handles resize events', () => {
    const { container } = render(<CanvasContainer />);
    const canvas = container.querySelector('canvas');

    // Trigger resize
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(canvas?.width).toBeGreaterThan(0);
  });

  it('forwards mouse events to active tool', () => {
    const mockTool = { onMouseDown: vi.fn() };
    // ... setup tool

    render(<CanvasContainer />);
    fireEvent.mouseDown(screen.getByRole('img'));

    expect(mockTool.onMouseDown).toHaveBeenCalled();
  });

  it('applies viewport transformation', () => {
    // With pan (100, 100) and zoom 2x
    // A click at screen (200, 200) should be canvas (50, 50)
  });
});
```
