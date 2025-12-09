/**
 * Canvas Tool Store
 *
 * Manages the currently active drawing/interaction tool.
 * Other canvas state is managed by dedicated stores:
 * - Entities: @/core/store/entityStore
 * - Selection: @/features/canvas/store/selectionStore
 * - Viewport (pan/zoom): @/features/canvas/store/viewportStore
 */
import { create } from 'zustand';

/**
 * Available canvas tool types
 */
export type CanvasTool = 'select' | 'duct' | 'equipment' | 'room' | 'fitting' | 'note';

interface ToolState {
  /** Currently active tool */
  currentTool: CanvasTool;
}

interface ToolActions {
  /** Set the active tool */
  setTool: (tool: CanvasTool) => void;
  /** Reset to default select tool */
  resetTool: () => void;
}

type ToolStore = ToolState & ToolActions;

const initialState: ToolState = {
  currentTool: 'select',
};

export const useToolStore = create<ToolStore>((set) => ({
  ...initialState,

  setTool: (tool) => set({ currentTool: tool }),

  resetTool: () => set({ currentTool: 'select' }),
}));

// Hook selectors (for React components with reactivity)
export const useCurrentTool = () => useToolStore((state) => state.currentTool);

export const useIsToolActive = (tool: CanvasTool) =>
  useToolStore((state) => state.currentTool === tool);

// Actions hook (per naming convention)
export const useToolActions = () =>
  useToolStore((state) => ({
    setTool: state.setTool,
    resetTool: state.resetTool,
  }));

/**
 * @deprecated Use useToolStore instead. This alias is provided for backward compatibility.
 */
export const useCanvasStore = useToolStore;
