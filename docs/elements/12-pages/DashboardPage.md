# Dashboard Page

## Overview

The Dashboard Page is the main project management interface where users can view, create, archive, duplicate, rename, and delete projects. It features tabbed navigation between active and archived projects with a card-based layout.

## Location

```
app/(main)/dashboard/page.tsx
```

## Purpose

- Display list of active and archived projects
- Create new projects with metadata input
- Delete projects with confirmation
- Archive/restore projects between tabs
- Duplicate existing projects
- Rename projects in-place
- Navigate to canvas editor for selected project
- Show project statistics (entity count, last modified)

## Dependencies

- `@/core/store/projectListStore` - Project list state management
- `@/components/dashboard/ProjectCard` - Individual project card component
- `@/components/dashboard/NewProjectDialog` - Project creation modal
- `@/components/dashboard/ConfirmDialog` - Confirmation modal for destructive actions
- `@/components/ui/Toast` - Notification system
- `next/navigation` - Next.js routing

## State Management

### Page State

```typescript
interface DashboardPageState {
  activeTab: 'active' | 'archived';
  isNewProjectOpen: boolean;
  confirmState: ConfirmState;
  searchQuery: string;
  sortBy: 'name' | 'modified' | 'created';
  sortOrder: 'asc' | 'desc';
}
```

### Confirm State

```typescript
interface ConfirmState {
  type: 'delete' | 'archive' | 'restore' | null;
  projectId: string | null;
  projectName: string | null;
}
```

### Store State

```typescript
// From projectListStore
interface ProjectListState {
  projects: Project[];
  archivedProjects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
  restoreProject: (id: string) => void;
  duplicateProject: (id: string) => void;
}
```

## Component Structure

```
DashboardPage
├── Header
│   ├── Title: "Projects"
│   ├── Search Input
│   └── New Project Button
├── Tab Navigation
│   ├── Active Tab (with count badge)
│   └── Archived Tab (with count badge)
├── Sort Controls
│   ├── Sort By Dropdown
│   └── Sort Order Toggle
├── Project Grid
│   └── ProjectCard (×N)
│       ├── Thumbnail/Preview
│       ├── Project Name (editable)
│       ├── Metadata (date, entities)
│       ├── Actions Menu
│       │   ├── Open
│       │   ├── Duplicate
│       │   ├── Rename
│       │   ├── Archive/Restore
│       │   └── Delete
│       └── Click Handler → Navigate to Editor
└── Modals
    ├── NewProjectDialog
    └── ConfirmDialog
```

## Actions

### Create Project

```typescript
const handleCreateProject = async (metadata: ProjectMetadata) => {
  const newProject: Project = {
    id: uuidv4(),
    name: metadata.name,
    projectNumber: metadata.projectNumber,
    clientName: metadata.clientName,
    location: metadata.location,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    entityCount: 0,
    thumbnailUrl: null,
    isArchived: false,
  };

  addProject(newProject);
  setIsNewProjectOpen(false);

  toast.success(`Project "${newProject.name}" created!`);

  // Navigate to canvas editor
  router.push(`/canvas/${newProject.id}`);
};
```

### Delete Project

```typescript
const handleDeleteProject = (projectId: string, projectName: string) => {
  setConfirmState({
    type: 'delete',
    projectId,
    projectName,
  });
};

const confirmDelete = () => {
  if (!confirmState.projectId) return;

  deleteProject(confirmState.projectId);

  toast.success(`Project "${confirmState.projectName}" deleted`);

  setConfirmState({ type: null, projectId: null, projectName: null });
};
```

### Archive Project

```typescript
const handleArchiveProject = (projectId: string) => {
  archiveProject(projectId);

  const project = projects.find(p => p.id === projectId);
  toast.success(`"${project?.name}" moved to archive`);
};
```

### Restore Project

```typescript
const handleRestoreProject = (projectId: string) => {
  restoreProject(projectId);

  const project = archivedProjects.find(p => p.id === projectId);
  toast.success(`"${project?.name}" restored to active projects`);
};
```

### Duplicate Project

```typescript
const handleDuplicateProject = (projectId: string) => {
  const original = projects.find(p => p.id === projectId);
  if (!original) return;

  const duplicate: Project = {
    ...original,
    id: uuidv4(),
    name: `${original.name} (Copy)`,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  };

  addProject(duplicate);

  toast.success(`"${duplicate.name}" created`);
};
```

### Rename Project

```typescript
const handleRenameProject = (projectId: string, newName: string) => {
  if (newName.trim().length === 0) {
    toast.error('Project name cannot be empty');
    return;
  }

  updateProject(projectId, {
    name: newName,
    modifiedAt: new Date().toISOString(),
  });

  toast.success('Project renamed');
};
```

## Tab Switching

```typescript
const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

const displayedProjects = activeTab === 'active' ? projects : archivedProjects;

const handleTabChange = (tab: 'active' | 'archived') => {
  setActiveTab(tab);
  setSearchQuery(''); // Clear search when switching tabs
};
```

## Search & Filter

