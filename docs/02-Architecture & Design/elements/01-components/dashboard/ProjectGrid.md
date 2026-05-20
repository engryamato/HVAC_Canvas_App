# ProjectGrid

## Overview
Responsive grid layout component for project cards with staggered animation delays and action handling.

## Location
```
hvac-design-app/src/features/dashboard/components/ProjectGrid.tsx
```

## Platform Availability
- **Universal**: Available in both Tauri (Offline) and Hybrid (Web) modes.

## Related User Journeys
- [Search & Filter Projects](../../../user-journeys/01-project-management/tauri-offline/UJ-PM-007-SearchFilterProjects.md)
- [Open Existing Project](../../../user-journeys/01-project-management/tauri-offline/UJ-PM-002-OpenExistingProject.md)

## Purpose
- Renders responsive grid of project cards
- Calculates staggered animation delays for cards
- Handles duplicate project logic with name collision detection
- Wires project actions to cards (delete, archive, restore, duplicate, rename)

## Dependencies
- **Components**: `ProjectCard`
- **Store**: `useProjectListActions`, `useProjects` (projectListStore)
- **Types**: `ProjectListItem`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| projects | `ProjectListItem[]` | Yes | - | Array of projects to display in grid |

## Visual Layout

### Responsive Grid Breakpoints
```
Mobile (sm):      1 column
Tablet (sm):      2 columns
Desktop (lg):     3 columns
Large (xl):       4 columns

┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│ P-1 │ │ P-2 │ │ P-3 │ │ P-4 │
└─────┘ └─────┘ └─────┘ └─────┘

┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│ P-5 │ │ P-6 │ │ P-7 │ │ P-8 │
└─────┘ └─────┘ └─────┘ └─────┘
```

## Component Implementation

### Grid Layout
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
  {projects.map((project, index) => (
    <ProjectCard
      key={project.projectId}
      project={project}
      animationDelay={index * 50}
      {...actions}
    />
  ))}
</div>
```

### Animation Delays
Each card receives staggered animation delay:
- Card 0: `0ms`
- Card 1: `50ms`
- Card 2: `100ms`
- Card 3: `150ms`
- ...and so on

## Behavior

### Duplicate Project Logic
The `handleDuplicate()` function implements smart naming:

**1. Extract Source Name**
```typescript
const sourceName = (rawName && rawName !== 'undefined' && rawName.trim() !== '') 
  ? rawName 
  : 'Untitled Project';
```

**2. Generate Unique Name**
```typescript
let newName = `${sourceName} - Copy`;
let counter = 2;

while (allProjects.some(p => p.projectName === newName)) {
  newName = `${sourceName} - Copy ${counter}`;
  counter++;
}
```

**Examples**:
- "Office Building" → "Office Building - Copy"
- "Office Building" (duplicate again) → "Office Building - Copy 2"
- "Office Building - Copy 2" (duplicate) → "Office Building - Copy 2 - Copy"

**3. Create Duplicate**
```typescript
actions.duplicateProject(projectId, newName);
```

### Action Wiring
The grid connects store actions to each card:
- **onDelete**: `actions.removeProject`
- **onArchive**: `actions.archiveProject`
- **onRestore**: `actions.restoreProject`
- **onDuplicate**: `handleDuplicate` (local function)
- **onRename**: `actions.updateProject` (with projectName update)

## State Management

### Store Hooks
```typescript
const actions = useProjectListActions();
const allProjects = useProjects();
```

### Action Bindings
Each ProjectCard receives these callbacks:
```typescript
<ProjectCard
  onDelete={actions.removeProject}
  onArchive={actions.archiveProject}
  onRestore={actions.restoreProject}
  onDuplicate={handleDuplicate}
  onRename={(id, name) => actions.updateProject(id, { projectName: name })}
/>
```

## Styling

### Grid Classes
- **Base**: `grid`
- **Columns**:
  - Mobile: `grid-cols-1`
  - Small: `sm:grid-cols-2`
  - Large: `lg:grid-cols-3`
  - XLarge: `xl:grid-cols-4`
- **Gap**: `gap-5` (1.25rem)

### Responsive Behavior
The grid adapts to screen size:
- **< 640px**: 1 column (stacked)
- **640px - 1023px**: 2 columns
- **1024px - 1279px**: 3 columns
- **≥ 1280px**: 4 columns

## Usage Examples

### Basic Usage
```tsx
<ProjectGrid projects={allProjects} />
```

### Filtered Projects
```tsx
const activeProjects = projects.filter(p => !p.isArchived);
<ProjectGrid projects={activeProjects} />
```

### Recent Projects (Limited)
```tsx
const recentProjects = projects
  .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))
  .slice(0, 10);

<ProjectGrid projects={recentProjects} />
```

### Integration with Sections
```tsx
<AllProjectsSection>
  <ProjectGrid projects={filteredProjects} />
</AllProjectsSection>

<RecentProjectsSection>
  <ProjectGrid projects={recentProjects} />
</RecentProjectsSection>
```

## Accessibility

### Keyboard Navigation
- Grid uses native CSS grid (no accessibility issues)
- Each ProjectCard handles its own keyboard navigation
- Tab order follows visual grid order (left-to-right, top-to-bottom)

### Screen Reader Support
- Cards announced in order
- Grid structure communicated via card count in section headers
- No special ARIA roles needed (standard grid layout)

## Performance Considerations

### Animation Delays
- Staggered delays create visual cascade effect
- Maximum delay: `(projects.length - 1) * 50ms`
- Example: 20 cards = 950ms maximum delay

### Rendering Optimization
- Uses `project.projectId` as unique key
- No memo needed (cards handle their own optimization)

## Related Elements

### Components
- [ProjectCard](./ProjectCard.md) - Individual project cards
- [AllProjectsSection](./AllProjectsSection.md) - Uses ProjectGrid
- [RecentProjectsSection](./RecentProjectsSection.md) - Uses ProjectGrid
- [DashboardPage](./DashboardPage.md) - Parent container

### Stores
- [projectListStore](../../02-stores/projectListStore.md) - Project actions and data

## Testing

### Test Coverage
```typescript
describe('ProjectGrid', () => {
  it('renders grid with correct responsive classes');
  it('passes staggered animation delays to cards');
  it('generates unique duplicate names');
  it('handles "Untitled Project" fallback for empty names');
  it('increments copy counter for collisions');
  it('wires all actions to cards correctly');
  it('uses projectId as key');
});
```

### Key Test Scenarios
1. **Responsive Grid**: Correct column count at each breakpoint
2. **Animation Delays**: Each card receives `index * 50` delay
3. **Duplicate Naming**:
   - "Project A" → "Project A - Copy"
   - "Project A - Copy" → "Project A - Copy 2"
   - Empty name → "Untitled Project - Copy"
4. **Action Callbacks**: All actions call correct store methods
