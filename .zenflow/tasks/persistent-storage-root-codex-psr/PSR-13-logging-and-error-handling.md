# PSR-13: Logging & Error Handling
- Phase: Phase 5: Testing & Operational Hardening
- Dependencies: PSR-04 through PSR-11
- Status: 🟡 **PARTIALLY COMPLETED** (error handling exists, structured logging missing)

## Objective
Structured logging and end-to-end error taxonomy propagation.

## Spec References
- **Core Flows**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="c67b5d33-0683-432c-a167-6eef71ca51f2" title="Core Flows - Persistent Storage Root">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/c67b5d33-0683-432c-a167-6eef71ca51f2`</traycer-spec>
  - Logging section (log file location, rotation, format, levels)
- **Tech Plan**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="09530bad-8225-4708-82bf-8b821aca0b7d" title="">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/09530bad-8225-4708-82bf-8b821aca0b7d`</traycer-spec>
  - Section: Error Handling Strategy
  - Section: Logging (in Core Flows reference)

## Implementation Details

### Log File Configuration
**Location** (Platform-Specific):
- Windows: `%APPDATA%/SizeWise/logs/storage-root.log`
- macOS: `~/Library/Application Support/SizeWise/logs/storage-root.log`
- Linux: `~/.local/share/SizeWise/logs/storage-root.log`

**Rotation Policy**:
- Max file size: 10 MB
- Keep last 5 log files
- Rotate on app startup if current log exceeds max size
- Naming: `storage-root.log`, `storage-root.1.log`, ..., `storage-root.4.log`

**Log Format**:
```
[YYYY-MM-DD HH:MM:SS] [LEVEL] [Component] Message
```

**Example**:
```
[2025-02-09 14:30:22] [INFO] [StorageInit] Storage root initialized at C:\Users\John\Documents\SizeWise
[2025-02-09 14:30:23] [INFO] [Migration] Found 5 projects to migrate
[2025-02-09 14:30:25] [WARN] [Migration] Failed to migrate Project1.sws: Permission denied
[2025-02-09 14:30:26] [INFO] [Migration] Migration complete: 4 succeeded, 1 failed
```

### Log Levels
- **INFO**: Normal operations (initialization, validation passed, migration complete)
- **WARN**: Recoverable issues (storage root recreated, fallback to app data, low disk space)
- **ERROR**: Failures (migration failed, permission denied, corrupted files)

### Error Categories
**Implemented** (in OperationQueue):
- ✅ Transient errors: EBUSY, EAGAIN, EINTR (retry)
- ✅ Permanent errors: EPERM, ENOENT, ENOSPC (fail fast)

**Missing**:
- ❌ Structured error types (TypeScript classes)
- ❌ Error context propagation (operation ID, project ID, file path)
- ❌ User-friendly error messages mapping
- ❌ Logging infrastructure

### Error Propagation Flow
**Current** (Partial):
```
Rust Command Error → TypeScript catch → Console.error
```

**Required**:
```
Rust Command Error → Typed TS Error → Logger → User Message
                                      ↓
                                   Log File (structured)
```

## Checklist
- [ ] Implement storage logging sink in appdata logs directory
- [ ] Add rotation policy: 10 MB per file, keep 5 files
- [ ] Define and apply typed error categories across layers
- [ ] Map Rust command errors into typed TS domain errors
- [ ] Ensure user-facing messages are actionable and non-technical
- [ ] Add tests for logging and error-mapping behavior

## Acceptance Criteria
- [ ] Log file created in app data directory on first write
- [ ] Log rotation occurs when file exceeds 10 MB
- [ ] Old log files retained (up to 5 files)
- [ ] Log format matches spec: `[timestamp] [level] [component] message`
- [ ] All storage operations logged (init, validate, migrate, relocate)
- [ ] Errors categorized correctly (transient vs permanent)
- [ ] User-facing error messages are actionable
- [ ] Rust errors map to TypeScript domain errors with context

## Test Cases
- [ ] Unit: logger rotates files at size threshold
- [ ] Unit: categorized errors map to expected UI message classes
- [ ] Integration: Rust command failure reaches UI with context and category
- [ ] Integration: operational errors are recorded with component and timestamp
- [ ] Unit: log file cleanup removes oldest files when limit exceeded
- [ ] Integration: migration errors logged with project details

## Definition of Done
- [ ] Implementation merged with passing targeted tests
- [ ] Acceptance criteria from Core Flows and Tech Plan satisfied
- [ ] Logging infrastructure functional and tested
- [ ] Error taxonomy documented

## Implementation Notes
🟡 **Partially complete**. Error handling exists (transient vs permanent detection in OperationQueue), but structured logging infrastructure is missing.

**Implementation Steps**:
1. Create logging infrastructure:
   - `hvac-design-app/src/core/services/logging/Logger.ts`
   - `hvac-design-app/src/core/services/logging/LogRotation.ts`
2. Define error types:
   - `hvac-design-app/src/core/errors/StorageError.ts`
   - Error categories: `TransientError`, `PermanentError`, `ValidationError`, etc.
3. Integrate logger into services:
   - `StorageRootService`
   - `ProjectRepository`
   - `runMigration`
4. Map Rust errors to TypeScript errors
5. Add user-friendly error messages
6. Implement log rotation
7. Add tests for logging and error mapping

**Error Message Examples**:
- Technical: `EPERM: operation not permitted`
- User-Friendly: `Unable to access storage location. Please check folder permissions.`

**Related Files**:
- `hvac-design-app/src/core/services/logging/` (to be created)
- `hvac-design-app/src/core/errors/` (to be created)
- `hvac-design-app/src/core/services/StorageRootService.ts`
- `hvac-design-app/src/core/persistence/ProjectRepository.ts`
