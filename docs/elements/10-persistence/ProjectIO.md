# Project IO

## Overview

Project IO provides high-level functions for saving and loading project files with automatic backup support, error handling, schema validation, and migration capabilities. It serves as the primary interface between the application and the file system.

## Location

```
src/core/persistence/projectIO.ts
```

## Purpose

- Save projects to .sws files with automatic backup creation
- Load projects from .sws files with validation
- Handle file corruption with automatic backup recovery
- Migrate projects from older schema versions
- Provide consistent error handling for all file operations
- Manage project metadata and timestamps
- Support both Tauri (desktop) and web file system APIs

## Dependencies

- `@/core/schema/ProjectFileSchema` - Project validation
- `@/core/persistence/Serialization` - JSON serialization
- `@/core/persistence/FileSystem` - File system abstraction
- `@tauri-apps/api/fs` - Tauri file system (desktop)
- `zod` - Schema validation

## Type Definitions

### IOResult

```typescript
interface IOResult {
  success: boolean;
  error?: string;
  errorCode?: 'FILE_NOT_FOUND' | 'PERMISSION_DENIED' | 'VALIDATION_ERROR' | 'UNKNOWN';
}
```

### LoadResult

```typescript
interface LoadResult extends IOResult {
  project?: ProjectFile;
  loadedFromBackup?: boolean;
  migrated?: boolean;
  originalVersion?: string;
}
```

### SaveOptions

```typescript
interface SaveOptions {
  createBackup?: boolean;      // Default: true
  validateBeforeSave?: boolean; // Default: true
  overwrite?: boolean;         // Default: true
}
```

## Functions

### saveProject

Save a project to a .sws file with automatic backup.

```typescript
export async function saveProject(
  project: ProjectFile,
  path: string,
  options?: SaveOptions
): Promise<IOResult>
```

**Parameters:**
- `project`: The project data to save
- `path`: Absolute file path (e.g., `/path/to/project.sws`)
- `options`: Save options (optional)

**Returns:** IOResult with success status and optional error

**Behavior:**

```
┌─────────────────────────────────────────────────┐
│            Save Project Workflow                │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Validate Project (optional)                 │
│     └─ ProjectFileSchema.parse(project)         │
│                                                 │
│  2. Check if file exists                        │
│     └─ If exists → Create backup                │
│        └─ Copy project.sws → project.sws.bak    │
│                                                 │
│  3. Serialize to JSON                           │
│     └─ JSON.stringify(project, null, 2)         │
│                                                 │
│  4. Write to file                               │
│     └─ fs.writeFile(path, json)                 │
│                                                 │
│  5. Update modifiedAt timestamp                 │
│     └─ project.modifiedAt = new Date()          │
│                                                 │
│  6. Return success                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Example:**

```typescript
import { saveProject } from '@/core/persistence/projectIO';

const project: ProjectFile = {
  schemaVersion: '1.0.0',
  projectId: 'uuid-123',
  projectName: 'Office HVAC Design',
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T14:30:00Z',
  entities: { byId: {}, allIds: [] },
  viewportState: { panX: 0, panY: 0, zoom: 1 },
  settings: { unitSystem: 'imperial', gridSize: 12, gridVisible: true }
};

const result = await saveProject(project, '/path/to/project.sws');

