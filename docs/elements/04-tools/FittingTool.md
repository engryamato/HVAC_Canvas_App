# Fitting Tool

## Overview

The Fitting Tool enables users to place ductwork fittings (elbows, tees, transitions, etc.) on the canvas with a single-click placement workflow. It displays a real-time diamond-shaped preview at the cursor position, supports grid snapping, and uses the fitting type selected in the tool store.

## Location

```
src/features/canvas/tools/FittingTool.ts
```

## Purpose

- Place fitting entities with single-click placement
- Show real-time diamond preview at cursor
- Display fitting type label in preview
- Support grid snapping for precise placement
- Use selected fitting type from tool store
- Create fittings centered at click position

## Dependencies

- `BaseTool` - Abstract tool base class
- `@/core/commands/entityCommands` - Undo-enabled entity creation
- `@/features/canvas/store/viewportStore` - Grid snapping settings
- `@/core/store/canvas.store` - Tool state (selected fitting type)
- `@/features/canvas/entities/fittingDefaults` - Fitting factory and labels
- `@/core/schema/fitting.schema` - Fitting type definitions

## Fitting Types

```typescript
type FittingType =
  | 'elbow-90'
  | 'elbow-45'
  | 'tee'
  | 'wye'
  | 'transition'
  | 'reducer'
  | 'damper'
  | 'flex-connector';
```

## Fitting Type Labels

```typescript
const FITTING_TYPE_LABELS: Record<FittingType, string> = {
  'elbow-90': 'EL90',
  'elbow-45': 'EL45',
  'tee': 'TEE',
  'wye': 'WYE',
  'transition': 'TR',
  'reducer': 'RD',
  'damper': 'DMP',
  'flex-connector': 'FC',
};
```

## Tool State

```typescript
interface FittingToolState {
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
    │   Fitting   │        │
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
class FittingTool extends BaseTool {
  readonly name = 'fitting';

  private state: FittingToolState;

  getCursor(): string;
  getSelectedType(): FittingType;
  onActivate(): void;
  onDeactivate(): void;
  onMouseDown(event: ToolMouseEvent): void;
  onMouseMove(event: ToolMouseEvent): void;
  onMouseUp(event: ToolMouseEvent): void;
  onKeyDown(event: ToolKeyEvent): void;
  render(context: ToolRenderContext): void;

  protected reset(): void;
  private snapToGrid(x: number, y: number): { x: number; y: number };
  private createFittingEntity(x: number, y: number): void;
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

### 2. Place Fitting (Mouse Down)

```typescript
onMouseDown(event: ToolMouseEvent): void {
  if (event.button !== 0) return; // Only left click

  const snappedPoint = this.snapToGrid(event.x, event.y);
  this.createFittingEntity(snappedPoint.x, snappedPoint.y);
}

private createFittingEntity(x: number, y: number): void {
  const selectedType = this.getSelectedType();

  const fitting = createFitting(selectedType, { x, y });

  createEntity(fitting);
}
```

### 3. Get Selected Fitting Type

```typescript
getSelectedType(): FittingType {
  return useToolStore.getState().selectedFittingType;
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
  const label = FITTING_TYPE_LABELS[selectedType];

  ctx.save();

  // Draw fitting preview as a small diamond/square rotated 45 degrees
  const size = 12; // Base size in pixels
  const x = currentPoint.x;
  const y = currentPoint.y;

  ctx.fillStyle = 'rgba(255, 152, 0, 0.7)';
  ctx.strokeStyle = '#E65100';
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([4 / zoom, 4 / zoom]);

  // Draw diamond shape
  ctx.beginPath();
  ctx.moveTo(x, y - size);        // Top
  ctx.lineTo(x + size, y);        // Right
  ctx.lineTo(x, y + size);        // Bottom
  ctx.lineTo(x - size, y);        // Left
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw type label below diamond
  ctx.font = `${10 / zoom}px sans-serif`;
  ctx.fillStyle = '#E65100';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, x, y + size + 4 / zoom);

  ctx.restore();
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F` | Activate Fitting Tool |
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
                    ◆
                   ╱ ╲
                  ╱   ╲
                 ╱     ╲    ← Orange dashed diamond
                ◆       ◆      (rotated 45°)
                 ╲     ╱
                  ╲   ╱
                   ╲ ╱
                    ◆
                  EL90       ← Type label

    Preview follows cursor
    Semi-transparent fill
```

