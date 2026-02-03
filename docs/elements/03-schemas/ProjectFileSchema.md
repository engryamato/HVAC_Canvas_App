# Project File Schema

## Overview

The Project File Schema defines the complete data structure and validation rules for HVAC project files (.sws format) in the HVAC Canvas application. It serves as the root schema that encompasses all project data including entities, settings, viewport state, calculations, and bill of materials.

## Location

```
src/core/schema/project-file.schema.ts
```

## Purpose

- Define the complete project file structure (.sws format)
- Manage project metadata (name, client, dates)
- Support versioned schema for migration compatibility
- Organize canvas entities and optional plan references
- Track viewport state for canvas position and zoom
- Configure project settings (units, grid, scale)
- Provide placeholders for future calculations and BOM
- Support command history for undo/redo functionality
- Provide TypeScript type inference for compile-time safety

## Dependencies

- `zod` - Schema validation library
- `@/core/schema/room.schema` - Room entity schema
- `@/core/schema/duct.schema` - Duct entity schema
- `@/core/schema/equipment.schema` - Equipment entity schema
- `@/core/schema/fitting.schema` - Fitting entity schema
- `@/core/schema/note.schema` - Note entity schema
- `@/core/schema/group.schema` - Group entity schema

## Schema Definitions

### EntitySchema (Discriminated Union)

A union of all entity types for type-safe parsing.

```typescript
export const EntitySchema = z.discriminatedUnion('type', [
  RoomSchema,
  DuctSchema,
  EquipmentSchema,
  FittingSchema,
  NoteSchema,
  GroupSchema,
]);

export type Entity = z.infer<typeof EntitySchema>;
```

**Supported Entity Types:**
- `RoomSchema` - Enclosed spaces
- `DuctSchema` - Airflow conduits
- `EquipmentSchema` - HVAC equipment
- `FittingSchema` - Duct connections
- `NoteSchema` - Canvas annotations
- `GroupSchema` - Entity groupings

### ViewportStateSchema

Tracks the canvas camera position and zoom level.

```typescript
export const ViewportStateSchema = z.object({
  panX: z.number().default(0),
  panY: z.number().default(0),
  zoom: z.number().min(0.1).max(4).default(1),
});

export type ViewportState = z.infer<typeof ViewportStateSchema>;
```

**Fields:**
- `panX`: Horizontal pan offset in pixels (default: 0)
- `panY`: Vertical pan offset in pixels (default: 0)
- `zoom`: Zoom level, 0.1x to 4x (default: 1)

### PlanScaleSchema

Converts between pixels and real-world units for PDF takeoff.

```typescript
export const PlanScaleSchema = z.object({
  pixelsPerUnit: z.number().positive(),
  unit: z.enum(['ft', 'm']),
});

export type PlanScale = z.infer<typeof PlanScaleSchema>;
```

**Fields:**
- `pixelsPerUnit`: Number of pixels per unit (positive number)
- `unit`: Real-world unit ('ft' for feet, 'm' for meters)

### PlanReferenceSchema

References PDF floor plans for Phase 1 takeoff functionality.

```typescript
export const PlanReferenceSchema = z.object({
  sourceType: z.literal('pdf'),
  sourcePath: z.string(),
  pageIndex: z.number().int().nonnegative(),
  renderedImagePath: z.string().optional(),
});

export type PlanReference = z.infer<typeof PlanReferenceSchema>;
```

**Fields:**
- `sourceType`: Currently only 'pdf' supported
- `sourcePath`: Path to the PDF file
- `pageIndex`: Zero-based page index
- `renderedImagePath`: Optional path to rendered image

### ProjectSettingsSchema

Project-wide configuration and display settings. Uses `passthrough()` to allow future/unknown keys.

```typescript
export const ProjectSettingsSchema = z.object({
  unitSystem: z.enum(['imperial', 'metric']).default('imperial'),
  gridSize: z.number().positive().default(24), // 1/4 inch in pixels at 96 DPI
  gridVisible: z.boolean().default(true),
  scale: z.string().optional().describe('User-facing scale label e.g. "1/4 inch = 1 foot"'),
  planScale: PlanScaleSchema.optional(),
}).passthrough();

export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;
```

