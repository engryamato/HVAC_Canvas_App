// Selection Store
export {
  useSelectionStore,
  useSelectedIds,
  useIsSelected,
  useSelectionCount,
  useHoveredId,
  useHasSelection,
  useSelectionActions,
} from './selectionStore';

// Viewport Store
export {
  useViewportStore,
  useZoom,
  usePan,
  useGridVisible,
  useSnapToGrid,
  useGridSize,
  useViewportActions,
} from './viewportStore';

// Re-export viewport constants from centralized location
export {
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
  DEFAULT_ZOOM,
  DEFAULT_GRID_SIZE,
  GRID_SIZE_OPTIONS,
  ZOOM_PRESETS,
} from '@/core/constants/viewport';
