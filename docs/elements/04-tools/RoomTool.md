# Room Tool

## Overview

The Room Tool enables users to draw room entities on the canvas using a two-click placement workflow. It is one of the primary entity creation tools in the HVAC Canvas application.

## Location

```
src/features/canvas/tools/RoomTool.ts
```

## Purpose

- Create room entities with a two-click (corner-to-corner) workflow
- Show real-time preview rectangle during drawing
- Display dimension labels while drawing
- Enforce minimum room size constraints
- Support grid snapping for precise placement
- Auto-generate room names (Room 1, Room 2, etc.)

## Dependencies

- `BaseTool` - Abstract tool base class
- `@/core/store/entityStore` - Entity state management
- `@/features/canvas/store/viewportStore` - Grid snapping
- `@/features/canvas/entities/roomDefaults` - Room factory
- `@/core/commands/entityCommands` - Undo support

## Tool States

```typescript
enum RoomToolState {
  IDLE,      // Waiting for first click
  DRAGGING,  // Drawing preview after first click
}
```

## State Diagram

```
    ┌─────────────────────────────────────────────┐
    │                                             │
    │  ┌──────┐   Mouse Down   ┌──────────┐      │
    │  │ IDLE │ ─────────────▶ │ DRAGGING │      │
    │  └──────┘                └────┬─────┘      │
    │      ▲                        │            │
    │      │     Mouse Up           │            │
    │      │   (valid size)         │            │
    │      │        ┌───────────────┘            │
    │      │        ▼                            │
    │      │  ┌───────────┐                      │
    │      └──│ Create    │                      │
    │         │ Room      │                      │
    │         └───────────┘                      │
    │                                             │
    │      ▲  Escape Key                         │
    │      └─────────────────────────────────────┘
```

## Class Interface

```typescript
class RoomTool extends BaseTool {
  readonly name = 'room';

  // Current tool state
  private state: RoomToolState = RoomToolState.IDLE;

  // First corner position
  private startPoint: Point | null = null;

  // Current mouse position (for preview)
  private currentPoint: Point | null = null;

  // Lifecycle methods
  onActivate(): void;
  onDeactivate(): void;

  // Mouse event handlers
  onMouseDown(event: ToolMouseEvent): void;
  onMouseMove(event: ToolMouseEvent): void;
  onMouseUp(event: ToolMouseEvent): void;

  // Keyboard handler
  onKeyDown(event: ToolKeyEvent): void;

  // Render preview overlay
  onRender(ctx: CanvasRenderingContext2D): void;
}
```

## Behavior

### 1. First Click (Start Point)
```typescript
onMouseDown(event: ToolMouseEvent) {
  // Snap to grid if enabled
  const point = this.snapToGrid(event.canvasX, event.canvasY);

  // Store start point
  this.startPoint = point;
  this.state = RoomToolState.DRAGGING;
}
```

### 2. Mouse Move (Preview)
```typescript
onMouseMove(event: ToolMouseEvent) {
  if (this.state === RoomToolState.DRAGGING) {
    // Update current point for preview
    this.currentPoint = this.snapToGrid(event.canvasX, event.canvasY);

    // Request canvas redraw
    this.requestRender();
  }
}
```

### 3. Second Click (Create Room)
```typescript
onMouseUp(event: ToolMouseEvent) {
  if (this.state !== RoomToolState.DRAGGING) return;

  const endPoint = this.snapToGrid(event.canvasX, event.canvasY);

  // Calculate dimensions
  const width = Math.abs(endPoint.x - this.startPoint.x);
  const height = Math.abs(endPoint.y - this.startPoint.y);

  // Enforce minimum size (12 inches = 1 foot)
  if (width >= MIN_ROOM_SIZE && height >= MIN_ROOM_SIZE) {
    // Create room entity
    const room = createRoom({
      x: Math.min(this.startPoint.x, endPoint.x),
      y: Math.min(this.startPoint.y, endPoint.y),
      width,
      height,
    });

    // Add to store with undo support
    createEntity(room);
  }

  // Reset state
  this.reset();
}
```

### 4. Cancel (Escape Key)
```typescript
onKeyDown(event: ToolKeyEvent) {
  if (event.key === 'Escape') {
    this.reset();
  }
}

private reset() {
  this.state = RoomToolState.IDLE;
  this.startPoint = null;
  this.currentPoint = null;
  this.requestRender();
}
```

## Preview Rendering

