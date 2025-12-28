# useAutoSave Hook

## Overview

The useAutoSave hook provides automatic project saving to localStorage with debouncing, dirty state tracking, and viewport state persistence. It monitors entity and viewport changes and automatically saves the project state.

## Location

```
src/features/canvas/hooks/useAutoSave.ts
```

## Purpose

- Auto-save project state to localStorage
- Track dirty state when entities or viewport change
- Debounce saves to avoid excessive writes (default 2 seconds)
- Support interval-based autosave
- Save on browser beforeunload event
- Persist entities, viewport state, and project metadata

## Hook Signature

```typescript
export function useAutoSave(options: UseAutoSaveOptions = {}): {
  save: () => boolean;
  isDirty: boolean;
}
```

## Options

```typescript
interface UseAutoSaveOptions {
  enabled?: boolean;         // Enable/disable auto-save (default: true)
  debounceDelay?: number;    // Debounce delay in ms (default: 2000)
  interval?: number;         // Interval-based save in ms (optional)
  onSave?: (success: boolean) => void;  // Callback after save
}
```

## Saved Data Structure

```typescript
export interface StoredProject {
  projectId: string;
  projectName: string;
  projectNumber: string;
  clientName: string;
  createdAt: string;
  modifiedAt: string;
  entities: { byId: Record<string, unknown>; allIds: string[] };
  viewportState: { panX: number; panY: number; zoom: number };
  settings: { unitSystem: 'imperial' | 'metric'; gridSize: number; gridVisible: boolean };
}
```

## Storage Functions

### saveProjectToStorage

Save project to localStorage with error handling.

```typescript
export function saveProjectToStorage(projectId: string, project: StoredProject): boolean
```

**Storage Key:** `hvac-project-{projectId}`

### loadProjectFromStorage

Load project from localStorage.

```typescript
export function loadProjectFromStorage(projectId: string): StoredProject | null
```

### deleteProjectFromStorage

Remove project from localStorage.

```typescript
export function deleteProjectFromStorage(projectId: string): boolean
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

### Custom Debounce and Callback

```typescript
const { save, isDirty } = useAutoSave({
  enabled: true,
  debounceDelay: 5000,  // 5 seconds
  onSave: (success) => {
    if (success) {
      console.log('Project saved!');
    } else {
      console.error('Save failed');
    }
  },
});
```

### With Interval-Based Saving

```typescript
const { save, isDirty } = useAutoSave({
  debounceDelay: 2000,   // Debounced save after 2s of inactivity
  interval: 60000,       // Also save every 60 seconds if dirty
});
```

### Manual Control

```typescript
const { save } = useAutoSave({ enabled: false });

// Manually trigger save
const handleSaveClick = () => {
  const success = save();
  if (success) {
    alert('Saved successfully!');
  }
};
```

## Behavior

### Dirty State Tracking

The hook monitors:
- Entity store changes (byId, allIds)
- Viewport store changes (panX, panY, zoom)

Changes trigger:
1. Set isDirty to true
2. Clear existing debounce timer
3. Start new debounce timer

### Debounced Auto-Save

When entities or viewport change:
```
Change detected → Clear timer → Wait 2s → Save
                                   ↑
New change → Reset timer ──────────┘
```

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
    const { result } = renderHook(() => useAutoSave());

    act(() => {
      result.current.save();
    });

    const saved = loadProjectFromStorage('test-project');
    expect(saved).not.toBeNull();
  });

  it('tracks dirty state on entity changes', () => {
    const { result } = renderHook(() => useAutoSave());

    expect(result.current.isDirty).toBe(false);

    act(() => {
      useEntityStore.getState().addEntity(createRoom());
    });

    expect(result.current.isDirty).toBe(true);
  });

  it('debounces saves', async () => {
    jest.useFakeTimers();
    const onSave = jest.fn();

    renderHook(() => useAutoSave({ debounceDelay: 1000, onSave }));

    // Make multiple changes
    act(() => {
      useEntityStore.getState().addEntity(createRoom());
    });
    act(() => {
      useEntityStore.getState().addEntity(createRoom());
    });

    // Should not save immediately
    expect(onSave).not.toHaveBeenCalled();

    // Fast forward past debounce
    jest.advanceTimersByTime(1000);

    // Should save once
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
```

## Related Elements

- [Project Store](../02-stores/ProjectStore.md)
- [Entity Store](../02-stores/EntityStore.md)
- [Viewport Store](../02-stores/ViewportStore.md)
- [ProjectIO](../10-persistence/ProjectIO.md)
