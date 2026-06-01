import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Duct, DuctRun, Entity, EntityType } from '@/core/schema';
import { ConnectionGraphBuilder } from '@/core/services/graph/ConnectionGraphBuilder';
import { ConnectionReconciliationService } from '@/core/services/graph/ConnectionReconciliationService';
import { FlowPropagationService } from '@/core/services/graph/FlowPropagationService';
import { calculateVelocity } from '@/core/services/engineeringCalculations';
import { PressurePropagationService } from '@/core/services/calculations/PressurePropagationService';
import { TopologyValidationService } from '@/core/services/graph/TopologyValidationService';
import type { TopologyValidationResult } from '@/core/services/graph/types';
import { calculateEquivalentDiameter, calculateFrictionLoss } from '@/features/canvas/calculators/pressureDrop';
import { buildOverlayStatusMap, useDuctOverlayStore } from './ductOverlayStore';
import { useValidationStore, type ValidationResult } from './validationStore';

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
  updateEntityTransient: (id: string, updates: Partial<Entity>) => void;
  removeEntity: (id: string) => void;
  // Batch operations
  addEntities: (entities: Entity[]) => void;
  removeEntities: (ids: string[]) => void;
  clearAllEntities: () => void;
  // Hydration (for loading from file)
  hydrate: (state: EntityState) => void;
  commitNetwork: () => void;
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
      if (entity && (entity.type === 'duct' || entity.type === 'duct_run') && entity.props.airflow !== flow) {
        entity.props.airflow = flow;
        const velocity = calculateEntityVelocity(entity);
        entity.calculated = {
          ...entity.calculated,
          velocity,
          frictionLoss: calculateEntityFrictionLoss(entity, velocity),
        };
      }
    }
  } catch (error) {
    console.error('[EntityStore] Failed to recalculate flows:', error);
  }
};

const runCommittedPipeline = (state: EntityState) => {
  try {
    const reconciled = ConnectionReconciliationService.reconcile(state.byId as Record<string, Entity>);
    state.byId = reconciled;
    state.allIds = state.allIds.filter((id) => Boolean(state.byId[id]));

    const graph = ConnectionGraphBuilder.buildFromPersistedMetadata(state.byId);
    const validationResults = TopologyValidationService.validate(graph, state.byId);
    const validEntityIds = new Set(validationResults.filter((result) => result.isValid).flatMap((result) => result.affectedEntityIds));
    const invalidEntityIds = new Set(validationResults.filter((result) => !result.isValid).flatMap((result) => result.affectedEntityIds));

    const flows = FlowPropagationService.calculateFlows(graph, state.byId);
    for (const [id, flow] of flows) {
      const entity = state.byId[id];
      if (entity && (entity.type === 'duct' || entity.type === 'duct_run') && validEntityIds.has(id)) {
        entity.props.airflow = flow;
        const velocity = calculateEntityVelocity(entity);
        entity.calculated = {
          ...entity.calculated,
          velocity,
          frictionLoss: calculateEntityFrictionLoss(entity, velocity),
        };
      }
    }

    const pressureResults = PressurePropagationService.calculatePressures(graph, state.byId, validationResults);
    for (const [id, pressure] of pressureResults) {
      const entity = state.byId[id];
      if (!entity || (entity.type !== 'duct_run' && entity.type !== 'fitting')) {
        continue;
      }
      entity.calculated = {
        ...entity.calculated,
        cumulativePressureDrop: pressure.cumulativePressureDrop,
        availableStaticPressure: pressure.availableStaticPressure,
        ...(entity.type === 'fitting' ? { pressureLoss: pressure.pressureLoss } : {}),
      } as typeof entity.calculated;
    }

    for (const id of invalidEntityIds) {
      const entity = state.byId[id];
      if (!entity || (entity.type !== 'duct_run' && entity.type !== 'fitting')) {
        continue;
      }
      entity.calculated = {
        ...entity.calculated,
        cumulativePressureDrop: undefined,
        availableStaticPressure: undefined,
      } as typeof entity.calculated;
    }

    writeTopologyValidationWarnings(validationResults);
    const overlayMode = useDuctOverlayStore.getState().overlayMode;
    useDuctOverlayStore.getState().setOverlayStatusMap(buildOverlayStatusMap(state.byId, validationResults, overlayMode));
  } catch (error) {
    console.error('[EntityStore] Failed to run committed magnetic calculation pipeline:', error);
    recalculateFlows(state);
  }
};

