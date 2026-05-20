# selectionStore

## Overview

The selectionStore is a Zustand store that manages the selection state of canvas entities. It provides operations for single selection, multi-selection, hover tracking, and selection manipulation.

## Location

```
src/features/canvas/store/selectionStore.ts
```

## Purpose

- Track currently selected entity IDs
- Support single selection, multi-selection, and deselection
- Manage hover state for visual feedback
- Provide selection toggle with optional force add/remove
- Enable select all and clear operations
- Maintain selection order for operations

## Dependencies

- `zustand` - State management library
- `zustand/middleware/immer` - Immutable state updates

## State Structure

### SelectionState

```typescript
interface SelectionState {
  selectedIds: string[];   // Array of selected entity IDs (maintains order)
  hoveredId: string | null; // Currently hovered entity ID (or null)
}
```

**Initial State**:
```typescript
{
  selectedIds: [],
  hoveredId: null
}
```

**Design Decisions**:
- `selectedIds` is an array (not Set) to maintain selection order
- Order matters for operations like "bring forward" (last selected = topmost)
- `hoveredId` is separate from selection for independent hover effects

## Actions

### Selection Operations

| Action | Signature | Description |
|--------|-----------|-------------|
| `select` | `(id: string) => void` | Select single entity (clears previous selection) |
| `selectSingle` | `(id: string) => void` | Alias for `select` (more explicit naming) |
| `addToSelection` | `(id: string) => void` | Add entity to selection (multi-select) |
| `removeFromSelection` | `(id: string) => void` | Remove entity from selection |
| `toggleSelection` | `(id: string, forceAdd?: boolean) => void` | Toggle entity in/out of selection |
| `selectMultiple` | `(ids: string[]) => void` | Replace selection with multiple IDs |
| `clearSelection` | `() => void` | Clear all selections |
| `selectAll` | `(allIds: string[]) => void` | Select all provided IDs |

### Hover Operations

| Action | Signature | Description |
|--------|-----------|-------------|
| `setHovered` | `(id: string \| null) => void` | Set hovered entity (or null to clear) |

## Implementation Details

### 1. Select Single (Replace Selection)

```typescript
select: (id) =>
  set((state) => {
    state.selectedIds = [id];
  }),
```

**Behavior**:
- Replaces entire selection with single ID
- Clears any previous selections
- Used for simple click (without Ctrl/Cmd)

### 2. Add to Selection (Multi-select)

```typescript
addToSelection: (id) =>
  set((state) => {
    if (!state.selectedIds.includes(id)) {
      state.selectedIds.push(id);
    }
  }),
```

**Behavior**:
- Only adds if not already selected (idempotent)
- Maintains selection order
- Used for Ctrl/Cmd + click

### 3. Remove from Selection

```typescript
removeFromSelection: (id) =>
  set((state) => {
    state.selectedIds = state.selectedIds.filter((s) => s !== id);
  }),
```

**Behavior**:
- Removes ID from selection
- Preserves order of remaining selections
- Does nothing if ID not selected

### 4. Toggle Selection (with Force Option)

```typescript
toggleSelection: (id, forceAdd) =>
  set((state) => {
    if (forceAdd === true) {
      // Force add - always add to selection
      if (!state.selectedIds.includes(id)) {
        state.selectedIds.push(id);
      }
    } else if (forceAdd === false) {
      // Force remove - always remove from selection
      state.selectedIds = state.selectedIds.filter((s) => s !== id);
    } else {
      // Default toggle behavior
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((s) => s !== id);
      } else {
        state.selectedIds.push(id);
      }
    }
  }),
```

**Behavior**:
- `forceAdd = undefined`: Toggle (add if not selected, remove if selected)
- `forceAdd = true`: Always add (equivalent to addToSelection)
- `forceAdd = false`: Always remove (equivalent to removeFromSelection)
- Useful for keyboard modifiers (Ctrl toggles, Shift adds)

### 5. Select Multiple

```typescript
selectMultiple: (ids) =>
  set((state) => {
    state.selectedIds = ids;
  }),
```

**Behavior**:
- Replaces entire selection with provided IDs
- Used for box select or select all

