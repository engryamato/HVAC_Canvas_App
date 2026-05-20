# Duct Renderer

## Overview

The Duct Renderer handles visualization of duct entities on the canvas, supporting both round and rectangular duct shapes. It renders ducts with airflow direction indicators, CFM labels, size annotations, and selection states.

## Location

```
src/features/canvas/renderers/DuctRenderer.ts
```

## Purpose

- Render round and rectangular ducts with appropriate visual representation
- Display airflow direction with arrow indicators
- Show CFM (cubic feet per minute) airflow values
- Render duct size labels (diameter for round, width×height for rectangular)
- Apply selection highlighting
- Scale all visual elements with zoom level

## Dependencies

- `@/core/schema` - Duct type definition
- `./RoomRenderer` - RenderContext interface
- Canvas API - HTML5 CanvasRenderingContext2D

## Color Scheme

```typescript
const DUCT_COLORS = {
  round: {
    fill: '#E0E0E0',           // Light gray fill
    stroke: '#424242',          // Dark gray border
    selectedStroke: '#1976D2',  // Blue when selected
  },
  rectangular: {
    fill: '#EEEEEE',           // Lighter gray fill
    stroke: '#616161',          // Medium gray border
    selectedStroke: '#1976D2',  // Blue when selected
  },
  arrow: '#757575',            // Medium gray for airflow arrow
  text: '#424242',             // Dark gray for labels
};
```

## Functions

### renderDuct

Main rendering function for duct entities.

```typescript
export function renderDuct(duct: Duct, context: RenderContext): void
```

**Parameters:**
- `duct` - Duct entity to render
- `context` - Rendering context with canvas, zoom, and selection state

**Rendering Steps:**
1. Convert length from feet to pixels (length * 12)
2. Render duct shape (round or rectangular)
3. Draw airflow direction arrow
4. Render duct label with name and size

### renderRoundDuct

Renders a round duct as a rounded rectangle.

```typescript
function renderRoundDuct(
  ctx: CanvasRenderingContext2D,
  duct: Duct,
  lengthPixels: number,
  zoom: number,
  isSelected: boolean
): void
```

**Visual Representation:**
- Uses `ctx.roundRect()` to create rounded rectangle
- Width: `lengthPixels + diameter`
- Height: `diameter`
- Border radius: `diameter / 2` (makes ends circular)
- Positioned to be centered on the origin

### renderRectangularDuct

Renders a rectangular duct as a simple rectangle.

```typescript
function renderRectangularDuct(
  ctx: CanvasRenderingContext2D,
  duct: Duct,
  lengthPixels: number,
  zoom: number,
  isSelected: boolean
): void
```

**Visual Representation:**
- Standard rectangle with `ctx.fillRect()` and `ctx.strokeRect()`
- Width: `lengthPixels`
- Height: `duct.props.width`
- Centered vertically on the origin

### renderAirflowArrow

Draws a directional arrow showing airflow direction and CFM value.

```typescript
function renderAirflowArrow(
  ctx: CanvasRenderingContext2D,
  lengthPixels: number,
  zoom: number,
  airflow: number
): void
```

**Arrow Details:**
- Positioned at 70% of duct length
- Triangle pointing in direction of flow
- CFM label displayed next to arrow
- Arrow size scales with zoom (min 10px)

### renderDuctLabel

Renders duct name and size label above the duct.

```typescript
function renderDuctLabel(
  ctx: CanvasRenderingContext2D,
  name: string,
  props: Duct['props'],
  lengthPixels: number,
  zoom: number
): void
```

**Label Formats:**
- Round ducts: `"Duct 1 (12"Ø)"` (diameter with Ø symbol)
- Rectangular ducts: `"Duct 1 (12"×8")"` (width × height)

## Usage Examples

### Rendering Round Duct

```typescript
import { renderDuct } from '@/features/canvas/renderers/DuctRenderer';

const roundDuct: Duct = {
  id: 'duct-1',
  type: 'duct',
  transform: { x: 200, y: 300, rotation: 0, scaleX: 1, scaleY: 1 },
  props: {
    name: 'Supply Main',
    shape: 'round',
    diameter: 12,      // 12 inches
    length: 20,        // 20 feet
    material: 'galvanized',
    airflow: 800,      // 800 CFM
    staticPressure: 0.5,
  },
  calculated: {
    area: 113.1,       // π×(6)² square inches
    velocity: 1015,    // FPM
    frictionLoss: 0.08,
  },
  // ... other required fields
};

const context: RenderContext = {
  ctx: canvasContext,
  zoom: 1.0,
  isSelected: false,
  isHovered: false,
};

ctx.save();
ctx.translate(roundDuct.transform.x, roundDuct.transform.y);
ctx.rotate((roundDuct.transform.rotation * Math.PI) / 180);

renderDuct(roundDuct, context);

ctx.restore();
```

