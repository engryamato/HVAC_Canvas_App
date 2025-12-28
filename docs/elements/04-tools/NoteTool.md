# Note Tool

## Overview

The Note Tool enables users to place text annotations on the canvas with a single-click placement workflow. It displays a real-time preview box at the cursor position, supports grid snapping, and creates notes with default placeholder text that can be edited later.

## Location

```
src/features/canvas/tools/NoteTool.ts
```

## Purpose

- Place note entities with single-click placement
- Show real-time preview box at cursor with sample text
- Display small pin/tack icon in preview
- Support grid snapping for precise placement
- Create notes with default "New Note" text
- Position notes at top-left corner (not centered)

## Dependencies

- `BaseTool` - Abstract tool base class
- `@/core/commands/entityCommands` - Undo-enabled entity creation
- `@/features/canvas/store/viewportStore` - Grid snapping settings
- `@/features/canvas/entities/noteDefaults` - Note factory function

## Tool State

```typescript
interface NoteToolState {
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
    │    Note     │        │
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
class NoteTool extends BaseTool {
  readonly name = 'note';

  private state: NoteToolState;

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
  private createNoteEntity(x: number, y: number): void;
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

### 2. Place Note (Mouse Down)

```typescript
onMouseDown(event: ToolMouseEvent): void {
  if (event.button !== 0) return; // Only left click

  const snappedPoint = this.snapToGrid(event.x, event.y);
  this.createNoteEntity(snappedPoint.x, snappedPoint.y);
}

