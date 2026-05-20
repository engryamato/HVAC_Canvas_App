# SelectionMarquee

## Overview

The SelectionMarquee component renders a rectangular selection box that appears when the user click-drags on the canvas to select multiple entities. It provides visual feedback during the selection process and calculates which entities fall within the selection bounds.

## Location

```
src/features/canvas/components/SelectionMarquee.tsx
```

## Purpose

- Display visual selection rectangle during drag selection
- Calculate entities within selection bounds
- Support additive selection (Shift+drag)
- Provide intersection vs containment selection modes
- Handle viewport transformations (zoom/pan)

## Dependencies

- `@/features/canvas/store/viewportStore` - Viewport transforms
- `@/features/canvas/store/entityStore` - Entity selection
- `@/features/canvas/utils/geometry` - Bounds calculations

## Visual Representation

```
Canvas during selection:

┌────────────────────────────────────────────────┐
│                                                │
│    ┌─────────────────────────────┐             │
│    │  [Room A]      ┌───────┐   │             │
│    │                │Marquee│───┼─ Selection  │
│    │    [Duct]      │  Box  │   │   boundary  │
│    │                └───────┘   │             │
│    └─────────────────────────────┘             │
│         ↑                                      │
│     Start point                                │
│                                                │
└────────────────────────────────────────────────┘

Visual style:
- Blue border (dashed)
- Light blue fill (10% opacity)
- Animates during drag
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `startPoint` | `Point` | Yes | Selection start position (canvas coords) |
| `endPoint` | `Point` | Yes | Current drag position (canvas coords) |
| `mode` | `'intersect' \| 'contain'` | No | Selection mode |
| `visible` | `boolean` | No | Whether marquee is visible |

## Component Implementation

```tsx
interface Point {
  x: number;
  y: number;
}

interface SelectionMarqueeProps {
  startPoint: Point;
  endPoint: Point;
  mode?: 'intersect' | 'contain';
  visible?: boolean;
}

export function SelectionMarquee({
  startPoint,
  endPoint,
  mode = 'intersect',
  visible = true,
}: SelectionMarqueeProps) {
  const { zoom, panX, panY } = useViewportStore();

  if (!visible) return null;

  // Calculate rectangle bounds
  const bounds = useMemo(() => {
    const minX = Math.min(startPoint.x, endPoint.x);
    const minY = Math.min(startPoint.y, endPoint.y);
    const maxX = Math.max(startPoint.x, endPoint.x);
    const maxY = Math.max(startPoint.y, endPoint.y);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [startPoint, endPoint]);

  // Transform to screen coordinates
  const screenBounds = useMemo(() => ({
    x: bounds.x * zoom + panX,
    y: bounds.y * zoom + panY,
    width: bounds.width * zoom,
    height: bounds.height * zoom,
  }), [bounds, zoom, panX, panY]);

  return (
    <div
      className="selection-marquee"
      style={{
        left: screenBounds.x,
        top: screenBounds.y,
        width: screenBounds.width,
        height: screenBounds.height,
      }}
      data-mode={mode}
    />
  );
}
```

## Selection Logic Hook

```typescript
interface UseMarqueeSelectionOptions {
  mode?: 'intersect' | 'contain';
  additive?: boolean; // Shift key held
}

export function useMarqueeSelection(options: UseMarqueeSelectionOptions = {}) {
  const { mode = 'intersect', additive = false } = options;
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);

  const { allIds, byId, setSelectedIds, selectedIds } = useEntityStore();
  const { screenToCanvas } = useViewportStore();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only

    const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY });
    setStartPoint(canvasPoint);
    setEndPoint(canvasPoint);
    setIsSelecting(true);
  }, [screenToCanvas]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting) return;

    const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY });
    setEndPoint(canvasPoint);
  }, [isSelecting, screenToCanvas]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !startPoint || !endPoint) return;

    // Calculate selection bounds
    const selectionBounds = {
      x: Math.min(startPoint.x, endPoint.x),
      y: Math.min(startPoint.y, endPoint.y),
      width: Math.abs(endPoint.x - startPoint.x),
      height: Math.abs(endPoint.y - startPoint.y),
    };

    // Find entities within bounds
    const selectedEntities = allIds.filter((id) => {
      const entity = byId[id];
      const entityBounds = getEntityBounds(entity);

      if (mode === 'contain') {
        return isContainedIn(entityBounds, selectionBounds);
      } else {
        return intersects(entityBounds, selectionBounds);
      }
    });

    // Update selection
    if (additive) {
      const newSelection = new Set([...selectedIds, ...selectedEntities]);
      setSelectedIds(Array.from(newSelection));
    } else {
      setSelectedIds(selectedEntities);
    }

    // Reset state
    setIsSelecting(false);
    setStartPoint(null);
    setEndPoint(null);
  }, [isSelecting, startPoint, endPoint, allIds, byId, mode, additive, selectedIds, setSelectedIds]);

  return {
    isSelecting,
    startPoint,
    endPoint,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
    },
  };
}
```

## Geometry Utilities

```typescript
interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Check if bounds A intersects with bounds B
function intersects(a: Bounds, b: Bounds): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

