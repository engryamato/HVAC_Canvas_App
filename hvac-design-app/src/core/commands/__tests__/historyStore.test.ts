import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore, MAX_HISTORY_SIZE } from '../historyStore';
import { CommandType, generateCommandId } from '../types';
import type { ReversibleCommand } from '../types';

const createMockCommand = (id: string = 'entity-1'): ReversibleCommand => ({
  id: generateCommandId(),
  type: CommandType.CREATE_ENTITY,
  payload: { entity: { id } },
  timestamp: Date.now(),
  inverse: {
    id: generateCommandId(),
    type: CommandType.DELETE_ENTITY,
    payload: { entityId: id },
    timestamp: Date.now(),
  },
});

describe('HistoryStore', () => {
  beforeEach(() => {
    useHistoryStore.getState().clear();
  });

  describe('push', () => {
    it('should add command to past stack', () => {
      const command = createMockCommand();
      useHistoryStore.getState().push(command);

      expect(useHistoryStore.getState().past).toHaveLength(1);
      expect(useHistoryStore.getState().past[0]).toEqual(command);
    });

    it('should clear future stack on new command', () => {
      const command1 = createMockCommand('entity-1');
      const command2 = createMockCommand('entity-2');

      useHistoryStore.getState().push(command1);
      useHistoryStore.getState().undo();
      expect(useHistoryStore.getState().future).toHaveLength(1);

      useHistoryStore.getState().push(command2);
      expect(useHistoryStore.getState().future).toHaveLength(0);
    });

    it('should trim history when exceeding max size', () => {
      for (let i = 0; i < MAX_HISTORY_SIZE + 10; i++) {
        useHistoryStore.getState().push(createMockCommand(`entity-${i}`));
      }

      expect(useHistoryStore.getState().past).toHaveLength(MAX_HISTORY_SIZE);
    });
  });

  describe('undo', () => {
    it('should return undefined when past is empty', () => {
      const result = useHistoryStore.getState().undo();
      expect(result).toBeUndefined();
    });

    it('should move command from past to future', () => {
      const command = createMockCommand();
      useHistoryStore.getState().push(command);

      const undone = useHistoryStore.getState().undo();

      expect(undone).toEqual(command);
      expect(useHistoryStore.getState().past).toHaveLength(0);
      expect(useHistoryStore.getState().future).toHaveLength(1);
    });

    it('should undo in LIFO order', () => {
      const command1 = createMockCommand('entity-1');
      const command2 = createMockCommand('entity-2');

      useHistoryStore.getState().push(command1);
      useHistoryStore.getState().push(command2);

      const undone1 = useHistoryStore.getState().undo();
      const undone2 = useHistoryStore.getState().undo();

      expect(undone1).toEqual(command2);
      expect(undone2).toEqual(command1);
    });
  });

  describe('redo', () => {
    it('should return undefined when future is empty', () => {
      const result = useHistoryStore.getState().redo();
      expect(result).toBeUndefined();
    });

    it('should move command from future to past', () => {
      const command = createMockCommand();
      useHistoryStore.getState().push(command);
      useHistoryStore.getState().undo();

      const redone = useHistoryStore.getState().redo();

      expect(redone).toEqual(command);
      expect(useHistoryStore.getState().past).toHaveLength(1);
      expect(useHistoryStore.getState().future).toHaveLength(0);
    });
  });

  describe('canUndo / canRedo', () => {
    it('should return false when stacks are empty', () => {
      expect(useHistoryStore.getState().canUndo()).toBe(false);
      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });

    it('should return true when stacks have items', () => {
      useHistoryStore.getState().push(createMockCommand());
      expect(useHistoryStore.getState().canUndo()).toBe(true);

      useHistoryStore.getState().undo();
      expect(useHistoryStore.getState().canRedo()).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear both stacks', () => {
      useHistoryStore.getState().push(createMockCommand());
      useHistoryStore.getState().undo();
      useHistoryStore.getState().push(createMockCommand());

      useHistoryStore.getState().clear();

      expect(useHistoryStore.getState().past).toHaveLength(0);
      expect(useHistoryStore.getState().future).toHaveLength(0);
    });
  });
});

