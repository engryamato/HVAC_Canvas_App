import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UnitSystem = 'imperial' | 'metric';
type ThemeMode = 'light' | 'dark';

export interface PreferencesState {
  projectFolder: string;
  unitSystem: UnitSystem;
  autoSaveInterval: number;
  gridSize: number;
  theme: ThemeMode;
}

interface PreferencesActions {
  setProjectFolder: (path: string) => void;
  setUnitSystem: (system: UnitSystem) => void;
  setAutoSaveInterval: (ms: number) => void;
  setGridSize: (size: number) => void;
  setTheme: (theme: ThemeMode) => void;
}

type PreferencesStore = PreferencesState & PreferencesActions;

export const PREFERENCES_DEFAULTS: PreferencesState = {
  projectFolder: '/projects',
  unitSystem: 'imperial',
  autoSaveInterval: 60000,
  gridSize: 24,
  theme: 'light',
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...PREFERENCES_DEFAULTS,
      setProjectFolder: (path) => set({ projectFolder: path }),
      setUnitSystem: (system) => set({ unitSystem: system }),
      setAutoSaveInterval: (ms) => set({ autoSaveInterval: ms }),
      setGridSize: (size) => set({ gridSize: size }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'sws.preferences' }
  )
);

export const usePreferences = () => usePreferencesStore((state) => state);
export const usePreferencesActions = () =>
  usePreferencesStore((state) => ({
    setProjectFolder: state.setProjectFolder,
    setUnitSystem: state.setUnitSystem,
    setAutoSaveInterval: state.setAutoSaveInterval,
    setGridSize: state.setGridSize,
    setTheme: state.setTheme,
  }));
