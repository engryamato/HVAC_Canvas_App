# ViewMenu

## Overview
Dropdown menu providing viewport and layout controls including zoom, grid toggle, and layout reset.

## Location
```
src/components/layout/ViewMenu.tsx
```

## Purpose
- Resets zoom to 100% or fits canvas to screen
- Toggles grid visibility on/off
- Resets sidebar layout to default positions
- Displays keyboard shortcut hints
- Integrates with viewport and layout stores
- Handles outside-click detection to close menu

## Dependencies
- **UI Components**: `Button` (shadcn/ui)
- **Stores**: `useLayoutStore`, `useViewportStore`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onResetLayout | `() => void` | No | - | Optional callback when layout is reset |

## Component Implementation

### State (Local)
```typescript
{
  isOpen: boolean;  // Menu dropdown visibility
}
```

### Menu Items
| Action | Shortcut | Store Action |
|--------|----------|--------------|
| Zoom to 100% | `Ctrl+0` | `setZoom(100)` |
| Fit to Screen | `Ctrl+1` | `fitToScreen()` |
| Toggle Grid | `Ctrl+G` | `toggleGrid()` |
| Reset Layout | - | `resetLayout()` |

## Behavior

### Zoom to 100%
```typescript
onClick={() => { setZoom(100); setIsOpen(false); }}
```
- Resets viewport zoom to 100%
- Updates `ViewportStore.zoom`

### Fit to Screen
```typescript
onClick={() => { fitToScreen(); setIsOpen(false); }}
```
- Calculates zoom level to fit all canvas content
- Updates viewport transform and zoom

### Toggle Grid
```typescript
onClick={() => { toggleGrid(); setIsOpen(false); }}
```
- Toggles `gridVisible` state in `ViewportStore`
- Shows checkmark (✓) when grid is visible
- Visual indicator: `{gridVisible ? '✓ ' : ''}`

### Reset Layout
```typescript
const handleResetLayout = () => {
  resetLayout();        // Reset sidebar positions/states
  onResetLayout?.();    // Optional callback
  setIsOpen(false);     // Close menu
};
```
- Resets sidebars to default positions (expanded/collapsed)
- Calls optional callback prop

### Outside Click Detection
- Uses `useEffect` with `mousedown` event listener
- Closes menu when clicking outside `menuRef`

## State Management

### LayoutStore
```typescript
{
  resetLayout: () => void;  // Reset sidebar states
}
```

### ViewportStore
```typescript
{
  toggleGrid: () => void;
  gridVisible: boolean;
  setZoom: (zoom: number) => void;
  fitToScreen: () => void;
}
```

## Styling

### Menu Button
```
variant="ghost" size="sm"
h-8 px-3
```

### Dropdown Menu
```
absolute top-full left-0 mt-1
bg-white border rounded-md shadow-lg
py-1 min-w-[200px] z-50
```

### Menu Items
- Hover: `bg-slate-100`
- Shortcuts: Right-aligned, small, muted
- Grid checkmark: Visible when `gridVisible===true`

## Usage Examples

### Basic Usage (Header)
```typescript
import { ViewMenu } from '@/components/layout/ViewMenu';

export function Header() {
  return (
    <nav className="flex items-center gap-0.5">
      <FileMenu />
      <EditMenu />
      <ViewMenu onResetLayout={() => console.log('Layout reset')} />
    </nav>
  );
}
```

### Without Callback
```typescript
<ViewMenu />
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate through menu items
- **Enter/Space**: Activate focused item
- **Escape**: Close menu

### Screen Reader Support
- Clear action labels
- Grid state announced via checkmark
- Shortcuts visible on screen

### Test IDs
- `data-testid="menu-reset-layout"` - Reset layout button

## Related Elements
- **Parent**: [`Header`](./Header.md)
- **Stores**: `LayoutStore`, `ViewportStore`

## Testing
**E2E Coverage**:
- ✅ View menu opens/closes
- ✅ Zoom to 100%
- ✅ Fit to screen
- ✅ Toggle grid (checkmark updates)
- ✅ Reset layout
