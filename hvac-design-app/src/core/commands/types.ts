/**
 * Command types for all state mutations
 * Used by the undo/redo system to track and reverse operations
 */
export const CommandType = {
  // Entity commands
  CREATE_ENTITY: 'CREATE_ENTITY',
  UPDATE_ENTITY: 'UPDATE_ENTITY',
  UPDATE_ENTITIES: 'UPDATE_ENTITIES',
  DELETE_ENTITY: 'DELETE_ENTITY',
  MOVE_ENTITY: 'MOVE_ENTITY',
  MOVE_ENTITIES: 'MOVE_ENTITIES',

  // Batch commands
  CREATE_ENTITIES: 'CREATE_ENTITIES',
  DELETE_ENTITIES: 'DELETE_ENTITIES',

  // Group commands
  GROUP_ENTITIES: 'GROUP_ENTITIES',
  UNGROUP_ENTITIES: 'UNGROUP_ENTITIES',
} as const;

export type CommandTypeName = (typeof CommandType)[keyof typeof CommandType];

/**
 * Base command interface
 * All commands must implement this interface
 */
export interface Command {
  /** Unique command ID */
  id: string;
  /** Type of command */
  type: CommandTypeName;
  /** Command-specific data */
  payload: unknown;
  /** Unix timestamp when command was created */
  timestamp: number;
}

/**
 * Reversible command for undo/redo support
 * Contains the inverse command to undo the action
 */
export interface ReversibleCommand extends Command {
  /** The command that reverses this action */
  inverse: Command;
  /** Selection state before the command executed */
  selectionBefore?: string[];
  /** Selection state after the command executed */
  selectionAfter?: string[];
}

/**
 * Command execution result
 */
export interface CommandResult {
  /** Whether the command executed successfully */
  success: boolean;
  /** Error message if command failed */
  error?: string;
}

/**
 * Command executor function signature
 */
export type CommandExecutor<T extends Command = Command> = (command: T) => CommandResult;

/**
 * Generate unique command ID using timestamp + random
 * Format: {timestamp}-{random7chars}
 */
export function generateCommandId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

