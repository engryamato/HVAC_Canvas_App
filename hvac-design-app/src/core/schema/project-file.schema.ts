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
 * Viewport state for canvas position/zoom
 */
export const ViewportStateSchema = z.object({
  panX: z.number().default(0),
  panY: z.number().default(0),
  zoom: z.number().min(0.1).max(4).default(1),
});

export type ViewportState = z.infer<typeof ViewportStateSchema>;

/**
 * Plan scale for converting between pixels and real-world units
 * Per Notion Data Models & Schema - Structure
 */
export const PlanScaleSchema = z.object({
  pixelsPerUnit: z.number().positive(),
  unit: z.enum(['ft', 'm']),
});

export type PlanScale = z.infer<typeof PlanScaleSchema>;

/**
 * Plan reference for PDF takeoff (Phase 1)
 * Per Notion Data Models & Schema - Structure
 */
export const PlanReferenceSchema = z.object({
  sourceType: z.literal('pdf'),
  sourcePath: z.string(),
  pageIndex: z.number().int().nonnegative(),
  renderedImagePath: z.string().optional(),
});

export type PlanReference = z.infer<typeof PlanReferenceSchema>;

/**
 * Project settings with extended fields per Notion specs
 */
export const ProjectSettingsSchema = z.object({
  unitSystem: z.enum(['imperial', 'metric']).default('imperial'),
  gridSize: z.number().positive().default(24), // 1/4 inch in pixels at 96 DPI
  gridVisible: z.boolean().default(true),
  scale: z.string().optional().describe('User-facing scale label e.g. "1/4 inch = 1 foot"'),
  planScale: PlanScaleSchema.optional(),
}).passthrough();

export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;

/**
 * Normalized entity state for efficient lookups
 */
export const NormalizedEntitiesSchema = z.object({
  byId: z.record(z.string().uuid(), EntitySchema),
  allIds: z.array(z.string().uuid()),
});

export type NormalizedEntities = z.infer<typeof NormalizedEntitiesSchema>;

/**
 * Canvas state including entities and optional plan reference
 * Per Notion Data Models & Schema - Structure
 */
export const CanvasStateSchema = z.object({
  entities: NormalizedEntitiesSchema,
  plan: PlanReferenceSchema.optional(),
});

export type CanvasState = z.infer<typeof CanvasStateSchema>;

/**
 * Calculation results placeholder for future calculator outputs
 * Per Notion Data Models & Schema - CalculationResults
 */
export const CalculationResultsSchema = z
  .object({
    ductSizing: z.array(z.unknown()).optional(),
    pressureDrop: z.array(z.unknown()).optional(),
    heatLoad: z.array(z.unknown()).optional(),
  })
  .optional();

export type CalculationResults = z.infer<typeof CalculationResultsSchema>;

/**
 * Bill of Materials placeholder for future BOM generation
 * Per Notion Data Models & Schema - BillOfMaterials
 */
export const BillOfMaterialsSchema = z
  .object({
    items: z.array(z.unknown()),
    currency: z.string().default('USD'),
    generatedAt: z.string().datetime().optional(),
  })
  .optional();

export type BillOfMaterials = z.infer<typeof BillOfMaterialsSchema>;

/**
 * Complete project file schema (.sws file format)
 * Per Notion Data Models & Schema - HVACProjectFile
 */
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


/**
 * Project Scope Schema
 */
export const ProjectScopeSchema = z.object({
  details: z.array(z.string()),
  materials: z.array(z.object({ type: z.string(), grade: z.string().optional() })),
  projectType: z.string(),
});

export type ProjectScope = z.infer<typeof ProjectScopeSchema>;

/**
 * Site Conditions Schema
 */
export const SiteConditionsSchema = z.object({
  elevation: z.string(),
  outdoorTemp: z.string(),
  indoorTemp: z.string(),
  windSpeed: z.string(),
  humidity: z.string(),
  localCodes: z.string(),
});

export type SiteConditions = z.infer<typeof SiteConditionsSchema>;

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
  createdAt: z.string().datetime(),
  modifiedAt: z.string().datetime(),
});

export type ProjectDetails = z.infer<typeof ProjectDetailsSchema>;

/**
 * Current schema version for migration support
 */
export const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Create a new empty project file
 */
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
