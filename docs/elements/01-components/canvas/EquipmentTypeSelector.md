# EquipmentTypeSelector

## Overview
Inline toolbar for selecting equipment subtype when Equipment tool is active (Hood, Fan, Diffuser, Damper, Air Handler, Furnace, RTU).

## Location
```
hvac-design-app/src/components/canvas/EquipmentTypeSelector.tsx
```

## Purpose
- Provides quick equipment subtype selection without leaving canvas
- Displays only when Equipment tool is active
- Shows currently selected equipment type
- Enables one-click switching between equipment types

## Dependencies
- **UI Components**: `Button` (shadcn/ui)
- **Store**: `useSelectedEquipmentType`, `useToolActions` (canvas.store)
- **Utilities**: `cn` (class names)
- **Types**: `EquipmentType` (equipment.schema)

## Props
None (fully managed by canvas store)

## Visual Layout

```
┌──────────────────────────────────────────────────────────┐
│ Equipment Type: [Hood] [Fan] [Diffuser] [Damper] ...    │
└──────────────────────────────────────────────────────────┘
```

### Active State Example
```
Equipment Type: [Hood✓] [Fan] [Diffuser] [Damper] [Air Handler] [Furnace] [RTU]
                ^^^^^^^^ (selected - default variant)
```

## Component Implementation

### Equipment Types
```typescript
const EQUIPMENT_TYPES = [
  { id: 'hood', label: 'Hood' },
  { id: 'fan', label: 'Fan' },
  { id: 'diffuser', label: 'Diffuser' },
  { id: 'damper', label: 'Damper' },
  { id: 'air_handler', label: 'Air Handler' },
  { id: 'furnace', label: 'Furnace' },
  { id: 'rtu', label: 'RTU' },
];
```

## Behavior

### Selection
Clicking a button:
1. Calls `setEquipmentType(type.id)`
2. Updates canvas store
3. Button switches to `default` variant (selected state)
4. Previous selection switches to `ghost` variant

### Visual Feedback
- **Selected**: `variant="default"` (filled blue button)
- **Unselected**: `variant="ghost"` (transparent hover)
- **Aria**: `aria-pressed={selectedType === type.id}`

### Integration with Canvas
When user clicks canvas with Equipment tool:
1. Canvas reads `selectedEquipmentType` from store
2. Creates equipment entity of selected type
3. Type selector remains visible for next placement

## State Management

### Store Hooks
```typescript
const selectedType = useSelectedEquipmentType();
const { setEquipmentType } = useToolActions();
```

### Store Interaction
```typescript
setEquipmentType('hood');
// Updates canvas.store.selectedEquipmentType
```

## Styling

### Container
- **Background**: `bg-slate-50`
- **Border**: `border-b border-slate-200`
- **Padding**: `px-3 py-1.5`
- **Layout**: `flex items-center gap-2`

### Label
- **Text**: `text-xs font-medium text-slate-600`
- **Content**: "Equipment Type:"

### Buttons
- **Size**: `size="sm"`
- **Height**: `h-7`
- **Padding**: `px-2`
- **Text**: `text-xs`
- **Gap**: `gap-1` between buttons

## Usage Examples

### Rendered by AppShell
```tsx
{currentTool === 'equipment' && <EquipmentTypeSelector />}
```

### Programmatic Type Selection
```typescript
import { useToolActions } from '@/core/store/canvas.store';

const { setEquipmentType } = useToolActions();

// Set equipment type programmatically
setEquipmentType('diffuser');
```

### Reading Current Selection
```typescript
import { useSelectedEquipmentType } from '@/core/store/canvas.store';

const selectedType = useSelectedEquipmentType();
console.log(selectedType); // 'hood' | 'fan' | 'diffuser' | etc.
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate between buttons
- **Space/Enter**: Select equipment type
- **Arrow Keys**: Navigate buttons (native browser behavior)

### ARIA Attributes
- **Toolbar**: `role="toolbar"`, `aria-label="Equipment type selection"`
- **Buttons**: `aria-pressed={isSelected}` (toggle state)
- **Test IDs**: Each button has `data-testid="equipment-type-{id}"`

### Screen Reader Support
- Toolbar announced as "Equipment type selection"
- Each button state announced (pressed/not pressed)
- Label "Equipment Type:" provides context

## Related Elements

### Components
- [AppShell](../layout/AppShell.md) - Conditionally renders selector
- [FittingTypeSelector](./FittingTypeSelector.md) - Similar pattern for fittings
- [Toolbar](../layout/Toolbar.md) - Parent toolbar with tool selection

### Stores
- [canvas.store](../../02-stores/canvas.store.md) - `selectedEquipmentType`, `setEquipmentType`

### Schemas
- [equipment.schema](../../04-schemas/equipment.schema.md) - `EquipmentType` type definition

## Testing

**Test ID**: `equipment-type-selector`

### Test Coverage
```typescript
describe('EquipmentTypeSelector', () => {
  it('renders all 7 equipment types');
  it('highlights selected equipment type');
  it('calls setEquipmentType on button click');
  it('updates aria-pressed state correctly');
  it('displays label "Equipment Type:"');
  it('applies correct variant based on selection');
});
```

### Test IDs
- Container: `equipment-type-selector`
- Buttons: `equipment-type-hood`, `equipment-type-fan`, etc.

### Key Test Scenarios
1. **Selection**: Clicking button updates store and UI
2. **Aria State**: `aria-pressed` matches selected state
3. **Variants**: Selected = `default`, unselected = `ghost`
4. **All Types**: All 7 equipment types rendered
