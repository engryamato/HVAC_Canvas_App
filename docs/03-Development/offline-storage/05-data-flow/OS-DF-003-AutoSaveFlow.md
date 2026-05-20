# Offline Storage: Auto-Save Flow

## 1. Overview

### Purpose
Document the **auto-save implementation** using the `useAutoSave` hook, targeting **localStorage** for web persistence and aligning with the 300-second auto-save specification.

### Scope
- `useAutoSave` hook implementation
- **Target behavior**: 300-second interval (configurable)
- **Current behavior**: 2000ms debounce (implementation gap)
- Change detection via store subscriptions
- **localStorage** persistence (sync)
- beforeunload handling
- Dirty state tracking

### Implementation Status
- **Status**: 📋 Specification Ready (Code Update Pending)
- **Target Storage**: localStorage
- **Target Interval**: 300 seconds
- **Actual Debounce**: 2000ms (2 seconds)
- **Last Verified**: 2026-01-15

---

## 2. Architecture Context

### Auto-Save Architecture

```mermaid
graph TB
    subgraph "Store Changes"
        ES[entityStore changes]
        VS[viewportStore changes]
    end

    subgraph "useAutoSave Hook"
        SUB[Store subscriptions]
        DET[Change detection]
        DEB[Interval timer<br/>300s]
        SAVE[save() function<br/>Async]
    end

    subgraph "Storage Targets"
        LS[localStorage<br/>Project Data]
        FS[.sws file<br/>Desktop only]
    end

    ES --> SUB
    VS --> SUB
    SUB --> DET
    DET -->|Change detected| DEB
    DEB -->|Interval expires| SAVE
    SAVE --> LS
    SAVE -.->|Manual save| FS

    style DEB fill:#fff4e1
    style SAVE fill:#e1f5ff
    style LS fill:#e1f0ff
```

---

## 3. useAutoSave Hook

### Hook Signature

```typescript
interface UseAutoSaveOptions {
  enabled?: boolean;        // Default: true
  interval?: number;        // Default: 300000ms
  debounceDelay?: number;   // Default: 2000ms (current implementation)
  onSave?: (success: boolean) => void;
}

function useAutoSave(options: UseAutoSaveOptions = {}): {
  save: () => boolean;
  isDirty: boolean;
}
```

### Sync Nature
`localStorage` operations are **synchronous**, so `save()` returns a boolean success flag.

---

## 4. Change Detection & Debounce

### Change Detection Strategy
1. **Serialize state**: Convert critical store state to JSON (for comparison).
2. **Compare with previous**: Check if content actually changed.
3. **Set dirty flag**: Mark project as unsaved immediately.
4. **Trigger Interval**: Reset the 300-second timer.

### Interval Logic (300s)
- **Why 300s?**: Balances data safety with fewer sync operations.
- **Behavior**: Timer resets on *every* change. Save occurs once the user is idle for 300 seconds.
- **Current Gap**: Implementation still uses a 2000ms debounce.

---

## 5. Save Function Implementation

### Building Project Data

```typescript
const buildProjectData = useCallback((): StoredProject | null => {
  // Collect state from all stores
  const entityStore = useEntityStore.getState();
  const viewportStore = useViewportStore.getState();

  return {
    projectId: currentProjectId,
    modifiedAt: new Date().toISOString(),
    entities: {
      byId: entityStore.byId,
      allIds: entityStore.allIds,
    },
    // ... other stores
  };
}, [currentProjectId]);
```

### Saving to localStorage

```typescript
// src/features/canvas/hooks/useAutoSave.ts

const save = useCallback((): boolean => {
  if (!currentProjectId) return false;

  const projectData = buildProjectData();
  if (!projectData) return false;

  const success = saveProjectToStorage(currentProjectId, projectData);
  if (success) {
    setLocalDirty(false);
  }

  onSave?.(success);
  return success;
}, [currentProjectId, buildProjectData]);
```

**Storage Key**: `hvac-project-{projectId}` (localStorage).

---

## 6. Edge Cases & Handling

### 1. Browser Closure (beforeunload)
**Challenge**: `beforeunload` is synchronous, and localStorage writes are synchronous.
**Solution**:
- Auto-save can complete synchronously before unload.
- **Improved UX**: If `isDirty` is true, show browser "Leave Site?" confirmation dialog to prevent data loss.

### 2. Quota Exceeded
**Impact**: localStorage limit (~5MB) can be reached on large projects.
**Handling**: Catch block logs error; UI shows "Save Failed" indicator.

### 3. Rapid Changes
**Handling**: Interval timer reduces write frequency; current 2000ms debounce still guards burst edits.

---

## 7. Storage Strategy
- **Primary Behavior**: Synchronous write to `localStorage`.
- **No Migration**: IndexedDB is rejected under the localStorage-only policy.
- **Backup**: Cloud backup only on explicit user action.

---

## 8. Related Documentation
- [Zustand Persistence](../02-storage-layers/OS-SL-004-ZustandPersistence.md)
- [Manual Save Flow](./OS-DF-004-ManualSaveFlow.md)