**Fields:**
- `unitSystem`: 'imperial' or 'metric' (default: 'imperial')
- `gridSize`: Grid spacing in pixels (default: 24)
- `gridVisible`: Show/hide grid (default: true)
- `scale`: Human-readable scale description (optional)
- `planScale`: Pixel-to-unit conversion (optional)

### NormalizedEntitiesSchema

Efficient entity storage with by-id lookup and ordered list.

```typescript
export const NormalizedEntitiesSchema = z.object({
  byId: z.record(z.string().uuid(), EntitySchema),
  allIds: z.array(z.string().uuid()),
});

export type NormalizedEntities = z.infer<typeof NormalizedEntitiesSchema>;
```

**Fields:**
- `byId`: Map of entity ID to entity object (O(1) lookup)
- `allIds`: Ordered array of entity IDs (maintains order)

### CanvasStateSchema

Canvas-specific data including entities and optional plan.

```typescript
export const CanvasStateSchema = z.object({
  entities: NormalizedEntitiesSchema,
  plan: PlanReferenceSchema.optional(),
});

export type CanvasState = z.infer<typeof CanvasStateSchema>;
```

### CalculationResultsSchema

Placeholder for future calculator outputs.

```typescript
export const CalculationResultsSchema = z
  .object({
    ductSizing: z.array(z.unknown()).optional(),
    pressureDrop: z.array(z.unknown()).optional(),
    heatLoad: z.array(z.unknown()).optional(),
  })
  .optional();

export type CalculationResults = z.infer<typeof CalculationResultsSchema>;
```

### BillOfMaterialsSchema

Placeholder for future BOM generation.

```typescript
export const BillOfMaterialsSchema = z
  .object({
    items: z.array(z.unknown()),
    currency: z.string().default('USD'),
    generatedAt: z.string().datetime().optional(),
  })
  .optional();

export type BillOfMaterials = z.infer<typeof BillOfMaterialsSchema>;
```

### ProjectFileSchema

The complete root schema for .sws project files. Uses `passthrough()` to preserve unknown fields.

```typescript
export const ProjectFileSchema = z.object({
  schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  projectId: z.string().uuid(),
  projectName: z.string().min(1).max(100),
  projectNumber: z.string().max(50).optional(),
  clientName: z.string().max(100).optional(),
  createdAt: z.string().datetime(),
  modifiedAt: z.string().datetime(),
  // Support both legacy 'entities' and new 'canvas' structure
  entities: NormalizedEntitiesSchema,
  canvas: CanvasStateSchema.optional(),
  viewportState: ViewportStateSchema,
  settings: ProjectSettingsSchema,
  // Future calculation and BOM support
  calculations: CalculationResultsSchema,
  billOfMaterials: BillOfMaterialsSchema,
  commandHistory: z
    .object({
      commands: z.array(z.unknown()),
      currentIndex: z.number().int().nonnegative(),
    })
    .optional(),
}).passthrough();

export type ProjectFile = z.infer<typeof ProjectFileSchema>;
```

**Validation Rules:**
- `schemaVersion`: Semantic versioning format (e.g., "1.0.0")
- `projectId`: UUID v4
- `projectName`: Required, 1-100 characters
- `projectNumber`: Optional, max 50 characters
- `clientName`: Optional, max 100 characters
- `createdAt`, `modifiedAt`: ISO8601 datetime strings
- `entities`: Required normalized entity structure
- `canvas`: Optional canvas state (for new format)
- `viewportState`: Required viewport configuration
- `settings`: Required project settings
- `calculations`, `billOfMaterials`: Optional future features
- `commandHistory`: Optional undo/redo support

### ProjectScopeSchema

Structured scope metadata for project summaries.

