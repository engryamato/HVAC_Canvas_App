# PSR-06: Migration Module
- Phase: Phase 3: Migration & Data Integrity
- Dependencies: PSR-02, PSR-04, PSR-05
- Status: ✅ **COMPLETED**

## Objective
Standalone one-time migration function scanning legacy locations into canonical layout.

## Spec References
- **Core Flows**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="c67b5d33-0683-432c-a167-6eef71ca51f2" title="Core Flows - Persistent Storage Root">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/c67b5d33-0683-432c-a167-6eef71ca51f2`</traycer-spec>
  - Flow 1: First Launch with Storage Initialization (migration section)
- **Tech Plan**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="09530bad-8225-4708-82bf-8b821aca0b7d" title="">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/09530bad-8225-4708-82bf-8b821aca0b7d`</traycer-spec>
  - Section: Component Architecture → Layer 2: Core Services → Migration Module
  - Section: Architectural Approach → Decision 7: Migration as Standalone Module

## Implementation Details

### File Location
- `hvac-design-app/src/core/services/migration/runMigration.ts`
- Integrated into `StorageRootService.initialize()`

### Migration Context
```typescript
interface MigrationContext {
  storageRootPath: string;
  scanLocations: string[];
  dryRun: boolean;
  existingProjectIds: string[];
  indexStorageKey: string;
  onProgress?: (progress: MigrationProgress) => void;
}
```

### Scan Locations
- `Documents/SizeWise/Projects` (legacy capitalized)
- `Documents/HVAC_Projects` (original location)
- `{storageRoot}/Projects` (legacy capitalized)
- `{storageRoot}/projects` (current canonical)
- `AppData/SizeWise/Projects` (fallback location)
- Paths from localStorage `projectIndex`

### Migration Process
1. **Scan Phase**: Discover `.sws` files in configured locations
2. **Plan Phase**: Build migration plan with conflict resolution
3. **Execute Phase**: Copy files to canonical structure
4. **Verify Phase**: Validate copied files
5. **Update Phase**: Update project index with new paths

### Conflict Resolution
- Auto-rename with suffix: `Project (1).sws`, `Project (2).sws`, etc.
- Applies to `.sws`, `.bak`, and `.png` files

## Checklist
- [x] Implement `runMigration(context)` as pure orchestrator module
- [x] Scan configured locations and index for legacy projects
- [x] Build migration plan with conflict-safe renaming
- [x] Copy project assets (.sws, .bak, .png) and verify outputs
- [x] Return structured result with counts/errors/duration
- [x] Add tests for success, conflict, skip, and partial failure behavior
- [x] Integrate with `StorageRootService` initialization

## Acceptance Criteria
- [x] Migration runs once on first launch (when `migrationState === 'pending'`)
- [x] Scans all configured legacy locations
- [x] Handles name conflicts with auto-rename
- [x] Copies `.sws`, `.bak`, and `.png` files
- [x] Updates project index with new canonical paths
- [x] Partial failures don't block successful migrations
- [x] Returns detailed result with counts and errors
- [x] Progress events emitted during migration

## Test Cases
- [x] Unit: detects legacy projects across configured scan locations
- [x] Unit: conflict naming avoids overwrite and preserves all files
- [x] Unit: disk-space pre-check blocks unsafe migration (handled in service)
- [x] Unit: partial failures are reported while successful files migrate
- [x] Unit: result metrics match migrated/skipped/failed counts
- [x] Integration: migration updates project index correctly
- [x] Integration: migration runs during first initialization

## Definition of Done
- [x] Implementation merged with passing targeted tests
- [x] Acceptance criteria from Core Flows and Tech Plan satisfied
- [x] Migration integrated into StorageRootService
- [x] Progress reporting functional

## Implementation Notes
✅ Fully implemented and integrated. Migration runs automatically during first launch and handles legacy project structures gracefully.

**Note**: Disk space pre-check is handled at the service layer (`StorageRootService`) rather than within `runMigration` itself.
