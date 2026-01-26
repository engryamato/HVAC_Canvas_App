import { describe, it, beforeEach, expect } from 'vitest';
import { usePreferencesStore, PREFERENCES_DEFAULTS } from '../preferencesStore';

describe('PreferencesStore', () => {
  beforeEach(() => {
    usePreferencesStore.persist?.clearStorage?.();
    usePreferencesStore.setState(PREFERENCES_DEFAULTS);
  });

  describe('initialization', () => {
    it('initializes with defaults', () => {
      const state = usePreferencesStore.getState();
      expect(state).toMatchObject(PREFERENCES_DEFAULTS);
    });

    it('should have correct default values', () => {
      const state = usePreferencesStore.getState();
      expect(state.projectFolder).toBe('/projects');
      expect(state.unitSystem).toBe('imperial');
      expect(state.autoSaveEnabled).toBe(true);
      expect(state.autoSaveInterval).toBe(300000);
      expect(state.gridSize).toBe(24);
      expect(state.theme).toBe('light');
      expect(state.compactMode).toBe(false);
      expect(state.snapToGrid).toBe(true);
      expect(state.showRulers).toBe(false);
    });
  });

  describe('setProjectFolder', () => {
    it('updates project folder path', () => {
      usePreferencesStore.getState().setProjectFolder('/custom/path');
      expect(usePreferencesStore.getState().projectFolder).toBe('/custom/path');
    });

    it('persists project folder to localStorage', () => {
      usePreferencesStore.getState().setProjectFolder('/new/folder');
      const stored = JSON.parse(localStorage.getItem('sws.preferences') ?? '{}');
      expect(stored.state.projectFolder).toBe('/new/folder');
    });
  });

  describe('setUnitSystem', () => {
    it('updates to metric', () => {
      usePreferencesStore.getState().setUnitSystem('metric');
      expect(usePreferencesStore.getState().unitSystem).toBe('metric');
    });

    it('updates to imperial', () => {
      usePreferencesStore.getState().setUnitSystem('metric');
      usePreferencesStore.getState().setUnitSystem('imperial');
      expect(usePreferencesStore.getState().unitSystem).toBe('imperial');
    });

    it('persists unit system to localStorage', () => {
      usePreferencesStore.getState().setUnitSystem('metric');
      const stored = JSON.parse(localStorage.getItem('sws.preferences') ?? '{}');
      expect(stored.state.unitSystem).toBe('metric');
    });
  });

  describe('setAutoSaveInterval', () => {
    it('updates auto-save interval', () => {
      usePreferencesStore.getState().setAutoSaveInterval(120000);
      expect(usePreferencesStore.getState().autoSaveInterval).toBe(120000);
    });

    it('persists auto-save interval to localStorage', () => {
      usePreferencesStore.getState().setAutoSaveInterval(30000);
      const stored = JSON.parse(localStorage.getItem('sws.preferences') ?? '{}');
      expect(stored.state.autoSaveInterval).toBe(30000);
    });
  });

  describe('setAutoSaveEnabled', () => {
    it('updates auto-save enabled', () => {
      usePreferencesStore.getState().setAutoSaveEnabled(false);
      expect(usePreferencesStore.getState().autoSaveEnabled).toBe(false);
    });

    it('persists auto-save enabled to localStorage', () => {
      usePreferencesStore.getState().setAutoSaveEnabled(false);
      const stored = JSON.parse(localStorage.getItem('sws.preferences') ?? '{}');
      expect(stored.state.autoSaveEnabled).toBe(false);
    });
  });

  describe('setGridSize', () => {
    it('updates grid size', () => {
      usePreferencesStore.getState().setGridSize(48);
      expect(usePreferencesStore.getState().gridSize).toBe(48);
    });

    it('persists grid size to localStorage', () => {
      usePreferencesStore.getState().setGridSize(12);
      const stored = JSON.parse(localStorage.getItem('sws.preferences') ?? '{}');
      expect(stored.state.gridSize).toBe(12);
    });
  });

  describe('setTheme', () => {
    it('updates to dark theme', () => {
      usePreferencesStore.getState().setTheme('dark');
      expect(usePreferencesStore.getState().theme).toBe('dark');
    });

    it('updates to light theme', () => {
      usePreferencesStore.getState().setTheme('dark');
      usePreferencesStore.getState().setTheme('light');
      expect(usePreferencesStore.getState().theme).toBe('light');
    });

    it('persists theme to localStorage', () => {
      usePreferencesStore.getState().setTheme('dark');
      const stored = JSON.parse(localStorage.getItem('sws.preferences') ?? '{}');
      expect(stored.state.theme).toBe('dark');
    });
  });

  describe('setCompactMode', () => {
    it('updates compact mode', () => {
      usePreferencesStore.getState().setCompactMode(true);
      expect(usePreferencesStore.getState().compactMode).toBe(true);
    });
  });

  describe('setSnapToGrid', () => {
    it('updates snap-to-grid', () => {
      usePreferencesStore.getState().setSnapToGrid(false);
      expect(usePreferencesStore.getState().snapToGrid).toBe(false);
    });
  });

  describe('setShowRulers', () => {
    it('updates show rulers', () => {
      usePreferencesStore.getState().setShowRulers(true);
      expect(usePreferencesStore.getState().showRulers).toBe(true);
    });
  });

  describe('multiple preference updates', () => {
    it('updates individual preferences', () => {
      const actions = usePreferencesStore.getState();

      actions.setProjectFolder('/custom');
      actions.setUnitSystem('metric');
      actions.setAutoSaveEnabled(false);
      actions.setAutoSaveInterval(120000);
      actions.setGridSize(12);
      actions.setTheme('dark');
      actions.setCompactMode(true);
      actions.setSnapToGrid(false);
      actions.setShowRulers(true);

      expect(usePreferencesStore.getState()).toMatchObject({
        projectFolder: '/custom',
        unitSystem: 'metric',
        autoSaveEnabled: false,
        autoSaveInterval: 120000,
        gridSize: 12,
        theme: 'dark',
        compactMode: true,
        snapToGrid: false,
        showRulers: true,
      });
    });

    it('persists all changes to storage', () => {
      const actions = usePreferencesStore.getState();
      actions.setProjectFolder('/my/projects');
      actions.setUnitSystem('metric');
      actions.setAutoSaveEnabled(false);
      actions.setAutoSaveInterval(90000);
      actions.setGridSize(36);
      actions.setTheme('dark');
      actions.setCompactMode(true);
      actions.setSnapToGrid(false);
      actions.setShowRulers(true);

      const stored = JSON.parse(localStorage.getItem('sws.preferences') ?? '{}');
      expect(stored.state).toMatchObject({
        projectFolder: '/my/projects',
        unitSystem: 'metric',
        autoSaveEnabled: false,
        autoSaveInterval: 90000,
        gridSize: 36,
        theme: 'dark',
        compactMode: true,
        snapToGrid: false,
        showRulers: true,
      });
    });
  });

  describe('localStorage persistence', () => {
    it('uses correct storage key', () => {
      usePreferencesStore.getState().setTheme('dark');
      expect(localStorage.getItem('sws.preferences')).not.toBeNull();
    });

    it('restores state from localStorage on rehydration', () => {
      // Set up persisted state
      const persistedState = {
        state: {
          projectFolder: '/restored/path',
          unitSystem: 'metric',
          autoSaveEnabled: false,
          autoSaveInterval: 45000,
          gridSize: 16,
          theme: 'dark',
          compactMode: true,
          snapToGrid: false,
          showRulers: true,
        },
        version: 0,
      };
      localStorage.setItem('sws.preferences', JSON.stringify(persistedState));

      // Trigger rehydration
      usePreferencesStore.persist.rehydrate();

      const state = usePreferencesStore.getState();
      expect(state.projectFolder).toBe('/restored/path');
      expect(state.unitSystem).toBe('metric');
      expect(state.autoSaveEnabled).toBe(false);
      expect(state.autoSaveInterval).toBe(45000);
      expect(state.gridSize).toBe(16);
      expect(state.theme).toBe('dark');
      expect(state.compactMode).toBe(true);
      expect(state.snapToGrid).toBe(false);
      expect(state.showRulers).toBe(true);
    });

    it('validates PreferencesState structure in localStorage', () => {
      usePreferencesStore.getState().setTheme('dark');

      const stored = JSON.parse(localStorage.getItem('sws.preferences') ?? '{}');

      // Verify all required fields are present
      expect(stored.state).toHaveProperty('projectFolder');
      expect(stored.state).toHaveProperty('unitSystem');
      expect(stored.state).toHaveProperty('autoSaveEnabled');
      expect(stored.state).toHaveProperty('autoSaveInterval');
      expect(stored.state).toHaveProperty('gridSize');
      expect(stored.state).toHaveProperty('theme');
      expect(stored.state).toHaveProperty('compactMode');
      expect(stored.state).toHaveProperty('snapToGrid');
      expect(stored.state).toHaveProperty('showRulers');

      // Verify types
      expect(typeof stored.state.projectFolder).toBe('string');
      expect(typeof stored.state.autoSaveInterval).toBe('number');
      expect(typeof stored.state.gridSize).toBe('number');
      expect(typeof stored.state.autoSaveEnabled).toBe('boolean');
      expect(typeof stored.state.compactMode).toBe('boolean');
      expect(typeof stored.state.snapToGrid).toBe('boolean');
      expect(typeof stored.state.showRulers).toBe('boolean');
      expect(['imperial', 'metric']).toContain(stored.state.unitSystem);
      expect(['light', 'dark']).toContain(stored.state.theme);
    });
  });
});
