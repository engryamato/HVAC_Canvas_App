import { z } from 'zod';
import { BaseEntitySchema } from './base.schema';

/**
 * Equipment types for HVAC components
 */
export const EquipmentTypeSchema = z.enum(['hood', 'fan', 'diffuser', 'damper']);

export type EquipmentType = z.infer<typeof EquipmentTypeSchema>;

/**
 * Equipment properties
 */
export const EquipmentPropsSchema = z.object({
  name: z.string().min(1).max(100),
  equipmentType: EquipmentTypeSchema,
  manufacturer: z.string().max(100).optional(),
  modelNumber: z.string().max(100).optional(),
  capacity: z.number().min(1).max(100000).describe('Capacity in CFM'),
  staticPressure: z.number().min(0).max(20).describe('Static pressure in in.w.g.'),
  width: z.number().positive().describe('Width in inches'),
  depth: z.number().positive().describe('Depth in inches'),
  height: z.number().positive().describe('Height in inches'),
});

export type EquipmentProps = z.infer<typeof EquipmentPropsSchema>;

/**
 * Complete Equipment entity schema
 */
export const EquipmentSchema = BaseEntitySchema.extend({
  type: z.literal('equipment'),
  props: EquipmentPropsSchema,
});

export type Equipment = z.infer<typeof EquipmentSchema>;

/**
 * Default values for equipment by type
 */
export const DEFAULT_EQUIPMENT_PROPS: Record<EquipmentType, Omit<EquipmentProps, 'name'>> = {
  hood: {
    equipmentType: 'hood',
    capacity: 1000,
    staticPressure: 0.5,
    width: 48,
    depth: 36,
    height: 24,
  },
  fan: {
    equipmentType: 'fan',
    capacity: 2000,
    staticPressure: 1.0,
    width: 24,
    depth: 24,
    height: 24,
  },
  diffuser: {
    equipmentType: 'diffuser',
    capacity: 200,
    staticPressure: 0.1,
    width: 24,
    depth: 24,
    height: 8,
  },
  damper: {
    equipmentType: 'damper',
    capacity: 500,
    staticPressure: 0.05,
    width: 12,
    depth: 12,
    height: 6,
  },
};

/**
 * Create default equipment props for a given type
 */
export function createDefaultEquipmentProps(type: EquipmentType): EquipmentProps {
  return {
    name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    ...DEFAULT_EQUIPMENT_PROPS[type],
  };
}

