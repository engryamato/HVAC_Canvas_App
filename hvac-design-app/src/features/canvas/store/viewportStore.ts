import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import {
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
  DEFAULT_ZOOM,
  DEFAULT_GRID_SIZE,
  ZOOM_TRANSITION_DURATION,
  ZOOM_TO_SELECTION_PADDING,
} from '@/core/constants/viewport';
import { usePreferencesStore } from '@/core/store/preferencesStore';

interface ViewportState {
  panX: number;
  panY: number;
  zoom: number;
  gridVisible: boolean;
  gridSize: number; // In pixels at zoom=1
  snapToGrid: boolean;
  // Transition state
  isZooming: boolean;
  targetZoom: number | null;
  targetPanX: number | null;
  targetPanY: number | null;
}

interface ViewportActions {
  pan: (deltaX: number, deltaY: number) => void;
  setPan: (x: number, y: number) => void;
  zoomTo: (level: number, centerX?: number, centerY?: number, options?: { animate?: boolean }) => void;
  zoomIn: (centerX?: number, centerY?: number, options?: { animate?: boolean }) => void;
  zoomOut: (centerX?: number, centerY?: number, options?: { animate?: boolean }) => void;
  fitToContent: (
    bounds: { x: number; y: number; width: number; height: number },
    canvasDimensions?: { width: number; height: number },
    options?: { animate?: boolean }
  ) => void;
  resetView: () => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSnap: () => void;
  zoomToSelection: (
    bounds: { x: number; y: number; width: number; height: number },
    options?: { animate?: boolean }
  ) => void;
  // Internal animation methods
  _startZoomTransition: (targetZoom: number, targetPanX?: number, targetPanY?: number) => void;
  _updateZoomAnimation: (zoom: number, panX: number, panY: number) => void;
  _endZoomTransition: () => void;
}


type ViewportStore = ViewportState & ViewportActions;

const initialState: ViewportState = {
  panX: 0,
  panY: 0,
  zoom: DEFAULT_ZOOM,
  gridVisible: true,
  gridSize: DEFAULT_GRID_SIZE,
  snapToGrid: true,
  isZooming: false,
  targetZoom: null,
  targetPanX: null,
  targetPanY: null,
};

// Animation state (kept outside store for RAF loop)
let animationFrameId: number | null = null;
let animationStartTime: number | null = null;
let startZoom: number = 1;
let startPanX: number = 0;
let startPanY: number = 0;

// Ease-out cubic easing function
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Animation loop
function runZoomAnimation() {
  const state = useViewportStore.getState();
  
  if (!state.isZooming || state.targetZoom === null || animationStartTime === null) {
    animationFrameId = null;
    return;
  }

  const elapsed = performance.now() - animationStartTime;
  const progress = Math.min(elapsed / ZOOM_TRANSITION_DURATION, 1);
  const easedProgress = easeOutCubic(progress);

  const newZoom = startZoom + (state.targetZoom - startZoom) * easedProgress;
  const newPanX = state.targetPanX !== null 
    ? startPanX + (state.targetPanX - startPanX) * easedProgress 
    : state.panX;
  const newPanY = state.targetPanY !== null 
    ? startPanY + (state.targetPanY - startPanY) * easedProgress 
    : state.panY;

  state._updateZoomAnimation(newZoom, newPanX, newPanY);

  if (progress >= 1) {
    state._endZoomTransition();
    animationFrameId = null;
    animationStartTime = null;
  } else {
    animationFrameId = requestAnimationFrame(runZoomAnimation);
  }
}

