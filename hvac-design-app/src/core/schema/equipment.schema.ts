import { z } from 'zod';
import { BaseEntitySchema, ServiceIdSchema } from './base.schema';
import { ConstraintStatusSchema } from './duct.schema';

/**
 * Equipment types for HVAC components
 * 16 types across 6 categories covering a full mechanical plan
 */
export const EquipmentTypeSchema = z.enum([
  // Original types (7)
  'hood', 'fan', 'diffuser', 'damper', 'air_handler', 'furnace', 'rtu',
  // New types (9)
  'vav_box', 'fcu', 'mau', 'exhaust_fan', 'erv', 'unit_heater', 'grille', 'fire_damper', 'smoke_damper',
]);

export type EquipmentType = z.infer<typeof EquipmentTypeSchema>;

/**
 * Equipment categories grouping related types
 */
export const EquipmentCategorySchema = z.enum([
  'air_handling',   // AHU, RTU, MAU, FCU, ERV
  'terminal_units', // VAV Box
  'fans',           // Fan, Exhaust Fan
  'air_devices',    // Diffuser, Grille, Hood
  'dampers',        // Volume Damper, Fire Damper, Smoke Damper
  'heating',        // Furnace, Unit Heater
]);

export type EquipmentCategory = z.infer<typeof EquipmentCategorySchema>;

/**
 * Maps each category to its member equipment types
 */
export const EQUIPMENT_CATEGORY_MAP: Record<EquipmentCategory, EquipmentType[]> = {
  air_handling:   ['air_handler', 'rtu', 'mau', 'fcu', 'erv'],
  terminal_units: ['vav_box'],
  fans:           ['fan', 'exhaust_fan'],
  air_devices:    ['diffuser', 'grille', 'hood'],
  dampers:        ['damper', 'fire_damper', 'smoke_damper'],
  heating:        ['furnace', 'unit_heater'],
};

/** Reverse map: EquipmentType → EquipmentCategory */
export const EQUIPMENT_TYPE_CATEGORY: Record<EquipmentType, EquipmentCategory> = Object.entries(
  EQUIPMENT_CATEGORY_MAP
).reduce((acc, [cat, types]) => {
  types.forEach((t) => { acc[t as EquipmentType] = cat as EquipmentCategory; });
  return acc;
}, {} as Record<EquipmentType, EquipmentCategory>);

// ─── Connection Port Model ─────────────────────────────────────────────────

/**
 * Role of a connection port on equipment
 * cfmSign convention: positive = air leaving equipment, negative = air entering
 */
export const PortRoleSchema = z.enum([
  'supply',       // conditioned air out  (+CFM)
  'return',       // return air in        (-CFM)
  'exhaust',      // exhaust air out      (-CFM, away from space)
  'outdoor_air',  // fresh air intake     (+CFM into unit)
  'relief',       // relief/bypass out    (-CFM)
  'inline',       // in-line (dampers)    (bidirectional)
]);
export type PortRole = z.infer<typeof PortRoleSchema>;

/** Which edge of the equipment bounding box the port sits on */
export const PortEdgeSchema = z.enum(['north', 'south', 'east', 'west']);
export type PortEdge = z.infer<typeof PortEdgeSchema>;

/**
 * A single typed connection port on a piece of equipment.
 * offsetRatio: 0.0 = left/top edge, 0.5 = center, 1.0 = right/bottom edge
 */
export const ConnectionPortSchema = z.object({
  id: z.string().describe('Unique port identifier, e.g. "supply-1"'),
  role: PortRoleSchema,
  edge: PortEdgeSchema,
  offsetRatio: z.number().min(0).max(1).default(0.5),
  connectedDuctId: z.string().uuid().optional().describe('ID of duct snapped to this port'),
  label: z.string().optional().describe('Human-readable label, e.g. "Supply A"'),
});
export type ConnectionPort = z.infer<typeof ConnectionPortSchema>;

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

