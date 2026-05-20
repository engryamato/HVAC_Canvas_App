# Equipment Schema

## Overview

The Equipment Schema defines the data structure and validation rules for Equipment entities in the HVAC Canvas application. Equipment represents HVAC components such as hoods, fans, diffusers, dampers, and air handlers, each with specific capacity, pressure, and dimensional properties.

## Location

```
src/core/schema/equipment.schema.ts
```

## Purpose

- Define the structure of Equipment entity data
- Support multiple equipment types (hood, fan, diffuser, damper, air_handler, furnace, rtu)
- Validate equipment dimensions and performance characteristics
- Support multiple unit systems (CFM/m³/h, in.w.g./Pa, in/mm)
- Provide manufacturer and model information
- Enable duct and location tagging
- Provide TypeScript type inference for compile-time safety

## Dependencies

- `zod` - Schema validation library
- `@/core/schema/base.schema` - Base entity schema

## Schema Definitions

### EquipmentTypeSchema

Defines the allowed equipment types for HVAC components.

```typescript
export const EquipmentTypeSchema = z.enum([
  'hood',
  'fan',
  'diffuser',
  'damper',
  'air_handler',
  'furnace',
  'rtu',
]);

export type EquipmentType = z.infer<typeof EquipmentTypeSchema>;
```

**Supported Equipment Types:**
- `hood` - Exhaust hoods (typically kitchen or lab)
- `fan` - Fans and blowers
- `diffuser` - Supply air diffusers
- `damper` - Airflow control dampers
- `air_handler` - Air Handling Units (AHU)
- `furnace` - Gas or electric furnaces
- `rtu` - Rooftop units

### Unit Schemas

Multiple unit systems are supported for international compatibility.

```typescript
// Capacity units
export const CapacityUnitSchema = z.enum(['CFM', 'm3/h']);
export type CapacityUnit = z.infer<typeof CapacityUnitSchema>;

// Static pressure units
export const StaticPressureUnitSchema = z.enum(['in_wg', 'Pa']);
export type StaticPressureUnit = z.infer<typeof StaticPressureUnitSchema>;

// Mount height units
export const MountHeightUnitSchema = z.enum(['in', 'mm']);
export type MountHeightUnit = z.infer<typeof MountHeightUnitSchema>;
```

**Unit Systems:**
- Capacity: `CFM` (cubic feet per minute) or `m3/h` (cubic meters per hour)
- Static Pressure: `in_wg` (inches water gauge) or `Pa` (Pascals)
- Mount Height: `in` (inches) or `mm` (millimeters)

### EquipmentPropsSchema

Defines the editable properties for all equipment types.

```typescript
export const EquipmentPropsSchema = z.object({
  name: z.string().min(1).max(100),
  equipmentType: EquipmentTypeSchema,
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  // Capacity with explicit unit
  capacity: z.number().min(1).max(100000).describe('Airflow capacity'),
  capacityUnit: CapacityUnitSchema.default('CFM'),
  // Static pressure with explicit unit
  staticPressure: z.number().min(0).max(20).describe('Static pressure'),
  staticPressureUnit: StaticPressureUnitSchema.default('in_wg'),
  // Physical dimensions
  width: z.number().positive().describe('Width in inches'),
  depth: z.number().positive().describe('Depth in inches'),
  height: z.number().positive().describe('Height in inches'),
  // Mount height with explicit unit
  mountHeight: z.number().min(0).optional().describe('Height from finished floor'),
  mountHeightUnit: MountHeightUnitSchema.default('in'),
  // Connection reference
  connectedDuctId: z.string().uuid().optional().describe('Reference to connected Duct.id'),
  // Location tag for identification
  locationTag: z.string().max(50).optional().describe('Location tag e.g. "ROOF-1", "MECH-101"'),
});

export type EquipmentProps = z.infer<typeof EquipmentPropsSchema>;
```

