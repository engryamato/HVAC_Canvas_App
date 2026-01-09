# OS-SL-002: .sws File Format

## Overview

The `.sws` file format is the **permanent storage format** for HVAC Canvas projects. This document describes:

- File structure and schema
- Entity serialization format
- Version compatibility
- Example file walkthrough

**Format**: JSON text file with `.sws` extension

**Current Schema Version**: 1.0.0

---

## File Structure

### Top-Level Fields

```typescript
interface ProjectFile {
  schemaVersion: string;           // "1.0.0"
  projectId: string;               // UUID v4
  projectName: string;             // 1-100 chars
  projectNumber?: string;          // Optional, max 50 chars
  clientName?: string;             // Optional, max 100 chars
  createdAt: string;               // ISO 8601 datetime
  modifiedAt: string;              // ISO 8601 datetime
  entities: NormalizedEntities;    // Canvas entities
  canvas?: CanvasState;            // Optional plan reference
  viewportState: ViewportState;    // Pan/zoom state
  settings: ProjectSettings;       // Project configuration
  calculations?: CalculationResults; // Future: calculator outputs
  billOfMaterials?: BillOfMaterials; // Future: BOM generation
  commandHistory?: CommandHistory;  // Future: undo/redo history
}
```

**Code Reference**: `hvac-design-app/src/core/schema/project-file.schema.ts:124-148`

---

## Schema Version

```typescript
schemaVersion: "1.0.0"  // Semantic versioning
```

**Validation**: Must match pattern `/^\d+\.\d+\.\d+$/`

**Purpose**: Enable schema migration between versions

**Current Version**: 1.0.0 (defined in `project-file.schema.ts:195`)

See [OS-MIG-001-SchemaVersioning.md](../06-migration/OS-MIG-001-SchemaVersioning.md) for versioning strategy.

---

## Project Metadata

### Required Fields

```typescript
{
  projectId: "550e8400-e29b-41d4-a716-446655440000",  // UUID v4
  projectName: "Commercial Building HVAC",            // 1-100 chars
  createdAt: "2026-01-09T10:30:00.000Z",            // ISO 8601
  modifiedAt: "2026-01-09T15:45:00.000Z"             // ISO 8601
}
```

**Code Reference**: `project-file.schema.ts:125-131`

### Optional Fields

```typescript
{
  projectNumber: "PROJ-2024-001",  // Client/internal project number
  clientName: "ABC Corporation"     // Client name
}
```

**Code Reference**: `project-file.schema.ts:128-129`

---

## Entities (Canvas Objects)

### Normalized Structure

Entities stored in **normalized pattern** for efficient lookups:

```typescript
{
  entities: {
    byId: {
      "entity-uuid-1": { /* entity data */ },
      "entity-uuid-2": { /* entity data */ },
      // ...
    },
    allIds: [
      "entity-uuid-1",
      "entity-uuid-2",
      // ...
    ]
  }
}
```

**Code Reference**: `project-file.schema.ts:74-79`

**Benefits**:
- O(1) entity lookup by ID
- Efficient updates (no array traversal)
- Easy to detect duplicates
- Maintains entity order via `allIds`

### Entity Types

Entities use **discriminated union** for type safety:

```typescript
type Entity =
  | RoomEntity
  | DuctEntity
  | EquipmentEntity
  | FittingEntity
  | NoteEntity
  | GroupEntity;
```

**Code Reference**: `project-file.schema.ts:12-19`

### Example Entity (Duct)

```json
{
  "id": "duct-uuid-123",
  "type": "duct",
  "points": [
    { "x": 100, "y": 200 },
    { "x": 300, "y": 200 }
  ],
  "properties": {
    "width": 24,
    "height": 12,
    "material": "galvanized-steel",
    "insulation": "1-inch-fiberglass"
  },
  "createdAt": "2026-01-09T10:30:00.000Z",
  "modifiedAt": "2026-01-09T10:35:00.000Z"
}
```

### Example Entity (Equipment)

```json
{
  "id": "equipment-uuid-456",
  "type": "equipment",
  "position": { "x": 500, "y": 400 },
  "properties": {
    "equipmentType": "air-handler",
    "model": "AH-100",
    "cfm": 5000,
    "tonnage": 10
  },
  "connections": [
    { "portId": "supply", "connectedTo": "duct-uuid-123" }
  ]
}
```

---

## Viewport State

Canvas pan and zoom state:

