# DashboardPage

## Overview
Main project management interface with glassmorphism header, segmented tabs (Active/Archived), search/filter, and comprehensive keyboard shortcuts (UJ-PM-002, UJ-PM-007, UJ-PM-005).

## Location
```
hvac-design-app/src/features/dashboard/components/DashboardPage.tsx
```

## Purpose
- Primary project management interface
- Lists all active and archived projects
- Provides search, sort, and filter functionality
- Enables project creation, opening, and file operations
- Implements keyboard navigation and shortcuts
- Supports Tauri file system integration
- Displays recent projects section (active tab only)

## Platform Availability
- **Universal**: Available in both Tauri (Offline) and Hybrid (Web) modes. Features adapt (e.g., File System scan vs LocalStorage).

## Dependencies
- **Store**: `useProjectListStore`, `useAppStateStore`
- **Hooks**: `useProjectFilters`, `useAutoOpen`, `useRecentProjects`, `useSearchParams`
- **Components**: `SearchBar`, `RecentProjectsSection`, `AllProjectsSection`, `NewProjectDialog`, `FileMenu`
- **Icons**: `Plus`, `Archive`, `FolderOpen`, `Search` (lucide-react)
- **Tauri**: `TauriFileSystem`, `loadProject`

## Props
None (route-level page component)

## Visual Layout

```
┌─────────────────────────────────────────────────────┐
│  [📁] HVAC Pro Design        [File▼] [+ New Project]│ ← Header (glassmorphism)
├─────────────────────────────────────────────────────┤
│  [Active 42] [Archived 5]   [🔍Search] [Sort▼]      │ ← Controls
├─────────────────────────────────────────────────────┤
│  🕐 Recent Projects                              10  │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐          │
│  │Project│ │Project│ │Project│ │Project│          │
│  └───────┘ └───────┘ └───────┘ └───────┘          │
│                                                      │
│  All Projects                                    42  │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐          │
│  │Project│ │Project│ │Project│ │Project│          │
│  └───────┘ └───────┘ └───────┘ └───────┘          │
└─────────────────────────────────────────────────────┘
```

## Component Implementation

### State (Local)
```typescript
{
  isDialogOpen: boolean;              // New project dialog visibility
  activeTab: 'active' | 'archived';   // Current tab selection
  focusedIndex: number;               // Keyboard navigation focus index
}
```

### URL Sync
```typescript
const viewParam = searchParams.get('view');
// Syncs activeTab with ?view=archived query param
```

## Behavior

### Tab System (Segmented Control)
**Active Tab**: Shows active projects with Recent Projects section
**Archived Tab**: Shows archived projects (no Recent section)

Tabs display counts: `Active (42)`, `Archived (5)`

### Project Filtering
Projects are filtered and sorted using `useProjectFilters`:
```typescript
const {
  filteredProjects,
  totalCount,
  filters,
  setSearchQuery,
  setSortBy,
  setSortOrder,
} = useProjectFilters(displayedProjects);
```

### Search & Sort Integration
- Search input in `<SearchBar>` component
- Sort options: Name (A-Z/Z-A), Date (Newest/Oldest)
- Project count: `{filteredCount} of {totalCount}`

### Empty States

**No Projects (Global)**:
```
┌──────────────────────┐
│       📁             │
│  No projects yet     │
│  Create your first...│
│  [Create New Project]│
└──────────────────────┘
```

**No Results (Filtered)**:
- Handled by `AllProjectsSection` component
- Shows "No projects match '{searchTerm}'"

### Tauri File System Integration

**Disk Scanning** (on mount):
```typescript
if (isTauri) {
  await scanProjectsFromDisk();
}
```

**Open from File** (`FileMenu` action):
```typescript
const filePath = await TauriFileSystem.openFileDialog();
const result = await loadProject(filePath);
// Add to project list if not exists
// Navigate to canvas
```

**Rescan** (manual trigger):
```typescript
const handleRescan = async () => {
  await scanProjectsFromDisk();
};
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+F` / `Cmd+F` | Focus search input |
| `Escape` | Clear search (when active) |
| `Arrow Down` / `Arrow Right` | Move focus to next project |
| `Arrow Up` / `Arrow Left` | Move focus to previous project |
| `Enter` | Open focused project |

### Navigation Flow
```typescript
window.location.href = `/canvas/${projectId}`;
```

### Recent Projects Logic
```typescript
const recentProjects = useRecentProjects();
// Returns last 10 accessed projects, sorted by lastOpenedAt
```

Only shown on **Active** tab when `recentProjects.length > 0`.

## State Management

### Store Hooks
```typescript
const allProjectsRaw = useProjectListStore(state => state.projects);
const scanProjectsFromDisk = useProjectListStore(state => state.scanProjectsFromDisk);
const isTauri = useAppStateStore((state) => state.isTauri);
```

