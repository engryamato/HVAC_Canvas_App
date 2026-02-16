import { z } from 'zod';

/**
 * Visual style for system type identification
 */
export const VisualStyleSchema = z.object({
  color: z.string(), // Hex color code
  strokeWidth: z.number().min(1).optional(),
  strokeStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
  fillOpacity: z.number().min(0).max(1).optional(),
  labelPrefix: z.string().optional(), // e.g., "S-" for supply, "R-" for return
});

export type VisualStyle = z.infer<typeof VisualStyleSchema>;

/**
 * System-specific properties
 */
export const SystemPropertiesSchema = z.object({
  // Pressure classification
  pressureClass: z.enum([
    'low_pressure',      // < 2" w.g.
    'medium_pressure',   // 2-6" w.g.
    'high_pressure',     // 6-10" w.g.
    'very_high_pressure' // > 10" w.g.
  ]),
  
  // Insulation requirements
  insulation: z.object({
    required: z.boolean(),
    thickness: z.number().optional(), // inches
    rValue: z.number().optional(), // R-value
    type: z.string().optional(), // e.g., "fiberglass", "foam"
  }).optional(),
  
  // Sealing requirements
  sealing: z.object({
    sealClass: z.enum(['A', 'B', 'C']), // SMACNA seal classes
    tapingRequired: z.boolean(),
    masticsRequired: z.boolean(),
  }).optional(),
  
  // Material preferences
  preferredMaterials: z.array(z.string()).optional(), // Material IDs
  
  // Engineering defaults
  defaultVelocity: z.number().optional(), // fpm
  defaultPressureDrop: z.number().optional(), // in. w.g./100 ft
});

export type SystemProperties = z.infer<typeof SystemPropertiesSchema>;

/**
 * System template definition
 */
export const SystemTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['supply', 'return', 'exhaust', 'outside_air', 'custom']),
  description: z.string().optional(),
  
  // Visual styling
  visualStyle: VisualStyleSchema,
  
  // System properties
  properties: SystemPropertiesSchema,
  
  // Metadata
  isDefault: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type SystemTemplate = z.infer<typeof SystemTemplateSchema>;

/**
 * Collection of system templates
 */
export const SystemTemplateCollectionSchema = z.object({
  templates: z.array(SystemTemplateSchema),
  defaultTemplateId: z.string().optional(),
});

export type SystemTemplateCollection = z.infer<typeof SystemTemplateCollectionSchema>;
