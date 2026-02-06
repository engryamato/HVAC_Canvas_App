import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FloatingPosition = {
  x: number;
  y: number;
};

export interface InspectorPreferencesState {
  isFloating: boolean;
  floatingPosition: FloatingPosition | null;
}

export interface InspectorPreferencesActions {
  setFloating: (isFloating: boolean) => void;
  setFloatingPosition: (position: FloatingPosition) => void;
  resetFloatingPosition: () => void;
}

export type InspectorPreferencesStore =
  & InspectorPreferencesState
  & InspectorPreferencesActions;

export const INSPECTOR_PREFERENCES_DEFAULTS: InspectorPreferencesState = {
  isFloating: false,
  floatingPosition: null,
};

export const useInspectorPreferencesStore = create<InspectorPreferencesStore>()(
  persist(
    (set) => ({
      ...INSPECTOR_PREFERENCES_DEFAULTS,
      setFloating: (isFloating) => set({ isFloating }),
      setFloatingPosition: (position) => set({ floatingPosition: position }),
      resetFloatingPosition: () => set({ floatingPosition: null }),
    }),
    {
      name: 'sws.inspector-preferences',
      partialize: (state) => ({
        isFloating: state.isFloating,
        floatingPosition: state.floatingPosition,
      }),
    }
  )
);

