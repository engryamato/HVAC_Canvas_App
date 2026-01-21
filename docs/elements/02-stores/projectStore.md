# Project Store

## Overview

The Project Store manages the currently active project's metadata and state. It tracks whether there are unsaved changes (dirty flag) and provides the project's identifying information used throughout the application.

## Location

```
src/core/store/project.store.ts
```

## Purpose

- Store current project ID and metadata
- Track unsaved changes (dirty state)
- Provide project context to canvas and other features
- Enable save/load operations with project identification

## Dependencies

- `zustand` - State management library
- `@/core/schema/project-file.schema` - Project type definitions

## Store Structure

```typescript
interface ProjectState {
  // Current project ID (null if no project open)
  currentProjectId: string | null;

  // Project details (metadata)
  projectDetails: ProjectDetails | null;

  // Whether project has unsaved changes
  isDirty: boolean;
}

interface ProjectDetails {
  projectId: string;
  projectName: string;
  projectNumber?: string;
  clientName?: string;
  location?: string;
  scope?: ProjectScope;
  siteConditions?: SiteConditions;
  createdAt: string;
  modifiedAt: string;
}
```

## Actions

### setProject

Sets the current project with its metadata.

```typescript
setProject: (id: string, details: ProjectDetails) => void
```

**Behavior:**
- Updates `currentProjectId` to the given ID
- Sets `projectDetails` with project metadata
- Resets `isDirty` to `false`

**Example:**
```typescript
const { setProject } = useProjectStore();

setProject('proj-123', {
  projectId: 'proj-123',
  projectName: 'HVAC Layout - Building A',
  projectNumber: 'P-2025-001',
  clientName: 'Acme Corp',
  createdAt: '2025-12-01T10:00:00Z',
  modifiedAt: '2025-12-28T15:30:00Z'
});
```

### setDirty

Marks the project as having unsaved changes.

```typescript
setDirty: (dirty: boolean) => void
```

**Behavior:**
- Sets `isDirty` flag
- Typically set to `true` when entities change
- Set to `false` after successful save

**Example:**
```typescript
const { setDirty } = useProjectStore();

// Mark as dirty when user makes changes
setDirty(true);

// Mark as clean after saving
await saveProject();
setDirty(false);
```

### clearProject

Clears the current project state.

```typescript
clearProject: () => void
```

**Behavior:**
- Sets `currentProjectId` to `null`
- Sets `projectDetails` to `null`
- Resets `isDirty` to `false`
- Called when navigating away from canvas

## Selectors

```typescript
// Get current project ID
const projectId = useProjectStore((state) => state.currentProjectId);

// Get project details
const details = useProjectStore((state) => state.projectDetails);

// Check if project has unsaved changes
const isDirty = useProjectStore((state) => state.isDirty);

// Check if a project is currently open
const hasProject = useProjectStore((state) => state.currentProjectId !== null);
```

## Hook Exports

```typescript
// Main store hook
export const useProjectStore = create<ProjectStore>()(...)

// Action hook
export const useProjectActions = () => useProjectStore((state) => ({
  setProject: state.setProject,
  setDirty: state.setDirty,
  clearProject: state.clearProject,
}));

// Selector hooks
export const useCurrentProjectId = () => useProjectStore((s) => s.currentProjectId);
export const useProjectDetails = () => useProjectStore((s) => s.projectDetails);
export const useIsDirty = () => useProjectStore((s) => s.isDirty);
export const useHasProject = () => useProjectStore((s) => s.currentProjectId !== null);
```

## Usage Examples

### Opening a Project

```typescript
function useOpenProject() {
  const { setProject } = useProjectActions();
  const { hydrate } = useEntityActions();

  const openProject = async (projectId: string) => {
    // Load project file
    const projectFile = await loadProject(projectId);

    // Set project metadata
    setProject(projectId, {
      projectId: projectFile.projectId,
      projectName: projectFile.projectName,
      projectNumber: projectFile.projectNumber,
      clientName: projectFile.clientName,
      location: projectFile.location,
      scope: projectFile.scope,
      siteConditions: projectFile.siteConditions,
      createdAt: projectFile.createdAt,
      modifiedAt: projectFile.modifiedAt,
    });

    // Load entities into entity store
    hydrate(projectFile.entities);
  };

  return openProject;
}
```

### Tracking Changes

```typescript
function useTrackChanges() {
  const { setDirty } = useProjectActions();
  const entities = useAllEntities();

  // Mark dirty when entities change
  useEffect(() => {
    setDirty(true);
  }, [entities, setDirty]);
}
```

### Unsaved Changes Warning

```typescript
function useUnsavedChangesWarning() {
  const isDirty = useIsDirty();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
}
```

## Integration Points

```
┌─────────────────┐     ┌─────────────────┐
│   Dashboard     │────▶│  projectStore   │
│   (open proj)   │     │                 │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
┌─────────────────┐     ┌─────────────────┐
│   CanvasPage    │◀────│   entityStore   │
│   (renders)     │     │   (changes)     │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Auto-save     │
│   (saves if     │
│    isDirty)     │
└─────────────────┘
```

## Related Elements

- [EntityStore](./entityStore.md) - Entity state management
- [ProjectListStore](./projectListStore.md) - All projects list
- [ProjectIO](../10-persistence/ProjectIO.md) - File operations
- [useAutoSave](../07-hooks/useAutoSave.md) - Auto-save hook

## Testing

```typescript
describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProjectId: null,
      projectDetails: null,
      isDirty: false,
    });
  });

  it('sets project correctly', () => {
    const { setProject } = useProjectStore.getState();

    setProject('proj-123', {
      projectId: 'proj-123',
      projectName: 'Test Project',
      createdAt: '2025-12-28T00:00:00Z',
      modifiedAt: '2025-12-28T00:00:00Z',
    });

    expect(useProjectStore.getState().currentProjectId).toBe('proj-123');
    expect(useProjectStore.getState().projectDetails?.projectName).toBe('Test Project');
    expect(useProjectStore.getState().isDirty).toBe(false);
  });

  it('tracks dirty state', () => {
    const { setDirty } = useProjectStore.getState();

    setDirty(true);
    expect(useProjectStore.getState().isDirty).toBe(true);

    setDirty(false);
    expect(useProjectStore.getState().isDirty).toBe(false);
  });

  it('clears project state', () => {
    const { setProject, clearProject } = useProjectStore.getState();

    setProject('proj-123', { projectId: 'proj-123', projectName: 'Test', createdAt: '', modifiedAt: '' });
    clearProject();

    expect(useProjectStore.getState().currentProjectId).toBeNull();
    expect(useProjectStore.getState().projectDetails).toBeNull();
  });
});
```
