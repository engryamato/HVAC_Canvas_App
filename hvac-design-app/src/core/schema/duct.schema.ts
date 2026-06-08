import { z } from 'zod';
import { BaseEntitySchema, ServiceIdSchema } from './base.schema';
import { MaterialSpecSchema } from './component-library.schema';
import { EngineeringSystemSchema } from './unified-component.schema';

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
  pressureDrop: z.number().min(0).describe('Stored pressure-drop / friction-rate value in in.w.g./100ft'),
  friction: z.number().min(0).describe('Compatibility alias of the stored per-100-ft pressure-drop value'),
  equivalentDiameter: z.number().min(0).optional(), // for rectangular ducts
  reynoldsNumber: z.number().optional(),
  systemType: SystemTypeSchema.optional().describe('System bucket used for validation limits'),
});

export type DuctEngineeringData = z.infer<typeof DuctEngineeringDataSchema>;

/**
 * Duct shape determines which dimension fields are required
 */
export const DuctShapeSchema = z.enum(['round', 'rectangular']);

export type DuctShape = z.infer<typeof DuctShapeSchema>;

/**
 * WS6b — SMACNA construction pressure class (in. w.g.) and seal class.
 * Optional on ducts/runs; a project-level default applies when unset
 * (`defaultPressureClass` = '2', `defaultSealClass` = 'A'). Greenfield: old
 * ducts have no value and inherit the project default at read time.
 */
export const PressureClassSchema = z.enum(['0.5', '1', '2', '3', '4', '6', '10']);
export type PressureClass = z.infer<typeof PressureClassSchema>;

// SMACNA seal classes plus `unsealed` (< 2" w.g., non-VAV). A is the strictest.
export const SealClassSchema = z.enum(['unsealed', 'A', 'B', 'C']);
export type SealClass = z.infer<typeof SealClassSchema>;

export const DEFAULT_PRESSURE_CLASS: PressureClass = '2';
export const DEFAULT_SEAL_CLASS: SealClass = 'A';

export const DuctSizeProvenanceValueSchema = z.enum(['default', 'computed', 'specified']);

export type DuctSizeProvenanceValue = z.infer<typeof DuctSizeProvenanceValueSchema>;

export const DuctSizeProvenanceSchema = z.object({
  width: DuctSizeProvenanceValueSchema.optional(),
  height: DuctSizeProvenanceValueSchema.optional(),
  diameter: DuctSizeProvenanceValueSchema.optional(),
  equivalentDiameter: DuctSizeProvenanceValueSchema.optional(),
  gauge: DuctSizeProvenanceValueSchema.optional(),
});

export type DuctSizeProvenance = z.infer<typeof DuctSizeProvenanceSchema>;

/**
 * Duct properties with conditional validation based on shape
 * - Round ducts require diameter
 * - Rectangular ducts require width and height
 */
