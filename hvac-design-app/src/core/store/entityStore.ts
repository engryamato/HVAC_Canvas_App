import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Entity, EntityType } from '@/core/schema';
import { ConnectionGraphBuilder } from '@/core/services/graph/ConnectionGraphBuilder';
import { FlowPropagationService } from '@/core/services/graph/FlowPropagationService';

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

/**
 * Helper to recalculate flows based on current state
 */
const recalculateFlows = (state: EntityState) => {
  try {
    const entities = Object.values(state.byId);
    const graph = ConnectionGraphBuilder.fromEntities(entities);
    const flows = FlowPropagationService.calculateFlows(graph, state.byId);

    for (const [id, flow] of flows) {
      const entity = state.byId[id];
      if (entity && entity.type === 'duct' && entity.props.airflow !== flow) {
        entity.props.airflow = flow;
      }
    }
  } catch (error) {
    console.error('[EntityStore] Failed to recalculate flows:', error);
  }
};

export const useEntityStore = create<EntityStore>()(
  immer((set) => ({
    ...initialState,

    addEntity: (entity) =>
      set((state) => {

        if (!state.byId[entity.id]) {
          state.byId[entity.id] = entity;
          state.allIds.push(entity.id);
          recalculateFlows(state);
        } else {
            console.warn('[EntityStore] addEntity: Entity already exists', entity.id);
        }
      }),

    updateEntity: (id, updates) =>
      set((state) => {
        if (state.byId[id]) {
          state.byId[id] = { ...state.byId[id], ...updates } as Entity;
          recalculateFlows(state);
        }
      }),

    removeEntity: (id) =>
      set((state) => {

        delete state.byId[id];
        state.allIds = state.allIds.filter((entityId) => entityId !== id);
        recalculateFlows(state);
      }),

    addEntities: (entities) =>
      set((state) => {

        entities.forEach((entity) => {
          if (!state.byId[entity.id]) {
            state.byId[entity.id] = entity;
            state.allIds.push(entity.id);
          }
        });
        recalculateFlows(state);
      }),

    removeEntities: (ids) =>
      set((state) => {

        ids.forEach((id) => delete state.byId[id]);
        state.allIds = state.allIds.filter((id) => !ids.includes(id));
        recalculateFlows(state);
      }),

    clearAllEntities: () => set((state) => {

        Object.assign(state, initialState);
    }),

    hydrate: (newState) =>
      set((state) => {

        state.byId = newState.byId;
        state.allIds = newState.allIds;
        recalculateFlows(state);
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