### 6. Select All

```typescript
selectAll: (allIds) =>
  set((state) => {
    state.selectedIds = [...allIds];
  }),
```

**Behavior**:
- Creates new array from provided IDs (avoids reference issues)
- Typically passed from entity store's allIds

## Selectors

### Hook Selectors (React)

Use these in React components for automatic re-renders:

```typescript
// Get all selected IDs
const selectedIds = useSelectedIds();

// Check if specific entity is selected
const isSelected = useIsSelected('room-123');

// Get selection count
const count = useSelectionCount();

// Check if any entities selected
const hasSelection = useHasSelection();

// Get hovered entity ID
const hoveredId = useHoveredId();
```

### Actions Hook

```typescript
const {
  select,
  selectSingle,
  addToSelection,
  removeFromSelection,
  toggleSelection,
  selectMultiple,
  clearSelection,
  selectAll,
  setHovered,
} = useSelectionActions();
```

## Usage Examples

### Single Selection on Click

```typescript
import { useSelectionActions } from '@/features/canvas/store/selectionStore';

function EntityRenderer({ entity }: { entity: Entity }) {
  const { select } = useSelectionActions();

  return (
    <div onClick={() => select(entity.id)}>
      {/* Entity content */}
    </div>
  );
}
```

### Multi-selection with Ctrl/Cmd

```typescript
import { useSelectionActions } from '@/features/canvas/store/selectionStore';

function EntityRenderer({ entity }: { entity: Entity }) {
  const { select, toggleSelection } = useSelectionActions();

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + click: toggle selection
      toggleSelection(entity.id);
    } else {
      // Regular click: single select
      select(entity.id);
    }
  };

  return (
    <div onClick={handleClick}>
      {/* Entity content */}
    </div>
  );
}
```

### Visual Selection Feedback

```typescript
import { useIsSelected, useHoveredId } from '@/features/canvas/store/selectionStore';

function EntityRenderer({ entity }: { entity: Entity }) {
  const isSelected = useIsSelected(entity.id);
  const hoveredId = useHoveredId();
  const isHovered = hoveredId === entity.id;

  return (
    <div
      className={`
        ${isSelected ? 'border-blue-500' : 'border-gray-300'}
        ${isHovered ? 'bg-gray-100' : 'bg-white'}
      `}
    >
      {/* Entity content */}
    </div>
  );
}
```

### Hover Tracking

```typescript
import { useSelectionActions } from '@/features/canvas/store/selectionStore';

function EntityRenderer({ entity }: { entity: Entity }) {
  const { setHovered } = useSelectionActions();

  return (
    <div
      onMouseEnter={() => setHovered(entity.id)}
      onMouseLeave={() => setHovered(null)}
    >
      {/* Entity content */}
    </div>
  );
}
```

### Box Selection

```typescript
import { useSelectionActions } from '@/features/canvas/store/selectionStore';
import { useAllEntities } from '@/core/store/entityStore';

function BoxSelectTool() {
  const entities = useAllEntities();
  const { selectMultiple } = useSelectionActions();
  const [selectionBox, setSelectionBox] = useState<Bounds | null>(null);

  const handleMouseUp = () => {
    if (!selectionBox) return;

    // Find entities within selection box
    const selectedIds = entities
      .filter(entity => isEntityInBounds(entity, selectionBox))
      .map(entity => entity.id);

    selectMultiple(selectedIds);
    setSelectionBox(null);
  };

  return (
    <canvas onMouseUp={handleMouseUp}>
      {/* Draw selection box */}
    </canvas>
  );
}
```

### Select All

```typescript
import { useSelectionActions } from '@/features/canvas/store/selectionStore';
import { useAllEntities } from '@/core/store/entityStore';

function SelectAllButton() {
  const entities = useAllEntities();
  const { selectAll } = useSelectionActions();

  const handleSelectAll = () => {
    const allIds = entities.map(e => e.id);
    selectAll(allIds);
  };

  return <button onClick={handleSelectAll}>Select All (Ctrl+A)</button>;
}
```

### Clear Selection

