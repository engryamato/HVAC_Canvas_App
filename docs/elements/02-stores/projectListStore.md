# projectListStore

## Overview

The projectListStore is a Zustand store that manages the list of all projects in the application. It provides CRUD operations for project metadata and persists the project index to localStorage.

## Location

```
src/features/dashboard/store/projectListStore.ts
```

## Purpose

- Maintain index of all projects (metadata only, not full project data)
- Support CRUD operations (add, update, remove projects)
- Enable project archiving and restoration
- Provide project duplication functionality
- Persist project list to localStorage for session recovery
- Filter projects by archived status

## Dependencies

- `zustand` - State management library
- `zustand/middleware` - Persistence middleware

## State Structure

### ProjectListItem

```typescript
interface ProjectListItem {
  projectId: string;       // Unique project identifier (UUID)
  projectName: string;     // User-visible project name
  projectNumber?: string;  // Optional project number (e.g., "2024-001")
  clientName?: string;     // Optional client name
  createdAt: string;       // ISO 8601 timestamp
  modifiedAt: string;      // ISO 8601 timestamp
  storagePath: string;     // Storage key for project data
  isArchived: boolean;     // Whether project is archived
}
```

### ProjectListState

```typescript
interface ProjectListState {
  projects: ProjectListItem[]; // Array of all projects
  loading: boolean;            // Loading state (currently unused)
  error?: string;              // Error message (currently unused)
}
```

**Initial State**:
```typescript
{
  projects: [],
  loading: false
}
```

**Persistence**:
- Persisted to localStorage under key: `sws.projectIndex`
- Only metadata stored here (full project data stored separately)
- Automatically syncs on state changes

## Actions

### CRUD Operations

| Action | Signature | Description |
|--------|-----------|-------------|
| `addProject` | `(project: ProjectListItem) => void` | Add new project to list (prepends to array) |
| `updateProject` | `(projectId: string, updates: Partial<ProjectListItem>) => void` | Update project metadata, auto-updates modifiedAt |
| `removeProject` | `(projectId: string) => void` | Permanently remove project from list |

### Archive Operations

| Action | Signature | Description |
|--------|-----------|-------------|
| `archiveProject` | `(projectId: string) => void` | Mark project as archived, updates modifiedAt |
| `restoreProject` | `(projectId: string) => void` | Unarchive project, updates modifiedAt |

### Duplication

| Action | Signature | Description |
|--------|-----------|-------------|
| `duplicateProject` | `(projectId: string, newName: string) => void` | Create copy of project with new name and ID |

## Implementation Details

### 1. Add Project (Prepend)

```typescript
addProject: (project) => {
  set((state) => ({ projects: [project, ...state.projects] }));
},
```

