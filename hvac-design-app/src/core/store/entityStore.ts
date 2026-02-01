import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Entity, EntityType } from '@/core/schema';

/**
 * Normalized entity state structure
 * - byId: O(1) lookup by entity ID
 * - allIds: Ordered list of all entity IDs
 */
interface EntityState {
  byId: Record<string, Entity>;
  allIds: string[];
}

interface EntityActions {
  // CRUD operations
  addEntity: (entity: Entity) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  removeEntity: (id: string) => void;
  // Batch operations
  addEntities: (entities: Entity[]) => void;
  removeEntities: (ids: string[]) => void;
  clearAllEntities: () => void;
  // Hydration (for loading from file)
  hydrate: (state: EntityState) => void;
}

type EntityStore = EntityState & EntityActions;

const initialState: EntityState = {
  byId: {},
  allIds: [],
};

export const useEntityStore = create<EntityStore>()(
  immer((set) => ({
    ...initialState,

    addEntity: (entity) =>
      set((state) => {
        console.log('[EntityStore] addEntity', entity.id, entity.type);
        if (!state.byId[entity.id]) {
          state.byId[entity.id] = entity;
          state.allIds.push(entity.id);
        } else {
            console.warn('[EntityStore] addEntity: Entity already exists', entity.id);
        }
      }),

    updateEntity: (id, updates) =>
      set((state) => {
        if (state.byId[id]) {
          state.byId[id] = { ...state.byId[id], ...updates } as Entity;
        }
      }),

    removeEntity: (id) =>
      set((state) => {
        console.log('[EntityStore] removeEntity', id);
        delete state.byId[id];
        state.allIds = state.allIds.filter((entityId) => entityId !== id);
      }),

    addEntities: (entities) =>
      set((state) => {
        console.log('[EntityStore] addEntities', entities.length);
        entities.forEach((entity) => {
          if (!state.byId[entity.id]) {
            state.byId[entity.id] = entity;
            state.allIds.push(entity.id);
          }
        });
      }),

    removeEntities: (ids) =>
      set((state) => {
        console.log('[EntityStore] removeEntities', ids.length);
        ids.forEach((id) => delete state.byId[id]);
        state.allIds = state.allIds.filter((id) => !ids.includes(id));
      }),

    clearAllEntities: () => set((state) => {
        console.log('[EntityStore] clearAllEntities');
        Object.assign(state, initialState);
    }),

    hydrate: (newState) =>
      set((state) => {
        console.log('[EntityStore] hydrate from newState', newState.allIds.length);
        state.byId = newState.byId;
        state.allIds = newState.allIds;
      }),
  }))
);

// Standalone selectors (for use outside React components)
export const selectEntity = (id: string) => useEntityStore.getState().byId[id];

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

export const selectAllEntities = () => {
  const { byId, allIds } = useEntityStore.getState();
  return allIds.map((id) => byId[id]).filter(isDefined);
};

export const selectEntitiesByType = (type: EntityType) => {
  const { byId, allIds } = useEntityStore.getState();
  return allIds
    .map((id) => byId[id])
    .filter((entity): entity is Entity => entity !== undefined && entity.type === type);
};

export const selectEntityCount = () => useEntityStore.getState().allIds.length;

// Hook selectors (for React components with reactivity)
export const useEntity = (id: string) => useEntityStore((state) => state.byId[id]);

export const useAllEntities = () =>
  useEntityStore((state) => state.allIds.map((id) => state.byId[id]));

export const useEntitiesByType = (type: EntityType) =>
  useEntityStore((state) =>
    state.allIds.map((id) => state.byId[id]).filter((entity) => entity?.type === type)
  );

export const useEntityCount = () => useEntityStore((state) => state.allIds.length);

// Actions hook (per naming convention)
export const useEntityActions = () =>
  useEntityStore((state) => ({
    addEntity: state.addEntity,
    updateEntity: state.updateEntity,
    removeEntity: state.removeEntity,
    addEntities: state.addEntities,
    removeEntities: state.removeEntities,
    clearAllEntities: state.clearAllEntities,
    hydrate: state.hydrate,
  }));

