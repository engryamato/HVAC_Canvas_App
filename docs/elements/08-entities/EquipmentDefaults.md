# Equipment Defaults

## Overview

The Equipment Defaults module provides factory functions for creating equipment entities with type-specific defaults and auto-incrementing names.

## Location

```
src/features/canvas/entities/equipmentDefaults.ts
```

## Purpose

- Create equipment entities for all 5 types
- Provide type-specific default dimensions and capacities
- Auto-increment equipment names by type
- Support customization via overrides

## Constants

### EQUIPMENT_TYPE_DEFAULTS

```typescript
const EQUIPMENT_TYPE_DEFAULTS: Record<EquipmentType, {
  capacity: number;
  staticPressure: number;
  width: number;
  depth: number;
  height: number;
}> = {
  hood:        { capacity: 1200, staticPressure: 0.5, width: 48, depth: 36, height: 24 },
  fan:         { capacity: 2000, staticPressure: 1.0, width: 24, depth: 24, height: 24 },
  diffuser:    { capacity: 150,  staticPressure: 0.1, width: 24, depth: 24, height: 6 },
  damper:      { capacity: 500,  staticPressure: 0.05, width: 12, depth: 6, height: 12 },
  air_handler: { capacity: 10000, staticPressure: 2.0, width: 72, depth: 48, height: 60 },
};
```

### EQUIPMENT_TYPE_LABELS

```typescript
const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  hood:        'Exhaust Hood',
  fan:         'Fan',
  diffuser:    'Diffuser',
  damper:      'Damper',
  air_handler: 'Air Handling Unit',
};
```

## Functions

### createEquipment

```typescript
export function createEquipment(
  equipmentType: EquipmentType,
  overrides?: Partial<{
    name: string;
    x: number;
    y: number;
    capacity: number;
    staticPressure: number;
    width: number;
    depth: number;
    height: number;
    manufacturer: string;
    model: string;
  }>
): Equipment
```

## Usage

```typescript
import { createEquipment } from '@/features/canvas/entities/equipmentDefaults';

// Create hood with defaults
const hood = createEquipment('hood');
// { name: 'Exhaust Hood 1', capacity: 1200, width: 48, ... }

// Create fan with custom values
const fan = createEquipment('fan', {
  name: 'Roof Exhaust Fan',
  capacity: 5000,
  manufacturer: 'Greenheck',
  model: 'SWB-180',
});

// Create all types
const hood = createEquipment('hood');
const fan = createEquipment('fan');
const diffuser = createEquipment('diffuser');
const damper = createEquipment('damper');
const ahu = createEquipment('air_handler');
```

## Related Elements

- [Equipment Schema](../03-schemas/EquipmentSchema.md)
- [EquipmentRenderer](../05-renderers/EquipmentRenderer.md)