```typescript
{
  viewportState: {
    panX: 0,        // Horizontal pan offset
    panY: 0,        // Vertical pan offset
    zoom: 1         // Zoom scale (0.1 - 4.0)
  }
}
```

**Code Reference**: `project-file.schema.ts:26-30`

**Validation**:
- `panX`, `panY`: Any number
- `zoom`: Number between 0.1 and 4.0

**Default**: `{ panX: 0, panY: 0, zoom: 1 }`

---

## Project Settings

```typescript
{
  settings: {
    unitSystem: "imperial",      // "imperial" | "metric"
    gridSize: 24,                // Pixels at 96 DPI
    gridVisible: true,           // Show grid
    scale: "1/4 inch = 1 foot",  // Optional scale label
    planScale: {                 // Optional scale definition
      pixelsPerUnit: 96,
      unit: "ft"
    }
  }
}
```

**Code Reference**: `project-file.schema.ts:61-69`

**Defaults**:
- `unitSystem`: "imperial"
- `gridSize`: 24 pixels (1/4 inch at 96 DPI)
- `gridVisible`: true

---

## Canvas State (Optional)

For projects with PDF plan underlay (Phase 1 feature):

```typescript
{
  canvas: {
    entities: { /* normalized entities */ },
    plan: {
      sourceType: "pdf",
      sourcePath: "/path/to/plan.pdf",
      pageIndex: 0,
      renderedImagePath: "/path/to/rendered.png"
    }
  }
}
```

**Code Reference**: `project-file.schema.ts:85-90`

**Status**: Optional field, planned for future PDF takeoff feature.

---

## Future Fields (Placeholders)

### Calculation Results

```typescript
{
  calculations: {
    ductSizing: [ /* sizing results */ ],
    pressureDrop: [ /* pressure calculations */ ],
    heatLoad: [ /* heat load calculations */ ]
  }
}
```

**Status**: Schema defined but not implemented. Reserved for future calculator integration.

**Code Reference**: `project-file.schema.ts:96-104`

### Bill of Materials

```typescript
{
  billOfMaterials: {
    items: [ /* BOM line items */ ],
    currency: "USD",
    generatedAt: "2026-01-09T15:00:00.000Z"
  }
}
```

**Status**: Schema defined but not implemented. Reserved for future BOM generation.

**Code Reference**: `project-file.schema.ts:110-118`

### Command History (Undo/Redo)

```typescript
{
  commandHistory: {
    commands: [ /* command objects */ ],
    currentIndex: 0
  }
}
```

**Status**: Schema defined but not implemented. Reserved for future undo/redo system.

**Code Reference**: `project-file.schema.ts:140-145`

---

## Complete Example File

```json
{
  "schemaVersion": "1.0.0",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "projectName": "Office Building - Floor 3",
  "projectNumber": "PROJ-2024-042",
  "clientName": "Acme Corporation",
  "createdAt": "2026-01-09T09:00:00.000Z",
  "modifiedAt": "2026-01-09T15:30:00.000Z",

  "entities": {
    "byId": {
      "room-001": {
        "id": "room-001",
        "type": "room",
        "name": "Conference Room A",
        "points": [
          { "x": 0, "y": 0 },
          { "x": 400, "y": 0 },
          { "x": 400, "y": 300 },
          { "x": 0, "y": 300 }
        ],
        "properties": {
          "area": 120000,
          "requiredCFM": 600
        }
      },
      "equipment-001": {
        "id": "equipment-001",
        "type": "equipment",
        "position": { "x": 200, "y": 150 },
        "properties": {
          "equipmentType": "air-handler",
          "model": "AH-50",
          "cfm": 2500
        }
      },
      "duct-001": {
        "id": "duct-001",
        "type": "duct",
        "points": [
          { "x": 200, "y": 150 },
          { "x": 500, "y": 150 }
        ],
        "properties": {
          "width": 24,
          "height": 12,
          "material": "galvanized-steel"
        }
      }
    },
    "allIds": [
      "room-001",
      "equipment-001",
      "duct-001"
    ]
  },

  "viewportState": {
    "panX": -100,
    "panY": -50,
    "zoom": 1.5
  },

  "settings": {
    "unitSystem": "imperial",
    "gridSize": 24,
    "gridVisible": true,
    "scale": "1/4\" = 1'"
  }
}
```

---

## File Size Considerations

### Typical File Sizes

