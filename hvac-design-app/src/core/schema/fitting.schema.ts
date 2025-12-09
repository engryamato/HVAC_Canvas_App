import { z } from 'zod';
import { BaseEntitySchema } from './base.schema';

/**
 * Fitting types for duct connections
 */
export const FittingTypeSchema = z.enum(['elbow_90', 'elbow_45', 'tee', 'reducer', 'cap']);

export type FittingType = z.infer<typeof FittingTypeSchema>;

/**
 * Fitting properties
 */
export const FittingPropsSchema = z.object({
  fittingType: FittingTypeSchema,
  angle: z.number().min(0).max(180).optional().describe('Angle in degrees (for elbows)'),
  inletDuctId: z.string().uuid().optional(),
  outletDuctId: z.string().uuid().optional(),
});

export type FittingProps = z.infer<typeof FittingPropsSchema>;

/**
 * Calculated fitting values
 */
export const FittingCalculatedSchema = z.object({
  equivalentLength: z.number().nonnegative().describe('Equivalent length in feet'),
  pressureLoss: z.number().nonnegative().describe('Pressure loss in in.w.g.'),
});

export type FittingCalculated = z.infer<typeof FittingCalculatedSchema>;

/**
 * Complete Fitting entity schema
 */
export const FittingSchema = BaseEntitySchema.extend({
  type: z.literal('fitting'),
  props: FittingPropsSchema,
  calculated: FittingCalculatedSchema,
});

export type Fitting = z.infer<typeof FittingSchema>;

/**
 * Default values for fittings by type
 */
export const DEFAULT_FITTING_PROPS: Record<FittingType, FittingProps> = {
  elbow_90: {
    fittingType: 'elbow_90',
    angle: 90,
  },
  elbow_45: {
    fittingType: 'elbow_45',
    angle: 45,
  },
  tee: {
    fittingType: 'tee',
  },
  reducer: {
    fittingType: 'reducer',
  },
  cap: {
    fittingType: 'cap',
  },
};

/**
 * Default calculated values for a fitting
 */
export const DEFAULT_FITTING_CALCULATED: FittingCalculated = {
  equivalentLength: 0,
  pressureLoss: 0,
};

