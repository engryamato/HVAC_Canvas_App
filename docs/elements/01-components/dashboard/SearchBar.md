# SearchBar

## Overview
Search input with debouncing, sort dropdown, clear button, project count display, and optional Tauri rescan functionality.

## Location
```
hvac-design-app/src/features/dashboard/components/SearchBar.tsx
```

## Purpose
- Provides debounced search input (300ms delay)
- Displays sort options (name/date, asc/desc)
- Shows filtered vs total project count
- Includes clear button when text present
- Adds Tauri-only rescan button for disk scanning

## Dependencies
- **Store**: `useAppStateStore` (for `isTauri` detection)
- **Icons**: `Search`, `ChevronDown`, `RefreshCw`, `X` (lucide-react)
- **Types**: `SortBy`, `SortOrder` (from `useProjectFilters`)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| value | `string` | Yes | - | Current search query |
| onChange | `(value: string) => void` | Yes | - | Callback when search changes (debounced) |
| sortBy | `'name' \| 'date'` | Yes | - | Current sort field |
| sortOrder | `'asc' \| 'desc'` | Yes | - | Current sort direction |
| onSortChange | `(sortBy, sortOrder) => void` | Yes | - | Callback when sort changes |
| onRescan | `() => void` | No | - | Optional callback to rescan disk (Tauri) |
| totalCount | `number` | Yes | - | Total number of projects |
| filteredCount | `number` | Yes | - | Number of filtered projects |

## Visual Layout

```
┌────────────────────────────────────────────────────────────┐
│ [🔍 Search projects...     ×] [Name (A-Z) ▼] 15 of 42 [↻ Rescan] │
└────────────────────────────────────────────────────────────┘
```

### With No Filter
```
[🔍 Search projects...        ] [Newest ▼] 42 projects
```

### With Filter (Count Highlighted)
```
[🔍 office building       ×] [Name (A-Z) ▼] 5 of 42
```

## Component Implementation

### State (Local)
```typescript
{
  localValue: string;  // Local input value (before debounce)
}
```

### Debounce Mechanism
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    onChange(localValue);
  }, 300);
  return () => clearTimeout(timer);
}, [localValue, onChange]);
```

## Behavior

### Search Input
- **Debounced**: 300ms delay before firing `onChange`
- **Clear Button**: Appears when `localValue` is not empty
- **Icon**: Search icon on left (decorative)
- **Placeholder**: "Search projects..."

### Sort Dropdown
**Options**:
- Name (A-Z) → `name-asc`
- Name (Z-A) → `name-desc`
- Newest → `date-desc`
- Oldest → `date-asc`

**Value Format**: `{sortBy}-{sortOrder}`

### Project Count Display
**Unfiltered** (`filteredCount === totalCount`):
- Shows: `42 projects` (or `1 project`)
- Color: Gray (`text-slate-500`)

**Filtered** (`filteredCount !== totalCount`):
- Shows: `5` (blue) `of 42` (gray)
- Filtered count highlighted in blue

### Rescan Button (Tauri Only)
- Only visible when `isTauri && onRescan` are both true
- Triggers disk scan for `.sws` files
- Icon: Refresh icon

## Styling

### Search Input
- **Layout**: Relative container with absolute icons
- **Padding**: `pl-10` (left for icon), `pr-9` (right for clear)
- **Border**: `border-slate-200`, focus ring `ring-blue-500/20`
- **Rounded**: `rounded-xl`

### Sort Dropdown
- **Appearance**: Custom dropdown with chevron icon
- **Padding**: `pl-3 pr-9` (space for chevron)
- **Rounded**: `rounded-xl`

### Clear Button
- **Position**: Absolute right inside input
- **Hover**: Background changes to `bg-slate-100`
- **Icon**: X icon (`w-4 h-4`)

### Rescan Button
- **Class**: `btn-secondary`
- **Icon**: RefreshCw

## Usage Examples

### Basic Usage
```tsx
const [searchQuery, setSearchQuery] = useState('');
const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  sortBy={sortBy}
  sortOrder={sortOrder}
  onSortChange={(by, order) => {
    setSortBy(by);
    setSortOrder(order);
  }}
  totalCount={allProjects.length}
  filteredCount={filteredProjects.length}
