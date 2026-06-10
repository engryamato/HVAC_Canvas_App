import { beforeEach, describe, expect, it } from 'vitest';

// Integration: the real settings store registers the projectMode provider and
// persists the field. WS8 flag is ON by default in the test env.
import { useSettingsStore } from '@/core/store/settingsStore';
import {
  areCostColumnsDefaultVisible,
  isAutoFittingProjectSettingEnabled,
  getInitialSizePostureSource,
  getProjectMode,
} from '../projectMode';

describe('projectMode ⇄ settings store (WS8)', () => {
  beforeEach(() => {
    // Restore the documented new-project default between tests.
    useSettingsStore.getState().updateProjectMode('estimation');
  });

  it('new projects default to estimation', () => {
    expect(useSettingsStore.getState().calculationSettings.projectMode).toBe('estimation');
    expect(getProjectMode()).toBe('estimation');
  });

  it('switching the mode persists it and is observed through the provider', () => {
    useSettingsStore.getState().updateProjectMode('design');

    expect(useSettingsStore.getState().calculationSettings.projectMode).toBe('design');
    expect(getProjectMode()).toBe('design');
  });

  it('the mode flips the documented WS5/WS7 defaults', () => {
    useSettingsStore.getState().updateProjectMode('estimation');
    expect(getInitialSizePostureSource()).toBe('default');
    expect(areCostColumnsDefaultVisible()).toBe(true);

    useSettingsStore.getState().updateProjectMode('design');
    expect(getInitialSizePostureSource()).toBe('computed');
    expect(areCostColumnsDefaultVisible()).toBe(false);
  });

  it('new projects default auto-fitting on independent of mode', () => {
    expect(useSettingsStore.getState().calculationSettings.autoFittingEnabled).toBe(true);
    expect(isAutoFittingProjectSettingEnabled()).toBe(true);

    useSettingsStore.getState().updateProjectMode('design');
    expect(isAutoFittingProjectSettingEnabled()).toBe(true);

    useSettingsStore.getState().updateProjectMode('estimation');
    expect(isAutoFittingProjectSettingEnabled()).toBe(true);
  });

  it('persists a project-level auto-fitting override', () => {
    useSettingsStore.getState().updateAutoFittingEnabled(false);

    expect(useSettingsStore.getState().calculationSettings.autoFittingEnabled).toBe(false);
    expect(isAutoFittingProjectSettingEnabled()).toBe(false);
  });

  it('a settings object without projectMode reads as estimation (greenfield)', () => {
    const settings = useSettingsStore.getState().calculationSettings;
    // Simulate a pre-WS8 persisted project: strip the field.
    const { projectMode: _omit, ...legacy } = settings;
    useSettingsStore.getState().setCalculationSettings(legacy as typeof settings);

    expect(getProjectMode()).toBe('estimation');
  });

  it('a legacy settings object without autoFittingEnabled reads as enabled', () => {
    const settings = useSettingsStore.getState().calculationSettings;
    const { autoFittingEnabled: _omit, ...legacy } = settings;
    useSettingsStore.getState().setCalculationSettings(legacy as typeof settings);

    expect(isAutoFittingProjectSettingEnabled()).toBe(true);
  });
});
