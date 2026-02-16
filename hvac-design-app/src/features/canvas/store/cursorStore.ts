import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface CanvasPoint {
  x: number;
  y: number;
}

interface CursorState {
  lastCanvasPoint: CanvasPoint | null;
  cursorMode: 'default' | 'select' | 'pan' | 'duct' | 'fitting' | 'equipment' | 'room' | 'note' | 'crosshair';
}

interface CursorActions {
  setLastCanvasPoint: (point: CanvasPoint) => void;
  clearLastCanvasPoint: () => void;
  setCursorMode: (mode: CursorState['cursorMode']) => void;
}

type CursorStore = CursorState & CursorActions;

const initialState: CursorState = {
  lastCanvasPoint: null,
  cursorMode: 'default',
};

export const useCursorStore = create<CursorStore>()(
  immer((set) => ({
    ...initialState,

    setLastCanvasPoint: (point) =>
      set((state) => {
        state.lastCanvasPoint = point;
      }),

    setCursorMode: (mode) =>
      set((state) => {
        state.cursorMode = mode;
      }),

    clearLastCanvasPoint: () => set(initialState),
  }))
);

export const selectLastCanvasPoint = () => useCursorStore.getState().lastCanvasPoint;
export const selectCursorMode = () => useCursorStore.getState().cursorMode;

