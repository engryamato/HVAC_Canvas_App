# History Store

## Overview

The History Store manages undo/redo command history using a dual-stack approach with configurable size limits.

## Location

```
src/core/commands/historyStore.ts
```

## State

```typescript
interface HistoryState {
  past: ReversibleCommand[];    // Undo stack (most recent at end)
  future: ReversibleCommand[];  // Redo stack (most recent at start)
  maxSize: number;               // Default: 100
}
```

## Actions

### push

Add command to history (clears redo stack).

```typescript
push: (command: ReversibleCommand) => void
```

### undo

Pop command from past stack.

```typescript
undo: () => ReversibleCommand | undefined
```

### redo

Pop command from future stack.

```typescript
redo: () => ReversibleCommand | undefined
```

### clear

Clear all history.

```typescript
clear: () => void
```

### canUndo / canRedo

Check if undo/redo available.

```typescript
canUndo: () => boolean
canRedo: () => boolean
```

## Usage

```typescript
import { useHistoryStore } from '@/core/commands/historyStore';

function UndoRedoButtons() {
  const canUndo = useHistoryStore(state => state.past.length > 0);
  const canRedo = useHistoryStore(state => state.future.length > 0);

  return (
    <>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </>
  );
}
```

## Related Elements

- [Entity Commands](./EntityCommands.md)
- [Command Types](./CommandTypes.md)
