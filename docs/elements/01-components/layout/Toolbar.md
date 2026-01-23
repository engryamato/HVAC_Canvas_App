# Toolbar

## Overview
Clean tool selection bar providing access to canvas drawing tools (Select, Room, Duct, Equipment, Fitting, Note) with keyboard shortcuts and undo/redo functionality.

## Location
```
src/components/layout/Toolbar.tsx
```

## Purpose
- Displays 6 core canvas tools with visual selection state
- Implements keyboard shortcuts for tool switching
- Shows conditional type selectors (Equipment, Fitting)
- Provides undo/redo buttons (currently disabled)
- Toggles grid visibility via keyboard shortcut
- Uses segmented control design pattern

## Dependencies
- **UI Components**: `Button` (shadcn/ui)
- **Icons**: `MousePointer2`, `Square`, `Move`, `Box`, `Circle`, `StickyNote`, `Undo`, `Redo` (lucide-react)
- **Stores**: `useToolStore` (canvas.store), `useViewportStore`
- **Utils**: `cn` (conditional classNames)
- **Conditional Components**: `EquipmentTypeSelector`, `FittingTypeSelector`

## Props
None (self-contained)

## Component Implementation

### Tools Configuration
```typescript
const tools = [
  { id: 'select', label: 'Select', icon: MousePointer2, shortcut: 'V' },
  { id: 'room', label: 'Room', icon: Square, shortcut: 'R' },
  { id: 'duct', label: 'Duct', icon: Move, shortcut: 'D' },
  { id: 'equipment', label: 'Equipment', icon: Box, shortcut: 'E' },
  { id: 'fitting', label: 'Fitting', icon: Circle, shortcut: 'F' },
  { id: 'note', label: 'Note', icon: StickyNote, shortcut: 'N' },
] as const;
```

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `V` | Select tool |
| `R` | Room tool |
| `D` | Duct tool |
| `E` | Equipment tool |
| `F` | Fitting tool |
| `N` | Note tool |
| `Escape` | Switch to Select tool |
| `Ctrl+G` | Toggle grid visibility |

## Behavior

### Tool Selection
```typescript
onClick={() => setActiveTool(tool.id)}
```
- Updates `currentTool` in canvas store
- Visual feedback: Active tool has white background + shadow
- Inactive tools: Light gray text, hover state

### Keyboard Shortcuts
- Listens for keydown events on `window`
- Ignores shortcuts when input/textarea is focused
- Prevents default browser behavior

### Conditional Type Selectors
```typescript
{activeTool === 'equipment' && <EquipmentTypeSelector />}
{activeTool === 'fitting' && <FittingTypeSelector />}
```
- Shown inline after tool buttons
- Allows sub-type selection (e.g., AHU, Fan, Boiler)

### Undo/Redo Buttons
- Currently disabled (no undo/redo implementation)
- Tooltips show shortcuts: `Ctrl+Z`, `Ctrl+Shift+Z`
- Positioned on right side of toolbar

## State Management

### Tool Store
```typescript
{
  currentTool: 'select' | 'room' | 'duct' | 'equipment' | 'fitting' | 'note';
  setTool: (tool: string) => void;
}
```

### Viewport Store
```typescript
{
  toggleGrid: () => void;
}
```

## Styling

### Toolbar Container
```
h-11 bg-white border-b border-slate-200
flex items-center px-4 gap-3
```

### Tool Button Group
```
flex gap-0.5 bg-slate-100 p-1 rounded-lg
```
- Segmented control design
- Active button: `bg-white shadow-sm`
- Inactive button: `text-slate-600 hover:bg-white/50`

### Tool Labels
- Hidden on `<lg` screens (`hidden lg:inline`)
- Icon always visible

## Usage Examples

### Basic Usage (AppShell)
```typescript
import { Toolbar } from '@/components/layout/Toolbar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <Toolbar />
      <main>{children}</main>
    </div>
  );
}
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate through tool buttons
- **Enter/Space**: Activate focused tool
- **Single-key shortcuts**: Direct tool activation

### ARIA Attributes
- `role="toolbar"` on tool group
- `aria-label="Drawing tools"`
- `aria-pressed={isActive}` on tool buttons
- `aria-label` on each button

### Screen Reader Support
- Button labels announced ("Select", "Room", etc.)
- Shortcuts shown in tooltips (`title` attribute)
- Active state announced via `aria-pressed`

### Test IDs
- `data-testid="toolbar"` - Toolbar container
- `data-testid="tool-select"` - Select tool button
- `data-testid="tool-room"` - Room tool button
- `data-testid="tool-duct"` - Duct tool button
- `data-testid="tool-equipment"` - Equipment tool button
- `data-testid="tool-fitting"` - Fitting tool button
- `data-testid="tool-note"` - Note tool button
- `data-testid="undo-button"` - Undo button
- `data-testid="redo-button"` - Redo button

## Related Elements
- **Parent**: [`AppShell`](./AppShell.md)
- **Canvas Components**: `EquipmentTypeSelector`, `FittingTypeSelector`
- **Stores**: `canvas.store` (tool state), `useViewportStore` (grid toggle)

## Testing
**E2E Coverage**:
- ✅ Toolbar renders with all 6 tools
- ✅ Tool selection updates active state
- ✅ Keyboard shortcuts activate tools
- ✅ Equipment selector shows when Equipment tool active
- ✅ Fitting selector shows when Fitting tool active
- ✅ Undo/Redo buttons disabled