```typescript
export const ProjectScopeSchema = z.object({
  details: z.array(z.string()),
  materials: z.array(z.object({ type: z.string(), grade: z.string().optional() })),
  projectType: z.string(),
});

export type ProjectScope = z.infer<typeof ProjectScopeSchema>;
```

### SiteConditionsSchema

Environmental and code conditions tied to the project.

```typescript
export const SiteConditionsSchema = z.object({
  elevation: z.string(),
  outdoorTemp: z.string(),
  indoorTemp: z.string(),
  windSpeed: z.string(),
  humidity: z.string(),
  localCodes: z.string(),
});

export type SiteConditions = z.infer<typeof SiteConditionsSchema>;
```

### ProjectDetailsSchema

Simplified metadata for project listings, including optional location, scope, and site conditions.

```typescript
export const ProjectDetailsSchema = z.object({
  projectId: z.string().uuid(),
  projectName: z.string().min(1).max(100),
  projectNumber: z.string().max(50).optional(),
  clientName: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  scope: ProjectScopeSchema.optional(),
  siteConditions: SiteConditionsSchema.optional(),
  createdAt: z.string().datetime(),
  modifiedAt: z.string().datetime(),
});

export type ProjectDetails = z.infer<typeof ProjectDetailsSchema>;
```

## Schema Version

```typescript
export const CURRENT_SCHEMA_VERSION = '1.0.0';
```

The current schema version following semantic versioning for migration support.

## Default Values

### Factory Function

```typescript
export function createEmptyProjectFile(
  projectId: string = crypto.randomUUID(),
  projectName: string = 'Untitled Project'
): ProjectFile {
  const now = new Date().toISOString();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    projectId,
    projectName,
    createdAt: now,
    modifiedAt: now,
    entities: {
      byId: {},
      allIds: [],
    },
    viewportState: {
      panX: 0,
      panY: 0,
      zoom: 1,
    },
    settings: {
      unitSystem: 'imperial',
      gridSize: 24,
      gridVisible: true,
    },
  };
}
```

## Validation Examples

### Valid Minimal Project File

```typescript
const minimalProject = createEmptyProjectFile();

const result = ProjectFileSchema.safeParse(minimalProject);
// result.success === true
```

### Valid Complete Project File

```typescript
const completeProject = {
  schemaVersion: '1.0.0',
  projectId: '550e8400-e29b-41d4-a716-446655440000',
  projectName: 'Downtown Office HVAC',
  projectNumber: 'PROJ-2025-001',
  clientName: 'Acme Corporation',
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T15:30:00Z',
  entities: {
    byId: {
      '550e8400-e29b-41d4-a716-446655440010': {
        id: '550e8400-e29b-41d4-a716-446655440010',
        type: 'room',
        transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
        zIndex: 0,
        createdAt: '2025-12-29T10:05:00Z',
        modifiedAt: '2025-12-29T10:05:00Z',
        props: {
          name: 'Conference Room',
          width: 240,
          length: 180,
          height: 96,
          occupancyType: 'conference',
          airChangesPerHour: 6,
        },
      },
    },
    allIds: ['550e8400-e29b-41d4-a716-446655440010'],
  },
  viewportState: {
    panX: -200,
    panY: -150,
    zoom: 1.5,
  },
  settings: {
    unitSystem: 'imperial',
    gridSize: 24,
    gridVisible: true,
    scale: '1/4" = 1\'-0"',
  },
};

const result = ProjectFileSchema.safeParse(completeProject);
// result.success === true
```

### Invalid Project File (Bad Version Format)

```typescript
const invalidProject = {
  schemaVersion: '1.0',  // ❌ Must be semantic version (X.Y.Z)
  projectId: '550e8400-e29b-41d4-a716-446655440000',
  projectName: 'Test Project',
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
  entities: { byId: {}, allIds: [] },
  viewportState: { panX: 0, panY: 0, zoom: 1 },
  settings: { unitSystem: 'imperial', gridSize: 24, gridVisible: true },
};

const result = ProjectFileSchema.safeParse(invalidProject);
// result.success === false
```