const SharedDuctPropsSchema = z
  .object({
    name: z.string().min(1).max(100),
    engineeringSystem: EngineeringSystemSchema.optional().default('standard_duct'),
    specialtyToolId: z.string().optional(),
    shape: DuctShapeSchema,
    diameter: z
      .number()
      .min(4)
      .max(60)
      .optional()
      .describe('Diameter in inches (round ducts only)'),
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
    equivalentDiameter: z
      .number()
      .min(0)
      .optional()
      .describe('Equivalent round diameter in inches'),
    previousRectangularWidth: z
      .number()
      .min(4)
      .max(96)
      .optional()
      .describe('Last rectangular width before round conversion'),
    previousRectangularHeight: z
      .number()
      .min(4)
      .max(96)
      .optional()
      .describe('Last rectangular height before round conversion'),
    length: z.number().min(0.1).max(1000).describe('Length in feet'),
    designStartPoint: z
      .object({ x: z.number(), y: z.number() })
      .optional()
      .describe('Authored, uncut centerline start point (world px); restores after fitting detach'),
    designEndPoint: z
      .object({ x: z.number(), y: z.number() })
      .optional()
      .describe('Authored, uncut centerline end point (world px); restores after fitting detach'),
    designLength: z
      .number()
      .min(0.1)
      .max(1000)
      .optional()
      .describe('Authored, uncut length in feet'),
    material: DuctMaterialSchema,
    airflow: z.number().min(0).max(100000).describe('Airflow in CFM'),
    staticPressure: z.number().min(0).max(20).describe('Static pressure in in.w.g.'),
    connectedFrom: z.string().uuid().optional().describe('Source entity ID'),
    connectedTo: z.string().uuid().optional().describe('Destination entity ID'),
    serviceId: ServiceIdSchema,
    catalogItemId: z.string().optional().describe('Resolved Catalog Item ID'),
    systemType: SystemTypeSchema.optional(),
    materialSpec: MaterialSpecSchema.optional(),
    gauge: z.number().optional().describe('Metal gauge thickness'),
    pressureClass: PressureClassSchema.optional().describe('SMACNA construction pressure class (in. w.g.); inherits project default when unset'),
    sealClass: SealClassSchema.optional().describe('SMACNA seal class A/B/C; inherits project default when unset'),
    isVAV: z.boolean().optional().describe('VAV system upstream of terminal boxes (SMACNA: <2" w.g. then requires Seal C, not unsealed)'),
    insulated: z.boolean().optional(),
    insulationThickness: z.number().optional().describe('Insulation thickness in inches'),
    engineeringData: DuctEngineeringDataSchema.optional(),
    constraintStatus: ConstraintStatusSchema.optional(),
    provenance: DuctSizeProvenanceSchema.optional(),
    autoSized: z.boolean().optional().describe('Indicates if duct was auto-sized'),
  })
  .refine(
    (data) => {
      if (data.shape === 'round') {
        return data.diameter !== undefined;
      }
      return data.width !== undefined && data.height !== undefined;
    },
    {
      message: 'Round ducts require diameter; rectangular ducts require width and height',
    }
  );

export const StandardDuctPropsSchema = SharedDuctPropsSchema.safeExtend({
  engineeringSystem: z.literal('standard_duct'),
});

export const DuctPropsSchema = z.preprocess(
  (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return value;
    }

    const candidate = value as Record<string, unknown>;
    return {
      engineeringSystem: candidate.engineeringSystem ?? 'standard_duct',
      ...candidate,
    };
  },
  StandardDuctPropsSchema
);

export type DuctProps = z.infer<typeof DuctPropsSchema>;

/**
 * Calculated duct values
 */
export const DuctCalculatedSchema = z.object({
  area: z.number().nonnegative().describe('Cross-sectional area in sq in'),
  velocity: z.number().nonnegative().describe('Air velocity in FPM'),
  frictionLoss: z.number().nonnegative().describe('Stored pressure-drop / friction-rate value in in.w.g./100ft'),
  cumulativePressureDrop: z
    .number()
    .nonnegative()
    .optional()
    .describe('Total pressure loss from source equipment to this duct in in.w.g.'),
  availableStaticPressure: z
    .number()
    .nonnegative()
    .optional()
    .describe('Remaining source static pressure at this duct in in.w.g.'),
  surfaceArea: z
    .number()
    .nonnegative()
    .optional()
    .describe('WS6a lateral surface area in sq ft (computed, read-only)'),
  weight: z
    .number()
    .nonnegative()
    .optional()
    .describe('WS6a fabricated weight in lb (computed; omitted/"—" when gauge unresolved)'),
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



export type Duct = Omit<z.infer<typeof DuctSchema>, 'props'> & { props: DuctProps };

export const DEFAULT_ROUND_DUCT_PROPS = {
  name: 'New Duct',
  engineeringSystem: 'standard_duct' as const,
  shape: 'round' as const,
  diameter: 12,
  provenance: {
    diameter: 'computed',
  },
  length: 10,
  material: 'galvanized' as const,
  airflow: 0, // Flow is calculated from connected terminals
  staticPressure: 0.1,
};

export const DEFAULT_RECTANGULAR_DUCT_PROPS = {
  name: 'New Duct',
  engineeringSystem: 'standard_duct' as const,
  shape: 'rectangular' as const,
  width: 12,
  height: 8,
  provenance: {
    width: 'computed',
    height: 'default',
  },
  length: 10,
  material: 'galvanized' as const,
  airflow: 0, // Flow is calculated from connected terminals
  staticPressure: 0.1,
};
