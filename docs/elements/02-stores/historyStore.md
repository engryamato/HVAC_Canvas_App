# historyStore

## Overview

The historyStore is a Zustand store that manages the undo/redo command history. It maintains two stacks (past and future) for reversible commands and enforces a maximum history size to prevent memory issues.

## Location

```
src/core/commands/historyStore.ts
```

## Purpose

- Maintain undo/redo command history with two stacks
- Support undo operation (pop from past, push to future)
- Support redo operation (pop from future, push to past)
- Enforce maximum history size (default: 100 commands)
- Clear history when needed (e.g., new project)
- Provide canUndo/canRedo status checks

## Dependencies

- `zustand` - State management library
- `zustand/middleware/immer` - Immutable state updates
- `@/core/commands/types` - ReversibleCommand interface

## State Structure

### HistoryState

```typescript
interface HistoryState {
  past: ReversibleCommand[];    // Stack of past commands (most recent at end)
  future: ReversibleCommand[];  // Stack of future commands (most recent at start)
  maxSize: number;              // Maximum history size (default: 100)
}
```

**Initial State**:
```typescript
{
  past: [],
  future: [],
  maxSize: 100
}
```

**Stack Semantics**:
- `past`: Array where last element is most recent (use `.pop()` to undo)
- `future`: Array where first element is most recent (use `.shift()` to redo)

### ReversibleCommand

```typescript
interface ReversibleCommand extends Command {
  id: string;                      // Unique command ID
  type: CommandTypeName;           // Command type (CREATE_ENTITY, etc.)
  payload: unknown;                // Command-specific data
  timestamp: number;               // Unix timestamp
  inverse: Command;                // Inverse command to undo
  selectionBefore?: string[];      // Selection state before command
  selectionAfter?: string[];       // Selection state after command
}
```

**Key Concepts**:
- Each command contains its `inverse` for undo
- Selection state preserved for restoration on undo/redo
- Commands are immutable once added to history

## Actions

### History Operations

| Action | Signature | Description |
|--------|-----------|-------------|
| `push` | `(command: ReversibleCommand) => void` | Add command to history, clear future stack |
| `undo` | `() => ReversibleCommand \| undefined` | Pop from past, push to future, return command |
| `redo` | `() => ReversibleCommand \| undefined` | Pop from future, push to past, return command |
| `clear` | `() => void` | Clear all history (reset to initial state) |
| `canUndo` | `() => boolean` | Check if undo is available |
| `canRedo` | `() => boolean` | Check if redo is available |

## Implementation Details

### 1. Push Command

```typescript
push: (command) =>
  set((state) => {
    // Add to past, clear future (new action invalidates redo stack)
    state.past.push(command);
    state.future = [];

    // Trim if exceeds max size
    if (state.past.length > state.maxSize) {
      state.past = state.past.slice(-state.maxSize);
    }
  }),
```

**Behavior**:
- Adds command to end of past array
- Clears future array (new action invalidates any redo history)
- Trims oldest commands if past exceeds `maxSize` (keeps most recent 100)
- This is called after every reversible action

### 2. Undo

```typescript
undo: () => {
  const state = get();
  if (state.past.length === 0) {
    return undefined;
  }

  const command = state.past[state.past.length - 1];
  if (!command) {
    return undefined;
  }

  set((s) => {
    s.past.pop();
    s.future.unshift(command);
  });
  return command;
},
```

**Behavior**:
- Returns `undefined` if past is empty (nothing to undo)
- Pops last command from past
- Adds command to beginning of future (for redo)
- Returns the command for caller to execute inverse
- Caller must execute `command.inverse` to actually undo

**Important**: This only moves the command in history. The caller (typically the command executor) must execute the inverse operation.

### 3. Redo

```typescript
redo: () => {
  const state = get();
  if (state.future.length === 0) {
    return undefined;
  }

  const command = state.future[0];
  if (!command) {
    return undefined;
  }

  set((s) => {
    s.future.shift();
    s.past.push(command);
  });
  return command;
},
```

**Behavior**:
- Returns `undefined` if future is empty (nothing to redo)
- Shifts first command from future
- Pushes command to end of past
- Returns the command for caller to re-execute
- Caller must execute the command again to redo

### 4. Clear History

```typescript
clear: () => set(initialState),
```

**Behavior**:
- Resets to initial state (empty past/future)
- Used when loading new project or resetting application

### 5. Can Undo/Redo Checks

```typescript
canUndo: () => get().past.length > 0,
canRedo: () => get().future.length > 0,
```

