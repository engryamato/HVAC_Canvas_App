# Math

## Overview

Core math utilities for canvas operations including distance, angle, rotation, interpolation, and coordinate transformations.

## Location

```
src/core/geometry/math.ts
```

## Interface

```typescript
export interface Point {
  x: number;
  y: number;
}
```

## Functions

### Distance

```typescript
distance(p1: Point, p2: Point): number
distanceSquared(p1: Point, p2: Point): number
```

### Clamping & Snapping

```typescript
clamp(value: number, min: number, max: number): number
snapToGrid(value: number, gridSize: number): number
snapPointToGrid(point: Point, gridSize: number): Point
```

### Angle Conversion

```typescript
degreesToRadians(degrees: number): number
radiansToDegrees(radians: number): number
normalizeAngle(angle: number): number
angleBetweenPoints(p1: Point, p2: Point): number
```

### Interpolation

```typescript
lerp(a: number, b: number, t: number): number
lerpPoint(p1: Point, p2: Point, t: number): Point
```

### Point Operations

```typescript
rotatePoint(point: Point, origin: Point, angleDegrees: number): Point
addPoints(p1: Point, p2: Point): Point
subtractPoints(p1: Point, p2: Point): Point
scalePoint(point: Point, scale: number): Point
```

### Comparison

```typescript
approximately(a: number, b: number, epsilon = 0.0001): boolean
```

## Usage Examples

```typescript
import { distance, snapToGrid, rotatePoint } from '@/core/geometry/math';

// Distance
const dist = distance({ x: 0, y: 0 }, { x: 3, y: 4 });  // 5

// Snap to grid
const snapped = snapToGrid(127, 12);  // 132

// Rotate point
const rotated = rotatePoint(
  { x: 100, y: 0 },
  { x: 0, y: 0 },
  90
);  // { x: 0, y: 100 }
```

## Related Elements

- [Bounds](./Bounds.md)
- [useViewport](../07-hooks/useViewport.md)