**Validation Rules:**
- `name`: 1-100 characters
- `equipmentType`: Must be one of the valid equipment types
- `manufacturer`, `model`: Optional, max 100 characters each
- `capacity`: 1-100,000 (CFM or m³/h)
- `staticPressure`: 0-20 (in.w.g. or Pa)
- `width`, `depth`, `height`: Positive numbers (inches)
- `mountHeight`: Non-negative, optional (inches or mm)
- `connectedDuctId`: Optional UUID reference
- `locationTag`: Optional, max 50 characters

### Complete EquipmentSchema

```typescript
export const EquipmentSchema = BaseEntitySchema.extend({
  type: z.literal('equipment'),
  props: EquipmentPropsSchema,
});

export type Equipment = z.infer<typeof EquipmentSchema>;
```

## Default Values

### Default Equipment by Type

```typescript
export const DEFAULT_EQUIPMENT_PROPS: Record<EquipmentType, Omit<EquipmentProps, 'name'>> = {
  hood: {
    equipmentType: 'hood',
    capacity: 1000,
    capacityUnit: 'CFM',
    staticPressure: 0.5,
    staticPressureUnit: 'in_wg',
    width: 48,
    depth: 36,
    height: 24,
    mountHeightUnit: 'in',
  },
  fan: {
    equipmentType: 'fan',
    capacity: 2000,
    capacityUnit: 'CFM',
    staticPressure: 1.0,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 24,
    height: 24,
    mountHeightUnit: 'in',
  },
  diffuser: {
    equipmentType: 'diffuser',
    capacity: 200,
    capacityUnit: 'CFM',
    staticPressure: 0.1,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 24,
    height: 8,
    mountHeightUnit: 'in',
  },
  damper: {
    equipmentType: 'damper',
    capacity: 500,
    capacityUnit: 'CFM',
    staticPressure: 0.05,
    staticPressureUnit: 'in_wg',
    width: 12,
    depth: 12,
    height: 6,
    mountHeightUnit: 'in',
  },
  air_handler: {
    equipmentType: 'air_handler',
    capacity: 5000,
    capacityUnit: 'CFM',
    staticPressure: 2.0,
    staticPressureUnit: 'in_wg',
    width: 60,
    depth: 48,
    height: 72,
    mountHeightUnit: 'in',
  },
  furnace: {
    equipmentType: 'furnace',
    capacity: 80000,
    capacityUnit: 'CFM',
    staticPressure: 0.5,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 36,
    height: 48,
    mountHeightUnit: 'in',
  },
  rtu: {
    equipmentType: 'rtu',
    capacity: 12000,
    capacityUnit: 'CFM',
    staticPressure: 1.5,
    staticPressureUnit: 'in_wg',
    width: 84,
    depth: 48,
    height: 36,
    mountHeightUnit: 'in',
  },
};
```

### Factory Function

```typescript
export function createDefaultEquipmentProps(type: EquipmentType): EquipmentProps {
  const typeLabel =
    type === 'air_handler' ? 'Air Handler' :
    type === 'furnace' ? 'Furnace' :
    type === 'rtu' ? 'RTU' :
    type.charAt(0).toUpperCase() + type.slice(1);
  return {
    name: `New ${typeLabel}`,
    ...DEFAULT_EQUIPMENT_PROPS[type],
  };
}
```

## Validation Examples

### Valid Hood Equipment

```typescript
const validHood = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'equipment',
  transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 2,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
  props: {
    name: 'Kitchen Hood #1',
    equipmentType: 'hood',
    manufacturer: 'CaptiveAire',
    model: 'EXT-12',
    capacity: 2400,
    capacityUnit: 'CFM',
    staticPressure: 0.75,
    staticPressureUnit: 'in_wg',
    width: 120,
    depth: 48,
    height: 30,
    mountHeight: 84,
    mountHeightUnit: 'in',
    locationTag: 'KITCHEN-01',
  },
};

const result = EquipmentSchema.safeParse(validHood);
// result.success === true
```

