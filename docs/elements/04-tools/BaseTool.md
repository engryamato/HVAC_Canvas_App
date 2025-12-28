# Base Tool

## Overview

The BaseTool is an abstract base class that provides the foundation for all canvas interaction tools in the HVAC Canvas application. It defines the standardized interface and default implementations for tool lifecycle, event handling, and rendering.

## Location

```
src/features/canvas/tools/BaseTool.ts
```

## Purpose

- Define the `ITool` interface that all tools must implement
- Provide `BaseTool` abstract class with default no-op implementations
- Standardize mouse and keyboard event handling across all tools
- Support tool lifecycle management (activation/deactivation)
- Enable custom cursor styles per tool
- Provide render context for tool-specific visual previews

## Dependencies

None - this is a standalone base class.

## Tool Interface

```typescript
interface ITool {
  /** Unique tool name (e.g., 'select', 'duct', 'room') */
  readonly name: string;

  /** Get cursor style for this tool */
  getCursor(): string;

  /** Called when tool is activated */
  onActivate(): void;

  /** Called when tool is deactivated */
  onDeactivate(): void;

  /** Handle mouse down event */
  onMouseDown(event: ToolMouseEvent): void;

  /** Handle mouse move event */
  onMouseMove(event: ToolMouseEvent): void;

  /** Handle mouse up event */
  onMouseUp(event: ToolMouseEvent): void;

  /** Handle key down event */
  onKeyDown(event: ToolKeyEvent): void;

  /** Handle key up event */
  onKeyUp(event: ToolKeyEvent): void;

  /** Render tool preview (e.g., placement preview) */
  render(context: ToolRenderContext): void;
}
```

## Event Data Structures

### ToolMouseEvent

```typescript
interface ToolMouseEvent {
  /** X coordinate in canvas space */
  x: number;
  /** Y coordinate in canvas space */
  y: number;
  /** X coordinate in screen space */
  screenX: number;
  /** Y coordinate in screen space */
  screenY: number;
  /** Whether shift key is pressed */
  shiftKey: boolean;
  /** Whether ctrl/cmd key is pressed */
  ctrlKey: boolean;
  /** Whether alt key is pressed */
  altKey: boolean;
  /** Mouse button (0=left, 1=middle, 2=right) */
  button: number;
}
```

### ToolKeyEvent

```typescript
interface ToolKeyEvent {
  /** Key code */
  key: string;
  /** Key code (e.g., 'KeyA', 'Space') */
  code: string;
  /** Whether shift key is pressed */
  shiftKey: boolean;
  /** Whether ctrl/cmd key is pressed */
  ctrlKey: boolean;
  /** Whether alt key is pressed */
  altKey: boolean;
  /** Whether this is a repeat event */
  repeat: boolean;
}
```

### ToolRenderContext

```typescript
interface ToolRenderContext {
  ctx: CanvasRenderingContext2D;
  zoom: number;
  panX: number;
  panY: number;
}
```

## Abstract Base Class

```typescript
abstract class BaseTool implements ITool {
  abstract readonly name: string;

  getCursor(): string {
    return 'default';
  }

  onActivate(): void {
    // Override in subclass if needed
  }

  onDeactivate(): void {
    // Override in subclass if needed
  }

  onMouseDown(_event: ToolMouseEvent): void {
    // Override in subclass if needed
  }

  onMouseMove(_event: ToolMouseEvent): void {
    // Override in subclass if needed
  }

  onMouseUp(_event: ToolMouseEvent): void {
    // Override in subclass if needed
  }

  onKeyDown(_event: ToolKeyEvent): void {
    // Override in subclass if needed
  }

  onKeyUp(_event: ToolKeyEvent): void {
    // Override in subclass if needed
  }

  render(_context: ToolRenderContext): void {
    // Override in subclass if needed
  }

  protected reset(): void {
    // Override in subclass if needed
  }
}
```

## Tool Lifecycle

```
┌─────────────────────────────────────────────┐
│                                             │
│  Tool Manager                               │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │  setActiveTool(toolName)            │   │
│  │       │                             │   │
│  │       ▼                             │   │
│  │  currentTool.onDeactivate()         │   │
│  │       │                             │   │
│  │       ▼                             │   │
│  │  newTool.onActivate()               │   │
│  │       │                             │   │
│  │       ▼                             │   │
│  │  currentTool = newTool              │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

## Mouse Event Flow

```
User Mouse Interaction
        │
        ▼
┌───────────────────┐
│ CanvasContainer   │
│                   │
│ handleMouseDown   │──┐
│ handleMouseMove   │  │ Convert to ToolMouseEvent
│ handleMouseUp     │  │ (canvas coordinates)
└───────────────────┘  │
        │              │
        ▼              │
