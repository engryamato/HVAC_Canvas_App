# InspectorPanel

## Overview

The InspectorPanel is a sidebar component that displays and allows editing of properties for the currently selected entity. It dynamically renders the appropriate inspector based on the entity type (Room, Duct, Equipment, etc.).

## Location

```
src/features/canvas/components/Inspector/InspectorPanel.tsx
```

## Purpose

- Display properties of the selected entity
- Provide form inputs for editing entity properties
- Show calculated values (CFM, area, volume, etc.)
- Display validation errors and warnings
- Handle multi-selection state
- Show empty state when nothing is selected

## Dependencies

- `@/features/canvas/store/selectionStore` - Selected entity IDs
- `@/core/store/entityStore` - Entity data
- Type-specific inspectors (RoomInspector, DuctInspector, etc.)
- `@/components/ui/CollapsibleSection` - Collapsible property groups

## Component States

```
┌─────────────────────────────────────┐
│         INSPECTOR PANEL             │
├─────────────────────────────────────┤
│                                     │
│  State: EMPTY                       │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │   Select an entity on the   │   │
│  │   canvas to view and edit   │   │
│  │   its properties            │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  State: SINGLE SELECTION            │
│  ┌─────────────────────────────┐   │
│  │ Room: Kitchen               │   │
│  ├─────────────────────────────┤   │
│  │ ▼ Dimensions                │   │
│  │   Width:  [120    ] in      │   │
│  │   Length: [180    ] in      │   │
│  │   Height: [96     ] in      │   │
│  ├─────────────────────────────┤   │
│  │ ▼ Ventilation               │   │
│  │   ACH Required: [12  ]      │   │
│  │   Occupancy: [Commercial ▼] │   │
│  ├─────────────────────────────┤   │
│  │ ▶ Calculated (read-only)    │   │
│  │   Area: 150 sq ft           │   │
│  │   Volume: 1,200 cu ft       │   │
│  │   CFM Required: 240         │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  State: MULTI SELECTION             │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │   3 items selected          │   │
│  │                             │   │
│  │   • 2 Rooms                 │   │
│  │   • 1 Duct                  │   │
│  │                             │   │
│  │   [Delete Selected]         │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `className` | `string` | No | Additional CSS classes |
| `width` | `number` | No | Panel width (default: 320px) |

## Internal Logic

```typescript
function InspectorPanel({ className, width = 320 }: InspectorPanelProps) {
  const selectedIds = useSelectedIds();
  const entities = useAllEntities();

  // Get selected entities
  const selectedEntities = useMemo(() => {
    return selectedIds
      .map((id) => entities.find((e) => e.id === id))
      .filter(Boolean);
  }, [selectedIds, entities]);

  // Determine render mode
  if (selectedEntities.length === 0) {
    return <EmptyState />;
  }

  if (selectedEntities.length > 1) {
    return <MultiSelectState entities={selectedEntities} />;
  }

  // Single selection - render type-specific inspector
  const entity = selectedEntities[0];

  switch (entity.type) {
    case 'room':
      return <RoomInspector entity={entity} />;
    case 'duct':
      return <DuctInspector entity={entity} />;
    case 'equipment':
      return <EquipmentInspector entity={entity} />;
    case 'fitting':
      return <FittingInspector entity={entity} />;
    case 'note':
      return <NoteInspector entity={entity} />;
    default:
      return <GenericInspector entity={entity} />;
  }
}
```

## Panel Sections

### 1. Header
```tsx
<div className="inspector-header">
  <span className="entity-type">{entity.type}</span>
  <span className="entity-name">{entity.props.name}</span>
</div>
```

### 2. Property Groups (Collapsible)
```tsx
<CollapsibleSection title="Dimensions" defaultExpanded>
  <PropertyField
    label="Width"
    value={entity.props.width}
    onChange={(value) => updateEntity(entity.id, { width: value })}
    type="number"
    unit="in"
  />
  {/* More fields... */}
</CollapsibleSection>
```

### 3. Calculated Values (Read-only)
```tsx
<CollapsibleSection title="Calculated" defaultExpanded={false}>
  <PropertyField
    label="Area"
    value={entity.calculated.area}
    unit="sq ft"
    readOnly
  />
  {/* More fields... */}
</CollapsibleSection>
```

## Styling

```css
.inspector-panel {
  width: 320px;
  height: 100%;
  background: #f8f9fa;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
  padding: 16px;
}

.inspector-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.entity-type {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.entity-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
  text-align: center;
}
```

## Update Flow

```
User edits field
       │
       ▼
┌──────────────┐
│ PropertyField│
│ onChange()   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Validate     │
│ with Zod     │
└──────┬───────┘
       │
       ├── Invalid ──▶ Show error message
       │
       ▼ Valid
┌──────────────┐
│ updateEntity │
│ command      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ entityStore  │
│ updates      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Canvas       │
│ re-renders   │
└──────────────┘
```

## Usage

```tsx
import { InspectorPanel } from '@/features/canvas/components/Inspector/InspectorPanel';

function CanvasPage() {
  return (
    <div className="flex h-screen">
      <Toolbar />
      <CanvasContainer />
      <InspectorPanel width={320} />
    </div>
  );
}
```

## Accessibility

- Labels associated with inputs via `htmlFor`
- Error messages linked via `aria-describedby`
- Keyboard navigation within form
- Focus management when selection changes
- Screen reader announcements for state changes

## Related Elements

- [RoomInspector](./RoomInspector.md) - Room-specific properties
- [DuctInspector](./DuctInspector.md) - Duct-specific properties
- [EquipmentInspector](./EquipmentInspector.md) - Equipment-specific properties
- [PropertyField](./PropertyField.md) - Reusable property input
- [CollapsibleSection](../ui/CollapsibleSection.md) - Collapsible groups
- [SelectionStore](../../02-stores/selectionStore.md) - Selection state
- [EntityStore](../../02-stores/entityStore.md) - Entity data

## Testing

```typescript
describe('InspectorPanel', () => {
  it('shows empty state when nothing selected', () => {
    useSelectionStore.setState({ selectedIds: [] });

    render(<InspectorPanel />);

    expect(screen.getByText(/select an entity/i)).toBeInTheDocument();
  });

  it('shows multi-select state for multiple selections', () => {
    useSelectionStore.setState({ selectedIds: ['id1', 'id2'] });
    useEntityStore.setState({
      byId: {
        id1: { id: 'id1', type: 'room', ... },
        id2: { id: 'id2', type: 'duct', ... },
      },
      allIds: ['id1', 'id2'],
    });

    render(<InspectorPanel />);

    expect(screen.getByText('2 items selected')).toBeInTheDocument();
  });

  it('renders RoomInspector for room selection', () => {
    useSelectionStore.setState({ selectedIds: ['room1'] });
    useEntityStore.setState({
      byId: { room1: { id: 'room1', type: 'room', props: { name: 'Kitchen' } } },
      allIds: ['room1'],
    });

    render(<InspectorPanel />);

    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    expect(screen.getByLabelText('Width')).toBeInTheDocument();
  });

  it('updates entity on property change', async () => {
    const updateEntity = vi.fn();
    useEntityStore.setState({ updateEntity });
    // Setup room selection...

    render(<InspectorPanel />);

    const widthInput = screen.getByLabelText('Width');
    await userEvent.clear(widthInput);
    await userEvent.type(widthInput, '150');

    expect(updateEntity).toHaveBeenCalledWith('room1', { width: 150 });
  });
});
```
