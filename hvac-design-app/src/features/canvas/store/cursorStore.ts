import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface CanvasPoint {
  x: number;
  y: number;
}

interface CursorState {
  lastCanvasPoint: CanvasPoint | null;
}

interface CursorActions {
  setLastCanvasPoint: (point: CanvasPoint) => void;
  clearLastCanvasPoint: () => void;
}

type CursorStore = CursorState & CursorActions;

const initialState: CursorState = {
  lastCanvasPoint: null,
};

export const useCursorStore = create<CursorStore>()(
  immer((set) => ({
    ...initialState,

    setLastCanvasPoint: (point) =>
      set((state) => {
        state.lastCanvasPoint = point;
      }),

    clearLastCanvasPoint: () => set(initialState),
  }))
);

export const selectLastCanvasPoint = () => useCursorStore.getState().lastCanvasPoint;

