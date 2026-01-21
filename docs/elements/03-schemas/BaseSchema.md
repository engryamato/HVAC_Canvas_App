# Base Schema

## Overview

The Base Schema defines the foundational data structures and validation rules shared by all entities in the HVAC Canvas application. It provides the common fields for identification, positioning, transformation, and metadata tracking that every canvas entity must have.

## Location

```
src/core/schema/base.schema.ts
```

## Purpose

- Define common entity properties (id, type, transform, timestamps)
- Provide Transform schema for canvas positioning and scaling
- Enforce entity type enumeration for type safety
- Support factory functions for default values
- Enable TypeScript type inference across all entity types

## Dependencies

- `zod` - Schema validation library

## Schema Definitions

### TransformSchema

Defines the positioning, rotation, and scale properties for entities on the canvas.

```typescript
export const TransformSchema = z.object({
  x: z.number().describe('X position in pixels from origin'),
  y: z.number().describe('Y position in pixels from origin'),
  rotation: z.number().min(0).max(360).default(0).describe('Rotation in degrees'),
  scaleX: z.number().positive().default(1).describe('Horizontal scale factor'),
  scaleY: z.number().positive().default(1).describe('Vertical scale factor'),
});

export type Transform = z.infer<typeof TransformSchema>;
```

**Validation Rules:**
- `x` and `y`: Any number (pixels from canvas origin)
- `rotation`: 0-360 degrees, defaults to 0
- `scaleX` and `scaleY`: Must be positive, default to 1

### EntityTypeSchema

Enumerates all supported entity types in the application.

```typescript
export const EntityTypeSchema = z.enum([
  'room',
  'duct',
  'equipment',
  'fitting',
  'note',
  'group',
]);

export type EntityType = z.infer<typeof EntityTypeSchema>;
```

**Supported Types:**
- `room` - Enclosed spaces requiring ventilation
- `duct` - Airflow conduits
- `equipment` - HVAC equipment (hoods, fans, diffusers, etc.)
- `fitting` - Duct connections (elbows, tees, reducers, etc.)
- `note` - Canvas annotations
- `group` - Entity groupings

### BaseEntitySchema

The foundational schema that all entity types must extend.

```typescript
export const BaseEntitySchema = z.object({
  id: z.string().uuid().describe('Unique identifier (UUID v4)'),
  type: EntityTypeSchema,
  transform: TransformSchema,
  zIndex: z.number().int().min(0).default(0).describe('Layer ordering'),
  createdAt: z.string().datetime().describe('ISO8601 creation timestamp'),
  modifiedAt: z.string().datetime().describe('ISO8601 last modified timestamp'),
});

export type BaseEntity = z.infer<typeof BaseEntitySchema>;
```

**Validation Rules:**
- `id`: Must be a valid UUID v4 string
- `type`: Must be one of the valid EntityType values
- `transform`: Must conform to TransformSchema
- `zIndex`: Non-negative integer (0 or greater), defaults to 0
- `createdAt` and `modifiedAt`: ISO8601 datetime strings

## Default Values

### Default Transform

```typescript
export function createDefaultTransform(overrides?: Partial<Transform>): Transform {
  return {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    ...overrides,
  };
}
```

**Usage:**
```typescript
const defaultTransform = createDefaultTransform();
// { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }

const customTransform = createDefaultTransform({ x: 100, y: 200 });
// { x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 }
```

### Current Timestamp

```typescript
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
```

**Usage:**
```typescript
const timestamp = getCurrentTimestamp();
// "2025-12-29T10:30:00.123Z"
```

## Validation Examples

### Valid Base Entity

```typescript
const validEntity = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'room',
  transform: {
    x: 100,
    y: 200,
    rotation: 45,
    scaleX: 1.5,
    scaleY: 1.0,
  },
  zIndex: 2,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:30:00Z',
};

const result = BaseEntitySchema.safeParse(validEntity);
// result.success === true
```

### Invalid Entity (Bad UUID)

