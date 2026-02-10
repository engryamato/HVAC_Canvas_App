# PSR-03: Operation Queue & Concurrency Control
- Phase: Phase 1: Foundation & Infrastructure
- Dependencies: None
- Status: ✅ **COMPLETED**

## Objective
Build keyed FIFO operation queue with root lock semantics and transient retry policy.

## Spec References
- **Core Flows**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="c67b5d33-0683-432c-a167-6eef71ca51f2" title="Core Flows - Persistent Storage Root">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/c67b5d33-0683-432c-a167-6eef71ca51f2`</traycer-spec>
  - Flow 8: Operation Queuing
  - Flow 4: Changing Storage Location (background operation)
- **Tech Plan**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="09530bad-8225-4708-82bf-8b821aca0b7d" title="">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/09530bad-8225-4708-82bf-8b821aca0b7d`</traycer-spec>
  - Section: Architectural Approach → Decision 3: Operation Queue with Retry Policy
  - Section: Component Architecture → Layer 2: Core Services

## Implementation Details

### File Location
- `hvac-design-app/src/core/services/OperationQueue.ts`
- `hvac-design-app/src/core/services/__tests__/OperationQueue.test.ts`

### Queue Keys
- **`root`**: Global lock for migration/relocation (blocks all operations)
- **`project:{uuid}`**: Per-project serialization (parallel projects, serial per-project)

### Retry Policy
- **Retry only**: File copy/move, directory creation
- **Transient errors**: EBUSY, EAGAIN, EINTR, "locked", "busy"
- **Permanent errors**: EPERM, ENOENT, ENOSPC, "permission denied", "not found"
- **Max attempts**: 3 retries with exponential backoff (100ms, 200ms, 400ms)
- **Fail fast**: Permanent errors and schema validation errors

### Operation History
- Bounded to last 100 operations
- Tracks: operation ID, key, type, timestamps, retry count, status, error

## Checklist
- [x] Implement keyed queue map and active-key tracking in `OperationQueue`
- [x] Support keys: `root` and `project:{uuid}` with per-key serialization
- [x] Implement lock acquire/release helper for root and project keys
- [x] Add retry for transient errors with exponential backoff (100/200/400ms)
- [x] Keep bounded operation history (last 100)
- [x] Add unit tests for ordering, lock behavior, and retry/fail-fast

## Acceptance Criteria
- [x] Operations execute in FIFO order per key
- [x] Different project keys execute independently (parallel)
- [x] Root lock blocks all project operations until released
- [x] Transient errors retry up to 3 times with backoff
- [x] Permanent errors fail immediately without retry
- [x] Operation history remains bounded (100 entries max)
- [x] Queue cleanup prevents memory leaks

## Test Cases
- [x] Unit: operations execute FIFO per key
- [x] Unit: different project keys can execute independently
- [x] Unit: root lock blocks project operations until released
- [x] Unit: transient errors retry up to max attempts
- [x] Unit: permanent errors fail without retry
- [x] Unit: operation history remains bounded
- [x] Unit: queue cleanup removes empty queues
- [x] Unit: concurrent enqueue operations handled correctly
- [x] Integration: migration blocks normal project operations

## Definition of Done
- [x] Implementation completed with passing targeted tests
- [x] Acceptance criteria from Core Flows and Tech Plan satisfied
- [x] Retry policy correctly distinguishes transient vs permanent errors
- [x] Memory usage bounded (history limit enforced)

## Implementation Notes
✅ **Fully implemented and tested**. Queue provides deterministic operation ordering with intelligent retry logic.
