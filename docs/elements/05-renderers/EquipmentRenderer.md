# Equipment Renderer

## Overview

The Equipment Renderer visualizes HVAC equipment entities on the canvas with type-specific icons, color coding, and labels. It currently renders hood, fan, diffuser, damper, and air_handler with distinct visual representation.

## Location

```
src/features/canvas/renderers/EquipmentRenderer.ts
```

## Purpose

- Render equipment entities as colored rectangles
- Display type-specific icons (hood, fan, diffuser, damper, AHU)
- Show equipment name labels
- Apply selection highlighting
- Scale visual elements with zoom level
- Provide clear visual distinction between equipment types

## Notes

- Only the five types listed above are currently mapped in `EQUIPMENT_COLORS` and icon rendering. If new equipment types are introduced, update the renderer to avoid missing color/icon mappings.

## Dependencies

- `@/core/schema` - Equipment and EquipmentType definitions
- `./RoomRenderer` - RenderContext interface
- Canvas API - HTML5 CanvasRenderingContext2D

## Color Scheme by Equipment Type

```typescript
const EQUIPMENT_COLORS: Record<EquipmentType, { fill: string; stroke: string }> = {
  hood:        { fill: '#FFF3E0', stroke: '#E65100' },  // Orange
  fan:         { fill: '#E3F2FD', stroke: '#1565C0' },  // Blue
  diffuser:    { fill: '#E8F5E9', stroke: '#388E3C' },  // Green
  damper:      { fill: '#FBE9E7', stroke: '#BF360C' },  // Brown/Red
  air_handler: { fill: '#ECEFF1', stroke: '#37474F' },  // Gray/Blue
};
```

## Functions

### renderEquipment

Main rendering function for equipment entities.

```typescript
export function renderEquipment(equipment: Equipment, context: RenderContext): void
```

**Parameters:**
- `equipment` - Equipment entity to render
- `context` - Rendering context with canvas, zoom, and state flags

**Rendering Steps:**
1. Draw equipment body rectangle
2. Render type-specific icon
3. Display name label above equipment

### renderEquipmentIcon

Dispatches to type-specific icon rendering functions.

```typescript
function renderEquipmentIcon(
  ctx: CanvasRenderingContext2D,
  type: EquipmentType,
  width: number,
  depth: number,
  zoom: number
): void
```

### Type-Specific Icon Functions

#### renderHoodIcon
Draws exhaust hood icon with upward arrow.

```typescript
function renderHoodIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  zoom: number
): void
```

**Visual:** Vertical arrow pointing up (exhaust direction)

#### renderFanIcon
Draws fan icon with circular outline and blades.

```typescript
function renderFanIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  zoom: number
): void
```

**Visual:** Circle with 4 radial blades

#### renderDiffuserIcon
Draws diffuser icon with grid pattern.

```typescript
function renderDiffuserIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  zoom: number
): void
```

**Visual:** 3×3 grid pattern representing diffuser slots

#### renderDamperIcon
Draws damper icon with diagonal lines.

```typescript
function renderDamperIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  zoom: number
): void
```

**Visual:** Diagonal crossed lines representing damper blades

#### renderAhuIcon
Draws air handling unit icon with coil pattern.

```typescript
function renderAhuIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  zoom: number
): void
```

**Visual:** Box with vertical lines representing coils

## Usage Examples

### Rendering Exhaust Hood

```typescript
import { renderEquipment } from '@/features/canvas/renderers/EquipmentRenderer';
import { createEquipment } from '@/features/canvas/entities/equipmentDefaults';

const hood = createEquipment('hood', {
  name: 'Kitchen Hood 1',
  x: 200,
  y: 150,
  capacity: 1200,  // CFM
  width: 48,       // inches
  depth: 36,
  height: 24,
});

const context: RenderContext = {
  ctx: canvasContext,
  zoom: 1.0,
  isSelected: false,
  isHovered: false,
};

ctx.save();
ctx.translate(hood.transform.x, hood.transform.y);

renderEquipment(hood, context);

ctx.restore();
// Renders orange rectangle with upward arrow icon
```

### Rendering Fan with Selection

