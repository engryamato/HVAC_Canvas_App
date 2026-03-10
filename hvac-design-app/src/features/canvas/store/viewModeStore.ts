import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type CanvasViewMode = 'plan' | '3d';

interface ViewModeState {
  activeViewMode: CanvasViewMode;
  previousViewMode: CanvasViewMode | null;
  is3DInitialized: boolean;
  show3DGrid: boolean;
  show3DAxes: boolean;
  showPlanOverlayIn3D: boolean;
  selectionSyncEnabled: boolean;
}

interface ViewModeActions {
  setViewMode: (mode: CanvasViewMode) => void;
  toggleViewMode: () => void;
  set3DInitialized: (initialized: boolean) => void;
  set3DGridVisible: (visible: boolean) => void;
  set3DAxesVisible: (visible: boolean) => void;
  setPlanOverlayVisible: (visible: boolean) => void;
  setSelectionSyncEnabled: (enabled: boolean) => void;
  hydrateViewMode: (state: Partial<ViewModeState>) => void;
  reset: () => void;
}

type ViewModeStore = ViewModeState & ViewModeActions;

export const VIEW_MODE_INITIAL_STATE: ViewModeState = {
  activeViewMode: 'plan',
  previousViewMode: null,
  is3DInitialized: false,
  show3DGrid: true,
  show3DAxes: true,
  showPlanOverlayIn3D: false,
  selectionSyncEnabled: true,
};

export const useViewModeStore = create<ViewModeStore>()(
  immer((set) => ({
    ...VIEW_MODE_INITIAL_STATE,

    setViewMode: (mode) =>
      set((state) => {
        if (state.activeViewMode !== mode) {
          state.previousViewMode = state.activeViewMode;
          state.activeViewMode = mode;
        }
      }),

    toggleViewMode: () =>
      set((state) => {
        state.previousViewMode = state.activeViewMode;
        state.activeViewMode = state.activeViewMode === 'plan' ? '3d' : 'plan';
      }),

    set3DInitialized: (initialized) =>
      set((state) => {
        state.is3DInitialized = initialized;
      }),

    set3DGridVisible: (visible) =>
      set((state) => {
        state.show3DGrid = visible;
      }),

    set3DAxesVisible: (visible) =>
      set((state) => {
        state.show3DAxes = visible;
      }),

    setPlanOverlayVisible: (visible) =>
      set((state) => {
        state.showPlanOverlayIn3D = visible;
      }),

    setSelectionSyncEnabled: (enabled) =>
      set((state) => {
        state.selectionSyncEnabled = enabled;
      }),

    hydrateViewMode: (incomingState) =>
      set((state) => {
        Object.assign(state, {
          ...state,
          ...incomingState,
        });
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, VIEW_MODE_INITIAL_STATE);
      }),
  }))
);

export const useActiveViewMode = () => useViewModeStore((state) => state.activeViewMode);