### Invalid Project File (Zoom Out of Range)

```typescript
const invalidProject = {
  // ...valid fields
  viewportState: {
    panX: 0,
    panY: 0,
    zoom: 5,  // ❌ Exceeds maximum 4
  },
};

const result = ProjectFileSchema.safeParse(invalidProject);
// result.success === false
```

## Entity Structure Diagram

```
ProjectFile (.sws)
├── schemaVersion: string (X.Y.Z format)
├── projectId: string (UUID)
├── projectName: string (1-100 chars)
├── projectNumber?: string (max 50 chars)
├── clientName?: string (max 100 chars)
├── createdAt: string (ISO8601)
├── modifiedAt: string (ISO8601)
├── entities
│   ├── byId: Record<UUID, Entity>
│   └── allIds: UUID[]
├── canvas? (optional)
│   ├── entities: NormalizedEntities
│   └── plan?: PlanReference
├── viewportState
│   ├── panX: number
│   ├── panY: number
│   └── zoom: number (0.1-4)
├── settings
│   ├── unitSystem: 'imperial' | 'metric'
│   ├── gridSize: number
│   ├── gridVisible: boolean
│   ├── scale?: string
│   └── planScale?: PlanScale
├── calculations? (optional)
│   ├── ductSizing?: unknown[]
│   ├── pressureDrop?: unknown[]
│   └── heatLoad?: unknown[]
├── billOfMaterials? (optional)
│   ├── items: unknown[]
│   ├── currency: string
│   └── generatedAt?: string
└── commandHistory? (optional)
    ├── commands: unknown[]
    └── currentIndex: number
```

## Usage Examples

### Creating a New Project

```typescript
import { createEmptyProjectFile } from '@/core/schema/project-file.schema';

// Create with defaults
const newProject = createEmptyProjectFile();

// Create with custom name and ID
const customProject = createEmptyProjectFile(
  crypto.randomUUID(),
  'Kitchen Exhaust System'
);
```

### Loading and Validating Project File

```typescript
import { ProjectFileSchema } from '@/core/schema/project-file.schema';
import { ZodError } from 'zod';

async function loadProjectFile(filePath: string): Promise<ProjectFile | null> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    const result = ProjectFileSchema.safeParse(data);

    if (!result.success) {
      console.error('Project file validation failed:', result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Failed to load project file:', error);
    return null;
  }
}
```

### Saving Project File

```typescript
import { ProjectFile } from '@/core/schema/project-file.schema';

async function saveProjectFile(
  projectFile: ProjectFile,
  filePath: string
): Promise<boolean> {
  try {
    // Update modification timestamp
    const updatedProject = {
      ...projectFile,
      modifiedAt: new Date().toISOString(),
    };

    // Validate before saving
    ProjectFileSchema.parse(updatedProject);

    // Save to file
    await fs.writeFile(
      filePath,
      JSON.stringify(updatedProject, null, 2),
      'utf-8'
    );

    return true;
  } catch (error) {
    console.error('Failed to save project file:', error);
    return false;
  }
}
```

### Adding Entities to Project

```typescript
import { ProjectFile, Entity } from '@/core/schema/project-file.schema';

function addEntityToProject(project: ProjectFile, entity: Entity): ProjectFile {
  return {
    ...project,
    entities: {
      byId: {
        ...project.entities.byId,
        [entity.id]: entity,
      },
      allIds: [...project.entities.allIds, entity.id],
    },
    modifiedAt: new Date().toISOString(),
  };
}

function removeEntityFromProject(project: ProjectFile, entityId: string): ProjectFile {
  const { [entityId]: removed, ...remainingEntities } = project.entities.byId;

  return {
    ...project,
    entities: {
      byId: remainingEntities,
      allIds: project.entities.allIds.filter((id) => id !== entityId),
    },
    modifiedAt: new Date().toISOString(),
  };
}
```

### Updating Viewport State