**Behavior**:
- Returns boolean for UI state (enable/disable undo/redo buttons)
- Non-reactive standalone functions

## Selectors

### Hook Selectors (React)

Use these in React components for automatic re-renders:

```typescript
// Check if undo/redo available (reactive)
const canUndo = useCanUndo();
const canRedo = useCanRedo();

// Get history sizes (for debugging/stats)
const historySize = useHistorySize();
const futureSize = useFutureSize();
```

### Actions Hook

```typescript
const {
  push,
  undo,
  redo,
  clear,
  canUndo,
  canRedo,
} = useHistoryActions();
```

## Usage Examples

### Executing a Reversible Command

```typescript
import { useHistoryActions } from '@/core/commands/historyStore';
import { useEntityActions } from '@/core/store/entityStore';
import { generateCommandId } from '@/core/commands/types';

function createRoom(position: Point, size: Size) {
  const { push } = useHistoryActions();
  const { addEntity, removeEntity } = useEntityActions();

  const roomId = crypto.randomUUID();
  const room = {
    id: roomId,
    type: 'room',
    position,
    size,
    props: { name: 'New Room' },
  };

  // Create reversible command
  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: 'CREATE_ENTITY',
    payload: { entity: room },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: 'DELETE_ENTITY',
      payload: { entityId: roomId },
      timestamp: Date.now(),
    },
    selectionAfter: [roomId], // Select created room
  };

  // Execute forward action
  addEntity(room);

  // Add to history
  push(command);
}
```

### Undo/Redo Handler

```typescript
import { useHistoryActions } from '@/core/commands/historyStore';
import { executeCommand } from '@/core/commands/executor';

function UndoRedoManager() {
  const { undo, redo } = useHistoryActions();

  const handleUndo = () => {
    const command = undo();
    if (command) {
      // Execute the inverse command
      executeCommand(command.inverse);

      // Restore selection state
      if (command.selectionBefore) {
        useSelectionStore.getState().selectMultiple(command.selectionBefore);
      }
    }
  };

  const handleRedo = () => {
    const command = redo();
    if (command) {
      // Re-execute the original command
      executeCommand(command);

      // Restore selection state
      if (command.selectionAfter) {
        useSelectionStore.getState().selectMultiple(command.selectionAfter);
      }
    }
  };

  return { handleUndo, handleRedo };
}
```

### Undo/Redo Buttons

```typescript
import { useCanUndo, useCanRedo, useHistoryActions } from '@/core/commands/historyStore';
import { executeCommand } from '@/core/commands/executor';

function UndoRedoButtons() {
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { undo, redo } = useHistoryActions();

  const handleUndo = () => {
    const command = undo();
    if (command) {
      executeCommand(command.inverse);
    }
  };

  const handleRedo = () => {
    const command = redo();
    if (command) {
      executeCommand(command);
    }
  };

  return (
    <div>
      <button onClick={handleUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        ↶ Undo
      </button>
      <button onClick={handleRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        ↷ Redo
      </button>
    </div>
  );
}
```

### Keyboard Shortcuts

```typescript
import { useHistoryActions } from '@/core/commands/historyStore';
import { executeCommand } from '@/core/commands/executor';
import { useEffect } from 'react';

function KeyboardShortcuts() {
  const { undo, redo, canUndo, canRedo } = useHistoryActions();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z / Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          const command = undo();
          if (command) executeCommand(command.inverse);
        }
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z: Redo
      // Ctrl+Y / Cmd+Y: Redo (alternate)
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        if (canRedo()) {
          const command = redo();
          if (command) executeCommand(command);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return null;
}
```

### History Status Display

```typescript
import { useHistorySize, useFutureSize } from '@/core/commands/historyStore';

function HistoryDebugPanel() {
  const historySize = useHistorySize();
  const futureSize = useFutureSize();

  return (
    <div>
      <p>Undo stack: {historySize} commands</p>
      <p>Redo stack: {futureSize} commands</p>
    </div>
  );
}
```

### Clearing History on Project Load

```typescript
import { useHistoryActions } from '@/core/commands/historyStore';
import { loadProject } from '@/core/persistence/projectIO';

async function loadProjectFile(filePath: string) {
  const { clear } = useHistoryActions();

  // Clear history before loading new project
  clear();

  // Load project data
  const projectData = await loadProject(filePath);

  // Hydrate stores with new data
  useEntityStore.getState().hydrate(projectData.entities);
  useProjectStore.getState().setProject(projectData);

  // History starts fresh for new project
}
```

