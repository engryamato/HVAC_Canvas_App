# KeyboardShortcutsDialog

## Overview
Reference dialog displaying all keyboard shortcuts organized by category (Navigation, Panels, Tools, Edit, View, General).

## Location
```
src/components/dialogs/KeyboardShortcutsDialog.tsx
```

## Purpose
- Provides comprehensive keyboard shortcut reference
- Organizes shortcuts into 6 logical categories
- Displays shortcuts in a clean 2-column grid layout
- Accessible via `Ctrl+/` global shortcut
- Helps users discover and learn keyboard shortcuts

## Dependencies
- **UI Primitives**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` (shadcn/ui)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| open | `boolean` | Yes | - | Dialog visibility state |
| onOpenChange | `(open: boolean) => void` | Yes | - | Callback when dialog open state changes |

## Visual Layout

```
┌──────────────────────────────────────────┐
│  Keyboard Shortcuts                      │
├──────────────────────────────────────────┤
│  Navigation           │  Panels          │
│  Go to Dashboard      │  Toggle Left...  │
│    Ctrl+Shift+D       │    Ctrl+B        │
│  ...                  │  ...             │
│                       │                  │
│  Tools                │  Edit            │
│  Select Tool   V      │  Undo  Ctrl+Z    │
│  ...                  │  ...             │
│                       │                  │
│  View                 │  General         │
│  Toggle Grid Ctrl+G   │  Show Shortcuts  │
│  ...                  │    Ctrl+/        │
├──────────────────────────────────────────┤
│  Press Esc to close                      │
└──────────────────────────────────────────┘
```

## Component Implementation

### Shortcut Categories (Static Data)
```typescript
const shortcuts = [
  { category: 'Navigation', items: [...] },   // 5 shortcuts
  { category: 'Panels', items: [...] },       // 4 shortcuts
  { category: 'Tools', items: [...] },        // 6 shortcuts
  { category: 'Edit', items: [...] },         // 5 shortcuts
  { category: 'View', items: [...] },         // 4 shortcuts
  { category: 'General', items: [...] },      // 2 shortcuts
];
```

### Shortcut Structure
```typescript
{
  keys: string;         // e.g., "Ctrl+Shift+D"
  description: string;  // e.g., "Go to Dashboard"
}
```

## Shortcuts Reference

### Navigation (5)
- `Ctrl+Shift+D` - Go to Dashboard
- `Alt+1` - Focus Left Sidebar
- `Alt+2` - Focus Canvas
- `Alt+3` - Focus Right Sidebar
- `Alt+4` - Focus Toolbar

### Panels (4)
- `Ctrl+B` - Toggle Left Sidebar
- `Ctrl+Shift+B` - Toggle Right Sidebar
- `Ctrl+P` - Properties Panel
- `Ctrl+M` - BOM Panel

### Tools (6)
- `V` - Select Tool
- `L` - Line Tool
- `D` - Duct Tool
- `E` - Equipment Tool
- `F` - Fitting Tool
- `N` - Note Tool

### Edit (5)
- `Ctrl+Z` - Undo
- `Ctrl+Shift+Z` - Redo
- `Ctrl+C` - Copy
- `Ctrl+V` - Paste
- `Delete` - Delete Selected

### View (4)
- `Ctrl+G` - Toggle Grid
- `Ctrl++` - Zoom In
- `Ctrl+-` - Zoom Out
- `Ctrl+0` - Zoom to 100%

### General (2)
- `Ctrl+/` - Show Keyboard Shortcuts
- `Escape` - Close Dialog / Cancel

## Behavior

### Opening the Dialog
- Triggered via `Ctrl+/` global shortcut (in Header component)
- Triggered via Help → Keyboard Shortcuts menu item
- Controlled via `open` prop

### Closing the Dialog
- Click outside dialog (overlay click)
- Press `Escape` key
- Calls `onOpenChange(false)`

### Scrolling
- Max height: 80% of viewport (`max-h-[80vh]`)
- Vertical scroll if content overflows
- Clean scrollbar styling

## State Management
No internal state (fully controlled by parent via props)

## Styling

### Dialog Content
```
max-w-2xl max-h-[80vh] overflow-y-auto
```

### Grid Layout
```
grid grid-cols-2 gap-6
```
- 2-column layout
- 6-unit gap between columns

### Shortcut Row
```
flex items-center justify-between text-sm
```
- Description: `text-slate-600` (left-aligned)
- Keybinding: `kbd` element with monospace font (right-aligned)

### Keybinding Badge
```
px-2 py-0.5 bg-slate-100 rounded text-xs font-mono
```

## Usage Examples

### Basic Usage (Header Integration)
```typescript
import { KeyboardShortcutsDialog } from '@/components/dialogs/KeyboardShortcutsDialog';

export function Header() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <>
      <Header />
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </>
  );
}
```

### With Help Menu
```typescript
<HelpMenu onShowShortcuts={() => setShortcutsOpen(true)} />

<KeyboardShortcutsDialog
  open={shortcutsOpen}
  onOpenChange={setShortcutsOpen}
/>
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate through dialog (focus trap)
- **Escape**: Close dialog
- **Ctrl+/**: Open dialog (global shortcut)

### ARIA Attributes
- Dialog has `role="dialog"` (from shadcn/ui)
- Title announced via `DialogTitle`
- Focus trap prevents tabbing outside dialog

### Screen Reader Support
- Category headings announced
- Shortcut descriptions and keys announced
- Clear close instruction: "Press Esc to close"

### Test IDs
- `data-testid="keyboard-shortcuts-dialog"` - Dialog container

## Related Elements
- **Trigger**: [`Header`](../layout/Header.md) (`Ctrl+/` shortcut)
- **Trigger**: [`HelpMenu`](../layout/HelpMenu.md) (menu item)
- **UI Primitives**: `Dialog`

## Testing
**E2E Coverage**:
- ✅ Dialog opens via `Ctrl+/` shortcut
- ✅ Dialog opens via Help menu
- ✅ Dialog displays all 6 categories with shortcuts
- ✅ Dialog closes with Escape key
- ✅ Dialog closes on overlay click
- ✅ Scrollable content when overflow

## Notes

### Shortcut Accuracy
- All listed shortcuts are documented (implementation may vary)
- Some shortcuts may not be fully implemented (e.g., Alt+1-4 focus shortcuts, Ctrl++ zoom in)
- Dialog serves as canonical reference for expected behavior

### Future Improvements
- Add search/filter for shortcuts
- Group shortcuts by platform (Mac vs Windows/Linux)
- Highlight recently used shortcuts
- Add link to full documentation
- Make shortcuts data-driven (load from config)
