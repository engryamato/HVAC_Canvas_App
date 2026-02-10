# PSR-07: Validation & Quarantine System
- Phase: Phase 3: Migration & Data Integrity
- Dependencies: PSR-02, PSR-04, PSR-05
- Status: 🟡 **PARTIALLY COMPLETED** (validation done, quarantine detection missing)

## Objective
Startup integrity validation with quarantine workflow for corrupted artifacts.

## Spec References
- **Core Flows**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="c67b5d33-0683-432c-a167-6eef71ca51f2" title="Core Flows - Persistent Storage Root">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/c67b5d33-0683-432c-a167-6eef71ca51f2`</traycer-spec>
  - Flow 2: Subsequent App Launches with Validation
  - Flow 5: Quarantine Manager
  - Flow 6: Disk Space Warning
- **Tech Plan**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="09530bad-8225-4708-82bf-8b821aca0b7d" title="">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/09530bad-8225-4708-82bf-8b821aca0b7d`</traycer-spec>
  - Section: Component Architecture → Layer 2: Core Services → StorageRootService (validation)
  - Section: Data Model → Quarantine Tracking

## Implementation Details

### Validation (Implemented in StorageRootService)
**File Location**: `hvac-design-app/src/core/services/StorageRootService.ts` (validate method)

**Validation Checks**:
1. ✅ **Directory Exists**: Auto-recreates if missing
2. ✅ **Directory Writable**: Tests with temp file write/delete
3. ✅ **Disk Space**: Warns if < 5% available
4. ✅ **Path Consistency**: Updates path if Documents location changed
5. ❌ **Directory Integrity**: Corruption detection NOT IMPLEMENTED

**Fallback Behavior**:
- ✅ Unwritable Documents → Falls back to app data directory
- ✅ Low disk space → Emits warning event (doesn't block)
- ✅ Missing directory → Auto-recreates

### Quarantine (Partially Implemented)
**Quarantine Folder**: `{storageRoot}/.quarantine/`

**Implemented**:
- ✅ Quarantine folder created during initialization
- ✅ `getQuarantinedFiles()` method lists quarantined files
- ✅ `incrementQuarantine()` action in storageStore

**Missing**:
- ❌ Corruption detection logic (JSON parsing, schema validation)
- ❌ Automatic quarantine move on corruption detection
- ❌ Quarantine file naming: `{FileName}_YYYYMMDD_HHMMSS.sws.corrupted`

## Checklist
- [x] Implement path existence/writable checks with auto-recreate where valid
- [x] Add low-disk threshold checks and warning signaling
- [ ] ⚠️ **Implement corruption detection and quarantine move logic**
- [x] Track quarantine metrics in storage state
- [x] Ensure quarantine folder structure and retention policy hooks
- [ ] ⚠️ **Add tests for validation and quarantine paths**

## Acceptance Criteria
- [x] Missing directories are recreated when possible
- [x] Non-writable root returns actionable validation errors
- [ ] ⚠️ **Corrupted file is moved to `.quarantine` not deleted**
- [ ] ⚠️ **Quarantine counters/timestamps update after move**
- [x] Low-disk threshold generates warning event
- [x] Validation runs on every app launch
- [x] Validation warnings stored in state

## Test Cases
- [x] Unit: missing directories are recreated when possible
- [x] Unit: non-writable root returns actionable validation errors
- [ ] ⚠️ **Unit: corrupted file is moved to `.quarantine` not deleted**
- [ ] ⚠️ **Unit: quarantine counters/timestamps update after move**
- [x] Integration: low-disk threshold generates warning event
- [ ] ⚠️ **Integration: corrupted project triggers quarantine workflow**

## Definition of Done
- [x] Validation implementation merged with passing tests
- [ ] ⚠️ **Quarantine detection and move logic implemented**
- [ ] ⚠️ **Acceptance criteria from Core Flows and Tech Plan satisfied**
- [ ] ⚠️ **Tests cover corruption detection and quarantine scenarios**

## Implementation Notes
🟡 **Partially complete**. Validation is fully implemented in `StorageRootService.validate()`. Quarantine infrastructure exists but corruption detection logic is missing.

**Action Required**:
1. Implement corruption detection:
   - Parse `.sws` files as JSON
   - Validate against schema
   - Detect malformed/incomplete projects
2. Implement quarantine move:
   - Move corrupted files to `.quarantine/{projectId}/`
   - Rename with timestamp: `{FileName}_YYYYMMDD_HHMMSS.sws.corrupted`
   - Update quarantine counter in store
3. Add tests for corruption scenarios

**Suggested Implementation Location**:
- Create `hvac-design-app/src/core/services/validation/` directory
- Add `detectCorruption.ts` and `quarantineFile.ts` modules
- Integrate into `StorageRootService.validate()` or project load flow
