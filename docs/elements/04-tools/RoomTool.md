# Room Tool

## Overview

The Room Tool enables users to draw room entities on the canvas using a two-click placement workflow. It is one of the primary entity creation tools in the HVAC Canvas application.

## Location

```
src/features/canvas/tools/RoomTool.ts
```

## Purpose

- Create room entities with drag-to-size or two-click placement
- Show real-time preview rectangle during drawing
- Display dimension labels while drawing
- Enforce minimum room size constraints
- Support grid snapping for precise placement
- Auto-generate room names (Room 1, Room 2, etc.)

## Dependencies

- `BaseTool` - Abstract tool base class
- `@/features/canvas/store/viewportStore` - Grid snapping
- `@/features/canvas/store/selectionStore` - Selection updates
- `@/features/canvas/entities/roomDefaults` - Room factory
- `@/core/commands/entityCommands` - Undo support

## Tool States

```typescript
interface RoomToolState {
  mode: 'idle' | 'placing' | 'dragging';
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
}
```

## State Diagram

```
IDLE → (Mouse Down) → DRAGGING
DRAGGING → (Mouse Up, valid size) → Create Room → IDLE
DRAGGING → (Mouse Up, too small) → PLACING → (Mouse Down) → Create Room → IDLE
Escape resets to IDLE
```

## Class Interface

```typescript
class RoomTool extends BaseTool {
  readonly name = 'room';

  private state: RoomToolState;

  onActivate(): void;
  onDeactivate(): void;
  onMouseDown(event: ToolMouseEvent): void;
  onMouseMove(event: ToolMouseEvent): void;
  onMouseUp(event: ToolMouseEvent): void;
  onKeyDown(event: ToolKeyEvent): void;
  render(context: ToolRenderContext): void;

  protected reset(): void;
  private snapToGrid(x: number, y: number): { x: number; y: number };
  private createRoomEntity(start: Point, end: Point): void;
}
```

## Behavior

### 1. First Click (Start Point)
```typescript
onMouseDown(event: ToolMouseEvent) {
  if (event.button !== 0) return;

  const snappedPoint = this.snapToGrid(event.x, event.y);

  if (this.state.mode === 'idle') {
    this.state = {
      mode: 'dragging',
      startPoint: snappedPoint,
      currentPoint: snappedPoint,
    };
  } else if (this.state.mode === 'placing' && this.state.startPoint) {
    this.createRoomEntity(this.state.startPoint, snappedPoint);
    this.reset();
  }
}
```

### 2. Mouse Move (Preview)
```typescript
onMouseMove(event: ToolMouseEvent) {
  if (this.state.mode === 'dragging' || this.state.mode === 'placing') {
    const snappedPoint = this.snapToGrid(event.x, event.y);
    this.state.currentPoint = snappedPoint;
  }
}
```

### 3. Mouse Up (Create or Switch Mode)
```typescript
onMouseUp(event: ToolMouseEvent) {
  if (this.state.mode === 'dragging' && this.state.startPoint) {
    const snappedPoint = this.snapToGrid(event.x, event.y);
    const dx = Math.abs(snappedPoint.x - this.state.startPoint.x);
    const dy = Math.abs(snappedPoint.y - this.state.startPoint.y);

    if (dx >= MIN_ROOM_SIZE && dy >= MIN_ROOM_SIZE) {
      this.createRoomEntity(this.state.startPoint, snappedPoint);
      this.reset();
    } else {
      this.state.mode = 'placing';
    }
  }
}
```

### 4. Cancel (Escape Key)
```typescript
onKeyDown(event: ToolKeyEvent) {
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

## Preview Rendering

```typescript
render(context: ToolRenderContext) {
  if ((this.state.mode !== 'placing' && this.state.mode !== 'dragging') || !this.state.startPoint || !this.state.currentPoint) {
    return;
  }

  const { ctx, zoom } = context;
  const { startPoint, currentPoint } = this.state;

  const x = Math.min(startPoint.x, currentPoint.x);
  const y = Math.min(startPoint.y, currentPoint.y);
  const width = Math.abs(currentPoint.x - startPoint.x);
  const height = Math.abs(currentPoint.y - startPoint.y);

  const isValid = width >= MIN_ROOM_SIZE && height >= MIN_ROOM_SIZE;

  ctx.save();
  ctx.fillStyle = isValid ? 'rgba(227, 242, 253, 0.7)' : 'rgba(255, 200, 200, 0.5)';
  ctx.strokeStyle = isValid ? '#1976D2' : '#D32F2F';
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([6 / zoom, 4 / zoom]);

  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  const widthFt = (width / 12).toFixed(1);
  const heightFt = (height / 12).toFixed(1);
  ctx.font = `${12 / zoom}px sans-serif`;
  ctx.fillStyle = isValid ? '#1976D2' : '#D32F2F';
  ctx.textAlign = 'center';
  ctx.fillText(`${widthFt}' × ${heightFt}'`, x + width / 2, y + height / 2);

  ctx.restore();
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
  return 'crosshair';
}
```

## Usage Example

```typescript
// In CanvasContainer
const roomTool = new RoomTool();

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
- [viewportStore](../02-stores/viewportStore.md) - Grid snapping
- [selectionStore](../02-stores/selectionStore.md) - Selection updates
- [EntityCommands](../09-commands/EntityCommands.md) - Undo support

## Testing

```typescript
describe('RoomTool', () => {
  let tool: RoomTool;

  beforeEach(() => {
    tool = new RoomTool();
    tool.onActivate();
  });

  it('starts in idle mode', () => {
    expect(tool['state'].mode).toBe('idle');
  });

  it('enters dragging mode on mouse down', () => {
    tool.onMouseDown({ x: 100, y: 100, button: 0 } as ToolMouseEvent);
    expect(tool['state'].mode).toBe('dragging');
  });

  it('switches to placing when dragged below minimum', () => {
    tool.onMouseDown({ x: 0, y: 0, button: 0 } as ToolMouseEvent);
    tool.onMouseUp({ x: 6, y: 6, button: 0 } as ToolMouseEvent);
    expect(tool['state'].mode).toBe('placing');
  });

  it('resets on Escape', () => {
    tool.onMouseDown({ x: 100, y: 100, button: 0 } as ToolMouseEvent);
    tool.onKeyDown({ key: 'Escape' } as ToolKeyEvent);
    expect(tool['state'].mode).toBe('idle');
  });
});
```
