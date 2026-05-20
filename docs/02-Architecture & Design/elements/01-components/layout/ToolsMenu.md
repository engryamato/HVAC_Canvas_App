# ToolsMenu

## Overview
Dropdown menu providing quick access to canvas drawing tools as an alternative to the toolbar buttons.

## Location
```
src/components/layout/ToolsMenu.tsx
```

## Purpose
- Provides menu-based access to all canvas tools
- Displays keyboard shortcut hints for each tool
- Integrates with canvas tool store
- Alternative to toolbar button selection
- Handles outside-click detection to close menu

## Dependencies
- **UI Components**: `Button` (shadcn/ui)
- **Stores**: `useToolStore` (canvas.store)

## Props
None (self-contained)

## Component Implementation

### State (Local)
```typescript
{
  isOpen: boolean;  // Menu dropdown visibility
}
```

### Menu Items
| Tool | Shortcut | Tool ID |
|------|----------|---------|
| Select Tool | `V` | `'select'` |
| Line Tool | `L` | `'line'` |
| Duct Tool | `D` | `'duct'` |
| Equipment Tool | `E` | `'equipment'` |
| Fitting Tool | `F` | `'fitting'` |
| Note Tool | `N` | `'note'` |

## Behavior

### Tool Selection
```typescript
const selectTool = (tool: string) => {
  setTool(tool);    // Update tool store
  setIsOpen(false); // Close menu
};
```
- Updates `currentTool` in canvas store
- Closes menu after selection
- Same effect as clicking toolbar button

### Outside Click Detection
- Uses `useEffect` with `mousedown` event listener
- Closes menu when clicking outside `menuRef`

## State Management

### Tool Store
```typescript
{
  setTool: (tool: string) => void;
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
py-1 min-w-[180px] z-50
```

### Menu Items
- Hover: `bg-slate-100`
- Shortcuts: Right-aligned, small, muted

## Usage Examples

### Basic Usage (Header)
```typescript
import { ToolsMenu } from '@/components/layout/ToolsMenu';

export function Header() {
  return (
    <nav className="flex items-center gap-0.5">
      <FileMenu />
      <EditMenu />
      <ViewMenu />
      <ToolsMenu />
      <HelpMenu />
    </nav>
  );
}
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate through menu items
- **Enter/Space**: Activate focused item
- **Escape**: Close menu

### Screen Reader Support
- Clear tool names ("Select Tool", "Duct Tool")
- Shortcuts visible on screen

### Duplicate Access
- Users can access tools via:
  1. **Toolbar buttons** (visual selection)
  2. **Tools menu** (dropdown)
  3. **Keyboard shortcuts** (V, R, D, E, F, N)

## Related Elements
- **Parent**: [`Header`](./Header.md)
- **Alternative**: [`Toolbar`](./Toolbar.md) (button-based tool selection)
- **Stores**: `canvas.store` (tool state)

## Testing
**E2E Coverage**:
- ✅ Tools menu opens/closes
- ✅ Tool selection updates store
- ✅ Menu closes after selection
- ✅ Tool shortcuts displayed

## Notes

### Line Tool
- Appears in menu but not in toolbar
- Possible inconsistency or deprecated tool
- Future: Verify if Line tool should be added to toolbar
