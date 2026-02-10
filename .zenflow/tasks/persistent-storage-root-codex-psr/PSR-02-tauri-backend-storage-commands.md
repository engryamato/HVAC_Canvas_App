# PSR-02: Tauri Backend Storage Commands
- Phase: Phase 1: Foundation & Infrastructure
- Dependencies: None
- Status: ✅ **COMPLETED**

## Objective
Implement Rust commands for storage-root discovery, validation, disk-space checks, and directory/file listing helpers.

## Spec References
- **Core Flows**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="c67b5d33-0683-432c-a167-6eef71ca51f2" title="Core Flows - Persistent Storage Root">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/c67b5d33-0683-432c-a167-6eef71ca51f2`</traycer-spec>
  - Flow 1: First Launch (Documents path resolution)
  - Flow 2: Subsequent Launch (Validation checks)
  - Flow 7: Permission Failure Fallback (App data path)
- **Tech Plan**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="09530bad-8225-4708-82bf-8b821aca0b7d" title="">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/09530bad-8225-4708-82bf-8b821aca0b7d`</traycer-spec>
  - Section: Component Architecture → Layer 1: Tauri Backend
  - Section: Tauri Command Organization

## Implementation Details

### File Locations
- `hvac-design-app/src-tauri/src/commands/storage_root.rs`
- `hvac-design-app/src-tauri/src/commands/mod.rs`
- `hvac-design-app/src-tauri/src/lib.rs` (command registration)

### Commands Implemented
1. **`resolve_storage_root() -> StorageRootInfo`**
   - Returns Documents path, app data path, and recommended path
   - Platform-specific resolution (Windows/macOS/Linux)

2. **`validate_storage_root(path: String) -> ValidationResult`**
   - Checks directory exists and is writable
   - Tests write permissions with temp file
   - Returns disk space information

3. **`get_disk_space(path: String) -> DiskSpaceInfo`**
   - Queries available and total disk space
   - Calculates percentage available
   - Platform-specific implementation

4. **`create_directory(path: String, recursive: bool) -> Result<(), String>`**
   - Creates directory with error handling
   - Supports recursive creation

5. **`list_directory_files(path: String, extension: String) -> Vec<String>`**
   - Lists files with specific extension
   - Used for scanning `.sws` files during migration

## Checklist
- [x] Add `src-tauri/src/commands/storage_root.rs` command functions
- [x] Define serializable response structs for root info, validation, and disk metrics
- [x] Implement writable-path validation with temp-file checks
- [x] Implement disk space query per platform support in existing stack
- [x] Register new commands in `src-tauri/src/lib.rs` and `commands/mod.rs`
- [x] Add Rust tests for happy and failure paths

## Acceptance Criteria
- [x] Commands return platform-specific paths correctly
- [x] Validation detects unwritable directories
- [x] Disk space returns accurate values with sane bounds
- [x] Directory creation handles existing paths gracefully
- [x] File listing filters by extension correctly
- [x] All commands handle errors with descriptive messages

## Test Cases
- [x] Rust: resolve returns docs/appdata/recommended paths
- [x] Rust: validate marks unwritable paths correctly
- [x] Rust: disk-space command returns numeric values with sane bounds
- [x] Rust: create-directory handles recursive create and existing path
- [x] Rust: list-directory-files filters by extension and handles missing path errors
- [x] Platform: Windows UNC paths handled correctly
- [x] Platform: macOS sandboxed environment permissions respected
- [x] Platform: Linux XDG directories resolved correctly

## Definition of Done
- [x] Implementation completed with passing targeted tests
- [x] Acceptance criteria from Core Flows and Tech Plan satisfied
- [x] Commands registered and accessible from TypeScript
- [x] Error handling provides actionable messages

## Implementation Notes
✅ **Fully implemented and tested**. Commands provide cross-platform storage root resolution and validation.
