# Duct Tool

## Overview

The Duct Tool enables users to draw ductwork on the canvas using a click-drag workflow. It supports grid snapping, displays real-time length preview, enforces minimum length constraints, and automatically calculates duct rotation based on start and end points.

## Location

```
src/features/canvas/tools/DuctTool.ts
```

## Purpose

- Create duct entities with click-drag drawing
- Show real-time preview line during drawing
- Display length label in feet while drawing
- Enforce minimum duct length (1 foot)
- Calculate duct rotation automatically
- Support grid snapping for precise endpoints
- Provide visual feedback for invalid lengths

## Dependencies

- `BaseTool` - Abstract tool base class
- `@/core/commands/entityCommands` - Undo-enabled entity creation
- `@/features/canvas/store/viewportStore` - Grid snapping settings
- `@/features/canvas/entities/ductDefaults` - Duct factory function

## Constants

```typescript
const MIN_DUCT_LENGTH = 12; // 1 foot minimum for usability (in inches)
```

## Tool States

```typescript
interface DuctToolState {
  mode: 'idle' | 'drawing';
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
}
```

## State Diagram

```
    ┌──────┐   Mouse Down   ┌──────────┐
    │ IDLE │ ─────────────▶ │ DRAWING  │
    └──────┘                └────┬─────┘
        ▲                        │
        │                        │ Mouse Move
        │                        │ (update preview)
        │                        │
        │     Mouse Up           │
        │   (valid length)       │
        │        ┌───────────────┘
        │        ▼
        │  ┌───────────┐
        └──│ Create    │
           │ Duct      │
           └───────────┘
                 │
                 │ Escape Key
                 ▼
           ┌──────────┐
           │   IDLE   │
           └──────────┘
```

## Class Interface

```typescript
class DuctTool extends BaseTool {
  readonly name = 'duct';

  private state: DuctToolState;

  getCursor(): string;
  onActivate(): void;
  onDeactivate(): void;
  onMouseDown(event: ToolMouseEvent): void;
  onMouseMove(event: ToolMouseEvent): void;
  onMouseUp(event: ToolMouseEvent): void;
  onKeyDown(event: ToolKeyEvent): void;
  render(context: ToolRenderContext): void;

  protected reset(): void;
  private snapToGrid(x: number, y: number): { x: number; y: number };
  private createDuctEntity(start: Point, end: Point): void;
}
```

## Behavior

### 1. Start Drawing (Mouse Down)

```typescript
onMouseDown(event: ToolMouseEvent): void {
  if (event.button !== 0) return; // Only left click

  const snappedPoint = this.snapToGrid(event.x, event.y);

  this.state = {
    mode: 'drawing',
    startPoint: snappedPoint,
    currentPoint: snappedPoint,
  };
}
```

### 2. Update Preview (Mouse Move)

```typescript
onMouseMove(event: ToolMouseEvent): void {
  if (this.state.mode === 'drawing') {
    const snappedPoint = this.snapToGrid(event.x, event.y);
    this.state.currentPoint = snappedPoint;
    // Preview updates via render() method
  }
}
```

### 3. Create Duct (Mouse Up)

```typescript
onMouseUp(event: ToolMouseEvent): void {
  if (this.state.mode === 'drawing' && this.state.startPoint) {
    const snappedPoint = this.snapToGrid(event.x, event.y);
    this.createDuctEntity(this.state.startPoint, snappedPoint);
  }
  this.reset();
}

private createDuctEntity(start: Point, end: Point): void {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthPixels = Math.sqrt(dx * dx + dy * dy);

  // Enforce minimum length
  if (lengthPixels < MIN_DUCT_LENGTH) {
    return; // Too short, don't create
  }

  // Calculate length in feet and rotation
  const lengthFt = lengthPixels / 12;
  const rotation = Math.atan2(dy, dx) * (180 / Math.PI);

  const duct = createDuct({
    x: start.x,
    y: start.y,
    length: lengthFt,
  });

  // Update the transform rotation
  duct.transform.rotation = rotation;

  createEntity(duct);
}
```