```typescript
import { useSelectionActions, useHasSelection } from '@/features/canvas/store/selectionStore';

function ClearSelectionButton() {
  const hasSelection = useHasSelection();
  const { clearSelection } = useSelectionActions();

  return (
    <button onClick={clearSelection} disabled={!hasSelection}>
      Clear Selection (Esc)
    </button>
  );
}
```

### Delete Selected Entities

```typescript
import { useSelectedIds, useSelectionActions } from '@/features/canvas/store/selectionStore';
import { deleteEntities } from '@/core/commands/entityCommands';

function DeleteButton() {
  const selectedIds = useSelectedIds();
  const { clearSelection } = useSelectionActions();

  const handleDelete = () => {
    if (selectedIds.length === 0) return;

    // Use command pattern for undo-able deletion
    deleteEntities(selectedIds);

    // Clear selection after delete
    clearSelection();
  };

  return (
    <button onClick={handleDelete} disabled={selectedIds.length === 0}>
      Delete ({selectedIds.length})
    </button>
  );
}
```

### Selection Count Display

```typescript
import { useSelectionCount } from '@/features/canvas/store/selectionStore';

function StatusBar() {
  const selectionCount = useSelectionCount();

  return (
    <div>
      {selectionCount > 0 && (
        <span>{selectionCount} item{selectionCount > 1 ? 's' : ''} selected</span>
      )}
    </div>
  );
}
```

### Keyboard Shortcuts

```typescript
import { useSelectionActions } from '@/features/canvas/store/selectionStore';
import { useAllEntities } from '@/core/store/entityStore';
import { useEffect } from 'react';

function KeyboardShortcuts() {
  const entities = useAllEntities();
  const { selectAll, clearSelection } = useSelectionActions();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A / Cmd+A: Select All
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll(entities.map(e => e.id));
      }

      // Escape: Clear Selection
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entities, selectAll, clearSelection]);

  return null;
}
```

## Performance Optimization

### 1. Fine-grained Selection Checks

**Good** (only re-renders when THIS entity's selection changes):
```typescript
const isSelected = useIsSelected(entity.id);
```

**Bad** (re-renders when ANY selection changes):
```typescript
const selectedIds = useSelectedIds();
const isSelected = selectedIds.includes(entity.id);
```

### 2. Memoize Entity Renderers

```typescript
import { memo } from 'react';
import { useIsSelected } from '@/features/canvas/store/selectionStore';

const EntityRenderer = memo(({ entity }: { entity: Entity }) => {
  const isSelected = useIsSelected(entity.id);

  return <div className={isSelected ? 'selected' : ''}>...</div>;
});
```

Only re-renders when `entity` prop or `isSelected` changes, not on unrelated selections.

### 3. Batch Selection Updates

Use `selectMultiple` instead of multiple `addToSelection` calls:

```typescript
// ✅ Good: Single state update
selectMultiple(['id1', 'id2', 'id3']);

// ❌ Bad: Three state updates (three re-renders)
addToSelection('id1');
addToSelection('id2');
addToSelection('id3');
```

## Selection Order Semantics

The `selectedIds` array maintains insertion order, which is used for:

1. **Z-order operations**: Last selected = topmost
2. **Inspector priority**: Show properties for last selected
3. **Multi-entity operations**: Process in selection order

**Example**:
```typescript
selectedIds = ['room-1', 'duct-2', 'room-3']
// room-3 is last selected (most recent)
// Inspector shows room-3 properties
// "Bring Forward" moves room-3 up in z-order
```

## Integration with Commands

Selection state often needs to be preserved for undo/redo. Use the command pattern:

```typescript
// Command stores selection state
interface MoveCommand extends ReversibleCommand {
  selectionBefore: string[];  // Selection before move
  selectionAfter: string[];   // Selection after move
}

// On undo, restore selectionBefore
// On redo, restore selectionAfter
```

See [HistoryStore](./historyStore.md) and [EntityCommands](../09-commands/EntityCommands.md) for details.

## Related Elements

- [EntityStore](./entityStore.md) - Provides entity data for selected IDs
- [EntityCommands](../09-commands/EntityCommands.md) - Operates on selected entities
- [HistoryStore](./historyStore.md) - Stores selection state in commands
- [ToolManager](../05-tools/ToolManager.md) - Handles selection tool interactions
- [Inspector](../01-components/inspector/Inspector.md) - Shows properties for selected entities
- [DeleteButton](../01-components/toolbar/DeleteButton.md) - Deletes selected entities

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useSelectionStore } from './selectionStore';

