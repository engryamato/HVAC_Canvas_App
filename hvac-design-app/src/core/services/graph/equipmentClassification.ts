import type { Entity, Equipment } from '@/core/schema';
import type { EquipmentType } from '@/core/schema/equipment.schema';

const SOURCE_EQUIPMENT_TYPES = new Set<EquipmentType>([
  'air_handler',
  'rtu',
  'fan',
  'furnace',
  'mau',
  'fcu',
  'erv',
  'exhaust_fan',
  'unit_heater',
]);

const TERMINAL_EQUIPMENT_TYPES = new Set<EquipmentType>([
  'diffuser',
  'grille',
  'hood',
]);

export function isSourceEquipment(entity: Entity | Equipment | undefined): boolean {
  return entity?.type === 'equipment' && SOURCE_EQUIPMENT_TYPES.has(entity.props.equipmentType);
}

export function isTerminalEquipment(entity: Entity | Equipment | undefined): boolean {
  return entity?.type === 'equipment' && TERMINAL_EQUIPMENT_TYPES.has(entity.props.equipmentType);
}
