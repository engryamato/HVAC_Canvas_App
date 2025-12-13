import type { Entity } from '@/core/schema';
import type { Command, ReversibleCommand } from './types';
import { CommandType, generateCommandId } from './types';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from './historyStore';

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

  // Execute command
  useEntityStore.getState().addEntity(entity);

  // Push to history
  useHistoryStore.getState().push(command);
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

  useEntityStore.getState().updateEntity(id, updates);
  useHistoryStore.getState().push(command);
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

  useEntityStore.getState().removeEntity(entity.id);
  useHistoryStore.getState().push(command);
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

  useEntityStore.getState().removeEntities(entities.map((e) => e.id));
  useHistoryStore.getState().push(command);
}

/**
 * Execute undo operation
 * Returns true if undo was successful
 */
export function undo(): boolean {
  const command = useHistoryStore.getState().undo();
  if (!command) {
    return false;
  }

  executeCommand(command.inverse);
  return true;
}

/**
 * Execute redo operation
 * Returns true if redo was successful
 */
export function redo(): boolean {
  const command = useHistoryStore.getState().redo();
  if (!command) {
    return false;
  }

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
  }
}
