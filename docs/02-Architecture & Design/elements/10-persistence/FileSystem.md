# FileSystem

## Overview

FileSystem provides unified file I/O API that works in both Tauri desktop and web environments with graceful fallbacks.

## Location

```text
src/core/persistence/filesystem.ts
```

## Functions

### isTauri

```typescript
export function isTauri(): boolean
```

### readTextFile

```typescript
export async function readTextFile(path: string): Promise<string>
```

### writeTextFile

```typescript
export async function writeTextFile(path: string, content: string): Promise<void>
```

### exists

```typescript
export async function exists(path: string): Promise<boolean>
```

Returns `false` in web environments.

### createDir

```typescript
export async function createDir(path: string, recursive = true): Promise<void>
```

### readDir

```typescript
export async function readDir(path: string): Promise<string[]>
```

Returns an empty array in web environments.

### getDocumentsDir

```typescript
export async function getDocumentsDir(): Promise<string>
```

Returns an empty string in web environments.

### copyFile / removeFile / renameFile

```typescript
export async function copyFile(source: string, destination: string): Promise<void>
export async function removeFile(path: string): Promise<void>
export async function renameFile(oldPath: string, newPath: string): Promise<void>
```

## Usage

```typescript
import { readTextFile, writeTextFile, isTauri } from '@/core/persistence/filesystem';

if (isTauri()) {
  const content = await readTextFile('/path/to/file.txt');
  await writeTextFile('/path/to/output.txt', 'Hello!');
} else {
  console.log('File system not available in web mode');
}
```

## Related Elements

- [ProjectIO](./ProjectIO.md)

## Storage Abstraction Layer

The `StorageAdapter` interface provides a unified persistence API across platforms, abstracting the differences between file-system based storage (Tauri) and browser storage (Web).

### Interface Reference

**Location**: `src/core/persistence/StorageAdapter.ts`

The `StorageAdapter` interface defines the complete contract for project persistence:

```typescript
interface StorageAdapter {
  // Project CRUD Operations
  saveProject(project: ProjectFile, options?: SaveOptions): Promise<SaveResult>;
  loadProject(projectId: string): Promise<LoadResult>;
  deleteProject(projectId: string): Promise<DeleteResult>;
  duplicateProject(projectId: string, newName: string): Promise<DuplicateResult>;
  
  // Project Discovery
  listProjects(): Promise<ProjectMetadata[]>;
  searchProjects(query: string): Promise<ProjectMetadata[]>;
  
  // Auto-Save Operations
  autoSave(project: ProjectFile): Promise<AutoSaveResult>;
  listAutoSaves(projectId: string): Promise<AutoSaveMetadata[]>;
  restoreAutoSave(projectId: string, timestamp: string): Promise<LoadResult>;
  cleanupAutoSaves(projectId: string, keepCount: number): Promise<void>;
  
  // Metadata & Auxiliary
  updateMetadata(projectId: string, metadata: Partial<ProjectMetadata>): Promise<void>;
  saveThumbnail(projectId: string, imageData: Blob): Promise<void>;
  getStorageInfo(): Promise<StorageInfo>;
}
```

### Type Definitions

All abstraction types are defined in `src/core/persistence/types.ts`:

#### Result Types

**SaveResult**:

- `success: boolean` - Whether the save succeeded
- `errorCode?: StorageErrorCode` - Error code if failed
- `error?: string` - Human-readable error message
- `filePath?: string` - Path where file was saved (Tauri only)
- `sizeBytes?: number` - Size of saved data in bytes

**LoadResult**:

- `success: boolean` - Whether the load succeeded
- `errorCode?: StorageErrorCode` - Error code if failed
- `error?: string` - Human-readable error message
- `project?: ProjectFile` - The loaded project data (if successful)
- `source?: 'file' | 'localStorage' | 'indexedDB'` - Where the project was loaded from
- `migrated?: boolean` - Whether schema migration was applied

**DeleteResult**:

- `success: boolean` - Whether the deletion succeeded
- `errorCode?: StorageErrorCode` - Error code if failed
- `error?: string` - Human-readable error message

**DuplicateResult**:

- Extends `LoadResult` with the newly created project data

**AutoSaveResult**:

- Extends `SaveResult` with:
  - `timestamp: string` - ISO timestamp of the auto-save
  - `autoSaveId: string` - Unique ID for this auto-save

