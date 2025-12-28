# useFieldValidation Hook

## Overview

The useFieldValidation hook provides debounced, field-level validation using Zod schemas for Room, Duct, and Equipment entities. It returns current errors and a validateField function for real-time form validation.

## Location

```
src/features/canvas/hooks/useFieldValidation.ts
```

## Purpose

- Validate entity fields using Zod schemas
- Provide field-level error messages
- Debounce validation (300ms) to avoid excessive checks
- Support Room, Duct, and Equipment entities
- Clear errors when entity changes

## Hook Signature

```typescript
export function useFieldValidation(entity: SupportedEntity | null): {
  errors: ValidationErrors;
  validateField: (field: string, draft: SupportedEntity) => boolean;
  clearError: (field: string) => void;
}
```

## Types

```typescript
type SupportedEntity = Room | Duct | Equipment;
type ValidationErrors = Record<string, string | undefined>;
```

## Usage

```typescript
import { useFieldValidation } from '@/features/canvas/hooks/useFieldValidation';

function RoomInspector({ room }: { room: Room }) {
  const { errors, validateField } = useFieldValidation(room);

  const handleWidthChange = (value: number) => {
    const draft = { ...room, props: { ...room.props, width: value } };

    const isValid = validateField('width', draft);

    if (isValid) {
      // Update entity
      updateEntity(room.id, { props: { ...room.props, width: value } });
    }
  };

  return (
    <div>
      <input
        type="number"
        value={room.props.width}
        onChange={(e) => handleWidthChange(Number(e.target.value))}
      />
      {errors.width && <span className="error">{errors.width}</span>}
    </div>
  );
}
```

## Validation Behavior

```
Field change → validateField() → Wait 300ms → Run schema validation
                                      ↑
New change → Clear timer → Reset ────┘
```

## Related Elements

- [Room Schema](../03-schemas/RoomSchema.md)
- [Duct Schema](../03-schemas/DuctSchema.md)
- [Equipment Schema](../03-schemas/EquipmentSchema.md)
