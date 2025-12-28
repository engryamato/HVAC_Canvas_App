# EquipmentInspector

## Overview

The EquipmentInspector component provides a property editor panel for Equipment entities, with type-specific defaults that update dimensions and performance specs when the equipment type changes.

## Location

```
src/features/canvas/components/Inspector/EquipmentInspector.tsx
```

## Purpose

- Edit equipment properties (name, type, manufacturer, model)
- Switch equipment types with automatic default updates
- Configure performance parameters (capacity, static pressure)
- Edit physical dimensions (width, depth, height)
- Validate field inputs and execute undo-able commands

## Dependencies

- [PropertyField](./PropertyField.md) - Labeled input wrapper
- [ValidatedInput](../ui/ValidatedInput.md) - Input with validation
- [useFieldValidation](../../07-hooks/useFieldValidation.md) - Field validation hook
- [entityStore](../../02-stores/entityStore.md) - Entity state management
- [entityCommands](../../09-commands/EntityCommands.md) - Undo-able commands
- [equipmentDefaults](../../08-entities/EquipmentDefaults.md) - Type defaults
- Equipment schema from `@/core/schema`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `entity` | `Equipment` | Yes | The equipment entity to edit |

## State

The component maintains no local state. All state is managed through:
- `useFieldValidation(entity)` - Returns validation errors and validateField function
- `useEntityStore` - Global entity state (accessed in commit/handleTypeChange)

## Layout

```
┌─────────────────────────────────────┐
│ ┌─ Identity ────────────────────┐  │
│ │ Name: [AHU-1              ]   │  │
│ │ Manufacturer: [Trane      ]   │  │
│ │ Model: [TAM7A0B60H21SA    ]   │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌─ Type ────────────────────────┐  │
│ │ Equipment Type: [AHU ▼]        │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌─ Performance ─────────────────┐  │
│ │ Capacity (CFM): [5000]         │  │
│ │ Static Pressure: [2.5]         │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌─ Dimensions ──────────────────┐  │
│ │ Width (in):  [48]              │  │
│ │ Depth (in):  [36]              │  │
│ │ Height (in): [60]              │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Behavior

### 1. Equipment Type Change

The `handleTypeChange` callback updates type-specific defaults:

```typescript
const handleTypeChange = useCallback(
  (nextType: Equipment['props']['equipmentType']) => {
    const { byId } = useEntityStore.getState();
    const current = byId[entity.id];
    if (!current || current.type !== 'equipment') return;

    // Get defaults for the new equipment type
    const defaults = EQUIPMENT_TYPE_DEFAULTS[nextType];
    const previous = JSON.parse(JSON.stringify(current)) as Equipment;

    // Apply new type with its defaults
    const nextProps: Equipment['props'] = {
      ...current.props,
      equipmentType: nextType,
      capacity: defaults.capacity,
      staticPressure: defaults.staticPressure,
      width: defaults.width,
      depth: defaults.depth,
      height: defaults.height,
    };

    const nextEntity: Equipment = {
      ...current,
      props: nextProps,
      modifiedAt: new Date().toISOString(),
    };

    const isValid = validateField('equipmentType', nextEntity);
    if (!isValid) return;

    updateEntityCommand(
      entity.id,
      { props: nextProps, modifiedAt: nextEntity.modifiedAt },
      previous
    );
  },
  [entity.id, validateField]
);
```

### 2. Field Updates

Standard `commit` callback for property updates:

```typescript
const commit = useCallback(
  <K extends keyof Equipment['props']>(field: K, value: Equipment['props'][K]) => {
    const { byId } = useEntityStore.getState();
    const current = byId[entity.id];
    if (!current || current.type !== 'equipment') return;

    const previous = JSON.parse(JSON.stringify(current)) as Equipment;
    const nextProps = { ...current.props, [field]: value };
    const nextEntity: Equipment = {
      ...current,
      props: nextProps,
      modifiedAt: new Date().toISOString(),
    };

    const isValid = validateField(field as string, nextEntity);
    if (!isValid) return;

    updateEntityCommand(
      entity.id,
      { props: nextProps, modifiedAt: nextEntity.modifiedAt },
      previous
    );
  },
  [entity.id, validateField]
);
```

### 3. Equipment Types

Available equipment types with their defaults:

| Type | Label | Default CFM | Default Pressure | Dimensions (W×D×H) |
|------|-------|-------------|------------------|--------------------|
| `ahu` | Air Handling Unit | 5000 | 2.5 | 48×36×60 |
| `rtu` | Rooftop Unit | 3000 | 1.5 | 60×48×42 |
| `fcu` | Fan Coil Unit | 800 | 0.5 | 24×18×12 |
| `exhaust_fan` | Exhaust Fan | 1000 | 0.75 | 24×24×24 |
| `supply_fan` | Supply Fan | 2000 | 1.0 | 30×30×30 |
| `vav` | VAV Box | 1200 | 0.8 | 36×24×18 |
| `heat_pump` | Heat Pump | 2500 | 1.2 | 36×36×42 |
| `chiller` | Chiller | 0 | 0 | 72×48×84 |
| `boiler` | Boiler | 0 | 0 | 48×36×72 |

### 4. Validation

**Required fields:**
- Name: Non-empty string
- Equipment Type: One of the valid types

**Optional fields:**
- Manufacturer: String
- Model: String

**Performance:**
- Capacity: 1-100,000 CFM
- Static Pressure: 0-20 in.w.g.

**Dimensions:**
- Width: Min 1 inch
- Depth: Min 1 inch
- Height: Min 1 inch

## Component Implementation

```tsx
export function EquipmentInspector({ entity }: EquipmentInspectorProps) {
  const { errors, validateField } = useFieldValidation(entity);

  const commit = useCallback(/* ... */);
  const handleTypeChange = useCallback(/* ... */);

  return (
    <div>
      {/* Identity Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Identity</h3>
        <PropertyField label="Name" htmlFor="equipment-name">
          <ValidatedInput
            id="equipment-name"
            type="text"
            value={entity.props.name}
            error={errors['name']}
            onChange={(val) => commit('name', val as string)}
          />
        </PropertyField>
        {/* Manufacturer and Model fields */}
      </div>

      {/* Type Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Type</h3>
        <PropertyField label="Equipment Type" htmlFor="equipment-type">
          <ValidatedInput
            id="equipment-type"
            type="select"
            value={entity.props.equipmentType}
            onChange={(val) => handleTypeChange(val as Equipment['props']['equipmentType'])}
            options={Object.keys(EQUIPMENT_TYPE_LABELS).map((key) => ({
              value: key,
              label: EQUIPMENT_TYPE_LABELS[key],
            }))}
          />
        </PropertyField>
      </div>

      {/* Performance and Dimensions sections */}
    </div>
  );
}
```

## Usage Example

```tsx
import { EquipmentInspector } from './Inspector/EquipmentInspector';

