# Project IO

## Overview

Project IO provides high-level functions for saving and loading `.sws` project files with backup, validation, and migration support.

## Location

```
src/core/persistence/projectIO.ts
```

## Types

```typescript
export type IOErrorCode =
  | 'FILE_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'VALIDATION_ERROR'
  | 'PARSE_ERROR'
  | 'UNKNOWN';

export interface IOResult {
  success: boolean;
  error?: string;
  errorCode?: IOErrorCode;
}

export interface LoadResult extends IOResult {
  project?: ProjectFile;
  loadedFromBackup?: boolean;
  migrated?: boolean;
  originalVersion?: string;
}
```

## Functions

### saveProject

```typescript
export async function saveProject(project: ProjectFile, path: string): Promise<IOResult>
```

- Serializes with `serializeProject` (schema validation required).
- Creates a `.bak` backup if the file exists.
- Writes the new `.sws` file.

### loadProject

```typescript
export async function loadProject(path: string): Promise<LoadResult>
```

- Reads and deserializes JSON using `deserializeProject`.
- If schema mismatch is detected, attempts `migrateProject`.
- If the main file is corrupted, falls back to `.bak` via `loadBackup`.

### loadBackup

```typescript
export async function loadBackup(originalPath: string): Promise<LoadResult>
```

### projectExists

```typescript
export async function projectExists(path: string): Promise<boolean>
```

### getBackupPath

```typescript
export function getBackupPath(projectPath: string): string
```

### deleteProject

```typescript
export async function deleteProject(path: string): Promise<IOResult>
```

Deletes the `.sws` file and its `.bak` backup.

### duplicateProject

```typescript
export async function duplicateProject(
  sourcePath: string,
  newName: string,
  destinationPath?: string
): Promise<LoadResult>
```

Loads the source project, clones it with a new UUID and name, and saves it to a new path.

## Related Elements

- [Serialization](./Serialization.md) - JSON serialization utilities
- [FileSystem](./FileSystem.md) - File system abstraction layer
- [ProjectFileSchema](../03-schemas/ProjectFileSchema.md) - Project validation schema
- [useAutoSave](../07-hooks/useAutoSave.md) - Auto-save hook
