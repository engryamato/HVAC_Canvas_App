# Room Schema

## Overview

The Room Schema defines the data structure and validation rules for Room entities in the HVAC Canvas application. Rooms represent enclosed spaces that require ventilation calculations based on their dimensions and occupancy type.

## Location

```
src/core/schema/room.schema.ts
```

## Purpose

- Define the structure of Room entity data
- Validate room dimensions and properties
- Enforce minimum/maximum constraints
- Support occupancy-based ventilation calculations
- Provide TypeScript type inference

## Dependencies

- `zod` - Schema validation library
- `@/core/schema/base.schema` - Base entity schema

## Schema Definitions

### OccupancyTypeSchema

Defines the allowed occupancy types per ASHRAE 62.1 standard.

```typescript
export const OccupancyTypeSchema = z.enum([
  'office',
  'retail',
  'restaurant',
  'kitchen_commercial',
  'warehouse',
  'classroom',
  'conference',
  'lobby',
]);

export type OccupancyType = z.infer<typeof OccupancyTypeSchema>;
```

### RoomPropsSchema

Defines the editable properties of a room.

```typescript
export const RoomPropsSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  // Dimensions (in inches)
  width: z.number()
    .min(1, 'Width must be at least 1 inch')
    .max(10000, 'Width cannot exceed 10,000 inches'),
  length: z.number()
    .min(1, 'Length must be at least 1 inch')
    .max(10000, 'Length cannot exceed 10,000 inches'),
  ceilingHeight: z.number()
    .min(1, 'Ceiling height must be at least 1 inch')
    .max(500, 'Ceiling height cannot exceed 500 inches'),
  occupancyType: OccupancyTypeSchema,
  airChangesPerHour: z.number()
    .min(1, 'ACH must be at least 1')
    .max(100, 'ACH cannot exceed 100'),
  notes: z.string().max(5000).optional(),
});

export type RoomProps = z.infer<typeof RoomPropsSchema>;
```

### RoomCalculatedSchema

Defines the calculated (read-only) values.

```typescript
export const RoomCalculatedSchema = z.object({
  area: z.number().nonnegative().describe('Floor area in sq ft'),
  volume: z.number().nonnegative().describe('Room volume in cu ft'),
  requiredCFM: z.number().nonnegative().describe('Required airflow in CFM'),
});

export type RoomCalculated = z.infer<typeof RoomCalculatedSchema>;
```

### Complete RoomSchema

```typescript
export const RoomSchema = BaseEntitySchema.extend({
  type: z.literal('room'),
  props: RoomPropsSchema,
  calculated: RoomCalculatedSchema,
});

export type Room = z.infer<typeof RoomSchema>;
```

## Default Values

```typescript
export const DEFAULT_ROOM_PROPS: RoomProps = {
  name: 'New Room',
  width: 120, // 10 feet
  length: 120, // 10 feet
  ceilingHeight: 96, // 8 feet
  occupancyType: 'office',
  airChangesPerHour: 4,
};
```

## Validation Examples

### Valid Room

```typescript
const validRoom = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'room',
  transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 1,
  createdAt: '2025-12-28T10:00:00Z',
  modifiedAt: '2025-12-28T10:00:00Z',
  props: {
    name: 'Kitchen',
    width: 180,
    length: 240,
    ceilingHeight: 96,
    occupancyType: 'kitchen_commercial',
    airChangesPerHour: 12,
  },
  calculated: {
    area: 300,        // 15 ft × 20 ft
    volume: 2400,     // 300 × 8 ft
    requiredCFM: 480, // (2400 × 12) / 60
  },
};

const result = RoomSchema.safeParse(validRoom);
// result.success === true
```

### Invalid Room (Dimension Too Small)

```typescript
const invalidRoom = {
  // ...valid fields
  props: {
    name: 'Closet',
    width: 0,  // ❌ Below minimum 1 inch
    length: 6,
    ceilingHeight: 96,
    occupancyType: 'office',
    airChangesPerHour: 6,
  },
};

const result = RoomSchema.safeParse(invalidRoom);
// result.success === false
// result.error.issues[0].message === 'Width must be at least 1 inch'
```

## Calculation Formulas

```typescript
// Area (square feet)
area = (width / 12) * (length / 12)

// Volume (cubic feet)
volume = area * (ceilingHeight / 12)

// Required CFM using ACH method
requiredCFM = (volume * airChangesPerHour) / 60
```

## Entity Structure Diagram

```
Room Entity
├── id: string (UUID)
├── type: 'room'
├── transform
│   ├── x: number
│   ├── y: number
│   ├── rotation: number
│   ├── scaleX: number
│   └── scaleY: number
├── zIndex: number
├── createdAt: string (ISO date)
├── modifiedAt: string (ISO date)
├── props
│   ├── name: string
│   ├── width: number (inches)
│   ├── length: number (inches)
│   ├── ceilingHeight: number (inches)
│   ├── occupancyType: OccupancyType
│   ├── airChangesPerHour: number
│   └── notes?: string
└── calculated
    ├── area: number (sq ft)
    ├── volume: number (cu ft)
    └── requiredCFM: number
```

## Usage Examples

### Creating a Room

```typescript
import { createRoom } from '@/features/canvas/entities/roomDefaults';

const room = createRoom({
  x: 100,
  y: 200,
  width: 240,
  length: 180,
});

// Result:
// {
//   id: 'uuid...',
//   type: 'room',
//   props: { name: 'Room 1', width: 240, length: 180, ... },
//   ...
// }
```

### Validating User Input

```typescript
const validateRoomProps = (input: unknown) => {
  const result = RoomPropsSchema.safeParse(input);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    };
  }

  return { valid: true, data: result.data };
};
```

## Related Elements

- [BaseSchema](./BaseSchema.md) - Base entity schema
- [RoomTool](../04-tools/RoomTool.md) - Room creation tool
- [RoomRenderer](../05-renderers/RoomRenderer.md) - Room visualization
- [RoomInspector](../01-components/inspector/RoomInspector.md) - Room property editor
- [RoomDefaults](../08-entities/RoomDefaults.md) - Room factory
- [VentilationCalculator](../06-calculators/VentilationCalculator.md) - CFM calculations

## Testing

```typescript
describe('RoomSchema', () => {
  it('validates correct room data', () => {
    const result = RoomSchema.safeParse(validRoomData);
    expect(result.success).toBe(true);
  });

  it('rejects width below minimum', () => {
    const result = RoomPropsSchema.safeParse({ ...validProps, width: 0 });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('at least 1 inch');
  });

  it('rejects invalid occupancy type', () => {
    const result = OccupancyTypeSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });

  it('allows optional notes', () => {
    const withNotes = { ...validProps, notes: 'Important room' };
    const withoutNotes = { ...validProps };

    expect(RoomPropsSchema.safeParse(withNotes).success).toBe(true);
    expect(RoomPropsSchema.safeParse(withoutNotes).success).toBe(true);
  });

  it('enforces name length limit', () => {
    const longName = 'A'.repeat(101);
    const result = RoomPropsSchema.safeParse({ ...validProps, name: longName });
    expect(result.success).toBe(false);
  });
});
```
