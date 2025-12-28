# Ventilation Calculator

## Overview

The Ventilation Calculator implements ASHRAE 62.1 ventilation calculations and ACH (Air Changes per Hour) methods for determining required airflow rates for rooms. It provides accurate CFM calculations based on occupancy type, room dimensions, and air change requirements.

## Location

```
src/features/canvas/calculators/ventilation.ts
```

## Purpose

- Calculate room area and volume from dimensions in inches
- Compute ventilation requirements per ASHRAE 62.1 standard
- Calculate CFM using ACH method
- Provide default occupancy densities and ventilation rates
- Support multiple occupancy types with specific requirements
- Generate complete calculated values for room entities

## Dependencies

- `@/core/schema` - Room and OccupancyType definitions

## Constants

### OCCUPANCY_LOOKUP

Defines ventilation requirements for each occupancy type per ASHRAE 62.1:

```typescript
const OCCUPANCY_LOOKUP: Record<OccupancyType, OccupancyData> = {
  office: {
    rp: 5,    // CFM per person
    ra: 0.06, // CFM per square foot
    defaultOccupantDensity: 5,   // people per 1000 sq ft
    defaultACH: 4,                // air changes per hour
  },
  retail: {
    rp: 7.5,
    ra: 0.06,
    defaultOccupantDensity: 15,
    defaultACH: 6,
  },
  restaurant: {
    rp: 7.5,
    ra: 0.18,
    defaultOccupantDensity: 70,
    defaultACH: 20,
  },
  kitchen_commercial: {
    rp: 0,     // Area-based only
    ra: 0.7,
    defaultOccupantDensity: 10,
    defaultACH: 25,
  },
  warehouse: {
    rp: 10,
    ra: 0.06,
    defaultOccupantDensity: 2,
    defaultACH: 3,
  },
  classroom: {
    rp: 10,
    ra: 0.12,
    defaultOccupantDensity: 35,
    defaultACH: 6,
  },
  conference: {
    rp: 5,
    ra: 0.06,
    defaultOccupantDensity: 50,
    defaultACH: 6,
  },
  lobby: {
    rp: 5,
    ra: 0.06,
    defaultOccupantDensity: 30,
    defaultACH: 6,
  },
};
```

## Functions

### calculateRoomArea

Calculates floor area in square feet from dimensions in inches.

```typescript
export function calculateRoomArea(widthInches: number, lengthInches: number): number
```

**Formula:**
```typescript
area = (widthInches / 12) * (lengthInches / 12)
```

**Example:**
```typescript
calculateRoomArea(240, 180);  // 20' × 15' = 300 sq ft
```

### calculateRoomVolume

Calculates volume in cubic feet from dimensions in inches.

```typescript
export function calculateRoomVolume(
  widthInches: number,
  lengthInches: number,
  heightInches: number
): number
```

**Formula:**
```typescript
volume = area * (heightInches / 12)
```

**Example:**
```typescript
calculateRoomVolume(240, 180, 96);  // 20'×15'×8' = 2400 cu ft
```

### calculateVentilationCFM

Calculates required ventilation using ASHRAE 62.1 Rp/Ra method.

```typescript
export function calculateVentilationCFM(
  occupancyType: OccupancyType,
  areaSqFt: number,
  occupants?: number
): number
```

**Formula:**
```typescript
// Estimate occupants if not provided
estimatedOccupants = (areaSqFt / 1000) * defaultOccupantDensity

// Calculate components
peopleComponent = Rp * occupants
areaComponent = Ra * areaSqFt

// Total CFM (rounded to nearest 5)
totalCFM = peopleComponent + areaComponent
```

**Examples:**
```typescript
// Office: 300 sq ft
calculateVentilationCFM('office', 300);
// Occupants: (300/1000) * 5 = 1.5 people
// People: 5 * 1.5 = 7.5 CFM
// Area: 0.06 * 300 = 18 CFM
// Total: 25 CFM (rounded to 25)

// Restaurant: 1000 sq ft with 70 occupants
calculateVentilationCFM('restaurant', 1000, 70);
// People: 7.5 * 70 = 525 CFM
// Area: 0.18 * 1000 = 180 CFM
// Total: 705 CFM

// Commercial Kitchen: 500 sq ft (area-based only)
calculateVentilationCFM('kitchen_commercial', 500);
// People: 0 * 5 = 0 CFM
// Area: 0.7 * 500 = 350 CFM
// Total: 350 CFM
```

### calculateACHtoCFM

Converts air changes per hour to CFM.

```typescript
export function calculateACHtoCFM(ach: number, volumeCuFt: number): number
```

**Formula:**
```typescript
CFM = (volumeCuFt * ach) / 60
```

**Example:**
```typescript
// 2400 cu ft room, 6 ACH
calculateACHtoCFM(6, 2400);
// (2400 * 6) / 60 = 240 CFM
```

### calculateRoomValues

Computes all calculated values for a room entity.

```typescript
export function calculateRoomValues(room: Room): Room['calculated']
```

