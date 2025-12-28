# Room Renderer

## Overview

The Room Renderer is responsible for rendering room entities on the HTML canvas with support for selection states, hover effects, zoom scaling, and interactive resize handles. It provides visual representation of rooms with dimensions, labels, and clear visual feedback.

## Location

```
src/features/canvas/renderers/RoomRenderer.ts
```

## Purpose

- Render room rectangles on the canvas with proper scaling
- Display room names centered in the room
- Show dimensional annotations on hover/selection
- Render interactive resize handles for selected rooms
- Apply different visual states (normal, selected, hovered)
- Scale line widths and fonts appropriately for zoom levels

## Dependencies

- `@/core/schema` - Room type definition
- Canvas API - HTML5 CanvasRenderingContext2D

## Interface

### RenderContext

```typescript
export interface RenderContext {
  ctx: CanvasRenderingContext2D;  // Canvas drawing context
  zoom: number;                    // Current zoom level (1.0 = 100%)
  isSelected: boolean;             // Whether entity is selected
  isHovered: boolean;              // Whether entity is hovered
}
```

## Color Scheme

```typescript
const ROOM_COLORS = {
  fill: '#E3F2FD',              // Light blue fill
  stroke: '#1976D2',            // Blue border
  selectedStroke: '#1565C0',    // Darker blue when selected
  selectedFill: 'rgba(25, 118, 210, 0.1)',  // Transparent blue overlay
  text: '#1976D2',              // Blue text
  dimensions: '#666666',        // Gray dimension text
};
```

## Functions

### renderRoom

Main rendering function for room entities.

```typescript
export function renderRoom(room: Room, context: RenderContext): void
```

**Parameters:**
- `room` - Room entity to render
- `context` - Rendering context with canvas, zoom, and state flags

**Behavior:**
1. Draws filled rectangle for room body
2. Draws border with appropriate thickness
3. Renders room name label centered
4. Shows dimensions (width/height) when hovered or selected
5. Renders resize handles when selected

### renderResizeHandles

Draws 8 resize handles (4 corners + 4 edges) for selected rooms.

```typescript
function renderResizeHandles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number
): void
```

**Handle Positions:**
- Corner handles: (0,0), (width,0), (0,height), (width,height)
- Edge handles: (width/2,0), (width/2,height), (0,height/2), (width,height/2)

**Visual Style:**
- 8x8 pixel squares (scaled by zoom)
- White fill with blue (#1976D2) border
- Positioned at corners and edge midpoints

## Zoom Scaling

The renderer automatically scales visual elements based on zoom level:

```typescript
// Line widths scale inversely with zoom
ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;

// Font sizes have minimum thresholds
const fontSize = Math.max(12 / zoom, 10);  // Never smaller than 10px
const dimFontSize = Math.max(10 / zoom, 8);  // Never smaller than 8px

// Handle sizes scale inversely
const handleSize = 8 / zoom;
```

## Usage Examples

### Basic Room Rendering

```typescript
import { renderRoom } from '@/features/canvas/renderers/RoomRenderer';

const room: Room = {
  id: 'room-1',
  type: 'room',
  transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
  props: {
    name: 'Kitchen',
    width: 240,  // 20 feet in inches
    length: 180,  // 15 feet in inches
    height: 96,   // 8 feet
    occupancyType: 'kitchen_commercial',
    airChangesPerHour: 12,
  },
  // ... other required fields
};

const context: RenderContext = {
  ctx: canvasContext,
  zoom: 1.0,
  isSelected: false,
  isHovered: false,
};

// Apply transform before rendering
ctx.save();
ctx.translate(room.transform.x, room.transform.y);
ctx.rotate((room.transform.rotation * Math.PI) / 180);

renderRoom(room, context);

ctx.restore();
```

### Rendering Selected Room with Handles

```typescript
const context: RenderContext = {
  ctx: canvasContext,
  zoom: 1.5,        // 150% zoom
  isSelected: true,  // Show selection state
  isHovered: false,
};

renderRoom(room, context);
// Will render with:
// - Darker blue border (3/zoom thickness)
// - Semi-transparent blue overlay
// - 8 resize handles
// - Dimensional annotations
```

## Visual States

### Normal State
- Light blue fill (#E3F2FD)
- Medium blue border (#1976D2), 2px width
- Room name displayed

### Selected State
- Semi-transparent blue overlay
- Darker blue border (#1565C0), 3px width
- 8 white resize handles with blue borders
- Dimensional annotations visible

### Hovered State
- Same as normal but with dimensional annotations
- Width shown below room
- Length shown to the right (rotated text)

## Dimension Display

Dimensions are shown in feet with 1 decimal place:

```typescript
// Width dimension (bottom of room)
const widthFt = (width / 12).toFixed(1);  // Convert inches to feet
ctx.fillText(`${widthFt}'`, width / 2, length + 4 / zoom);

// Length dimension (right side, rotated)
const lengthFt = (length / 12).toFixed(1);
ctx.save();
ctx.translate(width + 4 / zoom, length / 2);
ctx.rotate(-Math.PI / 2);  // Rotate 90 degrees counterclockwise
ctx.fillText(`${lengthFt}'`, 0, 0);
ctx.restore();
```

## Performance Considerations

- Uses `ctx.save()` and `ctx.restore()` to isolate transform state
- Minimal path operations (single rect for fill/stroke)
- Conditional rendering of handles and dimensions
- Font size clamping prevents excessive text scaling

## Testing

```typescript
describe('RoomRenderer', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    ctx = canvas.getContext('2d')!;
  });

  it('renders room with correct dimensions', () => {
    const room = createRoom({ width: 240, length: 180 });
    const context: RenderContext = {
      ctx,
      zoom: 1.0,
      isSelected: false,
      isHovered: false,
    };

    renderRoom(room, context);

    // Verify canvas operations were called
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 240, 180);
    expect(ctx.strokeRect).toHaveBeenCalledWith(0, 0, 240, 180);
  });

  it('scales line width with zoom', () => {
    const context: RenderContext = {
      ctx,
      zoom: 2.0,  // 200% zoom
      isSelected: false,
      isHovered: false,
    };

    renderRoom(createRoom(), context);

    // Line width should be 2/zoom = 1px
    expect(ctx.lineWidth).toBe(1);
  });

  it('renders resize handles when selected', () => {
    const room = createRoom({ width: 100, length: 100 });
    const context: RenderContext = {
      ctx,
      zoom: 1.0,
      isSelected: true,
      isHovered: false,
    };

    renderRoom(room, context);

    // Should render 8 handles (4 fillRect + 4 strokeRect calls)
    expect(ctx.fillRect).toHaveBeenCalledTimes(9);  // 1 room + 8 handles
  });
});
```

## Related Elements

- [Room Schema](../03-schemas/RoomSchema.md) - Room data structure
- [RoomTool](../04-tools/RoomTool.md) - Room creation tool
- [RoomInspector](../01-components/inspector/RoomInspector.md) - Room property editor
- [RoomDefaults](../08-entities/RoomDefaults.md) - Room factory
- [DuctRenderer](./DuctRenderer.md) - Duct rendering
- [EquipmentRenderer](./EquipmentRenderer.md) - Equipment rendering