┌───────────────────┐◄─┘
│ Active Tool       │
│                   │
│ onMouseDown()     │
│ onMouseMove()     │
│ onMouseUp()       │
└───────────────────┘
```

## Keyboard Event Flow

```
User Keyboard Input
        │
        ▼
┌───────────────────┐
│ CanvasContainer   │
│                   │
│ handleKeyDown     │──┐
│ handleKeyUp       │  │ Convert to ToolKeyEvent
└───────────────────┘  │
        │              │
        ▼              │
┌───────────────────┐◄─┘
│ Active Tool       │
│                   │
│ onKeyDown()       │
│ onKeyUp()         │
└───────────────────┘
```

## Render Flow

```
┌────────────────────────┐
│ Animation Frame Loop   │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│ CanvasContainer        │
│ renderCanvas()         │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│ Render all entities    │
└────────────┬───────────┘
             │
             ▼
┌────────────────────────┐
│ activeTool.render()    │
│ (preview overlay)      │
└────────────────────────┘
```

## Implementing a Custom Tool

### 1. Extend BaseTool

```typescript
import { BaseTool, type ToolMouseEvent, type ToolRenderContext } from './BaseTool';

export class MyCustomTool extends BaseTool {
  readonly name = 'myTool';

  private state: MyToolState = {
    mode: 'idle',
    // ... tool-specific state
  };

  getCursor(): string {
    return this.state.mode === 'active' ? 'crosshair' : 'default';
  }

  onActivate(): void {
    this.reset();
  }

  onDeactivate(): void {
    this.reset();
  }

  protected reset(): void {
    this.state = { mode: 'idle' };
  }
}
```

### 2. Implement Mouse Handlers

```typescript
onMouseDown(event: ToolMouseEvent): void {
  if (event.button !== 0) return; // Only handle left click

  // Tool-specific logic
  this.state.mode = 'active';
  this.state.startPoint = { x: event.x, y: event.y };
}

onMouseMove(event: ToolMouseEvent): void {
  if (this.state.mode === 'active') {
    this.state.currentPoint = { x: event.x, y: event.y };
  }
}

onMouseUp(event: ToolMouseEvent): void {
  if (this.state.mode === 'active') {
    // Create entity, execute command, etc.
    this.completeAction(event);
    this.reset();
  }
}
```

### 3. Implement Keyboard Handlers

```typescript
onKeyDown(event: ToolKeyEvent): void {
  // Escape key cancels operation
  if (event.key === 'Escape') {
    this.reset();
    return;
  }

  // Tool-specific shortcuts
  if (event.shiftKey && event.key === 'Tab') {
    this.cycleThroughOptions();
  }
}
```

### 4. Implement Render Method

```typescript
render(context: ToolRenderContext): void {
  if (this.state.mode !== 'active') return;

  const { ctx, zoom } = context;

  ctx.save();

  // Draw preview visualization
  ctx.strokeStyle = '#2196F3';
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([4 / zoom, 4 / zoom]);

  // ... render tool-specific preview

  ctx.restore();
}
```

## Cursor Styles

Common cursor values for tools:

| Cursor | Use Case |
|--------|----------|
| `'default'` | Select tool (idle) |
| `'crosshair'` | Drawing tools (duct, room, equipment) |
| `'move'` | Select tool (dragging) |
| `'text'` | Note tool |
| `'pointer'` | Hovering over clickable element |
| `'not-allowed'` | Invalid operation |

## Best Practices

### State Management

```typescript
// ✅ Good: Store minimal state in tool
private state: DuctToolState = {
  mode: 'idle',
  startPoint: null,
  currentPoint: null,
};

// ❌ Bad: Duplicating entity store data
private state = {
  allEntities: [...], // Don't duplicate store data
  selectedIds: [...], // Access from store instead
};
```

### Event Handling

```typescript
// ✅ Good: Check button before processing
onMouseDown(event: ToolMouseEvent): void {
  if (event.button !== 0) return; // Only left click
  // ... handle event
}

// ✅ Good: Check tool state
onMouseMove(event: ToolMouseEvent): void {
  if (this.state.mode === 'idle') return;
  // ... handle move
}

// ❌ Bad: Processing all events unconditionally
onMouseDown(event: ToolMouseEvent): void {
  // This runs for right-clicks too!
  this.startDrawing(event);
}
```

### Cleanup

```typescript
// ✅ Good: Always reset state on deactivate
onDeactivate(): void {
  this.reset(); // Clear any in-progress operations
}