| Project Size | Entity Count | File Size | localStorage Compatible? |
|--------------|--------------|-----------|-------------------------|
| Small | 1-50 | 10-50 KB | ✅ Yes |
| Medium | 51-200 | 50-200 KB | ✅ Yes |
| Large | 201-500 | 200-1 MB | ⚠️ May exceed localStorage |
| Very Large | 500+ | 1 MB+ | ❌ File system only |

**localStorage Limit**: ~5 MB across all keys

**Recommendation**: Use file system (.sws files) for projects with 200+ entities.

---

## JSON Formatting

### Production Format (Compact)

```json
{"schemaVersion":"1.0.0","projectId":"...","entities":{...}}
```

**Use Case**: Minimize file size for large projects

**Trade-off**: Not human-readable

### Development Format (Pretty-Printed)

```json
{
  "schemaVersion": "1.0.0",
  "projectId": "...",
  "entities": {
    ...
  }
}
```

**Use Case**: Debugging, manual inspection

**Current Implementation**: Pretty-printed with 2-space indentation

**Code Reference**: `projectIO.ts:40` uses `JSON.stringify(data, null, 2)`

---

## Validation

### Schema Validation (Zod)

All .sws files validated against Zod schema on load:

```typescript
import { ProjectFileSchema } from '@/core/schema';

const validated = ProjectFileSchema.parse(jsonData);
```

**Code Reference**: `hvac-design-app/src/core/schema/project-file.schema.ts:124`

**Validation Rules**:
- `schemaVersion`: Must match `/^\d+\.\d+\.\d+$/`
- `projectId`: Must be valid UUID v4
- `projectName`: 1-100 characters
- `createdAt`, `modifiedAt`: Valid ISO 8601 datetime
- `entities.byId`: Keys must be valid UUIDs
- `viewportState.zoom`: 0.1 to 4.0
- See complete schema for all rules

### Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid UUID" | `projectId` not UUID format | Regenerate UUID |
| "Invalid datetime" | Non-ISO date format | Use `new Date().toISOString()` |
| "Zoom out of range" | `zoom < 0.1` or `zoom > 4` | Clamp to valid range |
| "Missing required field" | Required field omitted | Add missing field |

---

## File Operations

### Create New File

```typescript
import { createEmptyProjectFile } from '@/core/schema';

const newProject = createEmptyProjectFile('New Project');
await saveProject(newProject, '/path/to/project.sws');
```

### Load Existing File

```typescript
const result = await loadProject('/path/to/project.sws');

if (result.success) {
  const project = result.project;
  entityStore.hydrate(project.entities);
}
```

### Update and Save

```typescript
const project = getCurrentProject();
project.modifiedAt = new Date().toISOString();
project.entities = entityStore.serialize();

await saveProject(project, projectPath);
```

---

## Backward Compatibility

### Loading Older Versions

When loading files with `schemaVersion < CURRENT_SCHEMA_VERSION`:

1. Detect version mismatch
2. Attempt migration via `migrateProject()`
3. If successful: Load migrated data
4. If failed: Try backup file

**Code Reference**: `projectIO.ts:68-76`

See [OS-MIG-001-SchemaVersioning.md](../06-migration/OS-MIG-001-SchemaVersioning.md) for details.

### Forward Compatibility

**Not Supported**: Cannot load files from newer versions.

**Error Message**: "Project requires newer version of app (v2.0.0+)"

**User Action**: Update application to load newer files.

---

## Related Documentation

- [Architecture Overview](./OS-SL-001-ArchitectureOverview.md) - Storage layer context
- [Schema Versioning](../06-migration/OS-MIG-001-SchemaVersioning.md) - Version compatibility
- [Corruption Detection](../07-error-recovery/OS-ERR-001-CorruptionDetection.md) - Handling invalid files
- [ProjectIO Element](../../elements/10-persistence/ProjectIO.md) - Save/load API reference

---

## Implementation Status

✅ **Fully Implemented**
- Core schema fields (project metadata, entities, viewport, settings)
- Zod validation
- Normalized entity structure
- JSON serialization/deserialization

⚠️ **Partially Implemented**
- Canvas state (schema defined, not used)
- Plan reference (schema defined, not implemented)

❌ **Not Implemented**
- Calculation results (placeholder only)
- Bill of materials (placeholder only)
- Command history (placeholder only)
- File compression
- Binary format option

See [IMPLEMENTATION_STATUS.md](../../IMPLEMENTATION_STATUS.md) for complete details.
