# Duct Schema

## Overview

The Duct Schema defines the data structure and validation rules for Duct entities in the HVAC Canvas application. Ducts represent airflow conduits with shape-dependent dimensions (round or rectangular), material properties, and airflow calculations including velocity and friction loss.

## Location

```
src/core/schema/duct.schema.ts
```

## Purpose

- Define the structure of Duct entity data
- Support both round and rectangular duct shapes
- Validate shape-dependent dimensions (diameter for round, width/height for rectangular)
- Enforce airflow and pressure constraints
- Calculate cross-sectional area, velocity, and friction loss
- Provide TypeScript type inference for compile-time safety

## Dependencies

- `zod` - Schema validation library
- `@/core/schema/base.schema` - Base entity schema

## Schema Definitions

### DuctMaterialSchema

Defines the allowed duct material types with associated roughness factors.

```typescript
export const DuctMaterialSchema = z.enum(['galvanized', 'stainless', 'aluminum', 'flex']);

export type DuctMaterial = z.infer<typeof DuctMaterialSchema>;
```

**Supported Materials:**
- `galvanized` - Galvanized steel (most common)
- `stainless` - Stainless steel (corrosion-resistant)
- `aluminum` - Aluminum (lightweight)
- `flex` - Flexible duct (higher friction)

### DuctShapeSchema

Defines whether the duct is round or rectangular.

```typescript
export const DuctShapeSchema = z.enum(['round', 'rectangular']);

export type DuctShape = z.infer<typeof DuctShapeSchema>;
```

### DuctPropsSchema

Defines the editable properties with conditional validation based on shape.

```typescript
export const DuctPropsSchema = z
  .object({
    name: z.string().min(1).max(100),
    shape: DuctShapeSchema,
    // Round duct dimension (required if shape === 'round')
    diameter: z
      .number()
      .min(4)
      .max(60)
      .optional()
      .describe('Diameter in inches (round ducts only)'),
    // Rectangular duct dimensions (required if shape === 'rectangular')
    width: z
      .number()
      .min(4)
      .max(96)
      .optional()
      .describe('Width in inches (rectangular ducts only)'),
    height: z
      .number()
      .min(4)
      .max(96)
      .optional()
      .describe('Height in inches (rectangular ducts only)'),
    // Common properties
    length: z.number().min(0.1).max(1000).describe('Length in feet'),
    material: DuctMaterialSchema,
    airflow: z.number().min(1).max(100000).describe('Airflow in CFM'),
    staticPressure: z.number().min(0).max(20).describe('Static pressure in in.w.g.'),
    // Connection references
    connectedFrom: z.string().uuid().optional().describe('Source entity ID'),
    connectedTo: z.string().uuid().optional().describe('Destination entity ID'),
  })
  .refine(
    (data) => {
      // Validate shape-dependent fields
      if (data.shape === 'round') {
        return data.diameter !== undefined;
      } else {
        return data.width !== undefined && data.height !== undefined;
      }
    },
    {
      message: 'Round ducts require diameter; rectangular ducts require width and height',
    }
  );

export type DuctProps = z.infer<typeof DuctPropsSchema>;
```

**Validation Rules:**
- `name`: 1-100 characters
- `shape`: Must be 'round' or 'rectangular'
- `diameter`: 4-60 inches (required for round ducts)
- `width`: 4-96 inches (required for rectangular ducts)
- `height`: 4-96 inches (required for rectangular ducts)
- `length`: 0.1-1000 feet
- `material`: One of the valid materials
- `airflow`: 1-100,000 CFM
- `staticPressure`: 0-20 in.w.g.
- `connectedFrom`, `connectedTo`: Optional UUID references

### DuctCalculatedSchema

Defines the calculated (read-only) values for duct performance.

```typescript
export const DuctCalculatedSchema = z.object({
  area: z.number().nonnegative().describe('Cross-sectional area in sq in'),
  velocity: z.number().nonnegative().describe('Air velocity in FPM'),
  frictionLoss: z.number().nonnegative().describe('Friction loss in in.w.g./100ft'),
});

export type DuctCalculated = z.infer<typeof DuctCalculatedSchema>;
```

**Calculated Fields:**
- `area`: Cross-sectional area in square inches
- `velocity`: Air velocity in feet per minute (FPM)
- `frictionLoss`: Friction loss in inches water gauge per 100 feet

### DuctWarningsSchema

