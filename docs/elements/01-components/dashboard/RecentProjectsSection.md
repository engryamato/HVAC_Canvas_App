# RecentProjectsSection

## Overview
Section component displaying recently accessed projects with clock icon header and auto-hide behavior.

## Location
```
hvac-design-app/src/features/dashboard/components/RecentProjectsSection.tsx
```

## Purpose
- Displays last 10 accessed projects
- Shows section header with project count
- Auto-hides when no projects exist
- Provides quick access to frequently used projects

## Dependencies
- **Components**: `ProjectGrid`
- **Icons**: `Clock` (lucide-react)
- **Types**: `ProjectListItem`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| projects | `ProjectListItem[]` | Yes | - | Array of recent projects to display (typically 10 max) |

## Visual Layout

### With Recent Projects
```
┌──────────────────────────────────────────┐
│  🕐 Recent Projects                   10 │
├──────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ Rec │ │ Rec │ │ Rec │ │ Rec │       │
│  │  1  │ │  2  │ │  3  │ │  4  │       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
└──────────────────────────────────────────┘
```

### Empty State (Component Hidden)
```
(Nothing rendered - component returns null)
```

## Component Implementation

### Conditional Rendering
```typescript
if (projects.length === 0) {
  return null;
}

return (
  <section>
    <header>Recent Projects ({projects.length})</header>
    <ProjectGrid projects={projects} />
  </section>
);
```

## Behavior

### Auto-Hide When Empty
The component completely hides itself when `projects.length === 0`:
- Returns `null` (no DOM element)
- No placeholder or message
- Section simply doesn't appear

### Section Header
- **Icon**: Clock icon (`w-4 h-4 text-slate-400`)
- **Title**: "Recent Projects"
- **Count Badge**: Shows `projects.length`

### Project Display
Renders `<ProjectGrid>` with provided projects (typically limited to 10 by parent).

## Styling

### Section Header
- Flexbox layout: `flex items-center gap-2 mb-5`
- Clock icon: `w-4 h-4 text-slate-400`
- Title: `text-lg font-semibold text-slate-900`
- Count: `text-xs font-medium text-slate-400`

### Grid Spacing
- Bottom margin: `mb-5` (separates header from grid)

## Usage Examples

### Basic Usage
```tsx
const recentProjects = projects
  .sort((a, b) => new Date(b.lastOpenedAt) - new Date(a.lastOpenedAt))
  .slice(0, 10);

<RecentProjectsSection projects={recentProjects} />
```

### Integration with Dashboard
```tsx
const DashboardPage = () => {
  const allProjects = useProjects();
  
  const recentProjects = allProjects
    .sort((a, b) => new Date(b.lastOpenedAt) - new Date(a.lastOpenedAt))
    .slice(0, 10);
  
  return (
    <div>
      <RecentProjectsSection projects={recentProjects} />
      <AllProjectsSection projects={allProjects} />
    </div>
  );
};
```

### With Empty Array (Hidden)
```tsx
<RecentProjectsSection projects={[]} />
// Renders nothing (null)
```

### Conditional Rendering Pattern
```tsx
// The component handles empty state internally, but you can also:
{recentProjects.length > 0 && (
  <RecentProjectsSection projects={recentProjects} />
)}

// However, this is redundant since the component already checks internally
```

## Accessibility

### Semantic HTML
- Uses `<section>` with `data-testid="recent-projects"`
- Proper heading hierarchy with `<h2>`

### Screen Reader Support
- Clock icon is decorative (no alt text needed)
- Count badge announced as part of heading
- Section title clearly identifies purpose

### Keyboard Navigation
- Section doesn't trap focus
- Keyboard navigation delegated to child `ProjectGrid`

## Performance Considerations

### Render Optimization
The early return prevents unnecessary rendering:
```typescript
if (projects.length === 0) {
  return null; // No DOM rendering
}
```

### Typical Usage Pattern
Parent components should:
1. Sort by `lastOpenedAt` descending
2. Limit to 10 projects with `.slice(0, 10)`
3. Pass to component

## Related Elements

### Components
- [ProjectGrid](./ProjectGrid.md) - Grid layout for projects
- [ProjectCard](./ProjectCard.md) - Individual project cards
- [AllProjectsSection](./AllProjectsSection.md) - All projects section
- [DashboardPage](./DashboardPage.md) - Parent container

### Stores
- [projectListStore](../../02-stores/projectListStore.md) - Project data source

## Testing

**Test ID**: `recent-projects`

### Test Coverage
```typescript
describe('RecentProjectsSection', () => {
  it('renders null when projects array is empty');
  it('displays section header with clock icon');
  it('shows correct project count');
  it('renders ProjectGrid with provided projects');
  it('applies correct styling to header');
});
```

### Key Test Scenarios
1. **Empty Projects**: Component returns null (no DOM)
2. **Project Count**: Badge shows accurate count
3. **Grid Rendering**: ProjectGrid receives correct projects array
4. **Auto-Hide**: Section hidden when empty
