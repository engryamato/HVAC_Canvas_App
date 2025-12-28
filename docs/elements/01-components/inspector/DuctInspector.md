# DuctInspector

## Overview

The DuctInspector component provides a property editor panel for Duct entities, with dynamic fields that adapt to duct shape (round vs rectangular), velocity warnings, and calculated airflow metrics.

## Location

```
src/features/canvas/components/Inspector/DuctInspector.tsx
```

## Purpose

- Edit duct properties (name, shape, dimensions, airflow)
- Switch between round and rectangular duct shapes
- Display velocity warnings when airflow exceeds recommended limits
- Show calculated values (area, velocity, friction loss)
- Validate field inputs and execute undo-able commands

## Dependencies

- [PropertyField](./PropertyField.md) - Labeled input wrapper
- [ValidatedInput](../ui/ValidatedInput.md) - Input with validation
- [useFieldValidation](../../07-hooks/useFieldValidation.md) - Field validation hook
- [entityStore](../../02-stores/entityStore.md) - Entity state management
- [entityCommands](../../09-commands/EntityCommands.md) - Undo-able commands
- Duct schema and defaults from `@/core/schema`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `entity` | `Duct` | Yes | The duct entity to edit |

## State

The component maintains no local state. All state is managed through:
- `useFieldValidation(entity)` - Returns validation errors and validateField function
- `useEntityStore` - Global entity state (accessed in commit/handleShapeChange)

## Layout

### Round Duct

```
┌─────────────────────────────────────┐
│ ⚠ Warning: Velocity exceeds 2000 FPM│  (if applicable)
│                                     │
│ ┌─ Identity ────────────────────┐  │
│ │ Name: [Supply Main        ]   │  │
│ │ Shape: [Round ▼]              │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌─ Geometry ────────────────────┐  │
│ │ Diameter (in): [12]            │  │
│ │ Length (ft):   [25.5]          │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌─ Airflow ─────────────────────┐  │
│ │ Material: [Galvanized ▼]       │  │
│ │ Airflow (CFM): [1200]          │  │
│ │ Static Pressure: [0.5]         │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌─ Calculated ──────────────────┐  │
│ │ Area (sq in):     113.10       │  │
│ │ Velocity (FPM):   1061.95      │  │
│ │ Friction Loss:    0.0825       │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Rectangular Duct

```
┌─────────────────────────────────────┐
│ ┌─ Identity ────────────────────┐  │
│ │ Name: [Return Air         ]   │  │
│ │ Shape: [Rectangular ▼]        │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌─ Geometry ────────────────────┐  │
│ │ Width (in):  [16]              │  │
│ │ Height (in): [8]               │  │
│ │ Length (ft): [15.0]            │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌─ Airflow ─────────────────────┐  │
│ │ Material: [Galvanized ▼]       │  │
│ │ Airflow (CFM): [800]           │  │
│ │ Static Pressure: [0.3]         │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌─ Calculated ──────────────────┐  │
│ │ Area (sq in):     128.00       │  │
│ │ Velocity (FPM):   625.00       │  │
│ │ Friction Loss:    0.0312       │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Behavior

### 1. Shape Switching

The `handleShapeChange` callback switches between round and rectangular:

```typescript
const handleShapeChange = useCallback(
  (shape: 'round' | 'rectangular') => {
    const { byId } = useEntityStore.getState();
    const current = byId[entity.id];

    const previous = JSON.parse(JSON.stringify(current)) as Duct;

    // Apply shape-specific defaults
    const nextProps =
      shape === 'round'
        ? {
            ...current.props,
            shape: 'round' as const,
            diameter: current.props.diameter ?? DEFAULT_ROUND_DUCT_PROPS.diameter,
            width: undefined,    // Clear rectangular props
            height: undefined,
          }
        : {
            ...current.props,
            shape: 'rectangular' as const,
            width: current.props.width ?? DEFAULT_RECTANGULAR_DUCT_PROPS.width,
            height: current.props.height ?? DEFAULT_RECTANGULAR_DUCT_PROPS.height,
            diameter: undefined,  // Clear round props
          };

    const nextEntity: Duct = {
      ...current,
      props: nextProps,
      modifiedAt: new Date().toISOString(),
    };

    const isValid = validateField('shape', nextEntity);
    if (!isValid) return;

    updateEntityCommand(entity.id, { props: nextProps, modifiedAt: nextEntity.modifiedAt }, previous);
  },
  [entity.id, validateField]
);
```

