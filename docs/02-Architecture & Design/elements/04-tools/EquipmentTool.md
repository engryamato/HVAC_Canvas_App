# Equipment Tool

## Overview

The Equipment Tool enables users to place HVAC equipment on the canvas with a single-click placement workflow. It displays a real-time preview at the cursor position, supports grid snapping, and uses the equipment type selected in the tool store.

## Location

```
src/features/canvas/tools/EquipmentTool.ts
```

## Purpose

- Place equipment entities with single-click placement
- Show real-time preview rectangle at cursor
- Display equipment type label in preview
- Support grid snapping for precise placement
- Use selected equipment type from tool store
- Create equipment with appropriate default dimensions

## Dependencies

- `BaseTool` - Abstract tool base class
- `@/core/commands/entityCommands` - Undo-enabled entity creation
- `@/features/canvas/store/viewportStore` - Grid snapping settings
- `@/core/store/canvas.store` - Tool state (selected equipment type)
- `@/features/canvas/entities/equipmentDefaults` - Equipment factory and defaults
- `@/core/schema/equipment.schema` - Equipment type definitions

## Equipment Types

```typescript
type EquipmentType =
  | 'hood'
  | 'fan'
  | 'diffuser'
  | 'damper'
  | 'air_handler'
  | 'furnace'
  | 'rtu';
```

## Tool State

```typescript
interface EquipmentToolState {
  currentPoint: { x: number; y: number } | null;
}
```

## State Diagram

```
    ┌──────┐
    │      │  Mouse Move
    │ IDLE │◄──────────────┐
    │      │               │
    └───┬──┘               │
        │                  │
        │ Mouse Down       │ (update preview position)
        │                  │
        ▼                  │
    ┌─────────────┐        │
    │   Create    │        │
    │  Equipment  │        │
    └─────────────┘        │
        │                  │
        │                  │
        └──────────────────┘

    Escape Key
        │
        ▼
    Clear preview position
```

## Class Interface

```typescript
class EquipmentTool extends BaseTool {
  readonly name = 'equipment';

  private state: EquipmentToolState;

  getCursor(): string;
  getSelectedType(): EquipmentType;
  onActivate(): void;
  onDeactivate(): void;
  onMouseDown(event: ToolMouseEvent): void;
  onMouseMove(event: ToolMouseEvent): void;
  onMouseUp(event: ToolMouseEvent): void;
  onKeyDown(event: ToolKeyEvent): void;
  render(context: ToolRenderContext): void;

  protected reset(): void;
  private snapToGrid(x: number, y: number): { x: number; y: number };
  private createEquipmentEntity(x: number, y: number): void;
}
```

## Behavior

### 1. Track Cursor Position (Mouse Move)

```typescript
onMouseMove(event: ToolMouseEvent): void {
  const snappedPoint = this.snapToGrid(event.x, event.y);
  this.state.currentPoint = snappedPoint;
  // Preview updates via render() method
}
```

### 2. Place Equipment (Mouse Down)

```typescript
onMouseDown(event: ToolMouseEvent): void {
  if (event.button !== 0) return; // Only left click

  const snappedPoint = this.snapToGrid(event.x, event.y);
  this.createEquipmentEntity(snappedPoint.x, snappedPoint.y);
}

private createEquipmentEntity(x: number, y: number): void {
  const selectedType = this.getSelectedType();

  // Place equipment at the snapped position (corner, not centered)
  // This ensures the transform position is grid-aligned
  const equipment = createEquipment(selectedType, { x, y });

  createEntity(equipment);
}
```

### 3. Get Selected Equipment Type

```typescript
getSelectedType(): EquipmentType {
  return useToolStore.getState().selectedEquipmentType;
}
```

### 4. Clear Preview (Escape)

```typescript
onKeyDown(event: ToolKeyEvent): void {
  if (event.key === 'Escape') {
    this.state.currentPoint = null;
  }
}
```

### 5. No-op Mouse Up

```typescript
onMouseUp(_event: ToolMouseEvent): void {
  // Single click placement, nothing to do on mouse up
}
```

## Grid Snapping

