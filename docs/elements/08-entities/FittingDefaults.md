# Fitting Defaults

## Overview

The Fitting Defaults module provides factory functions for creating fitting entities with type-specific defaults and labels.

## Location

```
src/features/canvas/entities/fittingDefaults.ts
```

## Functions

### createFitting

```typescript
export function createFitting(
  fittingType: FittingType,
  overrides?: Partial<{
    name: string;
    x: number;
    y: number;
    angle: number;
    inletDuctId: string;
    outletDuctId: string;
  }>
): Fitting
```

## Fitting Types

```typescript
const FITTING_TYPE_LABELS: Record<FittingType, string> = {
  elbow_90: '90° Elbow',
  elbow_45: '45° Elbow',
  tee:      'Tee',
  reducer:  'Reducer',
  cap:      'Cap',
};
```

## Usage

```typescript
import { createFitting } from '@/features/canvas/entities/fittingDefaults';

// Create 90° elbow
const elbow = createFitting('elbow_90');

// Create tee with duct connections
const tee = createFitting('tee', {
  inletDuctId: 'duct-1',
  outletDuctId: 'duct-2',
});
```

## Related Elements

- [Fitting Schema](../03-schemas/FittingSchema.md)