if (result.success) {
  console.log('Project saved successfully!');
} else {
  console.error('Save failed:', result.error);
}
```

**Error Handling:**

```typescript
try {
  const result = await saveProject(project, path);

  if (!result.success) {
    switch (result.errorCode) {
      case 'PERMISSION_DENIED':
        alert('Cannot write to this location. Choose a different folder.');
        break;
      case 'VALIDATION_ERROR':
        alert('Project data is invalid. Please check your entities.');
        break;
      default:
        alert(`Save failed: ${result.error}`);
    }
  }
} catch (err) {
  console.error('Unexpected error:', err);
}
```

### loadProject

Load a project from a .sws file with validation and migration.

```typescript
export async function loadProject(
  path: string
): Promise<LoadResult>
```

**Parameters:**
- `path`: Absolute file path to the .sws file

**Returns:** LoadResult with project data or error

**Behavior:**

```
┌─────────────────────────────────────────────────┐
│            Load Project Workflow                │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Check file exists                           │
│     └─ If not → Return FILE_NOT_FOUND           │
│                                                 │
│  2. Read file contents                          │
│     └─ fs.readTextFile(path)                    │
│                                                 │
│  3. Parse JSON                                  │
│     └─ Try: JSON.parse(contents)                │
│     └─ Catch: Try backup recovery               │
│                                                 │
│  4. Validate schema                             │
│     └─ ProjectFileSchema.safeParse(data)        │
│     └─ If invalid → Try migration               │
│                                                 │
│  5. Migrate if needed                           │
│     └─ Check schemaVersion                      │
│     └─ Apply migrations (0.9 → 1.0, etc.)       │
│                                                 │
│  6. Return project data                         │
│     └─ With metadata: loadedFromBackup, migrated│
│                                                 │
└─────────────────────────────────────────────────┘
```

**Example:**

```typescript
import { loadProject } from '@/core/persistence/projectIO';

const result = await loadProject('/path/to/project.sws');

if (result.success && result.project) {
  // Hydrate application state
  useEntityStore.getState().hydrate(result.project.entities);
  useViewportStore.getState().setPan(result.project.viewportState.panX, result.project.viewportState.panY);
  useViewportStore.getState().setZoom(result.project.viewportState.zoom);

  // Notify user if loaded from backup
  if (result.loadedFromBackup) {
    alert('Project was restored from backup due to corruption.');
  }

  // Notify user if migrated
  if (result.migrated) {
    alert(`Project migrated from version ${result.originalVersion} to ${result.project.schemaVersion}`);
  }
} else {
  alert(`Load failed: ${result.error}`);
}
```

### loadBackup

Load the backup file (.sws.bak) for a project.

```typescript
export async function loadBackup(
  originalPath: string
): Promise<LoadResult>
```

**Parameters:**
- `originalPath`: Path to the original .sws file (will look for .sws.bak)

**Returns:** LoadResult with backup project data

**Example:**

```typescript
// Try loading main file
let result = await loadProject('/path/to/project.sws');

if (!result.success) {
  // Try backup
  console.log('Main file corrupted. Attempting backup recovery...');
  result = await loadBackup('/path/to/project.sws');

  if (result.success) {
    console.log('Recovered from backup!');
    // Optionally save backup as new main file
    await saveProject(result.project!, '/path/to/project.sws');
  }
}
```

### projectExists

Check if a project file exists at the given path.

```typescript
export async function projectExists(
  path: string
): Promise<boolean>
```

**Example:**

```typescript
const exists = await projectExists('/path/to/project.sws');

if (!exists) {
  console.log('Project not found. Creating new project...');
  await saveProject(newProject, '/path/to/project.sws');
}
```

### deleteProject

Delete a project file (moves to system trash).

```typescript
export async function deleteProject(
  path: string
): Promise<IOResult>
```

**Example:**

```typescript
const result = await deleteProject('/path/to/project.sws');

if (result.success) {
  console.log('Project moved to trash');
} else {
  console.error('Delete failed:', result.error);
}
```

## Migration System

### Schema Versions

The app supports automatic migration between schema versions:

```typescript
const SCHEMA_MIGRATIONS: Record<string, (data: any) => any> = {
  '0.9.0': migrateFrom_0_9_to_1_0,
  '1.0.0': migrateFrom_1_0_to_1_1,
  // Add new migrations here
};

function migrateFrom_0_9_to_1_0(oldProject: any): ProjectFile {
  return {
    ...oldProject,
    schemaVersion: '1.0.0',
    // Add new fields with defaults
    settings: {
      unitSystem: oldProject.unitSystem || 'imperial',
      gridSize: 12,
      gridVisible: true,
    },
  };
}
```

### Migration Example

```typescript
// Automatically applied during loadProject
const result = await loadProject('/old-project.sws');