```typescript
private snapToGrid(x: number, y: number): { x: number; y: number } {
  const { snapToGrid, gridSize } = useViewportStore.getState();

  if (!snapToGrid) {
    return { x, y };
  }

  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}
```

## Preview Rendering

```typescript
render(context: ToolRenderContext): void {
  if (!this.state.currentPoint) {
    return;
  }

  const { ctx, zoom } = context;
  const currentPoint = this.state.currentPoint;
  const selectedType = this.getSelectedType();
  const defaults = EQUIPMENT_TYPE_DEFAULTS[selectedType];

  ctx.save();

  // Draw preview rectangle at cursor
  const x = currentPoint.x - defaults.width / 2;
  const y = currentPoint.y - defaults.depth / 2;

  ctx.fillStyle = 'rgba(255, 243, 224, 0.7)';
  ctx.strokeStyle = '#E65100';
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([6 / zoom, 4 / zoom]);

  ctx.fillRect(x, y, defaults.width, defaults.depth);
  ctx.strokeRect(x, y, defaults.width, defaults.depth);

  // Draw type label
  ctx.font = `${10 / zoom}px sans-serif`;
  ctx.fillStyle = '#E65100';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(selectedType.toUpperCase(), currentPoint.x, currentPoint.y);

  ctx.restore();
}
```

## Equipment Type Defaults

```typescript
const EQUIPMENT_TYPE_DEFAULTS: Record<EquipmentType, EquipmentDefaults> = {
  hood: {
    capacity: 1200,
    staticPressure: 0.5,
    width: 48,
    depth: 36,
    height: 24,
  },
  fan: {
    capacity: 2000,
    staticPressure: 1.0,
    width: 24,
    depth: 24,
    height: 24,
  },
  diffuser: {
    capacity: 150,
    staticPressure: 0.1,
    width: 24,
    depth: 24,
    height: 6,
  },
  damper: {
    capacity: 500,
    staticPressure: 0.05,
    width: 12,
    depth: 6,
    height: 12,
  },
  air_handler: {
    capacity: 10000,
    staticPressure: 2.0,
    width: 72,
    depth: 48,
    height: 60,
  },
  furnace: {
    capacity: 80000,
    staticPressure: 0.5,
    width: 24,
    depth: 36,
    height: 48,
  },
  rtu: {
    capacity: 12000,
    staticPressure: 1.5,
    width: 84,
    depth: 48,
    height: 36,
  },
};
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `E` | Activate Equipment Tool |
| `Escape` | Clear preview (hide placement indicator) |

## Cursor

```typescript
getCursor(): string {
  return 'crosshair';
}
```

## Visual Feedback

### Preview at Cursor

```
Before Click:

         Cursor position (snapped to grid)
                    │
                    ▼
    ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
    │                       │
    │                       │
    │    AIR-HANDLER        │  ← Orange dashed rectangle
    │                       │    with type label
    │                       │
    └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

    Preview follows cursor
    Semi-transparent fill
```

### After Placement

```
After Click:

    ┌───────────────────────┐
    │                       │
    │                       │
    │    Air Handler        │  ← Solid orange rectangle
    │    2000 CFM           │    with equipment details
    │                       │
    └───────────────────────┘

    Entity created and selectable
    Preview continues at cursor
```

## Equipment Type Selection

The equipment type is managed by the canvas tool store:

```typescript
// In Toolbar or Equipment selector component
import { useToolStore } from '@/core/store/canvas.store';

function EquipmentSelector() {
  const { selectedEquipmentType, setSelectedEquipmentType } = useToolStore();

  return (
    <select
      value={selectedEquipmentType}
      onChange={(e) => setSelectedEquipmentType(e.target.value as EquipmentType)}
    >
      <option value="hood">Exhaust Hood</option>
      <option value="fan">Fan</option>
      <option value="diffuser">Diffuser</option>
      <option value="damper">Damper</option>
      <option value="air_handler">Air Handling Unit</option>
      <option value="furnace">Furnace</option>
      <option value="rtu">RTU</option>
    </select>
  );
}
```

## Usage Example

```typescript
// In CanvasContainer or ToolManager
const equipmentTool = new EquipmentTool();

