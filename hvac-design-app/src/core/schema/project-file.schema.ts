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
 * Project settings
 */
export const ProjectSettingsSchema = z.object({
  unitSystem: z.enum(['imperial', 'metric']).default('imperial'),
  gridSize: z.number().positive().default(24), // 1/4 inch in pixels at 96 DPI
  gridVisible: z.boolean().default(true),
});

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
 * Complete project file schema (.sws file format)
 */
export const ProjectFileSchema = z.object({
  schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  projectId: z.string().uuid(),
  projectName: z.string().min(1).max(100),
  projectNumber: z.string().max(50).optional(),
  clientName: z.string().max(100).optional(),
  createdAt: z.string().datetime(),
  modifiedAt: z.string().datetime(),
  entities: NormalizedEntitiesSchema,
  viewportState: ViewportStateSchema,
  settings: ProjectSettingsSchema,
  commandHistory: z
    .object({
      commands: z.array(z.unknown()),
      currentIndex: z.number().int().nonnegative(),
    })
    .optional(),
});

export type ProjectFile = z.infer<typeof ProjectFileSchema>;

/**
 * Current schema version for migration support
 */
export const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Create a new empty project file
 */
export function createEmptyProjectFile(
  projectId: string,
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