### Creating Complex Commands with Selection State

```typescript
import { useHistoryActions } from '@/core/commands/historyStore';
import { useSelectedIds } from '@/features/canvas/store/selectionStore';
import { generateCommandId } from '@/core/commands/types';

function moveEntities(entityIds: string[], deltaX: number, deltaY: number) {
  const { push } = useHistoryActions();
  const selectionBefore = useSelectedIds();

  // Store original positions for undo
  const originalPositions = entityIds.map(id => {
    const entity = useEntityStore.getState().byId[id];
    return { id, position: entity.position };
  });

  // Create reversible command
  const command: ReversibleCommand = {
    id: generateCommandId(),
    type: 'MOVE_ENTITIES',
    payload: { entityIds, deltaX, deltaY },
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: 'MOVE_ENTITIES',
      payload: {
        entityIds,
        deltaX: -deltaX,
        deltaY: -deltaY
      },
      timestamp: Date.now(),
    },
    selectionBefore,      // Restore selection on undo
    selectionAfter: entityIds, // Keep selection after move
  };

  // Execute move
  entityIds.forEach(id => {
    const entity = useEntityStore.getState().byId[id];
    useEntityStore.getState().updateEntity(id, {
      position: {
        x: entity.position.x + deltaX,
        y: entity.position.y + deltaY,
      },
    });
  });

  // Add to history
  push(command);
}
```

## Command Pattern Integration

The historyStore is the storage layer for the Command Pattern. The full undo/redo flow:

1. **Execute**: Perform action, create ReversibleCommand with inverse
2. **Push**: Add command to history (clears redo stack)
3. **Undo**: Pop command, execute inverse, push to future
4. **Redo**: Pop from future, re-execute command, push to past

**Example Flow**:
```typescript
// 1. User creates room
createRoomCommand() // Adds room, pushes CREATE_ENTITY to history

// History: past=[CREATE_ENTITY], future=[]

// 2. User creates duct
createDuctCommand() // Adds duct, pushes CREATE_DUCT to history

// History: past=[CREATE_ENTITY, CREATE_DUCT], future=[]

// 3. User undoes duct
undo() // Returns CREATE_DUCT, caller removes duct

// History: past=[CREATE_ENTITY], future=[CREATE_DUCT]

// 4. User undoes room
undo() // Returns CREATE_ENTITY, caller removes room

// History: past=[], future=[CREATE_DUCT, CREATE_ENTITY]

// 5. User redoes room
redo() // Returns CREATE_ENTITY, caller re-adds room

// History: past=[CREATE_ENTITY], future=[CREATE_DUCT]
```

## Performance Optimization

### 1. Maximum History Size

```typescript
export const MAX_HISTORY_SIZE = 100;
```

**Why 100?**:
- Balances memory usage vs. undo depth
- Typical user needs < 20 undo levels
- 100 provides generous buffer
- Prevents unbounded memory growth

### 2. Command Payload Optimization

Keep command payloads minimal:

```typescript
// ✅ Good: Only store IDs and deltas
{
  type: 'MOVE_ENTITIES',
  payload: { entityIds: ['id1', 'id2'], deltaX: 10, deltaY: 20 }
}

// ❌ Bad: Store entire entity objects
{
  type: 'MOVE_ENTITIES',
  payload: { entities: [fullEntity1, fullEntity2] }
}
```

### 3. Batch Commands

For multiple related actions, create single batch command:

```typescript
// ✅ Good: Single command for multiple deletes
{
  type: 'DELETE_ENTITIES',
  payload: { entityIds: ['id1', 'id2', 'id3'] }
}

// ❌ Bad: Three separate commands
push(DELETE_ENTITY id1)
push(DELETE_ENTITY id2)
push(DELETE_ENTITY id3)
```

## History Trimming

When history exceeds `maxSize`, oldest commands are removed:

```typescript
if (state.past.length > state.maxSize) {
  state.past = state.past.slice(-state.maxSize);
}
```

**Example**:
```typescript
// maxSize = 3
// past = [cmd1, cmd2, cmd3, cmd4]
// After trim: past = [cmd2, cmd3, cmd4] (keeps last 3)
```

## Related Elements

