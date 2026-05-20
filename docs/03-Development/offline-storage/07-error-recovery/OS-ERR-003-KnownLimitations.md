# Offline Storage: Known Limitations

## 1. Overview

### Purpose
Document the **known limitations and gaps** in the offline storage implementation, including features documented but not implemented, discrepancies, and future enhancements.

### Scope
- Features documented but not implemented
- Implementation vs documentation discrepancies
- Technical limitations
- Missing features from PRD
- Workarounds and mitigation strategies

### Last Updated
- **Date**: 2026-01-09
- **Review Cycle**: Quarterly

---

## 2. Documentation-to-Code Discrepancies

### Critical Discrepancies

| Feature | Documentation Says | Code Actually Does | Impact | Resolution |
|---------|-------------------|-------------------|--------|-----------|
| **Auto-save interval** | 300 seconds | 2000ms debounce | Medium | Align implementation to 300s spec |
| **Backup retention** | Keep 5 autosaves | Only keeps 1 `.bak` file | Medium | Implement rotation or update docs |
| **IndexedDB** | Rejected | Not implemented | Low | Remove IndexedDB references |
| **Retry logic** | "Retry 3x on file lock" | No retry implemented | Medium | Implement or remove from docs |
| **Idle detection** | "Pause after 30+ minutes" | Not implemented | Low | Implement or remove from docs |

### Source Documents

- **PRD.md:441** - localStorage specified for web persistence
- **UJ-FM-002** - 5-minute auto-save interval documented
- **UJ-FM-009** - Keep 5 backup versions documented
- **UJ-FM-002** - Retry logic documented

---

## 3. Persistence Layer Limitations

### localStorage Limitations

| Limitation | Impact | Current Workaround | Future Fix |
|------------|--------|-------------------|------------|
| **5MB quota** | Large projects can't be cached | Use .sws files for large projects | Encourage export/splitting |
| **Synchronous I/O** | Can block UI on large saves | Keep project size reasonable | Use Web Worker |
| **No encryption** | Data stored in plain text | Desktop app has OS-level protection | Add encryption layer |
| **No structured queries** | Can't search projects efficiently | Load all projects to search | No alternative storage planned |
| **Browser-dependent** | Quota varies by browser | None | Document browser requirements |

**Current Usage**:
- Preferences: ~1KB
- Project list: ~10KB
- **Project Data**: Stored in localStorage

### .sws File System Limitations

| Limitation | Impact | Current Workaround | Future Fix |
|------------|--------|-------------------|------------|
| **No atomic writes** | Corruption possible on crash | Backup file exists | Write to temp, then rename |
| **No file locking** | Concurrent edits possible | Don't open in multiple apps | Implement file locks |
| **No compression** | Large files (10MB+) slow | None | Implement gzip compression |
| **Tauri-only** | Doesn't work in web browser | Web uses localStorage only | Add HTML file upload/download |
| **No version control** | No history beyond 1 backup | Manual backups | Implement git-like versioning |

---

## 4. Missing Features from PRD

### Not Implemented (Documented as Features)

#### 4.1 Retry Logic on File Lock

**PRD Reference**: UJ-FM-002

**Documented Behavior**:
> "If file is locked by another process, retry up to 3 times with 1-second delay"

**Actual Behavior**: No retry logic implemented

**Impact**: Save fails immediately if file is locked

**Workaround**: User must close other application and retry manually

**Implementation Effort**: 1-2 days

```typescript
// Proposed implementation
async function saveProjectWithRetry(project: ProjectFile, path: string, maxRetries = 3): Promise<IOResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await saveProject(project, path);

    if (result.success) {
      return result;
    }

    if (result.error?.includes('locked') && attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
      continue;
    }

    return result; // Give up
  }

  return { success: false, error: 'Failed after 3 retries' };
}
```

#### 4.2 Backup Rotation (5 Versions)

**PRD Reference**: UJ-FM-009

**Documented Behavior**:
> "Keep last 5 saved versions as numbered backups"

**Actual Behavior**: Only 1 backup kept (`.bak` file)

**Impact**: Can't recover from multiple mistakes

**Workaround**: Manual file copies

**Implementation Effort**: 2-3 days

See [OS-ERR-002](./OS-ERR-002-BackupRecovery.md) Section 8 for proposed implementation.

#### 4.3 Idle Detection (30-Minute Pause)

**PRD Reference**: UJ-FM-002

**Documented Behavior**:
> "Auto-save pauses after 30 minutes of inactivity"

**Actual Behavior**: Auto-save always runs (no idle detection)

**Impact**: Unnecessary saves if user is away

**Workaround**: None needed (localStorage writes are cheap)

**Implementation Effort**: 1 day

