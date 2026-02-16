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

  it('saves a template, persists it, and reapplies it in-session', () => {
    const store = useSettingsStore.getState();

    store.updateLaborRates({ baseRate: 72 });
    const savedTemplate = useSettingsStore.getState().saveAsTemplate('Night Shift Profile', 'Unit test template');

    // Change away from saved state, then reapply
    useSettingsStore.getState().updateLaborRates({ baseRate: 39 });
    useSettingsStore.getState().applyTemplate(savedTemplate.id);

    const next = useSettingsStore.getState();
    expect(next.activeTemplateId).toBe(savedTemplate.id);
    expect(next.calculationSettings.templateId).toBe(savedTemplate.id);
    expect(next.calculationSettings.laborRates.baseRate).toBe(72);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    const persistedTemplates = persisted?.state?.templates ?? [];
    expect(persistedTemplates.some((template: { id: string }) => template.id === savedTemplate.id)).toBe(true);
  });

  it('marks settings as custom when editing after template application', () => {
    const defaultTemplate = useSettingsStore.getState().templates[0];
    expect(defaultTemplate).toBeDefined();
    if (!defaultTemplate) {
      throw new Error('Expected default calculation template to be available');
    }

    useSettingsStore.getState().applyTemplate(defaultTemplate.id);
    useSettingsStore.getState().updateMarkupSettings({ materialMarkup: 0.31 });

    const next = useSettingsStore.getState();
    expect(next.activeTemplateId).toBeNull();
    expect(next.calculationSettings.templateId).toBeUndefined();
    expect(next.calculationSettings.markupSettings.materialMarkup).toBe(0.31);
  });
});
