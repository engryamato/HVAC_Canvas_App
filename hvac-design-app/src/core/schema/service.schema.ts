/**
 * Service Data Model
 * 
 * Defines the structure for HVAC Services which serve as project-specific
 * specifications for engineering rules.
 */
import { z } from 'zod';

export const SystemTypeSchema = z.enum([
  'supply',
  'return',
  'exhaust',
  'fresh_air',
  'relief_air',
  'other'
]);

export type SystemType = z.infer<typeof SystemTypeSchema>;

export const PressureClassSchema = z.enum([
  'low',    // ≤ 2" WG
  'medium', // 2-6" WG
  'high',   // > 6" WG
  // Legacy values kept for backward compatibility with persisted data/tests.
  'low-pressure',
  'medium-pressure',
  'high-pressure',
]);

export type PressureClass = z.infer<typeof PressureClassSchema>;

export const DuctShapeSchema = z.enum(['round', 'rectangular']);
export type DuctShape = z.infer<typeof DuctShapeSchema>;

export const DuctMaterialSchema = z.enum(['galvanized', 'stainless', 'aluminum', 'flex']);
export type DuctMaterial = z.infer<typeof DuctMaterialSchema>;

// Rules for dimensional constraints
export const DimensionalConstraintsSchema = z.object({
  minDiameter: z.number().optional(),
  maxDiameter: z.number().optional(),
  minWidth: z.number().optional(),
  maxWidth: z.number().optional(),
  minHeight: z.number().optional(),
  maxHeight: z.number().optional(),
  allowedShapes: z.array(DuctShapeSchema),
});

// Rules for automated fitting selection based on connection angle
export const FittingRuleSchema = z.object({
  angle: z.number(), // e.g. 90, 45
  fittingType: z.string(), // e.g. "elbow_90_stamped", "elbow_90_gore"
  preference: z.number().default(1), // Higher is better
});

export const ServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  systemType: SystemTypeSchema,
  
  // Core Engineering Properties
  material: DuctMaterialSchema,
  pressureClass: PressureClassSchema,
  
  // Validation Rules
  dimensionalConstraints: DimensionalConstraintsSchema,
  
  // Automation Rules
  fittingRules: z.array(FittingRuleSchema),
  
  // Catalog Preferences
  manufacturerPreferences: z.array(z.string()), // Ranked list of preferred manufacturers
  
  // Metadata
  source: z.enum(['baseline', 'custom']).default('custom'),
  color: z.string().optional(), // Visual override color (hex)
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Service = z.infer<typeof ServiceSchema>;

export const ServiceTemplateSchema = ServiceSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  id: z.string(), // Templates have static string IDs like 'tmpl_low_pressure_supply'
  isTemplate: z.literal(true),
});

export type ServiceTemplate = z.infer<typeof ServiceTemplateSchema>;

// -- Defaults --

export const DEFAULT_DIMENSIONAL_CONSTRAINTS: z.infer<typeof DimensionalConstraintsSchema> = {
  minDiameter: 4,
  maxDiameter: 60,
  minWidth: 4,
  maxWidth: 120,
  minHeight: 4,
  maxHeight: 60,
  allowedShapes: ['round', 'rectangular'],
};