**Behavior**:
- Adds project to beginning of array (newest first)
- Does not check for duplicates (caller's responsibility)
- Immediately persists to localStorage

### 2. Update Project (Auto-timestamp)

```typescript
updateProject: (projectId, updates) => {
  set((state) => ({
    projects: state.projects.map((p) =>
      p.projectId === projectId
        ? { ...p, ...updates, modifiedAt: new Date().toISOString() }
        : p
    ),
  }));
},
```

**Behavior**:
- Merges partial updates with existing project
- Automatically updates `modifiedAt` to current timestamp
- Does nothing if projectId not found

### 3. Remove Project

```typescript
removeProject: (projectId) => {
  set((state) => ({
    projects: state.projects.filter((p) => p.projectId !== projectId),
  }));
},
```

**Behavior**:
- Permanently removes project from list
- Does not delete associated project data (caller must handle)
- Immediately persists to localStorage

### 4. Archive Project

```typescript
archiveProject: (projectId) => {
  set((state) => ({
    projects: state.projects.map((p) =>
      p.projectId === projectId
        ? { ...p, isArchived: true, modifiedAt: new Date().toISOString() }
        : p
    ),
  }));
},
```

**Behavior**:
- Sets `isArchived` to true
- Updates `modifiedAt`
- Project remains in list but hidden from active projects view

### 5. Restore Project

```typescript
restoreProject: (projectId) => {
  set((state) => ({
    projects: state.projects.map((p) =>
      p.projectId === projectId
        ? { ...p, isArchived: false, modifiedAt: new Date().toISOString() }
        : p
    ),
  }));
},
```

**Behavior**:
- Sets `isArchived` to false
- Updates `modifiedAt`
- Project appears in active projects view

### 6. Duplicate Project

```typescript
duplicateProject: (projectId, newName) => {
  const source = get().projects.find((p) => p.projectId === projectId);
  if (!source) {
    return;
  }
  const now = new Date().toISOString();
  const newProjectId = crypto.randomUUID();
  const newProject: ProjectListItem = {
    ...source,
    projectId: newProjectId,
    projectName: newName,
    createdAt: now,
    modifiedAt: now,
    storagePath: `project-${newProjectId}`,
    isArchived: false,
  };
  set((state) => ({ projects: [newProject, ...state.projects] }));
},
```

**Behavior**:
- Creates new project with new UUID
- Copies all metadata from source project
- Sets new name, timestamps, and storage path
- Unarchives by default
- Prepends to project list
- Does nothing if source project not found

**Note**: This only duplicates metadata. Caller must duplicate actual project data separately.

## Selectors

### Hook Selectors (React)

Use these in React components for automatic re-renders:

```typescript
// Get all projects
const projects = useProjects();

// Get only active (non-archived) projects
const activeProjects = useActiveProjects();

// Get only archived projects
const archivedProjects = useArchivedProjects();
```

### Actions Hook

```typescript
const {
  addProject,
  updateProject,
  removeProject,
  archiveProject,
  restoreProject,
  duplicateProject,
} = useProjectListActions();
```

## Usage Examples

### Creating a New Project

```typescript
import { useProjectListActions } from '@/features/dashboard/store/projectListStore';

function NewProjectDialog() {
  const { addProject } = useProjectListActions();

  const handleCreate = (name: string, clientName?: string) => {
    const projectId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newProject: ProjectListItem = {
      projectId,
      projectName: name,
      projectNumber: undefined,
      clientName,
      createdAt: now,
      modifiedAt: now,
      storagePath: `project-${projectId}`,
      isArchived: false,
    };

    addProject(newProject);

    // Navigate to new project
    router.push(`/canvas/${projectId}`);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleCreate(formData.name, formData.client);
    }}>
      {/* Form fields */}
    </form>
  );
}
```

### Displaying Project List

```typescript
import { useActiveProjects } from '@/features/dashboard/store/projectListStore';

function ProjectList() {
  const projects = useActiveProjects();

  return (
    <div>
      {projects.map((project) => (
        <ProjectCard key={project.projectId} project={project} />
      ))}
    </div>
  );
}
```

### Updating Project Metadata

```typescript
import { useProjectListActions } from '@/features/dashboard/store/projectListStore';

function ProjectRenameDialog({ projectId, currentName }: Props) {
  const { updateProject } = useProjectListActions();

  const handleRename = (newName: string) => {
    updateProject(projectId, { projectName: newName });
  };

  return (
    <input
      defaultValue={currentName}
      onBlur={(e) => handleRename(e.target.value)}
    />
  );
}
```

### Archiving a Project

```typescript
import { useProjectListActions } from '@/features/dashboard/store/projectListStore';

function ArchiveButton({ projectId }: { projectId: string }) {
  const { archiveProject } = useProjectListActions();

  return (
    <button onClick={() => archiveProject(projectId)}>
      Archive Project
    </button>
  );
}
```

### Viewing Archived Projects

```typescript
import { useArchivedProjects, useProjectListActions } from '@/features/dashboard/store/projectListStore';

function ArchivedProjectsList() {
  const archivedProjects = useArchivedProjects();
  const { restoreProject, removeProject } = useProjectListActions();

  return (
    <div>
      <h2>Archived Projects</h2>
      {archivedProjects.map((project) => (
        <div key={project.projectId}>
          <span>{project.projectName}</span>
          <button onClick={() => restoreProject(project.projectId)}>
            Restore
          </button>
          <button onClick={() => removeProject(project.projectId)}>
            Delete Permanently
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Duplicating a Project

```typescript
import { useProjectListActions } from '@/features/dashboard/store/projectListStore';

function DuplicateButton({ projectId, projectName }: Props) {
  const { duplicateProject } = useProjectListActions();

  const handleDuplicate = () => {
    const newName = `${projectName} (Copy)`;
    duplicateProject(projectId, newName);

    // Note: Must also duplicate actual project data separately
    // This only duplicates the metadata entry
  };

  return (
    <button onClick={handleDuplicate}>
      Duplicate Project
    </button>
  );
}
```

### Sorting Projects

```typescript
import { useProjects } from '@/features/dashboard/store/projectListStore';
import { useMemo } from 'react';

type SortBy = 'name' | 'date' | 'client';

function ProjectList() {
  const projects = useProjects();
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const sortedProjects = useMemo(() => {
    const filtered = projects.filter(p => !p.isArchived);

    switch (sortBy) {
      case 'name':
        return [...filtered].sort((a, b) =>
          a.projectName.localeCompare(b.projectName)
        );
      case 'date':
        return [...filtered].sort((a, b) =>
          new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
        );
      case 'client':
        return [...filtered].sort((a, b) =>
          (a.clientName || '').localeCompare(b.clientName || '')
        );
      default:
        return filtered;
    }
  }, [projects, sortBy]);

  return (
    <div>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
        <option value="date">Modified Date</option>
        <option value="name">Name</option>
        <option value="client">Client</option>
      </select>

      {sortedProjects.map((project) => (
        <ProjectCard key={project.projectId} project={project} />
      ))}
    </div>
  );
}
```

### Search/Filter Projects

```typescript
import { useActiveProjects } from '@/features/dashboard/store/projectListStore';
import { useMemo, useState } from 'react';

function ProjectSearch() {
  const projects = useActiveProjects();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return projects.filter(p =>
      p.projectName.toLowerCase().includes(term) ||
      p.clientName?.toLowerCase().includes(term) ||
      p.projectNumber?.toLowerCase().includes(term)
    );
  }, [projects, searchTerm]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search projects..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {filteredProjects.map((project) => (
        <ProjectCard key={project.projectId} project={project} />
      ))}
    </div>
  );
}
```

## Persistence Details

### LocalStorage Key

```typescript
const INDEX_KEY = 'sws.projectIndex';
```

Stored in localStorage as JSON:
```json
{
  "state": {
    "projects": [
      {
        "projectId": "123e4567-e89b-12d3-a456-426614174000",
        "projectName": "Office HVAC Design",
        "clientName": "Acme Corp",
        "createdAt": "2024-12-01T10:00:00.000Z",
        "modifiedAt": "2024-12-29T15:30:00.000Z",
        "storagePath": "project-123e4567-e89b-12d3-a456-426614174000",
        "isArchived": false
      }
    ],
    "loading": false
  },
  "version": 0
}
```

### Storage Separation

**Important**: The project list store only stores metadata. Full project data (entities, settings, etc.) is stored separately:

- **Project Index**: `sws.projectIndex` (this store)
- **Project Data**: `project-{projectId}` (separate storage)

This separation allows:
1. Fast project list loading (no need to parse full project data)
2. Independent project metadata updates
3. Efficient search/filter operations

## Performance Optimization

### 1. Use Filtered Selectors

**Good** (only subscribes to active projects):
```typescript
const activeProjects = useActiveProjects();
```

**Bad** (subscribes to all projects, filters in component):
```typescript
const projects = useProjects();
const activeProjects = projects.filter(p => !p.isArchived);
```

### 2. Memoize Computed Values

```typescript
const sortedProjects = useMemo(() => {
  return [...projects].sort((a, b) => a.projectName.localeCompare(b.projectName));
}, [projects]);
```

### 3. Avoid Unnecessary Updates

Only call `updateProject` when values actually change:
```typescript
const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
  const newValue = e.target.value;
  if (newValue !== project.projectName) {
    updateProject(project.projectId, { projectName: newValue });
  }
};
```

## Related Elements

- [ProjectStore](./projectStore.md) - Manages current project's full data
- [Dashboard](../01-components/dashboard/Dashboard.md) - Main project list view
- [ProjectCard](../01-components/dashboard/ProjectCard.md) - Individual project display
- [NewProjectDialog](../01-components/dashboard/NewProjectDialog.md) - Creates new projects
- [ProjectIO](../10-persistence/ProjectIO.md) - Handles project file operations

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useProjectListStore } from './projectListStore';

describe('projectListStore', () => {
  beforeEach(() => {
    // Clear store and localStorage
    useProjectListStore.setState({ projects: [], loading: false });
    localStorage.clear();
  });

  const createMockProject = (overrides?: Partial<ProjectListItem>): ProjectListItem => ({
    projectId: crypto.randomUUID(),
    projectName: 'Test Project',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    storagePath: `project-${crypto.randomUUID()}`,
    isArchived: false,
    ...overrides,
  });

  it('adds project to list', () => {
    const project = createMockProject();

    act(() => {
      useProjectListStore.getState().addProject(project);
    });

    expect(useProjectListStore.getState().projects).toContainEqual(project);
  });

  it('prepends new project to list', () => {
    const project1 = createMockProject({ projectName: 'Project 1' });
    const project2 = createMockProject({ projectName: 'Project 2' });

    act(() => {
      useProjectListStore.getState().addProject(project1);
      useProjectListStore.getState().addProject(project2);
    });

    const projects = useProjectListStore.getState().projects;
    expect(projects[0].projectName).toBe('Project 2'); // Newest first
    expect(projects[1].projectName).toBe('Project 1');
  });

  it('updates project metadata', () => {
    const project = createMockProject();

    act(() => {
      useProjectListStore.getState().addProject(project);
      useProjectListStore.getState().updateProject(project.projectId, {
        projectName: 'Updated Name',
        clientName: 'New Client',
      });
    });

    const updated = useProjectListStore.getState().projects[0];
    expect(updated.projectName).toBe('Updated Name');
    expect(updated.clientName).toBe('New Client');
    expect(updated.modifiedAt).not.toBe(project.modifiedAt); // Auto-updated
  });

  it('removes project from list', () => {
    const project = createMockProject();

    act(() => {
      useProjectListStore.getState().addProject(project);
      useProjectListStore.getState().removeProject(project.projectId);
    });

    expect(useProjectListStore.getState().projects).toHaveLength(0);
  });

  it('archives project', () => {
    const project = createMockProject();

    act(() => {
      useProjectListStore.getState().addProject(project);
      useProjectListStore.getState().archiveProject(project.projectId);
    });

    const archived = useProjectListStore.getState().projects[0];
    expect(archived.isArchived).toBe(true);
  });

  it('restores archived project', () => {
    const project = createMockProject({ isArchived: true });

    act(() => {
      useProjectListStore.getState().addProject(project);
      useProjectListStore.getState().restoreProject(project.projectId);
    });

    const restored = useProjectListStore.getState().projects[0];
    expect(restored.isArchived).toBe(false);
  });

  it('duplicates project', () => {
    const original = createMockProject({
      projectName: 'Original',
      clientName: 'Client A'
    });

    act(() => {
      useProjectListStore.getState().addProject(original);
      useProjectListStore.getState().duplicateProject(original.projectId, 'Duplicate');
    });

    const projects = useProjectListStore.getState().projects;
    expect(projects).toHaveLength(2);

    const duplicate = projects[0]; // Newest (prepended)
    expect(duplicate.projectName).toBe('Duplicate');
    expect(duplicate.clientName).toBe('Client A'); // Copied
    expect(duplicate.projectId).not.toBe(original.projectId); // New ID
    expect(duplicate.isArchived).toBe(false); // Always unarchived
  });

  it('persists to localStorage', () => {
    const project = createMockProject();

    act(() => {
      useProjectListStore.getState().addProject(project);
    });

    const stored = JSON.parse(localStorage.getItem('sws.projectIndex')!);
    expect(stored.state.projects).toContainEqual(project);
  });
});
```
