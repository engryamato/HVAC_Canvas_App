# RoomInspector

## Overview

The RoomInspector component provides a property editor panel for Room entities, displaying editable fields for identity, geometry, occupancy settings, and read-only calculated values like area, volume, and required CFM.

## Location

```
src/features/canvas/components/Inspector/RoomInspector.tsx
```

## Purpose

- Edit room properties (name, dimensions, occupancy type)
- Display calculated HVAC values (area, volume, CFM)
- Validate field inputs in real-time
- Execute undo-able update commands
- Group properties into logical sections

## Dependencies

- [PropertyField](./PropertyField.md) - Labeled input wrapper
- [ValidatedInput](../ui/ValidatedInput.md) - Input with validation
- [useFieldValidation](../../07-hooks/useFieldValidation.md) - Field validation hook
- [entityStore](../../02-stores/entityStore.md) - Entity state management
- [entityCommands](../../09-commands/EntityCommands.md) - Undo-able commands
- Room schema from `@/core/schema`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `entity` | `Room` | Yes | The room entity to edit |

## State

The component maintains no local state. All state is managed through:
- `useFieldValidation(entity)` - Returns validation errors and validateField function
- `useEntityStore` - Global entity state (accessed in commit callback)

## Layout

```
┌─────────────────────────────────────┐
│ ┌─ Identity ─────────────────────┐  │
│ │ Name: [Office 101         ]    │  │
│ │ Notes: [Optional text     ]    │  │
│ └────────────────────────────────┘  │
│                                     │
│ ┌─ Geometry ────────────────────┐  │
│ │ Width (in):  [240]             │  │
│ │ Length (in): [180]             │  │
│ │ Height (in): [108]             │  │
│ └────────────────────────────────┘  │
│                                     │
│ ┌─ Occupancy ───────────────────┐  │
│ │ Type: [Office ▼]               │  │
│ │ Air Changes/Hr: [6.0]          │  │
│ └────────────────────────────────┘  │
│                                     │
│ ┌─ Calculated ──────────────────┐  │
│ │ Area (sq ft):     300.00       │  │
│ │ Volume (cu ft):   2700.00      │  │
│ │ Required CFM:     270.00       │  │
│ └────────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Behavior

### 1. Field Updates

The `commit` callback handles all property updates:

```typescript
const commit = useCallback(
  <K extends keyof Room['props']>(field: K, value: Room['props'][K]) => {
    // 1. Get current entity from store
    const { byId } = useEntityStore.getState();
    const current = byId[entity.id];

    // 2. Create deep copy for undo
    const previous = JSON.parse(JSON.stringify(current)) as Room;

    // 3. Build updated entity
    const nextProps = { ...current.props, [field]: value };
    const nextEntity: Room = {
      ...current,
      props: nextProps,
      modifiedAt: new Date().toISOString(),
    };

    // 4. Validate before committing
    const isValid = validateField(field as string, nextEntity);
    if (!isValid) return;

    // 5. Execute undo-able command
    updateEntityCommand(entity.id, { props: nextProps, modifiedAt: nextEntity.modifiedAt }, previous);
  },
  [entity.id, validateField]
);
```

### 2. Validation

- Real-time validation using `useFieldValidation` hook
- Width: 1-10000 inches
- Length: 1-10000 inches
- Height: 1-500 inches
- Air Changes/Hr: 1-100
- Errors displayed inline under invalid fields

### 3. Occupancy Types

Available room types:
- **Office** - Standard office space
- **Retail** - Retail/commercial space
- **Restaurant** - Dining area
- **Commercial Kitchen** - Food prep area (higher CFM)
- **Warehouse** - Storage/logistics
- **Classroom** - Educational space
- **Conference** - Meeting room
- **Lobby** - Entrance/waiting area

### 4. Calculated Fields (Read-only)

- **Area**: `(width * length) / 144` sq ft
- **Volume**: `area * height / 12` cu ft
- **Required CFM**: `volume * airChangesPerHour / 60`

## Component Implementation

```tsx
export function RoomInspector({ entity }: RoomInspectorProps) {
  const { errors, validateField } = useFieldValidation(entity);

  const commit = useCallback(
    <K extends keyof Room['props']>(field: K, value: Room['props'][K]) => {
      const { byId } = useEntityStore.getState();
      const current = byId[entity.id];
      if (!current || current.type !== 'room') return;

      const previous = JSON.parse(JSON.stringify(current)) as Room;
      const nextProps = { ...current.props, [field]: value };
      const nextEntity: Room = {
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

  return (
    <div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Identity</h3>
        <PropertyField label="Name" htmlFor="room-name">
          <ValidatedInput
            id="room-name"
            type="text"
            value={entity.props.name}
            error={errors['name']}
            onChange={(val) => commit('name', val as string)}
          />
        </PropertyField>
        {/* ... more fields ... */}
      </div>
    </div>
  );
}
```

## Usage Example

```tsx
import { RoomInspector } from './Inspector/RoomInspector';
import { useEntityStore } from '@/core/store/entityStore';

function InspectorPanel() {
  const selectedId = useSelectionStore((s) => s.selectedIds[0]);
  const entity = useEntityStore((s) => s.byId[selectedId]);

  if (!entity || entity.type !== 'room') {
    return <div>Select a room to edit</div>;
  }

  return <RoomInspector entity={entity} />;
}
```

## Styling

The component uses shared styles from `InspectorPanel.module.css`:

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

- [InspectorPanel](./InspectorPanel.md) - Parent container that renders this component
- [DuctInspector](./DuctInspector.md) - Duct property editor
- [EquipmentInspector](./EquipmentInspector.md) - Equipment property editor
- [PropertyField](./PropertyField.md) - Reusable field wrapper
- [ValidatedInput](../ui/ValidatedInput.md) - Input with validation
- [RoomSchema](../../03-schemas/RoomSchema.md) - Room validation schema
- [useFieldValidation](../../07-hooks/useFieldValidation.md) - Validation hook

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { RoomInspector } from './RoomInspector';
import { createRoom } from '../../entities/roomDefaults';

describe('RoomInspector', () => {
  const mockRoom = createRoom({ x: 0, y: 0 }, { width: 240, height: 180 });

  it('renders all property sections', () => {
    render(<RoomInspector entity={mockRoom} />);

    expect(screen.getByText('Identity')).toBeInTheDocument();
    expect(screen.getByText('Geometry')).toBeInTheDocument();
    expect(screen.getByText('Occupancy')).toBeInTheDocument();
    expect(screen.getByText('Calculated')).toBeInTheDocument();
  });

  it('displays current property values', () => {
    render(<RoomInspector entity={mockRoom} />);

    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toHaveValue(mockRoom.props.name);

    const widthInput = screen.getByLabelText('Width (in)');
    expect(widthInput).toHaveValue(mockRoom.props.width);
  });

  it('updates entity when valid value is entered', () => {
    render(<RoomInspector entity={mockRoom} />);

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Conference Room' } });

    // Verify updateEntityCommand was called with new value
    expect(updateEntityCommand).toHaveBeenCalledWith(
      mockRoom.id,
      expect.objectContaining({
        props: expect.objectContaining({ name: 'Conference Room' })
      }),
      mockRoom
    );
  });

  it('shows validation error for invalid dimensions', () => {
    render(<RoomInspector entity={mockRoom} />);

    const widthInput = screen.getByLabelText('Width (in)');
    fireEvent.change(widthInput, { target: { value: '0' } }); // Below min of 1

    expect(screen.getByText(/must be at least 1/i)).toBeInTheDocument();
  });

  it('displays calculated values', () => {
    render(<RoomInspector entity={mockRoom} />);

    // 240" x 180" = 300 sq ft
    expect(screen.getByText('300.00')).toBeInTheDocument();

    // 300 sq ft * 108" height / 12 = 2700 cu ft
    expect(screen.getByText('2700.00')).toBeInTheDocument();
  });

  it('prevents invalid updates', () => {
    render(<RoomInspector entity={mockRoom} />);

    const heightInput = screen.getByLabelText('Height (in)');
    fireEvent.change(heightInput, { target: { value: '0' } }); // Below min of 1

    // Should not call updateEntityCommand
    expect(updateEntityCommand).not.toHaveBeenCalled();
  });
});
```