Optional warnings for duct validation (e.g., velocity out of acceptable range).

```typescript
export const DuctWarningsSchema = z
  .object({
    velocity: z.string().optional(),
  })
  .optional();
```

### Complete DuctSchema

```typescript
export const DuctSchema = BaseEntitySchema.extend({
  type: z.literal('duct'),
  props: DuctPropsSchema,
  calculated: DuctCalculatedSchema,
  warnings: DuctWarningsSchema,
});

export type Duct = z.infer<typeof DuctSchema>;
```

## Default Values

### Default Round Duct

```typescript
export const DEFAULT_ROUND_DUCT_PROPS = {
  name: 'New Duct',
  shape: 'round' as const,
  diameter: 12,
  length: 10,
  material: 'galvanized' as const,
  airflow: 500,
  staticPressure: 0.1,
};
```

### Default Rectangular Duct

```typescript
export const DEFAULT_RECTANGULAR_DUCT_PROPS = {
  name: 'New Duct',
  shape: 'rectangular' as const,
  width: 12,
  height: 8,
  length: 10,
  material: 'galvanized' as const,
  airflow: 500,
  staticPressure: 0.1,
};
```

## Validation Examples

### Valid Round Duct

```typescript
const validRoundDuct = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'duct',
  transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 1,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
  props: {
    name: 'Supply Duct',
    shape: 'round',
    diameter: 16,
    length: 25,
    material: 'galvanized',
    airflow: 1200,
    staticPressure: 0.5,
  },
  calculated: {
    area: 201.06,        // π × (16/2)²
    velocity: 858.85,    // (1200 × 144) / 201.06
    frictionLoss: 0.12,
  },
};

const result = DuctSchema.safeParse(validRoundDuct);
// result.success === true
```

### Valid Rectangular Duct

```typescript
const validRectangularDuct = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  type: 'duct',
  transform: { x: 200, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 1,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
  props: {
    name: 'Return Duct',
    shape: 'rectangular',
    width: 20,
    height: 12,
    length: 30,
    material: 'galvanized',
    airflow: 2000,
    staticPressure: 0.3,
  },
  calculated: {
    area: 240,           // 20 × 12
    velocity: 1200,      // (2000 × 144) / 240
    frictionLoss: 0.08,
  },
};

const result = DuctSchema.safeParse(validRectangularDuct);
// result.success === true
```

### Invalid Duct (Missing Shape-Dependent Field)

```typescript
const invalidDuct = {
  // ...valid base fields
  props: {
    name: 'Bad Duct',
    shape: 'round',
    // ❌ Missing diameter (required for round ducts)
    length: 10,
    material: 'galvanized',
    airflow: 500,
    staticPressure: 0.1,
  },
};

const result = DuctPropsSchema.safeParse(invalidDuct.props);
// result.success === false
// result.error.message includes 'Round ducts require diameter'
```

### Invalid Duct (Diameter Out of Range)

```typescript
const invalidDuct = {
  // ...valid base fields
  props: {
    name: 'Tiny Duct',
    shape: 'round',
    diameter: 2,  // ❌ Below minimum 4 inches
    length: 10,
    material: 'galvanized',
    airflow: 500,
    staticPressure: 0.1,
  },
};

const result = DuctPropsSchema.safeParse(invalidDuct.props);
// result.success === false
// result.error.issues[0].message === 'Number must be greater than or equal to 4'
```

## Calculation Formulas

```typescript
// Round Duct Area (square inches)
area = π × (diameter / 2)²

// Rectangular Duct Area (square inches)
area = width × height

// Air Velocity (feet per minute)
velocity = (airflow × 144) / area
// Where: airflow is in CFM, 144 converts sq ft to sq in

// Friction Loss (in.w.g. per 100 ft)
// Uses Darcy-Weisbach or equivalent duct friction chart
// Based on velocity, diameter/dimensions, and material roughness
```

## Entity Structure Diagram

```
Duct Entity
├── id: string (UUID)
├── type: 'duct'
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
│   ├── shape: 'round' | 'rectangular'
│   ├── diameter?: number (inches, round only)
│   ├── width?: number (inches, rectangular only)
│   ├── height?: number (inches, rectangular only)
│   ├── length: number (feet)
│   ├── material: DuctMaterial
│   ├── airflow: number (CFM)
│   ├── staticPressure: number (in.w.g.)
│   ├── connectedFrom?: string (UUID)
│   └── connectedTo?: string (UUID)
├── calculated
│   ├── area: number (sq in)
│   ├── velocity: number (FPM)
│   └── frictionLoss: number (in.w.g./100ft)
└── warnings?
    └── velocity?: string
```

