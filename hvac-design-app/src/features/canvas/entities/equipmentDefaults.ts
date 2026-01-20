import type { Equipment } from '@/core/schema';
import type { EquipmentType } from '@/core/schema/equipment.schema';

/**
 * Counter for auto-incrementing equipment names
 */
let equipmentCounter = 1;

/**
 * Reset the equipment counter (useful for testing)
 */
export function resetEquipmentCounter(): void {
  equipmentCounter = 1;
}

/**
 * Get the next equipment number and increment counter
 */
export function getNextEquipmentNumber(): number {
  return equipmentCounter++;
}

/**
 * Default properties by equipment type
 * Matches EquipmentTypeSchema: 'hood' | 'fan' | 'diffuser' | 'damper' | 'air_handler'
 */
export const EQUIPMENT_TYPE_DEFAULTS: Record<
  EquipmentType,
  {
    capacity: number;
    staticPressure: number;
    width: number;
    depth: number;
    height: number;
  }
> = {
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
    capacity: 80000,
    staticPressure: 0.5,
    width: 24,
    depth: 36,
    height: 48,
  },
  rtu: {
    capacity: 12000,
    staticPressure: 1.5,
    width: 84,
    depth: 48,
    height: 36,
  },
};

/**
 * Human-readable labels for equipment types
 */
export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  hood: 'Exhaust Hood',
  fan: 'Fan',
  diffuser: 'Diffuser',
  damper: 'Damper',
  air_handler: 'Air Handling Unit',
  furnace: 'Furnace',
  rtu: 'RTU',
};

/**
 * Create a new equipment entity with default values
 */
export function createEquipment(
  equipmentType: EquipmentType,
  overrides?: Partial<{
    name: string;
    x: number;
    y: number;
    capacity: number;
    staticPressure: number;
    width: number;
    depth: number;
    height: number;
    manufacturer: string;
    model: string;
  }>
): Equipment {
  const equipmentNumber = getNextEquipmentNumber();
  const now = new Date().toISOString();
  const defaults = EQUIPMENT_TYPE_DEFAULTS[equipmentType];
  const label = EQUIPMENT_TYPE_LABELS[equipmentType];

  return {
    id: crypto.randomUUID(),
    type: 'equipment',
    transform: {
      x: overrides?.x ?? 0,
      y: overrides?.y ?? 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    zIndex: 5, // Equipment renders at same level as ducts
    createdAt: now,
    modifiedAt: now,
    props: {
      name: overrides?.name ?? `${label} ${equipmentNumber}`,
      equipmentType,
      capacity: overrides?.capacity ?? defaults.capacity,
      capacityUnit: 'CFM',
      staticPressure: overrides?.staticPressure ?? defaults.staticPressure,
      staticPressureUnit: 'in_wg',
      width: overrides?.width ?? defaults.width,
      depth: overrides?.depth ?? defaults.depth,
      height: overrides?.height ?? defaults.height,
      mountHeightUnit: 'in',
      manufacturer: overrides?.manufacturer,
      model: overrides?.model,
    },
  };
}

export default createEquipment;
