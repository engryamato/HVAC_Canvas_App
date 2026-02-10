# Plan: Persistent Storage Root

## Goal
Deliver a persistent storage root architecture for project files with migration, validation, quarantine handling, and UI controls, while preserving backward compatibility during rollout.

## Scope
In scope:
- Storage root configuration and persistence
- Tauri storage-root command surface
- Operation queue and locking model
- Storage service + repository policy layer
- One-time migration + startup validation/quarantine
- App initialization integration
- Settings + quarantine UI + live reload notifications
- Automated test coverage + structured logging

Out of scope:
- Cloud sync backends
- Log viewer UI
- Any non-storage product feature work

## Socratic Gate (Resolved)
- Goal: Make storage deterministic, recoverable, and user-manageable across app restarts and upgrades.
- Scope boundaries: No cloud provider integration and no redesign of existing path-agnostic adapter internals.
- Constraints: Keep `StorageAdapter` path-agnostic, enforce policy in repository/service, support Tauri + web behavior.
- Edge cases: disk full, permission errors, transient file locks, corrupted files, duplicate filenames during migration.
- Verification: unit + integration + Playwright E2E plus platform-specific path/permission scenarios.

## Ticket Breakdown

### Phase 1: Foundation & Infrastructure

#### PSR-01 — Storage Store & Configuration Layer
Dependencies: None
Includes:
- `storageStore.ts` with root path/type, migration state, validation, quarantine counters
- Zustand persist (`localStorage` key: `sws.storage`)
Acceptance criteria:
- Store survives reload and restores state correctly
- Migration/validation/quarantine actions update state predictably
- Unit tests cover state transitions and persistence hydration

#### PSR-02 — Tauri Backend Storage Commands
Dependencies: None
Includes:
- `resolve_storage_root`, `validate_storage_root`, `get_disk_space`, `create_directory`, `list_directory_files`
- Command registration wiring in `src-tauri/src/lib.rs`
Acceptance criteria:
- Commands compile and return typed payloads
- Permission and invalid-path failures return clear errors
- Rust tests cover happy path + failure path for each command

#### PSR-03 — Operation Queue & Concurrency Control
Dependencies: None
Includes:
- Keyed FIFO queues (`root`, `project:{uuid}`)
- Retry policy for transient errors (3 attempts, exponential backoff)
- Lock acquisition and operation history
Acceptance criteria:
- Serial execution per key, parallelism across different project keys
- Root lock blocks project operations during migration/relocation
- Unit tests verify ordering, retries, lock release, and fail-fast behavior

### Phase 2: Core Services

#### PSR-04 — StorageRootService
Dependencies: PSR-01, PSR-02, PSR-03
Includes:
- `initialize`, `validate`, `relocate`, fallback path logic
- EventTarget events (`storageRoot:changed`, `migration:state`, `operation:error`)
- Factory/global cache pattern
Acceptance criteria:
- First-run initializes writable root and required folders
- Startup validation surfaces warnings/errors correctly
- Relocation updates store and emits expected events

#### PSR-05 — ProjectRepository Policy Layer
Dependencies: PSR-01, PSR-03, PSR-04
Includes:
- CRUD through canonical layout `{root}/projects/{uuid}/...`
- Metadata management (`meta.json` and new storage fields)
- Import/export escape hatches and event emission
Acceptance criteria:
- Save/load/list/delete honor storage root policy
- Import copies external files into canonical layout
- Events fire for single-project and bulk changes

### Phase 3: Migration & Integrity

#### PSR-06 — Migration Module
Dependencies: PSR-02, PSR-04, PSR-05
Includes:
- Standalone `runMigration(context)`
- Multi-location scan, copy/verify/update index, conflict rename
- Migration result reporting
Acceptance criteria:
- Existing legacy projects migrate into UUID structure
- Conflicts auto-resolve without data loss
- Failures are reported per-file without crashing whole migration

#### PSR-07 — Validation & Quarantine System
Dependencies: PSR-02, PSR-04, PSR-05
Includes:
- Startup checks (existence, writable, disk threshold, path consistency)
- Corruption detection and `.quarantine/` management
Acceptance criteria:
- Missing directories auto-recreate when possible
- Corrupt artifacts are moved (not deleted) and tracked
- Disk-space warning threshold triggers warning state

### Phase 4: UI Integration

#### PSR-08 — App Initialization Integration
Dependencies: PSR-04, PSR-06, PSR-07
Includes:
- `performStorageInitialization()` in app startup sequence
- Critical failure handling and startup gating
Acceptance criteria:
- Storage initialization runs before integrity checks
- Fatal storage failures block unsafe startup and show user-facing error path

#### PSR-09 — Settings Dialog: Storage Section
Dependencies: PSR-04, PSR-05
Includes:
- Current root path display
- Change-location action with directory picker
- Quarantine entry point
Acceptance criteria:
- User can view and relocate storage root from settings
- Relocation progress/errors are visible and recoverable

#### PSR-10 — Quarantine Manager Dialog
Dependencies: PSR-05, PSR-07
Includes:
- List quarantined files with actions (open, delete, clear all)
Acceptance criteria:
- All quarantine actions work reliably and refresh UI state
- Destructive actions require confirmation

#### PSR-11 — Live Reload & Notifications
Dependencies: PSR-04, PSR-05, PSR-08
Includes:
- `useStorageRoot()` hook + event-to-store bridge
- Disk-space and relocation toasts
- Project list auto-refresh on storage events
Acceptance criteria:
- UI updates immediately on storage/repository events
- Warning and progress notifications appear at correct moments

### Phase 5: Testing & Operational Hardening

#### PSR-12 — Automated Test Suite
Dependencies: PSR-01 through PSR-11
Includes:
- Unit tests (queue, migration, repository, store)
- Integration tests (initialize/import/relocate)
- E2E tests (first launch, external open/import, relocation, quarantine)
Acceptance criteria:
- Tests pass in CI for core scenarios
- Edge/failure cases are covered for migration and permissions

#### PSR-13 — Logging & Error Handling
Dependencies: PSR-04 through PSR-11
Includes:
- Structured storage logging in app data directory
- Rotation policy (10 MB x 5 files)
- Error taxonomy and typed propagation to UI
Acceptance criteria:
- Operational errors are traceable end-to-end (Rust -> TS -> UI)
- Logs rotate as specified and avoid unbounded growth

## Dependency Chain
Parallel start:
- PSR-01, PSR-02, PSR-03

Critical path:
- PSR-01 -> PSR-04 -> PSR-05 -> PSR-06 -> PSR-08 -> PSR-11 -> PSR-12

Secondary branch:
- PSR-02 -> PSR-07 -> PSR-10
- PSR-04/PSR-05 -> PSR-09
- PSR-04..PSR-11 -> PSR-13

## Suggested Milestones
1. M1 (Infra ready): PSR-01..PSR-03
2. M2 (Core ready): PSR-04..PSR-05
3. M3 (Data safety ready): PSR-06..PSR-07
4. M4 (User-visible complete): PSR-08..PSR-11
5. M5 (Release-ready): PSR-12..PSR-13

## Notes
- Keep `StorageAdapter`/`TauriStorageAdapter` policy-free.
- Enforce storage-root policy only in `ProjectRepository` and `StorageRootService`.
- Execute migration/relocation under global root queue lock to preserve consistency.
