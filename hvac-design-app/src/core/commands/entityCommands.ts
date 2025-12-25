import type { Entity } from '@/core/schema';
import type { Command, ReversibleCommand } from './types';
import { CommandType, generateCommandId } from './types';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from './historyStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';

type TransformSnapshot = Entity['transform'];

type SelectionSnapshot = string[];

interface TransformChange {
  id: string;
  from: TransformSnapshot;
  to: TransformSnapshot;
}

interface TransformCommandPayload {
  transforms: { id: string; transform: TransformSnapshot }[];
  selection?: string[];
}

function getSelectionSnapshot(): SelectionSnapshot {
  return [...useSelectionStore.getState().selectedIds];
}

function applySelection(selection?: string[]) {
  if (!selection) return;

  const entityStore = useEntityStore.getState();
  const selectionStore = useSelectionStore.getState();
  const validIds = selection.filter((id) => Boolean(entityStore.byId[id]));

  if (validIds.length > 0) {
    selectionStore.selectMultiple(validIds);
  } else {
    selectionStore.clearSelection();
  }
}

export interface EntityMoveDelta {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

/**
 * Create a new entity on the canvas
 * Pushes a reversible command to history for undo support
 */
export function createEntity(entity: Entity): void {
  const selectionBefore = getSelectionSnapshot();

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.CREATE_ENTITY,
    payload: { entity, selection: [entity.id] },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.DELETE_ENTITY,
      payload: { entityId: entity.id, selection: selectionBefore },
      timestamp: Date.now(),
    },
  };

  // Execute command
  useEntityStore.getState().addEntity(entity);
  useSelectionStore.getState().select(entity.id);

  // Push to history
  useHistoryStore.getState().push(command);
}

/**
 * Create multiple entities at once with a single history entry
 */
export function createEntities(entities: Entity[]): void {
  if (entities.length === 0) return;

  const selectionBefore = getSelectionSnapshot();
  const selectionAfter = entities.map((entity) => entity.id);

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.CREATE_ENTITIES,
    payload: { entities, selection: selectionAfter },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.DELETE_ENTITIES,
      payload: { entityIds: entities.map((entity) => entity.id), selection: selectionBefore },
      timestamp: Date.now(),
    },
  };

  useEntityStore.getState().addEntities(entities);
  useSelectionStore.getState().selectMultiple(selectionAfter);
  useHistoryStore.getState().push(command);
}

/**
 * Update an existing entity
 * Stores the previous state for undo support
 */
export function updateEntity(id: string, updates: Partial<Entity>, previousState: Entity): void {
  const selectionSnapshot = getSelectionSnapshot();

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.UPDATE_ENTITY,
    payload: { id, updates, selection: selectionSnapshot },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.UPDATE_ENTITY,
      payload: { id, updates: previousState, selection: selectionSnapshot },
      timestamp: Date.now(),
    },
  };

  executeAndRecord(command);
}

/**
 * Delete an entity from the canvas
 * Stores the entity for undo support
 */
export function deleteEntity(entity: Entity): void {
  const selectionBefore = getSelectionSnapshot();
  const nextSelection = selectionBefore.filter((id) => id !== entity.id);

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.DELETE_ENTITY,
    payload: { entityId: entity.id, selection: nextSelection },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.CREATE_ENTITY,
      payload: { entity, selection: selectionBefore },
      timestamp: Date.now(),
    },
  };

  useEntityStore.getState().removeEntity(entity.id);
  applySelection(nextSelection);
  useHistoryStore.getState().push(command);
}

/**
 * Delete multiple entities at once
 * Creates a single undoable command for all deletions
 */
export function deleteEntities(entities: Entity[]): void {
  if (entities.length === 0) return;

  const selectionBefore = getSelectionSnapshot();
  const remainingSelection = selectionBefore.filter((id) => !entities.some((entity) => entity.id === id));

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.DELETE_ENTITIES,
    payload: { entityIds: entities.map((e) => e.id), selection: remainingSelection },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.CREATE_ENTITIES,
      payload: { entities, selection: selectionBefore },
      timestamp: Date.now(),
    },
  };

  useEntityStore.getState().removeEntities(entities.map((e) => e.id));
  applySelection(remainingSelection);
  useHistoryStore.getState().push(command);
}

/**
 * Record a set of transform changes as a single move command
 * The entities are assumed to already be at their `to` position.
 */
export function moveEntities(changes: TransformChange[]): void {
  if (changes.length === 0) return;

  const selectionSnapshot = getSelectionSnapshot();

  const payload: TransformCommandPayload = {
    transforms: changes.map((change) => ({ id: change.id, transform: change.to })),
    selection: selectionSnapshot,
  };

  const inversePayload: TransformCommandPayload = {
    transforms: changes.map((change) => ({ id: change.id, transform: change.from })),
    selection: selectionSnapshot,
  };

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.MOVE_ENTITY,
    payload,
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.MOVE_ENTITY,
      payload: inversePayload,
      timestamp: Date.now(),
    },
  };

  const entityStore = useEntityStore.getState();
  payload.transforms.forEach(({ id, transform }) => {
    entityStore.updateEntity(id, { transform });
  });

  useHistoryStore.getState().push(command);
}

/**
 * Execute undo operation
 * Returns true if undo was successful
 */
export function undo(): boolean {
  const command = useHistoryStore.getState().undo();
  if (!command) return false;

  executeCommand(command.inverse);
  return true;
}

/**
 * Execute redo operation
 * Returns true if redo was successful
 */
export function redo(): boolean {
  const command = useHistoryStore.getState().redo();
  if (!command) return false;

  executeCommand(command);
  return true;
}

/**
 * Execute a command without pushing to history
 * Used for undo/redo operations
 */
function executeCommand(command: Command): void {
  const entityStore = useEntityStore.getState();

  switch (command.type) {
    case CommandType.CREATE_ENTITY:
      entityStore.addEntity((command.payload as { entity: Entity }).entity);
      applySelection((command.payload as { selection?: string[] }).selection);
      break;

    case CommandType.DELETE_ENTITY:
      entityStore.removeEntity((command.payload as { entityId: string }).entityId);
      applySelection((command.payload as { selection?: string[] }).selection);
      break;

    case CommandType.UPDATE_ENTITY: {
      const { id, updates, selection } = command.payload as {
        id: string;
        updates: Partial<Entity>;
        selection?: string[];
      };
      entityStore.updateEntity(id, updates);
      applySelection(selection);
      break;
    }

    case CommandType.CREATE_ENTITIES: {
      const { entities, selection } = command.payload as { entities: Entity[]; selection?: string[] };
      entityStore.addEntities(entities);
      applySelection(selection);
      break;
    }

    case CommandType.DELETE_ENTITIES: {
      const { entityIds, selection } = command.payload as { entityIds: string[]; selection?: string[] };
      entityStore.removeEntities(entityIds);
      applySelection(selection);
      break;
    }

    case CommandType.MOVE_ENTITY: {
      const { transforms, selection } = command.payload as TransformCommandPayload;

      transforms.forEach(({ id, transform }) => {
        entityStore.updateEntity(id, { transform });
      });

      applySelection(selection);
      break;
    }

    case CommandType.MOVE_ENTITY:
    case CommandType.MOVE_ENTITIES: {
      const { moves } = command.payload as { moves: EntityMoveDelta[] };
      moves.forEach((move) => {
        const entity = entityStore.byId[move.id];
        if (!entity) return;
        entityStore.updateEntity(move.id, {
          transform: {
            ...entity.transform,
            x: move.to.x,
            y: move.to.y,
          },
        });
      });
      break;
    }
  }
}