// Set equipment type before activating tool
useToolStore.getState().setSelectedEquipmentType('air_handler');

// Activate equipment tool
equipmentTool.onActivate();

// Mouse event forwarding
canvas.addEventListener('mousedown', (e) => {
  const toolEvent = convertToToolEvent(e);
  equipmentTool.onMouseDown(toolEvent);
});

canvas.addEventListener('mousemove', (e) => {
  const toolEvent = convertToToolEvent(e);
  equipmentTool.onMouseMove(toolEvent);
});

// Keyboard event forwarding
document.addEventListener('keydown', (e) => {
  const toolEvent = convertToToolKeyEvent(e);
  equipmentTool.onKeyDown(toolEvent);
});

// Render loop
function renderCanvas() {
  ctx.clearRect(0, 0, width, height);

  // ... render grid, entities, etc.

  // Render equipment preview
  equipmentTool.render({ ctx, zoom, panX, panY });
}
```

## Interaction Flow

```
User Action                   Tool State              Canvas Display
──────────────────────────────────────────────────────────────────────
1. Select "Air Handling Unit" selectedType:          No preview yet
   in toolbar                 'air_handler'

2. Activate Equipment Tool   Tool active             Crosshair cursor

3. Move cursor to (200, 150) currentPoint:           Orange dashed rectangle
                              (200, 150)             Label: "AIR_HANDLER"
                                                     Follows cursor

4. Click mouse               Entity created          Solid equipment entity
                              currentPoint:          Preview continues
                              (200, 150)             at cursor

5. Move to (400, 300)        currentPoint:           Preview moves
                              (400, 300)             Ready for next placement

