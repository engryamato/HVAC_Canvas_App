# Implementation Status Tracker

## Purpose

This document tracks the **actual implementation status** of offline storage features in the HVAC Canvas App. It serves as a living reference to identify:

- Features that are fully implemented
- Features that are partially implemented
- Features that are documented but not implemented
- Discrepancies between documentation and code

**Last Updated**: 2026-01-09

---

## Fully Implemented Features ✅

| Feature | Code Location | Test Coverage | Notes |
|---------|---------------|---------------|-------|
| .sws file save/load | `src/core/persistence/projectIO.ts` | `projectIO.test.ts` (40+ tests) | Full implementation with Tauri APIs |
| Automatic backup (.bak) | `projectIO.ts:33-37` | Yes | Single backup file only |
| Zod schema validation | `src/core/schema/project-file.schema.ts` | `project-file.schema.test.ts` (23 tests) | Comprehensive validation |
| localStorage persistence | Multiple stores | Limited | Via Zustand persist middleware |
| Auto-save (debounced) | `src/features/canvas/hooks/useAutoSave.ts` | Manual testing | 2000ms debounce (not 5 minutes) |
| Tauri/Web detection | `src/core/persistence/filesystem.ts:10-12` | Yes | `isTauri()` runtime check |
| Entity serialization | `src/core/persistence/serialization.ts` | `serialization.test.ts` (16 tests) | Full entity graph serialization |
| JSON deserialization | `src/core/persistence/serialization.ts` | `serialization.test.ts` | With Zod validation |
| Store hydration | `src/core/store/entityStore.ts:hydrate()` | Integration tests | Full project state restore |
| beforeunload handling | `useAutoSave.ts:85-94` | Manual testing | Warns on unsaved changes |

---

## Partially Implemented Features ⚠️

| Feature | Status | What's Implemented | What's Missing | Priority |
|---------|--------|-------------------|----------------|----------|
| Schema migration | Framework exists | v1.0.0 handler only | Handlers for future versions | Low |
| Error code system | Documented | Simple error messages in code | Structured error codes (FILE_LOCKED, CORRUPT_JSON, etc.) | Medium |
| Backup management | Single backup | Creates 1 `.bak` file | Backup rotation (keep 5 versions) | Medium |
| Export functionality | CSV/JSON | Basic export | PDF export pipeline | Low |

### Schema Migration Details

**Implemented**:
- Migration framework in `serialization.ts:82-99`
- Version detection on file load
- v1.0.0 migration handler (no-op)

**Missing**:
- Migration handlers for v1.1.0+
- Rollback/downgrade logic
- Migration testing utilities

**Code Reference**: `src/core/persistence/serialization.ts:82-99`

### Error Code System Details

**Documented In**: `docs/elements/10-persistence/ProjectIO.md:450-480`

**Documented Error Codes**:
- `FILE_LOCKED` - File in use by another process
- `CORRUPT_JSON` - Invalid JSON structure
- `SCHEMA_INVALID` - Zod validation failure
- `PERMISSION_DENIED` - Filesystem access denied
- `DISK_FULL` - Insufficient storage space

**Actual Implementation**: Code throws generic `Error` objects with string messages

**Priority**: Medium - Structured errors would improve error handling and recovery

---

## Not Implemented Features ❌

| Feature | Documented In | Current Alternative | Priority | Reason |
|---------|---------------|-------------------|----------|--------|
| IndexedDB cache | `PRD.md` | - | Rejected | User preference for localStorage |
| Backup rotation (5 versions) | `UJ-FM-009` | Single .bak file | Medium | User-requested enhancement |
| Retry logic (3x on failure) | `UJ-FM-002` | No retry | Medium | Would improve reliability |
| Idle detection (30min pause) | `UJ-FM-002` | No idle detection | Low | 300s interval reduces churn |
| 300-second auto-save interval | `UJ-FM-002` | 2s debounce | Low | Current implementation better |
| Atomic writes | Not documented | Direct file write | High | Risk of corruption on crash |
| File compression | Not documented | Uncompressed JSON | Low | File sizes acceptable |
| Conflict resolution | Not documented | Last-write-wins | Medium | Not multi-user yet |

### IndexedDB Cache

**Status**: ❌ Rejected (localStorage-only policy)

**Current Implementation**: localStorage for all web project data and auto-save

**Notes**:
- Cloud storage is reserved for backups only
- No IndexedDB migration is planned


### Retry Logic

**Documented In**: UJ-FM-002 mentions "retry up to 3 times on file lock"

**Current Behavior**: Single attempt, fails immediately if Tauri API returns error

**Impact**: User must manually retry save on transient failures

