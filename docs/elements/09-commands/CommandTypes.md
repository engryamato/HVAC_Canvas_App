# Command Types

## Overview

Command Types defines the command type enumeration, interfaces, and utility functions for the undo/redo system.

## Location

```
src/core/commands/types.ts
```

## Command Type Enum

```typescript
export const CommandType = {
  CREATE_ENTITY:    'CREATE_ENTITY',
  UPDATE_ENTITY:    'UPDATE_ENTITY',
  DELETE_ENTITY:    'DELETE_ENTITY',
  MOVE_ENTITY:      'MOVE_ENTITY',
  MOVE_ENTITIES:    'MOVE_ENTITIES',
  CREATE_ENTITIES:  'CREATE_ENTITIES',
  DELETE_ENTITIES:  'DELETE_ENTITIES',
  GROUP_ENTITIES:   'GROUP_ENTITIES',
  UNGROUP_ENTITIES: 'UNGROUP_ENTITIES',
} as const;
```

## Interfaces

### Command

```typescript
export interface Command {
  id: string;
  type: CommandTypeName;
  payload: unknown;
  timestamp: number;
}
```

### ReversibleCommand

```typescript
export interface ReversibleCommand extends Command {
  inverse: Command;
  selectionBefore?: string[];
  selectionAfter?: string[];
}
```

### CommandResult

```typescript
export interface CommandResult {
  success: boolean;
  error?: string;
}
```

## Functions

### generateCommandId

```typescript
export function generateCommandId(): string
// Returns: "{timestamp}-{random7chars}"
// Example: "1703123456789-a7x9k2m"
```

## Related Elements

- [Entity Commands](./EntityCommands.md)
- [History Store](./HistoryStore.md)
