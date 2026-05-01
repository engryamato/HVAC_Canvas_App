import { z } from 'zod';
import { roundFeet } from '@/core/constants/coordinates';
import { BaseEntitySchema } from './base.schema';
import {
  ConstraintStatusSchema,
  DuctCalculatedSchema,
  DuctEngineeringDataSchema,
  DuctMaterialSchema,
  SystemTypeSchema,
} from './duct.schema';
import { MaterialSpecSchema } from './component-library.schema';

const SEGMENT_TOLERANCE_FEET = 0.001;

export const DuctRunShapeSchema = z.enum(['rectangular', 'round', 'flat_oval', 'flexible']);
export type DuctRunShape = z.infer<typeof DuctRunShapeSchema>;

export const DuctRunFamilySchema = z.enum([
  'standard_duct',
  'boiler_flue',
  'grease_duct',
  'generator_exhaust',
]);
export type DuctRunFamily = z.infer<typeof DuctRunFamilySchema>;

export const DuctSegmentSchema = z
  .object({
    index: z.number().int().nonnegative(),
    startStation: z.number().nonnegative().describe('Segment start station in feet'),
    endStation: z.number().positive().describe('Segment end station in feet'),
    length: z.number().positive().describe('Segment installed length in feet'),
    isPartial: z.boolean().describe('True when the segment is shorter than the nominal section length'),
  })
  .superRefine((segment, ctx) => {
    if (segment.endStation <= segment.startStation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endStation'],
        message: 'Segment end station must be greater than start station',
      });
    }

    const stationLength = roundFeet(segment.endStation - segment.startStation);
    const declaredLength = roundFeet(segment.length);

    if (Math.abs(stationLength - declaredLength) > SEGMENT_TOLERANCE_FEET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['length'],
        message: 'Segment length must match the station delta',
      });
    }
  });

export type DuctSegment = z.infer<typeof DuctSegmentSchema>;

const DuctRunPointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const DuctRunSegmentsSchema = z.array(DuctSegmentSchema).min(1).superRefine((segments, ctx) => {
  let previousEndStation = 0;

  segments.forEach((segment, index) => {
    if (segment.index !== index) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, 'index'],
        message: 'Segment index must match its array position',
      });
    }

    if (index > 0 && segment.startStation < previousEndStation - SEGMENT_TOLERANCE_FEET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, 'startStation'],
        message: 'Segment stations must be monotonic',
      });
    }

    previousEndStation = segment.endStation;
  });
});

const SharedDuctRunPropsSchema = z.object({
  name: z.string().min(1).max(100),
  engineeringSystem: DuctRunFamilySchema.optional().default('standard_duct'),
  specialtyToolId: z.string().optional(),
  systemType: SystemTypeSchema.optional(),
  material: DuctMaterialSchema,
  materialSpec: MaterialSpecSchema.optional(),
  gauge: z.number().optional().describe('Metal gauge thickness'),
  insulated: z.boolean().optional(),
  insulationThickness: z.number().optional().describe('Insulation thickness in inches'),
  airflow: z.number().min(0).max(100000).describe('Airflow in CFM'),
  staticPressure: z.number().min(0).max(20).describe('Static pressure in in.w.g.'),
  installLength: z.number().min(0.1).max(1000).describe('Installed run length in feet'),
  sectionLengthOverride: z.number().positive().optional().describe('Optional section length override in feet'),
  segments: DuctRunSegmentsSchema,
  startPoint: DuctRunPointSchema.optional(),
  endPoint: DuctRunPointSchema.optional(),
  connectedFrom: z.string().uuid().optional().describe('Source entity ID'),
  connectedTo: z.string().uuid().optional().describe('Destination entity ID'),
  serviceId: z.string().uuid().optional().describe('Active Service ID'),
  catalogItemId: z.string().optional().describe('Resolved Catalog Item ID'),
  engineeringData: DuctEngineeringDataSchema.optional(),
  constraintStatus: ConstraintStatusSchema.optional(),
  autoSized: z.boolean().optional().describe('Indicates if the run was auto-sized'),
});

