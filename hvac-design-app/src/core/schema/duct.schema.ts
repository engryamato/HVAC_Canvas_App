import { z } from 'zod';
import { BaseEntitySchema } from './base.schema';
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
    length: z.number().min(0.1).max(1000).describe('Length in feet'),
    material: DuctMaterialSchema,
    airflow: z.number().min(0).max(100000).describe('Airflow in CFM'),
    staticPressure: z.number().min(0).max(20).describe('Static pressure in in.w.g.'),
    connectedFrom: z.string().uuid().optional().describe('Source entity ID'),
    connectedTo: z.string().uuid().optional().describe('Destination entity ID'),
    serviceId: z.string().uuid().optional().describe('Active Service ID'),
    catalogItemId: z.string().optional().describe('Resolved Catalog Item ID'),
    systemType: SystemTypeSchema.optional(),
    materialSpec: MaterialSpecSchema.optional(),
    gauge: z.number().optional().describe('Metal gauge thickness'),
    insulated: z.boolean().optional(),
    insulationThickness: z.number().optional().describe('Insulation thickness in inches'),
    engineeringData: DuctEngineeringDataSchema.optional(),
    constraintStatus: ConstraintStatusSchema.optional(),
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

export const BoilerFluePropsSchema = SharedDuctPropsSchema.safeExtend({
  engineeringSystem: z.literal('boiler_flue'),
  wallType: z.enum(['single', 'double']).optional(),
  condensateSlope: z.number().optional(),
  btuRating: z.number().optional(),
  flueGasDewpoint: z.number().optional(),
  venting: z.enum(['natural', 'forced']).optional(),
});

export const GreaseDuctPropsSchema = SharedDuctPropsSchema.safeExtend({
  engineeringSystem: z.literal('grease_duct'),
  constructionType: z.string().optional(),
  fireRating: z.string().optional(),
  liquidTight: z.boolean().optional(),
  weldSpec: z.string().optional(),
});

export const GeneratorExhaustPropsSchema = SharedDuctPropsSchema.safeExtend({
  engineeringSystem: z.literal('generator_exhaust'),
  connectionType: z.enum(['flanged', 'slip_fit']).optional(),
  backpressureLimit: z.number().optional(),
  exhaustTempF: z.number().optional(),
  engineModel: z.string().optional(),
});

export const DuctPropsSchema = z.preprocess(
  (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return value;
    }

    const candidate = value as Record<string, unknown>;
    return {
      engineeringSystem:
        EngineeringSystemSchema.safeParse(candidate.engineeringSystem).success
          ? candidate.engineeringSystem
          : 'standard_duct',
      ...candidate,
    };
  },
  z.discriminatedUnion('engineeringSystem', [
    StandardDuctPropsSchema,
    BoilerFluePropsSchema,
    GreaseDuctPropsSchema,
    GeneratorExhaustPropsSchema,
  ])
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



export type Duct = Omit<z.infer<typeof DuctSchema>, 'props'> & { props: DuctProps };

export const DEFAULT_ROUND_DUCT_PROPS = {
  name: 'New Duct',
  engineeringSystem: 'standard_duct' as const,
  shape: 'round' as const,
  diameter: 12,
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
  length: 10,
  material: 'galvanized' as const,
  airflow: 0, // Flow is calculated from connected terminals
  staticPressure: 0.1,
};