const SharedEquipmentPropsSchema = z.object({
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
  // Legacy single connection (deprecated — use connectionPorts instead; kept for 1 release compat)
  connectedDuctId: z.string().uuid().optional().describe('@deprecated Use connectionPorts[].connectedDuctId'),
  // Multi-port typed connection model
  connectionPorts: z.array(ConnectionPortSchema).optional().describe('Typed supply/return/exhaust ports'),
  // Location tag for identification
  locationTag: z.string().max(50).optional().describe('Location tag e.g. "ROOF-1", "MECH-101"'),
  
  //Service & Catalog references
  serviceId: ServiceIdSchema,
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

export const StandardEquipmentPropsSchema = SharedEquipmentPropsSchema.extend({
  engineeringSystem: z.literal('standard_duct'),
});

export const UniversalEquipmentPropsSchema = SharedEquipmentPropsSchema.extend({
  engineeringSystem: z.literal('universal'),
  spacingRule: z.string().optional(),
  loadRating: z.number().min(0).optional(),
});

/**
 * Base equipment properties shared by all equipment types
 * Per Notion Data Models & Schema - Structure
 */
export const EquipmentPropsSchema = z.preprocess(
  (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return value;
    }

    const candidate = value as Record<string, unknown>;
    return {
      engineeringSystem: candidate.engineeringSystem ?? 'standard_duct',
      ...candidate,
    };
  },
  z.union([StandardEquipmentPropsSchema, UniversalEquipmentPropsSchema])
);

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

export type Equipment = Omit<z.infer<typeof EquipmentSchema>, 'props'> & { props: EquipmentProps };

/**
 * Default values for equipment by type
 */
export const DEFAULT_EQUIPMENT_PROPS: Record<EquipmentType, Omit<EquipmentProps, 'name'>> = {
  hood: {
    engineeringSystem: 'standard_duct',
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
    engineeringSystem: 'standard_duct',
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
    engineeringSystem: 'standard_duct',
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
    engineeringSystem: 'standard_duct',
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
    engineeringSystem: 'standard_duct',
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
    engineeringSystem: 'standard_duct',
    equipmentType: 'furnace',
    capacity: 1500,   // CFM airflow (was incorrectly 80000 — that is BTU/h, not CFM)
    capacityUnit: 'CFM',
    staticPressure: 0.5,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 36,
    height: 48,
    mountHeightUnit: 'in',
  },
  rtu: {
    engineeringSystem: 'standard_duct',
    equipmentType: 'rtu',
    capacity: 10000,
    capacityUnit: 'CFM',
    staticPressure: 1.5,
    staticPressureUnit: 'in_wg',
    width: 84,
    depth: 48,
    height: 36,
    mountHeightUnit: 'in',
  },
  // ─── New types ───────────────────────────────────────────────────────────
  vav_box: {
    engineeringSystem: 'standard_duct',
    equipmentType: 'vav_box',
    capacity: 300,
    capacityUnit: 'CFM',
    staticPressure: 0.25,
    staticPressureUnit: 'in_wg',
    width: 18,
    depth: 18,
    height: 12,
    mountHeightUnit: 'in',
  },
  fcu: {
    engineeringSystem: 'standard_duct',
    equipmentType: 'fcu',
    capacity: 600,
    capacityUnit: 'CFM',
    staticPressure: 0.5,
    staticPressureUnit: 'in_wg',
    width: 36,
    depth: 24,
    height: 18,
    mountHeightUnit: 'in',
  },
  mau: {
    engineeringSystem: 'standard_duct',
    equipmentType: 'mau',
    capacity: 3000,
    capacityUnit: 'CFM',
    staticPressure: 1.5,
    staticPressureUnit: 'in_wg',
    width: 48,
    depth: 36,
    height: 36,
    mountHeightUnit: 'in',
  },
  exhaust_fan: {
    engineeringSystem: 'standard_duct',
    equipmentType: 'exhaust_fan',
    capacity: 500,
    capacityUnit: 'CFM',
    staticPressure: 0.5,
    staticPressureUnit: 'in_wg',
    width: 18,
    depth: 18,
    height: 12,
    mountHeightUnit: 'in',
  },
  erv: {
    engineeringSystem: 'standard_duct',
    equipmentType: 'erv',
    capacity: 1000,
    capacityUnit: 'CFM',
    staticPressure: 1.0,
    staticPressureUnit: 'in_wg',
    width: 48,
    depth: 24,
    height: 24,
    mountHeightUnit: 'in',
  },
  unit_heater: {
    engineeringSystem: 'standard_duct',
    equipmentType: 'unit_heater',
    capacity: 800,
    capacityUnit: 'CFM',
    staticPressure: 0.1,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 18,
    height: 18,
    mountHeightUnit: 'in',
  },
  grille: {
    engineeringSystem: 'standard_duct',
    equipmentType: 'grille',
    capacity: 300,
    capacityUnit: 'CFM',
    staticPressure: 0.05,
    staticPressureUnit: 'in_wg',
    width: 24,
    depth: 12,
    height: 4,
    mountHeightUnit: 'in',
  },
  fire_damper: {
    engineeringSystem: 'standard_duct',
    equipmentType: 'fire_damper',
    capacity: 1000,
    capacityUnit: 'CFM',
    staticPressure: 0.08,
    staticPressureUnit: 'in_wg',
    width: 12,
    depth: 12,
    height: 6,
    mountHeightUnit: 'in',
  },
  smoke_damper: {
    engineeringSystem: 'standard_duct',
    equipmentType: 'smoke_damper',
    capacity: 1000,
    capacityUnit: 'CFM',
    staticPressure: 0.08,
    staticPressureUnit: 'in_wg',
    width: 12,
    depth: 12,
    height: 6,
    mountHeightUnit: 'in',
  },
};

/**
 * Human-readable labels for all equipment types (used in dialogs, inspectors, status bar)
 */
export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  air_handler:  'Air Handling Unit',
  rtu:          'Rooftop Unit',
  mau:          'Makeup Air Unit',
  fcu:          'Fan Coil Unit',
  erv:          'Energy Recovery Ventilator',
  vav_box:      'VAV Box',
  fan:          'Fan',
  exhaust_fan:  'Exhaust Fan',
  diffuser:     'Diffuser',
  grille:       'Grille',
  hood:         'Hood',
  damper:       'Volume Damper',
  fire_damper:  'Fire Damper',
  smoke_damper: 'Smoke Damper',
  furnace:      'Furnace',
  unit_heater:  'Unit Heater',
};

/**
 * Short abbreviations used in auto-generated names (e.g. "AHU-1", "RTU-2")
 */
export const EQUIPMENT_TYPE_ABBREV: Record<EquipmentType, string> = {
  air_handler:  'AHU',
  rtu:          'RTU',
  mau:          'MAU',
  fcu:          'FCU',
  erv:          'ERV',
  vav_box:      'VAV',
  fan:          'FAN',
  exhaust_fan:  'EF',
  diffuser:     'DIFF',
  grille:       'GRL',
  hood:         'HOOD',
  damper:       'VD',
  fire_damper:  'FD',
  smoke_damper: 'SD',
  furnace:      'FURN',
  unit_heater:  'UH',
};

/**
 * Create default equipment props for a given type
 */
export function createDefaultEquipmentProps(type: EquipmentType): EquipmentProps {
  const abbrev = EQUIPMENT_TYPE_ABBREV[type];
  return {
    name: `${abbrev}-1`,
    ...DEFAULT_EQUIPMENT_PROPS[type],
  };
}