```typescript
const [searchQuery, setSearchQuery] = useState('');

const filteredProjects = useMemo(() => {
  let result = displayedProjects;

  // Search filter
  if (searchQuery.trim()) {
    result = result.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Sort
  result = [...result].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'modified':
        comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
        break;
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return result;
}, [displayedProjects, searchQuery, sortBy, sortOrder]);
```

## Layout

```tsx
<div className="dashboard-page">
  {/* Header */}
  <header className="dashboard-header">
    <h1>Projects</h1>
    <div className="header-actions">
      <input
        type="search"
        placeholder="Search projects..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button onClick={() => setIsNewProjectOpen(true)}>
        New Project
      </button>
    </div>
  </header>

  {/* Tab Navigation */}
  <div className="tab-navigation">
    <button
      className={activeTab === 'active' ? 'active' : ''}
      onClick={() => handleTabChange('active')}
    >
      Active ({projects.length})
    </button>
    <button
      className={activeTab === 'archived' ? 'active' : ''}
      onClick={() => handleTabChange('archived')}
    >
      Archived ({archivedProjects.length})
    </button>
  </div>

  {/* Sort Controls */}
  <div className="sort-controls">
    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
      <option value="modified">Last Modified</option>
      <option value="created">Date Created</option>
      <option value="name">Name</option>
    </select>
    <button onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}>
      {sortOrder === 'asc' ? '↑' : '↓'}
    </button>
  </div>

  {/* Project Grid */}
  <div className="project-grid">
    {filteredProjects.length === 0 ? (
      <div className="empty-state">
        {searchQuery ? (
          <p>No projects match your search</p>
        ) : (
          <p>No {activeTab} projects yet</p>
        )}
      </div>
    ) : (
      filteredProjects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={() => router.push(`/canvas/${project.id}`)}
          onDuplicate={() => handleDuplicateProject(project.id)}
          onRename={(newName) => handleRenameProject(project.id, newName)}
          onArchive={() => handleArchiveProject(project.id)}
          onRestore={() => handleRestoreProject(project.id)}
          onDelete={() => handleDeleteProject(project.id, project.name)}
        />
      ))
    )}
  </div>

  {/* New Project Dialog */}
  <NewProjectDialog
    isOpen={isNewProjectOpen}
    onClose={() => setIsNewProjectOpen(false)}
    onCreate={handleCreateProject}
  />

  {/* Confirm Dialog */}
  <ConfirmDialog
    isOpen={confirmState.type !== null}
    title={getConfirmTitle(confirmState.type)}
    message={getConfirmMessage(confirmState.type, confirmState.projectName)}
    onConfirm={handleConfirmAction}
    onCancel={() => setConfirmState({ type: null, projectId: null, projectName: null })}
  />
</div>
```

## Styling

```css
.dashboard-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.tab-navigation {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 16px;
}

.tab-navigation button {
  padding: 12px 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-navigation button.active {
  border-bottom-color: #1976d2;
  color: #1976d2;
  font-weight: 600;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 20px;
  color: #666;
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl/Cmd + N` | New Project |
| `Ctrl/Cmd + F` | Focus Search |
| `Ctrl/Cmd + K` | Toggle Archive/Active |
| `Escape` | Close Modal |

## Usage Examples

### Basic Page Rendering

```tsx
import DashboardPage from '@/app/(main)/dashboard/page';

export default function DashboardRoute() {
  return <DashboardPage />;
}
```

### With Custom Empty State

```tsx
{filteredProjects.length === 0 && (
  <div className="empty-state">
    {activeTab === 'active' ? (
      <>
        <h2>No active projects</h2>
        <p>Create your first HVAC design project</p>
        <button onClick={() => setIsNewProjectOpen(true)}>
          Create Project
        </button>
      </>
    ) : (
      <p>No archived projects</p>
    )}
  </div>
)}
```

### With Keyboard Navigation

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      setIsNewProjectOpen(true);
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
      e.preventDefault();
      document.querySelector<HTMLInputElement>('[type="search"]')?.focus();
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setActiveTab(tab => tab === 'active' ? 'archived' : 'active');
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## State Flow Diagram

