import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
  DEFAULT_ZOOM,
  DEFAULT_GRID_SIZE,
} from '@/core/constants/viewport';

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
  fitToContent: (
    bounds: { x: number; y: number; width: number; height: number },
    canvasDimensions?: { width: number; height: number }
  ) => void;
  resetView: () => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSnap: () => void;
}

type ViewportStore = ViewportState & ViewportActions;

const initialState: ViewportState = {
  panX: 0,
  panY: 0,
  zoom: DEFAULT_ZOOM,
  gridVisible: true,
  gridSize: DEFAULT_GRID_SIZE,
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

    fitToContent: (bounds, canvasDimensions) =>
      set((state) => {
        // Get canvas dimensions from parameter or fallback to viewport (SSR-safe)
        let canvasWidth: number;
        let canvasHeight: number;

        if (canvasDimensions) {
          canvasWidth = canvasDimensions.width;
          canvasHeight = canvasDimensions.height;
        } else if (typeof window !== 'undefined') {
          // Fallback: approximate from viewport (only in browser)
          canvasWidth = window.innerWidth * 0.7;
          canvasHeight = window.innerHeight * 0.8;
        } else {
          // SSR fallback: just center without zoom adjustment
          state.panX = -bounds.x - bounds.width / 2;
          state.panY = -bounds.y - bounds.height / 2;
          return;
        }

        const padding = 50; // Padding around content

        // Calculate zoom to fit content with padding
        const zoomX = (canvasWidth - padding * 2) / bounds.width;
        const zoomY = (canvasHeight - padding * 2) / bounds.height;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(zoomX, zoomY)));

        // Center the content
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        state.panX = canvasWidth / 2 - centerX * newZoom;
        state.panY = canvasHeight / 2 - centerY * newZoom;
        state.zoom = newZoom;
      }),

    resetView: () =>
      set((state) => {
        state.panX = 0;
        state.panY = 0;
        state.zoom = DEFAULT_ZOOM;
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

// Note: Viewport constants (MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, etc.) are now
// centralized in @/core/constants/viewport and re-exported from ./index.ts
