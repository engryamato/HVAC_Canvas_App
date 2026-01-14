# OS-INIT-001: First Launch Setup

**Document Type**: 📋 **SPECIFICATION & REFERENCE**
**Last Updated**: 2026-01-10
**Status**: 🔄 Specification with implementation gaps identified

> **⚠️ IMPORTANT**: This document serves as the **specification and reference** for implementing first launch functionality and generating test specs. Some described behaviors represent **INTENDED implementation** rather than current state. See [Implementation Status](#implementation-status) and [Known Issues](#known-issues) sections for actual vs. intended behavior.

## Overview

This document describes the **first launch initialization** process (both current implementation and intended behavior) for the HVAC Canvas App, covering:

- Environment detection (Tauri vs Web)
- First launch detection and state management
- AppInitializer component orchestration
- localStorage hydration and persistence
- Default directory setup
- Permission verification
- Welcome screen and onboarding flow

**Scope**: Application startup and initialization, not project-specific setup.

**Recent Updates** (2026-01-12):
- ✅ **FIXED** critical `isFirstLaunch` rehydration bug with custom `merge` function
- ✅ Added 18 unit tests for `useAppStateStore` (including rehydration verification)

**Previous Updates** (2026-01-10):
- ✅ Fixed storage key discrepancy (`hvac-app-storage` vs `project-storage`)
- ✅ Updated preferences defaults to match actual implementation
- ✅ Added AppInitializer component flow documentation
- ✅ Added first launch state management details (`hasLaunched`/`isFirstLaunch`)
- ✅ Expanded localStorage hydration with error handling details
- ✅ Added React hydration mismatch edge case
- ✅ Updated implementation status to reflect WelcomeScreen component
- ✅ Verified acceptance criteria against E2E test coverage
- ✅ Added cross-references to UJ-GS-001 specification
- ✅ Applied Augment code review corrections (4 documentation fixes)


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

### Step 1.5: AppInitializer Orchestration

**System Action**: AppInitializer component controls the first launch flow and routing.

**Component Flow**:
```typescript
// From AppInitializer.tsx:8-44
export const AppInitializer: React.FC = () => {
    const router = useRouter();
    const { hasLaunched, isFirstLaunch } = useAppStateStore();
    const [showSplash, setShowSplash] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Auto-open last project if enabled
    useAutoOpen();

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSplashComplete = () => {
        setShowSplash(false);
        if (!isFirstLaunch) {
            router.replace('/dashboard');
        }
    };

    if (!mounted) { return null; }

    // Show splash screen first
    if (showSplash) {
        return <SplashScreen onComplete={handleSplashComplete} />;
    }

    // Show welcome screen on first launch
    if (isFirstLaunch) {
        return <WelcomeScreen />;
    }

    // Show redirecting placeholder for returning users
    return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <p className="text-slate-500 animate-pulse">Redirecting to dashboard...</p>
        </div>
    );
}
```

**Routing Logic**:
1. **First Launch** (`isFirstLaunch === true`):
   - Splash Screen (2-3 seconds) → Welcome Screen → Tutorial (optional) → Dashboard
2. **Returning User** (`hasLaunched === true`):
   - Splash Screen (2-3 seconds) → Dashboard (automatic redirect via `router.replace('/dashboard')`)

**Additional Features**:
- **Auto-Open Last Project**: `useAutoOpen()` hook attempts to restore last opened project (if preference enabled)
- **Next.js Routing**: Uses Next.js App Router (`useRouter` from `next/navigation`) for navigation
- **Hydration Safety**: Mounted state check prevents SSR/client state mismatch

**Code Reference**: `hvac-design-app/src/components/onboarding/AppInitializer.tsx:1-44`

**Related Documentation**: See [UJ-GS-001](../../user-journeys/00-getting-started/tauri-offline/UJ-GS-001-FirstLaunchExperience.md) for complete first launch UX specification

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

**System Action**: Zustand persist middleware automatically reads from localStorage **synchronously** during store initialization.

**Timing**: Hydration occurs **before** React components render, ensuring stores have persisted data available immediately.

**Storage Keys Read**:
- `sws.preferences` → User preferences (theme, unitSystem, autoSaveInterval, gridSize)
- `sws.projectIndex` → Dashboard project list
- `hvac-app-storage` → First launch state (only `hasLaunched` flag is persisted via `partialize`)

**Hydration Process**:
1. Zustand persist middleware runs during store creation
2. Reads corresponding localStorage key (e.g., `sws.preferences`)
3. Parses JSON string into JavaScript object
4. Merges parsed data into store's initial state
5. If parsing fails or key doesn't exist, uses default initial state

**Error Handling**:
```typescript
// Zustand persist middleware automatically handles:
try {
  const storedValue = localStorage.getItem('sws.preferences');
  if (storedValue) {
    const parsed = JSON.parse(storedValue);
    // Merge into state
  } else {
    // Use defaults (first launch)
  }
} catch (error) {
  // JSON parse error or quota error
  console.error('Hydration failed, using defaults');
  // Continue with default state
}
```

**Outcomes**:
- **First launch** (no localStorage keys): Use default initial state from store definition
- **Returning user** (keys exist): Hydrate stores with persisted data
- **Corrupted data** (JSON parse error): Log error, use defaults, overwrite on next save

**Note**: `QuotaExceededError` only occurs on writes (`localStorage.setItem`), not reads (`localStorage.getItem`). If storage is full, reads still succeed but subsequent writes will fail.

**Performance**: Synchronous hydration typically takes 1-5ms for small datasets (< 10KB)

**Code Reference**: See [OS-SL-003-LocalStorageCache.md](../02-storage-layers/OS-SL-003-LocalStorageCache.md) and [OS-SL-004-ZustandPersistence.md](../02-storage-layers/OS-SL-004-ZustandPersistence.md)

### Step 3.5: First Launch State Detection

**System Action**: Determine if this is the user's first application launch.

**State Management**:
```typescript
// From useAppStateStore.ts:4-13
interface AppState {
    hasLaunched: boolean;      // Persisted flag in localStorage
    isFirstLaunch: boolean;    // Derived value: !hasLaunched
    isLoading: boolean;        // Transient UI state

    setHasLaunched: (value: boolean) => void;
    setLoading: (value: boolean) => void;
    resetFirstLaunch: () => void;
}
```

**Detection Logic**:
1. Zustand persist middleware reads `hvac-app-storage` key from localStorage
2. If key exists with `hasLaunched: true` → **Returning user**
3. If key doesn't exist or `hasLaunched: false` → **First launch**
4. `isFirstLaunch` is stored as a separate state field (not a computed getter)
5. The `setHasLaunched(value)` action updates both: `hasLaunched: value` and `isFirstLaunch: !value`
6. After first welcome screen is shown, `setHasLaunched(true)` is called

**Important**: `isFirstLaunch` is a separate state field that's synchronized with `hasLaunched` via the `setHasLaunched` action. Since only `hasLaunched` is persisted (via `partialize`), the store **SHOULD use** an `onRehydrateStorage` callback to ensure `isFirstLaunch` is correctly recalculated as `!hasLaunched` after rehydration from localStorage.

**⚠️ Current Implementation** (has bug - see [Known Issues](#known-issues)):
```typescript
// From useAppStateStore.ts:26-29 (CURRENT - BUGGY)
persist(
    (set) => ({ /* ... */ }),
    {
        name: 'hvac-app-storage',
        partialize: (state) => ({ hasLaunched: state.hasLaunched }),
        // ❌ MISSING: onRehydrateStorage callback to fix isFirstLaunch
    }
)
```

**✅ Intended Implementation** (specification for future fix):
```typescript
// INTENDED BEHAVIOR (to be implemented)
persist(
    (set) => ({ /* ... */ }),
    {
        name: 'hvac-app-storage',
        partialize: (state) => ({ hasLaunched: state.hasLaunched }),
        onRehydrateStorage: () => (state) => {
            // After rehydration, ensure isFirstLaunch is consistent with hasLaunched
            if (state) {
                state.isFirstLaunch = !state.hasLaunched;
            }
        },
    }
)
```

**Why `partialize`?**
- Only `hasLaunched` needs to persist between sessions
- `isFirstLaunch` should be derived/recalculated on rehydration
- `isLoading` is purely transient UI state
- Reduces localStorage storage usage

**Code Reference**: `hvac-design-app/src/stores/useAppStateStore.ts:26-29` (current), see [Known Issues](#known-issues) for required fix

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

### Edge Case 5: React Hydration Mismatch (SSR/Client State Mismatch)

**Scenario**: Server-side rendering or initial client render causes state mismatch between server and client, particularly with `isFirstLaunch` flag read from localStorage.

**Detection**: React development mode warning: "Text content did not match. Server: ... Client: ..."

**Root Cause**: localStorage is unavailable during SSR, causing server to render with default state while client hydrates with persisted state.

**Mitigation**:
```typescript
// From AppInitializer.tsx:12, 17-19, 29
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) { return null; } // Avoid hydration mismatch
```

**How It Works**:
1. Component initially renders `null` (same on server and client)
2. After client-side mount, `useEffect` sets `mounted = true`
3. Component re-renders with actual content (only on client)
4. Prevents mismatch because first render is always `null`

**User Impact**: None - prevents React warnings and ensures consistent rendering.

**Code Reference**: `hvac-design-app/src/components/onboarding/AppInitializer.tsx:12, 17-19, 29`

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

**E2E Test Status**: ✅ **Implemented and Passing**
- Test suite location: `hvac-design-app/e2e/00-getting-started/`
- Coverage: Splash → Welcome → Tutorial → Dashboard flow (with skip option)
- Browsers tested: Chromium, Firefox, WebKit
- See `e2e/00-getting-started/PROGRESS.md` for detailed test results

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
// From preferencesStore.ts:25-31
export const PREFERENCES_DEFAULTS: PreferencesState = {
  projectFolder: '/projects',
  unitSystem: 'imperial',
  autoSaveInterval: 60000, // milliseconds (60 seconds)
  gridSize: 24, // pixels
  theme: 'light',
};
```

**Code Reference**: `hvac-design-app/src/core/store/preferencesStore.ts:25-31`

**Note**: The `autoSaveInterval` is set to 60 seconds (60000ms) by default, though the actual auto-save implementation uses a 2-second debounce (see `useAutoSave.ts:50`)

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
- localStorage hydration via Zustand persist with `partialize`
- First launch detection via `useAppStateStore` (`hasLaunched`/`isFirstLaunch` flags)
- AppInitializer orchestration (Splash → Welcome → Dashboard routing)
- Default directory detection (`getDocumentsDir()`)
- Fallback to web-only mode if Tauri unavailable
- React hydration mismatch prevention (`mounted` state check)

⚠️ **Partially Implemented**
- Welcome screen and onboarding flow (WelcomeScreen component exists, full tutorial flow in progress)
  - **Implemented**: Splash screen, welcome screen, first launch routing
  - **In Progress**: Interactive tutorial overlay (see UJ-GS-001 for spec)
  - **Code**: `src/components/onboarding/AppInitializer.tsx`, `WelcomeScreen.tsx`
- Error handling for localStorage quota exceeded (basic try-catch in Zustand persist)
- Permission verification (relies on Tauri's built-in dialogs)

❌ **Not Implemented**
- Explicit permission pre-check before file operations
- Complete interactive tutorial with step validation (UJ-GS-001 specification exists)
- Migration from older localStorage schema versions (framework exists, no handlers yet)
- Auto-open last project preference (hook exists but preference not exposed in UI)

**E2E Test Coverage**: ✅ First launch flow tested (see `e2e/00-getting-started/PROGRESS.md`)

See [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md) for complete details.

---

## Known Issues

### ✅ FIXED: isFirstLaunch Rehydration Bug (Originally identified by Augment Review)

**Issue**: `isFirstLaunch` state became inconsistent after page reload for returning users.

**Root Cause**:
- `isFirstLaunch` was stored as a separate state field (not a computed getter)
- Only `hasLaunched` was persisted to localStorage via `partialize`
- On rehydration, `isFirstLaunch` used its initial value (`true`) instead of being recalculated from `hasLaunched`

**Fix Applied** (2026-01-12):
Added custom `merge` function to Zustand persist middleware that derives `isFirstLaunch` from `hasLaunched` during rehydration:

```typescript
{
    name: 'hvac-app-storage',
    partialize: (state) => ({ hasLaunched: state.hasLaunched }),
    merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState> | undefined;
        const hasLaunched = persisted?.hasLaunched ?? currentState.hasLaunched;
        return {
            ...currentState,
            ...persisted,
            isFirstLaunch: !hasLaunched, // Derive from hasLaunched
        };
    },
}
```

**Verification**:
- ✅ 18 unit tests added to `src/stores/__tests__/useAppStateStore.test.ts`
- ✅ E2E onboarding tests pass (2/2)
- ✅ Full test suite passes with no regressions

**Status**: ✅ Fixed and verified

---

## User Journey References

- **[UJ-GS-001: First Launch Experience](../../user-journeys/00-getting-started/tauri-offline/UJ-GS-001-FirstLaunchExperience.md)** - Comprehensive 1600+ line specification covering:
  - Splash screen animation and loading
  - Welcome screen with feature highlights
  - Interactive tutorial (5-step walkthrough)
  - Project creation (template vs blank canvas)
  - Contextual help tooltips on first canvas view
- **UJ-DASH-001**: Dashboard First Visit Experience (if exists)

---

## PRD References

- **FR-FILE-004**: File system access and permissions
- **FR-DASH-001**: Dashboard initialization
- **FR-PREF-001**: User preferences persistence

---

## Acceptance Criteria

✅ **Verified** (via E2E tests - see `e2e/00-getting-started/PROGRESS.md`):
- [x] Application launches successfully in both desktop and web environments
- [x] Environment detection correctly identifies Tauri vs Web (via `isTauri()` function)
- [x] localStorage hydrates preferences and project list on app load (Zustand persist middleware)
- [x] Welcome screen shown on first launch, dashboard shown for returning users
- [x] Default preferences applied when no saved preferences exist (PREFERENCES_DEFAULTS)
- [x] Application functions in localStorage-only mode if file system unavailable (web fallback)
- [x] No console errors on clean first launch (verified in E2E tests)

⚠️ **Partially Verified**:
- [~] File system permissions requested on first save (desktop only)
  - **Status**: Relies on Tauri OS-level dialogs, not explicitly tested in E2E
  - **Verification**: Manual testing required on desktop build

**Test Coverage**:
- **E2E**: ✅ First launch flow tested across Chromium, Firefox, WebKit
- **Unit**: ⚠️ useAppStateStore not directly unit tested (covered by E2E and integration tests)
- **Integration**: ✅ Store hydration tested in store integration tests

**Note**: Direct unit tests for `useAppStateStore` rehydration behavior should be added to verify `isFirstLaunch` state consistency after localStorage persistence/rehydration.

---

## Future Enhancements

1. **User Onboarding**: Interactive tour on first launch
2. **Permission Pre-Check**: Verify file system access before showing file dialogs
3. **Smart Default Location**: Remember last used save location across sessions
4. **Cloud Backup**: Optional cloud sync for preferences and project list
5. **Migration Assistant**: Guide users migrating from older versions
