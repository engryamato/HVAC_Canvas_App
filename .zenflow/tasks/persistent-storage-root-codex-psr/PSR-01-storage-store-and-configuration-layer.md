# PSR-01: Storage Store & Configuration Layer
- Phase: Phase 1: Foundation & Infrastructure
- Dependencies: None
- Status: ✅ **COMPLETED**

## Objective
Create and harden storageStore state for root configuration, migration tracking, validation metadata, and quarantine counters using persisted Zustand state.

## Spec References
- **Core Flows**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="c67b5d33-0683-432c-a167-6eef71ca51f2" title="Core Flows - Persistent Storage Root">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/c67b5d33-0683-432c-a167-6eef71ca51f2`</traycer-spec>
  - Flow 1: First Launch with Storage Initialization
  - Flow 2: Subsequent App Launches with Validation
- **Tech Plan**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="09530bad-8225-4708-82bf-8b821aca0b7d" title="">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/09530bad-8225-4708-82bf-8b821aca0b7d`</traycer-spec>
  - Section: Data Model → Storage Store Schema
  - Section: Component Architecture → Layer 4: State Management

## Implementation Details

### File Location
- `hvac-design-app/src/core/store/storageStore.ts`
- `hvac-design-app/src/core/store/__tests__/storageStore.test.ts`

### State Schema
```typescript
interface StorageState {
  storageRootPath: string | null;
  storageRootType: 'documents' | 'appdata';
  migrationState: 'idle' | 'pending' | 'running' | 'completed' | 'failed';
  migrationCompletedAt: string | null;
  migrationError: string | null;
  lastValidatedAt: number | null;
  validationWarnings: string[];
  quarantinedFileCount: number;
  lastQuarantineAt: string | null;
  
  setStorageRoot: (path: string, type: StorageRootType) => void;
  setMigrationState: (state: StorageMigrationState, error?: string) => void;
  updateValidation: (timestamp: number, warnings: string[]) => void;
  incrementQuarantine: () => void;
}
```

## Checklist
- [x] Define StorageMigrationState and state schema in `src/core/store/storageStore.ts`
- [x] Set defaults aligned to spec (storageRootPath=null, storageRootType='documents', migration/validation/quarantine fields)
- [x] Implement actions: setStorageRoot, setMigrationState, updateValidation, incrementQuarantine
- [x] Use persist middleware with key `sws.storage` and include migration-safe hydration behavior
- [x] Export store from `src/core/store/index.ts` for consistent imports
- [x] Add focused unit tests for state transitions and localStorage persistence

## Acceptance Criteria
- [x] Store persists to localStorage with key `sws.storage`
- [x] Default storageRootPath is null (resolved during initialization)
- [x] Default migrationState is 'pending' (triggers migration on first launch)
- [x] State hydration handles legacy formats gracefully (migration function)
- [x] All actions update state immutably
- [x] Store is accessible via `useStorageStore()` hook

## Test Cases
- [x] Unit: defaults are initialized correctly
- [x] Unit: setStorageRoot updates path and type
- [x] Unit: setMigrationState handles running/completed/failed and timestamps
- [x] Unit: updateValidation stores timestamp + warnings
- [x] Unit: incrementQuarantine increments count and updates timestamp
- [x] Persistence: data is written to sws.storage and rehydrates as expected
- [x] Migration: legacy state formats are normalized on hydration

## Definition of Done
- [x] Implementation completed with passing targeted tests
- [x] Acceptance criteria from Core Flows and Tech Plan satisfied
- [x] Store exported and accessible throughout application
- [x] Documentation updated in code comments

## Implementation Notes
✅ Fully implemented and tested. Store includes legacy state migration for backward compatibility.