// ✅ Good: Reset after completing action
onMouseUp(event: ToolMouseEvent): void {
  this.createEntity();
  this.reset(); // Back to idle state
}

// ❌ Bad: Leaving dangling state
onDeactivate(): void {
  // State persists when switching tools!
}
```

### Rendering

```typescript
// ✅ Good: Scale line width by zoom
render(context: ToolRenderContext): void {
  const { ctx, zoom } = context;
  ctx.lineWidth = 2 / zoom; // Consistent visual width
  ctx.setLineDash([4 / zoom, 4 / zoom]); // Consistent dash pattern
}

// ❌ Bad: Fixed pixel values
render(context: ToolRenderContext): void {
  const { ctx } = context;
  ctx.lineWidth = 2; // Gets huge when zoomed in
}
```

## Tool Registration

```typescript
// In ToolManager or CanvasContainer
const tools: Map<string, ITool> = new Map([
  ['select', new SelectTool()],
  ['room', new RoomTool()],
  ['duct', new DuctTool()],
  ['equipment', new EquipmentTool()],
  ['fitting', new FittingTool()],
  ['note', new NoteTool()],
]);

function setActiveTool(toolName: string): void {
  const newTool = tools.get(toolName);
  if (!newTool) return;

  currentTool?.onDeactivate();
  currentTool = newTool;
  currentTool.onActivate();
}
```

## Related Elements

- [SelectTool](./SelectTool.md) - Selection and manipulation
- [DuctTool](./DuctTool.md) - Duct drawing
- [EquipmentTool](./EquipmentTool.md) - Equipment placement
- [FittingTool](./FittingTool.md) - Fitting placement
- [NoteTool](./NoteTool.md) - Note annotations
- [RoomTool](./RoomTool.md) - Room drawing
- [CanvasContainer](../01-components/canvas/CanvasContainer.md) - Tool integration

## Testing

```typescript
describe('BaseTool', () => {
  class TestTool extends BaseTool {
    readonly name = 'test';
    activateCount = 0;
    deactivateCount = 0;

    onActivate(): void {
      this.activateCount++;
    }

    onDeactivate(): void {
      this.deactivateCount++;
    }
  }

  it('provides default cursor', () => {
    const tool = new TestTool();
    expect(tool.getCursor()).toBe('default');
  });

  it('calls lifecycle methods', () => {
    const tool = new TestTool();

    tool.onActivate();
    expect(tool.activateCount).toBe(1);

    tool.onDeactivate();
    expect(tool.deactivateCount).toBe(1);
  });

  it('provides no-op default event handlers', () => {
    const tool = new TestTool();

    // Should not throw
    expect(() => {
      tool.onMouseDown({ x: 0, y: 0, button: 0 } as ToolMouseEvent);
      tool.onMouseMove({ x: 10, y: 10, button: 0 } as ToolMouseEvent);
      tool.onMouseUp({ x: 10, y: 10, button: 0 } as ToolMouseEvent);
      tool.onKeyDown({ key: 'a', code: 'KeyA' } as ToolKeyEvent);
      tool.onKeyUp({ key: 'a', code: 'KeyA' } as ToolKeyEvent);
      tool.render({} as ToolRenderContext);
    }).not.toThrow();
  });
});
```

## Tool State Patterns

### Single-Click Placement (Equipment, Fitting, Note)

```typescript
onMouseDown(event: ToolMouseEvent): void {
  const point = this.snapToGrid(event.x, event.y);
  this.createEntity(point);
  // No state change - always ready for next click
}
```

### Click-Drag Drawing (Duct, Room)

```typescript
onMouseDown(event: ToolMouseEvent): void {
  this.state = {
    mode: 'drawing',
    startPoint: this.snapToGrid(event.x, event.y),
  };
}

onMouseMove(event: ToolMouseEvent): void {
  if (this.state.mode === 'drawing') {
    this.state.currentPoint = this.snapToGrid(event.x, event.y);
  }
}

onMouseUp(event: ToolMouseEvent): void {
  if (this.state.mode === 'drawing') {
    this.createEntity(this.state.startPoint, this.state.currentPoint);
    this.reset();
  }
}
```

### Selection and Drag (Select)

```typescript
onMouseDown(event: ToolMouseEvent): void {
  const entity = this.findEntityAtPoint(event.x, event.y);

  if (entity) {
    this.state.mode = 'dragging';
    this.state.draggedEntityId = entity.id;
  } else {
    this.state.mode = 'marquee';
  }

  this.state.startPoint = { x: event.x, y: event.y };
}
```
