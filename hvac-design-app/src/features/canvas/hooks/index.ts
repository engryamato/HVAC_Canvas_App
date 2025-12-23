// Canvas hooks barrel export

export { useViewport, default as useViewportDefault } from './useViewport';
export { useSelection, default as useSelectionDefault } from './useSelection';
export { useMarquee, default as useMarqueeDefault } from './useMarquee';
export { useEntityOperations, default as useEntityOperationsDefault } from './useEntityOperations';
export { useFieldValidation, default as useFieldValidationDefault } from './useFieldValidation';
export { useCalculations, default as useCalculationsDefault } from './useCalculations';
export {
  useAutoSave,
  saveProjectToStorage,
  loadProjectFromStorage,
  deleteProjectFromStorage,
  getAllProjectKeys,
  default as useAutoSaveDefault,
} from './useAutoSave';
export {
  useKeyboardShortcuts,
  type ToolType,
  default as useKeyboardShortcutsDefault,
} from './useKeyboardShortcuts';
