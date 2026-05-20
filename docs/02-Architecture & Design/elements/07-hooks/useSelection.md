# useSelection Hook

## Overview

The useSelection hook provides entity selection logic including click selection, shift-click toggle, marquee selection, and hit testing. It translates screen coordinates to canvas coordinates and determines which entities are at specific points.

## Location

```
src/features/canvas/hooks/useSelection.ts
```

## Purpose

- Find entities at screen coordinates
- Handle click selection with shift-toggle
- Support marquee (box) selection
- Calculate entity bounds for hit testing
- Convert screen coordinates to canvas coordinates

## Hook Signature

```typescript
export function useSelection({ screenToCanvas }: UseSelectionOptions): {
  handleClick: (screenX: number, screenY: number, shiftKey: boolean) => Entity | null;
  findEntityAtPoint: (screenX: number, screenY: number) => Entity | null;
  selectInBounds: (bounds: Bounds, additive: boolean) => void;
  getEntityBounds: (entity: Entity) => Bounds;
}
```

## Options

```typescript
interface UseSelectionOptions {
  screenToCanvas: (x: number, y: number) => { x: number; y: number };
}
```

## Functions

### handleClick

Handle mouse click for selection.

```typescript
handleClick(screenX: number, screenY: number, shiftKey: boolean): Entity | null
```

**Behavior:**
- If shift key held: toggle selection of clicked entity
- If no shift key: select only clicked entity
- If click on empty: clear selection (unless shift held)

### findEntityAtPoint

Find top-most entity at screen coordinates.

```typescript
findEntityAtPoint(screenX: number, screenY: number): Entity | null
```

**Algorithm:**
1. Convert screen to canvas coordinates
2. Sort entities by zIndex (descending)
3. Check each entity's bounds
4. Return first entity containing point

### selectInBounds

Select all entities within bounds (for marquee selection).

```typescript
selectInBounds(bounds: Bounds, additive: boolean): void
```

**Behavior:**
- If additive: add to current selection
- If not additive: replace current selection

### getEntityBounds

Calculate bounding box for entity.

```typescript
getEntityBounds(entity: Entity): Bounds
```

**Returns bounds based on type:**
- Room: {x, y, width: props.width, height: props.length}
- Equipment: {x, y, width: props.width, height: props.depth}
- Duct: {x, y, width: props.length*12, height: props.width \| props.height \| 10}
- Fitting: {x-15, y-15, width: 30, height: 30}
- Note: {x, y, width: 100, height: 50}
- Group: {x, y, width: 100, height: 100} (placeholder)

## Usage Examples

### Basic Selection

```typescript
import { useSelection } from '@/features/canvas/hooks/useSelection';
import { useViewport } from './useViewport';

function CanvasComponent() {
  const { screenToCanvas } = useViewport({ canvasRef });
  const { handleClick, findEntityAtPoint } = useSelection({ screenToCanvas });

  const handleMouseDown = (e: React.MouseEvent) => {
    const entity = handleClick(e.clientX, e.clientY, e.shiftKey);
    if (entity) {
      console.log('Selected:', entity.id);
    }
  };

  return <canvas onMouseDown={handleMouseDown} />;
}
```

### Marquee Selection

```typescript
const { selectInBounds, getEntityBounds } = useSelection({ screenToCanvas });

// User drags selection box
const handleMarqueeEnd = (marqueeBounds: Bounds) => {
  selectInBounds(marquee, false);  // Replace selection
};

// Or additive with shift
const handleMarqueeShift = (marqueeBounds) => {
  selectInBounds(marqueeBounds, true);  // Add to selection
};
```

### Hit Testing

```typescript
const { findEntityAtPoint } = useSelection({ screenToCanvas });

const handleHover = (e: MouseEvent) => {
  const entity = findEntityAtPoint(e.clientX, e.clientY);
  if (entity) {
    setHoveredEntity(entity.id);
  } else {
    setHoveredEntity(null);
  }
};
```

## Testing

```typescript
describe('useSelection', () => {
  it('finds entity at point', () => {
    const { result } = renderHook(() => useSelection({ screenToCanvas }));

    const room = createRoom({ x: 100, y: 100, width: 100, length: 100 });
    useEntityStore.getState().addEntity(room);

    const entity = result.current.findEntityAtPoint(150, 150);
    expect(entity?.id).toBe(room.id);
  });

  it('selects top entity by zIndex', () => {
    const room = createRoom({ x: 100, y: 100, zIndex: 1 });
    const duct = createDuct({ x: 100, y: 100, zIndex: 5 });

    useEntityStore.getState().addEntities([room, duct]);

    const entity = result.current.findEntityAtPoint(120, 120);
    expect(entity?.id).toBe(duct.id);  // Higher zIndex
  });

  it('toggles selection with shift key', () => {
    const room = createRoom({ x: 100, y: 100 });
    useEntityStore.getState().addEntity(room);

    // First click: select
    result.current.handleClick(150, 150, false);
    expect(useSelectionStore.getState().selectedIds).toContain(room.id);

    // Shift-click same: deselect
    result.current.handleClick(150, 150, true);
    expect(useSelectionStore.getState().selectedIds).not.toContain(room.id);
  });
});
```

## Related Elements

- [selectionStore](../02-stores/selectionStore.md)
- [entityStore](../02-stores/entityStore.md)
- [useMarquee](./useMarquee.md)
- [useViewport](./useViewport.md)
- [Bounds](../11-geometry/Bounds.md)
