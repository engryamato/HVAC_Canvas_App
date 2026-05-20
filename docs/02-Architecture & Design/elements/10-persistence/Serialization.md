# Serialization

## Overview

Serialization provides JSON serialization/deserialization with schema validation and version migration support.

## Location

```
src/core/persistence/serialization.ts
```

## Functions

### serializeProject

Convert project to JSON string with validation.

```typescript
export function serializeProject(project: ProjectFile): SerializationResult
```

### deserializeProject

Parse JSON to project with schema validation.

```typescript
export function deserializeProject(json: string): DeserializationResult
```

### migrateProject

Migrate project from older schema version.

```typescript
export function migrateProject(project: unknown, fromVersion: string): DeserializationResult
```

### isValidProjectFile

Quick validation check.

```typescript
export function isValidProjectFile(json: string): boolean
```

### getSchemaVersion

Extract schema version from JSON.

```typescript
export function getSchemaVersion(json: string): string | null
```

## Usage

```typescript
import { serializeProject, deserializeProject } from '@/core/persistence/serialization';

// Serialize
const result = serializeProject(project);
if (result.success && result.data) {
  await writeFile('project.sws', result.data);
}

// Deserialize
const json = await readFile('project.sws');
const result = deserializeProject(json);

if (result.requiresMigration) {
  const migrated = migrateProject(JSON.parse(json), result.foundVersion!);
}
```

## Related Elements

- [ProjectIO](./ProjectIO.md)
- [Project Schema](../03-schemas/ProjectFileSchema.md)

## Platform Availability

- **Universal**: Available on both Tauri (Desktop) and Web platforms.

## Related User Journeys

- [UJ-PM-003 (Hybrid)](../../user-journeys/hybrid/01-project-management/UJ-PM-003-OpenProject.md)
- [UJ-PM-006 (Hybrid)](../../user-journeys/hybrid/01-project-management/UJ-PM-006-CloseProject.md)
- [UJ-PM-003 (Tauri)](../../user-journeys/tauri-offline/01-project-management/UJ-PM-003-OpenProject.md)
- [UJ-PM-006 (Tauri)](../../user-journeys/tauri-offline/01-project-management/UJ-PM-006-CloseProject.md)
