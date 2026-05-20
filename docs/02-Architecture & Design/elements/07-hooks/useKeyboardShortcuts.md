# useKeyboardShortcuts Hook

## Overview

The useKeyboardShortcuts hook provides global keyboard shortcuts for the canvas editor including undo/redo, save, delete, tool selection, zoom controls, and more.

## Location

```
src/features/canvas/hooks/useKeyboardShortcuts.ts
```

## Purpose

- Handle undo (Ctrl+Z) and redo (Ctrl+Y, Ctrl+Shift+Z)
- Save project (Ctrl+S)
- Delete entities (Delete/Backspace)
- Select all (Ctrl+A)
- Tool shortcuts (V, R, D, E, F, N)
- Zoom controls (+, -, 0)
- Grid toggle (G)
- Clear selection (Escape)

## Hook Signature

```typescript
export function useKeyboardShortcuts(options: ShortcutOptions = {}): void
```

## Options

```typescript
interface ShortcutOptions {
  onSave?: () => void;
  onDelete?: () => void;
  onToolChange?: (tool: ToolType) => void;
  onSelectAll?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
  onZoomToSelection?: (result: { success: boolean; message?: string }) => void;
  onEscape?: () => void;
  enabled?: boolean;  // Enable/disable shortcuts (default: true)
}
```

## Keyboard Shortcuts

### Editing

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+Shift+Z | Redo (alternative) |
| Ctrl+S | Save project |
| Ctrl+A | Select all entities |
| Ctrl+1 | Zoom to fit all content |
| Ctrl+2 | Zoom to selection |
| Delete | Delete selected |
| Backspace | Delete selected |
| Escape | Clear selection |

### Tools

| Shortcut | Tool |
|----------|------|
| V | Select tool |
| R | Room tool |
| D | Duct tool |
| E | Equipment tool |
| F | Fitting tool |
| N | Note tool |

### Viewport

| Shortcut | Action |
|----------|--------|
| + or = | Zoom in |
| - | Zoom out |
| 0 | Reset view |
| G | Toggle grid |

## Usage Examples

### Basic Setup

```typescript
import { useKeyboardShortcuts } from '@/features/canvas/hooks/useKeyboardShortcuts';

function CanvasEditor() {
  const { save } = useAutoSave();
  const [currentTool, setCurrentTool] = useState('select');

  useKeyboardShortcuts({
    onSave: () => {
      save();
      showNotification('Project saved!');
    },
    onToolChange: (tool) => {
      setCurrentTool(tool);
    },
  });

  return <div>Canvas Editor</div>;
}
```

### With Conditional Enable

```typescript
const [isInputFocused, setIsInputFocused] = useState(false);

useKeyboardShortcuts({
  enabled: !isInputFocused,  // Disable when typing in inputs
  onSave: handleSave,
});
```

### Full Example

```typescript
function CanvasPage() {
  const { save } = useAutoSave();
  const { deleteSelected } = useEntityOperations();

  useKeyboardShortcuts({
    onSave: () => {
      const result = save();
      toast(result.success ? 'Saved!' : 'Save failed');
    },
    onDelete: () => {
      deleteSelected();
      toast('Deleted');
    },
    onToolChange: (tool) => {
      setActiveTool(tool);
      toast(`Switched to ${tool} tool`);
    },
    onZoomIn: () => {
      toast('Zoomed in');
    },
    onZoomOut: () => {
      toast('Zoomed out');
    },
    onSelectAll: () => {
      toast(`Selected ${allEntities.length} entities`);
    },
  });
}
```

## Input Filtering

Shortcuts are automatically disabled when typing in inputs:

```typescript
// Skip if target is an input, textarea, or contenteditable
const target = event.target as HTMLElement;
if (
  target.tagName === 'INPUT' ||
  target.tagName === 'TEXTAREA' ||
  target.isContentEditable
) {
  return;  // Don't process shortcut
}
```

## Testing

```typescript
describe('useKeyboardShortcuts', () => {
  it('calls onSave on Ctrl+S', () => {
    const onSave = jest.fn();
    renderHook(() => useKeyboardShortcuts({ onSave }));

    fireEvent.keyDown(window, { key: 's', ctrlKey: true });

    expect(onSave).toHaveBeenCalled();
  });

  it('calls undo on Ctrl+Z', () => {
    renderHook(() => useKeyboardShortcuts());

    const undoSpy = jest.spyOn(commandsModule, 'undo');
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

    expect(undoSpy).toHaveBeenCalled();
  });

  it('deletes selected entities on Delete key', () => {
    const room = createRoom();
    useEntityStore.getState().addEntity(room);
    useSelectionStore.getState().select(room.id);

    renderHook(() => useKeyboardShortcuts());

    fireEvent.keyDown(window, { key: 'Delete' });

    expect(useEntityStore.getState().byId[room.id]).toBeUndefined();
  });

  it('ignores shortcuts when typing in input', () => {
    const onSave = jest.fn();
    renderHook(() => useKeyboardShortcuts({ onSave }));

    const input = document.createElement('input');
    document.body.appendChild(input);

    fireEvent.keyDown(input, { key: 's', ctrlKey: true });

    expect(onSave).not.toHaveBeenCalled();
  });
});
```

## Related Elements

- [useUndoRedo](./useUndoRedo.md)
- [useEntityOperations](./useEntityOperations.md)
- [EntityCommands](../09-commands/EntityCommands.md)
- [viewportStore](../02-stores/viewportStore.md)
