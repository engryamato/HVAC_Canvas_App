# FittingTypeSelector

## Overview
Inline toolbar for selecting fitting subtype when Fitting tool is active (Elbow 90°, Elbow 45°, Tee, Reducer, Cap).

## Location
```
hvac-design-app/src/components/canvas/FittingTypeSelector.tsx
```

## Purpose
- Provides quick fitting subtype selection without leaving canvas
- Displays only when Fitting tool is active
- Shows currently selected fitting type
- Enables one-click switching between fitting types

## Dependencies
- **UI Components**: `Button` (shadcn/ui)
- **Store**: `useSelectedFittingType`, `useToolActions` (canvas.store)
- **Utilities**: `cn` (class names)
- **Types**: `FittingType` (fitting.schema)

## Props
None (fully managed by canvas store)

## Visual Layout

```
┌──────────────────────────────────────────────────────────┐
│ Fitting Type: [Elbow 90°] [Elbow 45°] [Tee] [Reducer]...│
└──────────────────────────────────────────────────────────┘
```

### Active State Example
```
Fitting Type: [Elbow 90°✓] [Elbow 45°] [Tee] [Reducer] [Cap]
              ^^^^^^^^^^^^^ (selected - default variant)
```

## Component Implementation

### Fitting Types
```typescript
const FITTING_TYPES = [
  { id: 'elbow_90', label: 'Elbow 90°' },
  { id: 'elbow_45', label: 'Elbow 45°' },
  { id: 'tee', label: 'Tee' },
  { id: 'reducer', label: 'Reducer' },
  { id: 'cap', label: 'Cap' },
];
```

## Behavior

### Selection
Clicking a button:
1. Calls `setFittingType(type.id)`
2. Updates canvas store
3. Button switches to `default` variant (selected state)
4. Previous selection switches to `ghost` variant

### Visual Feedback
- **Selected**: `variant="default"` (filled blue button)
- **Unselected**: `variant="ghost"` (transparent hover)
- **Aria**: `aria-pressed={selectedType === type.id}`

### Integration with Canvas
When user clicks canvas with Fitting tool:
1. Canvas reads `selectedFittingType` from store
2. Creates fitting entity of selected type
3. Type selector remains visible for next placement

## State Management

### Store Hooks
```typescript
const selectedType = useSelectedFittingType();
const { setFittingType } = useToolActions();
```

### Store Interaction
```typescript
setFittingType('elbow_90');
// Updates canvas.store.selectedFittingType
```

## Styling

### Container
- **Background**: `bg-slate-50`
- **Border**: `border-b border-slate-200`
- **Padding**: `px-3 py-1.5`
- **Layout**: `flex items-center gap-2`

### Label
- **Text**: `text-xs font-medium text-slate-600`
- **Content**: "Fitting Type:"

### Buttons
- **Size**: `size="sm"`
- **Height**: `h-7`
- **Padding**: `px-2`
- **Text**: `text-xs`
- **Gap**: `gap-1` between buttons

## Usage Examples

### Rendered by AppShell
```tsx
{currentTool === 'fitting' && <FittingTypeSelector />}
```

### Programmatic Type Selection
```typescript
import { useToolActions } from '@/core/store/canvas.store';

const { setFittingType } = useToolActions();

// Set fitting type programmatically
setFittingType('tee');
```

### Reading Current Selection
```typescript
import { useSelectedFittingType } from '@/core/store/canvas.store';

const selectedType = useSelectedFittingType();
console.log(selectedType); // 'elbow_90' | 'elbow_45' | 'tee' | etc.
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate between buttons
- **Space/Enter**: Select fitting type
- **Arrow Keys**: Navigate buttons (native browser behavior)

### ARIA Attributes
- **Toolbar**: `role="toolbar"`, `aria-label="Fitting type selection"`
- **Buttons**: `aria-pressed={isSelected}` (toggle state)
- **Test IDs**: Each button has `data-testid="fitting-type-{id}"`

### Screen Reader Support
- Toolbar announced as "Fitting type selection"
- Each button state announced (pressed/not pressed)
- Label "Fitting Type:" provides context

## Related Elements

### Components
- [AppShell](../layout/AppShell.md) - Conditionally renders selector
- [EquipmentTypeSelector](./EquipmentTypeSelector.md) - Similar pattern for equipment
- [Toolbar](../layout/Toolbar.md) - Parent toolbar with tool selection

### Stores
- [canvasStore](../../02-stores/canvasStore.md) - `selectedFittingType`, `setFittingType`

### Schemas
- [FittingSchema](../../03-schemas/FittingSchema.md) - `FittingType` type definition

## Testing

**Test ID**: `fitting-type-selector`

### Test Coverage
```typescript
describe('FittingTypeSelector', () => {
  it('renders all 5 fitting types');
  it('highlights selected fitting type');
  it('calls setFittingType on button click');
  it('updates aria-pressed state correctly');
  it('displays label "Fitting Type:"');
  it('applies correct variant based on selection');
});
```

### Test IDs
- Container: `fitting-type-selector`
- Buttons: `fitting-type-elbow_90`, `fitting-type-elbow_45`, etc.

### Key Test Scenarios
1. **Selection**: Clicking button updates store and UI
2. **Aria State**: `aria-pressed` matches selected state
3. **Variants**: Selected = `default`, unselected = `ghost`
4. **All Types**: All 5 fitting types rendered
