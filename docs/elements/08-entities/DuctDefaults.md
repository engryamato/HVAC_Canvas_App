# Duct Defaults

## Overview

The Duct Defaults module provides factory functions for creating duct entities with default values, auto-incrementing names, shape-specific defaults, and calculated properties.

## Location

```
src/features/canvas/entities/ductDefaults.ts
```

## Purpose

- Create round or rectangular duct entities
- Auto-increment duct names (Duct 1, Duct 2, etc.)
- Calculate initial area, velocity, and friction loss
- Support both duct shapes with appropriate defaults
- Generate unique IDs and timestamps

## Functions

### createDuct

```typescript
export function createDuct(overrides?: Partial<{
  name: string;
  x: number;
  y: number;
  shape: 'round' | 'rectangular';
  diameter: number;
  width: number;
  height: number;
  length: number;
  material: Duct['props']['material'];
  airflow: number;
  staticPressure: number;
}>): Duct
```

## Default Values

```typescript
DEFAULT_ROUND_DUCT_PROPS = {
  shape: 'round',
  diameter: 12,           // inches
  length: 10,             // feet
  material: 'galvanized',
  airflow: 400,           // CFM
  staticPressure: 0.5,    // in.w.g.
};
```

## Usage

```typescript
import { createDuct } from '@/features/canvas/entities/ductDefaults';

// Round duct with defaults
const roundDuct = createDuct();

// Custom round duct
const supplyMain = createDuct({
  name: 'Supply Main',
  diameter: 16,
  length: 50,
  airflow: 2000,
});

// Rectangular duct
const rectDuct = createDuct({
  shape: 'rectangular',
  width: 12,
  height: 8,
  length: 20,
  airflow: 800,
});
```

## Related Elements

- [Duct Schema](../03-schemas/DuctSchema.md)
- [DuctSizingCalculator](../06-calculators/DuctSizingCalculator.md)
- [DuctRenderer](../05-renderers/DuctRenderer.md)