```typescript
const fan = createEquipment('fan', {
  name: 'Exhaust Fan 1',
  x: 500,
  y: 300,
  capacity: 2000,  // CFM
});

const context: RenderContext = {
  ctx: canvasContext,
  zoom: 1.5,
  isSelected: true,  // Selected state
  isHovered: false,
};

renderEquipment(fan, context);
// Renders with blue selection border and fan blade icon
```

### Rendering Supported Equipment Types

```typescript
const equipmentTypes: EquipmentType[] = [
  'hood',
  'fan',
  'diffuser',
  'damper',
  'air_handler'
];

equipmentTypes.forEach((type, index) => {
  const equipment = createEquipment(type, {
    x: 100 + index * 150,
    y: 200,
  });

  ctx.save();
  ctx.translate(equipment.transform.x, equipment.transform.y);
  renderEquipment(equipment, context);
  ctx.restore();
});
// Renders supported equipment types in a row
```

## Icon Designs

### Hood Icon (Exhaust Arrow)
```
    ↑
    │
    │
    │
```

### Fan Icon (Blades)
```
    │
  ──┼──
    │
```

### Diffuser Icon (Grid)
```
┌─┬─┬─┐
├─┼─┼─┤
├─┼─┼─┤
└─┴─┴─┘
```

### Damper Icon (Blades)
```
  ╲   ╱
    ╳
  ╱   ╲
```

### AHU Icon (Coils)
```
┌───┐
│ │ │
│ │ │
│ │ │
└───┘
```

## Visual States

### Normal State
- Type-specific fill color
- Type-specific stroke color
- Standard line width (2/zoom)
- Type-specific icon in center

### Selected State
- Same fill color
- Blue selection border (#1976D2)
- Thicker line width (3/zoom)
- Same icon

## Icon Sizing

Icons are automatically sized based on equipment dimensions:

```typescript
const iconSize = Math.min(width, depth) * 0.4;  // 40% of smallest dimension
```

## Zoom Scaling

```typescript
// Line widths
ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;

// Font sizes
const fontSize = Math.max(10 / zoom, 8);  // Never smaller than 8px

// Icon line widths (for icon strokes)
ctx.lineWidth = 2 / zoom;  // Icons use 2px strokes
```

## Label Positioning

Equipment name is rendered above the equipment:

```typescript
ctx.textAlign = 'center';
ctx.textBaseline = 'bottom';
ctx.fillText(name, width / 2, -4 / zoom);
// Positioned 4px above the top edge
```

## Performance Considerations

- Simple path operations for icons
- Reuses canvas context settings
- Conditional icon rendering based on type
- No bitmap images (all vector drawing)

## Testing

```typescript
describe('EquipmentRenderer', () => {
  it('renders equipment with type-specific colors', () => {
    const hood = createEquipment('hood');

    renderEquipment(hood, context);

    expect(ctx.fillStyle).toBe('#FFF3E0');  // Orange fill
    expect(ctx.strokeStyle).toBe('#E65100'); // Orange stroke
  });

  it('renders fan icon with circle and blades', () => {
    const fan = createEquipment('fan');

    renderEquipment(fan, context);

    // Verify arc (circle) was drawn
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('applies selection highlighting', () => {
    const context: RenderContext = {
      ctx,
      zoom: 1.0,
      isSelected: true,
      isHovered: false,
    };

    renderEquipment(createEquipment('diffuser'), context);

    expect(ctx.strokeStyle).toBe('#1976D2');  // Blue selection
    expect(ctx.lineWidth).toBe(3);
  });

  it('scales icon size with equipment dimensions', () => {
    const largeEquipment = createEquipment('air_handler', {
      width: 100,
      depth: 100,
    });

    const smallEquipment = createEquipment('diffuser', {
      width: 24,
      depth: 24,
    });

    // Icon should be 40% of smaller dimension
    // Large: 100 * 0.4 = 40
    // Small: 24 * 0.4 = 9.6
  });
});
```

## Related Elements

- [Equipment Schema](../03-schemas/EquipmentSchema.md) - Equipment data structure
- [EquipmentTool](../04-tools/EquipmentTool.md) - Equipment creation tool
- [EquipmentInspector](../01-components/inspector/EquipmentInspector.md) - Equipment property editor
- [EquipmentDefaults](../08-entities/EquipmentDefaults.md) - Equipment factory
- [RoomRenderer](./RoomRenderer.md) - Room rendering
- [DuctRenderer](./DuctRenderer.md) - Duct rendering