```
┌─────────────────────────────────────────────────┐
│              Dashboard Page State               │
├─────────────────────────────────────────────────┤
│                                                 │
│  User Opens Page                                │
│    └─> Load projects from projectListStore     │
│         └─> Display in grid (active tab)        │
│                                                 │
│  User Clicks "New Project"                      │
│    └─> Open NewProjectDialog                    │
│         └─> User fills form                     │
│              └─> Submit                         │
│                   └─> addProject() to store     │
│                        └─> Navigate to editor   │
│                                                 │
│  User Clicks "Delete" on ProjectCard            │
│    └─> Set confirmState                         │
│         └─> Show ConfirmDialog                  │
│              └─> User confirms                  │
│                   └─> deleteProject() from store│
│                        └─> Show toast           │
│                             └─> Clear confirm   │
│                                                 │
│  User Switches to "Archived" Tab                │
│    └─> setActiveTab('archived')                 │
│         └─> Display archivedProjects            │
│                                                 │
│  User Searches "Office"                         │
│    └─> setSearchQuery('Office')                 │
│         └─> Filter displayedProjects            │
│              └─> Re-render grid                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Related Elements

- [ProjectListStore](../02-stores/projectListStore.md) - Project list state management
- [NewProjectDialog](../01-components/dashboard/NewProjectDialog.md) - Project creation modal
- [ProjectCard](../01-components/dashboard/ProjectCard.md) - Individual project card
- [ConfirmDialog](../01-components/dashboard/ConfirmDialog.md) - Confirmation modal
- [CanvasEditorPage](./CanvasEditorPage.md) - Canvas editor page (navigation target)
- [HomePage](./HomePage.md) - Landing page with dashboard link

## Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from './page';
import { useProjectListStore } from '@/core/store/projectListStore';

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    // Clear store
    useProjectListStore.setState({
      projects: [],
      archivedProjects: [],
    });
  });

  it('renders with empty state', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('No active projects yet')).toBeInTheDocument();
  });

  it('displays active projects', () => {
    useProjectListStore.setState({
      projects: [
        {
          id: '1',
          name: 'Office HVAC',
          createdAt: '2025-01-01',
          modifiedAt: '2025-01-02',
          entityCount: 5,
        },
        {
          id: '2',
          name: 'Warehouse Design',
          createdAt: '2025-01-03',
          modifiedAt: '2025-01-04',
          entityCount: 10,
        },
      ],
    });

    render(<DashboardPage />);

    expect(screen.getByText('Office HVAC')).toBeInTheDocument();
    expect(screen.getByText('Warehouse Design')).toBeInTheDocument();
  });

  it('opens new project dialog', () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByText('New Project'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
  });

  it('creates new project', async () => {
    const { addProject } = useProjectListStore.getState();
    render(<DashboardPage />);

    // Open dialog
    fireEvent.click(screen.getByText('New Project'));

    // Fill form
    fireEvent.change(screen.getByLabelText('Project Name'), {
      target: { value: 'New Office' },
    });
    fireEvent.change(screen.getByLabelText('Client Name'), {
      target: { value: 'Acme Corp' },
    });

    // Submit
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      const projects = useProjectListStore.getState().projects;
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('New Office');
      expect(projects[0].clientName).toBe('Acme Corp');
    });
  });

  it('deletes project with confirmation', async () => {
    useProjectListStore.setState({
      projects: [{ id: '1', name: 'Test Project' }],
    });

    render(<DashboardPage />);

    // Click delete
    const deleteButton = screen.getByLabelText('Delete project');
    fireEvent.click(deleteButton);

    // Confirm dialog appears
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();

    // Confirm deletion
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(useProjectListStore.getState().projects).toHaveLength(0);
    });
  });

  it('switches between active and archived tabs', () => {
    useProjectListStore.setState({
      projects: [{ id: '1', name: 'Active Project' }],
      archivedProjects: [{ id: '2', name: 'Archived Project' }],
    });

    render(<DashboardPage />);

    // Active tab
    expect(screen.getByText('Active Project')).toBeInTheDocument();
    expect(screen.queryByText('Archived Project')).not.toBeInTheDocument();

    // Switch to archived
    fireEvent.click(screen.getByText(/Archived/));

    expect(screen.queryByText('Active Project')).not.toBeInTheDocument();
    expect(screen.getByText('Archived Project')).toBeInTheDocument();
  });

  it('filters projects by search query', () => {
    useProjectListStore.setState({
      projects: [
        { id: '1', name: 'Office HVAC' },
        { id: '2', name: 'Warehouse Design' },
      ],
    });

    render(<DashboardPage />);

    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'Office' } });

    expect(screen.getByText('Office HVAC')).toBeInTheDocument();
    expect(screen.queryByText('Warehouse Design')).not.toBeInTheDocument();
  });

  it('duplicates project', async () => {
    useProjectListStore.setState({
      projects: [{ id: '1', name: 'Original' }],
    });

    render(<DashboardPage />);

    const duplicateButton = screen.getByLabelText('Duplicate project');
    fireEvent.click(duplicateButton);

    await waitFor(() => {
      const projects = useProjectListStore.getState().projects;
      expect(projects).toHaveLength(2);
      expect(projects[1].name).toBe('Original (Copy)');
    });
  });

  it('archives and restores project', async () => {
    useProjectListStore.setState({
      projects: [{ id: '1', name: 'Test Project' }],
    });

    render(<DashboardPage />);

    // Archive
    const archiveButton = screen.getByLabelText('Archive project');
    fireEvent.click(archiveButton);

    await waitFor(() => {
      expect(useProjectListStore.getState().projects).toHaveLength(0);
      expect(useProjectListStore.getState().archivedProjects).toHaveLength(1);
    });

    // Switch to archived tab
    fireEvent.click(screen.getByText(/Archived/));

    // Restore
    const restoreButton = screen.getByLabelText('Restore project');
    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(useProjectListStore.getState().projects).toHaveLength(1);
      expect(useProjectListStore.getState().archivedProjects).toHaveLength(0);
    });
  });
});
```
