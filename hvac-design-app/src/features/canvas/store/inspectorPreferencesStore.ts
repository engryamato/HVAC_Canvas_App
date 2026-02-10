import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FloatingPosition = {
  x: number;
  y: number;
};

export type EntityType = 'room' | 'duct' | 'equipment';

export interface InspectorPreferencesState {
  isFloating: boolean;
  floatingPosition: FloatingPosition | null;
  preferences: {
    room: {
      identity: boolean;
      dimensions: boolean;
      occupancy: boolean;
      calculated: boolean;
    };
    duct: {
      identity: boolean;
      dimensions: boolean;
      airflow: boolean;
      calculated: boolean;
    };
    equipment: {
      identity: boolean;
      type: boolean;
      performance: boolean;
      dimensions: boolean;
    };
  };
}

export interface InspectorPreferencesActions {
  setFloating: (isFloating: boolean) => void;
  setFloatingPosition: (position: FloatingPosition) => void;
  resetFloatingPosition: () => void;
  toggleSection: (entityType: EntityType, sectionName: string) => void;
  setSectionExpanded: (entityType: EntityType, sectionName: string, expanded: boolean) => void;
}

export type InspectorPreferencesStore =
  & InspectorPreferencesState
  & InspectorPreferencesActions;

export const INSPECTOR_PREFERENCES_DEFAULTS: InspectorPreferencesState = {
  isFloating: false,
  floatingPosition: null,
  preferences: {
    room: {
      identity: false,
      dimensions: true,
      occupancy: true,
      calculated: false,
    },
    duct: {
      identity: false,
      dimensions: true,
      airflow: true,
      calculated: false,
    },
    equipment: {
      identity: false,
      type: false,
      performance: true,
      dimensions: true,
    },
  },
};

export const useInspectorPreferencesStore = create<InspectorPreferencesStore>()(
  persist(
    (set) => ({
      ...INSPECTOR_PREFERENCES_DEFAULTS,
      setFloating: (isFloating) => set({ isFloating }),
      setFloatingPosition: (position) => set({ floatingPosition: position }),
      resetFloatingPosition: () => set({ floatingPosition: null }),
      toggleSection: (entityType, sectionName) =>
        set((state) => {
          const key = sectionName as keyof InspectorPreferencesState['preferences'][typeof entityType];
          // Guard against invalid keys if schema changes
          if (!state.preferences[entityType] || state.preferences[entityType][key] === undefined) {
            return state;
          }
          return {
            preferences: {
              ...state.preferences,
              [entityType]: {
                ...state.preferences[entityType],
                [key]: !state.preferences[entityType][key],
              },
            },
          };
        }),
      setSectionExpanded: (entityType, sectionName, expanded) =>
        set((state) => {
          const key = sectionName as keyof InspectorPreferencesState['preferences'][typeof entityType];
          if (!state.preferences[entityType] || state.preferences[entityType][key] === undefined) {
            return state;
          }
          return {
            preferences: {
              ...state.preferences,
              [entityType]: {
                ...state.preferences[entityType],
                [key]: expanded,
              },
            },
          };
        }),
    }),
    {
      name: 'sws.inspector-preferences',
      partialize: (state) => ({
        isFloating: state.isFloating,
        floatingPosition: state.floatingPosition,
        preferences: state.preferences,
      }),
    }
  )
);

export const useSectionExpanded = (entityType: EntityType, sectionName: string) => {
  return useInspectorPreferencesStore((state) => {
      const entityPrefs = state.preferences[entityType];
      if (!entityPrefs) {
        return false;
      }
      return entityPrefs[sectionName as keyof typeof entityPrefs];
  });
};
