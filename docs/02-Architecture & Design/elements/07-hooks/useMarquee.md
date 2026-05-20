# useMarquee Hook

## Overview

The useMarquee hook manages marquee (box) selection state for drag-to-select functionality on the canvas.

## Location

```
src/features/canvas/hooks/useMarquee.ts
```

## Purpose

- Track marquee selection state (active/inactive)
- Store start and current points during drag
- Calculate selection bounds from points
- Provide functions to start, update, and end marquee

## Hook Signature

```typescript
export function useMarquee(): {
  isActive: boolean;
  bounds: Bounds | null;
  startMarquee: (x: number, y: number) => void;
  updateMarquee: (x: number, y: number) => void;
  endMarquee: () => Bounds | null;
  cancelMarquee: () => void;
}
```

## Usage

```typescript
import { useMarquee } from '@/features/canvas/hooks/useMarquee';
import { useSelection } from './useSelection';

function Canvas() {
  const { isActive, bounds, startMarquee, updateMarquee, endMarquee } = useMarquee();
  const { selectInBounds } = useSelection({ screenToCanvas });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !e.shiftKey) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      startMarquee(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isActive) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      updateMarquee(x, y);
    }
  };

  const handleMouseUp = () => {
    if (isActive) {
      const finalBounds = endMarquee();
      if (finalBounds) {
        selectInBounds(finalBounds, false);
      }
    }
  };

  return (
    <canvas
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {isActive && bounds && (
        <rect
          x={bounds.x}
          y={bounds.y}
          width={bounds.width}
          height={bounds.height}
          stroke="blue"
          fill="rgba(0,0,255,0.1)"
        />
      )}
    </canvas>
  );
}
```

## State Flow

```
Start → Update (drag) → End → Select entities in bounds
  ↓         ↓            ↓
  ┌─────────┴────────────┘
  Cancel (Escape key)
```

## Related Elements

- [useSelection](./useSelection.md)
- [Bounds](../11-geometry/Bounds.md)
