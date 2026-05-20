# HelpMenu

## Overview
Dropdown menu providing access to help resources including keyboard shortcuts, documentation, issue reporting, and about information.

## Location
```
src/components/layout/HelpMenu.tsx
```

## Purpose
- Opens keyboard shortcuts dialog
- Links to documentation (placeholder)
- Provides issue reporting access (placeholder)
- Shows "About HVAC Canvas" information (placeholder)
- Displays keyboard shortcut hints
- Handles outside-click detection to close menu

## Dependencies
- **UI Components**: `Button` (shadcn/ui)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onShowShortcuts | `() => void` | No | - | Callback to open keyboard shortcuts dialog |

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
| Keyboard Shortcuts | `Ctrl+/` | ✅ Implemented (calls `onShowShortcuts` prop) |
| Documentation | - | ❌ Placeholder (closes menu only) |
| Report Issue | - | ❌ Placeholder (closes menu only) |
| About HVAC Canvas | - | ❌ Placeholder (closes menu only) |

## Behavior

### Keyboard Shortcuts
```typescript
onClick={() => {
  onShowShortcuts?.();  // Call callback prop
  setIsOpen(false);     // Close menu
}}
```
- Calls `onShowShortcuts` callback (usually opens `KeyboardShortcutsDialog`)
- Closes menu after triggering
- Shortcut hint: `Ctrl+/`

### Documentation
- Placeholder: Closes menu only
- Future: Should open documentation in new tab or modal

### Report Issue
- Placeholder: Closes menu only
- Future: Should open GitHub issues or bug report form

### About HVAC Canvas
- Placeholder: Closes menu only
- Future: Should open about dialog with version, credits, etc.

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
py-1 min-w-[200px] z-50
```

### Menu Items
- Hover: `bg-slate-100`
- Shortcuts: Right-aligned, small, muted
- Separators: `h-px bg-slate-200`

## Usage Examples

### Basic Usage (Header)
```typescript
import { HelpMenu } from '@/components/layout/HelpMenu';

export function Header() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  
  return (
    <>
      <nav className="flex items-center gap-0.5">
        <FileMenu />
        <EditMenu />
        <ViewMenu />
        <ToolsMenu />
        <HelpMenu onShowShortcuts={() => setShortcutsOpen(true)} />
      </nav>
      
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </>
  );
}
```

### Without Callback (Limited Functionality)
```typescript
<HelpMenu />
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate through menu items
- **Enter/Space**: Activate focused item
- **Escape**: Close menu

### Screen Reader Support
- Clear action labels
- Shortcuts visible on screen

## Known Limitations

1. **Documentation Not Implemented**: Placeholder only
2. **Report Issue Not Implemented**: Placeholder only
3. **About Dialog Not Implemented**: Placeholder only

### Future Improvements
- Add documentation link (external or in-app)
- Implement bug report form
- Create About dialog with version info, license, credits
- Add changelog/release notes link

## Related Elements
- **Parent**: [`Header`](./Header.md)
- **Dialogs**: `KeyboardShortcutsDialog` (via callback prop)

## Testing
**E2E Coverage**:
- ✅ Help menu opens/closes
- ✅ Keyboard shortcuts callback triggered
- ⚠️ Documentation (placeholder)
- ⚠️ Report Issue (placeholder)
- ⚠️ About (placeholder)
