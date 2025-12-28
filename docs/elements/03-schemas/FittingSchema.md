# Fitting Schema

## Overview

The Fitting Schema defines the data structure and validation rules for Fitting entities in the HVAC Canvas application. Fittings represent duct connections and transitions such as elbows, tees, reducers, and caps, with calculated equivalent lengths and pressure losses.

## Location

```
src/core/schema/fitting.schema.ts
```

## Purpose

- Define the structure of Fitting entity data
- Support multiple fitting types (elbows, tees, reducers, caps)
- Validate angle constraints for elbows
- Track duct connections (inlet and outlet)
- Calculate equivalent length and pressure loss
- Provide TypeScript type inference for compile-time safety

## Dependencies

- `zod` - Schema validation library
- `@/core/schema/base.schema` - Base entity schema

## Schema Definitions

### FittingTypeSchema

Defines the allowed fitting types for duct connections.

```typescript
export const FittingTypeSchema = z.enum(['elbow_90', 'elbow_45', 'tee', 'reducer', 'cap']);

export type FittingType = z.infer<typeof FittingTypeSchema>;
```

**Supported Fitting Types:**
- `elbow_90` - 90-degree elbow
- `elbow_45` - 45-degree elbow
- `tee` - T-junction fitting
- `reducer` - Size transition fitting
- `cap` - Duct end cap

### FittingPropsSchema

Defines the editable properties of a fitting.

```typescript
export const FittingPropsSchema = z.object({
  name: z.string().min(1).max(100).optional().describe('Optional fitting name/label'),
  fittingType: FittingTypeSchema,
  angle: z.number().min(0).max(180).optional().describe('Angle in degrees (for elbows)'),
  inletDuctId: z.string().uuid().optional(),
  outletDuctId: z.string().uuid().optional(),
});

export type FittingProps = z.infer<typeof FittingPropsSchema>;
```

**Validation Rules:**
- `name`: Optional, 1-100 characters if provided
- `fittingType`: Must be one of the valid fitting types
- `angle`: Optional, 0-180 degrees (primarily for elbows)
- `inletDuctId`: Optional UUID reference to incoming duct
- `outletDuctId`: Optional UUID reference to outgoing duct

### FittingCalculatedSchema

Defines the calculated (read-only) values for fitting performance.

```typescript
export const FittingCalculatedSchema = z.object({
  equivalentLength: z.number().nonnegative().describe('Equivalent length in feet'),
  pressureLoss: z.number().nonnegative().describe('Pressure loss in in.w.g.'),
});

export type FittingCalculated = z.infer<typeof FittingCalculatedSchema>;
```

**Calculated Fields:**
- `equivalentLength`: Equivalent straight duct length in feet (for pressure calculations)
- `pressureLoss`: Pressure loss through the fitting in inches water gauge

### Complete FittingSchema

```typescript
export const FittingSchema = BaseEntitySchema.extend({
  type: z.literal('fitting'),
  props: FittingPropsSchema,
  calculated: FittingCalculatedSchema,
});

export type Fitting = z.infer<typeof FittingSchema>;
```

## Default Values

### Default Props by Fitting Type

```typescript
export const DEFAULT_FITTING_PROPS: Record<FittingType, FittingProps> = {
  elbow_90: {
    fittingType: 'elbow_90',
    angle: 90,
  },
  elbow_45: {
    fittingType: 'elbow_45',
    angle: 45,
  },
  tee: {
    fittingType: 'tee',
  },
  reducer: {
    fittingType: 'reducer',
  },
  cap: {
    fittingType: 'cap',
  },
};
```

### Default Calculated Values

```typescript
export const DEFAULT_FITTING_CALCULATED: FittingCalculated = {
  equivalentLength: 0,
  pressureLoss: 0,
};
```

### Factory Function

```typescript
export function createDefaultFittingProps(type: FittingType, name?: string): FittingProps {
  return {
    ...DEFAULT_FITTING_PROPS[type],
    name: name ?? `New ${type.replace('_', ' ')}`,
  };
}
```

## Validation Examples

### Valid 90-Degree Elbow

```typescript
const valid90Elbow = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'fitting',
  transform: { x: 200, y: 300, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 1,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
  props: {
    name: 'Main Supply Elbow',
    fittingType: 'elbow_90',
    angle: 90,
    inletDuctId: '550e8400-e29b-41d4-a716-446655440010',
    outletDuctId: '550e8400-e29b-41d4-a716-446655440011',
  },
  calculated: {
    equivalentLength: 15,  // 15 feet equivalent
    pressureLoss: 0.08,    // 0.08 in.w.g.
  },
};

const result = FittingSchema.safeParse(valid90Elbow);
// result.success === true
```

