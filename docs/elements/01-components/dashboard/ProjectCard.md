# ProjectCard

## Overview

The ProjectCard component displays a single project in the dashboard grid. It shows project information and provides quick actions for project management including rename, duplicate, archive, and delete operations.

## Location

```
src/features/dashboard/components/ProjectCard.tsx
```

## Purpose

- Display project information in a card format
- Enable inline project name editing
- Provide context menu for project actions
- Show visual feedback for hover and selection states
- Navigate to the canvas editor when clicked

## Dependencies

- `@/features/dashboard/store/projectListStore` - Project list management
- `next/navigation` - Router for navigation
- React state hooks for edit mode management

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `project` | `ProjectListItem` | Yes | Project data object |
| `onEdit` | `(id: string) => void` | No | Callback when edit is triggered |
| `onDelete` | `(id: string) => void` | No | Callback when delete is triggered |
| `onDuplicate` | `(id: string) => void` | No | Callback when duplicate is triggered |
| `onArchive` | `(id: string) => void` | No | Callback when archive is triggered |

## Project Data Structure

```typescript
interface ProjectListItem {
  id: string;
  name: string;
  projectNumber?: string;
  clientName?: string;
  createdAt: string;
  modifiedAt: string;
  isArchived: boolean;
}
```

## Visual Layout

```
┌─────────────────────────────────────┐
│  ┌─────┐                        ⋮  │  <- Action menu (3 dots)
│  │ 📁  │  Project Name              │
│  └─────┘                            │
│                                     │
│  Client: [Client Name]              │
│  Project #: [Number]                │
│                                     │
│  Modified: Dec 28, 2025             │
└─────────────────────────────────────┘
```

## Behavior

### 1. Display Mode
- Shows project name prominently
- Displays client name and project number if available
- Shows last modified date in human-readable format
- Hover state highlights the card with shadow/border

### 2. Inline Editing
- Double-click project name to enter edit mode
- Input field replaces text with current name
- Enter key saves changes
- Escape key cancels editing
- Click outside saves changes

### 3. Context Menu Actions

| Action | Icon | Description |
|--------|------|-------------|
| Open | → | Navigate to canvas editor |
| Rename | ✏️ | Enter inline edit mode |
| Duplicate | 📋 | Create copy with "(Copy)" suffix |
| Archive | 📦 | Move to archived projects |
| Delete | 🗑️ | Remove project (with confirmation) |

### 4. Click Navigation
- Single click opens project in canvas editor
- Navigates to `/canvas/[projectId]`

## State Management

```typescript
// Internal state
const [isEditing, setIsEditing] = useState(false);
const [editName, setEditName] = useState(project.name);
const [menuOpen, setMenuOpen] = useState(false);
```

## Styling

```css
/* Base card styles */
.project-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}

/* Hover state */
.project-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

/* Archived state */
.project-card.archived {
  opacity: 0.6;
  background: #f5f5f5;
}
```

## Usage Example

```tsx
import { ProjectCard } from '@/features/dashboard/components/ProjectCard';

function Dashboard() {
  const { projects, deleteProject, duplicateProject } = useProjectListStore();

  return (
    <div className="grid grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onDelete={(id) => deleteProject(id)}
          onDuplicate={(id) => duplicateProject(id)}
          onArchive={(id) => archiveProject(id)}
        />
      ))}
    </div>
  );
}
```

## Accessibility

- Keyboard navigation with Tab
- Enter key to open project
- Menu accessible via keyboard
- ARIA labels for action buttons
- Focus visible indicators

## Related Elements

- [ProjectListStore](../../02-stores/projectListStore.md) - State management
- [NewProjectDialog](./NewProjectDialog.md) - Creating new projects
- [ConfirmDialog](./ConfirmDialog.md) - Delete confirmation
- [DashboardPage](../../12-pages/DashboardPage.md) - Parent page

## Testing

```typescript
describe('ProjectCard', () => {
  it('displays project name and metadata', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('navigates to canvas on click', () => {
    render(<ProjectCard project={mockProject} />);
    fireEvent.click(screen.getByRole('article'));
    expect(mockRouter.push).toHaveBeenCalledWith('/canvas/test-id');
  });

  it('enables inline editing on double-click', () => {
    render(<ProjectCard project={mockProject} />);
    fireEvent.doubleClick(screen.getByText('Test Project'));
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('calls onDelete when delete action clicked', () => {
    const onDelete = vi.fn();
    render(<ProjectCard project={mockProject} onDelete={onDelete} />);
    // Open menu and click delete
    fireEvent.click(screen.getByLabelText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('test-id');
  });
});
```
