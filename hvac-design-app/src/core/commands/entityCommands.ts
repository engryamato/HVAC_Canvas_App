import type { Entity } from '@/core/schema';
import type { Command, ReversibleCommand } from './types';
import { CommandType, generateCommandId } from './types';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from './historyStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';

interface CommandOptions {
  selectionBefore?: string[];
  selectionAfter?: string[];
}

function captureSelection(options?: CommandOptions): { before: string[]; after: string[] } {
  const selectionStore = useSelectionStore.getState();
  const before = options?.selectionBefore ?? [...selectionStore.selectedIds];
  const after = options?.selectionAfter ?? before;

  return { before, after };
}

function applySelection(selection?: string[]): void {
  if (!selection) return;
  useSelectionStore.getState().selectMultiple([...selection]);
}

/**
 * Create a new entity on the canvas
 * Pushes a reversible command to history for undo support
 */
export function createEntity(entity: Entity, options?: CommandOptions): void {
  const selection = captureSelection(options);

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
    selectionBefore: selection.before,
    selectionAfter: selection.after,
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
export function updateEntity(
  id: string,
  updates: Partial<Entity>,
  previousState: Entity,
  options?: CommandOptions
): void {
  const selection = captureSelection(options);

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
    selectionBefore: selection.before,
    selectionAfter: selection.after,
  };

  useEntityStore.getState().updateEntity(id, updates);
  useHistoryStore.getState().push(command);
}

/**
 * Delete an entity from the canvas
 * Stores the entity for undo support
 */
export function deleteEntity(entity: Entity, options?: CommandOptions): void {
  const selection = captureSelection(options);

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
    selectionBefore: selection.before,
    selectionAfter: selection.after,
  };

  useEntityStore.getState().removeEntity(entity.id);
  useHistoryStore.getState().push(command);
}

/**
 * Delete multiple entities at once
 * Creates a single undoable command for all deletions
 */
export function deleteEntities(entities: Entity[], options?: CommandOptions): void {
  const selection = captureSelection(options);

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
    selectionBefore: selection.before,
    selectionAfter: selection.after,
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
  if (!command) return false;

  executeCommand(command.inverse);
  applySelection(command.selectionBefore);
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
  applySelection(command.selectionAfter ?? command.selectionBefore);
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