```typescript
import { ProjectFile, ViewportState } from '@/core/schema/project-file.schema';

function updateViewport(
  project: ProjectFile,
  viewport: Partial<ViewportState>
): ProjectFile {
  return {
    ...project,
    viewportState: {
      ...project.viewportState,
      ...viewport,
    },
  };
}

function zoomIn(project: ProjectFile): ProjectFile {
  const newZoom = Math.min(project.viewportState.zoom * 1.2, 4);
  return updateViewport(project, { zoom: newZoom });
}

function zoomOut(project: ProjectFile): ProjectFile {
  const newZoom = Math.max(project.viewportState.zoom / 1.2, 0.1);
  return updateViewport(project, { zoom: newZoom });
}

function resetViewport(project: ProjectFile): ProjectFile {
  return updateViewport(project, { panX: 0, panY: 0, zoom: 1 });
}
```

### Updating Project Settings

```typescript
import { ProjectFile, ProjectSettings } from '@/core/schema/project-file.schema';

function updateSettings(
  project: ProjectFile,
  settings: Partial<ProjectSettings>
): ProjectFile {
  return {
    ...project,
    settings: {
      ...project.settings,
      ...settings,
    },
    modifiedAt: new Date().toISOString(),
  };
}

function toggleGrid(project: ProjectFile): ProjectFile {
  return updateSettings(project, {
    gridVisible: !project.settings.gridVisible,
  });
}

function switchToMetric(project: ProjectFile): ProjectFile {
  return updateSettings(project, { unitSystem: 'metric' });
}
```

### Schema Migration

```typescript
import { ProjectFile, CURRENT_SCHEMA_VERSION } from '@/core/schema/project-file.schema';

function migrateProjectFile(data: any): ProjectFile {
  const version = data.schemaVersion || '0.0.0';

  if (version === CURRENT_SCHEMA_VERSION) {
    return data;
  }

  // Migration logic for different versions
  let migrated = data;

  if (version < '1.0.0') {
    // Migrate from pre-1.0.0 format
    migrated = {
      ...migrated,
      schemaVersion: '1.0.0',
      // Add any new required fields
      viewportState: migrated.viewportState || {
        panX: 0,
        panY: 0,
        zoom: 1,
      },
    };
  }

  return migrated;
}
```

### Extracting Project Details

```typescript
import { ProjectFile, ProjectDetails } from '@/core/schema/project-file.schema';

function extractProjectDetails(project: ProjectFile): ProjectDetails {
  return {
    projectId: project.projectId,
    projectName: project.projectName,
    projectNumber: project.projectNumber,
    clientName: project.clientName,
    createdAt: project.createdAt,
    modifiedAt: project.modifiedAt,
  };
}

function getProjectSummary(project: ProjectFile): string {
  const details = extractProjectDetails(project);
  const entityCount = project.entities.allIds.length;

  return `${details.projectName} - ${entityCount} entities (Last modified: ${new Date(details.modifiedAt).toLocaleDateString()})`;
}
```

## Related Elements

- [BaseSchema](./BaseSchema.md) - Base entity schema
- [RoomSchema](./RoomSchema.md) - Room entity schema
- [DuctSchema](./DuctSchema.md) - Duct entity schema
- [EquipmentSchema](./EquipmentSchema.md) - Equipment entity schema
- [FittingSchema](./FittingSchema.md) - Fitting entity schema
- [NoteSchema](./NoteSchema.md) - Note entity schema
- [GroupSchema](./GroupSchema.md) - Group entity schema
- [projectStore](../02-stores/projectStore.md) - Project state management
- [ProjectIO](../10-persistence/ProjectIO.md) - File I/O operations
- [NewProjectDialog](../01-components/dashboard/NewProjectDialog.md) - Project creation UI

## Testing

