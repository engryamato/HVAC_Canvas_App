import { z } from 'zod';
import { BaseEntitySchema } from './base.schema';

/**
 * Note properties for canvas annotations
 */
export const NotePropsSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(10000, 'Note content cannot exceed 10,000 characters'),
  fontSize: z.number().min(8).max(72).default(14).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #000000)')
    .default('#000000')
    .optional(),
});

export type NoteProps = z.infer<typeof NotePropsSchema>;

/**
 * Complete Note entity schema
 */
export const NoteSchema = BaseEntitySchema.extend({
  type: z.literal('note'),
  props: NotePropsSchema,
});

export type Note = z.infer<typeof NoteSchema>;

/**
 * Default values for a new note
 */
export const DEFAULT_NOTE_PROPS: NoteProps = {
  content: 'New Note',
  fontSize: 14,
  color: '#000000',
};

