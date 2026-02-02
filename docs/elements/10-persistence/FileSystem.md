# FileSystem

## Overview

FileSystem provides unified file I/O API that works in both Tauri desktop and web environments with graceful fallbacks.

## Location

```
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

## Platform Availability

- **Platform-Specific**: Unified API with disparate implementations for Tauri (full file system access) and Web (graceful fallbacks or no-op).

## Related User Journeys

- [UJ-PM-001 (Hybrid)](../../user-journeys/hybrid/01-project-management/UJ-PM-001-CreateNewProject.md)
- [UJ-PM-001 (Tauri)](../../user-journeys/tauri-offline/01-project-management/UJ-PM-001-CreateNewProject.md)
- [UJ-PM-008 (Tauri)](../../user-journeys/tauri-offline/08-file-management/UJ-PM-008-ExportReport.md)
