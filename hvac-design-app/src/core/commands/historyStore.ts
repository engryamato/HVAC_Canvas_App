import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ReversibleCommand } from './types';

/** Maximum number of commands to keep in history */
export const MAX_HISTORY_SIZE = 100;

interface HistoryState {
  /** Stack of past commands (most recent at end) */
  past: ReversibleCommand[];
  /** Stack of future commands for redo (most recent at start) */
  future: ReversibleCommand[];
  /** Maximum history size */
  maxSize: number;
}

interface HistoryActions {
  /** Push a new command to history (clears future stack) */
  push: (command: ReversibleCommand) => void;
  /** Pop the most recent command for undo */
  undo: () => ReversibleCommand | undefined;
  /** Pop the most recent undone command for redo */
  redo: () => ReversibleCommand | undefined;
  /** Clear all history */
  clear: () => void;
  /** Check if undo is available */
  canUndo: () => boolean;
  /** Check if redo is available */
  canRedo: () => boolean;
}

type HistoryStore = HistoryState & HistoryActions;

const initialState: HistoryState = {
  past: [],
  future: [],
  maxSize: MAX_HISTORY_SIZE,
};

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    ...initialState,

    push: (command) =>
      set((state) => {
        // Add to past, clear future (new action invalidates redo stack)
        state.past.push(command);
        state.future = [];

        // Trim if exceeds max size
        if (state.past.length > state.maxSize) {
          state.past = state.past.slice(-state.maxSize);
        }
      }),

    undo: () => {
      const state = get();
      if (state.past.length === 0) return undefined;

      const command = state.past[state.past.length - 1];
      set((s) => {
        s.past.pop();
        s.future.unshift(command);
      });
      return command;
    },

    redo: () => {
      const state = get();
      if (state.future.length === 0) return undefined;

      const command = state.future[0];
      set((s) => {
        s.future.shift();
        s.past.push(command);
      });
      return command;
    },

    clear: () => set(initialState),

    canUndo: () => get().past.length > 0,

    canRedo: () => get().future.length > 0,
  }))
);

// Hook selectors (for React components with reactivity)
export const useCanUndo = () => useHistoryStore((state) => state.past.length > 0);
export const useCanRedo = () => useHistoryStore((state) => state.future.length > 0);
export const useHistorySize = () => useHistoryStore((state) => state.past.length);
export const useFutureSize = () => useHistoryStore((state) => state.future.length);

// Actions hook (per naming convention)
export const useHistoryActions = () =>
  useHistoryStore((state) => ({
    push: state.push,
    undo: state.undo,
    redo: state.redo,
    clear: state.clear,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
  }));

