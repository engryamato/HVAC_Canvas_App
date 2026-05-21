import { z } from 'zod';

/**
 * Normalize any rotation value (including negative, e.g. from Math.atan2)
 * to the canonical [0, 360) range.
 */
function normalizeRotation(v: unknown): unknown {
  if (typeof v !== 'number') return v;
  return ((v % 360) + 360) % 360;
}

/**
 * Transform schema for entity positioning on canvas
 * All coordinates are in pixels from the canvas origin (0,0)
 */
export const TransformSchema = z.object({
  x: z.number().describe('X position in pixels from origin'),
  y: z.number().describe('Y position in pixels from origin'),
  elevation: z
    .number()
    .optional()
    .default(0)
    .describe('Vertical world position in 3D space (inches from floor)'),
  rotation: z
    .preprocess(normalizeRotation, z.number().min(0).max(360).default(0))
    .describe('Rotation in degrees (normalized to [0, 360))'),
  scaleX: z.number().positive().default(1).describe('Horizontal scale factor'),
  scaleY: z.number().positive().default(1).describe('Vertical scale factor'),
});

export type Transform = z.infer<typeof TransformSchema>;
/**
 * All supported entity types in the application
 * Each type has its own schema and renderer
 */
export const EntityTypeSchema = z.enum([
  'room',
  'duct',
  'duct_run',
  'equipment',
  'fitting',
  'note',
  'group',
]);

export type EntityType = z.infer<typeof EntityTypeSchema>;

/**
 * Base entity schema that all entities must extend
 * Contains common fields for identification, positioning, and metadata
 */
export const BaseEntitySchema = z.object({
  id: z.string().uuid().describe('Unique identifier (UUID v4)'),
  type: EntityTypeSchema,
  transform: TransformSchema,
  zIndex: z.number().int().min(0).default(0).describe('Layer ordering'),
  createdAt: z.string().datetime().describe('ISO8601 creation timestamp'),
  modifiedAt: z.string().datetime().describe('ISO8601 last modified timestamp'),
});

export type BaseEntity = z.infer<typeof BaseEntitySchema>;

/**
 * Schema for service/component reference IDs stored on entities.
 *
 * Accepts both UUID custom-service IDs and legacy template IDs such as
 * 'tmpl_low_pressure_supply'. Coerces empty strings and null to undefined
 * so partial or cleared fields don't fail validation.
 */
export const ServiceIdSchema = z.preprocess(
  (v) => (v === '' || v === null) ? undefined : v,
  z.string().min(1).optional()
).describe('Service or template reference ID');

/**
 * Factory function to create a default transform
 */
export function createDefaultTransform(overrides?: Partial<Transform>): Transform {
  return {
    x: 0,
    y: 0,
    elevation: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    ...overrides,
  };
}

/**
 * Generate current ISO8601 timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