```typescript
describe('ViewportStateSchema', () => {
  it('validates correct viewport state', () => {
    const viewport = { panX: 100, panY: 200, zoom: 1.5 };
    const result = ViewportStateSchema.safeParse(viewport);
    expect(result.success).toBe(true);
  });

  it('applies default values', () => {
    const result = ViewportStateSchema.parse({});
    expect(result.panX).toBe(0);
    expect(result.panY).toBe(0);
    expect(result.zoom).toBe(1);
  });

  it('rejects zoom below minimum', () => {
    const result = ViewportStateSchema.safeParse({ panX: 0, panY: 0, zoom: 0.05 });
    expect(result.success).toBe(false);
  });

  it('rejects zoom above maximum', () => {
    const result = ViewportStateSchema.safeParse({ panX: 0, panY: 0, zoom: 5 });
    expect(result.success).toBe(false);
  });
});

describe('ProjectSettingsSchema', () => {
  it('validates correct settings', () => {
    const settings = {
      unitSystem: 'imperial',
      gridSize: 24,
      gridVisible: true,
    };
    const result = ProjectSettingsSchema.safeParse(settings);
    expect(result.success).toBe(true);
  });

  it('applies defaults', () => {
    const result = ProjectSettingsSchema.parse({});
    expect(result.unitSystem).toBe('imperial');
    expect(result.gridSize).toBe(24);
    expect(result.gridVisible).toBe(true);
  });

  it('accepts metric unit system', () => {
    const settings = { unitSystem: 'metric', gridSize: 24, gridVisible: true };
    expect(ProjectSettingsSchema.safeParse(settings).success).toBe(true);
  });
});

describe('ProjectFileSchema', () => {
  it('validates empty project file', () => {
    const project = createEmptyProjectFile();
    const result = ProjectFileSchema.safeParse(project);
    expect(result.success).toBe(true);
  });

  it('validates complete project file', () => {
    const project = {
      schemaVersion: '1.0.0',
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      projectName: 'Test Project',
      createdAt: '2025-12-29T10:00:00Z',
      modifiedAt: '2025-12-29T10:00:00Z',
      entities: { byId: {}, allIds: [] },
      viewportState: { panX: 0, panY: 0, zoom: 1 },
      settings: { unitSystem: 'imperial', gridSize: 24, gridVisible: true },
    };
    const result = ProjectFileSchema.safeParse(project);
    expect(result.success).toBe(true);
  });

  it('rejects invalid schema version format', () => {
    const project = {
      ...createEmptyProjectFile(),
      schemaVersion: '1.0',
    };
    const result = ProjectFileSchema.safeParse(project);
    expect(result.success).toBe(false);
  });

  it('rejects empty project name', () => {
    const project = {
      ...createEmptyProjectFile(),
      projectName: '',
    };
    const result = ProjectFileSchema.safeParse(project);
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const project = {
      ...createEmptyProjectFile(),
      projectNumber: 'PROJ-001',
      clientName: 'Acme Corp',
    };
    const result = ProjectFileSchema.safeParse(project);
    expect(result.success).toBe(true);
  });
});

describe('createEmptyProjectFile', () => {
  it('creates valid project file', () => {
    const project = createEmptyProjectFile();
    const result = ProjectFileSchema.safeParse(project);
    expect(result.success).toBe(true);
  });

  it('uses default project name', () => {
    const project = createEmptyProjectFile();
    expect(project.projectName).toBe('Untitled Project');
  });

  it('accepts custom project name', () => {
    const project = createEmptyProjectFile(undefined, 'Custom Name');
    expect(project.projectName).toBe('Custom Name');
  });

  it('generates UUID if not provided', () => {
    const project = createEmptyProjectFile();
    expect(project.projectId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('uses provided UUID', () => {
    const customId = '550e8400-e29b-41d4-a716-446655440000';
    const project = createEmptyProjectFile(customId);
    expect(project.projectId).toBe(customId);
  });

  it('initializes empty entities', () => {
    const project = createEmptyProjectFile();
    expect(project.entities.byId).toEqual({});
    expect(project.entities.allIds).toEqual([]);
  });

  it('sets current schema version', () => {
    const project = createEmptyProjectFile();
    expect(project.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});
```
