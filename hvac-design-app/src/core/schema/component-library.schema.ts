import { z } from 'zod';

const CoercedDateSchema = z.coerce.date();

/**
 * Material specification with physical and cost properties
 */
export const MaterialSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  grade: z.string().optional(), // e.g., "24-gauge", "26-gauge"
  type: z.enum(['galvanized_steel', 'stainless_steel', 'aluminum', 'fiberglass', 'flexible']),
  cost: z.number().min(0), // Cost per unit
  costUnit: z.enum(['linear_foot', 'square_foot', 'piece']),
  properties: z.object({
    weight: z.number().optional(), // lb/ft² or lb/ft
    thermalConductivity: z.number().optional(),
    maxTemperature: z.number().optional(), // °F
  }).optional(),
});

export type MaterialSpec = z.infer<typeof MaterialSpecSchema>;

/**
 * Engineering properties for HVAC calculations
 */
export const EngineeringPropertiesSchema = z.object({
  frictionFactor: z.number().min(0), // Darcy friction factor
  maxVelocity: z.number().min(0), // Max recommended air velocity (fpm)
  minVelocity: z.number().min(0).optional(), // Min recommended air velocity (fpm)
  pressureCoefficient: z.number().optional(), // Pressure loss coefficient
  maxPressureDrop: z.number().optional(), // in. w.g./100 ft
  roughness: z.number().optional(), // Absolute roughness (ft)
});

export type EngineeringProperties = z.infer<typeof EngineeringPropertiesSchema>;

/**
 * Pricing data with labor and waste factors
 */
export const PricingDataSchema = z.object({
  materialCost: z.number().min(0),
  laborUnits: z.number().min(0), // Labor hours per unit
  laborRate: z.number().min(0).optional(), // $/hour (can override project rate)
  wasteFactor: z.number().min(0).max(1), // 0.0 to 1.0 (10% waste = 0.10)
  markup: z.number().min(0).optional(), // Markup percentage override
  notes: z.string().optional(),
});

export type PricingData = z.infer<typeof PricingDataSchema>;

/**
 * Hierarchical component categories
 */
export const ComponentCategorySchema: z.ZodType<ComponentCategory> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    description: z.string().optional(),
    icon: z.string().optional(),
    subcategories: z.array(ComponentCategorySchema).optional(),
  })
);

export type ComponentCategory = {
  id: string;
  name: string;
  parentId: string | null;
  description?: string;
  icon?: string;
  subcategories?: ComponentCategory[];
};

/**
 * Base component definition in the library
 */
export const ComponentDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(), // Category ID
  type: z.enum(['duct', 'fitting', 'equipment', 'accessory']),
  subtype: z.string().optional(), // e.g., "rectangular", "round", "elbow", "tee"
  
  // Metadata
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  
  // Available materials for this component
  materials: z.array(MaterialSpecSchema),
  
  // Default dimensions (component-specific)
  defaultDimensions: z.record(z.string(), z.number()).optional(),
  
  // Engineering properties
  engineeringProperties: EngineeringPropertiesSchema,
  
  // Pricing
  pricing: PricingDataSchema,
  
  // Tags for search/filtering
  tags: z.array(z.string()).optional(),
  
  // Custom fields
  customFields: z.record(z.string(), z.unknown()).optional(),
  
  // Metadata
  createdAt: CoercedDateSchema.optional(),
  updatedAt: CoercedDateSchema.optional(),
  isCustom: z.boolean().default(false), // User-created vs. system component
});

export type ComponentDefinition = z.infer<typeof ComponentDefinitionSchema>;

/**
 * Reusable component template configuration
 */
export const ComponentTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  componentId: z.string(), // Base component this template is for
  
  // Preset dimension overrides
  dimensions: z.record(z.string(), z.number()).optional(),
  
  // Preset material selection
  materialId: z.string().optional(),
  
  // Preset engineering parameters
  engineeringOverrides: z.object({
    airflow: z.number().optional(),
    velocity: z.number().optional(),
    pressureClass: z.string().optional(),
  }).optional(),
  
  // Metadata
  createdBy: z.string().optional(),
  isShared: z.boolean().default(false),
  createdAt: CoercedDateSchema.optional(),
});

export type ComponentTemplate = z.infer<typeof ComponentTemplateSchema>;

/**
 * Component library collection
 */
export const ComponentLibrarySchema = z.object({
  version: z.string(),
  name: z.string(),
  categories: z.array(ComponentCategorySchema),
  components: z.array(ComponentDefinitionSchema),
  templates: z.array(ComponentTemplateSchema).optional(),
  
  // Metadata
  lastModified: CoercedDateSchema,
  author: z.string().optional(),
});

export type ComponentLibrary = z.infer<typeof ComponentLibrarySchema>;

/**
 * Import/export helpers for Flow 6 library management.
 */
export const ComponentImportFormatSchema = z.enum(['csv', 'json']);
export type ComponentImportFormat = z.infer<typeof ComponentImportFormatSchema>;

export const ComponentImportFieldSchema = z.enum([
  'id',
  'name',
  'type',
  'category',
  'subtype',
  'description',
  'manufacturer',
  'model',
  'sku',
  'tags',
]);
export type ComponentImportField = z.infer<typeof ComponentImportFieldSchema>;

export const ComponentImportFieldMappingSchema = z.record(ComponentImportFieldSchema, z.string());
export type ComponentImportFieldMapping = z.infer<typeof ComponentImportFieldMappingSchema>;

export const ComponentImportRowSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.enum(['duct', 'fitting', 'equipment', 'accessory']),
  category: z.string(),
  subtype: z.string().optional(),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type ComponentImportRow = z.infer<typeof ComponentImportRowSchema>;

export const ComponentImportPreviewSchema = z.object({
  format: ComponentImportFormatSchema,
  headers: z.array(z.string()),
  rows: z.array(ComponentImportRowSchema),
  mapping: ComponentImportFieldMappingSchema,
});
export type ComponentImportPreview = z.infer<typeof ComponentImportPreviewSchema>;