### Valid Air Handler with Metric Units

```typescript
const validAHU = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  type: 'equipment',
  transform: { x: 500, y: 300, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 1,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
  props: {
    name: 'AHU-1',
    equipmentType: 'air_handler',
    manufacturer: 'Trane',
    model: 'Voyager III',
    capacity: 8500,
    capacityUnit: 'm3/h',
    staticPressure: 500,
    staticPressureUnit: 'Pa',
    width: 60,
    depth: 48,
    height: 84,
    mountHeight: 2000,
    mountHeightUnit: 'mm',
    locationTag: 'ROOF-AHU1',
    connectedDuctId: '550e8400-e29b-41d4-a716-446655440010',
  },
};

const result = EquipmentSchema.safeParse(validAHU);
// result.success === true
```

### Invalid Equipment (Negative Capacity)

```typescript
const invalidEquipment = {
  // ...valid base fields
  props: {
    name: 'Bad Fan',
    equipmentType: 'fan',
    capacity: -100,  // ❌ Must be positive
    capacityUnit: 'CFM',
    staticPressure: 1.0,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 24,
    height: 24,
  },
};

const result = EquipmentPropsSchema.safeParse(invalidEquipment.props);
// result.success === false
// result.error.issues[0].message === 'Number must be greater than or equal to 1'
```

### Invalid Equipment (Name Too Long)

```typescript
const invalidEquipment = {
  // ...valid base fields
  props: {
    name: 'A'.repeat(101),  // ❌ Exceeds 100 character limit
    equipmentType: 'diffuser',
    capacity: 200,
    capacityUnit: 'CFM',
    staticPressure: 0.1,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 24,
    height: 8,
  },
};

const result = EquipmentPropsSchema.safeParse(invalidEquipment.props);
// result.success === false
```

## Entity Structure Diagram

```
Equipment Entity
├── id: string (UUID)
├── type: 'equipment'
├── transform
│   ├── x: number
│   ├── y: number
│   ├── rotation: number
│   ├── scaleX: number
│   └── scaleY: number
├── zIndex: number
├── createdAt: string (ISO date)
├── modifiedAt: string (ISO date)
└── props
    ├── name: string
    ├── equipmentType: EquipmentType
    ├── manufacturer?: string
    ├── model?: string
    ├── capacity: number
    ├── capacityUnit: 'CFM' | 'm3/h' (default: 'CFM')
    ├── staticPressure: number
    ├── staticPressureUnit: 'in_wg' | 'Pa' (default: 'in_wg')
    ├── width: number (inches)
    ├── depth: number (inches)
    ├── height: number (inches)
    ├── mountHeight?: number
    ├── mountHeightUnit: 'in' | 'mm' (default: 'in')
    ├── connectedDuctId?: string (UUID)
    └── locationTag?: string
```

## Usage Examples

### Creating Equipment Using Factory

```typescript
import { createDefaultEquipmentProps } from '@/core/schema/equipment.schema';
import { createDefaultTransform, getCurrentTimestamp } from '@/core/schema/base.schema';

// Create a new hood
const hood = {
  id: crypto.randomUUID(),
  type: 'equipment',
  transform: createDefaultTransform({ x: 200, y: 300 }),
  zIndex: 2,
  createdAt: getCurrentTimestamp(),
  modifiedAt: getCurrentTimestamp(),
  props: createDefaultEquipmentProps('hood'),
};

// Create an air handler with custom properties
const airHandler = {
  id: crypto.randomUUID(),
  type: 'equipment',
  transform: createDefaultTransform({ x: 500, y: 100 }),
  zIndex: 1,
  createdAt: getCurrentTimestamp(),
  modifiedAt: getCurrentTimestamp(),
  props: {
    ...createDefaultEquipmentProps('air_handler'),
    manufacturer: 'Trane',
    model: 'Voyager',
    capacity: 10000,
    locationTag: 'ROOF-1',
  },
};
```