export const RectangularDuctRunPropsSchema = SharedDuctRunPropsSchema.extend({
  shape: z.literal('rectangular'),
  width: z.number().min(4).max(96).describe('Width in inches'),
  height: z.number().min(4).max(96).describe('Height in inches'),
  diameter: z.undefined().optional(),
});

export const RoundDuctRunPropsSchema = SharedDuctRunPropsSchema.extend({
  shape: z.literal('round'),
  diameter: z.number().min(4).max(60).describe('Diameter in inches'),
  width: z.undefined().optional(),
  height: z.undefined().optional(),
});

export const FlatOvalDuctRunPropsSchema = SharedDuctRunPropsSchema.extend({
  shape: z.literal('flat_oval'),
  width: z.number().min(4).max(96).describe('Major axis width in inches'),
  height: z.number().min(4).max(96).describe('Minor axis height in inches'),
  diameter: z.undefined().optional(),
});

export const FlexibleDuctRunPropsSchema = SharedDuctRunPropsSchema.extend({
  shape: z.literal('flexible'),
  diameter: z.number().min(4).max(24).describe('Diameter in inches'),
  width: z.undefined().optional(),
  height: z.undefined().optional(),
});

export const DuctRunPropsSchema = z
  .preprocess((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return value;
    }

    const candidate = value as Record<string, unknown>;
    return {
      engineeringSystem: DuctRunFamilySchema.safeParse(candidate.engineeringSystem).success
        ? candidate.engineeringSystem
        : 'standard_duct',
      ...candidate,
    };
  }, z.discriminatedUnion('shape', [
    RectangularDuctRunPropsSchema,
    RoundDuctRunPropsSchema,
    FlatOvalDuctRunPropsSchema,
    FlexibleDuctRunPropsSchema,
  ]))
  .superRefine((props, ctx) => {
    const finalStation = props.segments[props.segments.length - 1]?.endStation ?? 0;
    const normalizedFinalStation = roundFeet(finalStation);
    const normalizedInstallLength = roundFeet(props.installLength);

    if (Math.abs(normalizedFinalStation - normalizedInstallLength) > SEGMENT_TOLERANCE_FEET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['segments'],
        message: 'Segments must reconcile to the install length',
      });
    }
  });

export type DuctRunProps = z.infer<typeof DuctRunPropsSchema>;

export const DuctRunSchema = BaseEntitySchema.extend({
  type: z.literal('duct_run'),
  props: DuctRunPropsSchema,
  calculated: DuctCalculatedSchema,
  warnings: z
    .object({
      velocity: z.string().optional(),
      constraintViolations: z.array(z.string()).optional(),
    })
    .optional(),
});

export type DuctRun = Omit<z.infer<typeof DuctRunSchema>, 'props'> & { props: DuctRunProps };

export const DEFAULT_ROUND_DUCT_RUN_PROPS: DuctRunProps = {
  name: 'New Duct Run',
  engineeringSystem: 'standard_duct',
  shape: 'round',
  diameter: 12,
  material: 'galvanized',
  airflow: 0,
  staticPressure: 0.1,
  installLength: 10,
  segments: [
    {
      index: 0,
      startStation: 0,
      endStation: 10,
      length: 10,
      isPartial: false,
    },
  ],
};

export const DEFAULT_RECTANGULAR_DUCT_RUN_PROPS: DuctRunProps = {
  name: 'New Duct Run',
  engineeringSystem: 'standard_duct',
  shape: 'rectangular',
  width: 12,
  height: 8,
  material: 'galvanized',
  airflow: 0,
  staticPressure: 0.1,
  installLength: 10,
  segments: [
    {
      index: 0,
      startStation: 0,
      endStation: 10,
      length: 10,
      isPartial: false,
    },
  ],
};
