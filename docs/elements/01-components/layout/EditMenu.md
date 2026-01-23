# EditMenu

## Overview
Dropdown menu providing standard editing operations including undo, redo, cut, copy, paste, and select all.

## Location
```
src/components/layout/EditMenu.tsx
```

## Purpose
- Provides undo/redo functionality via `document.execCommand`
- Offers cut, copy, paste operations
- Implements select all action
- Displays keyboard shortcut hints
- Handles outside-click detection to close menu

## Dependencies
- **UI Components**: `Button` (shadcn/ui)
- **Icons**: `Pencil` (lucide-react - not currently used in render)

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
| Action | Shortcut | Implementation Status |
|--------|----------|----------------------|
| Undo | `Ctrl+Z` | Partial (uses `document.execCommand`) |
| Redo | `Ctrl+Shift+Z` | Partial (uses `document.execCommand`) |
| Cut | `Ctrl+X` | Placeholder (closes menu only) |
| Copy | `Ctrl+C` | Placeholder (closes menu only) |
| Paste | `Ctrl+V` | Placeholder (closes menu only) |
| Select All | `Ctrl+A` | Placeholder (closes menu only) |

## Behavior

### Undo/Redo
```typescript
onClick={() => { document.execCommand('undo'); setIsOpen(false); }}
onClick={() => { document.execCommand('redo'); setIsOpen(false); }}
```
- Uses deprecated `document.execCommand` API
- Works for text inputs/contenteditable elements
- **Note**: Does not undo/redo canvas operations (requires custom implementation)

### Clipboard Operations
- Cut, Copy, Paste: Currently close menu only (no implementation)
- Future: Should integrate with canvas selection state

### Select All
- Currently closes menu only (no implementation)
- Future: Should select all canvas entities

### Outside Click Detection
- Uses `useEffect` with `mousedown` event listener
- Closes menu when clicking outside `menuRef`

## State Management
No external store dependencies (local state only)

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
- Separators: `h-px bg-slate-200`

## Usage Examples

### Basic Usage (Header)
```typescript
import { EditMenu } from '@/components/layout/EditMenu';

export function Header() {
  return (
    <nav className="flex items-center gap-0.5">
      <FileMenu />
      <EditMenu />
      <ViewMenu />
    </nav>
  );
}
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate through menu items
- **Enter/Space**: Activate focused item
- **Escape**: Close menu (browser default)

### Screen Reader Support
- Menu items are standard `<button>` elements
- Shortcuts visible on screen
- Clear action labels

### Test IDs
- `data-testid="menu-undo"` - Undo menu item
- `data-testid="menu-redo"` - Redo menu item

## Known Limitations

1. **`document.execCommand` Deprecated**: Uses legacy API
2. **No Canvas Integration**: Does not undo/redo canvas operations
3. **Clipboard Ops Not Implemented**: Cut/Copy/Paste are placeholders
4. **No Disabled States**: Undo/Redo always enabled (should check history state)

### Future Improvements
- Integrate with canvas command history stack
- Implement cut/copy/paste for canvas entities
- Add disabled states when no undo/redo available
- Replace `document.execCommand` with canvas-specific logic

## Related Elements
- **Parent**: [`Header`](./Header.md)
- **Future Store**: Command history/undo stack

## Testing
**E2E Coverage**:
- ✅ Edit menu opens/closes
- ⚠️ Undo/Redo (limited to DOM elements)
- ❌ Canvas undo/redo (not implemented)
- ❌ Cut/Copy/Paste (not implemented)