### Valid Tee Fitting

```typescript
const validTee = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  type: 'fitting',
  transform: { x: 400, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 1,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
  props: {
    name: 'Branch Tee',
    fittingType: 'tee',
    inletDuctId: '550e8400-e29b-41d4-a716-446655440012',
    outletDuctId: '550e8400-e29b-41d4-a716-446655440013',
  },
  calculated: {
    equivalentLength: 20,
    pressureLoss: 0.12,
  },
};

const result = FittingSchema.safeParse(validTee);
// result.success === true
```

### Valid Reducer

```typescript
const validReducer = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  type: 'fitting',
  transform: { x: 100, y: 500, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 1,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
  props: {
    name: 'Size Transition',
    fittingType: 'reducer',
    inletDuctId: '550e8400-e29b-41d4-a716-446655440014',
    outletDuctId: '550e8400-e29b-41d4-a716-446655440015',
  },
  calculated: {
    equivalentLength: 5,
    pressureLoss: 0.03,
  },
};

const result = FittingSchema.safeParse(validReducer);
// result.success === true
```

### Invalid Fitting (Angle Out of Range)

```typescript
const invalidFitting = {
  // ...valid base fields
  props: {
    name: 'Bad Elbow',
    fittingType: 'elbow_90',
    angle: 270,  // ❌ Exceeds maximum 180 degrees
  },
};

const result = FittingPropsSchema.safeParse(invalidFitting.props);
// result.success === false
// result.error.issues[0].message === 'Number must be less than or equal to 180'
```

### Invalid Fitting (Invalid UUID)

```typescript
const invalidFitting = {
  // ...valid base fields
  props: {
    fittingType: 'tee',
    inletDuctId: 'not-a-uuid',  // ❌ Invalid UUID format
  },
};

const result = FittingPropsSchema.safeParse(invalidFitting.props);
// result.success === false
// result.error.issues[0].message === 'Invalid uuid'
```

## Calculation Formulas

```typescript
// Equivalent Length Calculation
// Based on ASHRAE fitting loss coefficients
const equivalentLengthFactors = {
  elbow_90: 15,    // 15 feet equivalent
  elbow_45: 8,     // 8 feet equivalent
  tee: 20,         // 20 feet equivalent (branch)
  reducer: 5,      // 5 feet equivalent
  cap: 0,          // Minimal loss
};

// Pressure Loss Calculation
// pressureLoss = (velocity_pressure × loss_coefficient)
// Where velocity_pressure = (velocity / 4005)²
// And loss_coefficient depends on fitting type and geometry
```

## Entity Structure Diagram

```
Fitting Entity
├── id: string (UUID)
├── type: 'fitting'
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
│   ├── name?: string
│   ├── fittingType: FittingType
│   ├── angle?: number (0-180 degrees)
│   ├── inletDuctId?: string (UUID)
│   └── outletDuctId?: string (UUID)
└── calculated
    ├── equivalentLength: number (feet)
    └── pressureLoss: number (in.w.g.)
```

## Usage Examples

### Creating Fittings Using Factory

```typescript
import { createDefaultFittingProps, DEFAULT_FITTING_CALCULATED } from '@/core/schema/fitting.schema';
import { createDefaultTransform, getCurrentTimestamp } from '@/core/schema/base.schema';

// Create a 90-degree elbow
const elbow90 = {
  id: crypto.randomUUID(),
  type: 'fitting',
  transform: createDefaultTransform({ x: 300, y: 400 }),
  zIndex: 1,
  createdAt: getCurrentTimestamp(),
  modifiedAt: getCurrentTimestamp(),
  props: createDefaultFittingProps('elbow_90', 'Main Elbow'),
  calculated: DEFAULT_FITTING_CALCULATED,
};

// Create a tee fitting with duct connections
const tee = {
  id: crypto.randomUUID(),
  type: 'fitting',
  transform: createDefaultTransform({ x: 500, y: 200 }),
  zIndex: 1,
  createdAt: getCurrentTimestamp(),
  modifiedAt: getCurrentTimestamp(),
  props: {
    ...createDefaultFittingProps('tee'),
    inletDuctId: '550e8400-e29b-41d4-a716-446655440020',
    outletDuctId: '550e8400-e29b-41d4-a716-446655440021',
  },
  calculated: DEFAULT_FITTING_CALCULATED,
};
```

### Validating Fitting Props