#### Configuration Types

**StorageConfig**:

- `baseDir?: string` - Base directory for file storage (**Tauri only**, defaults to Documents/HVAC_Projects)
- `autoSave?: Partial<AutoSaveConfig>` - Auto-save configuration
- `compression?: boolean` - Enable compression (**Web only**, defaults to true for IndexedDB)

**AutoSaveConfig**:

- `enabled: boolean` - Enable auto-save (default: `true`)
- `intervalMs: number` - Interval in milliseconds (default: `300000` - 5 minutes)
- `maxCopies: number` - Maximum auto-save copies to keep (default: `5`)
- `cleanupOnSave: boolean` - Cleanup old auto-saves on manual save (default: `true`)

**SaveOptions**:

- `createBackup?: boolean` - Create a backup copy before saving (default: `true`)
- `atomic?: boolean` - Use atomic writes to prevent corruption (default: `true`)
- `updateMetadata?: boolean` - Update metadata without full save (default: `false`)

#### Metadata Types

**AutoSaveMetadata**:

- `projectId: string` - Project UUID
- `timestamp: string` - ISO timestamp
- `autoSaveId: string` - Unique auto-save ID
- `sizeBytes: number` - Size in bytes
- `source: 'file' | 'localStorage' | 'indexedDB'` - Storage mechanism

**StorageInfo**:

- `platform: 'tauri' | 'web'` - Current platform
- `totalBytes?: number` - Total available space (if known)
- `usedBytes?: number` - Used space (if known)
- `availableBytes?: number` - Available space (if known)
- `quotaExceeded?: boolean` - Whether quota is exceeded
- `storageType: 'filesystem' | 'localStorage' | 'indexedDB'` - Active storage mechanism

### Error Codes

Extended error codes defined in `StorageErrorCode` type:

#### Standard I/O Errors (from `IOErrorCode`)

- `FILE_NOT_FOUND` - Project or auto-save file does not exist
- `PERMISSION_DENIED` - Insufficient permissions to read/write
- `INVALID_PATH` - Path is malformed or invalid
- `READ_ERROR` - Generic read failure
- `WRITE_ERROR` - Generic write failure
- `VALIDATION_ERROR` - Project data failed schema validation
- `CORRUPTED_FILE` - File exists but contents are corrupted/unparseable
- `UNKNOWN` - Unclassified error

#### Storage-Specific Errors

- `QUOTA_EXCEEDED` - Web storage quota exceeded (Web only)
- `MIGRATION_REQUIRED` - Project schema is outdated and requires migration
- `BACKUP_FAILED` - Backup creation failed (non-fatal if atomic writes succeed)
- `ATOMIC_WRITE_FAILED` - Atomic write operation failed (data may be in inconsistent state)

### Factory Usage

Use `createStorageAdapter()` to obtain the adapter for the current environment:

```typescript
import { createStorageAdapter } from '@/core/persistence';

// Basic usage (uses defaults)
const storage = await createStorageAdapter();

// With configuration
const storage = await createStorageAdapter({
  baseDir: '/custom/path',  // Tauri only
  autoSave: {
    enabled: true,
    intervalMs: 60000,  // 1 minute
    maxCopies: 10
  },
  compression: true  // Web only
});

// List all projects
const projects = await storage.listProjects();

// Save a project
const result = await storage.saveProject(myProject, {
  createBackup: true,
  atomic: true
});

if (result.success) {
  console.log('Saved to:', result.filePath);
} else {
  console.error('Save failed:', result.errorCode, result.error);
}
```

### Platform Implementations

#### Tauri (Desktop)

- **Adapter**: `TauriStorageAdapter` (implemented)
- **Storage Mechanism**: Direct file system access via Tauri APIs
- **Project Location**: `Documents/SizeWise/Projects/{projectId}/{projectId}.hvac`
- **Auto-Saves**: `Documents/SizeWise/Projects/{projectId}/.autosave/{timestamp}.hvac` (rolling window of 5)
- **Backups**: `Documents/SizeWise/Projects/{projectId}/{projectId}.hvac.bak` (created before each save)
- **Metadata**: `Documents/SizeWise/Projects/{projectId}/.metadata/` (thumbnails, preferences)
- **Exports**: `Documents/SizeWise/Projects/{projectId}/exports/` (PDF, CSV outputs)
- **Atomic Writes**: Write to `.tmp` file, then rename (prevents corruption on crash)
- **Quota**: Limited by disk space only
- **Performance**: Fast, direct I/O

