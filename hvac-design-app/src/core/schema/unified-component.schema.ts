import { z } from 'zod';
import { 
  EngineeringPropertiesSchema, 
  PricingDataSchema, 
  MaterialSpecSchema
} from './component-library.schema';

const CoercedDateSchema = z.coerce.date();

/**
 * Unified component definition combining ComponentDefinition, CatalogItem, and Service concepts
 */
export const UnifiedComponentDefinitionSchema = z.object({
  // Base fields (from ComponentDefinition)
  id: z.string(),
  name: z.string(),
  category: z.enum(['duct', 'fitting', 'equipment', 'accessory']),
  type: z.string(),
  subtype: z.string().optional(),
  
  // Catalog fields (from CatalogItem)
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  partNumber: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  
  // Service fields (from Service)
  systemType: z.enum(['supply', 'return', 'exhaust']).optional(),
  pressureClass: z.enum(['low', 'medium', 'high']).optional(),
  
  // Engineering properties
  engineeringProperties: EngineeringPropertiesSchema,
  
  // Pricing
  pricing: PricingDataSchema,
  
  // Materials
  materials: z.array(MaterialSpecSchema),
  defaultDimensions: z.record(z.string(), z.number()).optional(),
  
  // Metadata
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
  isCustom: z.boolean().default(false),
  createdAt: CoercedDateSchema.optional(),
  updatedAt: CoercedDateSchema.optional(),
});

export type UnifiedComponentDefinition = z.infer<typeof UnifiedComponentDefinitionSchema>;

// Re-export related types for convenience
export type { ComponentCategory, ComponentTemplate } from './component-library.schema';
export { ComponentCategorySchema, ComponentTemplateSchema } from './component-library.schema';
