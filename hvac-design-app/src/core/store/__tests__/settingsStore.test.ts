import { beforeEach, describe, expect, it } from 'vitest';
import { useSettingsStore } from '../settingsStore';

const STORAGE_KEY = 'sws.settings';

describe('settingsStore - Milestone 7', () => {
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
  });

  it('updates labor rates and persists current calculation settings', () => {
    useSettingsStore.getState().updateLaborRates({ baseRate: 72 });

    const next = useSettingsStore.getState();
    expect(next.activeTemplateId).toBeNull();
    expect(next.calculationSettings.templateId).toBeUndefined();
    expect(next.calculationSettings.laborRates.baseRate).toBe(72);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(persisted?.state?.calculationSettings?.laborRates?.baseRate).toBe(72);
  });

  it('keeps shipped calculation templates available for the settings UI', () => {
    const defaultTemplate = useSettingsStore.getState().templates[0];
    expect(defaultTemplate).toBeDefined();
    if (!defaultTemplate) {
      throw new Error('Expected default calculation template to be available');
    }

    useSettingsStore.getState().updateMarkupSettings({ materialMarkup: 0.31 });

    const next = useSettingsStore.getState();
    expect(next.activeTemplateId).toBeNull();
    expect(next.calculationSettings.templateId).toBeUndefined();
    expect(next.calculationSettings.markupSettings.materialMarkup).toBe(0.31);
    expect(next.templates.some((template) => template.id === defaultTemplate.id)).toBe(true);
  });
});
