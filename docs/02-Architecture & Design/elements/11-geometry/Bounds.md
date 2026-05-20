# Bounds

## Overview

Bounds utilities provide functions for axis-aligned bounding box operations including hit testing, intersection, merging, and transformations.

## Location

```
src/core/geometry/bounds.ts
```

## Interface

```typescript
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

## Functions

### Point Operations

```typescript
getBoundsCenter(bounds: Bounds): Point
boundsContainsPoint(bounds: Bounds, point: Point): boolean
```

### Intersection

```typescript
boundsIntersect(a: Bounds, b: Bounds): boolean
boundsContainsBounds(outer: Bounds, inner: Bounds): boolean
```

### Combination

```typescript
mergeBounds(boundsArray: Bounds[]): Bounds | null
expandBounds(bounds: Bounds, padding: number): Bounds
```

### Construction

```typescript
boundsFromPoints(p1: Point, p2: Point): Bounds
getBoundsCorners(bounds: Bounds): [Point, Point, Point, Point]
```

### Properties

```typescript
getBoundsArea(bounds: Bounds): number
isEmptyBounds(bounds: Bounds): boolean
```

### Transformations

```typescript
translateBounds(bounds: Bounds, offset: Point): Bounds
scaleBounds(bounds: Bounds, scale: number): Bounds
```

## Usage

```typescript
import { boundsContainsPoint, boundsFromPoints } from '@/core/geometry/bounds';

// Hit testing
const entityBounds = { x: 100, y: 100, width: 200, height: 150 };
const mousePoint = { x: 150, y: 125 };

if (boundsContainsPoint(entityBounds, mousePoint)) {
  console.log('Clicked on entity!');
}

// Marquee selection
const marqueeBounds = boundsFromPoints(
  { x: 50, y: 50 },
  { x: 300, y: 200 }
);
```

## Related Elements

- [Math](./Math.md)
- [useSelection](../07-hooks/useSelection.md)
- [useMarquee](../07-hooks/useMarquee.md)