- [EntityCommands](../09-commands/EntityCommands.md) - Creates reversible entity commands
- [CommandExecutor](../09-commands/CommandExecutor.md) - Executes commands and their inverses
- [SelectionStore](./selectionStore.md) - Provides selection state for commands
- [EntityStore](./entityStore.md) - Target of most commands
- [UndoRedoButtons](../01-components/toolbar/UndoRedoButtons.md) - UI for undo/redo

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useHistoryStore } from './historyStore';
import { generateCommandId } from './types';

describe('historyStore', () => {
  beforeEach(() => {
    useHistoryStore.setState({ past: [], future: [], maxSize: 100 });
  });

  const createMockCommand = (type: string): ReversibleCommand => ({
    id: generateCommandId(),
    type: type as CommandTypeName,
    payload: {},
    timestamp: Date.now(),
    inverse: {
      id: generateCommandId(),
      type: `UNDO_${type}` as CommandTypeName,
      payload: {},
      timestamp: Date.now(),
    },
  });

  it('pushes command to history', () => {
    const command = createMockCommand('CREATE_ENTITY');

    act(() => {
      useHistoryStore.getState().push(command);
    });

    expect(useHistoryStore.getState().past).toContainEqual(command);
    expect(useHistoryStore.getState().future).toEqual([]);
  });

  it('clears future on push', () => {
    const cmd1 = createMockCommand('CREATE_ENTITY');
    const cmd2 = createMockCommand('UPDATE_ENTITY');

    act(() => {
      useHistoryStore.getState().push(cmd1);
      useHistoryStore.getState().undo(); // Move to future
      useHistoryStore.getState().push(cmd2); // Should clear future
    });

    expect(useHistoryStore.getState().future).toEqual([]);
    expect(useHistoryStore.getState().past).toHaveLength(1);
  });

  it('undoes command', () => {
    const command = createMockCommand('CREATE_ENTITY');

    act(() => {
      useHistoryStore.getState().push(command);
    });

    let undoneCommand;
    act(() => {
      undoneCommand = useHistoryStore.getState().undo();
    });

    expect(undoneCommand).toEqual(command);
    expect(useHistoryStore.getState().past).toEqual([]);
    expect(useHistoryStore.getState().future).toContainEqual(command);
  });

  it('returns undefined when undoing empty history', () => {
    let result;
    act(() => {
      result = useHistoryStore.getState().undo();
    });

    expect(result).toBeUndefined();
  });

  it('redoes command', () => {
    const command = createMockCommand('CREATE_ENTITY');

    act(() => {
      useHistoryStore.getState().push(command);
      useHistoryStore.getState().undo();
    });

    let redoneCommand;
    act(() => {
      redoneCommand = useHistoryStore.getState().redo();
    });

    expect(redoneCommand).toEqual(command);
    expect(useHistoryStore.getState().past).toContainEqual(command);
    expect(useHistoryStore.getState().future).toEqual([]);
  });

  it('returns undefined when redoing empty future', () => {
    let result;
    act(() => {
      result = useHistoryStore.getState().redo();
    });

    expect(result).toBeUndefined();
  });

  it('trims history when exceeding max size', () => {
    act(() => {
      useHistoryStore.setState({ maxSize: 3 });
    });

    const commands = [
      createMockCommand('CMD_1'),
      createMockCommand('CMD_2'),
      createMockCommand('CMD_3'),
      createMockCommand('CMD_4'),
    ];

    act(() => {
      commands.forEach(cmd => useHistoryStore.getState().push(cmd));
    });

    const past = useHistoryStore.getState().past;
    expect(past).toHaveLength(3);
    expect(past).not.toContainEqual(commands[0]); // First removed
    expect(past).toContainEqual(commands[3]); // Last kept
  });

  it('clears history', () => {
    const command = createMockCommand('CREATE_ENTITY');

    act(() => {
      useHistoryStore.getState().push(command);
      useHistoryStore.getState().clear();
    });

    expect(useHistoryStore.getState().past).toEqual([]);
    expect(useHistoryStore.getState().future).toEqual([]);
  });

  it('checks canUndo', () => {
    expect(useHistoryStore.getState().canUndo()).toBe(false);

    act(() => {
      useHistoryStore.getState().push(createMockCommand('CREATE_ENTITY'));
    });

    expect(useHistoryStore.getState().canUndo()).toBe(true);
  });

  it('checks canRedo', () => {
    expect(useHistoryStore.getState().canRedo()).toBe(false);

    act(() => {
      useHistoryStore.getState().push(createMockCommand('CREATE_ENTITY'));
      useHistoryStore.getState().undo();
    });

    expect(useHistoryStore.getState().canRedo()).toBe(true);
  });
});
```
