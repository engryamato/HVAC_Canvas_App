// Tool Store (formerly canvas.store - refactored to remove state duplication)
export {
  useToolStore,
  useCurrentTool,
  useIsToolActive,
  useToolActions,
  useCanvasStore, // deprecated alias
  type CanvasTool,
} from './canvas.store';

// Project Store
export {
  useProjectStore,
  useCurrentProjectId,
  useProjectDetails,
  useIsDirty,
  useHasProject,
  useProjectActions,
} from './project.store';

// Entity Store
export {
  useEntityStore,
  selectEntity,
  selectAllEntities,
  selectEntitiesByType,
  selectEntityCount,
  useEntity,
  useAllEntities,
  useEntitiesByType,
  useEntityCount,
  useEntityActions,
} from './entityStore';

// Preferences Store
export { usePreferencesStore, usePreferences, usePreferencesActions } from './preferencesStore';

// Storage Store
export {
  useStorageStore,
  STORAGE_INITIAL_STATE,
  type StorageState,
  type StorageMigrationState,
  type StorageRootType,
} from './storageStore';
