import type { Equipment } from '@/core/schema';
import type { ConnectionPort, EquipmentProps, EquipmentType } from '@/core/schema/equipment.schema';
import {
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_TYPE_ABBREV,
} from '@/core/schema/equipment.schema';
import { PORT_DEFINITIONS } from './equipmentPortDefinitions';

// Re-export for downstream consumers
export { EQUIPMENT_TYPE_LABELS, EQUIPMENT_TYPE_ABBREV };

/**
 * Counter for auto-incrementing equipment names (per-type, so AHU-1 and RTU-1 don't share a counter)
 */
const equipmentCounters: Partial<Record<EquipmentType, number>> = {};

/**
 * Reset all equipment counters (useful for testing)
 */
export function resetEquipmentCounter(): void {
  Object.keys(equipmentCounters).forEach((k) => delete equipmentCounters[k as EquipmentType]);
}

/**
 * Get the next number for a specific equipment type and increment its counter
 */
export function getNextEquipmentNumber(type?: EquipmentType): number {
  if (!type) {
    // Legacy: global counter fallback
    const global = (equipmentCounters as Record<string, number>)['__global__'] ?? 0;
    (equipmentCounters as Record<string, number>)['__global__'] = global + 1;
    return global + 1;
  }
  const current = equipmentCounters[type] ?? 0;
  equipmentCounters[type] = current + 1;
  return current + 1;
}

/**
 * Default physical + performance properties by equipment type
 * These values are also mirrored in equipment.schema.ts DEFAULT_EQUIPMENT_PROPS.
 * The schema is the authoritative default; this file drives the createEquipment() factory.
 */
export const EQUIPMENT_TYPE_DEFAULTS: Record<
  EquipmentType,
  { capacity: number; staticPressure: number; width: number; depth: number; height: number }
> = {
  // ── Original types ─────────────────────────────────────────────────────
  hood: {
    capacity: 1200,
    staticPressure: 0.5,
    width: 48,
    depth: 36,
    height: 24,
  },
  fan: {
    capacity: 2000,
    staticPressure: 1.0,
    width: 24,
    depth: 24,
    height: 24,
  },
  diffuser: {
    capacity: 150,
    staticPressure: 0.1,
    width: 24,
    depth: 24,
    height: 6,
  },
  damper: {
    capacity: 500,
    staticPressure: 0.05,
    width: 12,
    depth: 6,
    height: 12,
  },
  air_handler: {
    capacity: 10000,
    staticPressure: 2.0,
    width: 72,
    depth: 48,
    height: 60,
  },
  furnace: {
    capacity: 1500,   // CFM airflow (not BTU/h — fixed from 80000 which was incorrect unit)
    staticPressure: 0.5,
    width: 24,
    depth: 36,
    height: 48,
  },
  rtu: {
    capacity: 10000,
    staticPressure: 1.5,
    width: 84,
    depth: 48,
    height: 36,
  },
  // ── New types ───────────────────────────────────────────────────────────
  vav_box: {
    capacity: 300,
    staticPressure: 0.25,
    width: 18,
    depth: 18,
    height: 12,
  },
  fcu: {
    capacity: 600,
    staticPressure: 0.5,
    width: 36,
    depth: 24,
    height: 18,
  },
  mau: {
    capacity: 3000,
    staticPressure: 1.5,
    width: 48,
    depth: 36,
    height: 36,
  },
  exhaust_fan: {
    capacity: 500,
    staticPressure: 0.5,
    width: 18,
    depth: 18,
    height: 12,
  },
  erv: {
    capacity: 1000,
    staticPressure: 1.0,
    width: 48,
    depth: 24,
    height: 24,
  },
  unit_heater: {
    capacity: 800,
    staticPressure: 0.1,
    width: 24,
    depth: 18,
    height: 18,
  },
  grille: {
    capacity: 300,
    staticPressure: 0.05,
    width: 24,
    depth: 12,
    height: 4,
  },
  fire_damper: {
    capacity: 1000,
    staticPressure: 0.08,
    width: 12,
    depth: 12,
    height: 6,
  },
  smoke_damper: {
    capacity: 1000,
    staticPressure: 0.08,
    width: 12,
    depth: 12,
    height: 6,
  },
};

/**
 * Create a new equipment entity with default values for the given type.
 * Pass overrides to customise any field before placement.
 */
export function createEquipment(
  equipmentType: EquipmentType,
  overrides?: Partial<{
    name: string;
    x: number;
    y: number;
    capacity: number;
    capacityUnit: 'CFM' | 'm3/h';
    staticPressure: number;
    width: number;
    depth: number;
    height: number;
    manufacturer: string;
    model: string;
    locationTag: string;
    serviceId: string;
    catalogItemId: string;
    engineeringSystem: EquipmentProps['engineeringSystem'];
    mountHeight: number;
    connectedDuctId: string;
    connectionPorts: ConnectionPort[];
    loadRating: number;
    spacingRule: string;
  }>
): Equipment {
  const equipmentNumber = getNextEquipmentNumber(equipmentType);
  const now = new Date().toISOString();
  const defaults = EQUIPMENT_TYPE_DEFAULTS[equipmentType];
  const abbrev = EQUIPMENT_TYPE_ABBREV[equipmentType];
  const connectionPorts = overrides?.connectionPorts ?? PORT_DEFINITIONS[equipmentType]?.map((port) => ({ ...port }));

  return {
    id: crypto.randomUUID(),
    type: 'equipment',
    transform: {
      x: overrides?.x ?? 0,
      y: overrides?.y ?? 0,
      elevation: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    zIndex: 5,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: overrides?.name ?? `${abbrev}-${equipmentNumber}`,
      engineeringSystem: overrides?.engineeringSystem ?? 'standard_duct',
      equipmentType,
      capacity: overrides?.capacity ?? defaults.capacity,
      capacityUnit: overrides?.capacityUnit ?? 'CFM',
      staticPressure: overrides?.staticPressure ?? defaults.staticPressure,
      staticPressureUnit: 'in_wg',
      width: overrides?.width ?? defaults.width,
      depth: overrides?.depth ?? defaults.depth,
      height: overrides?.height ?? defaults.height,
      ...(overrides?.mountHeight !== undefined ? { mountHeight: overrides.mountHeight } : {}),
      mountHeightUnit: 'in',
      manufacturer: overrides?.manufacturer,
      model: overrides?.model,
      locationTag: overrides?.locationTag,
      serviceId: overrides?.serviceId,
      catalogItemId: overrides?.catalogItemId,
      ...(overrides?.connectedDuctId ? { connectedDuctId: overrides.connectedDuctId } : {}),
      ...(connectionPorts?.length ? { connectionPorts } : {}),
      ...(overrides?.loadRating !== undefined ? { loadRating: overrides.loadRating } : {}),
      ...(overrides?.spacingRule ? { spacingRule: overrides.spacingRule } : {}),
    },
  };
}

export default createEquipment;
