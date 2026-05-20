# BottomToolbar

## Overview
Simple bottom toolbar containing canvas settings, currently housing the GridSettings component.

## Location
```
hvac-design-app/src/features/canvas/components/BottomToolbar.tsx
```

## Purpose
- Provides container for bottom-aligned canvas controls
- Currently displays grid settings
- Designed for future expansion with additional canvas settings
- Provides consistent layout for canvas-level controls

## Dependencies
- **Components**: `GridSettings`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| className | `string` | No | `''` | Additional CSS classes for container |

## Visual Layout

```
┌──────────────────────────────────────────┐
│ Canvas Settings                          │
│ Grid Settings: [...controls...]          │
└──────────────────────────────────────────┘
```

## Component Implementation

### Structure
```typescript
<div className={`bottom-toolbar ${className}`}>
  <div className="bottom-toolbar-section">
    <span className="bottom-toolbar-title">Canvas Settings</span>
    <GridSettings />
  </div>
</div>
```

## Behavior

### Current Functionality
- Renders "Canvas Settings" section title
- Contains `GridSettings` component
- Accepts additional className for styling

### Future Expansion
The toolbar is designed as a container for multiple setting groups:
- Grid settings (current)
- Snap settings (potential)
- Display options (potential)
- Canvas preferences (potential)

## Styling

### Classes
- **Container**: `bottom-toolbar` + custom `className`
- **Section**: `bottom-toolbar-section`
- **Title**: `bottom-toolbar-title`

### Expected Positioning
Typically positioned at bottom of canvas area:
```css
.bottom-toolbar {
  position: absolute;
  bottom: 0;
  width: 100%;
}
```

## Usage Examples

### Basic Usage
```tsx
<BottomToolbar />
```

### With Custom Class
```tsx
<BottomToolbar className="canvas-bottom-bar" />
```

### Integration with Canvas Layout
```tsx
<div className="canvas-container">
  <Canvas />
  <BottomToolbar className="absolute bottom-0 left-0 right-0" />
</div>
```

## Accessibility

### Semantic HTML
- Section title provides context for settings group
- Controls delegated to child components

### Test Attributes
- **Test ID**: `bottom-toolbar`

## Related Elements

### Components
- [GridSettings](./GridSettings.md) - Grid configuration controls
- [AppShell](../layout/AppShell.md) - May contain BottomToolbar
- [CanvasPropertiesInspector](../inspector/CanvasPropertiesInspector.md) - Alternative canvas settings location

### Stores
- Controls within use various canvas stores (via child components)

## Testing

**Test ID**: `bottom-toolbar`

### Test Coverage
```typescript
describe('BottomToolbar', () => {
  it('renders with default className');
  it('accepts custom className prop');
  it('displays "Canvas Settings" title');
  it('renders GridSettings component');
});
```

### Key Test Scenarios
1. **Rendering**: Component renders with correct structure
2. **Class Merging**: Custom className properly combined
3. **Child Component**: GridSettings is rendered
