# PSR-04: StorageRootService
- Phase: Phase 2: Core Services
- Dependencies: PSR-01, PSR-02, PSR-03
- Status: ✅ **COMPLETED**

## Objective
Service orchestration for initialize/validate/relocate with fallback and event emission.

## Spec References
- **Core Flows**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="c67b5d33-0683-432c-a167-6eef71ca51f2" title="Core Flows - Persistent Storage Root">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/c67b5d33-0683-432c-a167-6eef71ca51f2`</traycer-spec>
  - Flow 1: First Launch with Storage Initialization
  - Flow 2: Subsequent App Launches with Validation
  - Flow 4: Changing Storage Location
  - Flow 7: Permission Failure Fallback
- **Tech Plan**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="09530bad-8225-4708-82bf-8b821aca0b7d" title="">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/09530bad-8225-4708-82bf-8b821aca0b7d`</traycer-spec>
  - Section: Component Architecture → Layer 2: Core Services → StorageRootService
  - Section: Architectural Approach → Decision 4: Event System for Live Reload

## Implementation Details

### File Locations
- `hvac-design-app/src/core/services/StorageRootService.ts`
- `hvac-design-app/src/core/services/__tests__/StorageRootService.test.ts`
- `hvac-design-app/src/core/services/__tests__/StorageRootService.integration.test.ts`

### Methods
1. **`initialize(): Promise<InitResult>`**
   - Resolves Documents/SizeWise or falls back to app data
   - Creates canonical directories (projects, .quarantine, .logs)
   - Runs startup migration if `migrationState === 'pending'`
   - Acquires root lock during initialization

2. **`validate(): Promise<ValidationResult>`**
   - Checks directory exists (auto-recreates if missing)
   - Tests write permissions
   - Checks disk space (warns if < 5%)
   - Validates path consistency (handles profile changes)
   - Falls back to app data if Documents unavailable

3. **`relocate(newPath: string): Promise<RelocationResult>`**
   - Validates new path is writable
   - Copies all projects to new location
   - Updates storage root in store
   - Emits `storageRoot:changed` event

4. **`getStorageRoot(): string | null`**
   - Returns current storage root path

5. **`getQuarantinedFiles(): Promise<QuarantinedFile[]>`**
   - Lists files in `.quarantine/` directory

### Events Emitted
- **`storageRoot:changed`**: Storage root path changed (detail: { path, oldPath })
- **`migration:state`**: Migration progress/completion (detail: MigrationProgress)
- **`operation:error`**: Operation failure (detail: { operation, error })
- **`validation:warning`**: Low disk space or other warnings (detail: { type, available, path })
- **`validation:error`**: Validation failures (detail: { errors, path })

### Factory Pattern
```typescript
createStorageRootService(queue, storeApi): StorageRootService
getStorageRootService(): Promise<StorageRootService>  // Global cache
```

## Checklist
- [x] Implement initialize, validate, relocate, getStorageRoot, quarantine helpers
- [x] Use queue root lock for migration/relocation critical sections
- [x] Emit events: storageRoot:changed, migration:state, operation:error
- [x] Handle documents->appdata fallback when primary path is unavailable
- [x] Wire factory/cache accessors for app-wide singleton usage
- [x] Add unit tests for first-run and fallback flows
- [x] Add integration tests for full initialization sequence

## Acceptance Criteria
- [x] First launch initializes writable root and creates canonical directories
- [x] Existing root validates and surfaces warnings (low disk, path mismatch)
- [x] Unwritable Documents root falls back to app data silently
- [x] Relocation copies all projects and updates store atomically
- [x] Events emit with correct payload shape and timing
- [x] Service is accessible via global cache (singleton pattern)

## Test Cases
- [x] Integration: first launch initializes writable root and directories
- [x] Integration: existing root validates and surfaces warnings
- [x] Integration: unwritable docs root falls back to appdata
- [x] Unit: relocation copies data and updates store path
- [x] Unit: expected events emit with correct payload shape
- [x] Unit: path normalization handles Windows/Unix separators
- [x] Unit: canonical directory creation is idempotent
- [x] Integration: migration runs during initialization when pending

## Definition of Done
- [x] Implementation completed with passing targeted tests
- [x] Acceptance criteria from Core Flows and Tech Plan satisfied
- [x] Event system integrated and tested
- [x] Fallback behavior verified on all platforms

## Implementation Notes
✅ Fully implemented and tested. Service orchestrates storage root lifecycle with robust fallback and event emission.
