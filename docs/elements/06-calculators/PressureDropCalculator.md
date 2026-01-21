# Pressure Drop Calculator

## Overview

The Pressure Drop Calculator implements ASHRAE-based formulas for calculating velocity pressure, friction loss, and fitting losses in duct systems. It provides accurate pressure drop calculations for duct sizing and system design.

## Location

```
src/features/canvas/calculators/pressureDrop.ts
```

## Purpose

- Calculate velocity pressure from air velocity
- Compute friction loss for straight duct runs
- Calculate fitting losses using equivalent length method
- Determine equivalent round diameter for rectangular ducts
- Support different duct materials and roughness factors

## Functions

### calculateVelocityPressure

Calculate velocity pressure in inches of water gauge.

```typescript
export function calculateVelocityPressure(velocityFpm: number): number
```

**Formula:**
```typescript
Pv = (velocity / 4005)²
```

**Example:**
```typescript
calculateVelocityPressure(1000);
// (1000/4005)² = 0.06 in.w.g.
```

### calculateFrictionLoss

Calculate friction loss for straight duct runs (ΔP).

```typescript
export function calculateFrictionLoss(
  velocityFpm: number,
  diameterInches: number,
  lengthFeet: number,
  roughnessFeet = 0.0005  // Default for galvanized
): number
```

**Formula:**
We use ASHRAE/SMACNA standard methods.
- **Straight Ducts**: Lookup per 100 ft of duct at given Q and size, or use Darcy-Weisbach approximation:
  ```typescript
  ΔP = (f × L × V²) / (2 × g × D)
  ```
  *Note: In US practice, this is often typically look-up from friction loss charts.*

**Example:**
```typescript
// 1000 FPM, 12" diameter, 50 feet, galvanized
calculateFrictionLoss(1000, 12, 50, 0.0005);
// ~0.05 in.w.g.
```

### calculateFittingLoss

Calculate fitting loss using friction per 100 ft and equivalent length.

```typescript
export function calculateFittingLoss(frictionPer100: number, equivalentLengthFeet: number): number
```

**Formula:**
```typescript
ΔP_fitting = (frictionPer100 / 100) * equivalentLengthFeet
```

### calculateEquivalentDiameter

Convert rectangular duct dimensions to equivalent round diameter.

```typescript
export function calculateEquivalentDiameter(widthInches: number, heightInches: number): number
```

**Formula:**
```typescript
De = 1.30 × ((a×b)^0.625) / ((a+b)^0.25)
```

## Material Roughness Values

```typescript
galvanized: 0.0005 ft
stainless:  0.0002 ft
aluminum:   0.0002 ft
flex:       0.003 ft
```

## Usage Examples

```typescript
import {
  calculateVelocityPressure,
  calculateFrictionLoss,
  calculateEquivalentDiameter,
} from '@/features/canvas/calculators/pressureDrop';

// Calculate pressure drop for duct run
const velocity = 1200;  // FPM
const diameter = 12;    // inches
const length = 100;     // feet

const velocityPressure = calculateVelocityPressure(velocity);
// 0.09 in.w.g.

const frictionLoss = calculateFrictionLoss(velocity, diameter, length);
// ~0.12 in.w.g.

// Equivalent length fitting loss (example: 35 ft equivalent length)
const fittingLoss = calculateFittingLoss(0.12, 35);

// For rectangular duct
const eqDiameter = calculateEquivalentDiameter(12, 8);
const rectFriction = calculateFrictionLoss(velocity, eqDiameter, length);
```

## Related Elements

- [Duct Schema](../03-schemas/DuctSchema.md)
- [DuctSizingCalculator](./DuctSizingCalculator.md)
- [DuctDefaults](../08-entities/DuctDefaults.md)