if (result.migrated) {
  console.log(`Migrated from ${result.originalVersion} to ${result.project.schemaVersion}`);

  // Optionally save migrated version
  await saveProject(result.project, '/old-project.sws');
}
```

## Error Codes

| Code | Description | Common Causes | Solution |
|------|-------------|---------------|----------|
| `FILE_NOT_FOUND` | File does not exist | Wrong path, file moved | Check path or browse for file |
| `PERMISSION_DENIED` | Cannot read/write file | File in protected folder | Choose different location |
| `VALIDATION_ERROR` | Schema validation failed | Corrupted data, wrong version | Try backup or manual repair |
| `PARSE_ERROR` | JSON parsing failed | Corrupted file | Try backup recovery |
| `UNKNOWN` | Unexpected error | Various | Check logs for details |

## File Format

### .sws File Structure

```json
{
  "schemaVersion": "1.0.0",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "projectName": "Office HVAC Design",
  "projectNumber": "2025-001",
  "clientName": "Acme Corp",
  "createdAt": "2025-12-29T10:00:00Z",
  "modifiedAt": "2025-12-29T14:30:00Z",
  "entities": {
    "byId": {
      "room-123": { "id": "room-123", "type": "room", ... },
      "duct-456": { "id": "duct-456", "type": "duct", ... }
    },
    "allIds": ["room-123", "duct-456"]
  },
  "viewportState": {
    "panX": 0,
    "panY": 0,
    "zoom": 1
  },
  "settings": {
    "unitSystem": "imperial",
    "gridSize": 12,
    "gridVisible": true
  }
}
```

### Backup File (.sws.bak)

Created automatically before every save. Same format as .sws file.

## Usage Patterns

### Auto-Save Pattern

```typescript
import { saveProject } from '@/core/persistence/projectIO';
import { useAutoSave } from '@/features/canvas/hooks/useAutoSave';

