# useUndoRedo Hook

## Overview

The useUndoRedo hook registers global keyboard shortcuts for undo/redo operations (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z) with cross-platform support for both Windows/Linux and macOS.

## Location

```
src/features/canvas/hooks/useUndoRedo.ts
```

## Purpose

- Register undo keyboard shortcut (Ctrl/Cmd+Z)
- Register redo keyboard shortcuts (Ctrl/Cmd+Y, Ctrl/Cmd+Shift+Z)
- Skip shortcuts when typing in inputs
- Support both Ctrl (Windows/Linux) and Cmd (macOS)
- SSR-safe platform detection

## Hook Signature

```typescript
export function useUndoRedo(): void
```

## Keyboard Shortcuts

| Shortcut | Action | Platform |
|----------|--------|----------|
| Ctrl+Z | Undo | Windows/Linux |
| Cmd+Z | Undo | macOS |
| Ctrl+Y | Redo | Windows/Linux |
| Ctrl+Shift+Z | Redo | All |
| Cmd+Shift+Z | Redo | macOS |

## Usage

```typescript
import { useUndoRedo } from '@/features/canvas/hooks/useUndoRedo';

function CanvasEditor() {
  useUndoRedo();  // Registers shortcuts

  return <div>...</div>;
}
```

## Related Elements

- [EntityCommands](../09-commands/EntityCommands.md)
- [HistoryStore](../09-commands/HistoryStore.md)
- [useKeyboardShortcuts](./useKeyboardShortcuts.md)
