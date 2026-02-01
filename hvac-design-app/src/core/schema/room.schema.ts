import { z } from 'zod';
import { BaseEntitySchema } from './base.schema';

/**
 * Occupancy types based on ASHRAE 62.1 Table 6-1
 * Each type has associated ventilation rates (Rp, Ra)
 */
export const OccupancyTypeSchema = z.enum([
  'office',
  'retail',
  'restaurant',
  'kitchen_commercial',
  'warehouse',
  'classroom',
  'conference',
  'lobby',
]);

export type OccupancyType = z.infer<typeof OccupancyTypeSchema>;

/**
 * Room properties (user-editable values)
 * Validation ranges per PRD Appendix B
 */
export const RoomPropsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  // Dimensions in inches
  width: z.number().min(1, 'Width must be at least 1 inch').max(10000, 'Width cannot exceed 10,000 inches'),
  length: z.number().min(1, 'Length must be at least 1 inch').max(10000, 'Length cannot exceed 10,000 inches'),
  ceilingHeight: z.number().min(1, 'Ceiling height must be at least 1 inch').max(500, 'Ceiling height cannot exceed 500 inches'),
  occupancyType: OccupancyTypeSchema,
  airChangesPerHour: z.number().min(1, 'ACH must be at least 1').max(100, 'ACH cannot exceed 100'),
  notes: z.string().max(5000).optional(),
});

export type RoomProps = z.infer<typeof RoomPropsSchema>;

/**
 * Calculated room values (derived from props, read-only in UI)
 */
export const RoomCalculatedSchema = z.object({
  area: z.number().nonnegative().describe('Floor area in sq ft'),
  volume: z.number().nonnegative().describe('Room volume in cu ft'),
  requiredCFM: z.number().nonnegative().describe('Required airflow in CFM'),
});

export type RoomCalculated = z.infer<typeof RoomCalculatedSchema>;

/**
 * Complete Room entity schema
 */
export const RoomSchema = BaseEntitySchema.extend({
  type: z.literal('room'),
  props: RoomPropsSchema,
  calculated: RoomCalculatedSchema,
});

export type Room = z.infer<typeof RoomSchema>;

/**
 * Default values for a new room
 */
export const DEFAULT_ROOM_PROPS: RoomProps = {
  name: 'New Room',
  width: 120, // 10 feet in inches
  length: 120, // 10 feet in inches
  ceilingHeight: 96, // 8 feet in inches
  occupancyType: 'office',
  airChangesPerHour: 4,
};

