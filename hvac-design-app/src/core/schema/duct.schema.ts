import { z } from 'zod';
import { BaseEntitySchema } from './base.schema';

/**
 * Duct material types with associated roughness factors
 */
export const DuctMaterialSchema = z.enum(['galvanized', 'stainless', 'aluminum', 'flex']);

export type DuctMaterial = z.infer<typeof DuctMaterialSchema>;

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
    diameter: z.number().min(4).max(60).optional().describe('Diameter in inches (round ducts only)'),
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
 * Complete Duct entity schema
 */
export const DuctSchema = BaseEntitySchema.extend({
  type: z.literal('duct'),
  props: DuctPropsSchema,
  calculated: DuctCalculatedSchema,
});

export type Duct = z.infer<typeof DuctSchema>;

/**
 * Default values for round duct
 */
export const DEFAULT_ROUND_DUCT_PROPS = {
  name: 'New Duct',
  shape: 'round' as const,
  diameter: 12,
  length: 10,
  material: 'galvanized' as const,
  airflow: 500,
  staticPressure: 0.1,
};

/**
 * Default values for rectangular duct
 */
export const DEFAULT_RECTANGULAR_DUCT_PROPS = {
  name: 'New Duct',
  shape: 'rectangular' as const,
  width: 12,
  height: 8,
  length: 10,
  material: 'galvanized' as const,
  airflow: 500,
  staticPressure: 0.1,
};

