# Duct Sizing Calculator

## Overview

The Duct Sizing Calculator provides functions for calculating duct cross-sectional area, air velocity, duct diameter sizing, and equivalent diameter conversions for rectangular ducts.

## Location

```
src/features/canvas/calculators/ductSizing.ts
```

## Purpose

- Calculate duct cross-sectional area (round and rectangular)
- Compute air velocity from CFM and area
- Size round ducts for target velocity
- Calculate equivalent round diameter for rectangular ducts
- Support both round and rectangular duct shapes

## Dependencies

- `./pressureDrop` - calculateEquivalentDiameter function

## Functions

### calculateDuctArea

Calculate duct cross-sectional area in square inches.

```typescript
export function calculateDuctArea(
  shape: DuctShape,
  dimensions: { diameter?: number; width?: number; height?: number }
): number
```

**Formulas:**
```typescript
// Round duct
area = π × (diameter/2)²

// Rectangular duct
area = width × height
```

**Examples:**
```typescript
// 12" round duct
calculateDuctArea('round', { diameter: 12 });
// π × 6² = 113.10 sq in

// 12" × 8" rectangular duct
calculateDuctArea('rectangular', { width: 12, height: 8 });
// 12 × 8 = 96 sq in
```

### calculateVelocity

Calculate air velocity in FPM from CFM and area.

```typescript
export function calculateVelocity(cfm: number, areaSqIn: number): number
```

**Formula:**
```typescript
velocity = CFM / (area_sq_in / 144)
```

**Example:**
```typescript
// 800 CFM through 12" round duct (113.1 sq in)
calculateVelocity(800, 113.1);
// 800 / (113.1/144) = 1017 FPM
```

### calculateRoundDuctDiameter

Calculate required round duct diameter for given CFM and velocity.

```typescript
export function calculateRoundDuctDiameter(cfm: number, velocityFpm: number): number
```

**Formula:**
```typescript
diameter = √(4 × area / π)
where area = (CFM × 144) / velocity
```

**Example:**
```typescript
// Size duct for 1000 CFM at 1200 FPM
calculateRoundDuctDiameter(1000, 1200);
// area = (1000 * 144) / 1200 = 120 sq in
// diameter = √(4 × 120 / π) = 12.36"
```

### calculateEquivalentDiameter

Calculate equivalent round diameter for rectangular duct.

```typescript
export function calculateEquivalentDiameter(width: number, height: number): number
```

**Formula:**
```typescript
De = 1.30 × ((a×b)^0.625) / ((a+b)^0.25)
```

**Example:**
```typescript
// 12" × 8" rectangular duct
calculateEquivalentDiameter(12, 8);
// De = 1.30 × ((12×8)^0.625) / ((12+8)^0.25) = 10.4"
```

## Usage Examples

### Duct Sizing Workflow

```typescript
import {
  calculateRoundDuctDiameter,
  calculateDuctArea,
  calculateVelocity,
} from '@/features/canvas/calculators/ductSizing';

// Size duct for 800 CFM at 1000 FPM
const diameter = calculateRoundDuctDiameter(800, 1000);
// diameter = 12.03"

// Verify with actual area
const area = calculateDuctArea('round', { diameter: 12 });
const velocity = calculateVelocity(800, area);
// velocity = 1017 FPM (close to 1000 FPM)
```

## Typical Velocities

- Residential supply: 600-900 FPM
- Commercial supply: 1000-1500 FPM
- Industrial: 1500-2500 FPM
- Kitchen exhaust: 1500-4000 FPM

## Testing

```typescript
describe('DuctSizingCalculator', () => {
  it('calculates round duct area', () => {
    expect(calculateDuctArea('round', { diameter: 12 })).toBeCloseTo(113.1, 1);
  });

  it('calculates velocity correctly', () => {
    expect(calculateVelocity(1000, 144)).toBe(1000);
  });

  it('sizes duct diameter', () => {
    expect(calculateRoundDuctDiameter(1000, 1000)).toBeCloseTo(13.54, 2);
  });
});
```

## Related Elements

- [Duct Schema](../03-schemas/DuctSchema.md)
- [PressureDropCalculator](./PressureDropCalculator.md)
- [DuctDefaults](../08-entities/DuctDefaults.md)
