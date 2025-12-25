// Entity factory functions and defaults

export {
  createRoom,
  getNextRoomNumber,
  resetRoomCounter,
  default as createRoomDefault,
} from './roomDefaults';

export {
  createDuct,
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

export {
  createFitting,
  getNextFittingNumber,
  resetFittingCounter,
  FITTING_TYPE_LABELS,
  default as createFittingDefault,
} from './fittingDefaults';

export {
  createNote,
  getNextNoteNumber,
  resetNoteCounter,
  default as createNoteDefault,
} from './noteDefaults';

// Re-export calculation functions from calculators
export { calculateRoomValues } from '../calculators/ventilation';
