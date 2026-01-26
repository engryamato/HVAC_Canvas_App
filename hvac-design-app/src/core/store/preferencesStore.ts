import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UnitSystem = 'imperial' | 'metric';
type ThemeMode = 'light' | 'dark';

export interface PreferencesState {
  projectFolder: string;
  unitSystem: UnitSystem;
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
  gridSize: number;
  theme: ThemeMode;
  compactMode: boolean;
  snapToGrid: boolean;
  showRulers: boolean;
}

interface PreferencesActions {
  setProjectFolder: (path: string) => void;
  setUnitSystem: (system: UnitSystem) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setAutoSaveInterval: (ms: number) => void;
  setGridSize: (size: number) => void;
  setTheme: (theme: ThemeMode) => void;
  setCompactMode: (enabled: boolean) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setShowRulers: (enabled: boolean) => void;
}

type PreferencesStore = PreferencesState & PreferencesActions;

export const PREFERENCES_DEFAULTS: PreferencesState = {
  projectFolder: '/projects',
  unitSystem: 'imperial',
  autoSaveEnabled: true,
  autoSaveInterval: 300000,
  gridSize: 24,
  theme: 'light',
  compactMode: false,
  snapToGrid: true,
  showRulers: false,
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...PREFERENCES_DEFAULTS,
      setProjectFolder: (path) => set({ projectFolder: path }),
      setUnitSystem: (system) => set({ unitSystem: system }),
      setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),
      setAutoSaveInterval: (ms) => set({ autoSaveInterval: ms }),
      setGridSize: (size) => set({ gridSize: size }),
      setTheme: (theme) => set({ theme }),
      setCompactMode: (enabled) => set({ compactMode: enabled }),
      setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
      setShowRulers: (enabled) => set({ showRulers: enabled }),
    }),
    { name: 'sws.preferences' }
  )
);

export const usePreferences = () => usePreferencesStore((state) => state);
export const usePreferencesActions = () =>
  usePreferencesStore((state) => ({
    setProjectFolder: state.setProjectFolder,
    setUnitSystem: state.setUnitSystem,
    setAutoSaveEnabled: state.setAutoSaveEnabled,
    setAutoSaveInterval: state.setAutoSaveInterval,
    setGridSize: state.setGridSize,
    setTheme: state.setTheme,
    setCompactMode: state.setCompactMode,
    setSnapToGrid: state.setSnapToGrid,
    setShowRulers: state.setShowRulers,
  }));
