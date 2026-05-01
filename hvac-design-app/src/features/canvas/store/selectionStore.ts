import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type SelectedSegment = {
  runId: string;
  segmentIndex: number;
};

interface SelectionState {
  selectedIds: string[];
  selectedSegments: SelectedSegment[];
  hoveredId: string | null;
}

interface SelectionActions {
  select: (id: string) => void;
  selectSingle: (id: string) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  toggleSelection: (id: string, forceAdd?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  selectSegment: (runId: string, segmentIndex: number, additive?: boolean) => void;
  toggleSegmentSelection: (runId: string, segmentIndex: number) => void;
  clearSelectedSegments: () => void;
  clearSelection: () => void;
  selectAll: (allIds: string[]) => void;
  setHovered: (id: string | null) => void;
}

type SelectionStore = SelectionState & SelectionActions;

const initialState: SelectionState = {
  selectedIds: [],
  selectedSegments: [],
  hoveredId: null,
};

function filterSegmentsForSelection(selectedSegments: SelectedSegment[], selectedIds: string[]) {
  return selectedSegments.filter((segment) => selectedIds.includes(segment.runId));
}

export const useSelectionStore = create<SelectionStore>()(
  immer((set) => ({
    ...initialState,

    select: (id) =>
      set((state) => {
        state.selectedIds = [id];
        state.selectedSegments = filterSegmentsForSelection(state.selectedSegments, state.selectedIds);
      }),

    selectSingle: (id) =>
      set((state) => {
        state.selectedIds = [id];
        state.selectedSegments = filterSegmentsForSelection(state.selectedSegments, state.selectedIds);
      }),

    addToSelection: (id) =>
      set((state) => {
        if (!state.selectedIds.includes(id)) {
          state.selectedIds.push(id);
        }
      }),

    removeFromSelection: (id) =>
      set((state) => {
        state.selectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);
        state.selectedSegments = filterSegmentsForSelection(state.selectedSegments, state.selectedIds);
      }),

    toggleSelection: (id, forceAdd) =>
      set((state) => {
        if (forceAdd === true) {
          if (!state.selectedIds.includes(id)) {
            state.selectedIds.push(id);
          }
          return;
        }

        if (forceAdd === false) {
          state.selectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);
          state.selectedSegments = filterSegmentsForSelection(state.selectedSegments, state.selectedIds);
          return;
        }

        if (state.selectedIds.includes(id)) {
          state.selectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);
          state.selectedSegments = filterSegmentsForSelection(state.selectedSegments, state.selectedIds);
        } else {
          state.selectedIds.push(id);
        }
      }),

    selectMultiple: (ids) =>
      set((state) => {
        state.selectedIds = ids;
        state.selectedSegments = filterSegmentsForSelection(state.selectedSegments, ids);
      }),

    selectSegment: (runId, segmentIndex, additive = false) =>
      set((state) => {
        if (!state.selectedIds.includes(runId)) {
          return;
        }

        if (!additive) {
          state.selectedSegments = [{ runId, segmentIndex }];
          return;
        }

        const exists = state.selectedSegments.some(
          (segment) => segment.runId === runId && segment.segmentIndex === segmentIndex
        );
        if (!exists) {
          state.selectedSegments.push({ runId, segmentIndex });
        }
      }),

    toggleSegmentSelection: (runId, segmentIndex) =>
      set((state) => {
        if (!state.selectedIds.includes(runId)) {
          return;
        }

        const existingIndex = state.selectedSegments.findIndex(
          (segment) => segment.runId === runId && segment.segmentIndex === segmentIndex
        );

        if (existingIndex >= 0) {
          state.selectedSegments.splice(existingIndex, 1);
        } else {
          state.selectedSegments.push({ runId, segmentIndex });
        }
      }),

    clearSelectedSegments: () =>
      set((state) => {
        state.selectedSegments = [];
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedIds = [];
        state.selectedSegments = [];
      }),

    selectAll: (allIds) =>
      set((state) => {
        state.selectedIds = [...allIds];
        state.selectedSegments = filterSegmentsForSelection(state.selectedSegments, state.selectedIds);
      }),

    setHovered: (id) =>
      set((state) => {
        state.hoveredId = id;
      }),
  }))
);

export const useSelectedIds = () => useSelectionStore((state) => state.selectedIds);
export const useIsSelected = (id: string) => useSelectionStore((state) => state.selectedIds.includes(id));
export const useSelectionCount = () => useSelectionStore((state) => state.selectedIds.length);
export const useHoveredId = () => useSelectionStore((state) => state.hoveredId);
export const useHasSelection = () => useSelectionStore((state) => state.selectedIds.length > 0);

export const useSelectionActions = () =>
  useSelectionStore((state) => ({
    select: state.select,
    selectSingle: state.selectSingle,
    addToSelection: state.addToSelection,
    removeFromSelection: state.removeFromSelection,
    toggleSelection: state.toggleSelection,
    selectMultiple: state.selectMultiple,
    selectSegment: state.selectSegment,
    toggleSegmentSelection: state.toggleSegmentSelection,
    clearSelectedSegments: state.clearSelectedSegments,
    clearSelection: state.clearSelection,
    selectAll: state.selectAll,
    setHovered: state.setHovered,
  }));