## Usage Examples

### Creating a Round Duct

```typescript
import { DEFAULT_ROUND_DUCT_PROPS } from '@/core/schema/duct.schema';
import { createDefaultTransform, getCurrentTimestamp } from '@/core/schema/base.schema';

const roundDuct = {
  id: crypto.randomUUID(),
  type: 'duct',
  transform: createDefaultTransform({ x: 100, y: 200 }),
  zIndex: 1,
  createdAt: getCurrentTimestamp(),
  modifiedAt: getCurrentTimestamp(),
  props: {
    ...DEFAULT_ROUND_DUCT_PROPS,
    name: 'Supply Main',
    diameter: 18,
    airflow: 1500,
  },
  calculated: {
    area: 254.47,
    velocity: 849.56,
    frictionLoss: 0.10,
  },
};
```

### Creating a Rectangular Duct

```typescript
import { DEFAULT_RECTANGULAR_DUCT_PROPS } from '@/core/schema/duct.schema';

const rectangularDuct = {
  id: crypto.randomUUID(),
  type: 'duct',
  transform: createDefaultTransform({ x: 300, y: 400 }),
  zIndex: 1,
  createdAt: getCurrentTimestamp(),
  modifiedAt: getCurrentTimestamp(),
  props: {
    ...DEFAULT_RECTANGULAR_DUCT_PROPS,
    name: 'Return Branch',
    width: 16,
    height: 10,
    airflow: 800,
  },
  calculated: {
    area: 160,
    velocity: 720,
    frictionLoss: 0.06,
  },
};
```

### Validating Duct Properties

```typescript
import { DuctPropsSchema } from '@/core/schema/duct.schema';

const validateDuctProps = (input: unknown) => {
  const result = DuctPropsSchema.safeParse(input);

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
  name: 'New Duct',
  shape: 'round',
  diameter: 14,
  length: 20,
  material: 'galvanized',
  airflow: 1000,
  staticPressure: 0.2,
};

const validation = validateDuctProps(userInput);
if (validation.valid) {
  console.log('Valid duct props:', validation.data);
} else {
  console.error('Validation errors:', validation.errors);
}
```

### Calculating Duct Metrics

```typescript
import { DuctProps, DuctCalculated } from '@/core/schema/duct.schema';

function calculateDuctMetrics(props: DuctProps): DuctCalculated {
  let area: number;

  if (props.shape === 'round') {
    area = Math.PI * Math.pow(props.diameter! / 2, 2);
  } else {
    area = props.width! * props.height!;
  }

  const velocity = (props.airflow * 144) / area;
  const frictionLoss = calculateFrictionLoss(velocity, props.material, area);

  return { area, velocity, frictionLoss };
}

function calculateFrictionLoss(
  velocity: number,
  material: string,
  area: number
): number {
  // Simplified friction loss calculation
  // Real implementation would use friction factor charts
  const roughnessFactor = {
    galvanized: 1.0,
    stainless: 0.9,
    aluminum: 0.85,
    flex: 1.5,
  }[material] || 1.0;

  return (velocity / 1000) * 0.1 * roughnessFactor;
}
```

### Type Guards

