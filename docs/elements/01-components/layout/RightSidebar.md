# RightSidebar

## Overview
Properties panel sidebar with tabbed interface (Properties, Calculations, BOM, Notes) for inspecting and editing canvas entities.

## Location
```
src/components/layout/RightSidebar.tsx
```

## Purpose
- Displays selected entity properties (position, dimensions)
- Shows bill of materials (BOM) for all canvas entities
- Provides calculation panel (placeholder)
- Offers project notes textarea
- Manages collapsible sidebar state
- Implements keyboard shortcuts for toggle and tab switching

## Dependencies
- **UI Components**: `Button` (shadcn/ui)
- **Icons**: `ChevronRight`, `ChevronLeft`, `Settings`, `List`, `FileText`, `Calculator`, `Info` (lucide-react)
- **Stores**: `useLayoutStore`, `useSelectionStore`, `useEntityStore`
- **Utils**: `cn` (conditional classNames)

## Props
None (self-contained)

## Visual Layout

### Expanded State (320px width)
```
┌────────────────────────┐
│ [Props][Calc][BOM][Notes] │ ← Tabs
├────────────────────────┤
│ ⚙ AHU - York MCA      │
│   Equipment            │
│                        │
│ Width: 48.0"          │
│ X Position: 120       │
│ Y Position: 240       │
└────────────────────────┘
```

### Collapsed State (48px width)
```
┌──┐
│< │
├──┤
│ ⚙│ ← Properties tab icon
│ 📊│ ← Calculations tab icon
│ 📋│ ← BOM tab icon
│ 📄│ ← Notes tab icon
└──┘
```

## Component Implementation

### Tabs
| Tab ID | Label | Icon | Shortcut | Status |
|--------|-------|------|----------|--------|
| `properties` | Props | `Settings` | `Ctrl+P` | ✅ Implemented |
| `calculations` | Calc | `Calculator` | - | ⚠️ Placeholder |
| `bom` | BOM | `List` | `Ctrl+M` | ✅ Implemented |
| `notes` | Notes | `FileText` | - | ✅ Basic textarea |

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+B` | Toggle sidebar collapse/expand |
| `Ctrl+P` | Open properties tab (auto-expand if collapsed) |
| `Ctrl+M` | Open BOM tab (auto-expand if collapsed) |

## Behavior

### Properties Tab
- Shows selected entity details:
  - Entity type (Room, Equipment, Duct, etc.)
  - Name/label
  - Position (X, Y)
  - Dimensions (for rooms: width, length in feet)
- If no selection: Shows "No Selection" placeholder
- Uses `getEntityDisplayName()` helper to extract entity name

### BOM (Bill of Materials) Tab
- Lists all entities on canvas
- Shows entity name and type badge
- Displays total item count
- If no entities: Shows "No items in BOM" placeholder

### Calculations Tab
- Placeholder: "Select entities to view calculations"
- Future: Load calculations, CFM, pressure drop, etc.

### Notes Tab
- Simple textarea for project notes
- Placeholder: "Add project notes here..."
- 160px height (`h-40`)
- **Note**: Notes are not persisted (local state only)

### Collapse/Expand
```typescript
toggleRightSidebar()  // From LayoutStore
```
- Collapsed: 48px wide, icon-only tabs
- Expanded: 320px wide, full content
- Transition: 200ms smooth animation

### Tab Selection
- Clicking tab updates `activeRightTab` in `LayoutStore`
- When collapsed: Clicking tab expands sidebar AND switches tab
- Active tab: White background with shadow

## State Management

### LayoutStore
```typescript
{
  rightSidebarCollapsed: boolean;
  toggleRightSidebar: () => void;
  activeRightTab: 'properties' | 'calculations' | 'bom' | 'notes';
  setActiveRightTab: (tab: string) => void;
}
```

### SelectionStore
```typescript
{
  selectedIds: string[];  // Array of selected entity IDs
}
```

### EntityStore
```typescript
{
  byId: Record<string, Entity>;  // All canvas entities
}
```

## Styling

### Expanded Sidebar
```
w-80 bg-white border-l border-slate-200
transition-all duration-200
```

### Collapsed Sidebar
```
w-12 bg-white border-l border-slate-200
transition-all duration-200 collapsed
```

### Property Rows
```
flex items-center justify-between
py-2 border-b border-slate-100 last:border-0
```
- Label: `text-slate-500`
- Value: `font-mono text-slate-800`

## Usage Examples

### Basic Usage (AppShell)
```typescript
import { RightSidebar } from '@/components/layout/RightSidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex overflow-hidden">
      <LeftSidebar />
      <main className="flex-1">{children}</main>
      <RightSidebar />
    </div>
  );
}
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate through tabs and interactive elements
- **Enter/Space**: Activate focused tab
- **Ctrl+Shift+B**: Toggle sidebar
- **Ctrl+P**: Open properties tab
- **Ctrl+M**: Open BOM tab

### ARIA Attributes
- `role="tab"` on tab buttons
- `aria-selected={isActive}` on tabs
- `aria-label="Expand/Collapse sidebar"` on toggle button

### Screen Reader Support
- Tab labels announced
- Entity names and properties announced
- No selection state announced

### Test IDs
- `data-testid="right-sidebar"` - Sidebar container
- `data-testid="right-sidebar-toggle"` - Toggle button
- `data-testid="tab-properties"` - Properties tab
- `data-testid="tab-calculations"` - Calculations tab
- `data-testid="tab-bom"` - BOM tab
- `data-testid="tab-notes"` - Notes tab
- `data-testid="properties-panel"` - Properties content
- `data-testid="calculations-panel"` - Calculations content
- `data-testid="bom-panel"` - BOM content
- `data-testid="notes-panel"` - Notes content

## Known Limitations

1. **Limited Entity Properties**: Only shows basic position/dimensions
2. **Calculations Not Implemented**: Placeholder only
3. **Notes Not Persisted**: Textarea content not saved
4. **No Property Editing**: Properties are read-only

### Future Improvements
- Add editable property fields (name, dimensions, CFM, etc.)
- Implement load calculations panel
- Persist notes to project file
- Add property validation and real-time updates
- Support multi-selection property editing

## Related Elements
- **Parent**: [`AppShell`](./AppShell.md)
- **Stores**: `LayoutStore`, `SelectionStore`, `EntityStore`

## Testing
**E2E Coverage**:
- ✅ Sidebar collapse/expand (Ctrl+Shift+B)
- ✅ Tab switching (Ctrl+P, Ctrl+M)
- ✅ Properties display for selected entity
- ✅ BOM list with entity count
- ⚠️ Calculations (placeholder)
- ⚠️ Notes persistence (not implemented)