function InspectorPanel() {
  const selectedId = useSelectionStore((s) => s.selectedIds[0]);
  const entity = useEntityStore((s) => s.byId[selectedId]);

  if (!entity || entity.type !== 'equipment') {
    return <div>Select equipment to edit</div>;
  }

  return <EquipmentInspector entity={entity} />;
}
```

## Type Change Behavior

When a user changes the equipment type:

1. **Before**: AHU with custom capacity of 6500 CFM
2. **User Action**: Change type from "AHU" to "Exhaust Fan"
3. **After**: Exhaust Fan with default capacity of 1000 CFM (custom value lost)

**Important**: Type changes overwrite capacity, pressure, and dimensions with type-specific defaults. This ensures realistic equipment specifications.

## Styling

```css
.section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.sectionTitle {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

## Related Elements

- [InspectorPanel](./InspectorPanel.md) - Parent container
- [RoomInspector](./RoomInspector.md) - Room property editor
- [DuctInspector](./DuctInspector.md) - Duct property editor
- [PropertyField](./PropertyField.md) - Reusable field wrapper
- [ValidatedInput](../ui/ValidatedInput.md) - Input with validation
- [EquipmentSchema](../../03-schemas/EquipmentSchema.md) - Equipment validation schema
- [EquipmentDefaults](../../08-entities/EquipmentDefaults.md) - Type defaults

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { EquipmentInspector } from './EquipmentInspector';
import { createEquipment } from '../../entities/equipmentDefaults';

describe('EquipmentInspector', () => {
  it('renders all property sections', () => {
    const equipment = createEquipment({ x: 0, y: 0 }, { equipmentType: 'ahu' });
    render(<EquipmentInspector entity={equipment} />);

    expect(screen.getByText('Identity')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Dimensions')).toBeInTheDocument();
  });

  it('displays all equipment type options', () => {
    const equipment = createEquipment({ x: 0, y: 0 }, { equipmentType: 'ahu' });
    render(<EquipmentInspector entity={equipment} />);

    const typeSelect = screen.getByLabelText('Equipment Type');
    fireEvent.click(typeSelect);

    expect(screen.getByText('Air Handling Unit')).toBeInTheDocument();
    expect(screen.getByText('Rooftop Unit')).toBeInTheDocument();
    expect(screen.getByText('Exhaust Fan')).toBeInTheDocument();
  });

  it('applies defaults when equipment type changes', () => {
    const equipment = createEquipment({ x: 0, y: 0 }, { equipmentType: 'ahu', capacity: 6500 });
    render(<EquipmentInspector entity={equipment} />);

    const typeSelect = screen.getByLabelText('Equipment Type');
    fireEvent.change(typeSelect, { target: { value: 'exhaust_fan' } });

    // Should call updateEntityCommand with exhaust fan defaults
    expect(updateEntityCommand).toHaveBeenCalledWith(
      equipment.id,
      expect.objectContaining({
        props: expect.objectContaining({
          equipmentType: 'exhaust_fan',
          capacity: 1000, // Exhaust fan default, not 6500
        })
      }),
      equipment
    );
  });

  it('updates individual properties', () => {
    const equipment = createEquipment({ x: 0, y: 0 }, { equipmentType: 'ahu' });
    render(<EquipmentInspector entity={equipment} />);

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Main AHU' } });

    expect(updateEntityCommand).toHaveBeenCalledWith(
      equipment.id,
      expect.objectContaining({
        props: expect.objectContaining({ name: 'Main AHU' })
      }),
      equipment
    );
  });

  it('validates capacity range', () => {
    const equipment = createEquipment({ x: 0, y: 0 }, { equipmentType: 'ahu' });
    render(<EquipmentInspector entity={equipment} />);

    const capacityInput = screen.getByLabelText('Capacity (CFM)');
    fireEvent.change(capacityInput, { target: { value: '150000' } }); // Over max of 100,000

    expect(screen.getByText(/maximum.*100000/i)).toBeInTheDocument();
  });
});
```