### 2. Field Updates

Standard `commit` callback for property updates:

```typescript
const commit = useCallback(
  <K extends keyof Duct['props']>(field: K, value: Duct['props'][K]) => {
    const { byId } = useEntityStore.getState();
    const current = byId[entity.id];
    if (!current || current.type !== 'duct') return;

    const previous = JSON.parse(JSON.stringify(current)) as Duct;
    const nextProps = { ...current.props, [field]: value };
    const nextEntity: Duct = {
      ...current,
      props: nextProps,
      modifiedAt: new Date().toISOString(),
    };

    const isValid = validateField(field as string, nextEntity);
    if (!isValid) return;

    updateEntityCommand(entity.id, { props: nextProps, modifiedAt: nextEntity.modifiedAt }, previous);
  },
  [entity.id, validateField]
);
```

### 3. Velocity Warnings

Displays a warning banner when velocity exceeds safe limits:

```tsx
{entity.warnings?.velocity ? (
  <div className={styles.multiState}>
    <strong>Warning:</strong> {entity.warnings.velocity}
  </div>
) : null}
```

Example warning: "Velocity exceeds 2000 FPM (recommended max for residential)"

### 4. Validation

**Round Duct:**
- Diameter: 4-60 inches

**Rectangular Duct:**
- Width: 4-96 inches
- Height: 4-96 inches

**Common:**
- Length: 0.1-1000 feet
- Airflow: 1-100,000 CFM
- Static Pressure: 0-20 in.w.g.

### 5. Material Options

- **Galvanized** - Standard galvanized steel
- **Stainless** - Stainless steel (corrosive environments)
- **Aluminum** - Lightweight aluminum
- **Flex** - Flexible duct (higher friction)

### 6. Calculated Fields (Read-only)

**Round Duct:**
- **Area**: `π * (diameter/2)²` sq in
- **Velocity**: `(airflow * 144) / area` FPM
- **Friction Loss**: Based on Darcy-Weisbach equation

**Rectangular Duct:**
- **Area**: `width * height` sq in
- **Velocity**: `(airflow * 144) / area` FPM
- **Friction Loss**: Based on equivalent diameter

## Component Implementation

```tsx
export function DuctInspector({ entity }: DuctInspectorProps) {
  const { errors, validateField } = useFieldValidation(entity);

  const commit = useCallback(/* ... */);
  const handleShapeChange = useCallback(/* ... */);

  const isRound = entity.props.shape === 'round';

  return (
    <div>
      {/* Velocity warning banner */}
      {entity.warnings?.velocity && (
        <div className={styles.multiState}>
          <strong>Warning:</strong> {entity.warnings.velocity}
        </div>
      )}

      {/* Identity section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Identity</h3>
        <PropertyField label="Shape" htmlFor="duct-shape">
          <ValidatedInput
            id="duct-shape"
            type="select"
            value={entity.props.shape}
            onChange={(val) => handleShapeChange(val as 'round' | 'rectangular')}
            options={[
              { value: 'round', label: 'Round' },
              { value: 'rectangular', label: 'Rectangular' },
            ]}
          />
        </PropertyField>
      </div>

      {/* Geometry section - conditional fields */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Geometry</h3>
        {isRound ? (
          <PropertyField label="Diameter (in)" htmlFor="duct-diameter">
            {/* Diameter input */}
          </PropertyField>
        ) : (
          <>
            <PropertyField label="Width (in)">...</PropertyField>
            <PropertyField label="Height (in)">...</PropertyField>
          </>
        )}
      </div>

      {/* Airflow and Calculated sections */}
    </div>
  );
}
```