### 4. Cancel Drawing (Escape)

```typescript
onKeyDown(event: ToolKeyEvent): void {
  if (event.key === 'Escape') {
    this.reset();
  }
}

protected reset(): void {
  this.state = {
    mode: 'idle',
    startPoint: null,
    currentPoint: null,
  };
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
  if (this.state.mode !== 'drawing' || !this.state.startPoint || !this.state.currentPoint) {
    return;
  }

  const { ctx, zoom } = context;
  const { startPoint, currentPoint } = this.state;

  // Calculate duct length
  const dx = currentPoint.x - startPoint.x;
  const dy = currentPoint.y - startPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const isValid = length >= MIN_DUCT_LENGTH;

  ctx.save();

  // Draw preview line (red if invalid, gray if valid)
  ctx.strokeStyle = isValid ? '#424242' : '#D32F2F';
  ctx.lineWidth = 12 / zoom; // Approximate duct visual width
  ctx.lineCap = 'round';
  ctx.setLineDash([8 / zoom, 4 / zoom]);

  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(currentPoint.x, currentPoint.y);
  ctx.stroke();

  // Draw length label
  const lengthFt = (length / 12).toFixed(1);
  const midX = (startPoint.x + currentPoint.x) / 2;
  const midY = (startPoint.y + currentPoint.y) / 2;

  ctx.font = `${12 / zoom}px sans-serif`;
  ctx.fillStyle = isValid ? '#424242' : '#D32F2F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${lengthFt}'`, midX, midY - 8 / zoom);

  // Draw endpoints
  ctx.fillStyle = isValid ? '#424242' : '#D32F2F';
  ctx.beginPath();
  ctx.arc(startPoint.x, startPoint.y, 4 / zoom, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(currentPoint.x, currentPoint.y, 4 / zoom, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
```

## Duct Rotation Calculation

The duct rotation is calculated using the arctangent of the delta y and delta x:

```typescript
const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
```

### Rotation Examples

| Start Point | End Point | Delta | Rotation | Direction |
|-------------|-----------|-------|----------|-----------|
| (0, 0) | (100, 0) | (100, 0) | 0° | Right (East) |
| (0, 0) | (0, -100) | (0, -100) | -90° | Up (North) |
| (0, 0) | (-100, 0) | (-100, 0) | 180° | Left (West) |
| (0, 0) | (0, 100) | (0, 100) | 90° | Down (South) |
| (0, 0) | (100, 100) | (100, 100) | 45° | Down-Right (SE) |

## Constraints

| Constraint | Value | Description |
|------------|-------|-------------|
| Minimum Length | 12 inches (1 ft) | Smallest allowed duct length |
| Grid Snap | Configurable | Snaps endpoints when enabled |
| Line Width | 12 pixels | Visual preview width |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `D` | Activate Duct Tool |
| `Escape` | Cancel current drawing |

## Cursor

```typescript
getCursor(): string {
  return 'crosshair';
}
```

## Visual Feedback

### Valid Duct (Length >= 1 foot)

```
Drawing (length >= 1 ft):

    Start
      ●─────────────────●
      │                 │ End
      │    10.5'        │
      │                 │
    Gray dashed line
    with endpoints
    and length label
```

### Invalid Duct (Length < 1 foot)

```
Drawing (length < 1 ft):

    Start
      ●───────●
      │       │ End
      │  0.5' │
      │       │
    Red dashed line
    (will not create)
```

### After Creation

```
Created Duct Entity:

    ──────────────────────
    │  Duct (12" round)  │
    ──────────────────────

    Solid gray rectangle
    Rotated based on endpoints
    Selectable and editable
```

## Usage Example

```typescript
// In CanvasContainer or ToolManager
const ductTool = new DuctTool();

// Activate duct tool (via toolbar or keyboard)
ductTool.onActivate();

// Mouse event forwarding
canvas.addEventListener('mousedown', (e) => {
  const toolEvent = convertToToolEvent(e);
  ductTool.onMouseDown(toolEvent);
});

canvas.addEventListener('mousemove', (e) => {
  const toolEvent = convertToToolEvent(e);
  ductTool.onMouseMove(toolEvent);
});

canvas.addEventListener('mouseup', (e) => {
  const toolEvent = convertToToolEvent(e);
  ductTool.onMouseUp(toolEvent);
});

// Keyboard event forwarding
document.addEventListener('keydown', (e) => {
  const toolEvent = convertToToolKeyEvent(e);
  ductTool.onKeyDown(toolEvent);
});

// Render loop
function renderCanvas() {
  ctx.clearRect(0, 0, width, height);

  // ... render grid, entities, etc.

  // Render duct preview
  ductTool.render({ ctx, zoom, panX, panY });
}
```

## Interaction Flow

```
User Action              Tool State                Canvas Display
─────────────────────────────────────────────────────────────────
1. Click at (100, 100)  mode: 'drawing'           Start point dot
                         startPoint: (100, 100)
                         currentPoint: (100, 100)

2. Move to (200, 150)   currentPoint: (200, 150)  Dashed line preview
                                                   Length label: "9.0'"

3. Move to (300, 100)   currentPoint: (300, 100)  Updated preview
                                                   Length label: "16.7'"

4. Release mouse        mode: 'idle'              Solid duct entity
                         Entity created            Rotation: 0°
                         startPoint: null          Length: 16.7 ft

5. Tool remains active  Ready for next duct       Crosshair cursor
```

## Edge Cases

### Zero-Length Duct

```typescript
// Clicking and releasing at same point
onMouseDown({ x: 100, y: 100 });
onMouseUp({ x: 100, y: 100 });

// Result: No duct created (length = 0 < MIN_DUCT_LENGTH)
```

### Sub-Minimum Length

```typescript
// Drawing a very short duct
onMouseDown({ x: 100, y: 100 });
onMouseUp({ x: 106, y: 100 }); // Only 6 inches

// Result: No duct created, red preview shown
```

### Vertical vs Horizontal Ducts

```typescript
// Horizontal (0° rotation)
createDuctEntity({ x: 0, y: 100 }, { x: 120, y: 100 });
// rotation = Math.atan2(0, 120) * (180/PI) = 0°

// Vertical downward (90° rotation)
createDuctEntity({ x: 100, y: 0 }, { x: 100, y: 120 });
// rotation = Math.atan2(120, 0) * (180/PI) = 90°

// Vertical upward (-90° rotation)
createDuctEntity({ x: 100, y: 120 }, { x: 100, y: 0 });
// rotation = Math.atan2(-120, 0) * (180/PI) = -90°
```

## Related Elements

- [BaseTool](./BaseTool.md) - Abstract base class
- [DuctSchema](../03-schemas/DuctSchema.md) - Duct entity validation
- [DuctDefaults](../08-entities/DuctDefaults.md) - Duct factory function
- [DuctInspector](../01-components/inspector/DuctInspector.md) - Duct property editing
- [DuctRenderer](../05-renderers/DuctRenderer.md) - Duct visualization
- [viewportStore](../02-stores/viewportStore.md) - Grid snapping settings
- [EntityCommands](../09-commands/EntityCommands.md) - Undo support

## Testing

```typescript
describe('DuctTool', () => {
  let tool: DuctTool;
  let mockViewportStore: MockViewportStore;

  beforeEach(() => {
    mockViewportStore = createMockViewportStore({
      snapToGrid: true,
      gridSize: 12,
    });
    tool = new DuctTool();
    tool.onActivate();
  });

  it('starts in idle state', () => {
    expect(tool['state'].mode).toBe('idle');
  });

  it('transitions to drawing on mouse down', () => {
    tool.onMouseDown({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    expect(tool['state'].mode).toBe('drawing');
    expect(tool['state'].startPoint).toEqual({ x: 100, y: 100 });
  });

  it('snaps points to grid when enabled', () => {
    tool.onMouseDown({ x: 105, y: 107, button: 0 } as ToolMouseEvent);

    // Should snap to nearest 12px grid
    expect(tool['state'].startPoint).toEqual({ x: 108, y: 108 });
  });

  it('creates duct on mouse up with valid length', () => {
    tool.onMouseDown({ x: 0, y: 0, button: 0 } as ToolMouseEvent);
    tool.onMouseUp({ x: 120, y: 0, button: 0 } as ToolMouseEvent); // 10 feet

    expect(createEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'duct',
        props: expect.objectContaining({
          length: 10, // 120 pixels / 12 = 10 feet
        }),
        transform: expect.objectContaining({
          rotation: 0, // Horizontal
        }),
      })
    );
  });

  it('calculates correct rotation for vertical duct', () => {
    tool.onMouseDown({ x: 100, y: 0, button: 0 } as ToolMouseEvent);
    tool.onMouseUp({ x: 100, y: 120, button: 0 } as ToolMouseEvent); // Vertical down

    expect(createEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: expect.objectContaining({
          rotation: 90, // Downward
        }),
      })
    );
  });

  it('calculates correct rotation for diagonal duct', () => {
    tool.onMouseDown({ x: 0, y: 0, button: 0 } as ToolMouseEvent);
    tool.onMouseUp({ x: 120, y: 120, button: 0 } as ToolMouseEvent); // 45° diagonal

    expect(createEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: expect.objectContaining({
          rotation: 45,
        }),
      })
    );
  });

  it('does not create duct shorter than minimum', () => {
    tool.onMouseDown({ x: 0, y: 0, button: 0 } as ToolMouseEvent);
    tool.onMouseUp({ x: 6, y: 0, button: 0 } as ToolMouseEvent); // Only 0.5 feet

    expect(createEntity).not.toHaveBeenCalled();
  });

  it('does not create duct with zero length', () => {
    tool.onMouseDown({ x: 100, y: 100, button: 0 } as ToolMouseEvent);
    tool.onMouseUp({ x: 100, y: 100, button: 0 } as ToolMouseEvent); // Same point

    expect(createEntity).not.toHaveBeenCalled();
  });

  it('cancels drawing on Escape', () => {
    tool.onMouseDown({ x: 100, y: 100, button: 0 } as ToolMouseEvent);
    expect(tool['state'].mode).toBe('drawing');

    tool.onKeyDown({ key: 'Escape' } as ToolKeyEvent);

    expect(tool['state'].mode).toBe('idle');
    expect(tool['state'].startPoint).toBeNull();
  });

  it('resets to idle after creating duct', () => {
    tool.onMouseDown({ x: 0, y: 0, button: 0 } as ToolMouseEvent);
    tool.onMouseUp({ x: 120, y: 0, button: 0 } as ToolMouseEvent);

    expect(tool['state'].mode).toBe('idle');
    expect(tool['state'].startPoint).toBeNull();
  });

  it('updates current point on mouse move', () => {
    tool.onMouseDown({ x: 0, y: 0, button: 0 } as ToolMouseEvent);
    tool.onMouseMove({ x: 50, y: 50, button: 0 } as ToolMouseEvent);

    expect(tool['state'].currentPoint).toEqual({ x: 48, y: 48 }); // Snapped to grid
  });

  it('renders preview with valid length indicator', () => {
    const ctx = createMockCanvasContext();
    tool.onMouseDown({ x: 0, y: 0, button: 0 } as ToolMouseEvent);
    tool.onMouseMove({ x: 120, y: 0, button: 0 } as ToolMouseEvent);

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    expect(ctx.strokeStyle).toBe('#424242'); // Gray for valid
    expect(ctx.fillText).toHaveBeenCalledWith('10.0\'', 60, expect.any(Number));
  });

  it('renders preview with invalid length indicator', () => {
    const ctx = createMockCanvasContext();
    tool.onMouseDown({ x: 0, y: 0, button: 0 } as ToolMouseEvent);
    tool.onMouseMove({ x: 6, y: 0, button: 0 } as ToolMouseEvent);

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    expect(ctx.strokeStyle).toBe('#D32F2F'); // Red for invalid
    expect(ctx.fillText).toHaveBeenCalledWith('0.5\'', 3, expect.any(Number));
  });
});
```
