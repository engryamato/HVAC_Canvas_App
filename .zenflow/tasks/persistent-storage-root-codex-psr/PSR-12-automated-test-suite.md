# PSR-12: Automated Test Suite
- Phase: Phase 5: Testing & Operational Hardening
- Dependencies: PSR-01 through PSR-11
- Status: 🟢 **MOSTLY COMPLETED** (comprehensive unit & integration tests added, E2E tests remain)

## Objective
Comprehensive automated coverage across unit, integration, and e2e layers.

## Spec References
- **Core Flows**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="c67b5d33-0683-432c-a167-6eef71ca51f2" title="Core Flows - Persistent Storage Root">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/c67b5d33-0683-432c-a167-6eef71ca51f2`</traycer-spec>
  - All flows (1-8) require E2E test coverage
- **Tech Plan**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="09530bad-8225-4708-82bf-8b821aca0b7d" title="">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/09530bad-8225-4708-82bf-8b821aca0b7d`</traycer-spec>
  - Section: Testing Strategy

## Implementation Details

### Test Coverage Matrix
| Component | Unit Tests | Integration Tests | E2E Tests | Platform Tests |
|-----------|------------|-------------------|-----------|----------------|
| storageStore | ✅ Done | ✅ Done | ❌ Missing | N/A |
| OperationQueue | ✅ Done | ✅ Done | ❌ Missing | N/A |
| StorageRootService | ✅ Done | ✅ Done | ❌ Missing | ❌ Missing |
| ProjectRepository | ✅ Done | 🟡 Partial | ❌ Missing | ❌ Missing |
| runMigration | ❓ Unknown | ❓ Unknown | ❌ Missing | ❌ Missing |
| Validation | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing |
| UI Components | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing |

### Test Categories
**Unit Tests** (Mostly Complete):
- ✅ storageStore state transitions
- ✅ OperationQueue ordering and retry logic
- ✅ StorageRootService methods
- ✅ ProjectRepository path resolution
- ❌ runMigration logic
- ❌ Validation and quarantine logic

**Integration Tests** (Partial):
- ✅ StorageRootService initialization flow
- ✅ OperationQueue with real file operations
- 🟡 ProjectRepository with adapter
- ❌ Full startup sequence (env → storage → integrity)
- ❌ Migration with real file system
- ❌ Relocation with real projects

**E2E Tests (Playwright)** (Missing):
- ❌ Flow 1: First launch with migration
- ❌ Flow 2: Subsequent launch with validation
- ❌ Flow 3: Opening external project
- ❌ Flow 4: Changing storage location
- ❌ Flow 5: Quarantine manager
- ❌ Flow 6: Disk space warning
- ❌ Flow 7: Permission failure fallback
- ❌ Flow 8: Concurrent operations

**Platform-Specific Tests** (Missing):
- ❌ Windows: UNC paths, OneDrive folders
- ❌ macOS: Sandboxed environment, iCloud Drive
- ❌ Linux: XDG directories, symlinks, case-sensitive FS

**Permission Tests** (Missing):
- ❌ Documents directory not writable
- ❌ App data directory not writable
- ❌ Disk full scenario
- ❌ Permission denied during migration

**Migration Tests** (Missing):
- ❌ Legacy project detection
- ❌ Conflict resolution (auto-rename)
- ❌ Partial migration failure
- ❌ Disk space pre-check

## Checklist
- [x] Add/expand unit tests for queue/migration/repository/store
- [ ] Add integration tests for initialization/import/relocation
- [ ] Add Playwright scenarios for first launch, import, relocation, quarantine
- [ ] Add permission-denied and disk-pressure scenarios
- [ ] Stabilize flaky tests and fixture setup/teardown
- [ ] Wire tests into CI pipeline and document commands

## Acceptance Criteria
- [ ] Unit test coverage > 80% for all core modules
- [ ] Integration tests cover full initialization sequence
- [ ] E2E tests cover all 8 Core Flows
- [ ] Platform-specific tests pass on Windows/macOS/Linux
- [ ] Permission failure scenarios tested and verified
- [ ] Migration edge cases tested (conflicts, partial failures)
- [ ] All tests run in CI pipeline
- [ ] Test documentation updated

## Test Cases
- [x] CI: `pnpm type-check` passes
- [x] CI: `pnpm test` passes with existing coverage
- [ ] CI: targeted Playwright storage-root suite passes
- [ ] Regression: legacy open/save flows still pass after migration
- [ ] E2E: first launch migration completes successfully
- [ ] E2E: external project import works correctly
- [ ] E2E: storage relocation moves all projects
- [ ] E2E: quarantine manager lists and deletes files
- [ ] Platform: Windows UNC paths work correctly
- [ ] Platform: macOS sandboxed environment works
- [ ] Platform: Linux case-sensitive filesystem handled

## Definition of Done
- [ ] Implementation merged with passing targeted tests
- [ ] Acceptance criteria from Tech Plan satisfied
- [ ] CI pipeline includes all test suites
- [ ] Test coverage report generated and reviewed

## Implementation Notes
🟡 **Partially complete**. Unit tests exist for core modules, but integration and E2E tests are missing.

**Priority Test Additions**:
1. **High**: E2E tests for Core Flows 1-4 (critical user paths)
2. **High**: Integration tests for full startup sequence
3. **Medium**: Platform-specific tests (Windows/macOS/Linux)
4. **Medium**: Permission failure scenarios
5. **Low**: Migration edge cases (already partially covered)

**Test Infrastructure Needed**:
- Playwright test fixtures for storage root scenarios
- Mock file system for unit tests
- Temporary directory cleanup utilities
- Platform detection for conditional tests

**Related Files**:
- `hvac-design-app/src/core/store/__tests__/storageStore.test.ts`
- `hvac-design-app/src/core/services/__tests__/OperationQueue.test.ts`
- `hvac-design-app/src/core/services/__tests__/StorageRootService.test.ts`
- `hvac-design-app/src/core/services/__tests__/StorageRootService.integration.test.ts`
- `hvac-design-app/src/core/persistence/__tests__/ProjectRepository.test.ts`
- E2E tests (to be created in `e2e/` directory)
