# Minimap

## Overview
Placeholder minimap component with undock capability for canvas overview navigation.

## Location
```
hvac-design-app/src/features/canvas/components/Minimap.tsx
```

## Purpose
- Provides visual overview of canvas (placeholder implementation)
- Allows undocking from sidebar to floating window
- Future: Enable quick navigation to different canvas areas
- Future: Display viewport bounds on minimap

## Dependencies
- **UI Components**: `Button` (shadcn/ui)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onUndock | `() => void` | No | - | Callback when undock button is clicked |

## Visual Layout

```
┌──────────────────┐
│ Minimap          │
├──────────────────┤
│ ┌──────────────┐ │
│ │              │ │ ← Placeholder canvas preview
│ │  (dashed)    │ │
│ └──────────────┘ │
│                  │
│   [Undock]       │
└──────────────────┘
```

## Component Implementation

### Structure
```typescript
<div role="group" aria-label="Minimap">
  <div className="text-xs font-medium">Minimap</div>
  <div className="w-32 h-20 bg-slate-100 border-dashed" /> {/* Placeholder */}
  <Button variant="ghost" onClick={onUndock}>Undock</Button>
</div>
```

## Behavior

### Current Implementation (Placeholder)
- **Title**: "Minimap" label
- **Preview**: Dashed border placeholder (`w-32 h-20`)
- **Undock Button**: Calls `onUndock()` callback when clicked

### Future Implementation
Planned features:
- **Canvas Thumbnail**: Scaled-down view of entire canvas
- **Viewport Indicator**: Highlighted rectangle showing current view
- **Click Navigation**: Click on minimap to jump to that canvas area
- **Pan Indicator**: Drag viewport rectangle to pan canvas
- **Floating Mode**: Undock to separate draggable window

### Undock Functionality
When undock button is clicked:
1. Fires `onUndock()` callback
2. Parent component handles undocking logic
3. Minimap may be rendered in floating container

## Styling

### Container
- **Background**: `bg-white`
- **Border**: `border border-slate-200`
- **Rounded**: `rounded-lg`
- **Shadow**: `shadow-sm`
- **Padding**: `p-2`
- **Layout**: `flex flex-col gap-2`

### Title
- **Text**: `text-xs font-medium text-slate-600`

### Placeholder Area
- **Width**: `w-32` (128px)
- **Height**: `h-20` (80px)
- **Background**: `bg-slate-100`
- **Border**: `border-dashed border-slate-300`
- **Rounded**: `rounded`

### Undock Button
- **Variant**: `ghost`
- **Size**: `sm`
- **Height**: `h-7`

## Usage Examples

### Basic Usage (No Undock)
```tsx
<Minimap />
```

### With Undock Handler
```tsx
const [minimapDocked, setMinimapDocked] = useState(true);

<Minimap
  onUndock={() => {
    setMinimapDocked(false);
    // Open minimap in floating window
  }}
/>
```

### Integration with Sidebar
```tsx
<RightSidebar>
  {/* Other sidebar content */}
  <Minimap onUndock={handleMinimapUndock} />
</RightSidebar>
```

### Floating Minimap (Post-Undock)
```tsx
{!minimapDocked && (
  <FloatingWindow title="Minimap">
    <Minimap onUndock={undefined} /> {/* No undock when floating */}
  </FloatingWindow>
)}
```

## Accessibility

### ARIA Attributes
- **Role**: `group`
- **Label**: `aria-label="Minimap"`
- **Test ID**: `data-testid="minimap"`

### Keyboard Navigation
- **Tab**: Focus on undock button
- **Enter/Space**: Activate undock

### Screen Reader Support
- Group announced as "Minimap"
- Button labeled "Undock"

## Related Elements

### Components
- [RightSidebar](../layout/RightSidebar.md) - Contains minimap
- [CanvasPropertiesInspector](../inspector/CanvasPropertiesInspector.md) - Alternative canvas view controls

### Future Dependencies
- [viewportStore](../../02-stores/viewportStore.md) - Viewport bounds for indicator
- [Canvas](./Canvas.md) - Canvas content to render in thumbnail

## Testing

**Test ID**: `minimap`

### Test Coverage
```typescript
describe('Minimap', () => {
  it('renders minimap title');
  it('displays placeholder canvas area');
  it('renders undock button');
  it('calls onUndock when button clicked');
  it('applies correct ARIA attributes');
});
```

### Test IDs
- Container: `minimap`
- Button: `minimap-undock`

### Key Test Scenarios
1. **Rendering**: Title and placeholder rendered
2. **Undock Callback**: `onUndock()` called on button click
3. **Aria**: Proper group and label attributes
4. **Optional Callback**: Works without `onUndock` prop

## Future Enhancements

### Canvas Thumbnail Rendering
```typescript
const canvasRef = useCanvasStore(state => state.canvasRef);
const entities = useCanvasStore(state => state.entities);

// Render scaled canvas thumbnail
<MinimapCanvas ref={canvasRef} entities={entities} scale={0.1} />
```

### Viewport Indicator
```typescript
const viewport = useViewportStore();

<div className="minimap-viewport-indicator"
     style={{
       left: `${viewport.x * scale}px`,
       top: `${viewport.y * scale}px`,
       width: `${viewport.width * scale}px`,
       height: `${viewport.height * scale}px`,
     }}
/>
```

### Click Navigation
```typescript
const handleMinimapClick = (e: React.MouseEvent) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;
  panToPosition(x, y);
};
```
