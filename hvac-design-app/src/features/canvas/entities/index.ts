// Entity factory functions and defaults

export {
  createRoom,
  calculateRoomValues,
  getNextRoomNumber,
  resetRoomCounter,
  default as createRoomDefault,
} from './roomDefaults';

export {
  createDuct,
  calculateDuctValues,
  getNextDuctNumber,
  resetDuctCounter,
  default as createDuctDefault,
} from './ductDefaults';

export {
  createEquipment,
  getNextEquipmentNumber,
  resetEquipmentCounter,
  EQUIPMENT_TYPE_DEFAULTS,
  EQUIPMENT_TYPE_LABELS,
  default as createEquipmentDefault,
} from './equipmentDefaults';