private createNoteEntity(x: number, y: number): void {
  const note = createNote({
    x,
    y,
    content: 'New Note',
  });

  createEntity(note);
}
```

### 3. Clear Preview (Escape)

```typescript
onKeyDown(event: ToolKeyEvent): void {
  if (event.key === 'Escape') {
    this.state.currentPoint = null;
  }
}
```

### 4. No-op Mouse Up

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

  ctx.save();

  // Draw note preview
  const previewText = 'Click to add note';
  const fontSize = 14;
  const padding = 4;

  ctx.font = `${fontSize / zoom}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Measure text for background
  const metrics = ctx.measureText(previewText);
  const textWidth = metrics.width;
  const textHeight = fontSize / zoom;

  // Draw background
  ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
  ctx.strokeStyle = '#F9A825';
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([4 / zoom, 4 / zoom]);

  ctx.fillRect(
    currentPoint.x,
    currentPoint.y,
    textWidth + (padding * 2) / zoom,
    textHeight + (padding * 2) / zoom
  );
  ctx.strokeRect(
    currentPoint.x,
    currentPoint.y,
    textWidth + (padding * 2) / zoom,
    textHeight + (padding * 2) / zoom
  );

  // Draw text
  ctx.fillStyle = '#666666';
  ctx.fillText(previewText, currentPoint.x + padding / zoom, currentPoint.y + padding / zoom);

  // Draw note icon (small pin/tack)
  const iconX = currentPoint.x - 8 / zoom;
  const iconY = currentPoint.y;
  ctx.fillStyle = '#F9A825';
  ctx.beginPath();
  ctx.arc(iconX, iconY, 3 / zoom, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Activate Note Tool |
| `Escape` | Clear preview (hide placement indicator) |

## Cursor

```typescript
getCursor(): string {
  return 'text';
}
```

The text cursor (I-beam) indicates that this tool creates text annotations.

## Visual Feedback

### Preview at Cursor

```
Before Click:

   Cursor position (snapped to grid)
          │
          ▼
      ●  ┌─────────────────────┐
         │ Click to add note   │  ← Yellow sticky note preview
         └─────────────────────┘    with dashed border
         ↑                          and pin icon
     Pin icon

    Preview follows cursor
    Yellow background (like sticky note)
```

### After Placement

```
After Click:

      ●  ┌─────────────────────┐
         │ New Note            │  ← Solid note entity
         └─────────────────────┘    with default text
         ↑
     Pin icon

    Entity created and selectable
    Preview continues at cursor
    User can edit text in Inspector
```

## Usage Example

```typescript
// In CanvasContainer or ToolManager
const noteTool = new NoteTool();

// Activate note tool
noteTool.onActivate();

// Mouse event forwarding
canvas.addEventListener('mousedown', (e) => {
  const toolEvent = convertToToolEvent(e);
  noteTool.onMouseDown(toolEvent);
});

canvas.addEventListener('mousemove', (e) => {
  const toolEvent = convertToToolEvent(e);
  noteTool.onMouseMove(toolEvent);
});

// Keyboard event forwarding
document.addEventListener('keydown', (e) => {
  const toolEvent = convertToToolKeyEvent(e);
  noteTool.onKeyDown(toolEvent);
});

// Render loop
function renderCanvas() {
  ctx.clearRect(0, 0, width, height);

  // ... render grid, entities, etc.

  // Render note preview
  noteTool.render({ ctx, zoom, panX, panY });
}
```

## Interaction Flow

```
User Action                   Tool State              Canvas Display
──────────────────────────────────────────────────────────────────────
1. Activate Note Tool        Tool active             Text cursor (I-beam)

2. Move cursor to (200, 150) currentPoint:           Yellow preview box
                              (200, 150)             "Click to add note"
                                                     Pin icon
                                                     Follows cursor

3. Click mouse               Entity created          Solid note entity
                              currentPoint:          "New Note"
                              (200, 150)             Preview continues

4. Select note entity        Note selected           Inspector shows note
                                                     Text field editable

5. Edit text in Inspector    Note updated            Canvas shows new text

6. Move to (400, 300)        currentPoint:           Preview moves
                              (400, 300)             Ready for next note

7. Press Escape              currentPoint: null      Preview hidden
```

## Note Editing

After placing a note, users can edit its content through the Inspector panel:

```typescript
// In NoteInspector component
function NoteInspector({ noteId }: { noteId: string }) {
  const note = useEntityStore((state) => state.byId[noteId]);

  const handleContentChange = (newContent: string) => {
    updateEntityCommand(
      noteId,
      { props: { content: newContent } },
      note,
      { selectionBefore: [noteId], selectionAfter: [noteId] }
    );
  };

  return (
    <textarea
      value={note.props.content}
      onChange={(e) => handleContentChange(e.target.value)}
      placeholder="Enter note text..."
    />
  );
}
```

## Placement Position

Notes are placed with their **top-left corner** at the clicked position (not centered):

```typescript
// In createNoteEntity
const note = createNote({
  x, // Grid-aligned X (top-left corner)
  y, // Grid-aligned Y (top-left corner)
  content: 'New Note',
});
```

This matches typical document annotation behavior where you click where you want the note to start.

## Note Dimensions

| Property | Value | Description |
|----------|-------|-------------|
| Default Width | 100px | Minimum note width |
| Default Height | 50px | Minimum note height |
| Font Size | 14px | Preview and entity text size |
| Background | Yellow (#FFFFE8) | Sticky note appearance |
| Border | Golden (#F9A825) | Border and pin color |
| Icon Size | 6px diameter | Pin/tack icon |

## Note Properties

```typescript
interface NoteProps {
  content: string;          // Note text content
  fontSize?: number;        // Text size (default: 14)
  textColor?: string;       // Text color (default: #666666)
  backgroundColor?: string; // Background color (default: #FFFFE8)
  borderColor?: string;     // Border color (default: #F9A825)
  width?: number;           // Note width (default: 100)
  height?: number;          // Note height (default: 50)
}
```

## Common Use Cases

### Design Notes
```
┌─────────────────────────────┐
│ Check clearance for AHU     │
│ maintenance access          │
└─────────────────────────────┘
```

### Calculation Notes
```
┌─────────────────────────────┐
│ Supply CFM: 2000            │
│ Return CFM: 1800            │
│ Fresh Air: 200 (10%)        │
└─────────────────────────────┘
```

### Installation Notes
```
┌─────────────────────────────┐
│ Install fire damper at      │
│ wall penetration            │
└─────────────────────────────┘
```

### Revision Notes
```
┌─────────────────────────────┐
│ 2024-01-15: Increased duct  │
│ size per engineer review    │
└─────────────────────────────┘
```

## Related Elements

- [BaseTool](./BaseTool.md) - Abstract base class
- [NoteSchema](../03-schemas/NoteSchema.md) - Note entity validation
- [NoteDefaults](../08-entities/noteDefaults.md) - Note factory function
- [NoteInspector](../01-components/inspector/NoteInspector.md) - Note editing interface
- [NoteRenderer](../05-renderers/NoteRenderer.md) - Note visualization
- [ViewportStore](../02-stores/viewportStore.md) - Grid snapping settings
- [entityCommands](../../core/commands/entityCommands.md) - Undo support

## Testing

```typescript
describe('NoteTool', () => {
  let tool: NoteTool;
  let mockViewportStore: MockViewportStore;

  beforeEach(() => {
    mockViewportStore = createMockViewportStore({
      snapToGrid: true,
      gridSize: 12,
    });
    tool = new NoteTool();
    tool.onActivate();
  });

  it('has text cursor', () => {
    expect(tool.getCursor()).toBe('text');
  });

  it('updates preview position on mouse move', () => {
    tool.onMouseMove({ x: 150, y: 150, button: 0 } as ToolMouseEvent);

    expect(tool['state'].currentPoint).toEqual({ x: 144, y: 144 }); // Snapped to 12px grid
  });

  it('creates note on mouse down', () => {
    tool.onMouseDown({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    expect(createEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'note',
        props: expect.objectContaining({
          content: 'New Note',
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

  it('creates note with default content', () => {
    tool.onMouseDown({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    expect(createEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          content: 'New Note',
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
    expect(ctx.fillText).toHaveBeenCalledWith(
      'Click to add note',
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('renders pin icon in preview', () => {
    const ctx = createMockCanvasContext();
    tool.onMouseMove({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    expect(ctx.arc).toHaveBeenCalledWith(
      expect.any(Number), // x
      expect.any(Number), // y
      3,                  // radius
      0,                  // startAngle
      Math.PI * 2         // endAngle
    );
  });

  it('does not render when no current point', () => {
    const ctx = createMockCanvasContext();

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    expect(ctx.fillRect).not.toHaveBeenCalled();
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('continues placing notes after first placement', () => {
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

  it('creates note positioned at top-left corner', () => {
    tool.onMouseDown({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    expect(createEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: expect.objectContaining({
          x: 96, // Top-left corner, not centered
          y: 96,
        }),
      })
    );
  });

  it('scales font size with zoom', () => {
    const ctx = createMockCanvasContext();
    tool.onMouseMove({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    tool.render({ ctx, zoom: 2, panX: 0, panY: 0 }); // 2x zoom

    expect(ctx.font).toContain('7px'); // 14 / 2 = 7
  });

  it('uses yellow sticky note colors', () => {
    const ctx = createMockCanvasContext();
    tool.onMouseMove({ x: 100, y: 100, button: 0 } as ToolMouseEvent);

    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    // Background: semi-transparent yellow
    expect(ctx.fillStyle).toContain('rgba(255, 255, 200, 0.9)');

    // Border: golden
    expect(ctx.strokeStyle).toBe('#F9A825');

    // Pin icon: golden
    expect(ctx.fillStyle).toContain('#F9A825');
  });

  it('measures text width for background sizing', () => {
    const ctx = createMockCanvasContext();
    ctx.measureText = jest.fn().mockReturnValue({ width: 120 });

    tool.onMouseMove({ x: 100, y: 100, button: 0 } as ToolMouseEvent);
    tool.render({ ctx, zoom: 1, panX: 0, panY: 0 });

    expect(ctx.measureText).toHaveBeenCalledWith('Click to add note');
    expect(ctx.fillRect).toHaveBeenCalledWith(
      96,        // x
      96,        // y
      120 + 8,   // width (text width + padding)
      expect.any(Number) // height
    );
  });
});
```

## Accessibility Considerations

- Use contrasting text color (#666666) on light background for readability
- Provide clear visual feedback with preview
- Support keyboard shortcuts (Escape to cancel)
- Allow text editing through Inspector panel
- Consider adding font size options for users with visual impairments

## Performance Considerations

- Preview rendering is lightweight (single rectangle + text)
- Text measurement (`measureText()`) is cached per frame
- No complex geometry or expensive calculations
- Minimal state management (only current point)
