# CanvasPropertiesInspector

## Overview
Canvas-level settings inspector displayed when no entity is selected, showing project info, grid settings, units, and canvas info.

## Location
```
hvac-design-app/src/features/canvas/components/Inspector/CanvasPropertiesInspector.tsx
```

## Purpose
- Displays canvas properties when nothing is selected
- Replaces "Select an entity" message with useful controls
- Provides grid configuration (size, visibility, snap)
- Shows read-only project information
- Includes placeholder for unit system switching (future)
- Displays canvas appearance info

## Dependencies
- **UI Components**: `CollapsibleSection`, `Dropdown`
- **Store**: `useViewportStore`, `useProjectStore`
- **Styles**: `CanvasPropertiesInspector.module.css`

## Props
None (pulls data from stores)

## Visual Layout

```
┌───────────────────────────────┐
│ Canvas Properties             │
├───────────────────────────────┤
│ ▼ Project Info                │
│   Project Name                │
│   Office Building HVAC        │
│   Project Number              │
│   2025-001                    │
│   Client Name                 │
│   Acme Corporation            │
│                               │
│ ▼ Grid Settings               │
│   Grid Size                   │
│   [1" ▼]                      │
│   ☑ Show Grid                 │
│   ☑ Snap to Grid              │
│                               │
│ ▼ Units                       │
│   Unit System                 │
│   [Imperial (in, ft) ▼]       │
│                               │
│ ▶ Canvas Info                 │
│   Background    #FAFAFA       │
│   Grid Color    #E5E5E5       │
└───────────────────────────────┘
```

## Component Implementation

### Grid Size Options
```typescript
const GRID_SIZE_OPTIONS = [
  { value: '6', label: '1/4"' },
  { value: '12', label: '1/2"' },
  { value: '24', label: '1"' },
  { value: '48', label: '2"' },
];
```

### Unit System Options (Future)
```typescript
const UNIT_SYSTEM_OPTIONS = [
  { value: 'imperial', label: 'Imperial (in, ft)' },
  { value: 'metric', label: 'Metric (mm, m)' },
];
```

## Behavior

### Section 1: Project Info (Default Open, Read-Only)
Displays:
- **Project Name**: From `projectDetails.projectName || 'Untitled'`
- **Project Number**: Conditional render if exists
- **Client Name**: Conditional render if exists

### Section 2: Grid Settings (Default Open, Editable)
Controls:
- **Grid Size**: Dropdown with 4 options (1/4", 1/2", 1", 2")
  - Calls `setGridSize(Number(value))`
- **Show Grid**: Checkbox
  - Calls `toggleGrid()`
- **Snap to Grid**: Checkbox
  - Calls `toggleSnap()`

### Section 3: Units (Default Open, Future Feature)
Controls:
- **Unit System**: Dropdown (Imperial/Metric)
  - Currently logs: "Unit system change not yet implemented"
  - Future: Switch between imperial and metric units

### Section 4: Canvas Info (Default Closed, Read-Only)
Displays:
- **Background**: `#FAFAFA` (hard-coded)
- **Grid Color**: `#E5E5E5` (hard-coded)

## State Management

### Viewport Store
```typescript
const {
  gridSize,
  gridVisible,
  snapToGrid,
  setGridSize,
  toggleGrid,
  toggleSnap,
} = useViewportStore();
```

### Project Store
```typescript
const projectDetails = useProjectStore((state) => state.projectDetails);
const projectName = projectDetails?.projectName || 'Untitled';
const projectNumber = projectDetails?.projectNumber;
const clientName = projectDetails?.clientName;
```

## Styling

### Module CSS Classes
- `.inspector`: Main container
- `.header`: Section header
- `.field`: Form field container
- `.readOnly`: Read-only value display
- `.checkboxLabel`: Checkbox label wrapper
- `.checkbox`: Checkbox input
- `.infoGrid`: Info grid layout
- `.infoItem`: Individual info item
- `.infoLabel`: Info label
- `.infoValue`: Info value

## Usage Examples

### Basic Usage
```tsx
// Displayed in RightSidebar when no entity selected
{!selectedEntity && <CanvasPropertiesInspector />}
```

### Integration with Inspector Container
```tsx
const selectedEntity = useCanvasStore(state => state.selectedEntity);

<Inspector>
  {selectedEntity ? (
    <EntityInspector entity={selectedEntity} />
  ) : (
    <CanvasPropertiesInspector />
  )}
</Inspector>
```

### Conditional Rendering
```tsx
const showCanvasProps = !selectedEntity && !selectedRoom && !selectedDuct;

{showCanvasProps && <CanvasPropertiesInspector />}
```

## Accessibility

### Semantic HTML
- Uses `<label>` for all inputs
- Checkbox labels wrap inputs for larger click area
- Section headings provide structure

### Keyboard Navigation
- **Tab**: Navigate between controls
- **Space**: Toggle checkboxes
- **Arrow Keys**: Navigate dropdown options
- **Enter**: Confirm dropdown selection

### Screen Reader Support
- All inputs have associated labels
- Read-only values clearly marked
- Section structure communicated via headings

## Related Elements

### Components
- [CollapsibleSection](../ui/CollapsibleSection.md) - Accordion sections
- [Dropdown](../ui/Dropdown.md) - Select inputs
- [InspectorPanel](./InspectorPanel.md) - Parent inspector container
- [ProjectSidebar](../canvas/ProjectSidebar.md) - Alternative project info display

### Stores
- [viewportStore](../../02-stores/viewportStore.md) - Grid settings
- [projectStore](../../02-stores/projectStore.md) - Project details

## Testing

### Test Coverage
```typescript
describe('CanvasPropertiesInspector', () => {
  it('renders "Canvas Properties" header');
  it('displays project info section');
  it('shows project name (or "Untitled")');
  it('conditionally renders project number');
  it('conditionally renders client name');
  it('renders grid settings with controls');
  it('updates gridSize on dropdown change');
  it('toggles gridVisible on checkbox change');
  it('toggles snapToGrid on checkbox change');
  it('displays units section with dropdown');
  it('logs message for unit system change (not implemented)');
  it('displays canvas info section (collapsed by default)');
  it('shows background and grid color values');
});
```

### Key Test Scenarios
1. **Project Info**: Displays correct project details or fallbacks
2. **Grid Controls**: All grid settings update store correctly
3. **Checkboxes**: Toggles work and reflect store state
4. **Dropdown**: Grid size changes update viewport
5. **Unit System**: Placeholder logs message (future feature)
6. **Conditional Rendering**: Project number/client only show if exist

## Future Enhancements

### Unit System Implementation
```typescript
const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');

const handleUnitChange = (value: string) => {
  setUnitSystem(value as 'imperial' | 'metric');
  // Convert all measurements in project
  convertProjectUnits(value);
};
```

### Canvas Color Customization
```typescript
const [backgroundColor, setBackgroundColor] = useState('#FAFAFA');
const [gridColor, setGridColor] = useState('#E5E5E5');

<ColorPicker
  label="Background"
  value={backgroundColor}
  onChange={setBackgroundColor}
/>
```

### Additional Canvas Settings
- Ruler visibility
- Measurement units display
- Canvas zoom limits
- Pan boundaries