// Check if bounds A is fully contained in bounds B
function isContainedIn(a: Bounds, b: Bounds): boolean {
  return (
    a.x >= b.x &&
    a.y >= b.y &&
    a.x + a.width <= b.x + b.width &&
    a.y + a.height <= b.y + b.height
  );
}

// Get entity bounds based on entity type
function getEntityBounds(entity: Entity): Bounds {
  switch (entity.type) {
    case 'room':
      return getRoomBounds(entity);
    case 'duct':
      return getDuctBounds(entity);
    case 'equipment':
      return getEquipmentBounds(entity);
    case 'fitting':
      return getFittingBounds(entity);
    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}
```

## Styling

```css
.selection-marquee {
  position: absolute;
  pointer-events: none;
  border: 1px dashed #1976D2;
  background: rgba(25, 118, 210, 0.1);
  z-index: 1000;
  animation: marquee-pulse 1s ease-in-out infinite;
}

.selection-marquee[data-mode="contain"] {
  border-style: solid;
  border-width: 2px;
}

@keyframes marquee-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .selection-marquee {
    border-width: 2px;
    border-color: #000;
    background: rgba(0, 0, 0, 0.2);
  }
}
```

## Usage

```tsx
import { SelectionMarquee, useMarqueeSelection } from '@/features/canvas/components/SelectionMarquee';

function CanvasContainer() {
  const shiftHeld = useKeyState('Shift');

  const {
    isSelecting,
    startPoint,
    endPoint,
    handlers,
  } = useMarqueeSelection({
    mode: 'intersect',
    additive: shiftHeld,
  });

  return (
    <div
      className="canvas-container"
      {...handlers}
    >
      <canvas ref={canvasRef} />

      {isSelecting && startPoint && endPoint && (
        <SelectionMarquee
          startPoint={startPoint}
          endPoint={endPoint}
          mode="intersect"
        />
      )}
    </div>
  );
}
```

## Selection Modes

| Mode | Behavior | Visual |
|------|----------|--------|
| `intersect` | Selects entities that touch the marquee | Dashed border |
| `contain` | Selects entities fully inside the marquee | Solid border |

## Keyboard Modifiers

| Key | Effect |
|-----|--------|
| `Shift` | Add to existing selection |
| `Alt` | Switch to contain mode |
| `Ctrl/Cmd` | Toggle individual items |

## Related Elements

- [CanvasContainer](./CanvasContainer.md) - Parent canvas component
- [entityStore](../../02-stores/entityStore.md) - Selection state
- [viewportStore](../../02-stores/viewportStore.md) - Coordinate transforms
- [useSelection](../../07-hooks/useSelection.md) - Selection utilities

## Testing

```typescript
describe('SelectionMarquee', () => {
  it('renders with correct bounds', () => {
    render(
      <SelectionMarquee
        startPoint={{ x: 100, y: 100 }}
        endPoint={{ x: 200, y: 200 }}
      />
    );

    const marquee = document.querySelector('.selection-marquee');
    expect(marquee).toHaveStyle({
      left: '100px',
      top: '100px',
      width: '100px',
      height: '100px',
    });
  });

  it('handles inverted selection (drag up-left)', () => {
    render(
      <SelectionMarquee
        startPoint={{ x: 200, y: 200 }}
        endPoint={{ x: 100, y: 100 }}
      />
    );

    const marquee = document.querySelector('.selection-marquee');
    expect(marquee).toHaveStyle({
      left: '100px',
      top: '100px',
      width: '100px',
      height: '100px',
    });
  });

  it('applies contain mode styling', () => {
    render(
      <SelectionMarquee
        startPoint={{ x: 100, y: 100 }}
        endPoint={{ x: 200, y: 200 }}
        mode="contain"
      />
    );

    const marquee = document.querySelector('.selection-marquee');
    expect(marquee).toHaveAttribute('data-mode', 'contain');
  });

  it('does not render when not visible', () => {
    render(
      <SelectionMarquee
        startPoint={{ x: 100, y: 100 }}
        endPoint={{ x: 200, y: 200 }}
        visible={false}
      />
    );

    expect(document.querySelector('.selection-marquee')).not.toBeInTheDocument();
  });
});

describe('useMarqueeSelection', () => {
  it('calculates entities in selection bounds', () => {
    useEntityStore.setState({
      byId: {
        room1: { id: 'room1', type: 'room', position: { x: 150, y: 150 }, ... },
        room2: { id: 'room2', type: 'room', position: { x: 500, y: 500 }, ... },
      },
      allIds: ['room1', 'room2'],
    });

    const { result } = renderHook(() => useMarqueeSelection());

    // Simulate selection from (100, 100) to (300, 300)
    act(() => {
      result.current.handlers.onMouseDown(mockEvent(100, 100));
    });
    act(() => {
      result.current.handlers.onMouseMove(mockEvent(300, 300));
    });
    act(() => {
      result.current.handlers.onMouseUp();
    });

    const { selectedIds } = useEntityStore.getState();
    expect(selectedIds).toContain('room1');
    expect(selectedIds).not.toContain('room2');
  });

  it('supports additive selection', () => {
    useEntityStore.setState({
      selectedIds: ['existing'],
      // ... entities
    });

    const { result } = renderHook(() => useMarqueeSelection({ additive: true }));

    // Perform selection...

    const { selectedIds } = useEntityStore.getState();
    expect(selectedIds).toContain('existing');
  });
});
```
