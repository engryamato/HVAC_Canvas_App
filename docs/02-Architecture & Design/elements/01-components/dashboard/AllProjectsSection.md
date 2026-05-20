# AllProjectsSection

## Overview
Section component displaying all projects with count header and context-aware empty states.

## Location
```
hvac-design-app/src/features/dashboard/components/AllProjectsSection.tsx
```

## Purpose
- Displays all projects in grid layout
- Shows section header with project count
- Provides search-aware empty states
- Differentiates between "no projects" and "no search results"

## Dependencies
- **Components**: `ProjectGrid`
- **Icons**: `Folder`, `Search` (lucide-react)
- **Types**: `ProjectListItem`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| projects | `ProjectListItem[]` | Yes | - | Array of projects to display |
| searchTerm | `string` | No | - | Current search query (affects empty state) |
| emptyMessage | `string` | No | `'No projects yet. Create your first project!'` | Custom empty state message |

## Visual Layout

### With Projects
```
┌──────────────────────────────────────────┐
│  All Projects                         42 │
├──────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ Proj│ │ Proj│ │ Proj│ │ Proj│       │
│  │  1  │ │  2  │ │  3  │ │  4  │       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
└──────────────────────────────────────────┘
```

### Empty State (No Search)
```
┌──────────────────────────────────────────┐
│  All Projects                          0 │
├──────────────────────────────────────────┤
│                                          │
│         ┌────────┐                       │
│         │   📁   │                       │
│         └────────┘                       │
│  No projects yet. Create your first...   │
│                                          │
└──────────────────────────────────────────┘
```

### Empty State (Search Active)
```
┌──────────────────────────────────────────┐
│  All Projects                          0 │
├──────────────────────────────────────────┤
│                                          │
│         ┌────────┐                       │
│         │   🔍   │                       │
│         └────────┘                       │
│    No projects match "office building"   │
│                                          │
└──────────────────────────────────────────┘
```

## Component Implementation

### Conditional Rendering
```typescript
{projects.length > 0 ? (
  <ProjectGrid projects={projects} />
) : (
  <EmptyState />
)}
```

## Behavior

### Section Header
- **Title**: "All Projects"
- **Count Badge**: Shows `projects.length` in small gray text
- **Icon**: Clock icon for visual hierarchy

### Empty State Logic
The component chooses empty state based on `searchTerm`:

**Search Active** (`searchTerm` provided):
- Icon: Search icon
- Message: `No projects match "{searchTerm}"`

**No Search** (default):
- Icon: Folder icon
- Message: Custom `emptyMessage` or default

### Project Display
When `projects.length > 0`, renders `<ProjectGrid>` with full project list.

## Styling

### Section Header
- Flexbox with gap: `flex items-center gap-2 mb-5`
- Title: `text-lg font-semibold text-slate-900`
- Count: `text-xs font-medium text-slate-400`

### Empty State
- Centered content: `flex flex-col items-center justify-center`
- Padding: `py-16 px-4`
- Background: `bg-white/50` with dashed border
- Rounded corners: `rounded-2xl`

### Icon Container
- Size: `w-14 h-14`
- Background: `bg-slate-100`
- Rounded: `rounded-xl`
- Icon size: `w-7 h-7 text-slate-400`

## Usage Examples

### Basic Usage (No Search)
```tsx
<AllProjectsSection projects={allProjects} />
```

### With Search Term
```tsx
<AllProjectsSection
  projects={filteredProjects}
  searchTerm={searchQuery}
/>
```

### Custom Empty Message
```tsx
<AllProjectsSection
  projects={projects}
  emptyMessage="You haven't created any projects yet. Click 'New Project' to get started!"
/>
```

### Integration with Dashboard
```tsx
const DashboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const projects = useProjects();
  
  const filteredProjects = projects.filter(p =>
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      <AllProjectsSection
        projects={filteredProjects}
        searchTerm={searchTerm}
      />
    </div>
  );
};
```

## Accessibility

### Semantic HTML
- Uses `<section>` with `data-testid="all-projects"`
- Proper heading hierarchy with `<h2>`

### Screen Reader Support
- Count badge announced as part of heading
- Empty state messages are clear and descriptive
- Icon decorations are purely visual (no alt text needed)

### Keyboard Navigation
- Section doesn't trap focus
- Keyboard navigation handled by child `ProjectGrid`

## Related Elements

### Components
- [ProjectGrid](./ProjectGrid.md) - Grid layout for projects
- [ProjectCard](./ProjectCard.md) - Individual project cards
- [SearchBar](./SearchBar.md) - Search functionality
- [DashboardPage](./DashboardPage.md) - Parent container

### Stores
- [projectListStore](../../02-stores/projectListStore.md) - Project data source

## Testing

**Test ID**: `all-projects`

### Test Coverage
```typescript
describe('AllProjectsSection', () => {
  it('displays section header with project count');
  it('renders ProjectGrid when projects exist');
  it('shows folder icon in empty state (no search)');
  it('shows search icon in empty state (with search)');
  it('displays custom empty message');
  it('shows "No projects match" with search term');
  it('renders all projects in grid');
});
```

### Key Test Scenarios
1. **Empty State**: Correct icon and message based on search term
2. **Project Count**: Badge shows accurate count
3. **Grid Rendering**: ProjectGrid receives correct projects array
4. **Search Context**: Empty state changes based on search presence

## Platform Availability

- **Universal**: Available on both Tauri (Desktop) and Web platforms.

## Related User Journeys

- [UJ-PM-007 (Hybrid)](../../../user-journeys/hybrid/01-project-management/UJ-PM-007-ListProjects.md)
- [UJ-PM-005 (Hybrid)](../../../user-journeys/hybrid/01-project-management/UJ-PM-005-SearchProjects.md)
- [UJ-PM-007 (Tauri)](../../../user-journeys/tauri-offline/01-project-management/UJ-PM-007-ListProjects.md)
- [UJ-PM-005 (Tauri)](../../../user-journeys/tauri-offline/01-project-management/UJ-PM-005-SearchProjects.md)