```typescript
import { FittingPropsSchema } from '@/core/schema/fitting.schema';

const validateFittingProps = (input: unknown) => {
  const result = FittingPropsSchema.safeParse(input);

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
  name: 'Custom Elbow',
  fittingType: 'elbow_45',
  angle: 45,
  inletDuctId: '550e8400-e29b-41d4-a716-446655440030',
};

const validation = validateFittingProps(userInput);
if (validation.valid) {
  console.log('Valid fitting props:', validation.data);
} else {
  console.error('Validation errors:', validation.errors);
}
```

### Calculating Fitting Performance

```typescript
import { FittingProps, FittingCalculated, FittingType } from '@/core/schema/fitting.schema';

// Equivalent length lookup table (in feet)
const EQUIVALENT_LENGTH: Record<FittingType, number> = {
  elbow_90: 15,
  elbow_45: 8,
  tee: 20,
  reducer: 5,
  cap: 0,
};

// Loss coefficient lookup table
const LOSS_COEFFICIENT: Record<FittingType, number> = {
  elbow_90: 0.75,
  elbow_45: 0.35,
  tee: 1.0,
  reducer: 0.25,
  cap: 0.0,
};

function calculateFittingMetrics(
  props: FittingProps,
  velocityPressure: number
): FittingCalculated {
  const equivalentLength = EQUIVALENT_LENGTH[props.fittingType];
  const lossCoefficient = LOSS_COEFFICIENT[props.fittingType];
  const pressureLoss = velocityPressure * lossCoefficient;

  return {
    equivalentLength,
    pressureLoss,
  };
}

// Usage with velocity from connected duct
function calculateFittingLoss(
  props: FittingProps,
  ductVelocity: number  // in FPM
): FittingCalculated {
  // Calculate velocity pressure: VP = (V / 4005)²
  const velocityPressure = Math.pow(ductVelocity / 4005, 2);
  return calculateFittingMetrics(props, velocityPressure);
}
```

### Type Guards

```typescript
import { FittingProps } from '@/core/schema/fitting.schema';

function isElbow(props: FittingProps): boolean {
  return props.fittingType === 'elbow_90' || props.fittingType === 'elbow_45';
}

function requiresAngle(props: FittingProps): boolean {
  return isElbow(props);
}

function hasInletDuct(props: FittingProps): boolean {
  return props.inletDuctId !== undefined;
}

function hasOutletDuct(props: FittingProps): boolean {
  return props.outletDuctId !== undefined;
}

function isFullyConnected(props: FittingProps): boolean {
  return hasInletDuct(props) && hasOutletDuct(props);
}
```

### Updating Fitting Connections

```typescript
import { Fitting } from '@/core/schema/fitting.schema';
import { getCurrentTimestamp } from '@/core/schema/base.schema';

function connectFittingToDucts(
  fitting: Fitting,
  inletDuctId: string,
  outletDuctId: string
): Fitting {
  return {
    ...fitting,
    props: {
      ...fitting.props,
      inletDuctId,
      outletDuctId,
    },
    modifiedAt: getCurrentTimestamp(),
  };
}

function disconnectFittingInlet(fitting: Fitting): Fitting {
  const { inletDuctId, ...restProps } = fitting.props;
  return {
    ...fitting,
    props: restProps,
    modifiedAt: getCurrentTimestamp(),
  };
}

function updateFittingAngle(fitting: Fitting, angle: number): Fitting {
  return {
    ...fitting,
    props: {
      ...fitting.props,
      angle,
    },
    modifiedAt: getCurrentTimestamp(),
  };
}
```

### Finding Connected Fittings

```typescript
import { Fitting } from '@/core/schema/fitting.schema';

function findFittingsByInletDuct(
  fittings: Fitting[],
  ductId: string
): Fitting[] {
  return fittings.filter((f) => f.props.inletDuctId === ductId);
}

function findFittingsByOutletDuct(
  fittings: Fitting[],
  ductId: string
): Fitting[] {
  return fittings.filter((f) => f.props.outletDuctId === ductId);
}

function findFittingsByDuct(
  fittings: Fitting[],
  ductId: string
): Fitting[] {
  return fittings.filter(
    (f) => f.props.inletDuctId === ductId || f.props.outletDuctId === ductId
  );
}
```

## Related Elements

- [BaseSchema](./BaseSchema.md) - Base entity schema
- [DuctSchema](./DuctSchema.md) - Connected via inletDuctId/outletDuctId
- [FittingTool](../04-tools/FittingTool.md) - Fitting creation tool
- [FittingRenderer](../05-renderers/FittingRenderer.md) - Fitting visualization
- [FittingInspector](../01-components/inspector/FittingInspector.md) - Fitting property editor
- [FittingDefaults](../08-entities/FittingDefaults.md) - Fitting factory functions
- [FittingCalculator](../06-calculators/FittingCalculator.md) - Loss calculations