```typescript
// Proposed implementation
function useIdleDetection(idleTimeout = 30 * 60 * 1000) {
  const [isIdle, setIsIdle] = useState(false);
  const idleTimer = useRef<NodeJS.Timeout>();

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIsIdle(true), idleTimeout);
  }, [idleTimeout]);

  useEffect(() => {
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      clearTimeout(idleTimer.current);
    };
  }, [resetIdleTimer]);

  return isIdle;
}

// Usage in useAutoSave
const isIdle = useIdleDetection();
const enabled = options.enabled && !isIdle;
```

#### 4.4 IndexedDB Cache Layer (Rejected)

**PRD Reference**: PRD.md:441

**Documented Behavior**: localStorage-only persistence; no IndexedDB

**Status**: ❌ Rejected (localStorage-only policy)

**Implementation Plan**: None

---

## 5. Migration System Limitations

### Only v1.0.0 Supported

**Current State**: Migration framework exists but only handles v1.0.0 (no-op)

**Impact**: Cannot open files from older versions

**Workaround**: None (no older versions exist yet)

**Future Issue**: When v1.1.0 releases, need to implement migration handlers

**Prevention**: Add migration handlers proactively for each new version

See [OS-MIG-002](../06-migration/OS-MIG-002-MigrationImplementation.md) for migration details.

---

## 6. Error Handling Limitations

### Silent Failures

| Operation | Failure Mode | User Notification | Impact |
|-----------|-------------|-------------------|--------|
| **localStorage save** | Quota exceeded | None | Auto-save stops working silently |
| **Backup creation** | Disk full | None | No backup protection |
| **Zustand persist** | localStorage disabled | None | Preferences not saved |
| **File lock** | Another process has file | Error toast | Save fails, must retry manually |

**Recommendation**: Add notifications for all silent failures

### No Progress Indicators

**Missing**:
- Large file save progress (>1MB)
- Large file load progress
- Migration progress (for complex transformations)

**Impact**: User doesn't know if app is frozen or working

**Workaround**: Generic loading spinner

**Implementation Effort**: 1 week

```typescript
// Proposed: Progress events
interface ProgressEvent {
  operation: 'save' | 'load' | 'migrate';
  progress: number; // 0-100
  message: string;
}

// Emit during serialization
function serializeProjectWithProgress(project: ProjectFile): Observable<ProgressEvent> {
  // Emit progress at 25%, 50%, 75%, 100%
}
```

---

## 7. Schema and Validation Limitations

### No Runtime Type Validation Beyond Zod

**Current**: Zod validates structure, not business logic

