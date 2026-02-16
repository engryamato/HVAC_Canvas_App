import { z } from 'zod';
import { BaseEntitySchema } from './base.schema';
import { MaterialSpecSchema } from './component-library.schema';

/**
 * Duct material types with associated roughness factors
 */
export const DuctMaterialSchema = z.enum(['galvanized', 'stainless', 'aluminum', 'flex']);

export type DuctMaterial = z.infer<typeof DuctMaterialSchema>;

/**
 * System type for ductwork
 */
export const SystemTypeSchema = z.enum(['supply', 'return', 'exhaust', 'outside_air']);

export type SystemType = z.infer<typeof SystemTypeSchema>;

/**
 * Validation result severity
 */
export const ValidationSeveritySchema = z.enum(['error', 'warning', 'info']);

export type ValidationSeverity = z.infer<typeof ValidationSeveritySchema>;

/**
 * Constraint validation status
 */
export const ConstraintStatusSchema = z.object({
  isValid: z.boolean(),
  violations: z.array(z.object({
    type: z.string(),
    severity: ValidationSeveritySchema,
    message: z.string(),
    suggestedFix: z.string().optional(),
  })).default([]),
  lastValidated: z.date().optional(),
});

export type ConstraintStatus = z.infer<typeof ConstraintStatusSchema>;

/**
 * Engineering data for calculations
 */
export const DuctEngineeringDataSchema = z.object({
  airflow: z.number().min(0), // CFM
  velocity: z.number().min(0), // FPM (calculated)
  pressureDrop: z.number().min(0), // in.w.g./100ft (calculated)
  friction: z.number().min(0), // friction factor
  equivalentDiameter: z.number().min(0).optional(), // for rectangular ducts
  reynoldsNumber: z.number().optional(),
});

export type DuctEngineeringData = z.infer<typeof DuctEngineeringDataSchema>;

/**
 * Duct shape determines which dimension fields are required
 */
export const DuctShapeSchema = z.enum(['round', 'rectangular']);

export type DuctShape = z.infer<typeof DuctShapeSchema>;

/**
 * Duct properties with conditional validation based on shape
 * - Round ducts require diameter
 * - Rectangular ducts require width and height
 */
export const DuctPropsSchema = z
  .object({
    name: z.string().min(1).max(100),
    shape: DuctShapeSchema,
    // Round duct dimension (required if shape === 'round')
    diameter: z
      .number()
      .min(4)
      .max(60)
      .optional()
      .describe('Diameter in inches (round ducts only)'),
    // Rectangular duct dimensions (required if shape === 'rectangular')
    width: z
      .number()
      .min(4)
      .max(96)
      .optional()
      .describe('Width in inches (rectangular ducts only)'),
    height: z
      .number()
      .min(4)
      .max(96)
      .optional()
      .describe('Height in inches (rectangular ducts only)'),
    // Common properties
    length: z.number().min(0.1).max(1000).describe('Length in feet'),
    material: DuctMaterialSchema,
    airflow: z.number().min(1).max(100000).describe('Airflow in CFM'),
    staticPressure: z.number().min(0).max(20).describe('Static pressure in in.w.g.'),
    // Connection references
    connectedFrom: z.string().uuid().optional().describe('Source entity ID'),
    connectedTo: z.string().uuid().optional().describe('Destination entity ID'),
    
    // Service & Catalog references
    serviceId: z.string().uuid().optional().describe('Active Service ID'),
    catalogItemId: z.string().optional().describe('Resolved Catalog Item ID'),
    
    // Parametric design fields
    systemType: SystemTypeSchema.optional(),
    materialSpec: MaterialSpecSchema.optional(),
    gauge: z.number().optional().describe('Metal gauge thickness'),
    insulated: z.boolean().optional(),
    insulationThickness: z.number().optional().describe('Insulation thickness in inches'),
    
    // Engineering data
    engineeringData: DuctEngineeringDataSchema.optional(),
    
    // Constraint status
    constraintStatus: ConstraintStatusSchema.optional(),
    
    // Auto-sizing flag
    autoSized: z.boolean().optional().describe('Indicates if duct was auto-sized'),
  })
  .refine(
    (data) => {
      // Validate shape-dependent fields
      if (data.shape === 'round') {
        return data.diameter !== undefined;
      } else {
        return data.width !== undefined && data.height !== undefined;
      }
    },
    {
      message: 'Round ducts require diameter; rectangular ducts require width and height',
    }
  );

export type DuctProps = z.infer<typeof DuctPropsSchema>;

/**
 * Calculated duct values
 */
export const DuctCalculatedSchema = z.object({
  area: z.number().nonnegative().describe('Cross-sectional area in sq in'),
  velocity: z.number().nonnegative().describe('Air velocity in FPM'),
  frictionLoss: z.number().nonnegative().describe('Friction loss in in.w.g./100ft'),
});

export type DuctCalculated = z.infer<typeof DuctCalculatedSchema>;

/**
 * Optional warnings for duct validation (e.g., velocity out of range)
 */
export const DuctWarningsSchema = z
  .object({
    velocity: z.string().optional(),
    constraintViolations: z.array(z.string()).optional().describe('Service constraint violations'),
  })
  .optional();

/**
 * Complete Duct entity schema
 */
export const DuctSchema = BaseEntitySchema.extend({
  type: z.literal('duct'),
  props: DuctPropsSchema,
  calculated: DuctCalculatedSchema,
  warnings: DuctWarningsSchema,
});



export type Duct = z.infer<typeof DuctSchema>;

export const DEFAULT_ROUND_DUCT_PROPS = {
  name: 'New Duct',
  shape: 'round' as const,
  diameter: 12,
  length: 10,
  material: 'galvanized' as const,
  airflow: 0, // Flow is calculated from connected terminals
  staticPressure: 0.1,
};

export const DEFAULT_RECTANGULAR_DUCT_PROPS = {
  name: 'New Duct',
  shape: 'rectangular' as const,
  width: 12,
  height: 8,
  length: 10,
  material: 'galvanized' as const,
  airflow: 0, // Flow is calculated from connected terminals
  staticPressure: 0.1,
};
