import { z } from 'zod';
import {
  EngineeringPropertiesSchema,
  PricingDataSchema,
  MaterialSpecSchema,
  ComponentCategorySchema,
  ComponentTemplateSchema,
} from './component-library.schema';

const CoercedDateSchema = z.coerce.date();

export const ComponentClassSchema = z.enum(['duct', 'fitting', 'equipment', 'accessory']);
export type ComponentClass = z.infer<typeof ComponentClassSchema>;

export const EngineeringSystemSchema = z.enum(['standard_duct', 'universal']);
export type EngineeringSystem = z.infer<typeof EngineeringSystemSchema>;

export const CatalogSourceSchema = z.enum(['system', 'custom']);
export type CatalogSource = z.infer<typeof CatalogSourceSchema>;
export const CatalogSystemTypeSchema = z.enum(['supply', 'return', 'exhaust', 'outside_air']);
export type CatalogSystemType = z.infer<typeof CatalogSystemTypeSchema>;

export const SupportedArchetypesSchema = z.object({
  duct: z.array(z.string()).default([]),
  fitting: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  accessory: z.array(z.string()).default([]),
});
export type SupportedArchetypes = z.infer<typeof SupportedArchetypesSchema>;

export const SystemProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  engineeringSystem: EngineeringSystemSchema,
  defaultSystemType: CatalogSystemTypeSchema,
  color: z.string(),
  source: z.enum(['baseline', 'custom']).default('baseline'),
  supportedArchetypes: SupportedArchetypesSchema,
  fittingRules: z.array(z.object({
    angle: z.number(),
    fittingType: z.string(),
    preference: z.number().default(1),
  })).default([]),
  dimensionalConstraints: z.record(z.string(), z.unknown()).default({}),
  velocityLimits: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  complianceRefs: z.array(z.string()).default([]),
  calculationCapabilities: z.array(
    z.enum(['sizing', 'pressure_drop', 'compliance', 'load'])
  ).default([]),
});
export type SystemProfile = z.infer<typeof SystemProfileSchema>;

export const ActivationIntentSchema = z.object({
  entryId: z.string(),
  componentClass: ComponentClassSchema,
  specialtyToolId: z.string().nullable(),
  engineeringSystem: EngineeringSystemSchema,
  systemType: CatalogSystemTypeSchema.optional(),
  defaultSystemType: CatalogSystemTypeSchema.optional(),
});
export type ActivationIntent = z.infer<typeof ActivationIntentSchema>;

/**
 * Canonical Traycer catalog entry shape. Compatibility fields from the older
 * V2 store are intentionally preserved only so legacy callers can migrate
 * incrementally.
 */
export const CatalogEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  componentClass: ComponentClassSchema,
  categoryId: z.string().min(1),
  typeId: z.string().min(1),
  engineeringSystem: EngineeringSystemSchema,
  placeable: z.boolean().default(true),
  source: CatalogSourceSchema.default('system'),
  specialtyToolId: z.string().optional(),
  subtype: z.string().optional(),
  recommendedFittingEntryIds: z.array(z.string()).optional().default([]),
  recommendedAccessoryEntryIds: z.array(z.string()).optional().default([]),
  recommendedEquipmentEntryIds: z.array(z.string()).optional().default([]),
  iconKey: z.string().optional(),
  connectionNotes: z.array(z.string()).optional().default([]),

  manufacturer: z.string().optional(),
  model: z.string().optional(),
  partNumber: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),

  systemType: CatalogSystemTypeSchema.optional(),
  pressureClass: z.enum(['low', 'medium', 'high']).optional(),

  engineeringProperties: EngineeringPropertiesSchema,
  pricing: PricingDataSchema,
  materials: z.array(MaterialSpecSchema).default([]),
  defaultDimensions: z.record(z.string(), z.number()).optional(),

  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
  icon: z.string().optional(),
  keySpec: z.string().optional(),
  isCustom: z.boolean().default(false),
  createdAt: CoercedDateSchema.optional(),
  updatedAt: CoercedDateSchema.optional(),

  // Compatibility aliases for older callers.
  category: ComponentClassSchema.optional(),
  type: z.string().optional(),
}).transform((entry) => ({
  ...entry,
  category: entry.category ?? entry.componentClass,
  type: entry.type ?? entry.typeId,
}));

export type CatalogEntry = z.infer<typeof CatalogEntrySchema>;

/**
 * @deprecated Use CatalogEntrySchema instead.
 * Compatibility alias preserved temporarily for existing consumers.
 */
export const UnifiedComponentDefinitionSchema = CatalogEntrySchema;
/**
 * @deprecated Use CatalogEntry instead.
 * Compatibility alias preserved temporarily for existing consumers.
 */
export type UnifiedComponentDefinition = CatalogEntry;

export type { z as ZodNamespace };
export { ComponentCategorySchema, ComponentTemplateSchema };
export type ComponentCategory = z.infer<typeof ComponentCategorySchema>;
export type ComponentTemplate = z.infer<typeof ComponentTemplateSchema>;
