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

interface TransformChange {
  id: string;
  from: Entity['transform'];
  to: Entity['transform'];
}

interface TransformCommandPayload {
  transforms: Array<{ id: string; transform: Entity['transform'] }>;
  selection?: string[];
}

function captureSelection(options?: CommandOptions): { before: string[]; after: string[] } {
  const selectionStore = useSelectionStore.getState();
  const before = options?.selectionBefore ?? [...selectionStore.selectedIds];
  const after = options?.selectionAfter ?? before;

  return { before, after };
}

function getSelectionSnapshot(): string[] {
  return [...useSelectionStore.getState().selectedIds];
}

function applySelection(selection?: string[]): void {
  if (!selection) {
    return;
  }
  useSelectionStore.getState().selectMultiple([...selection]);
}

function executeAndRecord(command: ReversibleCommand): void {
  executeCommand(command);
  useHistoryStore.getState().push(command);
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
    payload: { entity, selection: [entity.id] },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.DELETE_ENTITY,
      payload: { entityId: entity.id, selection: selection.before },
      timestamp: Date.now(),
    },
    selectionBefore: selection.before,
    // After redo, the created entity should be selected
    selectionAfter: options?.selectionAfter ?? [entity.id],
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
  if (entities.length === 0) {
    return;
  }

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
 * Can be called with just the updated entity (will fetch previous state from store)
 */
export function updateEntity(
  entityOrId: Entity | string,
  updates?: Partial<Entity>,
  previousState?: Entity,
  options?: CommandOptions
): void {
  // Support both calling styles:
  // updateEntity(entity) - pass complete updated entity
  // updateEntity(id, updates, previousState) - legacy style
  let id: string;
  let actualUpdates: Partial<Entity>;
  let actualPreviousState: Entity;

  if (typeof entityOrId === 'string') {
    id = entityOrId;
    actualUpdates = updates!;
    actualPreviousState = previousState!;
  } else {
    id = entityOrId.id;
    const previous = useEntityStore.getState().byId[id];
    if (!previous) {
      return;
    }
    actualPreviousState = previous;
    actualUpdates = entityOrId;
  }

  const selection = captureSelection(options);

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.UPDATE_ENTITY,
    payload: { id, updates: actualUpdates, selection: selection.before },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.UPDATE_ENTITY,
      payload: { id, updates: actualPreviousState, selection: selection.before },
      timestamp: Date.now(),
    },
    selectionBefore: selection.before,
    selectionAfter: selection.after,
  };

  executeAndRecord(command);
}

/**
 * Delete an entity from the canvas
 * Stores the entity for undo support
 * Can be called with either entity ID (string) or Entity object
 */
export function deleteEntity(entityOrId: Entity | string, options?: CommandOptions): void {
  // Support both calling styles:
  // deleteEntity('entity-id') - pass string ID
  // deleteEntity(entity) - pass Entity object
  let entity: Entity;
  let entityId: string;

  if (typeof entityOrId === 'string') {
    entityId = entityOrId;
    const storedEntity = useEntityStore.getState().byId[entityId];
    if (!storedEntity) {
      return; // Entity doesn't exist
    }
    entity = storedEntity;
  } else {
    entity = entityOrId;
    entityId = entity.id;
  }

  const selection = captureSelection(options);
  const nextSelection = selection.after.filter((id) => id !== entityId);

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.DELETE_ENTITY,
    payload: { entityId, selection: nextSelection },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.CREATE_ENTITY,
      payload: { entity, selection: selection.before },
      timestamp: Date.now(),
    },
    selectionBefore: selection.before,
    selectionAfter: nextSelection,
  };

  useEntityStore.getState().removeEntity(entityId);
  applySelection(nextSelection);
  useHistoryStore.getState().push(command);
}

/**
 * Delete multiple entities at once
 * Creates a single undoable command for all deletions
 */
export function deleteEntities(entities: Entity[], options?: CommandOptions): void {
  const selection = captureSelection(options);
  const entityIds = entities.map((e) => e.id);
  const remainingSelection = selection.after.filter((id) => !entityIds.includes(id));

  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: CommandType.DELETE_ENTITIES,
    payload: { entityIds, selection: remainingSelection },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: CommandType.CREATE_ENTITIES,
      payload: { entities, selection: selection.before },
      timestamp: Date.now(),
    },
    selectionBefore: selection.before,
    selectionAfter: remainingSelection,
  };

  useEntityStore.getState().removeEntities(entityIds);
  applySelection(remainingSelection);
  useHistoryStore.getState().push(command);
}

/**
 * Record a set of transform changes as a single move command
 * The entities are assumed to already be at their `to` position.
 */
export function moveEntities(changes: TransformChange[]): void {
  if (changes.length === 0) {
    return;
  }

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
  if (!command) {
    return false;
  }

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
  if (!command) {
    return false;
  }

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

    case CommandType.MOVE_ENTITY:
    case CommandType.MOVE_ENTITIES: {
      const { transforms, selection } = command.payload as TransformCommandPayload;

      transforms.forEach(({ id, transform }) => {
        entityStore.updateEntity(id, { transform });
      });

      applySelection(selection);
      break;
    }
  }
}
