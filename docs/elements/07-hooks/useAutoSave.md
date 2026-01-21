# useAutoSave Hook

## Overview

The useAutoSave hook provides automatic project saving to localStorage or disk (Tauri mode). It tracks dirty state across entities, selection, viewport, history, and preferences, and writes a versioned envelope with checksum plus backup support.

## Location

```
src/features/canvas/hooks/useAutoSave.ts
```

## Purpose

- Auto-save project state to localStorage (web) or .sws file (Tauri)
- Track dirty state when stores change
- Support interval-based autosave
- Save on browser beforeunload event
- Persist entities, viewport state, selection, preferences, history, and UI state

## Hook Signature

```typescript
export function useAutoSave(options: UseAutoSaveOptions = {}): {
  save: () => SaveResult;
  saveNow: () => SaveResult;
  isDirty: boolean;
}
```

## Options

```typescript
interface UseAutoSaveOptions {
  enabled?: boolean;       // Enable/disable auto-save (default: true)
  interval?: number;       // Interval-based save in ms (optional)
  onSave?: (result: SaveResult) => void; // Callback after save
}
```

## Saved Data Structure

```typescript
export interface LocalStorageEnvelope {
  schemaVersion: string;
  projectId: string;
  savedAt: string;
  checksum: string;
  payload: LocalStoragePayload;
}
```

## Storage Functions

### saveProjectToStorage

Save project to localStorage with error handling.

```typescript
export function saveProjectToStorage(projectId: string, payload: LocalStoragePayload): StorageWriteResult
```

**Storage Key:** `getProjectStorageKey(projectId)`

### saveBackupToStorage

Save backup envelope to localStorage.

```typescript
export function saveBackupToStorage(projectId: string, payload: LocalStoragePayload): StorageWriteResult
```

### loadProjectFromStorage

Load and validate envelope from localStorage (primary or backup).

```typescript
export function loadProjectFromStorage(projectId: string): LoadedProject | null

### deleteProjectFromStorage

Remove project and backup from localStorage.
```

## Usage Examples

### Basic Auto-Save

```typescript
import { useAutoSave } from '@/features/canvas/hooks/useAutoSave';

function CanvasEditor({ projectId }: { projectId: string }) {
  const { save, isDirty } = useAutoSave();

  return (
    <div>
      {isDirty && <span>Unsaved changes</span>}
      <button onClick={save}>Save Now</button>
    </div>
  );
}
```

### Interval and Callback

```typescript
const { save, isDirty } = useAutoSave({
  enabled: true,
  interval: 60000,
  onSave: (result) => {
    if (result.success) {
      console.log('Project saved!', result.sizeBytes);
    } else {
      console.error('Save failed', result.error);
    }
  },
});
```

### Manual Control

```typescript
const { save } = useAutoSave({ enabled: false });

// Manually trigger save
const handleSaveClick = () => {
  const result = save();
  if (result.success) {
    alert('Saved successfully!');
  }
};
```

## Behavior

### Dirty State Tracking

The hook marks dirty when entity, viewport, selection, history, or preference stores change.

### Save on Unload

Automatically saves before page close:
```typescript
window.addEventListener('beforeunload', () => {
  if (isDirty) {
    save();
  }
});
```

## Testing

```typescript
describe('useAutoSave', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves project to localStorage', () => {
    const { result } = renderHook(() => useAutoSave({ enabled: false }));

    act(() => {
      const saveResult = result.current.save();
      expect(saveResult.success).toBe(true);
    });
  });

  it('tracks dirty state on entity changes', () => {
    const { result } = renderHook(() => useAutoSave());

    expect(result.current.isDirty).toBe(false);

    act(() => {
      useEntityStore.getState().addEntity(createRoom());
    });

    expect(result.current.isDirty).toBe(true);
  });

  it('tracks dirty state on entity changes', () => {
    const { result } = renderHook(() => useAutoSave({ enabled: false }));

    act(() => {
      useEntityStore.getState().addEntity(createRoom());
    });

    expect(result.current.isDirty).toBe(true);
  });
});
```

## Related Elements

- [projectStore](../02-stores/projectStore.md)
- [entityStore](../02-stores/entityStore.md)
- [viewportStore](../02-stores/viewportStore.md)
- [ProjectIO](../10-persistence/ProjectIO.md)
