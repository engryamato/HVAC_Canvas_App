/**
 * Catalog Data Model
 * 
 * Defines the structure for Catalog Items which are the physical products
 * that generic entities resolve to.
 */
import { z } from 'zod';
import { DuctShapeSchema, DuctMaterialSchema, PressureClassSchema } from './service.schema';

export const CatalogItemTypeSchema = z.enum(['duct', 'fitting', 'equipment', 'accessory']);
export type CatalogItemType = z.infer<typeof CatalogItemTypeSchema>;

export const CatalogItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: CatalogItemTypeSchema,
  
  // Specifications
  material: DuctMaterialSchema,
  shape: DuctShapeSchema.optional(),
  pressureClass: PressureClassSchema.optional(),
  
  // Dimensions (as applicable)
  dimensions: z.object({
    diameter: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    length: z.number().optional(),
    angle: z.number().optional(), // For fittings
  }).optional(),
  
  // Manufacturer Data
  manufacturer: z.string(),
  model: z.string(),
  partNumber: z.string().optional(),
  
  // Pricing
  cost: z.number().optional(),
  currency: z.string().default('USD'),
  
  // Search Metadata
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export type CatalogItem = z.infer<typeof CatalogItemSchema>;

export const CatalogResolutionStatusSchema = z.enum([
  'resolved',   // found exact match
  'unresolved', // no match found
  'warning',    // found close match but violates some criteria (e.g. diff manufacturer)
  'pending'     // resolution not yet attempted
]);

export type CatalogResolutionStatus = z.infer<typeof CatalogResolutionStatusSchema>;
