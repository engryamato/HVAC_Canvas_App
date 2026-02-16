import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useEntityStore } from '@/core/store/entityStore';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { ConstraintValidationService } from '@/core/services/constraintValidation';
import { adaptComponentToService } from '@/core/services/componentServiceInterop';
import type { Duct } from '@/core/schema';
import type { ValidationSeverity } from '../schema/duct.schema';
import { 
  CalculationSettings,
  CalculationTemplate,
  LaborRates,
  MarkupSettings,
  WasteFactors,
  EngineeringLimits
} from '../schema/calculation-settings.schema';

const cloneValue = <T,>(value: T): T => {
  return structuredClone(value);
};

const defaultTemplates: CalculationTemplate[] = [
  {
    id: 'template-standard-commercial',
    name: 'Standard Commercial',
    description: 'Balanced defaults for commercial retrofit projects.',
    templateVersion: '1.0.0',
    lockedDefaults: false,
    laborRates: {
      baseRate: 45,
      regionalMultiplier: 1,
      overtimeRate: 67.5,
      currency: 'USD',
    },
    markupSettings: {
      materialMarkup: 0.15,
      laborMarkup: 0.1,
      overhead: 0.12,
      profitMargin: 0.08,
      includeTaxInEstimate: true,
      taxRate: 0.08,
    },
    wasteFactors: {
      default: 0.1,
      ducts: 0.1,
      fittings: 0.05,
      equipment: 0.02,
      accessories: 0.08,
    },
    engineeringLimits: {
      maxVelocity: {
        supply: 2500,
        return: 2000,
        exhaust: 2000,
      },
      minVelocity: {
        supply: 600,
        return: 500,
        exhaust: 500,
      },
      maxPressureDrop: {
        supply: 0.1,
        return: 0.08,
        exhaust: 0.08,
      },
      frictionFactors: {
        galvanized: 0.0005,
        stainless: 0.00015,
        flexible: 0.003,
        fiberglass: 0.0003,
      },
      standardConditions: {
        temperature: 70,
        pressure: 29.92,
        altitude: 0,
      },
    },
    isDefault: true,
    isShared: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  {
    id: 'template-high-rise',
    name: 'High Rise Urban',
    description: 'Higher labor multiplier and tighter velocity cap for dense urban work.',
    templateVersion: '1.0.0',
    lockedDefaults: false,
    regionPresetId: 'urban-high-rise',
    laborRates: {
      baseRate: 52,
      regionalMultiplier: 1.2,
      overtimeRate: 78,
      currency: 'USD',
    },
    markupSettings: {
      materialMarkup: 0.18,
      laborMarkup: 0.12,
      overhead: 0.14,
      profitMargin: 0.1,
      includeTaxInEstimate: true,
      taxRate: 0.09,
    },
    wasteFactors: {
      default: 0.11,
      ducts: 0.11,
      fittings: 0.06,
      equipment: 0.03,
      accessories: 0.09,
    },
    engineeringLimits: {
      maxVelocity: {
        supply: 2200,
        return: 1800,
        exhaust: 1800,
      },
      minVelocity: {
        supply: 600,
        return: 500,
        exhaust: 500,
      },
      maxPressureDrop: {
        supply: 0.1,
        return: 0.08,
        exhaust: 0.08,
      },
      frictionFactors: {
        galvanized: 0.0005,
        stainless: 0.00015,
        flexible: 0.003,
        fiberglass: 0.0003,
      },
      standardConditions: {
        temperature: 70,
        pressure: 29.92,
        altitude: 0,
      },
    },
    isDefault: false,
    isShared: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
];

const recalculateConstraintStatuses = (calculationSettings: CalculationSettings) => {
  const entityStore = useEntityStore.getState();
  const componentLibraryStore = useComponentLibraryStoreV2.getState();

  entityStore.allIds.forEach((id) => {
    const entity = entityStore.byId[id];
    if (!entity || entity.type !== 'duct') {
      return;
    }

    const serviceId = entity.props.serviceId;
    if (!serviceId) {
      return;
    }

    const matchingComponent =
      componentLibraryStore.getComponent(serviceId) ??
      componentLibraryStore.components.find((component) => component.id === serviceId);

    const service = matchingComponent ? adaptComponentToService(matchingComponent) : undefined;

    if (!service) {
      return;
    }

    const violations = ConstraintValidationService.validateDuct(entity.props, service, {
      engineeringLimits: calculationSettings.engineeringLimits,
    });

    const normalizedViolations: Array<{
      type: string;
      severity: ValidationSeverity;
      message: string;
      suggestedFix?: string;
    }> = violations.map((violation) => ({
      type: violation.type ?? violation.ruleId,
      severity: violation.severity === 'blocker' ? 'error' : 'warning',
      message: violation.message,
      suggestedFix: violation.suggestedFix,
    }));

    entityStore.updateEntity(entity.id, {
      props: {
        ...(entity as Duct).props,
        constraintStatus: {
          isValid: normalizedViolations.length === 0,
          violations: normalizedViolations,
          lastValidated: new Date(),
        },
      },
      modifiedAt: new Date().toISOString(),
    });
  });
};

const markCustomState = (state: SettingsState) => {
  state.activeTemplateId = null;
  state.calculationSettings.templateId = undefined;
  state.calculationSettings.lastModified = new Date();
};

// Default calculation settings
const defaultCalculationSettings: CalculationSettings = {
  laborRates: {
    baseRate: 45,
    regionalMultiplier: 1.0,
    overtimeRate: 67.5,
    currency: 'USD',
  },
  markupSettings: {
    materialMarkup: 0.15,
    laborMarkup: 0.1,
    overhead: 0.12,
    profitMargin: 0.08,
    includeTaxInEstimate: true,
  },
  wasteFactors: {
    default: 0.1,
    ducts: 0.1,
    fittings: 0.05,
    equipment: 0.02,
    accessories: 0.08,
  },
  engineeringLimits: {
    maxVelocity: {
      supply: 2500,
      return: 2000,
      exhaust: 2000,
    },
    minVelocity: {
      supply: 600,
      return: 500,
      exhaust: 500,
    },
    maxPressureDrop: {
      supply: 0.1,
      return: 0.08,
      exhaust: 0.08,
    },
    frictionFactors: {
      galvanized: 0.0005,
      stainless: 0.00015,
      flexible: 0.003,
      fiberglass: 0.0003,
    },
    standardConditions: {
      temperature: 70,
      pressure: 29.92,
      altitude: 0,
    },
  },
  templateVersion: '1.0.0',
  lockedDefaults: false,
};

interface SettingsState {
    // App settings
    autoOpenLastProject: boolean;
    setAutoOpenLastProject: (value: boolean) => void;
    
    // Calculation settings
    calculationSettings: CalculationSettings;
    templates: CalculationTemplate[];
    activeTemplateId: string | null;
    
    // Calculation settings actions
    updateLaborRates: (rates: Partial<LaborRates>) => void;
    updateMarkupSettings: (markup: Partial<MarkupSettings>) => void;
    updateWasteFactors: (waste: Partial<WasteFactors>) => void;
    updateEngineeringLimits: (limits: Partial<EngineeringLimits>) => void;
    updateProjectInfo: (info: { projectName?: string; location?: string; estimator?: string }) => void;
    updateTemplateMetadata: (metadata: {
      templateVersion?: string;
      lockedDefaults?: boolean;
      regionPresetId?: string;
    }) => void;
    
    // Template management
    addTemplate: (template: CalculationTemplate) => void;
    applyTemplate: (templateId: string) => void;
    saveAsTemplate: (name: string, description?: string) => CalculationTemplate;
    setCalculationSettings: (settings: CalculationSettings) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        immer((set, get) => ({
            // App settings
            autoOpenLastProject: false,
            setAutoOpenLastProject: (value) => set({ autoOpenLastProject: value }),
            
            // Calculation settings
            calculationSettings: defaultCalculationSettings,
            templates: defaultTemplates,
            activeTemplateId: null,
            
            // Calculation settings actions
            updateLaborRates: (rates) => set((state) => {
              state.calculationSettings.laborRates = { ...state.calculationSettings.laborRates, ...rates };
              markCustomState(state);
            }),
            
            updateMarkupSettings: (markup) => set((state) => {
              state.calculationSettings.markupSettings = { ...state.calculationSettings.markupSettings, ...markup };
              markCustomState(state);
            }),
            
            updateWasteFactors: (waste) => set((state) => {
              state.calculationSettings.wasteFactors = { ...state.calculationSettings.wasteFactors, ...waste };
              markCustomState(state);
            }),
            
            updateEngineeringLimits: (limits) => set((state) => {
              state.calculationSettings.engineeringLimits = { ...state.calculationSettings.engineeringLimits, ...limits };
              markCustomState(state);
            }),
            
            updateProjectInfo: (info) => set((state) => {
              if (info.projectName !== undefined) {state.calculationSettings.projectName = info.projectName;}
              if (info.location !== undefined) {state.calculationSettings.location = info.location;}
              if (info.estimator !== undefined) {state.calculationSettings.estimator = info.estimator;}
              state.calculationSettings.lastModified = new Date();
            }),

            updateTemplateMetadata: (metadata) => set((state) => {
              if (metadata.templateVersion !== undefined) {
                state.calculationSettings.templateVersion = metadata.templateVersion;
              }
              if (metadata.lockedDefaults !== undefined) {
                state.calculationSettings.lockedDefaults = metadata.lockedDefaults;
              }
              if (metadata.regionPresetId !== undefined) {
                state.calculationSettings.regionPresetId = metadata.regionPresetId;
              }
              state.calculationSettings.lastModified = new Date();
            }),
            
            // Template management
            addTemplate: (template) => set((state) => {
              const existingTemplateIndex = state.templates.findIndex((item) => item.id === template.id);
              if (existingTemplateIndex === -1) {
                state.templates.push(template);
              } else {
                state.templates[existingTemplateIndex] = template;
              }
            }),
            
            applyTemplate: (templateId) => set((state) => {
              const template = state.templates.find(t => t.id === templateId);
              if (template) {
                state.calculationSettings.laborRates = cloneValue(template.laborRates);
                state.calculationSettings.markupSettings = cloneValue(template.markupSettings);
                state.calculationSettings.wasteFactors = cloneValue(template.wasteFactors);
                state.calculationSettings.engineeringLimits = cloneValue(template.engineeringLimits);
                state.calculationSettings.templateId = templateId;
                state.calculationSettings.templateVersion = template.templateVersion ?? '1.0.0';
                state.calculationSettings.lockedDefaults = template.lockedDefaults ?? false;
                state.calculationSettings.regionPresetId = template.regionPresetId;
                state.calculationSettings.lastModified = new Date();
                state.activeTemplateId = templateId;
              }
            }),
            
            saveAsTemplate: (name, description) => {
              const { calculationSettings } = get();
              const template: CalculationTemplate = {
                id: crypto.randomUUID(),
                name,
                description,
                templateVersion: calculationSettings.templateVersion ?? '1.0.0',
                lockedDefaults: calculationSettings.lockedDefaults ?? false,
                regionPresetId: calculationSettings.regionPresetId,
                laborRates: cloneValue(calculationSettings.laborRates),
                markupSettings: cloneValue(calculationSettings.markupSettings),
                wasteFactors: cloneValue(calculationSettings.wasteFactors),
                engineeringLimits: cloneValue(calculationSettings.engineeringLimits),
                isDefault: false,
                isShared: false,
                createdAt: new Date(),
              };
              set((state) => {
                state.templates.push(template);
                state.activeTemplateId = template.id;
                state.calculationSettings.templateId = template.id;
                state.calculationSettings.lastModified = new Date();
              });
              return template;
            },

            setCalculationSettings: (settings) => set((state) => {
              state.calculationSettings = settings;
              if (settings.templateId) {
                state.activeTemplateId = settings.templateId;
              }
            }),
        })),
        {
            name: 'sws.settings',
            onRehydrateStorage: () => (state) => {
              if (!state) {
                return;
              }

              if (state.templates.length === 0) {
                state.templates = defaultTemplates;
              }
            },
        }
    )
);

useSettingsStore.subscribe((state, previousState) => {
  if (state.calculationSettings === previousState.calculationSettings) {
    return;
  }

  recalculateConstraintStatuses(state.calculationSettings);
});
