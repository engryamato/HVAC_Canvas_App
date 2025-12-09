import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const MIN_ZOOM = 0.1; // 10%
const MAX_ZOOM = 4.0; // 400%
const ZOOM_STEP = 0.1;

interface ViewportState {
  panX: number;
  panY: number;
  zoom: number;
  gridVisible: boolean;
  gridSize: number; // In pixels at zoom=1
  snapToGrid: boolean;
}

interface ViewportActions {
  pan: (deltaX: number, deltaY: number) => void;
  setPan: (x: number, y: number) => void;
  zoomTo: (level: number, centerX?: number, centerY?: number) => void;
  zoomIn: (centerX?: number, centerY?: number) => void;
  zoomOut: (centerX?: number, centerY?: number) => void;
  fitToContent: (bounds: { x: number; y: number; width: number; height: number }) => void;
  resetView: () => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSnap: () => void;
}

type ViewportStore = ViewportState & ViewportActions;

const initialState: ViewportState = {
  panX: 0,
  panY: 0,
  zoom: 1,
  gridVisible: true,
  gridSize: 24, // 1/4 inch at 96 DPI
  snapToGrid: true,
};

export const useViewportStore = create<ViewportStore>()(
  immer((set) => ({
    ...initialState,

    pan: (deltaX, deltaY) =>
      set((state) => {
        state.panX += deltaX;
        state.panY += deltaY;
      }),

    setPan: (x, y) =>
      set((state) => {
        state.panX = x;
        state.panY = y;
      }),

    zoomTo: (level, centerX, centerY) =>
      set((state) => {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
        // If center point provided, adjust pan to zoom toward that point
        if (centerX !== undefined && centerY !== undefined) {
          const zoomRatio = newZoom / state.zoom;
          state.panX = centerX - (centerX - state.panX) * zoomRatio;
          state.panY = centerY - (centerY - state.panY) * zoomRatio;
        }
        state.zoom = newZoom;
      }),

    zoomIn: (centerX, centerY) =>
      set((state) => {
        const newZoom = Math.min(MAX_ZOOM, state.zoom + ZOOM_STEP);
        if (centerX !== undefined && centerY !== undefined) {
          const zoomRatio = newZoom / state.zoom;
          state.panX = centerX - (centerX - state.panX) * zoomRatio;
          state.panY = centerY - (centerY - state.panY) * zoomRatio;
        }
        state.zoom = newZoom;
      }),

    zoomOut: (centerX, centerY) =>
      set((state) => {
        const newZoom = Math.max(MIN_ZOOM, state.zoom - ZOOM_STEP);
        if (centerX !== undefined && centerY !== undefined) {
          const zoomRatio = newZoom / state.zoom;
          state.panX = centerX - (centerX - state.panX) * zoomRatio;
          state.panY = centerY - (centerY - state.panY) * zoomRatio;
        }
        state.zoom = newZoom;
      }),

    fitToContent: (bounds) =>
      set((state) => {
        // This will be implemented with canvas dimensions
        // For now, just center on bounds
        state.panX = -bounds.x - bounds.width / 2;
        state.panY = -bounds.y - bounds.height / 2;
        state.zoom = 1;
      }),

    resetView: () =>
      set((state) => {
        state.panX = 0;
        state.panY = 0;
        state.zoom = 1;
      }),

    toggleGrid: () =>
      set((state) => {
        state.gridVisible = !state.gridVisible;
      }),

    setGridSize: (size) =>
      set((state) => {
        state.gridSize = size;
      }),

    toggleSnap: () =>
      set((state) => {
        state.snapToGrid = !state.snapToGrid;
      }),
  }))
);

// Hook selectors (for React components with reactivity)
export const useZoom = () => useViewportStore((state) => state.zoom);
export const usePan = () => useViewportStore((state) => ({ x: state.panX, y: state.panY }));
export const useGridVisible = () => useViewportStore((state) => state.gridVisible);
export const useSnapToGrid = () => useViewportStore((state) => state.snapToGrid);
export const useGridSize = () => useViewportStore((state) => state.gridSize);

// Actions hook (per naming convention)
export const useViewportActions = () =>
  useViewportStore((state) => ({
    pan: state.pan,
    setPan: state.setPan,
    zoomTo: state.zoomTo,
    zoomIn: state.zoomIn,
    zoomOut: state.zoomOut,
    fitToContent: state.fitToContent,
    resetView: state.resetView,
    toggleGrid: state.toggleGrid,
    setGridSize: state.setGridSize,
    toggleSnap: state.toggleSnap,
  }));

// Export constants for use in other modules
export { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP };

