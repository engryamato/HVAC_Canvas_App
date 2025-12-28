# Select Tool

## Overview

The Select Tool is the primary interaction tool for selecting, moving, and manipulating entities on the canvas. It supports single-click selection, multi-selection with Shift, drag-to-move, marquee selection, and keyboard-based operations including deletion, duplication, and arrow key nudging.

## Location

```
src/features/canvas/tools/SelectTool.ts
```

## Purpose

- Select entities by clicking
- Multi-select with Shift+Click
- Drag selected entities to move them
- Marquee (box) selection by click-dragging on empty space
- Delete selected entities with Delete/Backspace
- Duplicate selected entities with Ctrl+D
- Nudge selected entities with arrow keys
- Support undo/redo for all operations

## Dependencies

- `BaseTool` - Abstract tool base class
- `@/core/store/entityStore` - Entity state management
- `@/features/canvas/store/selectionStore` - Selection state
- `@/core/commands/entityCommands` - Undo-enabled commands
- `@/core/geometry/bounds` - Bounding box utilities

## Tool States

```typescript
interface SelectToolState {
  mode: 'idle' | 'dragging' | 'marquee';
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  draggedEntityId: string | null;
  dragOffset: { x: number; y: number } | null;
  initialEntities: Record<string, Entity> | null;
  initialSelection: string[];
  hasMoved: boolean;
}
```

## State Diagram

```
                    ┌─────────────────────────────────┐
                    │                                 │
    ┌───────┐       │   Mouse Down on Empty Space     │
    │       │       │   ┌──────────┐                  │
    │ IDLE  │◄──────┼───│ MARQUEE  │                  │
    │       │       │   └──────────┘                  │
    └───┬───┘       │        │                        │
        │           │        │ Mouse Move             │
        │           │        │ (update selection)     │
        │           │        │                        │
        │           │        ▼                        │
        │           │   Mouse Up                      │
        │           │   (finalize selection)          │
        │           │        │                        │
        │           └────────┼────────────────────────┘
        │                    │
        │ Mouse Down         │
        │ on Entity          │
        ▼                    │
    ┌──────────┐             │
    │ DRAGGING │◄────────────┘
    └────┬─────┘
         │
         │ Mouse Move
         │ (update entity positions)
         │
         ▼
    Mouse Up
    (create move command)
         │
         ▼
    ┌────────┐
    │  IDLE  │
    └────────┘
```

## Class Interface

```typescript
class SelectTool extends BaseTool {
  readonly name = 'select';

  private state: SelectToolState;

  // Lifecycle
  onActivate(): void;
  onDeactivate(): void;

  // Mouse handlers
  onMouseDown(event: ToolMouseEvent): void;
  onMouseMove(event: ToolMouseEvent): void;
  onMouseUp(event: ToolMouseEvent): void;

  // Keyboard handlers
  onKeyDown(event: ToolKeyEvent): void;

  // Rendering
  render(context: ToolRenderContext): void;

  // Internal helpers
  private findEntityAtPoint(x: number, y: number): Entity | null;
  private getEntityBounds(entity: Entity): Bounds;
  private selectEntitiesInBounds(bounds: Bounds, additive: boolean): void;
  protected reset(): void;
}
```

## Behavior

### 1. Single Click Selection

```typescript
onMouseDown(event: ToolMouseEvent): void {
  if (event.button !== 0) return;

  const entity = this.findEntityAtPoint(event.x, event.y);

  if (entity) {
    const { selectedIds, select, toggleSelection } = useSelectionStore.getState();

    if (event.shiftKey) {
      // Shift+Click: toggle selection
      toggleSelection(entity.id);
    } else if (!selectedIds.includes(entity.id)) {
      // Click: replace selection
      select(entity.id);
    }
    // If already selected, keep selection (for drag)

    // Prepare for potential drag
    this.state = {
      mode: 'dragging',
      startPoint: { x: event.x, y: event.y },
      currentPoint: { x: event.x, y: event.y },
      draggedEntityId: entity.id,
      dragOffset: {
        x: event.x - entity.transform.x,
        y: event.y - entity.transform.y,
      },
      initialEntities: this.captureSelectedEntities(),
      initialSelection: [...useSelectionStore.getState().selectedIds],
      hasMoved: false,
    };
  }
}
```

