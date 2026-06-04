import { z } from 'zod';
import { roundFeet } from '@/core/constants/coordinates';
import { BaseEntitySchema, ServiceIdSchema } from './base.schema';
import {
  ConstraintStatusSchema,
  DuctCalculatedSchema,
  DuctEngineeringDataSchema,
  DuctMaterialSchema,
  DuctSizeProvenanceSchema,
  PressureClassSchema,
  SealClassSchema,
  SystemTypeSchema,
} from './duct.schema';
import { MaterialSpecSchema } from './component-library.schema';

const SEGMENT_TOLERANCE_FEET = 0.001;

export const DuctRunShapeSchema = z.enum(['rectangular', 'round', 'flat_oval', 'flexible']);
export type DuctRunShape = z.infer<typeof DuctRunShapeSchema>;

export const DuctRunFamilySchema = z.enum(['standard_duct']);
export type DuctRunFamily = z.infer<typeof DuctRunFamilySchema>;

export const InsulationTypeSchema = z.enum([
  'liner',
  'wrap',
  'double_wall_perforated',
  'double_wall_non_perforated',
]);
export type InsulationType = z.infer<typeof InsulationTypeSchema>;

export const DuctEndTypeSchema = z.enum(['flange', 'raw', 'crimped', 'coupled']);
export type DuctEndType = z.infer<typeof DuctEndTypeSchema>;

export const DuctSegmentSchema = z
  .object({
    index: z.number().int().nonnegative(),
    startStation: z.number().nonnegative().describe('Segment start station in feet'),
    endStation: z.number().positive().describe('Segment end station in feet'),
    length: z.number().positive().describe('Segment installed length in feet'),
    isPartial: z.boolean().describe('True when the segment is shorter than the nominal section length'),
    insulationType: InsulationTypeSchema.optional(),
    insulationThickness: z.number().min(0.5).max(6).optional().describe('Segment insulation thickness in inches'),
    startEndType: DuctEndTypeSchema.optional(),
    endEndType: DuctEndTypeSchema.optional(),
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
  pressureClass: PressureClassSchema.optional().describe('SMACNA construction pressure class (in. w.g.); inherits project default when unset'),
  sealClass: SealClassSchema.optional().describe('SMACNA seal class A/B/C; inherits project default when unset'),
  insulationType: InsulationTypeSchema.optional(),
  insulationThickness: z.number().min(0.5).max(6).optional().describe('Insulation thickness in inches'),
  startEndType: DuctEndTypeSchema.optional(),
  endEndType: DuctEndTypeSchema.optional(),
  previousRectangularWidth: z.number().min(4).max(96).optional().describe('Last rectangular width before round/flexible conversion'),
  previousRectangularHeight: z.number().min(4).max(96).optional().describe('Last rectangular height before round/flexible conversion'),
  equivalentDiameter: z.number().min(0).optional().describe('Equivalent round diameter in inches'),
  airflow: z.number().min(0).max(100000).describe('Airflow in CFM'),
  staticPressure: z.number().min(0).max(20).describe('Static pressure in in.w.g.'),
  installLength: z.number().min(0.1).max(1000).describe('Installed run length in feet'),
  sectionLengthOverride: z.number().positive().optional().describe('Optional section length override in feet'),
  segments: DuctRunSegmentsSchema,
  startPoint: DuctRunPointSchema.optional(),
  endPoint: DuctRunPointSchema.optional(),
  designStartPoint: DuctRunPointSchema.optional().describe('Authored, uncut centerline start point'),
  designEndPoint: DuctRunPointSchema.optional().describe('Authored, uncut centerline end point'),
  designLength: z.number().min(0.1).max(1000).optional().describe('Authored, uncut run length in feet'),
  connectedFrom: z.string().uuid().optional().describe('Source entity ID'),
  connectedTo: z.string().uuid().optional().describe('Destination entity ID'),
  serviceId: ServiceIdSchema,
  catalogItemId: z.string().optional().describe('Resolved Catalog Item ID'),
  engineeringData: DuctEngineeringDataSchema.optional(),
  constraintStatus: ConstraintStatusSchema.optional(),
  provenance: DuctSizeProvenanceSchema.optional(),
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
    const insulationType = candidate.insulationType ?? (candidate.insulated === true ? 'wrap' : undefined);
    const insulationThickness = candidate.insulationThickness ?? 1;
    const startEndType = candidate.startEndType ?? 'flange';
    const endEndType = candidate.endEndType ?? 'flange';
    const segments = Array.isArray(candidate.segments)
      ? candidate.segments.map((segment) => {
          if (!segment || typeof segment !== 'object' || Array.isArray(segment)) {
            return segment;
          }

          const segmentCandidate = segment as Record<string, unknown>;
          const segmentInsulationType = segmentCandidate.insulationType ?? insulationType;
          return {
            ...segmentCandidate,
            ...(segmentInsulationType !== undefined ? { insulationType: segmentInsulationType } : {}),
            insulationThickness: segmentCandidate.insulationThickness ?? insulationThickness,
            startEndType: segmentCandidate.startEndType ?? startEndType,
            endEndType: segmentCandidate.endEndType ?? endEndType,
          };
        })
      : candidate.segments;

    return {
      ...candidate,
      engineeringSystem: candidate.engineeringSystem ?? 'standard_duct',
      designStartPoint: candidate.designStartPoint ?? candidate.startPoint,
      designEndPoint: candidate.designEndPoint ?? candidate.endPoint,
      designLength: candidate.designLength ?? candidate.installLength,
      ...(insulationType !== undefined ? { insulationType } : {}),
      insulationThickness,
      startEndType,
      endEndType,
      segments,
    };
  }, z.discriminatedUnion('shape', [
    RectangularDuctRunPropsSchema,
    RoundDuctRunPropsSchema,
    FlatOvalDuctRunPropsSchema,
    FlexibleDuctRunPropsSchema,
  ]))
  .superRefine((props, ctx) => {
    if (props.shape === 'flexible' && props.insulationType && props.insulationType !== 'wrap') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['insulationType'],
        message: 'Flexible duct insulation can only be factory wrap',
      });
    }

    if (props.shape === 'flexible') {
      props.segments.forEach((segment, index) => {
        if (segment.insulationType && segment.insulationType !== 'wrap') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['segments', index, 'insulationType'],
            message: 'Flexible duct segment insulation can only be factory wrap',
          });
        }
      });
    }

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
  provenance: {
    diameter: 'computed',
  },
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
  provenance: {
    width: 'computed',
    height: 'default',
  },
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
