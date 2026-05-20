// Tool Store (formerly canvas.store - refactored to remove state duplication)
export {
  useToolStore,
  useCurrentTool,
  useIsToolActive,
  useActiveSpecialtyToolId,
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

export {
  useDuctOverlayStore,
  buildOverlayStatusMap,
  type DuctOverlayMode,
} from './ductOverlayStore';

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

// Unified Catalog Store (compat alias for Traycer catalog work)
export {
  useUnifiedCatalogStore,
  useComponentLibraryStoreV2,
  type ImportPreview,
  type ImportRow,
} from './componentLibraryStoreV2';
