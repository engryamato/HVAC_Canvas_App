import { describe, it, expect } from 'vitest';
import { CommandType, generateCommandId } from '../types';
import type { Command, ReversibleCommand, CommandResult } from '../types';

describe('CommandType', () => {
  it('should have all entity command types', () => {
    expect(CommandType.CREATE_ENTITY).toBe('CREATE_ENTITY');
    expect(CommandType.UPDATE_ENTITY).toBe('UPDATE_ENTITY');
    expect(CommandType.DELETE_ENTITY).toBe('DELETE_ENTITY');
    expect(CommandType.MOVE_ENTITY).toBe('MOVE_ENTITY');
  });

  it('should have all batch command types', () => {
    expect(CommandType.CREATE_ENTITIES).toBe('CREATE_ENTITIES');
    expect(CommandType.DELETE_ENTITIES).toBe('DELETE_ENTITIES');
  });

  it('should have all group command types', () => {
    expect(CommandType.GROUP_ENTITIES).toBe('GROUP_ENTITIES');
    expect(CommandType.UNGROUP_ENTITIES).toBe('UNGROUP_ENTITIES');
  });
});

describe('generateCommandId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateCommandId();
    const id2 = generateCommandId();
    expect(id1).not.toBe(id2);
  });

  it('should include timestamp', () => {
    const before = Date.now();
    const id = generateCommandId();
    const after = Date.now();

    const timestampStr = id.split('-')[0] ?? '0';
    const timestamp = parseInt(timestampStr, 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('should have correct format', () => {
    const id = generateCommandId();
    const parts = id.split('-');
    expect(parts).toHaveLength(2);
    expect(parts[0] ?? '').toMatch(/^\d+$/); // timestamp
    expect(parts[1] ?? '').toMatch(/^[a-z0-9]+$/); // random string
  });
});

describe('Command interface', () => {
  it('should allow creating valid commands', () => {
    const command: Command = {
      id: generateCommandId(),
      type: CommandType.CREATE_ENTITY,
      payload: { entity: { id: 'test' } },
      timestamp: Date.now(),
    };

    expect(command.id).toBeDefined();
    expect(command.type).toBe(CommandType.CREATE_ENTITY);
    expect(command.payload).toBeDefined();
    expect(command.timestamp).toBeGreaterThan(0);
  });
});

describe('ReversibleCommand interface', () => {
  it('should allow creating reversible commands', () => {
    const command: ReversibleCommand = {
      id: generateCommandId(),
      type: CommandType.CREATE_ENTITY,
      payload: { entity: { id: 'test' } },
      timestamp: Date.now(),
      inverse: {
        id: generateCommandId(),
        type: CommandType.DELETE_ENTITY,
        payload: { entityId: 'test' },
        timestamp: Date.now(),
      },
    };

    expect(command.inverse).toBeDefined();
    expect(command.inverse.type).toBe(CommandType.DELETE_ENTITY);
  });
});

describe('CommandResult interface', () => {
  it('should allow success result', () => {
    const result: CommandResult = {
      success: true,
    };
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should allow error result', () => {
    const result: CommandResult = {
      success: false,
      error: 'Something went wrong',
    };
    expect(result.success).toBe(false);
    expect(result.error).toBe('Something went wrong');
  });
});