function calculateEntityVelocity(entity: Duct | DuctRun): number {
  if (entity.props.shape === 'round' || entity.props.shape === 'flexible') {
    return calculateVelocity(entity.props.airflow, {
      shape: 'round',
      diameter: entity.props.diameter,
    });
  }

  return calculateVelocity(entity.props.airflow, {
    shape: 'rectangular',
    width: entity.props.width,
    height: entity.props.height,
  });
}

function calculateEntityFrictionLoss(entity: Duct | DuctRun, velocity: number): number {
  const diameter =
    entity.props.shape === 'round' || entity.props.shape === 'flexible'
      ? entity.props.diameter ?? 0
      : calculateEquivalentDiameter(entity.props.width ?? 0, entity.props.height ?? 0);

  const length =
    entity.type === 'duct_run'
      ? entity.props.installLength
      : entity.props.length;

  const materialRoughness: Record<Duct['props']['material'], number> = {
    galvanized: 0.0005,
    stainless: 0.0002,
    aluminum: 0.0002,
    flex: 0.003,
  };

  return calculateFrictionLoss(
    velocity,
    diameter,
    length,
    materialRoughness[entity.props.material]
  );
}

function writeTopologyValidationWarnings(validationResults: TopologyValidationResult[]): void {
  const validationStore = useValidationStore.getState();

  for (const result of validationResults) {
    if (result.isValid) {
      for (const entityId of result.affectedEntityIds) {
        const existing = validationStore.validationResults[entityId];
        if (existing?.violations.some((violation) => violation.ruleId === 'topology')) {
          validationStore.clearValidation(entityId);
        }
      }
      continue;
    }

    for (const entityId of result.affectedEntityIds) {
      const warning: ValidationResult = {
        entityId,
        serviceId: 'topology',
        catalogStatus: 'resolved',
        lastValidated: new Date(),
        violations: [
          {
            ruleId: 'topology',
            type: result.reason,
            severity: 'warning',
            message: `Network topology unsupported for calculation: ${result.reason}`,
          },
        ],
      };
      validationStore.setValidationResult(entityId, warning);
    }
  }
}

export const useEntityStore = create<EntityStore>()(
  immer((set) => ({
    ...initialState,

    addEntity: (entity) =>
      set((state) => {

        if (!state.byId[entity.id]) {
          state.byId[entity.id] = entity;
          state.allIds.push(entity.id);
          runCommittedPipeline(state);
        } else {
            console.warn('[EntityStore] addEntity: Entity already exists', entity.id);
        }
      }),

    updateEntity: (id, updates) =>
      set((state) => {
        if (state.byId[id]) {
          state.byId[id] = { ...state.byId[id], ...updates } as Entity;
          runCommittedPipeline(state);
        }
      }),

    updateEntityTransient: (id, updates) =>
      set((state) => {
        if (state.byId[id]) {
          state.byId[id] = { ...state.byId[id], ...updates } as Entity;
        }
      }),

    removeEntity: (id) =>
      set((state) => {

        delete state.byId[id];
        state.allIds = state.allIds.filter((entityId) => entityId !== id);
        runCommittedPipeline(state);
      }),

    addEntities: (entities) =>
      set((state) => {

        entities.forEach((entity) => {
          if (!state.byId[entity.id]) {
            state.byId[entity.id] = entity;
            state.allIds.push(entity.id);
          }
        });
        runCommittedPipeline(state);
      }),

    removeEntities: (ids) =>
      set((state) => {

        ids.forEach((id) => delete state.byId[id]);
        state.allIds = state.allIds.filter((id) => !ids.includes(id));
        runCommittedPipeline(state);
      }),

    clearAllEntities: () => set((state) => {

        Object.assign(state, initialState);
        useDuctOverlayStore.getState().setOverlayStatusMap({});
    }),

    hydrate: (newState) =>
      set((state) => {

        state.byId = newState.byId;
        state.allIds = newState.allIds;
        runCommittedPipeline(state);
      }),

    commitNetwork: () =>
      set((state) => {
        runCommittedPipeline(state);
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
    updateEntityTransient: state.updateEntityTransient,
    removeEntity: state.removeEntity,
    addEntities: state.addEntities,
    removeEntities: state.removeEntities,
    clearAllEntities: state.clearAllEntities,
    hydrate: state.hydrate,
    commitNetwork: state.commitNetwork,
  }));
