import { z } from 'zod';
import { RoomSchema } from './room.schema';
import { DuctSchema } from './duct.schema';
import { EquipmentSchema } from './equipment.schema';
import { FittingSchema } from './fitting.schema';
import { NoteSchema } from './note.schema';
import { GroupSchema } from './group.schema';

/**
 * Union of all entity types using discriminated union for type safety
 */
export const EntitySchema = z.discriminatedUnion('type', [
  RoomSchema,
  DuctSchema,
  EquipmentSchema,
  FittingSchema,
  NoteSchema,
  GroupSchema,
]);

export type Entity = z.infer<typeof EntitySchema>;

/**
 * Normalized entity state for efficient lookups
 */
export const NormalizedEntitiesSchema = z.object({
  byId: z.record(z.string().uuid(), EntitySchema),
  allIds: z.array(z.string().uuid()),
});

export type NormalizedEntities = z.infer<typeof NormalizedEntitiesSchema>;

/**
 * Project Scope Schema
 */
export const ProjectScopeSchema = z.object({
  details: z.array(z.string()).default([]),
  materials: z.array(z.object({
    type: z.string(),
    grade: z.string().optional()
  })).default([]),
  projectType: z.string().default('Commercial')
});

export type ProjectScope = z.infer<typeof ProjectScopeSchema>;

/**
 * Site Conditions Schema
 */
export const SiteConditionsSchema = z.object({
  elevation: z.string().default('0'),
  outdoorTemp: z.string().default('70'),
  indoorTemp: z.string().default('70'),
  windSpeed: z.string().default('0'),
  humidity: z.string().default('50'),
  localCodes: z.string().default('')
});

export type SiteConditions = z.infer<typeof SiteConditionsSchema>;

/**
 * Viewport state for canvas position/zoom
 */
export const ViewportStateSchema = z.object({
  panX: z.number().default(0),
  panY: z.number().default(0),
  zoom: z.number().min(0.1).max(10).default(1),
});

export type ViewportState = z.infer<typeof ViewportStateSchema>;

/**
 * Project settings
 */
export const ProjectSettingsSchema = z.object({
  unitSystem: z.enum(['imperial', 'metric']).default('imperial'),
  gridSize: z.number().positive().default(12),
  gridVisible: z.boolean().default(true),
  snapToGrid: z.boolean().default(true).optional(),
}).passthrough();

export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;

/**
 * Schema for .sws project files
 * Defines the complete structure for file-based project persistence
 */
export const ProjectFileSchema = z.object({
  // Schema version for migration support
  schemaVersion: z.string().default('1.0.0'),
  
  // Project identification
  projectId: z.string().uuid(),
  projectName: z.string().min(1).max(100),
  projectNumber: z.string().optional(),
  clientName: z.string().optional(),
  location: z.string().optional(),
  
  // Project scope
  scope: ProjectScopeSchema.default({
    details: [],
    materials: [],
    projectType: 'Commercial'
  }),
  
  // Site conditions
  siteConditions: SiteConditionsSchema.default({
    elevation: '0',
    outdoorTemp: '70',
    indoorTemp: '70',
    windSpeed: '0',
    humidity: '50',
    localCodes: ''
  }),
  
  // Timestamps
  createdAt: z.string().datetime(),
  modifiedAt: z.string().datetime(),
  
  // Archive status
  isArchived: z.boolean().default(false),
  
  // Canvas entities
  entities: NormalizedEntitiesSchema.default({
    byId: {},
    allIds: []
  }),
  
  // Viewport state
  viewportState: ViewportStateSchema.default({
    panX: 0,
    panY: 0,
    zoom: 1
  }),
  
  // Application settings
  settings: ProjectSettingsSchema.default({
    unitSystem: 'imperial',
    gridSize: 12,
    gridVisible: true,
    snapToGrid: true
  }),
  
  // Optional thumbnail data URL
  thumbnailUrl: z.string().optional().nullable(),
  
  // App version when created/modified
  version: z.string().optional(),

  // Command History placeholder
  commandHistory: z.object({
    commands: z.array(z.unknown()),
    currentIndex: z.number().int().nonnegative(),
  }).optional(),

  // Future calculation support
  calculations: z.unknown().optional(),
  billOfMaterials: z.unknown().optional(),
}).passthrough();

export type ProjectFile = z.infer<typeof ProjectFileSchema>;

/**
 * Project details for simplified project metadata
 */
export const ProjectDetailsSchema = z.object({
  projectId: z.string().uuid(),
  projectName: z.string().min(1).max(100),
  projectNumber: z.string().max(50).optional(),
  clientName: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  scope: ProjectScopeSchema.optional(),
  siteConditions: SiteConditionsSchema.optional(),
  isArchived: z.boolean().default(false),
  createdAt: z.string().datetime(),
  modifiedAt: z.string().datetime(),
});

export type ProjectDetails = z.infer<typeof ProjectDetailsSchema>;

/**
 * Partial schema for metadata-only operations
 * Used when scanning project directories without loading full entities
 */
export const ProjectMetadataSchema = ProjectFileSchema.omit({
  entities: true,
  viewportState: true
});

export type ProjectMetadata = z.infer<typeof ProjectMetadataSchema>;

export const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Plan scale metadata
 */
export const PlanScaleSchema = z.object({
  pixelsPerUnit: z.number().positive(),
  unit: z.enum(['ft', 'in', 'm', 'cm', 'mm']),
});

export type PlanScale = z.infer<typeof PlanScaleSchema>;

/**
 * Reference plan source (PDF/Image)
 */
export const PlanReferenceSchema = z.object({
  sourceType: z.enum(['pdf', 'image']),
  sourcePath: z.string(),
  pageIndex: z.number().int().nonnegative().optional(),
  renderedImagePath: z.string().optional(),
  scale: PlanScaleSchema.optional(),
  opacity: z.number().min(0).max(1).default(0.5),
  visible: z.boolean().default(true),
});

export type PlanReference = z.infer<typeof PlanReferenceSchema>;

/**
 * Simplified canvas state for persistence
 */
export const CanvasStateSchema = z.object({
  entities: NormalizedEntitiesSchema.optional(),
  plan: PlanReferenceSchema.optional(),
});

export type CanvasState = z.infer<typeof CanvasStateSchema>;

/**
 * Create a new empty project file structure
 */
export function createEmptyProject(
  name: string,
  options?: Partial<ProjectFile>
): ProjectFile {
  const now = new Date().toISOString();
  
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    projectId: crypto.randomUUID(),
    projectName: name,
    projectNumber: undefined,
    clientName: undefined,
    location: undefined,
    scope: {
      details: [],
      materials: [],
      projectType: 'Commercial'
    },
    siteConditions: {
      elevation: '0',
      outdoorTemp: '70',
      indoorTemp: '70',
      windSpeed: '0',
      humidity: '50',
      localCodes: ''
    },
    createdAt: now,
    modifiedAt: now,
    isArchived: false,
    entities: {
      byId: {},
      allIds: []
    },
    viewportState: {
      panX: 0,
      panY: 0,
      zoom: 1
    },
    settings: {
      unitSystem: 'imperial',
      gridSize: 12,
      gridVisible: true,
      snapToGrid: true
    },
    thumbnailUrl: null,
    version: process.env.npm_package_version,
    ...options
  } as ProjectFile;
}

/**
 * Alias for createEmptyProject to maintain backward compatibility
 */
export const createEmptyProjectFile = (
  projectId: string,
  name = 'Untitled Project'
): ProjectFile => {
  return createEmptyProject(name, { projectId });
};