```typescript
const invalidEntity = {
  id: 'not-a-uuid',  // ❌ Invalid UUID format
  type: 'room',
  transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
};

const result = BaseEntitySchema.safeParse(invalidEntity);
// result.success === false
// result.error.issues[0].message === 'Invalid uuid'
```

### Invalid Transform (Negative Scale)

```typescript
const invalidTransform = {
  x: 100,
  y: 200,
  rotation: 0,
  scaleX: -1,  // ❌ Must be positive
  scaleY: 1,
};

const result = TransformSchema.safeParse(invalidTransform);
// result.success === false
// result.error.issues[0].message === 'Number must be greater than 0'
```

### Invalid Transform (Rotation Out of Range)

```typescript
const invalidTransform = {
  x: 100,
  y: 200,
  rotation: 400,  // ❌ Must be 0-360
  scaleX: 1,
  scaleY: 1,
};

const result = TransformSchema.safeParse(invalidTransform);
// result.success === false
// result.error.issues[0].message === 'Number must be less than or equal to 360'
```

## Entity Structure Diagram

```
BaseEntity
├── id: string (UUID v4)
├── type: EntityType ('room' | 'duct' | 'equipment' | 'fitting' | 'note' | 'group')
├── transform
│   ├── x: number (pixels)
│   ├── y: number (pixels)
│   ├── rotation: number (0-360 degrees, default 0)
│   ├── scaleX: number (positive, default 1)
│   └── scaleY: number (positive, default 1)
├── zIndex: number (integer >= 0, default 0)
├── createdAt: string (ISO8601 datetime)
└── modifiedAt: string (ISO8601 datetime)
```

## Usage Examples

### Creating a Transform

```typescript
import { createDefaultTransform } from '@/core/schema/base.schema';

// Default transform at origin
const transform1 = createDefaultTransform();

// Custom position
const transform2 = createDefaultTransform({ x: 500, y: 300 });

// Rotated and scaled
const transform3 = createDefaultTransform({
  x: 100,
  y: 100,
  rotation: 90,
  scaleX: 2.0,
  scaleY: 1.5,
});
```

### Validating Entity Type

```typescript
import { EntityTypeSchema } from '@/core/schema/base.schema';

const validateEntityType = (type: unknown) => {
  const result = EntityTypeSchema.safeParse(type);

  if (!result.success) {
    console.error('Invalid entity type:', type);
    return null;
  }

  return result.data;
};

validateEntityType('room');      // ✓ 'room'
validateEntityType('duct');      // ✓ 'duct'
validateEntityType('invalid');   // ✗ null
```

### Extending Base Schema

```typescript
import { BaseEntitySchema } from '@/core/schema/base.schema';

// Example: Creating a custom entity type
const CustomEntitySchema = BaseEntitySchema.extend({
  type: z.literal('custom'),
  props: z.object({
    customField: z.string(),
  }),
});

type CustomEntity = z.infer<typeof CustomEntitySchema>;
```

### Type-Safe Entity Handling

```typescript
import { BaseEntity, EntityType } from '@/core/schema/base.schema';

function moveEntity(entity: BaseEntity, deltaX: number, deltaY: number): BaseEntity {
  return {
    ...entity,
    transform: {
      ...entity.transform,
      x: entity.transform.x + deltaX,
      y: entity.transform.y + deltaY,
    },
    modifiedAt: getCurrentTimestamp(),
  };
}

function rotateEntity(entity: BaseEntity, degrees: number): BaseEntity {
  const newRotation = (entity.transform.rotation + degrees) % 360;

  return {
    ...entity,
    transform: {
      ...entity.transform,
      rotation: newRotation < 0 ? newRotation + 360 : newRotation,
    },
    modifiedAt: getCurrentTimestamp(),
  };
}
```

### Validation Error Handling