```typescript
import { Duct, DuctProps } from '@/core/schema/duct.schema';

function isRoundDuct(props: DuctProps): props is DuctProps & { shape: 'round'; diameter: number } {
  return props.shape === 'round' && props.diameter !== undefined;
}

function isRectangularDuct(
  props: DuctProps
): props is DuctProps & { shape: 'rectangular'; width: number; height: number } {
  return props.shape === 'rectangular' && props.width !== undefined && props.height !== undefined;
}

// Usage
function getDuctDimensions(props: DuctProps): string {
  if (isRoundDuct(props)) {
    return `Ø${props.diameter}"`;
  } else if (isRectangularDuct(props)) {
    return `${props.width}" × ${props.height}"`;
  }
  return 'Invalid duct';
}
```

## Related Elements

- [BaseSchema](./BaseSchema.md) - Base entity schema
- [DuctTool](../04-tools/DuctTool.md) - Duct creation tool
- [DuctRenderer](../05-renderers/DuctRenderer.md) - Duct visualization
- [DuctInspector](../01-components/inspector/DuctInspector.md) - Duct property editor
- [DuctDefaults](../08-entities/DuctDefaults.md) - Duct factory functions
- [DuctSizingCalculator](../06-calculators/DuctSizingCalculator.md) - Airflow sizing calculations
- [PressureDropCalculator](../06-calculators/PressureDropCalculator.md) - Pressure loss calculations
- [FittingSchema](./FittingSchema.md) - Connected to ducts via fittings
- [EquipmentSchema](./EquipmentSchema.md) - Connected via connectedDuctId

## Testing

```typescript
describe('DuctMaterialSchema', () => {
  it('validates all material types', () => {
    const materials = ['galvanized', 'stainless', 'aluminum', 'flex'];
    materials.forEach((material) => {
      expect(DuctMaterialSchema.safeParse(material).success).toBe(true);
    });
  });

  it('rejects invalid material', () => {
    const result = DuctMaterialSchema.safeParse('copper');
    expect(result.success).toBe(false);
  });
});

describe('DuctPropsSchema', () => {
  it('validates round duct with diameter', () => {
    const props = {
      name: 'Test Duct',
      shape: 'round',
      diameter: 12,
      length: 10,
      material: 'galvanized',
      airflow: 500,
      staticPressure: 0.1,
    };
    const result = DuctPropsSchema.safeParse(props);
    expect(result.success).toBe(true);
  });

  it('validates rectangular duct with width and height', () => {
    const props = {
      name: 'Test Duct',
      shape: 'rectangular',
      width: 12,
      height: 8,
      length: 10,
      material: 'galvanized',
      airflow: 500,
      staticPressure: 0.1,
    };
    const result = DuctPropsSchema.safeParse(props);
    expect(result.success).toBe(true);
  });

  it('rejects round duct without diameter', () => {
    const props = {
      name: 'Bad Duct',
      shape: 'round',
      length: 10,
      material: 'galvanized',
      airflow: 500,
      staticPressure: 0.1,
    };
    const result = DuctPropsSchema.safeParse(props);
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Round ducts require diameter');
  });

  it('rejects rectangular duct without width or height', () => {
    const props = {
      name: 'Bad Duct',
      shape: 'rectangular',
      length: 10,
      material: 'galvanized',
      airflow: 500,
      staticPressure: 0.1,
    };
    const result = DuctPropsSchema.safeParse(props);
    expect(result.success).toBe(false);
  });

  it('rejects diameter out of range', () => {
    const props = {
      name: 'Test',
      shape: 'round',
      diameter: 2,  // Below minimum
      length: 10,
      material: 'galvanized',
      airflow: 500,
      staticPressure: 0.1,
    };
    const result = DuctPropsSchema.safeParse(props);
    expect(result.success).toBe(false);
  });

  it('rejects negative airflow', () => {
    const props = {
      name: 'Test',
      shape: 'round',
      diameter: 12,
      length: 10,
      material: 'galvanized',
      airflow: -100,
      staticPressure: 0.1,
    };
    const result = DuctPropsSchema.safeParse(props);
    expect(result.success).toBe(false);
  });
});

describe('DuctCalculatedSchema', () => {
  it('validates calculated values', () => {
    const calculated = {
      area: 113.1,
      velocity: 636.9,
      frictionLoss: 0.08,
    };
    const result = DuctCalculatedSchema.safeParse(calculated);
    expect(result.success).toBe(true);
  });

  it('rejects negative values', () => {
    const calculated = {
      area: -100,
      velocity: 500,
      frictionLoss: 0.1,
    };
    const result = DuctCalculatedSchema.safeParse(calculated);
    expect(result.success).toBe(false);
  });
});

describe('DuctSchema', () => {
  it('validates complete duct entity', () => {
    const duct = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'duct',
      transform: { x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 1,
      createdAt: '2025-12-29T10:00:00Z',
      modifiedAt: '2025-12-29T10:00:00Z',
      props: {
        name: 'Main Supply',
        shape: 'round',
        diameter: 16,
        length: 25,
        material: 'galvanized',
        airflow: 1200,
        staticPressure: 0.5,
      },
      calculated: {
        area: 201.06,
        velocity: 858.85,
        frictionLoss: 0.12,
      },
    };
    const result = DuctSchema.safeParse(duct);
    expect(result.success).toBe(true);
  });
});
```
