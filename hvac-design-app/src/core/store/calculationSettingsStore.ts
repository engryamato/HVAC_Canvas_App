import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { 
  CalculationSettings, 
  CalculationTemplate,
  COMMERCIAL_STANDARD_TEMPLATE,
  RESIDENTIAL_BUDGET_TEMPLATE,
  INDUSTRIAL_HEAVY_TEMPLATE,
} from '../schema/calculation-settings.schema';

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

const defaultTemplates = [
  COMMERCIAL_STANDARD_TEMPLATE,
  RESIDENTIAL_BUDGET_TEMPLATE,
  INDUSTRIAL_HEAVY_TEMPLATE,
];

const initialState = {
  currentSettings: null,
  templates: [...defaultTemplates],
  isLoading: false,
  error: null,
};

export const useCalculationSettingsStore = create<CalculationSettingsState>()(
  immer((set, get) => ({
    ...initialState,

    loadSettings: (settings) =>
      set((state) => {
        state.currentSettings = settings;
      }),

    updateSettings: (updates) =>
      set((state) => {
        if (state.currentSettings) {
          Object.assign(state.currentSettings, updates, { lastModified: new Date() });
        }
      }),

    applyTemplate: (templateId) =>
      set((state) => {
        const template = state.templates.find((t) => t.id === templateId);
        if (template && state.currentSettings) {
          state.currentSettings = {
            ...state.currentSettings,
            laborRates: template.laborRates,
            markupSettings: template.markupSettings,
            wasteFactors: template.wasteFactors,
            engineeringLimits: template.engineeringLimits,
            templateId: template.id,
            lastModified: new Date(),
          };
        }
      }),

    createCustomTemplate: (name, baseTemplateId) => {
      const baseTemplate = baseTemplateId 
        ? get().templates.find((t) => t.id === baseTemplateId)
        : undefined;
      
      const newTemplate: CalculationTemplate = {
        id: `custom-${Date.now()}`,
        name,
        description: `Custom template based on ${baseTemplate?.name || 'current settings'}`,
        templateVersion: '1.0.0',
        lockedDefaults: false,
        laborRates: baseTemplate?.laborRates || { ...COMMERCIAL_STANDARD_TEMPLATE.laborRates },
        markupSettings: baseTemplate?.markupSettings || { ...COMMERCIAL_STANDARD_TEMPLATE.markupSettings },
        wasteFactors: baseTemplate?.wasteFactors || { ...COMMERCIAL_STANDARD_TEMPLATE.wasteFactors },
        engineeringLimits: baseTemplate?.engineeringLimits || { ...COMMERCIAL_STANDARD_TEMPLATE.engineeringLimits },
        isDefault: false,
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set((state) => {
        state.templates.push(newTemplate);
      });

      return newTemplate;
    },

    saveAsTemplate: (name) => {
      const { currentSettings } = get();
      if (!currentSettings) return null;

      const newTemplate: CalculationTemplate = {
        id: `custom-${Date.now()}`,
        name,
        description: `Custom template from project settings`,
        templateVersion: '1.0.0',
        lockedDefaults: false,
        laborRates: currentSettings.laborRates,
        markupSettings: currentSettings.markupSettings,
        wasteFactors: currentSettings.wasteFactors,
        engineeringLimits: currentSettings.engineeringLimits,
        isDefault: false,
        isShared: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set((state) => {
        state.templates.push(newTemplate);
      });

      return newTemplate;
    },

    getTemplateById: (id) => {
      return get().templates.find((t) => t.id === id);
    },

    getDefaultTemplates: () => {
      return get().templates.filter((t) => 
        ['commercial-standard', 'residential-budget', 'industrial-heavy'].includes(t.id)
      );
    },

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    reset: () => set(initialState),
  }))
);