describe('selectionStore', () => {
  beforeEach(() => {
    // Reset selection
    useSelectionStore.setState({ selectedIds: [], hoveredId: null });
  });

  it('selects single entity', () => {
    act(() => {
      useSelectionStore.getState().select('room-1');
    });

    expect(useSelectionStore.getState().selectedIds).toEqual(['room-1']);
  });

  it('replaces selection on select', () => {
    act(() => {
      useSelectionStore.getState().select('room-1');
      useSelectionStore.getState().select('room-2');
    });

    expect(useSelectionStore.getState().selectedIds).toEqual(['room-2']);
  });

  it('adds to selection', () => {
    act(() => {
      useSelectionStore.getState().select('room-1');
      useSelectionStore.getState().addToSelection('room-2');
    });

    expect(useSelectionStore.getState().selectedIds).toEqual(['room-1', 'room-2']);
  });

  it('does not add duplicate', () => {
    act(() => {
      useSelectionStore.getState().select('room-1');
      useSelectionStore.getState().addToSelection('room-1');
    });

    expect(useSelectionStore.getState().selectedIds).toEqual(['room-1']);
  });

  it('removes from selection', () => {
    act(() => {
      useSelectionStore.getState().selectMultiple(['room-1', 'room-2', 'room-3']);
      useSelectionStore.getState().removeFromSelection('room-2');
    });

    expect(useSelectionStore.getState().selectedIds).toEqual(['room-1', 'room-3']);
  });

  it('toggles selection', () => {
    act(() => {
      useSelectionStore.getState().toggleSelection('room-1');
    });
    expect(useSelectionStore.getState().selectedIds).toEqual(['room-1']);

    act(() => {
      useSelectionStore.getState().toggleSelection('room-1');
    });
    expect(useSelectionStore.getState().selectedIds).toEqual([]);
  });

  it('toggles with forceAdd=true', () => {
    act(() => {
      useSelectionStore.getState().toggleSelection('room-1', true);
      useSelectionStore.getState().toggleSelection('room-1', true);
    });

    // Should only add once (idempotent)
    expect(useSelectionStore.getState().selectedIds).toEqual(['room-1']);
  });

  it('toggles with forceAdd=false', () => {
    act(() => {
      useSelectionStore.getState().select('room-1');
      useSelectionStore.getState().toggleSelection('room-1', false);
    });

    // Should remove
    expect(useSelectionStore.getState().selectedIds).toEqual([]);
  });

  it('selects multiple entities', () => {
    act(() => {
      useSelectionStore.getState().selectMultiple(['room-1', 'room-2', 'room-3']);
    });

    expect(useSelectionStore.getState().selectedIds).toEqual(['room-1', 'room-2', 'room-3']);
  });

  it('clears selection', () => {
    act(() => {
      useSelectionStore.getState().selectMultiple(['room-1', 'room-2']);
      useSelectionStore.getState().clearSelection();
    });

    expect(useSelectionStore.getState().selectedIds).toEqual([]);
  });

  it('selects all', () => {
    const allIds = ['room-1', 'room-2', 'room-3', 'duct-1'];

    act(() => {
      useSelectionStore.getState().selectAll(allIds);
    });

    expect(useSelectionStore.getState().selectedIds).toEqual(allIds);
  });

  it('sets hovered entity', () => {
    act(() => {
      useSelectionStore.getState().setHovered('room-1');
    });

    expect(useSelectionStore.getState().hoveredId).toBe('room-1');
  });

  it('clears hovered entity', () => {
    act(() => {
      useSelectionStore.getState().setHovered('room-1');
      useSelectionStore.getState().setHovered(null);
    });

    expect(useSelectionStore.getState().hoveredId).toBeNull();
  });
});
```
