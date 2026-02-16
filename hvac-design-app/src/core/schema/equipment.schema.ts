import { z } from 'zod';
import { BaseEntitySchema } from './base.schema';
import { ConstraintStatusSchema } from './duct.schema';

/**
 * Equipment types for HVAC components
 * Per Notion Architecture Specs - includes air_handler for AHU units
 */
export const EquipmentTypeSchema = z.enum(['hood', 'fan', 'diffuser', 'damper', 'air_handler', 'furnace', 'rtu']);

export type EquipmentType = z.infer<typeof EquipmentTypeSchema>;

/**
 * Capacity unit for airflow
 */
export const CapacityUnitSchema = z.enum(['CFM', 'm3/h']);
export type CapacityUnit = z.infer<typeof CapacityUnitSchema>;

/**
 * Static pressure unit
 */
export const StaticPressureUnitSchema = z.enum(['in_wg', 'Pa']);
export type StaticPressureUnit = z.infer<typeof StaticPressureUnitSchema>;

/**
 * Mount height unit
 */
export const MountHeightUnitSchema = z.enum(['in', 'mm']);
export type MountHeightUnit = z.infer<typeof MountHeightUnitSchema>;

/**
 * Base equipment properties shared by all equipment types
 * Per Notion Data Models & Schema - Structure
 */
export const EquipmentPropsSchema = z.object({
  name: z.string().min(1).max(100),
  equipmentType: EquipmentTypeSchema,
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  // Capacity with explicit unit
  capacity: z.number().min(1).max(100000).describe('Airflow capacity'),
  capacityUnit: CapacityUnitSchema.default('CFM'),
  // Static pressure with explicit unit
  staticPressure: z.number().min(0).max(20).describe('Static pressure'),
  staticPressureUnit: StaticPressureUnitSchema.default('in_wg'),
  // Physical dimensions
  width: z.number().positive().describe('Width in inches'),
  depth: z.number().positive().describe('Depth in inches'),
  height: z.number().positive().describe('Height in inches'),
  // Mount height with explicit unit
  mountHeight: z.number().min(0).optional().describe('Height from finished floor'),
  mountHeightUnit: MountHeightUnitSchema.default('in'),
  // Connection reference
  connectedDuctId: z.string().uuid().optional().describe('Reference to connected Duct.id'),
  // Location tag for identification
  locationTag: z.string().max(50).optional().describe('Location tag e.g. "ROOF-1", "MECH-101"'),
  
  //Service & Catalog references
  serviceId: z.string().uuid().optional().describe('Active Service ID'),
  catalogItemId: z.string().optional().describe('Resolved Catalog Item ID'),
  
  // Engineering data for validation
  engineeringData: z.object({
    airflow: z.number().min(0), // CFM
    pressureDrop: z.number().min(0).optional(),
    efficiency: z.number().min(0).max(100).optional(), // Percentage
    powerConsumption: z.number().min(0).optional(), // Watts
  }).optional(),
  constraintStatus: ConstraintStatusSchema.optional(),
});

export type EquipmentProps = z.infer<typeof EquipmentPropsSchema>;

/**
 * Complete Equipment entity schema
 */
export const EquipmentSchema = BaseEntitySchema.extend({
  type: z.literal('equipment'),
  props: EquipmentPropsSchema,
  warnings: z.object({
    constraintViolations: z.array(z.string()).optional(),
  }).optional(),
});

export type Equipment = z.infer<typeof EquipmentSchema>;

/**
 * Default values for equipment by type
 */
export const DEFAULT_EQUIPMENT_PROPS: Record<EquipmentType, Omit<EquipmentProps, 'name'>> = {
  hood: {
    equipmentType: 'hood',
    capacity: 1000,
    capacityUnit: 'CFM',
    staticPressure: 0.5,
    staticPressureUnit: 'in_wg',
    width: 48,
    depth: 36,
    height: 24,
    mountHeightUnit: 'in',
  },
  fan: {
    equipmentType: 'fan',
    capacity: 2000,
    capacityUnit: 'CFM',
    staticPressure: 1.0,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 24,
    height: 24,
    mountHeightUnit: 'in',
  },
  diffuser: {
    equipmentType: 'diffuser',
    capacity: 200,
    capacityUnit: 'CFM',
    staticPressure: 0.1,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 24,
    height: 8,
    mountHeightUnit: 'in',
  },
  damper: {
    equipmentType: 'damper',
    capacity: 500,
    capacityUnit: 'CFM',
    staticPressure: 0.05,
    staticPressureUnit: 'in_wg',
    width: 12,
    depth: 12,
    height: 6,
    mountHeightUnit: 'in',
  },
  air_handler: {
    equipmentType: 'air_handler',
    capacity: 5000,
    capacityUnit: 'CFM',
    staticPressure: 2.0,
    staticPressureUnit: 'in_wg',
    width: 60,
    depth: 48,
    height: 72,
    mountHeightUnit: 'in',
  },
  furnace: {
    equipmentType: 'furnace',
    capacity: 80000,
    capacityUnit: 'CFM',
    staticPressure: 0.5,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 36,
    height: 48,
    mountHeightUnit: 'in',
  },
  rtu: {
    equipmentType: 'rtu',
    capacity: 12000,
    capacityUnit: 'CFM',
    staticPressure: 1.5,
    staticPressureUnit: 'in_wg',
    width: 84,
    depth: 48,
    height: 36,
    mountHeightUnit: 'in',
  },
};

/**
 * Create default equipment props for a given type
 */
export function createDefaultEquipmentProps(type: EquipmentType): EquipmentProps {
  const typeLabel =
    type === 'air_handler' ? 'Air Handler' :
    type === 'furnace' ? 'Furnace' :
    type === 'rtu' ? 'RTU' :
    type.charAt(0).toUpperCase() + type.slice(1);
  return {
    name: `New ${typeLabel}`,
    ...DEFAULT_EQUIPMENT_PROPS[type],
  };
}
