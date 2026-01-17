import { z } from 'zod';

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
  scope: z.object({
    details: z.array(z.string()).default([]),
    materials: z.array(z.object({
      type: z.string(),
      grade: z.string().optional()
    })).default([]),
    projectType: z.string().default('Commercial')
  }).default({
    details: [],
    materials: [],
    projectType: 'Commercial'
  }),
  
  // Site conditions
  siteConditions: z.object({
    elevation: z.string().default('0'),
    outdoorTemp: z.string().default('70'),
    indoorTemp: z.string().default('70'),
    windSpeed: z.string().default('0'),
    humidity: z.string().default('50'),
    localCodes: z.string().default('')
  }).default({
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
  entities: z.object({
    byId: z.record(z.string(), z.any()),
    allIds: z.array(z.string())
  }).default({
    byId: {},
    allIds: []
  }),
  
  // Viewport state
  viewportState: z.object({
    panX: z.number().default(0),
    panY: z.number().default(0),
    zoom: z.number().min(0.1).max(10).default(1)
  }).default({
    panX: 0,
    panY: 0,
    zoom: 1
  }),
  
  // Application settings
  settings: z.object({
    unitSystem: z.enum(['imperial', 'metric']).default('imperial'),
    gridSize: z.number().positive().default(12),
    gridVisible: z.boolean().default(true)
  }).default({
    unitSystem: 'imperial',
    gridSize: 12,
    gridVisible: true
  }),
  
  // Optional thumbnail data URL
  thumbnailUrl: z.string().optional().nullable(),
  
  // App version when created/modified
  version: z.string().optional()
});

export type ProjectFile = z.infer<typeof ProjectFileSchema>;

/**
 * Partial schema for metadata-only operations
 * Used when scanning project directories without loading full entities
 */
export const ProjectMetadataSchema = ProjectFileSchema.omit({
  entities: true,
  viewportState: true
});

export type ProjectMetadata = z.infer<typeof ProjectMetadataSchema>;

/**
 * Create a new empty project file structure
 */
export function createEmptyProject(
  name: string,
  options?: Partial<ProjectFile>
): ProjectFile {
  const now = new Date().toISOString();
  
  return {
    schemaVersion: '1.0.0',
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
      gridVisible: true
    },
    thumbnailUrl: null,
    version: process.env.npm_package_version,
    ...options
  };
}