## Usage Example

```tsx
import { DuctInspector } from './Inspector/DuctInspector';

function InspectorPanel() {
  const selectedId = useSelectionStore((s) => s.selectedIds[0]);
  const entity = useEntityStore((s) => s.byId[selectedId]);

  if (!entity || entity.type !== 'duct') {
    return <div>Select a duct to edit</div>;
  }

  return <DuctInspector entity={entity} />;
}
```

## Styling

```css
.multiState {
  padding: 12px;
  margin-bottom: 16px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 4px;
  color: #92400e;
  font-size: 14px;
}

.section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.readonly {
  padding: 8px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: #6b7280;
  font-family: monospace;
}
```

## Related Elements

- [InspectorPanel](./InspectorPanel.md) - Parent container
- [RoomInspector](./RoomInspector.md) - Room property editor
- [EquipmentInspector](./EquipmentInspector.md) - Equipment property editor
- [PropertyField](./PropertyField.md) - Reusable field wrapper
- [ValidatedInput](../ui/ValidatedInput.md) - Input with validation
- [DuctSchema](../../03-schemas/DuctSchema.md) - Duct validation schema
- [DuctSizingCalculator](../../06-calculators/DuctSizingCalculator.md) - Airflow calculations

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DuctInspector } from './DuctInspector';
import { createDuct } from '../../entities/ductDefaults';

describe('DuctInspector', () => {
  it('renders round duct fields', () => {
    const roundDuct = createDuct({ x: 0, y: 0 }, { x: 100, y: 0 }, { shape: 'round' });
    render(<DuctInspector entity={roundDuct} />);

    expect(screen.getByLabelText('Diameter (in)')).toBeInTheDocument();
    expect(screen.queryByLabelText('Width (in)')).not.toBeInTheDocument();
  });

  it('renders rectangular duct fields', () => {
    const rectDuct = createDuct({ x: 0, y: 0 }, { x: 100, y: 0 }, { shape: 'rectangular' });
    render(<DuctInspector entity={rectDuct} />);

    expect(screen.getByLabelText('Width (in)')).toBeInTheDocument();
    expect(screen.getByLabelText('Height (in)')).toBeInTheDocument();
    expect(screen.queryByLabelText('Diameter (in)')).not.toBeInTheDocument();
  });

  it('switches from round to rectangular', () => {
    const roundDuct = createDuct({ x: 0, y: 0 }, { x: 100, y: 0 }, { shape: 'round' });
    render(<DuctInspector entity={roundDuct} />);

    const shapeSelect = screen.getByLabelText('Shape');
    fireEvent.change(shapeSelect, { target: { value: 'rectangular' } });

    expect(handleShapeChange).toHaveBeenCalledWith('rectangular');
  });

  it('displays velocity warning', () => {
    const highVelocityDuct = {
      ...createDuct({ x: 0, y: 0 }, { x: 100, y: 0 }),
      warnings: { velocity: 'Velocity exceeds 2000 FPM' },
    };
    render(<DuctInspector entity={highVelocityDuct} />);

    expect(screen.getByText(/Velocity exceeds 2000 FPM/)).toBeInTheDocument();
  });

  it('displays calculated values', () => {
    const duct = createDuct({ x: 0, y: 0 }, { x: 100, y: 0 }, {
      shape: 'round',
      diameter: 12,
      airflow: 1200,
    });
    render(<DuctInspector entity={duct} />);

    // Area = π * (12/2)² ≈ 113.10 sq in
    expect(screen.getByText(/113\.10/)).toBeInTheDocument();

    // Velocity = (1200 * 144) / 113.10 ≈ 1061.95 FPM
    expect(screen.getByText(/1061\.95/)).toBeInTheDocument();
  });
});
```