**Folder Structure**:

```text
Documents/SizeWise/Projects/
└── {projectId}/
    ├── {projectId}.hvac              # Main project file
    ├── {projectId}.hvac.bak          # Backup (created on save)
    ├── .autosave/                    # Auto-save folder
    │   ├── 2024-01-15T10-30-00.hvac
    │   ├── 2024-01-15T10-35-00.hvac
    │   └── ... (last 5 copies)
    ├── .metadata/                    # Metadata folder
    │   ├── thumbnail.png
    │   ├── recent.json
    │   └── preferences.json
    └── exports/                      # Export outputs
        ├── {projectName}.pdf
        └── {projectName}-BOM.csv
```


#### Web (Browser)

- **Adapter**: `WebStorageAdapter` (placeholder - not yet implemented)
- **Storage Mechanism**: IndexedDB (preferred) with localStorage fallback
- **Project Location**: IndexedDB object store `projects`, indexed by `projectId`
- **Auto-Saves**: IndexedDB object store `autoSaves`, compound index on `(projectId, timestamp)`
- **Backups**: Not implemented (browser storage is already redundant)
- **Atomic Writes**: Leverages IndexedDB's transaction guarantee
- **Quota**: Browser-dependent (~50MB-10GB), checked via `navigator.storage.estimate()`
- **Performance**: Slower than filesystem, async-only
- **Compression**: Optional (via pako/LZ-string for large projects)

### Migration from `projectIO`

The new abstraction layer extends and eventually replaces `projectIO` functions:

| Old (`projectIO`) | New (`StorageAdapter`) | Notes |
| --- | --- | --- |
| `saveProjectFile()` | `saveProject()` | Now returns `SaveResult` with richer metadata |
| `loadProjectFile()` | `loadProject()` | Auto-detects and migrates outdated schemas |
| `deleteProjectFile()` | `deleteProject()` | Also removes auto-saves and backups |
| N/A | `duplicateProject()` | New feature |
| `listAvailableProjects()` | `listProjects()` | Same functionality, clearer naming |
| N/A | `searchProjects()` | New feature |
| N/A | `autoSave()` | New feature |
| N/A | `listAutoSaves()` | New feature |
| N/A | `restoreAutoSave()` | New feature |
| N/A | `updateMetadata()` | New feature (fast metadata-only update) |
| N/A | `saveThumbnail()` | New feature |
| N/A | `getStorageInfo()` | New feature |

**Migration Strategy**:

1. Keep `projectIO` as-is for backward compatibility
2. Refactor components to use `StorageAdapter` via factory
3. Deprecate `projectIO` in phase 2 (TBD)
4. Remove `projectIO` in phase 3 (TBD)

### Current Status

**✅ `TauriStorageAdapter` Implemented** (ticket:c357d1a4-8bad-4027-9d44-57d4788c9f4c/337504b1-ed25-473e-99c4-eedbc73e5a05):

- Full implementation of `StorageAdapter` interface
- Nested folder structure with `.hvac` extension
- Atomic writes with temp-file-then-rename pattern
- Auto-save with rolling window (5 copies)
- Backup creation before overwriting
- Comprehensive error handling with typed error codes
- Unit tested (80%+ coverage)

**⚠️ Placeholder Implementation for Web**: The factory returns a `WebPlaceholderAdapter` that throws "not implemented" errors when any method is called. This allows the abstraction to be integrated and tested without blocking other development.

**Future Work**:

- Implement `WebStorageAdapter` (ticket TBD)
- Add migration logic from `projectIO` (ticket TBD)
- Add comprehensive integration tests (ticket TBD)


## Platform Availability

- **Platform-Specific**: Unified API with disparate implementations for Tauri (full file system access) and Web (graceful fallbacks or no-op).

## Related User Journeys

- [UJ-PM-001 (Hybrid)](../../user-journeys/hybrid/01-project-management/UJ-PM-001-CreateNewProject.md)
- [UJ-PM-001 (Tauri)](../../user-journeys/tauri-offline/01-project-management/UJ-PM-001-CreateNewProject.md)
- [UJ-PM-008 (Tauri)](../../user-journeys/tauri-offline/08-file-management/UJ-PM-008-ExportReport.md)