export const useViewportStore = create<ViewportStore>()(
  immer((set, get) => ({
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

    zoomTo: (level, centerX, centerY, options = { animate: true }) => {
      const state = get();
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
      
      // Calculate new pan if center point provided
      let newPanX = state.panX;
      let newPanY = state.panY;
      if (centerX !== undefined && centerY !== undefined) {
        const zoomRatio = newZoom / state.zoom;
        newPanX = centerX - (centerX - state.panX) * zoomRatio;
        newPanY = centerY - (centerY - state.panY) * zoomRatio;
      }

      // Cancel any ongoing animation
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      if (!options.animate) {
        set((s) => {
          s.zoom = newZoom;
          s.panX = newPanX;
          s.panY = newPanY;
          s.isZooming = false;
          s.targetZoom = null;
          s.targetPanX = null;
          s.targetPanY = null;
        });
        return;
      }

      // Store start values for animation
      startZoom = state.zoom;
      startPanX = state.panX;
      startPanY = state.panY;
      animationStartTime = performance.now();

      // Start transition
      state._startZoomTransition(
        newZoom,
        centerX !== undefined ? newPanX : undefined,
        centerY !== undefined ? newPanY : undefined
      );

      // Start animation loop
      animationFrameId = requestAnimationFrame(runZoomAnimation);
    },

    zoomIn: (centerX, centerY, options) => {
      const state = get();
      const newZoom = Math.min(MAX_ZOOM, state.zoom + ZOOM_STEP);
      get().zoomTo(newZoom, centerX, centerY, options);
    },

    zoomOut: (centerX, centerY, options) => {
      const state = get();
      const newZoom = Math.max(MIN_ZOOM, state.zoom - ZOOM_STEP);
      get().zoomTo(newZoom, centerX, centerY, options);
    },

    fitToContent: (bounds, canvasDimensions, options = { animate: true }) => {
      const state = get();
      
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
        set((s) => {
          s.panX = -bounds.x - bounds.width / 2;
          s.panY = -bounds.y - bounds.height / 2;
        });
        return;
      }

      const padding = 50; // Padding around content

      // Guard against division by zero or negative bounds
      if (bounds.width <= 0 || bounds.height <= 0) {
        // Invalid bounds, just center without zoom
        set((s) => {
          s.panX = canvasWidth / 2 - bounds.x;
          s.panY = canvasHeight / 2 - bounds.y;
        });
        return;
      }

      // Guard against canvas being too small for padding
      const effectivePadding = Math.min(padding, canvasWidth / 4, canvasHeight / 4);

      // Calculate zoom to fit content with padding
      const zoomX = Math.max(0.1, (canvasWidth - effectivePadding * 2) / bounds.width);
      const zoomY = Math.max(0.1, (canvasHeight - effectivePadding * 2) / bounds.height);
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(zoomX, zoomY)));

      // Center the content
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      const newPanX = canvasWidth / 2 - centerX * newZoom;
      const newPanY = canvasHeight / 2 - centerY * newZoom;

      // Cancel any ongoing animation
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      if (!options.animate) {
        set((s) => {
          s.zoom = newZoom;
          s.panX = newPanX;
          s.panY = newPanY;
          s.isZooming = false;
          s.targetZoom = null;
          s.targetPanX = null;
          s.targetPanY = null;
        });
        return;
      }

      // Store start values for animation
      startZoom = state.zoom;
      startPanX = state.panX;
      startPanY = state.panY;
      animationStartTime = performance.now();

      // Start transition with both zoom and pan
      state._startZoomTransition(newZoom, newPanX, newPanY);

      // Start animation loop
      animationFrameId = requestAnimationFrame(runZoomAnimation);
    },

    resetView: () => {
      // Cancel any ongoing animation to prevent late frames from overwriting the reset
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      animationStartTime = null;

      set((state) => {
        state.panX = 0;
        state.panY = 0;
        state.zoom = DEFAULT_ZOOM;
        // Clear transition state
        state.isZooming = false;
        state.targetZoom = null;
        state.targetPanX = null;
        state.targetPanY = null;
      });
    },

    zoomToSelection: (bounds, options = { animate: true }) => {
      if (typeof window === 'undefined') {
        return;
      }

      const canvasWidth = window.innerWidth * 0.7;
      const canvasHeight = window.innerHeight * 0.8;
      const padding = 50;

      if (bounds.width <= 0 || bounds.height <= 0) {
        return;
      }

      // Apply 10% padding to bounds
      const paddingMultiplier = 1 + ZOOM_TO_SELECTION_PADDING;
      const paddedBounds = {
        x: bounds.x - (bounds.width * ZOOM_TO_SELECTION_PADDING) / 2,
        y: bounds.y - (bounds.height * ZOOM_TO_SELECTION_PADDING) / 2,
        width: bounds.width * paddingMultiplier,
        height: bounds.height * paddingMultiplier,
      };

      const effectivePadding = Math.min(padding, canvasWidth / 4, canvasHeight / 4);
      const zoomX = Math.max(0.1, (canvasWidth - effectivePadding * 2) / paddedBounds.width);
      const zoomY = Math.max(0.1, (canvasHeight - effectivePadding * 2) / paddedBounds.height);
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(zoomX, zoomY)));

      const centerX = paddedBounds.x + paddedBounds.width / 2;
      const centerY = paddedBounds.y + paddedBounds.height / 2;
      const newPanX = canvasWidth / 2 - centerX * newZoom;
      const newPanY = canvasHeight / 2 - centerY * newZoom;

      get().zoomTo(newZoom, undefined, undefined, options);
      get().setPan(newPanX, newPanY);
    },


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
        usePreferencesStore.getState().setSnapToGrid(state.snapToGrid);
      }),

    // Internal animation methods
    _startZoomTransition: (targetZoom, targetPanX, targetPanY) =>
      set((state) => {
        state.isZooming = true;
        state.targetZoom = targetZoom;
        state.targetPanX = targetPanX ?? null;
        state.targetPanY = targetPanY ?? null;
      }),

    _updateZoomAnimation: (zoom, panX, panY) =>
      set((state) => {
        state.zoom = zoom;
        state.panX = panX;
        state.panY = panY;
      }),

    _endZoomTransition: () =>
      set((state) => {
        // Snap to target values
        if (state.targetZoom !== null) {
          state.zoom = state.targetZoom;
        }
        if (state.targetPanX !== null) {
          state.panX = state.targetPanX;
        }
        if (state.targetPanY !== null) {
          state.panY = state.targetPanY;
        }
        state.isZooming = false;
        state.targetZoom = null;
        state.targetPanX = null;
        state.targetPanY = null;
      }),
  }))
);

// Hook selectors (for React components with reactivity)
export const useZoom = () => useViewportStore((state) => state.zoom);
export const usePan = () =>
  useViewportStore(useShallow((state) => ({ x: state.panX, y: state.panY })));
export const useGridVisible = () => useViewportStore((state) => state.gridVisible);
export const useSnapToGrid = () => useViewportStore((state) => state.snapToGrid);
export const useGridSize = () => useViewportStore((state) => state.gridSize);
export const useIsZooming = () => useViewportStore((state) => state.isZooming);
export const usePanAndZoom = () =>
  useViewportStore(
    useShallow((state) => ({ panX: state.panX, panY: state.panY, zoom: state.zoom }))
  );


// Actions hook (per naming convention)
export const useViewportActions = () =>
  useViewportStore(
    useShallow((state) => ({
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
      zoomToSelection: state.zoomToSelection,
    }))
  );

// Note: Viewport constants (MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, etc.) are now
// centralized in @/core/constants/viewport and re-exported from ./index.ts