### 2. Marquee Selection

```typescript
onMouseDown(event: ToolMouseEvent): void {
  // ... (continued from above)

  if (!entity) {
    // Clicked on empty space
    if (!event.shiftKey) {
      useSelectionStore.getState().clearSelection();
    }

    this.state = {
      mode: 'marquee',
      startPoint: { x: event.x, y: event.y },
      currentPoint: { x: event.x, y: event.y },
      draggedEntityId: null,
      dragOffset: null,
      initialEntities: null,
      initialSelection: [],
      hasMoved: false,
    };
  }
}

onMouseMove(event: ToolMouseEvent): void {
  if (this.state.mode === 'marquee') {
    this.state.currentPoint = { x: event.x, y: event.y };
    // Render updates automatically via render()
  }
}

onMouseUp(event: ToolMouseEvent): void {
  if (this.state.mode === 'marquee' && this.state.startPoint && this.state.currentPoint) {
    const bounds = boundsFromPoints(this.state.startPoint, this.state.currentPoint);
    this.selectEntitiesInBounds(bounds, event.shiftKey);
  }
  this.reset();
}
```

### 3. Drag to Move

```typescript
onMouseMove(event: ToolMouseEvent): void {
  if (this.state.mode === 'dragging' && this.state.startPoint) {
    const deltaX = event.x - this.state.startPoint.x;
    const deltaY = event.y - this.state.startPoint.y;

    // Update start point for next delta calculation
    this.state.startPoint = { x: event.x, y: event.y };

    const { selectedIds } = useSelectionStore.getState();
    const { byId, updateEntity } = useEntityStore.getState();

    // Move all selected entities
    for (const id of selectedIds) {
      const entity = byId[id];
      if (entity) {
        updateEntity(id, {
          transform: {
            ...entity.transform,
            x: entity.transform.x + deltaX,
            y: entity.transform.y + deltaY,
          },
        });
        this.state.hasMoved = this.state.hasMoved || deltaX !== 0 || deltaY !== 0;
      }
    }
  }
}

onMouseUp(event: ToolMouseEvent): void {
  if (this.state.mode === 'dragging' && this.state.initialEntities && this.state.hasMoved) {
    // Create undo-enabled move commands
    const { byId } = useEntityStore.getState();
    const selectionAfter = [...useSelectionStore.getState().selectedIds];

    Object.entries(this.state.initialEntities).forEach(([id, initialEntity]) => {
      const current = byId[id];
      if (!current) return;

      if (
        current.transform.x !== initialEntity.transform.x ||
        current.transform.y !== initialEntity.transform.y
      ) {
        updateEntityCommand(
          id,
          { transform: { ...current.transform } },
          initialEntity,
          { selectionBefore: this.state.initialSelection, selectionAfter }
        );
      }
    });
  }

  this.reset();
}
```

### 4. Delete Selected

```typescript
onKeyDown(event: ToolKeyEvent): void {
  const { selectedIds, clearSelection } = useSelectionStore.getState();
  const { byId } = useEntityStore.getState();

  if (event.key === 'Delete' || event.key === 'Backspace') {
    const selectionBefore = [...selectedIds];

    for (const id of selectedIds) {
      const entity = byId[id];
      if (entity) {
        deleteEntity(entity, { selectionBefore, selectionAfter: [] });
      }
    }

    clearSelection();
  }
}
```

### 5. Duplicate Selected (Ctrl+D)

```typescript
onKeyDown(event: ToolKeyEvent): void {
  if (event.ctrlKey && event.key === 'd') {
    const { selectedIds, selectMultiple } = useSelectionStore.getState();
    const { byId } = useEntityStore.getState();
    const selectionBefore = [...selectedIds];

    const duplicates: Entity[] = selectedIds
      .map((id) => byId[id])
      .filter((entity): entity is Entity => Boolean(entity))
      .map((entity) => {
        const duplicate = JSON.parse(JSON.stringify(entity)) as Entity;
        duplicate.id = crypto.randomUUID();
        duplicate.transform.x += 24; // Offset by 2 feet
        duplicate.transform.y += 24;
        return duplicate;
      });

    const newIds = duplicates.map((duplicate) => duplicate.id);
    duplicates.forEach((duplicate) =>
      createEntity(duplicate, { selectionBefore, selectionAfter: newIds })
    );

    // Select the duplicated entities
    if (newIds.length > 0) {
      selectMultiple(newIds);
    }
  }
}
```

