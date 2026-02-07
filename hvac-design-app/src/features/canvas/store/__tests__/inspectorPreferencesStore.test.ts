import { describe, it, expect, beforeEach } from 'vitest';

import {
  INSPECTOR_PREFERENCES_DEFAULTS,
  useInspectorPreferencesStore,
} from '../inspectorPreferencesStore';

describe('inspectorPreferencesStore', () => {
  beforeEach(() => {
    useInspectorPreferencesStore.persist?.clearStorage?.();
    useInspectorPreferencesStore.setState(INSPECTOR_PREFERENCES_DEFAULTS);
  });

  it('toggles floating state', () => {
    useInspectorPreferencesStore.getState().setFloating(true);
    expect(useInspectorPreferencesStore.getState().isFloating).toBe(true);
  });

  it('updates floating position', () => {
    useInspectorPreferencesStore.getState().setFloatingPosition({ x: 12, y: 34 });
    expect(useInspectorPreferencesStore.getState().floatingPosition).toEqual({ x: 12, y: 34 });
  });

  it('resets floating position', () => {
    useInspectorPreferencesStore.getState().setFloatingPosition({ x: 12, y: 34 });
    useInspectorPreferencesStore.getState().resetFloatingPosition();
    expect(useInspectorPreferencesStore.getState().floatingPosition).toBeNull();
  });

  it('persists floating state to localStorage', () => {
    useInspectorPreferencesStore.getState().setFloating(true);
    useInspectorPreferencesStore.getState().setFloatingPosition({ x: 56, y: 78 });

    const stored = JSON.parse(localStorage.getItem('sws.inspector-preferences') ?? '{}');
    expect(stored.state.isFloating).toBe(true);
    expect(stored.state.floatingPosition).toEqual({ x: 56, y: 78 });
  });
});