### Validating Equipment Props

```typescript
import { EquipmentPropsSchema } from '@/core/schema/equipment.schema';

const validateEquipmentProps = (input: unknown) => {
  const result = EquipmentPropsSchema.safeParse(input);

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

// Usage
const userInput = {
  name: 'Exhaust Fan',
  equipmentType: 'fan',
  capacity: 3000,
  capacityUnit: 'CFM',
  staticPressure: 1.5,
  staticPressureUnit: 'in_wg',
  width: 30,
  depth: 30,
  height: 30,
};

const validation = validateEquipmentProps(userInput);
if (validation.valid) {
  console.log('Valid equipment props:', validation.data);
} else {
  console.error('Validation errors:', validation.errors);
}
```

### Unit Conversion Helpers

```typescript
import { EquipmentProps } from '@/core/schema/equipment.schema';

function convertCapacityToImperial(props: EquipmentProps): number {
  if (props.capacityUnit === 'CFM') {
    return props.capacity;
  }
  // Convert m³/h to CFM
  return props.capacity * 0.588577779;
}

function convertStaticPressureToImperial(props: EquipmentProps): number {
  if (props.staticPressureUnit === 'in_wg') {
    return props.staticPressure;
  }
  // Convert Pa to in.w.g.
  return props.staticPressure * 0.00401463078;
}

function getEquipmentDisplayCapacity(props: EquipmentProps): string {
  return `${props.capacity} ${props.capacityUnit}`;
}
```

### Type-Safe Equipment Filtering

```typescript
import { Equipment, EquipmentType } from '@/core/schema/equipment.schema';

function filterEquipmentByType(
  equipment: Equipment[],
  type: EquipmentType
): Equipment[] {
  return equipment.filter((eq) => eq.props.equipmentType === type);
}

function getEquipmentWithTag(
  equipment: Equipment[],
  tag: string
): Equipment[] {
  return equipment.filter((eq) => eq.props.locationTag === tag);
}

function getConnectedEquipment(
  equipment: Equipment[],
  ductId: string
): Equipment[] {
  return equipment.filter((eq) => eq.props.connectedDuctId === ductId);
}
```

### Updating Equipment Properties

```typescript
import { Equipment } from '@/core/schema/equipment.schema';
import { getCurrentTimestamp } from '@/core/schema/base.schema';

function updateEquipmentCapacity(
  equipment: Equipment,
  newCapacity: number
): Equipment {
  return {
    ...equipment,
    props: {
      ...equipment.props,
      capacity: newCapacity,
    },
    modifiedAt: getCurrentTimestamp(),
  };
}

function connectEquipmentToDuct(
  equipment: Equipment,
  ductId: string
): Equipment {
  return {
    ...equipment,
    props: {
      ...equipment.props,
      connectedDuctId: ductId,
    },
    modifiedAt: getCurrentTimestamp(),
  };
}
```

## Related Elements

- [BaseSchema](./BaseSchema.md) - Base entity schema
- [DuctSchema](./DuctSchema.md) - Connected via connectedDuctId
- [EquipmentTool](../04-tools/EquipmentTool.md) - Equipment creation tool
- [EquipmentRenderer](../05-renderers/EquipmentRenderer.md) - Equipment visualization
- [EquipmentInspector](../01-components/inspector/EquipmentInspector.md) - Equipment property editor
- [EquipmentDefaults](../08-entities/EquipmentDefaults.md) - Equipment factory functions

## Testing