### Rendering Rectangular Duct

```typescript
const rectangularDuct: Duct = {
  id: 'duct-2',
  type: 'duct',
  transform: { x: 400, y: 300, rotation: 90, scaleX: 1, scaleY: 1 },
  props: {
    name: 'Return Branch',
    shape: 'rectangular',
    width: 12,         // 12 inches wide
    height: 8,         // 8 inches tall
    length: 15,        // 15 feet
    material: 'galvanized',
    airflow: 600,      // 600 CFM
    staticPressure: 0.3,
  },
  calculated: {
    area: 96,          // 12×8 square inches
    velocity: 1080,    // FPM
    frictionLoss: 0.12,
  },
  // ... other required fields
};

renderDuct(rectangularDuct, context);
// Renders rectangular duct with "12"×8"" size label
```

## Coordinate System

Ducts are drawn with their origin at the start point:

```
Round Duct (12" diameter, 20 feet long):
  ┌─────────────────────────────┐
  │  ←──── lengthPixels ────→  │
  ├─────────────────────────────┤  ↑
  │         ──→  800 CFM        │  diameter
  └─────────────────────────────┘  ↓
  ↑
  origin (0, -diameter/2)

Rectangular Duct (12"×8", 15 feet long):
  ┌────────────────────────┐  ↑
  │     ──→  600 CFM       │  width (12")
  └────────────────────────┘  ↓
  ↑
  origin (0, -width/2)
  ←─── lengthPixels ────→
```

## Airflow Arrow

The airflow arrow provides visual direction and flow rate:

```typescript
// Arrow position
const arrowX = lengthPixels * 0.7;  // 70% along duct length

// Arrow shape (triangle)
ctx.moveTo(arrowX, 0);                    // Arrow point
ctx.lineTo(arrowX - arrowSize, -arrowSize / 2);  // Top corner
ctx.lineTo(arrowX - arrowSize, arrowSize / 2);   // Bottom corner

// CFM label
ctx.fillText(`${airflow} CFM`, arrowX + 4 / zoom, 0);
```

## Zoom Scaling

All visual elements scale appropriately:

```typescript
// Line widths
ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;

// Font sizes with minimum thresholds
const fontSize = Math.max(10 / zoom, 8);
const cfmFontSize = Math.max(9 / zoom, 7);

// Arrow size
const arrowSize = Math.min(12 / zoom, 10);
```

## Selection States

### Normal State
- Shape-specific fill color (gray tones)
- Dark gray border
- Standard line width (2/zoom)

### Selected State
- Blue border (#1976D2)
- Thicker line width (3/zoom)
- Same fill color

## Performance Considerations

- Minimal path operations (single shape per duct)
- Conditional rendering based on shape type
- Uses `ctx.roundRect()` for round ducts (efficient native method)
- Font size clamping prevents excessive text rendering

## Testing

```typescript
describe('DuctRenderer', () => {
  it('renders round duct with correct dimensions', () => {
    const duct = createDuct({ shape: 'round', diameter: 12, length: 10 });
    const context: RenderContext = {
      ctx,
      zoom: 1.0,
      isSelected: false,
      isHovered: false,
    };

    renderDuct(duct, context);

    // Verify round rect was called
    expect(ctx.roundRect).toHaveBeenCalled();
  });

  it('renders rectangular duct', () => {
    const duct = createDuct({
      shape: 'rectangular',
      width: 12,
      height: 8,
      length: 10
    });

    renderDuct(duct, context);

    // Verify rect dimensions
    expect(ctx.fillRect).toHaveBeenCalledWith(0, -6, 120, 12);
  });

  it('shows CFM with airflow arrow', () => {
    const duct = createDuct({ airflow: 800 });

    renderDuct(duct, context);

    // Verify CFM text was rendered
    expect(ctx.fillText).toHaveBeenCalledWith(
      expect.stringContaining('800 CFM'),
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('applies selection color when selected', () => {
    const context: RenderContext = {
      ctx,
      zoom: 1.0,
      isSelected: true,
      isHovered: false,
    };

    renderDuct(createDuct({ shape: 'round' }), context);

    expect(ctx.strokeStyle).toBe('#1976D2');
  });
});
```

## Related Elements

- [Duct Schema](../03-schemas/DuctSchema.md) - Duct data structure
- [DuctTool](../04-tools/DuctTool.md) - Duct creation tool
- [DuctInspector](../01-components/inspector/DuctInspector.md) - Duct property editor
- [DuctDefaults](../08-entities/DuctDefaults.md) - Duct factory
- [DuctSizingCalculator](../06-calculators/DuctSizingCalculator.md) - Duct calculations
- [RoomRenderer](./RoomRenderer.md) - Room rendering
- [EquipmentRenderer](./EquipmentRenderer.md) - Equipment rendering
