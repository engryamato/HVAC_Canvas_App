import { z } from 'zod';

/**
 * Transform schema for entity positioning on canvas
 * All coordinates are in pixels from the canvas origin (0,0)
 */
export const TransformSchema = z.object({
  x: z.number().describe('X position in pixels from origin'),
  y: z.number().describe('Y position in pixels from origin'),
  rotation: z.number().min(0).max(360).default(0).describe('Rotation in degrees'),
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
 * Factory function to create a default transform
 */
export function createDefaultTransform(overrides?: Partial<Transform>): Transform {
  return {
    x: 0,
    y: 0,
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

