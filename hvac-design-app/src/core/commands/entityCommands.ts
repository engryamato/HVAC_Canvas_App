import type { Entity } from '@/core/schema';
import type { Command, ReversibleCommand } from './types';
import { CommandType, generateCommandId } from './types';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from './historyStore';

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
  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.CREATE_ENTITY,
    payload: { entity },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.DELETE_ENTITY,
      payload: { entityId: entity.id },
      timestamp: Date.now(),
    },
  };

  executeAndRecord(command);
}

/**
 * Update an existing entity
 * Stores the previous state for undo support
 */
export function updateEntity(id: string, updates: Partial<Entity>, previousState: Entity): void {
  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.UPDATE_ENTITY,
    payload: { id, updates },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.UPDATE_ENTITY,
      payload: { id, updates: previousState },
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
  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.DELETE_ENTITY,
    payload: { entityId: entity.id },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.CREATE_ENTITY,
      payload: { entity },
      timestamp: Date.now(),
    },
  };

  executeAndRecord(command);
}

/**
 * Delete multiple entities at once
 * Creates a single undoable command for all deletions
 */
export function deleteEntities(entities: Entity[]): void {
  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.DELETE_ENTITIES,
    payload: { entityIds: entities.map((e) => e.id) },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.CREATE_ENTITIES,
      payload: { entities },
      timestamp: Date.now(),
    },
  };

  executeAndRecord(command);
}

/**
 * Move one or more entities from previous to new coordinates.
 * If applyImmediately is true (default), the move is applied before recording history.
 */
export function moveEntities(moves: EntityMoveDelta[], applyImmediately = true): void {
  if (moves.length === 0) return;

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: moves.length === 1 ? CommandType.MOVE_ENTITY : CommandType.MOVE_ENTITIES,
    payload: { moves },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: moves.length === 1 ? CommandType.MOVE_ENTITY : CommandType.MOVE_ENTITIES,
      payload: {
        moves: moves.map((move) => ({
          id: move.id,
          from: move.to,
          to: move.from,
        })),
      },
      timestamp: Date.now(),
    },
  };

  executeAndRecord(command, applyImmediately);
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
      break;

    case CommandType.DELETE_ENTITY:
      entityStore.removeEntity((command.payload as { entityId: string }).entityId);
      break;

    case CommandType.UPDATE_ENTITY: {
      const { id, updates } = command.payload as { id: string; updates: Partial<Entity> };
      entityStore.updateEntity(id, updates);
      break;
    }

    case CommandType.CREATE_ENTITIES: {
      const { entities } = command.payload as { entities: Entity[] };
      entityStore.addEntities(entities);
      break;
    }

    case CommandType.DELETE_ENTITIES: {
      const { entityIds } = command.payload as { entityIds: string[] };
      entityStore.removeEntities(entityIds);
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

function executeAndRecord(command: ReversibleCommand, applyImmediately = true): void {
  if (applyImmediately) {
    executeCommand(command);
  }
  useHistoryStore.getState().push(command);
}

