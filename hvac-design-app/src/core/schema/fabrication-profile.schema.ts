import { z } from 'zod';
import type { DuctRunShape } from './duct-run.schema';

export const DuctFabricationFamilySchema = z.enum([
  'rectangular_rigid',
  'round_rigid',
  'flat_oval',
  'flexible',
]);

export type DuctFabricationFamily = z.infer<typeof DuctFabricationFamilySchema>;

export const DUCT_FABRICATION_FAMILY_LABELS: Record<DuctFabricationFamily, string> = {
  rectangular_rigid: 'Rectangular',
  round_rigid: 'Round Rigid',
  flat_oval: 'Flat Oval',
  flexible: 'Flexible',
};

export const FABRICATION_SECTION_LENGTH_MIN_FEET = 0.5;
export const FABRICATION_SECTION_LENGTH_MAX_FEET = 20;

export const FabricationProfileEntrySchema = z
  .object({
    family: DuctFabricationFamilySchema,
    name: z.string().min(1).max(100),
    defaultSectionLength: z
      .number()
      .min(FABRICATION_SECTION_LENGTH_MIN_FEET)
      .max(FABRICATION_SECTION_LENGTH_MAX_FEET),
    allowedSectionLengths: z
      .array(
        z
          .number()
          .min(FABRICATION_SECTION_LENGTH_MIN_FEET)
          .max(FABRICATION_SECTION_LENGTH_MAX_FEET)
      )
      .min(1),
    minSectionLength: z
      .number()
      .min(FABRICATION_SECTION_LENGTH_MIN_FEET)
      .max(FABRICATION_SECTION_LENGTH_MAX_FEET),
    maxSectionLength: z
      .number()
      .min(FABRICATION_SECTION_LENGTH_MIN_FEET)
      .max(FABRICATION_SECTION_LENGTH_MAX_FEET),
  })
  .superRefine((entry, ctx) => {
    if (entry.minSectionLength > entry.maxSectionLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minSectionLength'],
        message: 'Minimum section length cannot exceed the maximum.',
      });
    }

    if (
      entry.defaultSectionLength < entry.minSectionLength ||
      entry.defaultSectionLength > entry.maxSectionLength
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['defaultSectionLength'],
        message: 'Default section length must stay within the configured min/max range.',
      });
    }

    const outOfRangeAllowed = entry.allowedSectionLengths.find(
      (length) => length < entry.minSectionLength || length > entry.maxSectionLength
    );
    if (typeof outOfRangeAllowed === 'number') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allowedSectionLengths'],
        message: `Allowed section length ${outOfRangeAllowed} ft is outside the configured min/max range.`,
      });
    }

    if (!entry.allowedSectionLengths.includes(entry.defaultSectionLength)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allowedSectionLengths'],
        message: 'Allowed section lengths must include the default section length.',
      });
    }

    const uniqueLengths = new Set(entry.allowedSectionLengths);
    if (uniqueLengths.size !== entry.allowedSectionLengths.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allowedSectionLengths'],
        message: 'Allowed section lengths must not contain duplicates.',
      });
    }
  });

export type FabricationProfileEntry = z.infer<typeof FabricationProfileEntrySchema>;

export const FabricationProfileSchema = z.object({
  profiles: z.record(DuctFabricationFamilySchema, FabricationProfileEntrySchema),
});

export type FabricationProfile = z.infer<typeof FabricationProfileSchema>;

export function resolveDuctFabricationFamily(shape: DuctRunShape): DuctFabricationFamily {
  switch (shape) {
    case 'rectangular':
      return 'rectangular_rigid';
    case 'round':
      return 'round_rigid';
    case 'flat_oval':
      return 'flat_oval';
    case 'flexible':
      return 'flexible';
  }
}

function createProfileEntry(
  family: DuctFabricationFamily,
  defaultSectionLength = 5
): FabricationProfileEntry {
  return {
    family,
    name: DUCT_FABRICATION_FAMILY_LABELS[family],
    defaultSectionLength,
    allowedSectionLengths: [4, 5, 6, 8, 10],
    minSectionLength: 1,
    maxSectionLength: 20,
  };
}

export const DEFAULT_FABRICATION_PROFILE: FabricationProfile = FabricationProfileSchema.parse({
  profiles: {
    rectangular_rigid: createProfileEntry('rectangular_rigid', 5),
    round_rigid: createProfileEntry('round_rigid', 5),
    flat_oval: createProfileEntry('flat_oval', 5),
    flexible: createProfileEntry('flexible', 5),
  },
});