### 6. Arrow Key Nudging

```typescript
onKeyDown(event: ToolKeyEvent): void {
  const moveAmount = event.shiftKey ? 12 : 1; // Shift = 1 foot, otherwise 1 inch
  let deltaX = 0;
  let deltaY = 0;

  switch (event.key) {
    case 'ArrowUp':
      deltaY = -moveAmount;
      break;
    case 'ArrowDown':
      deltaY = moveAmount;
      break;
    case 'ArrowLeft':
      deltaX = -moveAmount;
      break;
    case 'ArrowRight':
      deltaX = moveAmount;
      break;
  }

  if (deltaX !== 0 || deltaY !== 0) {
    const { selectedIds } = useSelectionStore.getState();
    const { byId } = useEntityStore.getState();
    const selectionBefore = [...selectedIds];
    const selectionAfter = [...selectedIds];

    for (const id of selectedIds) {
      const entity = byId[id];
      if (entity) {
        const previousState = JSON.parse(JSON.stringify(entity)) as Entity;
        updateEntityCommand(
          id,
          {
            transform: {
              ...entity.transform,
              x: entity.transform.x + deltaX,
              y: entity.transform.y + deltaY,
            },
          },
          previousState,
          { selectionBefore, selectionAfter }
        );
      }
    }
  }
}
```

## Marquee Rendering

```typescript
render(context: ToolRenderContext): void {
  if (this.state.mode !== 'marquee' || !this.state.startPoint || !this.state.currentPoint) {
    return;
  }

  const { ctx, zoom } = context;
  const bounds = boundsFromPoints(this.state.startPoint, this.state.currentPoint);

  ctx.save();

  // Blue dashed rectangle with semi-transparent fill
  ctx.strokeStyle = '#3B82F6';
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([4 / zoom, 4 / zoom]);

  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

  ctx.restore();
}
```

## Entity Bounds Detection

```typescript
private getEntityBounds(entity: Entity): Bounds {
  const { x, y } = entity.transform;

  switch (entity.type) {
    case 'room':
      return { x, y, width: entity.props.width, height: entity.props.length };

    case 'equipment':
      return { x, y, width: entity.props.width, height: entity.props.depth };

    case 'duct':
      return {
        x,
        y,
        width: entity.props.length * 12,
        height: entity.props.width ?? entity.props.height ?? 10,
      };

    case 'fitting':
      return { x: x - 15, y: y - 15, width: 30, height: 30 };

    case 'note':
      return { x, y, width: 100, height: 50 };

    case 'group':
      return { x, y, width: 100, height: 100 };

    default:
      return { x, y, width: 50, height: 50 };
  }
}

private findEntityAtPoint(x: number, y: number): Entity | null {
  const { byId, allIds } = useEntityStore.getState();
  const entities = allIds.map((id) => byId[id]).filter((e): e is Entity => e !== undefined);

  // Sort by z-index (highest first) to select topmost entity
  const sortedEntities = [...entities].sort((a, b) => b.zIndex - a.zIndex);

  for (const entity of sortedEntities) {
    const bounds = this.getEntityBounds(entity);
    if (boundsContainsPoint(bounds, { x, y })) {
      return entity;
    }
  }

  return null;
}
```

## Keyboard Shortcuts

| Key | Modifier | Action |
|-----|----------|--------|
| Click | - | Select entity (replace selection) |
| Click | Shift | Toggle entity selection |
| Drag | - | Move selected entities |
| Drag on empty | - | Marquee selection (replace) |
| Drag on empty | Shift | Marquee selection (add to selection) |
| Escape | - | Clear selection |
| Delete / Backspace | - | Delete selected entities |
| D | Ctrl/Cmd | Duplicate selected entities |
| Arrow Keys | - | Nudge 1 inch |
| Arrow Keys | Shift | Nudge 1 foot (12 inches) |

## Cursor States

```typescript
getCursor(): string {
  switch (this.state.mode) {
    case 'dragging':
      return 'move';
    case 'marquee':
      return 'crosshair';
    default:
      return 'default';
  }
}
```

## Visual Feedback

### Marquee Selection