**Returns:**
```typescript
{
  area: number;         // Square feet
  volume: number;       // Cubic feet
  requiredCFM: number;  // Higher of ACH or ventilation CFM
}
```

**Logic:**
```typescript
// Calculate both methods
achCFM = calculateACHtoCFM(room.props.airChangesPerHour, volume);
ventilationCFM = calculateVentilationCFM(room.props.occupancyType, area);

// Use the higher requirement
requiredCFM = Math.max(achCFM, ventilationCFM);
```

## Usage Examples

### Basic Room Calculations

```typescript
import {
  calculateRoomArea,
  calculateRoomVolume,
  calculateVentilationCFM,
  calculateACHtoCFM,
} from '@/features/canvas/calculators/ventilation';

// Office room: 20' × 12' × 8'
const area = calculateRoomArea(240, 144);     // 240 sq ft
const volume = calculateRoomVolume(240, 144, 96);  // 1920 cu ft

// ASHRAE 62.1 ventilation
const ventCFM = calculateVentilationCFM('office', area);  // ~20 CFM

// ACH method (6 ACH typical for office)
const achCFM = calculateACHtoCFM(6, volume);  // 192 CFM

// Required CFM is higher of the two
const required = Math.max(ventCFM, achCFM);  // 192 CFM
```

### Complete Room Calculation

```typescript
import { calculateRoomValues } from '@/features/canvas/calculators/ventilation';

const room: Room = {
  id: 'room-1',
  type: 'room',
  props: {
    name: 'Conference Room',
    width: 300,         // 25 feet
    length: 240,        // 20 feet
    height: 96,         // 8 feet
    occupancyType: 'conference',
    airChangesPerHour: 6,
  },
  // ... other fields
};

const calculated = calculateRoomValues(room);
// {
//   area: 500,           // 25' × 20'
//   volume: 4000,        // 500 × 8'
//   requiredCFM: 430,    // Max of ACH (400) and ventilation (430)
// }
```

### High Ventilation Requirements

```typescript
// Commercial kitchen with high ventilation needs
const kitchenArea = calculateRoomArea(360, 240);  // 30' × 20' = 600 sq ft
const kitchenVolume = calculateRoomVolume(360, 240, 120);  // 10' ceiling

// ASHRAE requires 0.7 CFM/sq ft for kitchens
const ventCFM = calculateVentilationCFM('kitchen_commercial', kitchenArea);
// 0.7 * 600 = 420 CFM

// Typical 25 ACH for commercial kitchens
const achCFM = calculateACHtoCFM(25, kitchenVolume);
// (6000 * 25) / 60 = 2500 CFM

const required = Math.max(ventCFM, achCFM);  // 2500 CFM
```

## ASHRAE 62.1 Background

The calculator implements the Ventilation Rate Procedure from ASHRAE Standard 62.1:

**Required Ventilation = Rp × People + Ra × Area**

Where:
- **Rp** = Outdoor airflow rate required per person (CFM/person)
- **Ra** = Outdoor airflow rate required per unit area (CFM/sq ft)
- **People** = Number of occupants
- **Area** = Floor area (sq ft)

## Rounding Rules

```typescript
// Area and volume: 2 decimal places
area = round(value, 2);

// CFM: Rounded to nearest 5 for practical duct sizing
cfm = roundToNearest(value, 5);
```

## Testing

```typescript
describe('VentilationCalculator', () => {
  it('calculates room area correctly', () => {
    expect(calculateRoomArea(240, 180)).toBe(300);  // 20' × 15'
  });

  it('calculates room volume correctly', () => {
    expect(calculateRoomVolume(240, 180, 96)).toBe(2400);  // 20'×15'×8'
  });

  it('calculates office ventilation CFM', () => {
    const cfm = calculateVentilationCFM('office', 1000);
    // (1000/1000)*5 people = 5 people
    // Rp: 5 * 5 = 25
    // Ra: 0.06 * 1000 = 60
    // Total: 85 CFM
    expect(cfm).toBe(85);
  });

  it('uses higher of ACH or ventilation', () => {
    const room: Room = {
      props: {
        width: 240,
        length: 180,
        height: 96,
        occupancyType: 'office',
        airChangesPerHour: 8,  // High ACH
      },
      // ... other fields
    };

    const calc = calculateRoomValues(room);

    // ACH: (2400 * 8) / 60 = 320 CFM
    // Vent: ~25 CFM
    // Should use 320 CFM
    expect(calc.requiredCFM).toBe(320);
  });

  it('rounds CFM to nearest 5', () => {
    const cfm = calculateVentilationCFM('retail', 243);
    // Should be rounded to nearest 5
    expect(cfm % 5).toBe(0);
  });
});
```

## Related Elements

- [Room Schema](../03-schemas/RoomSchema.md) - Room data structure with occupancy types
- [RoomDefaults](../08-entities/RoomDefaults.md) - Room factory using calculations
- [useCalculations](../07-hooks/useCalculations.md) - Hook that applies these calculations
- [RoomInspector](../01-components/inspector/RoomInspector.md) - Displays calculated values