### After Placement

```
After Click:

                    ◆
                   ╱ ╲
                  ╱   ╲
                 ╱     ╲    ← Solid orange diamond
                ◆       ◆      fitting entity
                 ╲     ╱
                  ╲   ╱
                   ╲ ╱
                    ◆

    Entity created and selectable
    Preview continues at cursor
```

## Fitting Type Selection

The fitting type is managed by the canvas tool store:

```typescript
// In Toolbar or Fitting selector component
import { useToolStore } from '@/core/store/canvas.store';

function FittingSelector() {
  const { selectedFittingType, setSelectedFittingType } = useToolStore();

  return (
    <select
      value={selectedFittingType}
      onChange={(e) => setSelectedFittingType(e.target.value as FittingType)}
    >
      <option value="elbow-90">90° Elbow</option>
      <option value="elbow-45">45° Elbow</option>
      <option value="tee">Tee</option>
      <option value="wye">Wye</option>
      <option value="transition">Transition</option>
      <option value="reducer">Reducer</option>
      <option value="damper">Damper</option>
      <option value="flex-connector">Flex Connector</option>
    </select>
  );
}
```

## Usage Example

```typescript
// In CanvasContainer or ToolManager
const fittingTool = new FittingTool();

// Set fitting type before activating tool
useToolStore.getState().setSelectedFittingType('elbow-90');

// Activate fitting tool
fittingTool.onActivate();

// Mouse event forwarding
canvas.addEventListener('mousedown', (e) => {
  const toolEvent = convertToToolEvent(e);
  fittingTool.onMouseDown(toolEvent);
});

canvas.addEventListener('mousemove', (e) => {
  const toolEvent = convertToToolEvent(e);
  fittingTool.onMouseMove(toolEvent);
});

// Keyboard event forwarding
document.addEventListener('keydown', (e) => {
  const toolEvent = convertToToolKeyEvent(e);
  fittingTool.onKeyDown(toolEvent);
});

// Render loop
function renderCanvas() {
  ctx.clearRect(0, 0, width, height);

  // ... render grid, entities, etc.

  // Render fitting preview
  fittingTool.render({ ctx, zoom, panX, panY });
}
```

## Interaction Flow

```
User Action                   Tool State              Canvas Display
──────────────────────────────────────────────────────────────────────
1. Select "90° Elbow"        selectedType:           No preview yet
   in toolbar                'elbow-90'

2. Activate Fitting Tool     Tool active             Crosshair cursor

3. Move cursor to (200, 150) currentPoint:           Orange dashed diamond
                              (200, 150)             Label: "EL90"
                                                     Follows cursor

4. Click mouse               Entity created          Solid fitting entity
                              currentPoint:          Preview continues
                              (200, 150)             at cursor

5. Move to (400, 300)        currentPoint:           Preview moves
                              (400, 300)             Ready for next placement

6. Press Escape              currentPoint: null      Preview hidden
```

## Placement Position

Fittings are placed **centered** at the clicked position:

```typescript
// In createFittingEntity
const fitting = createFitting(selectedType, {
  x, // Grid-aligned X (center position)
  y, // Grid-aligned Y (center position)
});
```

This makes it easy to place fittings at duct endpoints or intersections.

## Fitting Dimensions

Fittings are typically small and represented as point entities:

| Property | Value | Description |
|----------|-------|-------------|
| Visual Size | 12px | Diamond size in preview |
| Clickable Area | 30px x 30px | Bounding box for selection (from SelectTool) |
| Transform Position | Center | Entity positioned at center point |

## Common Fitting Types

### 90° Elbow (EL90)
- Changes duct direction by 90 degrees
- Most common fitting type
- Typical pressure loss: 0.25" w.c.

### 45° Elbow (EL45)
- Changes duct direction by 45 degrees
- Lower pressure loss than 90° elbow
- Typical pressure loss: 0.15" w.c.

### Tee (TEE)
- Three-way junction
- Splits or combines airflow
- Requires balancing dampers

### Wye (WYE)
- Two-way split at 45° angle
- Better airflow distribution than tee
- Lower pressure loss

### Transition (TR)
- Changes duct size or shape
- Rectangular to round conversion
- Size reduction/expansion

### Reducer (RD)
- Reduces duct size
- Tapered for smooth airflow
- Maintains pressure

### Damper (DMP)
- Flow control device
- Balancing or shut-off
- Manual or motorized