```
Mouse Down              Mouse Dragging           Mouse Up
     ┌──                ┌─ ─ ─ ─ ─ ┐            ┌─────────┐
     │                  │           │            │ ░░░░░░░ │
                        │           │            │ ░░░░░░░ │
                        │           │            │ ░░░░░░░ │
                        └─ ─ ─ ─ ─ ┘            └─────────┘
Start point            Blue dashed box         Entities selected
```

### Drag to Move

```
Mouse Down on Entity   Mouse Dragging           Mouse Up
    ┌────────┐            ┌────────┐                ┌────────┐
    │ Room 1 │    →       │ Room 1 │        →       │ Room 1 │
    └────────┘            └────────┘                └────────┘
    ↑                     ↑ (moving)                (new position)
    Selected              cursor: move              Command created
```

### Duplication (Ctrl+D)

```
Before Duplication     After Duplication
    ┌────────┐             ┌────────┐  ┌────────┐
    │ Room 1 │             │ Room 1 │  │ Room 1 │
    └────────┘             └────────┘  └────────┘
    (selected)             (original)  (duplicate, offset +2ft)
                                       (now selected)
```

## Usage Example

```typescript
// In CanvasContainer
const selectTool = new SelectTool();

// Activate select tool (default tool)
selectTool.onActivate();

// Mouse event forwarding
canvas.addEventListener('mousedown', (e) => {
  const toolEvent = convertToToolEvent(e);
  selectTool.onMouseDown(toolEvent);
});

canvas.addEventListener('mousemove', (e) => {
  const toolEvent = convertToToolEvent(e);
  selectTool.onMouseMove(toolEvent);
});

canvas.addEventListener('mouseup', (e) => {
  const toolEvent = convertToToolEvent(e);
  selectTool.onMouseUp(toolEvent);
});

// Keyboard event forwarding
document.addEventListener('keydown', (e) => {
  const toolEvent = convertToToolKeyEvent(e);
  selectTool.onKeyDown(toolEvent);
});

// Render loop
function renderCanvas() {
  // ... render entities

  // Render tool overlay (marquee selection)
  selectTool.render({ ctx, zoom, panX, panY });
}
```

## Edge Cases

### Clicking on Already-Selected Entity

```typescript
// Doesn't clear selection - allows drag of multi-selection
if (!selectedIds.includes(entity.id)) {
  select(entity.id); // Replace selection
}
// else: keep current selection for drag
```

### Shift+Click Behavior

```typescript
if (event.shiftKey) {
  toggleSelection(entity.id); // Add or remove from selection
} else {
  select(entity.id); // Replace selection
}
```

### Zero-Distance Drag

```typescript
// Only create command if entity actually moved
if (this.state.hasMoved) {
  // Create undo-enabled move command
  updateEntityCommand(id, newTransform, oldTransform, selectionContext);
}
```

## Related Elements

- [BaseTool](./BaseTool.md) - Abstract base class
- [SelectionStore](../02-stores/selectionStore.md) - Selection state management
- [EntityStore](../02-stores/entityStore.md) - Entity state management
- [HistoryStore](../02-stores/historyStore.md) - Undo/redo system
- [entityCommands](../../core/commands/entityCommands.md) - Undo-enabled operations
- [bounds](../../core/geometry/bounds.md) - Bounding box utilities

## Testing

