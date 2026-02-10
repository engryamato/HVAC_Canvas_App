/**
 * Service Store
 * 
 * Manages the state of HVAC Services (specifications) and the active service context.
 * Follows the pattern of entityStore using Zustand and Immer.
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { 
  Service, 
  ServiceTemplate,
  DEFAULT_DIMENSIONAL_CONSTRAINTS
} from '../schema/service.schema';

// -- Baseline Templates --

const LOW_PRESSURE_SUPPLY: ServiceTemplate = {
  id: 'tmpl_low_pressure_supply',
  name: 'Low Pressure Supply Air',
  isTemplate: true,
  systemType: 'supply',
  material: 'galvanized',
  pressureClass: 'low',
  dimensionalConstraints: DEFAULT_DIMENSIONAL_CONSTRAINTS,
  fittingRules: [
    { angle: 90, fittingType: 'elbow_90', preference: 1 },
    { angle: 45, fittingType: 'elbow_45', preference: 1 }
  ],
  manufacturerPreferences: ['Generic'],
  source: 'baseline',
  color: '#3b82f6' // Blue
};

const MEDIUM_PRESSURE_SUPPLY: ServiceTemplate = {
  id: 'tmpl_medium_pressure_supply',
  name: 'Medium Pressure Supply Air',
  isTemplate: true,
  systemType: 'supply',
  material: 'galvanized',
  pressureClass: 'medium',
  dimensionalConstraints: { ...DEFAULT_DIMENSIONAL_CONSTRAINTS, maxDiameter: 48 },
  fittingRules: [
    { angle: 90, fittingType: 'elbow_90', preference: 1 },
    { angle: 45, fittingType: 'elbow_45', preference: 1 }
  ],
  manufacturerPreferences: ['Generic'],
  source: 'baseline',
  color: '#2563eb' // Darker Blue
};

const LOW_PRESSURE_RETURN: ServiceTemplate = {
  id: 'tmpl_low_pressure_return',
  name: 'Low Pressure Return Air',
  isTemplate: true,
  systemType: 'return',
  material: 'galvanized',
  pressureClass: 'low',
  dimensionalConstraints: DEFAULT_DIMENSIONAL_CONSTRAINTS,
  fittingRules: [
    { angle: 90, fittingType: 'elbow_90', preference: 1 },
    { angle: 45, fittingType: 'elbow_45', preference: 1 }
  ],
  manufacturerPreferences: ['Generic'],
  source: 'baseline',
  color: '#ec4899' // Pink/Magenta
};

const EXHAUST_AIR: ServiceTemplate = {
  id: 'tmpl_exhaust_air',
  name: 'General Exhaust Air',
  isTemplate: true,
  systemType: 'exhaust',
  material: 'aluminum',
  pressureClass: 'low',
  dimensionalConstraints: DEFAULT_DIMENSIONAL_CONSTRAINTS,
  fittingRules: [
    { angle: 90, fittingType: 'elbow_90', preference: 1 }
  ],
  manufacturerPreferences: ['Generic'],
  source: 'baseline',
  color: '#10b981' // Green
};

const INITIAL_TEMPLATES = [
  LOW_PRESSURE_SUPPLY,
  MEDIUM_PRESSURE_SUPPLY,
  LOW_PRESSURE_RETURN,
  EXHAUST_AIR
];

// -- Store Interface --

interface ServiceState {
  // Services keyed by ID
  services: Record<string, Service>;
  // Baseline templates (read-only)
  baselineTemplates: ServiceTemplate[];
  // Currently active service ID (context for drawing)
  activeServiceId: string | null;
}

interface ServiceActions {
  // Action to add a new custom service
  addService: (service: Service) => void;
  // Action to update an existing custom service
  updateService: (id: string, updates: Partial<Service>) => void;
  // Action to remove a custom service
  removeService: (id: string) => void;
  // Set the active service
  setActiveService: (id: string | null) => void;
  // Clone a template or existing service to create a new custom service
  cloneService: (sourceId: string, newName: string) => string;
  // Load templates (usually on init)
  loadBaselineTemplates: (templates: ServiceTemplate[]) => void;
  // Hydrate store from project file
  hydrate: (services: Service[], activeId: string | null) => void;
}

export const useServiceStore = create<ServiceState & ServiceActions>()(
  immer((set, get) => ({
    services: {},
    baselineTemplates: INITIAL_TEMPLATES,
    activeServiceId: null,

    addService: (service) =>
      set((state) => {
        state.services[service.id] = service;
      }),

    updateService: (id, updates) =>
      set((state) => {
        const service = state.services[id];
        if (service && service.source === 'custom') {
          // Verify with schema partially if needed, for now straight update
          Object.assign(service, updates);
          service.updatedAt = new Date();
        }
      }),

    removeService: (id) =>
      set((state) => {
        if (state.services[id]?.source === 'custom') {
          delete state.services[id];
          if (state.activeServiceId === id) {
            state.activeServiceId = null;
          }
        }
      }),

    setActiveService: (id) =>
      set((state) => {
        // ID can be a custom service ID or a template ID
        state.activeServiceId = id;
      }),

    cloneService: (sourceId, newName) => {
      const state = get();
      let source: Service | ServiceTemplate | undefined = state.services[sourceId];
      
      // If not in custom services, check templates
      if (!source) {
        source = state.baselineTemplates.find(t => t.id === sourceId);
      }

      if (!source) {
        throw new Error(`Service source ${sourceId} not found`);
      }

      const newId = uuidv4();
      const { isTemplate: _isTemplate, ...sourceData } = source as ServiceTemplate & { isTemplate?: true };
      const newService: Service = {
        ...sourceData,
        id: newId,
        name: newName,
        source: 'custom',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set((state) => {
        state.services[newId] = newService;
        state.activeServiceId = newId;
      });

      return newId;
    },

    loadBaselineTemplates: (templates) =>
      set((state) => {
        state.baselineTemplates = templates;
      }),

    hydrate: (services, activeId) =>
      set((state) => {
        state.services = services.reduce((acc, s) => {
          acc[s.id] = s;
          return acc;
        }, {} as Record<string, Service>);
        state.activeServiceId = activeId;
      }),
  }))
);

// -- Selectors --

export const useActiveService = () => {
  const state = useServiceStore();
  if (!state.activeServiceId) return null;
  return state.services[state.activeServiceId] || 
         state.baselineTemplates.find(t => t.id === state.activeServiceId) || 
         null;
};

export const useAllServices = () => {
  const state = useServiceStore();
  return [
    ...state.baselineTemplates,
    ...Object.values(state.services)
  ];
};

export const useServicesBySystemType = (systemType: string) => {
  const all = useAllServices();
  return all.filter(s => s.systemType === systemType);
};
