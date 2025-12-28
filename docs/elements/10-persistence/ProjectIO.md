# Project IO

## Overview

Project IO provides high-level functions for saving and loading project files with backup support, error handling, and automatic migration.

## Location

```
src/core/persistence/projectIO.ts
```

## Functions

### saveProject

Save project to .sws file with automatic backup.

```typescript
export async function saveProject(project: ProjectFile, path: string): Promise<IOResult>
```

**Behavior:**
1. Serialize project to JSON
2. Create .bak backup of existing file
3. Write new file
4. Return success/error

### loadProject

Load project from .sws file with fallback to backup.

```typescript
export async function loadProject(path: string): Promise<LoadResult>
```

**Behavior:**
1. Check file exists
2. Read and deserialize
3. Migrate if needed
4. Fall back to .bak if corrupted

### loadBackup

Load from .bak backup file.

```typescript
export async function loadBackup(originalPath: string): Promise<LoadResult>
```

### projectExists

Check if project file exists.

```typescript
export async function projectExists(path: string): Promise<boolean>
```

## Usage

```typescript
import { saveProject, loadProject } from '@/core/persistence/projectIO';

// Save
const result = await saveProject(projectData, '/path/to/project.sws');
if (result.success) {
  console.log('Saved!');
}

// Load
const loaded = await loadProject('/path/to/project.sws');
if (loaded.success && loaded.project) {
  console.log('Loaded:', loaded.project);
  if (loaded.loadedFromBackup) {
    console.warn('Loaded from backup');
  }
}
```

## Related Elements

- [Serialization](./Serialization.md)
- [FileSystem](./FileSystem.md)
- [Project Schema](../03-schemas/ProjectFileSchema.md)