```typescript
onRender(ctx: CanvasRenderingContext2D) {
  if (this.state !== RoomToolState.DRAGGING || !this.startPoint) return;

  const endPoint = this.currentPoint || this.startPoint;

  // Calculate bounds
  const x = Math.min(this.startPoint.x, endPoint.x);
  const y = Math.min(this.startPoint.y, endPoint.y);
  const width = Math.abs(endPoint.x - this.startPoint.x);
  const height = Math.abs(endPoint.y - this.startPoint.y);

  // Draw preview rectangle
  ctx.strokeStyle = '#1976D2';  // Blue
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);  // Dashed line
  ctx.strokeRect(x, y, width, height);
  ctx.setLineDash([]);  // Reset

  // Draw dimension labels
  this.renderDimensionLabels(ctx, x, y, width, height);
}

private renderDimensionLabels(ctx, x, y, width, height) {
  ctx.fillStyle = '#333';
  ctx.font = '12px sans-serif';

  // Width label (bottom)
  const widthFeet = (width / 12).toFixed(1);
  ctx.fillText(`${widthFeet} ft`, x + width/2 - 15, y + height + 16);

  // Height label (right)
  const heightFeet = (height / 12).toFixed(1);
  ctx.fillText(`${heightFeet} ft`, x + width + 8, y + height/2);
}
```

## Constraints

| Constraint | Value | Description |
|------------|-------|-------------|
| Minimum Width | 12 inches (1 ft) | Smallest allowed room width |
| Minimum Height | 12 inches (1 ft) | Smallest allowed room height |
| Grid Snap | Configurable | Snaps to grid when enabled |

## Keyboard Shortcut

| Key | Action |
|-----|--------|
| `R` | Activate Room Tool |
| `Escape` | Cancel current drawing |

## Cursor

```typescript
getCursor(): string {
  return this.state === RoomToolState.DRAGGING
    ? 'crosshair'
    : 'crosshair';
}
```

## Usage Example

```typescript
// In CanvasContainer
const roomTool = new RoomTool(entityStore, viewportStore);

// When R key pressed or toolbar button clicked
toolManager.setActiveTool('room');
roomTool.onActivate();

// Mouse events forwarded to tool
canvas.addEventListener('mousedown', (e) => roomTool.onMouseDown(toToolEvent(e)));
canvas.addEventListener('mousemove', (e) => roomTool.onMouseMove(toToolEvent(e)));
canvas.addEventListener('mouseup', (e) => roomTool.onMouseUp(toToolEvent(e)));
```

## Visual Feedback

```
During Drawing:
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                        │
│                        │    ← Dashed blue rectangle
│                        │
│                        │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
        10.5 ft           ← Width dimension
                         │
                     8.0 ft  ← Height dimension

After Creation:
┌────────────────────────┐
│                        │
│       Room 1           │    ← Solid blue rectangle
│                        │      with centered name
│                        │
└────────────────────────┘
```

## Related Elements

- [BaseTool](./BaseTool.md) - Abstract base class
- [SelectTool](./SelectTool.md) - Selection tool
- [RoomRenderer](../05-renderers/RoomRenderer.md) - Room visualization
- [RoomDefaults](../08-entities/RoomDefaults.md) - Room factory
- [RoomSchema](../03-schemas/RoomSchema.md) - Room validation
- [RoomInspector](../01-components/inspector/RoomInspector.md) - Room properties

## Testing

```typescript
describe('RoomTool', () => {
  let tool: RoomTool;

  beforeEach(() => {
    tool = new RoomTool(mockEntityStore, mockViewportStore);
    tool.onActivate();
  });

  it('starts in IDLE state', () => {
    expect(tool['state']).toBe(RoomToolState.IDLE);
  });

  it('transitions to DRAGGING on mouse down', () => {
    tool.onMouseDown({ canvasX: 100, canvasY: 100 });
    expect(tool['state']).toBe(RoomToolState.DRAGGING);
    expect(tool['startPoint']).toEqual({ x: 100, y: 100 });
  });

  it('creates room on mouse up with valid size', () => {
    tool.onMouseDown({ canvasX: 0, canvasY: 0 });
    tool.onMouseUp({ canvasX: 120, canvasY: 120 });  // 10ft x 10ft

    expect(mockEntityStore.addEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'room',
        props: expect.objectContaining({
          width: 120,
          height: 120,
        }),
      })
    );
  });

  it('does not create room smaller than minimum', () => {
    tool.onMouseDown({ canvasX: 0, canvasY: 0 });
    tool.onMouseUp({ canvasX: 6, canvasY: 6 });  // Only 0.5ft

    expect(mockEntityStore.addEntity).not.toHaveBeenCalled();
  });

  it('cancels drawing on Escape', () => {
    tool.onMouseDown({ canvasX: 100, canvasY: 100 });
    tool.onKeyDown({ key: 'Escape' });

    expect(tool['state']).toBe(RoomToolState.IDLE);
    expect(tool['startPoint']).toBeNull();
  });
});
```