### Computed Project Lists
```typescript
const activeProjects = allProjectsRaw.filter(p => !p.isArchived);
const archivedProjects = allProjectsRaw.filter(p => p.isArchived);
const displayedProjects = activeTab === 'active' ? activeProjects : archivedProjects;
```

### Persistence Rehydration
```typescript
await useProjectListStore.persist.rehydrate();
```

## Styling

### Glassmorphism Header
```css
.glass-header {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
```

### Grid Pattern Background
```css
.grid-pattern {
  background-image: linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

### Animations
- **Slide Up**: `animate-slide-up`
- **Staggered Delay**: `animation-delay-100` (100ms delay)

### Segmented Control
```css
.segmented-control {
  display: inline-flex;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 4px;
}
```

## Usage Examples

### Standalone Page
```tsx
// app/dashboard/page.tsx
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';

export default function Page() {
  return <DashboardPage />;
}
```

### With URL Query Params
```tsx
// Navigate to archived view
router.push('/dashboard?view=archived');

// Navigate to active view (default)
router.push('/dashboard');
```

### Programmatic Project Opening
```tsx
// From external component
window.location.href = `/canvas/${projectId}`;
```

## Accessibility

### Keyboard Navigation
- **Ctrl+F**: Focus search (prevents default browser search)
- **Escape**: Clear search query
- **Arrow Keys**: Navigate project cards
- **Enter**: Open selected project
- **Tab**: Navigate interactive elements

### ARIA Labels
- Search input: `aria-label="Search projects"`
- Rescan button: `aria-label="Rescan project folder"`
- Test IDs on all major elements

### Focus Management
- Search input focused via keyboard shortcut
- Focus indicators on project cards (via keyboard nav)

### Screen Reader Support
- Clear heading hierarchy (`<h1>`, `<h2>`)
- Project counts announced
- Tab states communicated

## Related User Journeys
- [Create New Project (Tauri)](../../../user-journeys/01-project-management/tauri-offline/UJ-PM-001-CreateNewProject.md)
- [Open Existing Project (Tauri)](../../../user-journeys/01-project-management/tauri-offline/UJ-PM-002-OpenExistingProject.md)
- [Search & Filter (Tauri)](../../../user-journeys/01-project-management/tauri-offline/UJ-PM-007-SearchFilterProjects.md)
- [Archive Project (Tauri)](../../../user-journeys/01-project-management/tauri-offline/UJ-PM-005-ArchiveProject.md)

## Performance Considerations

### Search Debouncing
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    onChange(localValue);
  }, 300);
  return () => clearTimeout(timer);
}, [localValue]);
```

### Disk Scanning (Tauri)
- Only runs on mount
- Manual rescan available via button
- Scans project directory for `.sws` files

### Store Rehydration
```typescript
await useProjectListStore.persist.rehydrate();
```
Ensures persisted projects loaded before rendering.

## Related Elements

### Components
- [SearchBar](./SearchBar.md) - Search and sort controls
- [AllProjectsSection](./AllProjectsSection.md) - All projects display
- [RecentProjectsSection](./RecentProjectsSection.md) - Recent projects
- [ProjectGrid](./ProjectGrid.md) - Grid layout
- [ProjectCard](./ProjectCard.md) - Individual cards
- [NewProjectDialog](./NewProjectDialog.md) - Create project
- [FileMenu](../layout/FileMenu.md) - File operations

### Stores
- [projectListStore](../../02-stores/projectListStore.md) - Project list data
- `useAppStateStore` (`src/stores/useAppStateStore.ts`) - App state (isTauri)

### Hooks
- `useProjectFilters` (`src/features/dashboard/hooks/useProjectFilters.ts`) - Search/filter/sort logic
- `useAutoOpen` (`src/hooks/useAutoOpen.ts`) - Auto-open project handling
- `useRecentProjects` (`src/features/dashboard/store/projectListStore.ts`) - Recent projects selector

## Testing

**Test ID**: `dashboard-page`

### Test Coverage
```typescript
describe('DashboardPage', () => {
  it('renders header with logo and title');
  it('displays active and archived tabs with counts');
  it('switches between active and archived tabs');
  it('syncs activeTab with URL query param');
  it('displays recent projects on active tab only');
  it('filters projects based on search query');
  it('updates sort order via dropdown');
  it('shows empty state when no projects exist');
  it('opens new project dialog on button click');
  it('focuses search input on Ctrl+F');
  it('clears search on Escape');
  it('navigates projects with arrow keys');
  it('opens project on Enter key');
  it('scans disk on mount (Tauri only)');
  it('handles rescan button click (Tauri only)');
  it('opens project from file dialog (Tauri)');
});
```

### Key Test Scenarios
1. **Tab Switching**: Active/Archived toggle updates displayed projects
2. **Search**: Debounced search filters projects correctly
3. **Keyboard Nav**: Arrow keys move focus, Enter opens project
4. **Empty State**: Shows create project CTA when no projects
5. **Tauri Integration**: Disk scanning and file dialog work correctly
