import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface SelectionState {
  selectedIds: string[];
  hoveredId: string | null;
}

interface SelectionActions {
  select: (id: string) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  toggleSelection: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  selectAll: (allIds: string[]) => void;
  setHovered: (id: string | null) => void;
}

type SelectionStore = SelectionState & SelectionActions;

const initialState: SelectionState = {
  selectedIds: [],
  hoveredId: null,
};

export const useSelectionStore = create<SelectionStore>()(
  immer((set) => ({
    ...initialState,

    select: (id) =>
      set((state) => {
        state.selectedIds = [id];
      }),

    addToSelection: (id) =>
      set((state) => {
        if (!state.selectedIds.includes(id)) {
          state.selectedIds.push(id);
        }
      }),

    removeFromSelection: (id) =>
      set((state) => {
        state.selectedIds = state.selectedIds.filter((s) => s !== id);
      }),

    toggleSelection: (id) =>
      set((state) => {
        if (state.selectedIds.includes(id)) {
          state.selectedIds = state.selectedIds.filter((s) => s !== id);
        } else {
          state.selectedIds.push(id);
        }
      }),

    selectMultiple: (ids) =>
      set((state) => {
        state.selectedIds = ids;
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedIds = [];
      }),

    selectAll: (allIds) =>
      set((state) => {
        state.selectedIds = [...allIds];
      }),

    setHovered: (id) =>
      set((state) => {
        state.hoveredId = id;
      }),
  }))
);

// Hook selectors (for React components with reactivity)
export const useSelectedIds = () => useSelectionStore((state) => state.selectedIds);

export const useIsSelected = (id: string) =>
  useSelectionStore((state) => state.selectedIds.includes(id));

export const useSelectionCount = () => useSelectionStore((state) => state.selectedIds.length);

export const useHoveredId = () => useSelectionStore((state) => state.hoveredId);

export const useHasSelection = () => useSelectionStore((state) => state.selectedIds.length > 0);

// Actions hook (per naming convention)
export const useSelectionActions = () =>
  useSelectionStore((state) => ({
    select: state.select,
    addToSelection: state.addToSelection,
    removeFromSelection: state.removeFromSelection,
    toggleSelection: state.toggleSelection,
    selectMultiple: state.selectMultiple,
    clearSelection: state.clearSelection,
    selectAll: state.selectAll,
    setHovered: state.setHovered,
  }));