function CanvasEditor({ projectPath }: { projectPath: string }) {
  const { save } = useAutoSave({
    enabled: true,
    debounceDelay: 2000,
    onSave: async () => {
      const project = buildProjectFromStores();
      const result = await saveProject(project, projectPath);

      if (!result.success) {
        console.error('Auto-save failed:', result.error);
        // Show error toast
      }

      return result.success;
    }
  });

  return <CanvasContainer />;
}
```

### Manual Save Pattern

```typescript
function SaveButton({ projectPath }: { projectPath: string }) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const project = buildProjectFromStores();
      const result = await saveProject(project, projectPath, {
        createBackup: true,
        validateBeforeSave: true
      });

      if (result.success) {
        toast.success('Project saved successfully!');
      } else {
        toast.error(`Save failed: ${result.error}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button onClick={handleSave} disabled={isSaving}>
      {isSaving ? 'Saving...' : 'Save'}
    </button>
  );
}
```

### Load with Error Recovery

```typescript
async function loadProjectWithRecovery(path: string): Promise<ProjectFile | null> {
  // Try main file
  let result = await loadProject(path);

  if (!result.success) {
    console.warn('Main file failed:', result.error);

    // Try backup
    result = await loadBackup(path);

    if (result.success) {
      console.log('Recovered from backup');

      // Ask user if they want to restore backup as main file
      const restore = confirm('Project recovered from backup. Restore as main file?');

      if (restore && result.project) {
        await saveProject(result.project, path);
      }

      return result.project || null;
    }

    // Both failed
    alert('Cannot load project. File may be corrupted beyond recovery.');
    return null;
  }

  return result.project || null;
}
```

## Performance Considerations

### Large Projects

For projects with >1000 entities:

```typescript
// Use streaming for very large files (future enhancement)
// Current implementation loads entire file into memory

// Workaround: Split large projects into multiple files
const saveProjectChunked = async (project: ProjectFile, basePath: string) => {
  // Save entities separately
  await saveJSON(`${basePath}.entities.json`, project.entities);

  // Save project metadata
  await saveJSON(`${basePath}.meta.json`, {
    ...project,
    entities: null // Reference only
  });
};
```

### Optimization Tips

```typescript
// ✅ Good: Validate once before save
const project = buildProject();
const validated = ProjectFileSchema.parse(project); // Throws if invalid
await saveProject(validated, path, { validateBeforeSave: false });

// ❌ Bad: Validate twice
await saveProject(project, path, { validateBeforeSave: true }); // Validates again
```

## Related Elements

- [Serialization](./Serialization.md) - JSON serialization utilities
- [FileSystem](./FileSystem.md) - File system abstraction layer
- [ProjectFileSchema](../03-schemas/ProjectFileSchema.md) - Project validation schema
- [useAutoSave](../07-hooks/useAutoSave.md) - Auto-save hook using ProjectIO
- [projectStore](../02-stores/projectStore.md) - Project metadata store
- [entityStore](../02-stores/entityStore.md) - Entity state (hydrated from loaded projects)

## Testing

```typescript
import { saveProject, loadProject, projectExists } from './projectIO';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readTextFile, writeTextFile, removeFile } from '@tauri-apps/api/fs';

describe('ProjectIO', () => {
  const testPath = '/tmp/test-project.sws';
  const backupPath = '/tmp/test-project.sws.bak';

  afterEach(async () => {
    // Cleanup
    try {
      await removeFile(testPath);
      await removeFile(backupPath);
    } catch {}
  });

  describe('saveProject', () => {
    it('saves project to file', async () => {
      const project: ProjectFile = {
        schemaVersion: '1.0.0',
        projectId: 'test-123',
        projectName: 'Test Project',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        entities: { byId: {}, allIds: [] },
        viewportState: { panX: 0, panY: 0, zoom: 1 },
        settings: { unitSystem: 'imperial', gridSize: 12, gridVisible: true }
      };

      const result = await saveProject(project, testPath);

      expect(result.success).toBe(true);
      expect(await projectExists(testPath)).toBe(true);
    });

    it('creates backup before overwriting', async () => {
      const original: ProjectFile = { /* ... */ };
      await saveProject(original, testPath);

      const updated: ProjectFile = { ...original, projectName: 'Updated' };
      await saveProject(updated, testPath);

      expect(await projectExists(backupPath)).toBe(true);

      const backupContent = await readTextFile(backupPath);
      const backup = JSON.parse(backupContent);
      expect(backup.projectName).toBe('Test Project');
    });

    it('validates project before save', async () => {
      const invalid: any = { schemaVersion: '1.0.0' }; // Missing required fields

      const result = await saveProject(invalid, testPath, {
        validateBeforeSave: true
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_ERROR');
    });

    it('handles permission errors', async () => {
      const project: ProjectFile = { /* ... */ };
      const protectedPath = '/root/project.sws'; // No write permission

      const result = await saveProject(project, protectedPath);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PERMISSION_DENIED');
    });
  });

  describe('loadProject', () => {
    it('loads project from file', async () => {
      const project: ProjectFile = { /* ... */ };
      await saveProject(project, testPath);

      const result = await loadProject(testPath);

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project?.projectId).toBe(project.projectId);
    });

    it('returns error if file not found', async () => {
      const result = await loadProject('/nonexistent.sws');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('FILE_NOT_FOUND');
    });

    it('migrates old schema versions', async () => {
      const oldProject = {
        schemaVersion: '0.9.0',
        projectId: 'test-123',
        projectName: 'Old Project',
        // Missing new fields like 'settings'
      };

      await writeTextFile(testPath, JSON.stringify(oldProject));

      const result = await loadProject(testPath);

      expect(result.success).toBe(true);
      expect(result.migrated).toBe(true);
      expect(result.originalVersion).toBe('0.9.0');
      expect(result.project?.schemaVersion).toBe('1.0.0');
      expect(result.project?.settings).toBeDefined();
    });

    it('recovers from backup if main file corrupted', async () => {
      const project: ProjectFile = { /* ... */ };

      // Save valid project
      await saveProject(project, testPath);

      // Corrupt main file
      await writeTextFile(testPath, 'CORRUPTED{{{');

      // Load should auto-recover from backup
      const result = await loadProject(testPath);

      expect(result.success).toBe(true);
      expect(result.loadedFromBackup).toBe(true);
      expect(result.project?.projectId).toBe(project.projectId);
    });
  });

  describe('projectExists', () => {
    it('returns true if file exists', async () => {
      const project: ProjectFile = { /* ... */ };
      await saveProject(project, testPath);

      const exists = await projectExists(testPath);

      expect(exists).toBe(true);
    });

    it('returns false if file does not exist', async () => {
      const exists = await projectExists('/nonexistent.sws');

      expect(exists).toBe(false);
    });
  });
});
```