## Testing

```typescript
describe('FittingTypeSchema', () => {
  it('validates all fitting types', () => {
    const types = ['elbow_90', 'elbow_45', 'tee', 'reducer', 'cap'];
    types.forEach((type) => {
      expect(FittingTypeSchema.safeParse(type).success).toBe(true);
    });
  });

  it('rejects invalid fitting type', () => {
    const result = FittingTypeSchema.safeParse('wye');
    expect(result.success).toBe(false);
  });
});

describe('FittingPropsSchema', () => {
  it('validates elbow with angle', () => {
    const props = {
      fittingType: 'elbow_90',
      angle: 90,
    };
    const result = FittingPropsSchema.safeParse(props);
    expect(result.success).toBe(true);
  });

  it('validates fitting without angle', () => {
    const props = {
      fittingType: 'tee',
    };
    const result = FittingPropsSchema.safeParse(props);
    expect(result.success).toBe(true);
  });

  it('validates fitting with duct connections', () => {
    const props = {
      fittingType: 'reducer',
      inletDuctId: '550e8400-e29b-41d4-a716-446655440000',
      outletDuctId: '550e8400-e29b-41d4-a716-446655440001',
    };
    const result = FittingPropsSchema.safeParse(props);
    expect(result.success).toBe(true);
  });

  it('validates fitting with optional name', () => {
    const props = {
      name: 'Main Branch',
      fittingType: 'tee',
    };
    const result = FittingPropsSchema.safeParse(props);
    expect(result.success).toBe(true);
  });

  it('rejects angle out of range', () => {
    const props = {
      fittingType: 'elbow_45',
      angle: 200,
    };
    const result = FittingPropsSchema.safeParse(props);
    expect(result.success).toBe(false);
  });

  it('rejects negative angle', () => {
    const props = {
      fittingType: 'elbow_90',
      angle: -45,
    };
    const result = FittingPropsSchema.safeParse(props);
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID for duct connections', () => {
    const props = {
      fittingType: 'tee',
      inletDuctId: 'not-a-uuid',
    };
    const result = FittingPropsSchema.safeParse(props);
    expect(result.success).toBe(false);
  });
});

describe('FittingCalculatedSchema', () => {
  it('validates calculated values', () => {
    const calculated = {
      equivalentLength: 15,
      pressureLoss: 0.08,
    };
    const result = FittingCalculatedSchema.safeParse(calculated);
    expect(result.success).toBe(true);
  });

  it('rejects negative equivalent length', () => {
    const calculated = {
      equivalentLength: -5,
      pressureLoss: 0.08,
    };
    const result = FittingCalculatedSchema.safeParse(calculated);
    expect(result.success).toBe(false);
  });

  it('rejects negative pressure loss', () => {
    const calculated = {
      equivalentLength: 15,
      pressureLoss: -0.05,
    };
    const result = FittingCalculatedSchema.safeParse(calculated);
    expect(result.success).toBe(false);
  });
});

describe('createDefaultFittingProps', () => {
  it('creates props for elbow_90', () => {
    const props = createDefaultFittingProps('elbow_90');
    expect(props.fittingType).toBe('elbow_90');
    expect(props.angle).toBe(90);
    expect(props.name).toBe('New elbow 90');
  });

  it('creates props for elbow_45', () => {
    const props = createDefaultFittingProps('elbow_45');
    expect(props.fittingType).toBe('elbow_45');
    expect(props.angle).toBe(45);
  });

  it('creates props for tee', () => {
    const props = createDefaultFittingProps('tee');
    expect(props.fittingType).toBe('tee');
    expect(props.angle).toBeUndefined();
  });

  it('accepts custom name', () => {
    const props = createDefaultFittingProps('reducer', 'Size Transition');
    expect(props.name).toBe('Size Transition');
  });
});

describe('FittingSchema', () => {
  it('validates complete fitting entity', () => {
    const fitting = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'fitting',
      transform: { x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 1,
      createdAt: '2025-12-29T10:00:00Z',
      modifiedAt: '2025-12-29T10:00:00Z',
      props: {
        fittingType: 'elbow_90',
        angle: 90,
      },
      calculated: {
        equivalentLength: 15,
        pressureLoss: 0.08,
      },
    };
    const result = FittingSchema.safeParse(fitting);
    expect(result.success).toBe(true);
  });
});
```
