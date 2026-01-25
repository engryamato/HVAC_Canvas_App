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
import { useShallow } from 'zustand/react/shallow';
import type { EquipmentType } from '../schema/equipment.schema';
import type { FittingType } from '../schema/fitting.schema';

/**
 * Available canvas tool types
 */
export type CanvasTool = 'select' | 'duct' | 'equipment' | 'room' | 'fitting' | 'note';

interface ToolState {
  /** Currently active tool */
  currentTool: CanvasTool;
  /** Selected equipment type when equipment tool is active */
  selectedEquipmentType: EquipmentType;
  /** Selected fitting type when fitting tool is active */
  selectedFittingType: FittingType;
}

interface ToolActions {
  /** Set the active tool */
  setTool: (tool: CanvasTool) => void;
  /** Reset to default select tool */
  resetTool: () => void;
  /** Set the selected equipment type */
  setEquipmentType: (type: EquipmentType) => void;
  /** Set the selected fitting type */
  setFittingType: (type: FittingType) => void;
}

type ToolStore = ToolState & ToolActions;

const initialState: ToolState = {
  currentTool: 'select',
  selectedEquipmentType: 'fan',
  selectedFittingType: 'elbow_90',
};

export const useToolStore = create<ToolStore>((set) => ({
  ...initialState,

  setTool: (tool) => set({ currentTool: tool }),

  resetTool: () => set({ currentTool: 'select' }),

  setEquipmentType: (type) => set({ selectedEquipmentType: type }),

  setFittingType: (type) => set({ selectedFittingType: type }),
}));

// Hook selectors (for React components with reactivity)
export const useCurrentTool = () => useToolStore((state) => state.currentTool);

export const useIsToolActive = (tool: CanvasTool) =>
  useToolStore((state) => state.currentTool === tool);

export const useSelectedEquipmentType = () => useToolStore((state) => state.selectedEquipmentType);

export const useSelectedFittingType = () => useToolStore((state) => state.selectedFittingType);

// Actions hook (per naming convention)
export const useToolActions = () =>
  useToolStore(
    useShallow((state) => ({
      setTool: state.setTool,
      resetTool: state.resetTool,
      setEquipmentType: state.setEquipmentType,
      setFittingType: state.setFittingType,
    }))
  );

/**
 * @deprecated Use useToolStore instead. This alias is provided for backward compatibility.
 */
export const useCanvasStore = useToolStore;
