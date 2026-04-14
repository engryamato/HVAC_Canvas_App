import { beforeEach, describe, expect, it } from 'vitest';
import { useCalculationSettingsStore } from '../calculationSettingsStore';
import { useSettingsStore } from '../settingsStore';

const STORAGE_KEY = 'sws.settings';

describe('calculationSettingsStore compatibility shim', () => {
  beforeEach(() => {
    useSettingsStore.persist?.clearStorage?.();
    localStorage.removeItem(STORAGE_KEY);

    const defaults = useSettingsStore.getState().templates;
    useSettingsStore.setState((state) => ({
      ...state,
      calculationSettings: {
        ...state.calculationSettings,
        laborRates: {
          ...state.calculationSettings.laborRates,
          baseRate: 45,
        },
        templateId: undefined,
      },
      templates: defaults,
      activeTemplateId: null,
    }));

    useCalculationSettingsStore.getState().reset();
  });

  it('updates unified settings store when compatibility store updates settings', () => {
    useCalculationSettingsStore.getState().updateSettings({
      laborRates: {
        ...useSettingsStore.getState().calculationSettings.laborRates,
        baseRate: 88,
      },
    });

    expect(useSettingsStore.getState().calculationSettings.laborRates.baseRate).toBe(88);
    expect(useCalculationSettingsStore.getState().currentSettings?.laborRates.baseRate).toBe(88);
  });

  it('creates template via compatibility API and keeps template lists in sync', () => {
    const created = useCalculationSettingsStore.getState().createCustomTemplate('Shim Template');

    expect(created.id).toBeTruthy();
    expect(useSettingsStore.getState().templates.some((template) => template.id === created.id)).toBe(true);
    expect(
      useCalculationSettingsStore
        .getState()
        .templates.some((template) => template.id === created.id)
    ).toBe(true);
  });
});
