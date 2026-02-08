import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface InspectorPreferencesState {
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
  toggleSection: (entityType: 'room' | 'duct' | 'equipment', sectionName: string) => void;
  setSectionExpanded: (entityType: 'room' | 'duct' | 'equipment', sectionName: string, expanded: boolean) => void;
  inspectorWidth: number;
  setInspectorWidth: (width: number) => void;
  resetInspectorWidth: () => void;
}

export type EntityType = 'room' | 'duct' | 'equipment';

export const useInspectorPreferencesStore = create<InspectorPreferencesState>()(
  persist(
    (set) => ({
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
          type: false, // merged into identity in some views, but keeping in schema for flexibility
          performance: true,
          dimensions: true,
        },
      },
      inspectorWidth: 320,
      toggleSection: (entityType, sectionName) =>
        set((state) => {
          const key = sectionName as keyof InspectorPreferencesState['preferences'][typeof entityType];
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
      setInspectorWidth: (width) => set({ inspectorWidth: width }),
      resetInspectorWidth: () => set({ inspectorWidth: 320 }),
    }),
    {
      name: 'sws.inspector-preferences',
    }
  )
);

export const useSectionExpanded = (entityType: EntityType, sectionName: string) => {
  return useInspectorPreferencesStore((state) => 
    state.preferences[entityType][sectionName as keyof InspectorPreferencesState['preferences'][typeof entityType]]
  );
};
