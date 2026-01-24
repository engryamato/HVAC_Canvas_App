# LeftSidebar

## Overview
Equipment library sidebar with tabbed interface (Equipment, Layers, Recent), search functionality, and drag-and-drop equipment items.

## Location
```
src/components/layout/LeftSidebar.tsx
```

## Purpose
- Provides equipment library browser with categories
- Offers search/filter for equipment items
- Supports drag-and-drop to canvas
- Manages collapsible sidebar state
- Displays placeholder tabs for Layers and Recent
- Implements keyboard shortcut (`Ctrl+B`) for toggle

## Dependencies
- **UI Components**: `Button`, `Input` (shadcn/ui)
- **Icons**: `ChevronLeft`, `Search`, `Box`, `Layers`, `Clock`, `ChevronDown`, `ChevronRight`, `GripVertical` (lucide-react)
- **Stores**: `useLayoutStore`
- **Utils**: `cn` (conditional classNames)

## Props
None (self-contained)

## Visual Layout

### Expanded State (288px width)
```
┌────────────────────────┐
│ Library        [<]     │ ← Header
├────────────────────────┤
│ [Equip][Layer][Recent] │ ← Tabs
├────────────────────────┤
│ [Search equipment...]  │ ← Search
├────────────────────────┤
│ ▼ Air Handling Units 3 │
│   ┬ AHU - York MCA     │
│   ┬ AHU - Trane        │
│   ┬ AHU - Carrier      │
│ ▶ VAV Boxes          2 │
│ ▶ Fans               2 │
└────────────────────────┘
```

### Collapsed State (48px width)
```
┌──┐
│ >│
├──┤
│ ⚙│ ← Equipment tab icon
│ ⚟│ ← Layers tab icon
│ 🕐│ ← Recent tab icon
└──┘
```

## Component Implementation

### State (Local)
```typescript
{
  searchQuery: string;                        // Equipment search input
  expandedCategories: Record<string, boolean>;  // Category expand/collapse state
}
```

### Tabs
| Tab ID | Label | Icon | Status |
|--------|-------|------|--------|
| `equipment` | Equipment | `Box` | ✅ Implemented |
| `layers` | Layers | `Layers` | ⚠️ Placeholder ("Coming soon") |
| `recent` | Recent | `Clock` | ⚠️ Placeholder ("No recent items") |

### Equipment Categories (Hardcoded Data)
1. **Air Handling Units** (3 items)
2. **VAV Boxes** (2 items)
3. **Fans** (2 items)
4. **Ductwork** (3 items)

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Toggle sidebar collapse/expand |

## Behavior

### Collapse/Expand
```typescript
toggleLeftSidebar()  // From LayoutStore
```
- Collapsed: 48px wide, icon-only tabs
- Expanded: 288px wide, full content
- Transition: 200ms smooth animation

### Tab Selection
- Clicking tab updates `activeLeftTab` in `LayoutStore`
- When collapsed: Clicking tab expands sidebar AND switches tab
- Active tab: White background with shadow

### Equipment Search
```typescript
const filteredItems = items.filter(item =>
  item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  item.desc.toLowerCase().includes(searchQuery.toLowerCase())
);
```
- Filters equipment by name or description
- Auto-expands categories with matching items
- Hides categories with no matches

### Category Expand/Collapse
- Click category header to toggle
- Chevron icon indicates state (Down = expanded, Right = collapsed)
- Badge shows item count

### Drag-and-Drop Equipment
- Items have `draggable` attribute
- Grip icon (`GripVertical`) for visual affordance
- Hover effect: Blue border and background tint
- **Note**: Drag handlers not implemented (requires canvas integration)

## State Management

### LayoutStore
```typescript
{
  leftSidebarCollapsed: boolean;
  toggleLeftSidebar: () => void;
  activeLeftTab: 'equipment' | 'layers' | 'recent';
  setActiveLeftTab: (tab: string) => void;
}
```

## Styling

### Expanded Sidebar
```
w-72 bg-white border-r border-slate-200
transition-all duration-200
```

### Collapsed Sidebar
```
w-12 bg-white border-r border-slate-200
transition-all duration-200 collapsed
```

### Equipment Item Cards
```
bg-white border border-slate-200 rounded-lg
hover:border-blue-300 hover:bg-blue-50/50
cursor-grab
```

### Category Badges
```
badge badge-slate text-[10px]
```

## Usage Examples

### Basic Usage (AppShell)
```typescript
import { LeftSidebar } from '@/components/layout/LeftSidebar';

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
- **Tab**: Navigate through tabs, search input, category headers
- **Enter/Space**: Activate focused element
- **Ctrl+B**: Toggle sidebar

### ARIA Attributes
- `role="tab"` on tab buttons
- `aria-selected={isActive}` on tabs
- `aria-label="Expand/Collapse sidebar"` on toggle button

### Screen Reader Support
- Tab labels announced
- Category names and item counts announced
- Drag handles have visual indication

### Test IDs
- `data-testid="left-sidebar"` - Sidebar container
- `data-testid="left-sidebar-toggle"` - Toggle button
- `data-testid="tab-equipment"` - Equipment tab
- `data-testid="tab-layers"` - Layers tab
- `data-testid="tab-recent"` - Recent tab
- `data-testid="equipment-panel"` - Equipment content
- `data-testid="layers-panel"` - Layers content
- `data-testid="recent-panel"` - Recent content
- `data-testid="equipment-search"` - Search input
- `data-testid="equipment-category-tree"` - Category tree container
- `data-testid="category-{id}"` - Category container
- `data-testid="equipment-item"` - Draggable equipment item
- `data-testid="expand-icon"` - Category expand/collapse icon

## Known Limitations

1. **Hardcoded Equipment Data**: Should load from equipment library JSON
2. **No Drag Handlers**: Draggable attribute present but no event handlers
3. **Layers Tab Empty**: Placeholder only
4. **Recent Tab Empty**: Placeholder only

### Future Improvements
- Load equipment from `public/data/equipment-library/`
- Implement drag-and-drop handlers (canvas integration)
- Implement layer management panel
- Track recently used equipment

## Related Elements
- **Parent**: [`AppShell`](./AppShell.md)
- **Stores**: `LayoutStore`
- **Data**: `public/data/equipment-library/*.json` (future)

## Testing
**E2E Coverage**:
- ✅ Sidebar collapse/expand (Ctrl+B)
- ✅ Tab switching
- ✅ Equipment search
- ✅ Category expand/collapse
- ⚠️ Drag-and-drop (not implemented)
