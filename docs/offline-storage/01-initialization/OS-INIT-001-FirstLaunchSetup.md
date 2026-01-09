# OS-INIT-001: First Launch Setup

## Overview

This document describes the **first launch initialization** process for the HVAC Canvas App, covering:

- Environment detection (Tauri vs Web)
- Default directory setup
- Initial storage configuration
- Permission verification
- First-run experience

**Scope**: Application startup and initialization, not project-specific setup.

---

## Prerequisites

### Desktop (Tauri) Environment
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Tauri Runtime**: Embedded in application bundle
- **File System Access**: User Documents directory read/write permission
- **Storage**: Minimum 100MB free space recommended

### Web Browser Environment
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **localStorage**: Enabled (required)
- **Storage**: ~5MB localStorage quota
- **JavaScript**: Enabled

---

## User Journey Steps

### Step 1: Application Launch

**User Action**: User opens the HVAC Canvas App (double-click desktop app or navigate to web URL).

**System Actions**:
1. Initialize JavaScript runtime
2. Load React application bundle
3. Detect environment (Tauri vs Web)
4. Initialize Zustand stores

**Code Reference**: `hvac-design-app/src/main.tsx` (app entry point)

### Step 2: Environment Detection

**System Action**: Detect if running in Tauri desktop or web browser environment.

```typescript
// From filesystem.ts:9-11
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
```

**Outcomes**:
- **Desktop**: `isTauri()` returns `true` → Enable file system features
- **Web**: `isTauri()` returns `false` → Use localStorage-only mode

**Code Reference**: `hvac-design-app/src/core/persistence/filesystem.ts:9-11`

### Step 3: localStorage Hydration

**System Action**: Zustand persist middleware automatically reads from localStorage.

**Storage Keys Read**:
- `sws.preferences` → User preferences (theme, language, grid settings)
- `sws.projectIndex` → Dashboard project list
- `project-storage` → Current project metadata (if any)

**Outcomes**:
- **First launch**: No keys exist, use default initial state
- **Returning user**: Hydrate stores with persisted data

**Code Reference**: See [OS-SL-003-LocalStorageCache.md](../02-storage-layers/OS-SL-003-LocalStorageCache.md)

### Step 4: Default Directory Setup (Desktop Only)

**Condition**: Only if `isTauri() === true`

**System Action**: Get user's Documents directory as default save location.

```typescript
// From filesystem.ts:80-86
export async function getDocumentsDir(): Promise<string> {
  if (isTauri()) {
    const { documentDir } = await import('@tauri-apps/api/path');
    return documentDir();
  }
  return '';
}
```

**Typical Paths**:
- **Windows**: `C:\Users\{username}\Documents`
- **macOS**: `/Users/{username}/Documents`
- **Linux**: `/home/{username}/Documents`

**Code Reference**: `hvac-design-app/src/core/persistence/filesystem.ts:80-86`

### Step 5: Verify File System Permissions (Desktop Only)

**System Action**: Attempt to verify read/write access to Documents directory.

**Not Explicitly Implemented** - Tauri handles permissions via OS dialogs on first access.

**Fallback**: If file system unavailable, app functions in localStorage-only mode.

### Step 6: Show Dashboard

**User Experience**:
- **First launch**: Empty dashboard with "Create New Project" prompt
- **Returning user**: Dashboard shows recent projects (from `projectListStore`)

**Code Reference**: `hvac-design-app/src/features/dashboard/` (dashboard components)

---

## Edge Cases

### Edge Case 1: Tauri Runtime Not Available

**Scenario**: User in desktop-like environment but Tauri APIs not loaded.

**Detection**: `isTauri()` returns `false`

**Behavior**: Application falls back to web browser mode (localStorage only).

**User Impact**: Cannot save to file system, must manually download `.sws` files.

### Edge Case 2: localStorage Disabled

**Scenario**: User has disabled localStorage (privacy settings, incognito mode).

**Detection**: `localStorage.setItem()` throws `SecurityError`

**Current Behavior**: Application may fail to persist preferences.

**Mitigation**: Catch exceptions in Zustand persist middleware, continue with in-memory state only.

### Edge Case 3: Existing Corrupted localStorage

**Scenario**: localStorage contains invalid JSON from previous version or browser bug.

**Detection**: JSON parse error during hydration

**Behavior**: Zustand persist middleware catches error, uses default state, overwrites on next save.

**User Impact**: Preferences/project list reset to defaults.

### Edge Case 4: Documents Directory Doesn't Exist

**Scenario**: Rare, but possible on misconfigured systems.

**Detection**: `getDocumentsDir()` returns empty string or non-existent path.

**Behavior**: Save dialog allows user to choose alternative location.

**User Impact**: Must manually select save location on first project save.

---

## Error Scenarios

### Error 1: File System Permission Denied

**Trigger**: Desktop app lacks permission to access Documents directory.

**Symptoms**:
- `writeTextFile()` throws permission error
- Cannot create backup files

**Error Message**: "File system access requires permission"

**Recovery**:
1. Prompt user to grant file system access (OS permission dialog)
2. If denied, fallback to localStorage + manual download

**Code Reference**: `hvac-design-app/src/core/persistence/filesystem.ts:35` (error throw)

### Error 2: localStorage Quota Exceeded on First Launch

**Trigger**: Browser localStorage already near quota from other apps.

**Symptoms**: `QuotaExceededError` on first preference save

**Error Message**: "Storage quota exceeded"

**Recovery**:
1. Show warning to user
2. Continue with in-memory state only
3. Suggest clearing browser data or using desktop app

### Error 3: Network Error Loading Web App

**Trigger**: User offline or CDN unavailable when loading web app.

