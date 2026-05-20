# useEntityOperations Hook

## Overview

The useEntityOperations hook provides entity manipulation functions including delete, duplicate, and move operations with keyboard shortcuts and undo support.

## Location

```
src/features/canvas/hooks/useEntityOperations.ts
```

## Purpose

- Delete selected entities (Delete/Backspace)
- Duplicate selected entities (Ctrl+D) with offset
- Move entities with arrow keys
- Support grid snapping for moves
- Provide undo/redo support for all operations

## Hook Signature

```typescript
export function useEntityOperations(): {
  deleteSelected: () => void;
  duplicateSelected: () => void;
  moveSelected: (deltaX: number, deltaY: number) => void;
  hasSelection: boolean;
  selectionCount: number;
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Delete/Backspace | Delete selected entities |
| Ctrl+D | Duplicate selected |
| Arrow Up | Move up (by gridSize/4 or gridSize with Shift) |
| Arrow Down | Move down |
| Arrow Left | Move left |
| Arrow Right | Move right |

## Usage

```typescript
import { useEntityOperations } from '@/features/canvas/hooks/useEntityOperations';

function CanvasToolbar() {
  const {
    deleteSelected,
    duplicateSelected,
    hasSelection,
    selectionCount,
  } = useEntityOperations();

  return (
    <div>
      <button onClick={deleteSelected} disabled={!hasSelection}>
        Delete ({selectionCount})
      </button>
      <button onClick={duplicateSelected} disabled={!hasSelection}>
        Duplicate
      </button>
    </div>
  );
}
```

## Duplicate Behavior

```typescript
// Duplicate creates clones with offset
const offset = snapToGrid ? gridSize : 24;  // 24px default

clones = selectedEntities.map(entity => ({
  ...entity,
  id: crypto.randomUUID(),  // New ID
  transform: {
    ...entity.transform,
    x: entity.transform.x + offset,
    y: entity.transform.y + offset,
  },
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
}));

// Select the duplicates
selectMultiple(clones.map(c => c.id));
```

## Move Behavior

```typescript
// Arrow key movement
const moveAmount = e.shiftKey ? gridSize : gridSize / 4;

// With grid snapping
if (snapToGrid) {
  newX = Math.round(newX / gridSize) * gridSize;
  newY = Math.round(newY / gridSize) * gridSize;
}
```

## Related Elements

- [EntityCommands](../09-commands/EntityCommands.md)
- [selectionStore](../02-stores/selectionStore.md)
- [viewportStore](../02-stores/viewportStore.md)