### Flex Connector (FC)
- Vibration isolation
- Connects rigid to flexible duct
- Sound attenuation

## Related Elements

- [BaseTool](./BaseTool.md) - Abstract base class
- [FittingSchema](../03-schemas/FittingSchema.md) - Fitting entity validation
- [FittingDefaults](../08-entities/fittingDefaults.md) - Fitting factory and labels
- [FittingInspector](../01-components/inspector/FittingInspector.md) - Fitting property editing
- [FittingRenderer](../05-renderers/FittingRenderer.md) - Fitting visualization
- [ViewportStore](../02-stores/viewportStore.md) - Grid snapping settings
- [CanvasStore](../02-stores/canvasStore.md) - Tool state management
- [entityCommands](../../core/commands/entityCommands.md) - Undo support

## Testing

```typescript
describe('FittingTool', () => {
  let tool: FittingTool;
  let mockViewportStore: MockViewportStore;
  let mockToolStore: MockToolStore;

  beforeEach(() => {
    mockViewportStore = createMockViewportStore({
      snapToGrid: true,
      gridSize: 12,
    });
    mockToolStore = createMockToolStore({
      selectedFittingType: 'elbow-90',
    });
    tool = new FittingTool();
    tool.onActivate();
  });

  it('has correct cursor', () => {
    expect(tool.getCursor()).toBe('crosshair');
  });

  it('updates preview position on mouse move', () => {
    tool.onMouseMove({ x: 150, y: 150, button: 0 } as ToolMouseEvent);

    expect(tool['state'].currentPoint).toEqual({ x: 144, y: 144 }); // Snapped to 12px grid
  });

  it('creates fitting on mouse down', () => {
    tool.onMouseDown({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    expect(createEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'fitting',
        props: expect.objectContaining({
          fittingType: 'elbow-90',
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

  it('uses selected fitting type from store', () => {
    mockToolStore.selectedFittingType = 'tee';

    tool.onMouseDown({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    expect(createEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          fittingType: 'tee',
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

  it('renders diamond preview at current point', () => {
    const ctx = createMockCanvasContext();
    tool.onMouseMove({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(96, 84); // Top point
    expect(ctx.lineTo).toHaveBeenCalledWith(108, 96); // Right point
    expect(ctx.lineTo).toHaveBeenCalledWith(96, 108); // Bottom point
    expect(ctx.lineTo).toHaveBeenCalledWith(84, 96); // Left point
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('renders label with correct text', () => {
    const ctx = createMockCanvasContext();
    mockToolStore.selectedFittingType = 'elbow-90';
    tool.onMouseMove({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    expect(ctx.fillText).toHaveBeenCalledWith('EL90', 96, expect.any(Number));
  });

  it('renders different labels for different fitting types', () => {
    const ctx = createMockCanvasContext();

    // Test each fitting type
    const testCases: Array<[FittingType, string]> = [
      ['elbow-90', 'EL90'],
      ['elbow-45', 'EL45'],
      ['tee', 'TEE'],
      ['wye', 'WYE'],
      ['transition', 'TR'],
      ['reducer', 'RD'],
      ['damper', 'DMP'],
      ['flex-connector', 'FC'],
    ];

    testCases.forEach(([type, label]) => {
      mockToolStore.selectedFittingType = type;
      tool.onMouseMove({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

      tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

      expect(ctx.fillText).toHaveBeenCalledWith(label, expect.any(Number), expect.any(Number));
    });
  });

  it('does not render when no current point', () => {
    const ctx = createMockCanvasContext();

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    expect(ctx.fillRect).not.toHaveBeenCalled();
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('continues placing fittings after first placement', () => {
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

  it('places fitting at duct endpoint', () => {
    // Simulate duct endpoint at (240, 120)
    tool.onMouseDown({ x: 240, y: 120, button: 0 } as ToolMouseEvent);

    expect(createEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: expect.objectContaining({
          x: 240, // Exact duct endpoint
          y: 120,
        }),
      })
    );
  });

  it('scales diamond size with zoom', () => {
    const ctx = createMockCanvasContext();
    tool.onMouseMove({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    tool.render({ ctx, zoom: 2, panX: 0, panY: 0 }); // 2x zoom

    // Line width should be scaled
    expect(ctx.lineWidth).toBe(2 / 2); // 1px at 2x zoom
  });
});
```