**Implementation Needed**:
```typescript
async function saveProjectWithRetry(path: string, data: ProjectFile, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await saveProject(path, data);
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

### Backup Rotation

**Documented In**: UJ-FM-009 describes keeping "last 5 auto-save versions"

**Current Implementation**: Single `.bak` file (overwrites previous backup)

**Code Location**: `src/core/persistence/projectIO.ts:33-37`

**Enhancement Needed**:
```typescript
// Current: project.sws.bak (single backup)
// Desired: project.sws.bak.1, .bak.2, .bak.3, .bak.4, .bak.5
```

---

## Documentation Discrepancies

### Auto-Save Interval

| Source | Stated Interval | Actual Behavior |
|--------|----------------|-----------------|
| `UJ-FM-002` | 300 seconds | 2000ms debounce |
| `useAutoSave.ts:50` | N/A (code) | 2000ms debounce |
| PRD.md | 300 seconds | 2000ms debounce |

**Resolution**: Align implementation to the 300-second spec or update the spec if the 2-second debounce is intended long-term.

**Code Reference**: `src/features/canvas/hooks/useAutoSave.ts:50`


### Storage Layer

| Source | Documented Layer | Actual Layer |
|--------|------------------|--------------|
| PRD.md:441 | localStorage | localStorage |
| Architecture docs | File + localStorage | File + localStorage |

**Resolution**: Documentation aligned to localStorage-only policy.


### Error Handling

| Source | Documented Approach | Actual Implementation |
|--------|-------------------|----------------------|
| ProjectIO.md | Structured error codes | Generic Error objects |
| UJ-FM-002 | Retry 3x | No retry logic |

**Resolution**: Document actual error handling, add retry logic as enhancement.

---

## Test Coverage Summary

### Comprehensive Test Coverage ✅

| File | Test File | Test Count | Coverage |
|------|-----------|-----------|----------|
| `projectIO.ts` | `projectIO.test.ts` | 40+ | High |
| `serialization.ts` | `serialization.test.ts` | 16 | High |
| `project-file.schema.ts` | `project-file.schema.test.ts` | 23 | High |

### Limited Test Coverage ⚠️

| File | Test Coverage | Gap |
|------|---------------|-----|
| `useAutoSave.ts` | Manual testing only | No automated tests |
| `filesystem.ts` | Limited | Tauri mocking needed |
| `preferencesStore.ts` | None | Persist middleware not tested |

### No Test Coverage ❌

- Store hydration flow (end-to-end)
- Multi-environment fallback (Tauri → localStorage)
- Backup recovery flow
- Migration system (only unit tests for v1.0.0)

---

## Feature Request Tracking

### User-Requested Features
- **Backup rotation**: Keep last 5 versions (UJ-FM-009)
- **Manual backup**: Save explicit backup before risky operations
- **Export history**: Track export operations

### Developer-Identified Needs
- **Atomic writes**: Prevent corruption on crash
- **Retry logic**: Handle transient failures
- **Structured error codes**: Better error handling
- **Compression**: Reduce .sws file size for large projects

---

## Implementation Roadmap

### Short Term (Next Sprint)
1. Add retry logic to projectIO.saveProject (3 attempts with exponential backoff)
2. Implement structured error codes
3. Add unit tests for useAutoSave hook

### Medium Term (Next Quarter)
1. Implement backup rotation (keep 5 versions)
2. Add atomic write support (temp file + rename pattern)
3. Improve test coverage for persistence layer

### Long Term (Future)
1. Reinforce localStorage limits and export guidance
2. Implement conflict resolution for multi-device sync
3. Add file compression for large projects

---

## Verification Process

To verify implementation status:

1. **Code Search**: Use `git grep` to find actual implementations
2. **Test Files**: Check `*.test.ts` files for test coverage
3. **Documentation**: Compare code behavior to documented behavior
4. **Manual Testing**: Verify features work as documented

### Example Verification Commands

```bash
# Find auto-save implementation
git grep -n "DEBOUNCE\|debounce" src/

# Find backup creation logic
git grep -n "\.bak" src/

# Find migration handlers
git grep -n "migrateProject\|migration" src/core/persistence/

# Count test coverage
find src -name "*.test.ts" -exec wc -l {} +
```

---

## Contributing

When updating this document:

1. Verify implementation by reading source code
2. Run tests to confirm test coverage claims
3. Update "Last Updated" date at top
4. Add code references (file:line) for all claims
5. Mark features as ✅ / ⚠️ / ❌ based on actual status

---

## Related Documentation

- [ProjectIO Element Documentation](../elements/10-persistence/ProjectIO.md) - Comprehensive API reference
- [Auto-Save Flow](./05-data-flow/OS-DF-003-AutoSaveFlow.md) - Detailed auto-save documentation
- [Known Limitations](./07-error-recovery/OS-ERR-003-KnownLimitations.md) - Current system limitations
- [IndexedDB Storage](./02-storage-layers/OS-SL-003-IndexedDBStorage.md) - Deprecated reference