**Symptoms**: JavaScript bundle fails to load

**Recovery**: Browser shows offline page, user must retry when online.

**Note**: Does NOT affect desktop app (all assets bundled).

---

## Performance

### Typical First Launch Times

| Environment | Cold Start | Warm Start | Notes |
|-------------|-----------|------------|-------|
| Desktop (Tauri) | 1-2 seconds | 500ms - 1s | OS caches app bundle |
| Web (First Visit) | 2-5 seconds | N/A | Download JS bundle |
| Web (Cached) | N/A | 500ms - 1s | Service worker cache |

### localStorage Hydration Time

| Data Size | Hydration Time | Impact |
|-----------|---------------|--------|
| Empty (first launch) | ~1ms | Negligible |
| Small (< 10KB) | ~5ms | Negligible |
| Medium (50KB) | ~20ms | Minor delay |
| Large (1MB) | ~100ms | Noticeable delay |

**Optimization**: Stores use selective persistence to minimize data size.

---

## Related Documentation

- [Environment Detection](./OS-INIT-002-EnvironmentDetection.md) - Detailed Tauri vs Web detection
- [Database Integrity Check](./OS-INIT-003-DatabaseIntegrityCheck.md) - Startup validation
- [localStorage Cache](../02-storage-layers/OS-SL-003-LocalStorageCache.md) - Hydration details
- [Zustand Persistence](../02-storage-layers/OS-SL-004-ZustandPersistence.md) - How persist middleware works

---

## Testing First Launch

### Manual Testing

1. **Desktop - True First Launch**:
   ```bash
   # Clear localStorage equivalent
   rm -rf ~/Library/Application\ Support/com.hvac.canvas  # macOS
   # Then launch app
   ```

2. **Web - Incognito Mode**:
   - Open browser in incognito/private mode
   - Navigate to app URL
   - Verify empty dashboard and default preferences

3. **Web - localStorage Disabled**:
   - Open DevTools
   - Application > localStorage > Right-click > Clear
   - Disable localStorage via browser settings
   - Reload app

### Automated Testing

```typescript
describe('First Launch Setup', () => {
  beforeEach(() => {
    // Clear all localStorage
    localStorage.clear();
  });

  it('should initialize with default preferences on first launch', () => {
    const { result } = renderHook(() => usePreferencesStore());

    expect(result.current.theme).toBe('light'); // Default theme
    expect(result.current.language).toBe('en');
  });

  it('should show empty dashboard on first launch', () => {
    const { result } = renderHook(() => useProjectListStore());

    expect(result.current.projects).toEqual([]);
  });

  it('should detect Tauri environment', () => {
    // Mock Tauri
    (window as any).__TAURI__ = {};

    expect(isTauri()).toBe(true);

    // Cleanup
    delete (window as any).__TAURI__;
  });
});
```

---

## Configuration

### Default Preferences (First Launch)

```typescript
const DEFAULT_PREFERENCES = {
  theme: 'light',
  language: 'en',
  gridVisible: true,
  snapToGrid: true,
  gridSize: 20, // pixels
  autoSaveEnabled: true,
  units: 'imperial',
};
```

**Code Reference**: `hvac-design-app/src/stores/preferencesStore.ts` (initial state)

### Default Project Settings

```typescript
const DEFAULT_PROJECT_SETTINGS = {
  equipmentLibrary: 'standard',
  ductMaterial: 'galvanized-steel',
  showLabels: true,
  showDimensions: false,
};
```

---

## Security Considerations

### localStorage Security

- **Data Exposure**: localStorage is NOT encrypted
- **XSS Risk**: Any script on same origin can read localStorage
- **Recommendation**: Do NOT store sensitive data in localStorage

### File System Security (Desktop)

- **Sandboxing**: Tauri sandboxes file system access
- **Permissions**: OS-level permission dialogs on first file operation
- **Best Practice**: Only request file access when user initiates save/open

---

## Implementation Status

✅ **Fully Implemented**
- Environment detection (`isTauri()`)
- localStorage hydration via Zustand persist
- Default directory detection (`getDocumentsDir()`)
- Fallback to web-only mode if Tauri unavailable

⚠️ **Partially Implemented**
- Error handling for localStorage quota exceeded (basic try-catch)
- Permission verification (relies on Tauri's built-in dialogs)

❌ **Not Implemented**
- Explicit permission pre-check before file operations
- User onboarding/tour on first launch
- Migration from older localStorage schema versions

See [IMPLEMENTATION_STATUS.md](../../IMPLEMENTATION_STATUS.md) for complete details.

---

## User Journey References

- **UJ-GS-001**: First Launch Initialization (if exists in user journey docs)
- **UJ-DASH-001**: Dashboard First Visit Experience

---

## PRD References

- **FR-FILE-004**: File system access and permissions
- **FR-DASH-001**: Dashboard initialization
- **FR-PREF-001**: User preferences persistence

---

## Acceptance Criteria

- [ ] Application launches successfully in both desktop and web environments
- [ ] Environment detection correctly identifies Tauri vs Web
- [ ] localStorage hydrates preferences and project list on app load
- [ ] Empty dashboard shown on first launch
- [ ] Default preferences applied when no saved preferences exist
- [ ] File system permissions requested on first save (desktop only)
- [ ] Application functions in localStorage-only mode if file system unavailable
- [ ] No console errors on clean first launch

---

## Future Enhancements

1. **User Onboarding**: Interactive tour on first launch
2. **Permission Pre-Check**: Verify file system access before showing file dialogs
3. **Smart Default Location**: Remember last used save location across sessions
4. **Cloud Backup**: Optional cloud sync for preferences and project list
5. **Migration Assistant**: Guide users migrating from older versions
