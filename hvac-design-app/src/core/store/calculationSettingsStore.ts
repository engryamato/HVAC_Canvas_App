import { create } from 'zustand';
import type { CalculationSettings, CalculationTemplate } from '../schema/calculation-settings.schema';
import { useSettingsStore } from './settingsStore';

interface CalculationSettingsState {
  currentSettings: CalculationSettings | null;
  templates: CalculationTemplate[];
  isLoading: boolean;
  error: string | null;

  loadSettings: (settings: CalculationSettings) => void;
  updateSettings: (updates: Partial<CalculationSettings>) => void;
  applyTemplate: (templateId: string) => void;
  createCustomTemplate: (name: string, baseTemplateId?: string) => CalculationTemplate;
  saveAsTemplate: (name: string) => CalculationTemplate | null;

  getTemplateById: (id: string) => CalculationTemplate | undefined;
  getDefaultTemplates: () => CalculationTemplate[];

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const getSettingsSnapshot = () => {
  const state = useSettingsStore.getState();
  return {
    currentSettings: state.calculationSettings,
    templates: state.templates,
  };
};

export const useCalculationSettingsStore = create<CalculationSettingsState>((set, get) => ({
  ...getSettingsSnapshot(),
  isLoading: false,
  error: null,

  loadSettings: (settings) => {
    useSettingsStore.getState().setCalculationSettings(settings);
  },

  updateSettings: (updates) => {
    const settingsStore = useSettingsStore.getState();
    settingsStore.setCalculationSettings({
      ...settingsStore.calculationSettings,
      ...updates,
      lastModified: new Date(),
    });
  },

  applyTemplate: (templateId) => {
    useSettingsStore.getState().applyTemplate(templateId);
  },

  createCustomTemplate: (name, baseTemplateId) => {
    const settingsStore = useSettingsStore.getState();
    if (baseTemplateId) {
      settingsStore.applyTemplate(baseTemplateId);
    }

    return settingsStore.saveAsTemplate(
      name,
      `Custom template based on ${baseTemplateId ?? 'current settings'}`
    );
  },

  saveAsTemplate: (name) => {
    return useSettingsStore.getState().saveAsTemplate(name);
  },

  getTemplateById: (id) => {
    return get().templates.find((template) => template.id === id);
  },

  getDefaultTemplates: () => {
    return get().templates.filter((template) =>
      ['commercial-standard', 'residential-budget', 'industrial-heavy'].includes(template.id)
    );
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  reset: () => {
    set({
      ...getSettingsSnapshot(),
      isLoading: false,
      error: null,
    });
  },
}));

useSettingsStore.subscribe((state) => {
  useCalculationSettingsStore.setState({
    currentSettings: state.calculationSettings,
    templates: state.templates,
  });
});