```typescript
describe('SelectTool', () => {
  let tool: SelectTool;
  let mockEntityStore: MockEntityStore;
  let mockSelectionStore: MockSelectionStore;

  beforeEach(() => {
    mockEntityStore = createMockEntityStore();
    mockSelectionStore = createMockSelectionStore();
    tool = new SelectTool();
    tool.onActivate();
  });

  describe('Single Click Selection', () => {
    it('selects entity on click', () => {
      const entity = createMockEntity({ id: '1', x: 100, y: 100 });
      mockEntityStore.addEntity(entity);

      tool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false } as ToolMouseEvent);

      expect(mockSelectionStore.select).toHaveBeenCalledWith('1');
    });

    it('toggles selection with Shift+Click', () => {
      const entity = createMockEntity({ id: '1', x: 100, y: 100 });
      mockEntityStore.addEntity(entity);

      tool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: true } as ToolMouseEvent);

      expect(mockSelectionStore.toggleSelection).toHaveBeenCalledWith('1');
    });

    it('clears selection when clicking empty space', () => {
      tool.onMouseDown({ x: 500, y: 500, button: 0, shiftKey: false } as ToolMouseEvent);

      expect(mockSelectionStore.clearSelection).toHaveBeenCalled();
    });
  });

  describe('Drag to Move', () => {
    it('moves selected entity on drag', () => {
      const entity = createMockEntity({ id: '1', x: 100, y: 100 });
      mockEntityStore.addEntity(entity);
      mockSelectionStore.selectedIds = ['1'];

      tool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false } as ToolMouseEvent);
      tool.onMouseMove({ x: 150, y: 150, button: 0, shiftKey: false } as ToolMouseEvent);
      tool.onMouseUp({ x: 150, y: 150, button: 0, shiftKey: false } as ToolMouseEvent);

      expect(mockEntityStore.updateEntity).toHaveBeenCalledWith('1', {
        transform: expect.objectContaining({ x: 150, y: 150 }),
      });
    });

    it('creates undo command after move', () => {
      const entity = createMockEntity({ id: '1', x: 100, y: 100 });
      mockEntityStore.addEntity(entity);
      mockSelectionStore.selectedIds = ['1'];

      tool.onMouseDown({ x: 100, y: 100, button: 0, shiftKey: false } as ToolMouseEvent);
      tool.onMouseMove({ x: 150, y: 150, button: 0, shiftKey: false } as ToolMouseEvent);
      tool.onMouseUp({ x: 150, y: 150, button: 0, shiftKey: false } as ToolMouseEvent);

      expect(updateEntityCommand).toHaveBeenCalled();
    });
  });

  describe('Marquee Selection', () => {
    it('selects entities in marquee bounds', () => {
      const entity1 = createMockEntity({ id: '1', x: 50, y: 50 });
      const entity2 = createMockEntity({ id: '2', x: 150, y: 150 });
      mockEntityStore.addEntity(entity1);
      mockEntityStore.addEntity(entity2);

      tool.onMouseDown({ x: 0, y: 0, button: 0, shiftKey: false } as ToolMouseEvent);
      tool.onMouseMove({ x: 100, y: 100, button: 0, shiftKey: false } as ToolMouseEvent);
      tool.onMouseUp({ x: 100, y: 100, button: 0, shiftKey: false } as ToolMouseEvent);

      expect(mockSelectionStore.selectMultiple).toHaveBeenCalledWith(['1']);
    });
  });

  describe('Keyboard Operations', () => {
    it('deletes selected entities', () => {
      mockSelectionStore.selectedIds = ['1'];
      const entity = createMockEntity({ id: '1' });
      mockEntityStore.byId['1'] = entity;

      tool.onKeyDown({ key: 'Delete' } as ToolKeyEvent);

      expect(deleteEntity).toHaveBeenCalledWith(entity, expect.any(Object));
    });

    it('duplicates selected entities on Ctrl+D', () => {
      mockSelectionStore.selectedIds = ['1'];
      const entity = createMockEntity({ id: '1', x: 100, y: 100 });
      mockEntityStore.byId['1'] = entity;

      tool.onKeyDown({ ctrlKey: true, key: 'd' } as ToolKeyEvent);

      expect(createEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          transform: expect.objectContaining({ x: 124, y: 124 }), // +24 offset
        }),
        expect.any(Object)
      );
    });

    it('nudges entities with arrow keys', () => {
      mockSelectionStore.selectedIds = ['1'];
      const entity = createMockEntity({ id: '1', x: 100, y: 100 });
      mockEntityStore.byId['1'] = entity;

      tool.onKeyDown({ key: 'ArrowRight', shiftKey: false } as ToolKeyEvent);

      expect(updateEntityCommand).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          transform: expect.objectContaining({ x: 101 }), // +1 inch
        }),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('nudges entities 1 foot with Shift+Arrow', () => {
      mockSelectionStore.selectedIds = ['1'];
      const entity = createMockEntity({ id: '1', x: 100, y: 100 });
      mockEntityStore.byId['1'] = entity;

      tool.onKeyDown({ key: 'ArrowRight', shiftKey: true } as ToolKeyEvent);

      expect(updateEntityCommand).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          transform: expect.objectContaining({ x: 112 }), // +12 inches
        }),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
});
```