```typescript
import { BaseEntitySchema } from '@/core/schema/base.schema';
import { ZodError } from 'zod';

function validateBaseEntity(data: unknown) {
  try {
    const entity = BaseEntitySchema.parse(data);
    return { success: true, entity };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return { success: false, errors };
    }
    throw error;
  }
}

// Usage
const result = validateBaseEntity(userInput);
if (result.success) {
  console.log('Valid entity:', result.entity);
} else {
  console.error('Validation errors:', result.errors);
}
```

## Related Elements

- [RoomSchema](./RoomSchema.md) - Extends BaseEntitySchema
- [DuctSchema](./DuctSchema.md) - Extends BaseEntitySchema
- [EquipmentSchema](./EquipmentSchema.md) - Extends BaseEntitySchema
- [FittingSchema](./FittingSchema.md) - Extends BaseEntitySchema
- [NoteSchema](./NoteSchema.md) - Extends BaseEntitySchema
- [GroupSchema](./GroupSchema.md) - Extends BaseEntitySchema
- [ProjectFileSchema](./ProjectFileSchema.md) - Uses EntityType enum
- [canvasStore](../02-stores/canvasStore.md) - Uses BaseEntity for entity management

## Testing

```typescript
describe('TransformSchema', () => {
  it('validates correct transform data', () => {
    const validTransform = {
      x: 100,
      y: 200,
      rotation: 45,
      scaleX: 1.5,
      scaleY: 1.0,
    };
    const result = TransformSchema.safeParse(validTransform);
    expect(result.success).toBe(true);
  });

  it('applies default values', () => {
    const minimalTransform = { x: 100, y: 200 };
    const result = TransformSchema.parse(minimalTransform);
    expect(result.rotation).toBe(0);
    expect(result.scaleX).toBe(1);
    expect(result.scaleY).toBe(1);
  });

  it('rejects rotation out of range', () => {
    const invalid = { x: 0, y: 0, rotation: 400, scaleX: 1, scaleY: 1 };
    const result = TransformSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects negative scale values', () => {
    const invalid = { x: 0, y: 0, rotation: 0, scaleX: -1, scaleY: 1 };
    const result = TransformSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('EntityTypeSchema', () => {
  it('validates all supported entity types', () => {
    const validTypes = ['room', 'duct', 'equipment', 'fitting', 'note', 'group'];
    validTypes.forEach((type) => {
      expect(EntityTypeSchema.safeParse(type).success).toBe(true);
    });
  });

  it('rejects invalid entity type', () => {
    const result = EntityTypeSchema.safeParse('invalid_type');
    expect(result.success).toBe(false);
  });
});

describe('BaseEntitySchema', () => {
  const validEntity = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'room',
    transform: { x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: '2025-12-29T10:00:00Z',
    modifiedAt: '2025-12-29T10:00:00Z',
  };

  it('validates correct base entity', () => {
    const result = BaseEntitySchema.safeParse(validEntity);
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const invalid = { ...validEntity, id: 'not-a-uuid' };
    const result = BaseEntitySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects negative zIndex', () => {
    const invalid = { ...validEntity, zIndex: -1 };
    const result = BaseEntitySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid datetime format', () => {
    const invalid = { ...validEntity, createdAt: 'not-a-date' };
    const result = BaseEntitySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('createDefaultTransform', () => {
  it('creates default transform with all zeros', () => {
    const transform = createDefaultTransform();
    expect(transform).toEqual({
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    });
  });

  it('applies overrides correctly', () => {
    const transform = createDefaultTransform({ x: 100, rotation: 90 });
    expect(transform.x).toBe(100);
    expect(transform.rotation).toBe(90);
    expect(transform.y).toBe(0);
    expect(transform.scaleX).toBe(1);
  });
});

describe('getCurrentTimestamp', () => {
  it('returns valid ISO8601 timestamp', () => {
    const timestamp = getCurrentTimestamp();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('returns parseable date', () => {
    const timestamp = getCurrentTimestamp();
    const date = new Date(timestamp);
    expect(date.toISOString()).toBe(timestamp);
  });
});
```