**Missing**:
- Entity connection validation (are connected entities valid?)
- Circular reference detection
- Entity constraint validation (e.g., duct can't connect to itself)

**Impact**: Invalid data can pass schema validation

**Workaround**: Validate at application layer (canvas components)

**Future Enhancement**: Add business logic validation layer

```typescript
// Proposed: Business logic validation
function validateEntityConnections(entities: NormalizedEntities): ValidationResult {
  const errors: string[] = [];

  for (const id of entities.allIds) {
    const entity = entities.byId[id];

    if (entity.type === 'duct' && entity.connectedTo) {
      // Validate connection exists
      if (!entities.byId[entity.connectedTo]) {
        errors.push(`Duct ${id} connects to non-existent entity ${entity.connectedTo}`);
      }

      // Validate no self-connection
      if (entity.connectedTo === id) {
        errors.push(`Duct ${id} connects to itself`);
      }
    }
  }

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true, errors: [] };
}
```

---

## 8. Performance Limitations

### Large Project Handling

| Project Size | Entities | Load Time | Save Time | Impact |
|--------------|----------|-----------|-----------|--------|
| Small | 10-100 | <50ms | <50ms | None |
| Medium | 100-1,000 | <100ms | <100ms | Acceptable |
| Large | 1,000-10,000 | 100-500ms | 100-500ms | Noticeable delay |
| Very Large | 10,000+ | 500ms-2s | 500ms-2s | Poor UX |

**Current Target**: 1,000 entities (typical HVAC project)

**Limitations for Very Large Projects**:
1. **Synchronous validation**: Blocks UI during Zod parse
2. **No incremental loading**: Must load entire project
3. **No lazy serialization**: Serializes all data at once
4. **JSON.stringify blocking**: Freezes UI for >500ms

**Workarounds**:
- Show loading spinner for >100ms operations
- Warn users about large projects

**Future Optimizations**:
1. **Web Worker**: Offload serialization/validation
2. **Streaming**: Parse/serialize in chunks
3. **Lazy validation**: Validate on-demand
4. **Entity pagination**: Load visible entities first

---

## 9. Security and Privacy Limitations

### No Encryption

**Current**: All data stored in plain text

**Risk**:
- localStorage readable by any JavaScript
- .sws files readable with text editor
- Browser extensions can access localStorage

**Mitigation**:
- Desktop app (Tauri) has OS-level file permissions
- Web app should only be used in trusted environments

**Future Enhancement**: Add encryption layer

```typescript
// Proposed: Encryption layer
import { encrypt, decrypt } from '@/lib/crypto';

async function saveProjectEncrypted(project: ProjectFile, path: string, password: string) {
  const serialized = serializeProject(project);
  const encrypted = await encrypt(serialized.data!, password);
  await writeTextFile(path, encrypted);
}

async function loadProjectEncrypted(path: string, password: string) {
  const encrypted = await readTextFile(path);
  const decrypted = await decrypt(encrypted, password);
  return deserializeProject(decrypted);
}
```

### No Access Control

**Current**: No user authentication, all files accessible

**Risk**: Anyone with access to device can open files

**Mitigation**: OS-level file permissions (desktop), browser origin policy (web)

**Future Enhancement**: Add password protection for sensitive projects

---

## 10. Browser Compatibility Limitations

### localStorage Disabled

**Scenarios**:
- Incognito/private browsing mode
- Browser settings (cookies disabled)
- Corporate security policies

**Impact**: Auto-save and preferences don't persist

**Detection**:
```typescript
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Show warning if unavailable
if (!isLocalStorageAvailable()) {
  toast.warning('localStorage is disabled. Auto-save will not work. Please enable cookies and try again.');
}
```

### Tauri Not Available (Web Browser)

**Scenario**: User tries to save .sws file in web browser

**Impact**: File system operations fail

**Workaround**: Use HTML download API

```typescript
// Fallback for web: Download as file
async function downloadProjectFile(project: ProjectFile, filename: string) {
  const serialized = serializeProject(project);
  const blob = new Blob([serialized.data!], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
```

---

## 11. Testing Gaps

### Missing Test Coverage

| Area | Coverage | Missing Tests |
|------|----------|---------------|
| **Corruption detection** | Partial | Bit-level corruption, incomplete writes |
| **Migration** | None | Multi-version migrations, migration errors |
| **Backup recovery** | Good | Backup corruption mid-write |
| **localStorage quota** | None | Quota exceeded scenarios |
| **Concurrent access** | None | Multiple tabs, file locks |
| **Performance** | None | Large file benchmarks |

**Recommendation**: Add integration tests for missing scenarios

---

## 12. Documentation Gaps

### Missing Documentation

1. **User guide**: How to manually backup projects
2. **Troubleshooting**: Common errors and solutions
3. **Performance guide**: Optimizing for large projects
4. **Security guide**: Protecting sensitive data
5. **Migration guide**: Upgrading from older versions

**Recommendation**: Create user-facing documentation in addition to technical docs

---

## 13. Roadmap for Addressing Limitations

### Phase 1.1 (Next Minor Release)

**Priority**: High-impact, low-effort

1. Add retry logic for file locks (2 days)
2. Add error notifications for silent failures (3 days)
3. Document auto-save timing (300s spec) (1 day)
4. Add localStorage quota check (1 day)

**Total Effort**: ~1 week

### Phase 1.2 (Following Minor Release)

**Priority**: Medium-impact, medium-effort

1. Implement backup rotation (5 versions) (3 days)
2. Add progress indicators for large files (1 week)
3. Add business logic validation layer (1 week)
4. Improve error messages (2 days)

**Total Effort**: ~3 weeks

### Phase 2.0 (Major Release)

**Priority**: High-impact, high-effort

1. Atomic writes (write to temp, rename) (1 week)
2. Web Worker for large files (2 weeks)
3. Encryption layer (2 weeks)
4. File locking (1 week)

**Total Effort**: ~9 weeks

---

## 14. Related Documentation

### Prerequisites
- [Implementation Status](../IMPLEMENTATION_STATUS.md)
- All other offline storage docs

### External References
- PRD.md - Original requirements
- User Journey docs - Documented behavior

---

## 15. Changelog

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-01-09 | 1.0.0 | Initial known limitations documentation | System |

---

## 16. Notes

### How to Use This Document

1. **Planning**: Reference when planning new features
2. **User Support**: Reference when debugging user issues
3. **Prioritization**: Use roadmap to prioritize fixes
4. **Documentation**: Cross-reference when writing docs
5. **Testing**: Identify gaps in test coverage

### Review Process

**Frequency**: Quarterly or after each major release

**Process**:
1. Review all documented limitations
2. Check if any have been fixed
3. Add new limitations discovered
4. Update roadmap priorities
5. Update related documentation

### Contributing

When adding new limitations:
1. **Describe clearly**: What is the limitation?
2. **Provide impact**: How does it affect users?
3. **Suggest workaround**: How can users work around it?
4. **Estimate effort**: How long to fix?
5. **Link to issues**: Reference GitHub issues if any