/>
```

### With Tauri Rescan
```tsx
<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  sortBy={sortBy}
  sortOrder={sortOrder}
  onSortChange={handleSortChange}
  onRescan={handleRescanDisk}
  totalCount={42}
  filteredCount={15}
/>
```

### Integration with useProjectFilters
```tsx
const {
  filteredProjects,
  totalCount,
  filters,
  setSearchQuery,
  setSortBy,
  setSortOrder,
} = useProjectFilters(projects);

<SearchBar
  value={filters.searchQuery}
  onChange={setSearchQuery}
  sortBy={filters.sortBy}
  sortOrder={filters.sortOrder}
  onSortChange={(by, order) => {
    setSortBy(by);
    setSortOrder(order);
  }}
  totalCount={totalCount}
  filteredCount={filteredProjects.length}
/>
```

## Debouncing Details

### Local vs External State
The component maintains **local state** (`localValue`) to provide instant UI feedback:
```typescript
<input value={localValue} onChange={(e) => setLocalValue(e.target.value)} />
```

After 300ms of no typing, it updates the **external state**:
```typescript
setTimeout(() => onChange(localValue), 300);
```

### External Value Sync
If the parent updates `value` prop, local state syncs:
```typescript
useEffect(() => {
  setLocalValue(value);
}, [value]);
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate between search, sort, and buttons
- **Escape**: Clear search (handled by parent)
- **Enter**: Submit (no special handling, debounce applies)

### ARIA Labels
- Search input: `aria-label="Search projects"`
- Clear button: `aria-label="Clear search"`
- Rescan button: `aria-label="Rescan project folder"`

### Focus States
- Blue ring on focus: `focus:ring-2 focus:ring-blue-500/20`
- Clear visual focus indicators

### Screen Reader Support
- Project count announced clearly
- Filter state communicated via count change
- Sort option labels are descriptive

## Performance Considerations

### Debouncing
The 300ms debounce prevents excessive re-renders and API calls:
```typescript
const timer = setTimeout(() => onChange(localValue), 300);
return () => clearTimeout(timer);
```

Each keystroke:
1. Updates local state (instant UI feedback)
2. Clears previous timer
3. Sets new 300ms timer
4. Timer fires → calls `onChange` → parent re-filters

### Cleanup
```typescript
return () => clearTimeout(timer);
```
Prevents memory leaks by clearing timers on unmount.

## Related Elements

### Components
- [DashboardPage](./DashboardPage.md) - Parent container using SearchBar
- [AllProjectsSection](./AllProjectsSection.md) - Displays filtered results

### Hooks
- [useProjectFilters](../../03-hooks/useProjectFilters.md) - Provides filtering logic

### Stores
- [useAppStateStore](../../02-stores/useAppStateStore.md) - Provides `isTauri` state

## Testing

### Test Coverage
```typescript
describe('SearchBar', () => {
  it('debounces onChange by 300ms');
  it('displays clear button when value exists');
  it('clears search on clear button click');
  it('syncs localValue with external value prop');
  it('fires onSortChange with correct values');
  it('displays filtered count in blue when filtering');
  it('displays total count when not filtering');
  it('pluralizes "projects" correctly');
  it('shows rescan button only in Tauri mode');
  it('calls onRescan when rescan button clicked');
});
```

### Key Test Scenarios
1. **Debounce**: Type quickly, only fires `onChange` after 300ms pause
2. **Clear Button**: Appears/disappears based on input value
3. **Sort Change**: Dropdown updates both `sortBy` and `sortOrder`
4. **Count Display**: Switches between "42 projects" and "5 of 42"
5. **Tauri Button**: Only visible when `isTauri && onRescan`
