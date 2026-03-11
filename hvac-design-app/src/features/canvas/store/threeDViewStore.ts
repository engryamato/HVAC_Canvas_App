import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface Vector3State {
  x: number;
  y: number;
  z: number;
}

export interface ThreeDViewState {
  cameraTarget: Vector3State;
  cameraPosition: Vector3State;
  orbitRadius: number;
  polarAngle: number;
  azimuthAngle: number;
  cameraRestored: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showPlanOverlay: boolean;
}

interface ThreeDViewActions {
  setCameraTarget: (target: Vector3State) => void;
  setCameraPosition: (position: Vector3State) => void;
  setOrbitState: (state: Pick<ThreeDViewState, 'orbitRadius' | 'polarAngle' | 'azimuthAngle'>) => void;
  setDisplayOptions: (options: Partial<Pick<ThreeDViewState, 'showGrid' | 'showAxes' | 'showPlanOverlay'>>) => void;
  hydrateThreeDView: (state: Partial<ThreeDViewState>) => void;
  reset: () => void;
}

type ThreeDViewStore = ThreeDViewState & ThreeDViewActions;

export const THREE_D_VIEW_INITIAL_STATE: ThreeDViewState = {
  cameraTarget: { x: 0, y: 0, z: 0 },
  cameraPosition: { x: 560, y: 320, z: 560 },
  orbitRadius: 860,
  polarAngle: 1.12,
  azimuthAngle: 0.78,
  cameraRestored: false,
  showGrid: true,
  showAxes: true,
  showPlanOverlay: false,
};

export const useThreeDViewStore = create<ThreeDViewStore>()(
  immer((set) => ({
    ...THREE_D_VIEW_INITIAL_STATE,

    setCameraTarget: (target) =>
      set((state) => {
        state.cameraTarget = target;
      }),

    setCameraPosition: (position) =>
      set((state) => {
        state.cameraPosition = position;
      }),

    setOrbitState: (orbitState) =>
      set((state) => {
        state.orbitRadius = orbitState.orbitRadius;
        state.polarAngle = orbitState.polarAngle;
        state.azimuthAngle = orbitState.azimuthAngle;
      }),

    setDisplayOptions: (options) =>
      set((state) => {
        Object.assign(state, options);
      }),

    hydrateThreeDView: (incomingState) =>
      set((state) => {
        Object.assign(state, {
          ...state,
          ...incomingState,
          cameraRestored: true,
        });
      }),

    reset: () =>
      set((state) => {
        Object.assign(state, THREE_D_VIEW_INITIAL_STATE);
      }),
  }))
);
