import { describe, it, beforeEach, expect } from 'vitest';
import { usePreferencesStore, PREFERENCES_DEFAULTS } from '../preferencesStore';

describe('PreferencesStore', () => {
  beforeEach(() => {
    usePreferencesStore.persist?.clearStorage?.();
    usePreferencesStore.setState(PREFERENCES_DEFAULTS);
  });

  it('initializes with defaults', () => {
    const state = usePreferencesStore.getState();
    expect(state).toMatchObject(PREFERENCES_DEFAULTS);
  });

  it('updates individual preferences', () => {
    const actions = usePreferencesStore.getState();

    actions.setProjectFolder('/custom');
    actions.setUnitSystem('metric');
    actions.setAutoSaveInterval(120000);
    actions.setGridSize(12);
    actions.setTheme('dark');

    expect(usePreferencesStore.getState()).toMatchObject({
      projectFolder: '/custom',
      unitSystem: 'metric',
      autoSaveInterval: 120000,
      gridSize: 12,
      theme: 'dark',
    });
  });

  it('persists changes to storage', () => {
    usePreferencesStore.getState().setTheme('dark');

    const stored = JSON.parse(localStorage.getItem('sws.preferences') ?? '{}');
    expect(stored.state.theme).toBe('dark');
  });
});