6. Press Escape              currentPoint: null      Preview hidden
```

## Placement Position

The equipment is placed with its **corner** at the clicked position (not centered):

```typescript
// In createEquipmentEntity
const equipment = createEquipment(selectedType, {
  x, // Grid-aligned X (corner position)
  y, // Grid-aligned Y (corner position)
});
```

This ensures the transform position is grid-aligned, making it easier to snap equipment to precise locations.

The **preview** is centered on the cursor for better visual feedback:

```typescript
// In render()
const x = currentPoint.x - defaults.width / 2;  // Center preview
const y = currentPoint.y - defaults.depth / 2;  // on cursor
```

## Equipment Dimensions

Default dimensions for each equipment type:

| Equipment Type | Width | Depth | Height | Primary Capacity |
|----------------|-------|-------|--------|------------------|
| Exhaust Hood | 48" (4ft) | 36" (3ft) | 24" (2ft) | 1200 CFM |
| Fan | 24" (2ft) | 24" (2ft) | 24" (2ft) | 2000 CFM |
| Diffuser | 24" (2ft) | 24" (2ft) | 6" (0.5ft) | 150 CFM |
| Damper | 12" (1ft) | 6" (0.5ft) | 12" (1ft) | 500 CFM |
| Air Handling Unit | 72" (6ft) | 48" (4ft) | 60" (5ft) | 10000 CFM |
| Furnace | 24" (2ft) | 36" (3ft) | 48" (4ft) | 80000 CFM |
| RTU | 84" (7ft) | 48" (4ft) | 36" (3ft) | 12000 CFM |

## Related Elements

- [BaseTool](./BaseTool.md) - Abstract base class
- [EquipmentSchema](../03-schemas/EquipmentSchema.md) - Equipment entity validation
- [EquipmentDefaults](../08-entities/EquipmentDefaults.md) - Equipment factory and defaults
- [EquipmentInspector](../01-components/inspector/EquipmentInspector.md) - Equipment property editing
- [EquipmentRenderer](../05-renderers/EquipmentRenderer.md) - Equipment visualization
- [viewportStore](../02-stores/viewportStore.md) - Grid snapping settings
- [canvasStore](../02-stores/canvasStore.md) - Tool state management
- [EntityCommands](../09-commands/EntityCommands.md) - Undo support

## Testing

```typescript
describe('EquipmentTool', () => {
  let tool: EquipmentTool;
  let mockViewportStore: MockViewportStore;
  let mockToolStore: MockToolStore;

  beforeEach(() => {
    mockViewportStore = createMockViewportStore({
      snapToGrid: true,
      gridSize: 12,
    });
    mockToolStore = createMockToolStore({
      selectedEquipmentType: 'air_handler',
    });
    tool = new EquipmentTool();
    tool.onActivate();
  });

  it('has correct cursor', () => {
    expect(tool.getCursor()).toBe('crosshair');
  });

  it('updates preview position on mouse move', () => {
    tool.onMouseMove({ x: 150, y: 150, button: 0 } as ToolMouseEvent);

    expect(tool['state'].currentPoint).toEqual({ x: 144, y: 144 }); // Snapped to 12px grid
  });

  it('creates equipment on mouse down', () => {
    tool.onMouseDown({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    expect(createEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'equipment',
        props: expect.objectContaining({
          equipmentType: 'air-handler',
        }),
        transform: expect.objectContaining({
          x: 96,  // Snapped to grid
          y: 96,
        }),
      })
    );
  });

  it('snaps position to grid when enabled', () => {
    tool.onMouseDown({ x: 105, y: 107, button: 0 } as ToolMouseEvent);

    expect(createEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: expect.objectContaining({
          x: 108, // Snapped to nearest 12px
          y: 108,
        }),
      })
    );
  });

  it('does not snap when grid snapping is disabled', () => {
    mockViewportStore.snapToGrid = false;

    tool.onMouseDown({ x: 105, y: 107, button: 0 } as ToolMouseEvent);

    expect(createEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: expect.objectContaining({
          x: 105, // Exact position
          y: 107,
        }),
      })
    );
  });

  it('uses selected equipment type from store', () => {
    mockToolStore.selectedEquipmentType = 'furnace';

    tool.onMouseDown({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    expect(createEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          equipmentType: 'furnace',
        }),
      })
    );
  });

  it('clears preview position on Escape', () => {
    tool.onMouseMove({ x: 100, y: 100, button: 0 } as ToolMouseEvent);
    expect(tool['state'].currentPoint).toBeTruthy();

    tool.onKeyDown({ key: 'Escape' } as ToolKeyEvent);

    expect(tool['state'].currentPoint).toBeNull();
  });

  it('clears preview on deactivate', () => {
    tool.onMouseMove({ x: 100, y: 100, button: 0 } as ToolMouseEvent);
    expect(tool['state'].currentPoint).toBeTruthy();

    tool.onDeactivate();

    expect(tool['state'].currentPoint).toBeNull();
  });

  it('renders preview at current point', () => {
    const ctx = createMockCanvasContext();
    tool.onMouseMove({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.strokeRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith('AIR-HANDLER', 96, 96);
  });

  it('does not render when no current point', () => {
    const ctx = createMockCanvasContext();

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('renders with correct dimensions for equipment type', () => {
    const ctx = createMockCanvasContext();
    mockToolStore.selectedEquipmentType = 'air-handler';
    tool.onMouseMove({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    // Air handler: 48" x 36"
    expect(ctx.fillRect).toHaveBeenCalledWith(
      96 - 48 / 2, // x (centered)
      96 - 36 / 2, // y (centered)
      48,          // width
      36           // depth
    );
  });

  it('continues placing equipment after first placement', () => {
    // First placement
    tool.onMouseDown({ x: 100, y: 100, button: 0 } as ToolMouseEvent);
    expect(createEntity).toHaveBeenCalledTimes(1);

    // Second placement
    tool.onMouseDown({ x: 200, y: 200, button: 0 } as ToolMouseEvent);
    expect(createEntity).toHaveBeenCalledTimes(2);

    // Third placement
    tool.onMouseDown({ x: 300, y: 300, button: 0 } as ToolMouseEvent);
    expect(createEntity).toHaveBeenCalledTimes(3);
  });

  it('ignores non-left-click buttons', () => {
    tool.onMouseDown({ x: 100, y: 100, button: 1 } as ToolMouseEvent); // Middle click
    expect(createEntity).not.toHaveBeenCalled();

    tool.onMouseDown({ x: 100, y: 100, button: 2 } as ToolMouseEvent); // Right click
    expect(createEntity).not.toHaveBeenCalled();
  });
});
```