```typescript
describe('EquipmentTypeSchema', () => {
  it('validates all equipment types', () => {
    const types = ['hood', 'fan', 'diffuser', 'damper', 'air_handler'];
    types.forEach((type) => {
      expect(EquipmentTypeSchema.safeParse(type).success).toBe(true);
    });
  });

  it('rejects invalid equipment type', () => {
    const result = EquipmentTypeSchema.safeParse('compressor');
    expect(result.success).toBe(false);
  });
});

describe('EquipmentPropsSchema', () => {
  const validProps = {
    name: 'Test Equipment',
    equipmentType: 'fan',
    capacity: 2000,
    capacityUnit: 'CFM',
    staticPressure: 1.0,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 24,
    height: 24,
    mountHeightUnit: 'in',
  };

  it('validates correct equipment props', () => {
    const result = EquipmentPropsSchema.safeParse(validProps);
    expect(result.success).toBe(true);
  });

  it('applies default units', () => {
    const minimal = {
      name: 'Test',
      equipmentType: 'fan',
      capacity: 2000,
      staticPressure: 1.0,
      width: 24,
      depth: 24,
      height: 24,
    };
    const result = EquipmentPropsSchema.parse(minimal);
    expect(result.capacityUnit).toBe('CFM');
    expect(result.staticPressureUnit).toBe('in_wg');
    expect(result.mountHeightUnit).toBe('in');
  });

  it('accepts optional manufacturer and model', () => {
    const withDetails = {
      ...validProps,
      manufacturer: 'Trane',
      model: 'XYZ-123',
    };
    expect(EquipmentPropsSchema.safeParse(withDetails).success).toBe(true);
  });

  it('accepts optional mount height', () => {
    const withMount = { ...validProps, mountHeight: 96 };
    expect(EquipmentPropsSchema.safeParse(withMount).success).toBe(true);
  });

  it('accepts optional location tag', () => {
    const withTag = { ...validProps, locationTag: 'ROOF-1' };
    expect(EquipmentPropsSchema.safeParse(withTag).success).toBe(true);
  });

  it('rejects negative capacity', () => {
    const invalid = { ...validProps, capacity: -100 };
    const result = EquipmentPropsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects negative static pressure', () => {
    const invalid = { ...validProps, staticPressure: -0.5 };
    const result = EquipmentPropsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects zero or negative dimensions', () => {
    const invalid = { ...validProps, width: 0 };
    expect(EquipmentPropsSchema.safeParse(invalid).success).toBe(false);

    const invalid2 = { ...validProps, height: -10 };
    expect(EquipmentPropsSchema.safeParse(invalid2).success).toBe(false);
  });

  it('validates metric units', () => {
    const metric = {
      ...validProps,
      capacityUnit: 'm3/h',
      staticPressureUnit: 'Pa',
      mountHeightUnit: 'mm',
    };
    expect(EquipmentPropsSchema.safeParse(metric).success).toBe(true);
  });
});

describe('createDefaultEquipmentProps', () => {
  it('creates props for hood', () => {
    const props = createDefaultEquipmentProps('hood');
    expect(props.name).toBe('New Hood');
    expect(props.equipmentType).toBe('hood');
    expect(props.capacity).toBe(1000);
  });

  it('creates props for air_handler', () => {
    const props = createDefaultEquipmentProps('air_handler');
    expect(props.name).toBe('New Air Handler');
    expect(props.equipmentType).toBe('air_handler');
    expect(props.capacity).toBe(5000);
  });

  it('creates different defaults for each type', () => {
    const types: EquipmentType[] = ['hood', 'fan', 'diffuser', 'damper', 'air_handler'];
    const defaults = types.map(createDefaultEquipmentProps);

    // Each type should have different capacity
    const capacities = defaults.map((p) => p.capacity);
    expect(new Set(capacities).size).toBe(5);
  });
});

describe('EquipmentSchema', () => {
  it('validates complete equipment entity', () => {
    const equipment = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'equipment',
      transform: { x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 2,
      createdAt: '2025-12-29T10:00:00Z',
      modifiedAt: '2025-12-29T10:00:00Z',
      props: createDefaultEquipmentProps('fan'),
    };
    const result = EquipmentSchema.safeParse(equipment);
    expect(result.success).toBe(true);
  });
});
```
