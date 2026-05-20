# OS-INIT-002: Environment Detection

## Overview

The HVAC Canvas App operates in **two distinct runtime environments**:

1. **Desktop (Tauri)**: Native desktop application with full file system access
2. **Web Browser**: Browser-based application with localStorage-only persistence

This document describes the **environment detection mechanism** and how the application adapts its behavior based on the detected environment.

---

## Environment Detection Mechanism

### Core Detection Function

```typescript
/**
 * Check if running in Tauri environment
 * From filesystem.ts:9-11
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
```

**Code Reference**: `hvac-design-app/src/core/persistence/filesystem.ts:9-11`

### How It Works

1. **Check window object exists**: `typeof window !== 'undefined'`
   - Ensures code runs in browser-like environment
   - Prevents errors in SSR or Node.js environments

2. **Check for Tauri global**: `'__TAURI__' in window`
   - Tauri runtime injects `window.__TAURI__` object on app startup
   - Contains Tauri API bindings (file system, dialogs, etc.)

3. **Returns boolean**:
   - `true` → Desktop application (Tauri)
   - `false` → Web browser

### Detection Timing

**When**: Environment detection occurs at **runtime on every API call**.

**Why Runtime**: Supports scenarios like:
- Hot module reloading during development
- Progressive web app (PWA) installation
- Debugging Tauri app in browser

**Not Compile-Time**: Environment is NOT detected at build time, ensuring single codebase for both environments.

---

## Environment-Specific Behavior

### File System Operations

All file system functions check environment before attempting operations:

```typescript
// From filesystem.ts:17-23
export async function readTextFile(path: string): Promise<string> {
  if (isTauri()) {
    const { readTextFile: tauriRead } = await import('@tauri-apps/api/fs');
    return tauriRead(path);
  }
  throw new Error('File system access requires Tauri runtime');
}
```

**Pattern**:
1. Check `isTauri()`
2. If true: Dynamically import Tauri API and use it
3. If false: Throw error or return fallback value

**Code References**:
- `readTextFile`: `filesystem.ts:17-23`
- `writeTextFile`: `filesystem.ts:29-36`
- `exists`: `filesystem.ts:42-48`
- `createDir`: `filesystem.ts:54-61`
- `readDir`: `filesystem.ts:67-74`

### Graceful Degradation Functions

Some functions return **safe fallback values** instead of throwing errors:

```typescript
// From filesystem.ts:42-48
export async function exists(path: string): Promise<boolean> {
  if (isTauri()) {
    const { exists: tauriExists } = await import('@tauri-apps/api/fs');
    return tauriExists(path);
  }
  return false;  // Graceful fallback: file doesn't exist in web
}
```

**Functions with Fallbacks**:
- `exists()` → Returns `false` in web
- `readDir()` → Returns `[]` empty array in web
- `getDocumentsDir()` → Returns `''` empty string in web

**Why**: Allows UI components to work in both environments without try-catch blocks everywhere.

---

## Feature Availability Matrix

| Feature | Desktop (Tauri) | Web Browser | Fallback Strategy |
|---------|----------------|-------------|------------------|
| **Save to .sws file** | ✅ Full support | ❌ Not available | Trigger download |
| **Load from .sws file** | ✅ File picker dialog | ⚠️ Upload only | File input element |
| **Auto-save to file** | ✅ Background save | ❌ Not available | localStorage auto-save |
| **Backup (.bak) file** | ✅ Created automatically | ❌ Not available | N/A |
| **File exists check** | ✅ True file system check | ⚠️ Always `false` | Assume doesn't exist |
| **localStorage** | ✅ Available (Projects + Settings) | ✅ Available (Projects + Settings) | None (works both) |
| **Recent projects list** | ✅ File paths tracked | ⚠️ localStorage only | Use localStorage |
| **Export CSV/JSON** | ✅ Save dialog | ✅ Browser download | Browser download |

---

## Code Patterns for Environment-Aware Features

### Pattern 1: Conditional Feature Enable

```typescript
// Show/hide UI based on environment
function ProjectMenu() {
  const canSaveToFile = isTauri();

  return (
    <Menu>
      {canSaveToFile && <MenuItem onClick={handleSave}>Save</MenuItem>}
      {canSaveToFile && <MenuItem onClick={handleSaveAs}>Save As...</MenuItem>}
      <MenuItem onClick={handleDownload}>Download .sws</MenuItem>
    </Menu>
  );
}
```

### Pattern 2: Try Desktop, Fallback to Web

```typescript
async function saveProject(project: ProjectFile, path: string) {
  if (isTauri()) {
    // Desktop: Use Tauri file system
    try {
      await FileSystem.writeTextFile(path, JSON.stringify(project, null, 2));
      return { success: true };
    } catch (error) {
      // Tauri failed, fallback to localStorage
      localStorage.setItem(`hvac-project-${project.projectId}`, JSON.stringify(project));
      return { success: true, fallback: true };
    }
  } else {
    // Web: Use localStorage + optional download
    localStorage.setItem(`hvac-project-${project.projectId}`, JSON.stringify(project));
    triggerDownload(project, path);
    return { success: true };
  }
}
```

### Pattern 3: Lazy Import Tauri APIs

**Why**: Tauri APIs only exist in desktop environment. Importing at top-level would break web build.

```typescript
// ❌ BAD - Top-level import breaks web build
import { readTextFile } from '@tauri-apps/api/fs';

// ✅ GOOD - Dynamic import only when needed
if (isTauri()) {
  const { readTextFile } = await import('@tauri-apps/api/fs');
  const content = await readTextFile(path);
}
```

**Code Reference**: All filesystem.ts functions use this pattern.

---

## Testing Environment Detection

### Unit Tests

```typescript
describe('isTauri', () => {
  it('should return false in web environment', () => {
    expect(isTauri()).toBe(false);
  });

  it('should return true when __TAURI__ exists', () => {
    // Mock Tauri environment
    (window as any).__TAURI__ = {};

    expect(isTauri()).toBe(true);

    // Cleanup
    delete (window as any).__TAURI__;
  });

  it('should handle undefined window', () => {
    // Simulate Node.js/SSR environment
    const originalWindow = global.window;
    (global as any).window = undefined;

    expect(isTauri()).toBe(false);

    // Restore
    global.window = originalWindow;
  });
});
```

### Integration Tests

```typescript
describe('File operations with environment detection', () => {
  beforeEach(() => {
    // Mock Tauri environment
    (window as any).__TAURI__ = {};
  });

  afterEach(() => {
    delete (window as any).__TAURI__;
  });

  it('should use Tauri APIs in desktop environment', async () => {
    // Mock Tauri file system
    const mockReadTextFile = vi.fn().mockResolvedValue('file content');
    vi.mock('@tauri-apps/api/fs', () => ({
      readTextFile: mockReadTextFile,
    }));

    const content = await readTextFile('/path/to/file.sws');

    expect(mockReadTextFile).toHaveBeenCalledWith('/path/to/file.sws');
    expect(content).toBe('file content');
  });

  it('should throw error in web environment', async () => {
    delete (window as any).__TAURI__;

    await expect(readTextFile('/path/to/file.sws'))
      .rejects.toThrow('File system access requires Tauri runtime');
  });
});
```

---

## Development vs Production

### Development Environment

**Desktop Development**:
```bash
pnpm tauri dev
```
- Runs Tauri in development mode
- `isTauri()` returns `true`
- Hot module reloading enabled

**Web Development**:
```bash
pnpm dev
```
- Runs in browser via Vite dev server
- `isTauri()` returns `false`
- localStorage available

### Production Environment

**Desktop Build**:
```bash
pnpm tauri build
```
- Creates native installer/app bundle
- `isTauri()` always returns `true`

**Web Build**:
```bash
pnpm build
```
- Creates static website bundle
- `isTauri()` always returns `false`

---

## Common Pitfalls

### Pitfall 1: Assuming Tauri APIs Always Available

```typescript
// ❌ BAD - Crashes in web environment
import { open } from '@tauri-apps/api/dialog';

function OpenButton() {
  return <button onClick={() => open()}>Open</button>;
}
```

**Fix**: Check environment first or use dynamic import.

### Pitfall 2: Not Handling Fallback in UI

```typescript
// ❌ BAD - Button does nothing in web
function SaveButton() {
  const handleSave = async () => {
    if (isTauri()) {
      await saveToFile();
    }
    // No else branch - web users see no action!
  };

  return <button onClick={handleSave}>Save</button>;
}
```

**Fix**: Provide web fallback (localStorage save + download).

### Pitfall 3: Forgetting SSR/Node.js Environments

```typescript
// ❌ BAD - Crashes during SSR
const isTauriEnv = '__TAURI__' in window;

// ✅ GOOD - Safely checks window exists first
const isTauriEnv = typeof window !== 'undefined' && '__TAURI__' in window;
```

---

## Environment-Specific Features

### Desktop-Only Features

1. **File System Access**
   - Create/read/write/delete files
   - Directory browsing
   - Path resolution

2. **Native Dialogs**
   - File picker (open/save)
   - Alert/confirm dialogs
   - System notifications

3. **Auto-Save to File**
   - Background file writes
   - Backup file creation

4. **Recent Files**
   - Track file paths
   - Open recent projects

### Web-Only Features

1. **Browser Download API**
   - Trigger .sws file download
   - CSV/JSON export

2. **File Upload**
   - `<input type="file">` for loading projects

3. **localStorage**
   - Primary persistence layer (not just cache)

---

## Migration Path: Web → Desktop

### User Scenario

User starts using web app, then installs desktop app.

**Challenge**: Transfer project data from localStorage to file system.

**Solution** (Not Currently Implemented):

1. Desktop app checks for localStorage data on first launch
2. Prompts user: "Found existing projects in browser storage. Import to desktop?"
3. If yes: Creates .sws files from localStorage data
4. Optionally clears localStorage to prevent duplication

**Code Example**:
```typescript
async function migrateFromLocalStorage() {
  if (!isTauri()) return; // Only on desktop

  const keys = Object.keys(localStorage);
  const projectKeys = keys.filter(key => key.startsWith('hvac-project-'));

  for (const key of projectKeys) {
    const data = localStorage.getItem(key);
    if (!data) continue;

    const project: ProjectFile = JSON.parse(data);
    const path = await promptSaveLocation(project.project.name);

    await saveProject(project, path);
  }

  // Optionally clear localStorage
  projectKeys.forEach(key => localStorage.removeItem(key));
}
```

---

## Related Documentation

- [First Launch Setup](./OS-INIT-001-FirstLaunchSetup.md) - Initialization process
- [Architecture Overview](../02-storage-layers/OS-SL-001-ArchitectureOverview.md) - Three-layer architecture
- [localStorage Cache](../02-storage-layers/OS-SL-003-LocalStorageCache.md) - Web persistence
- [FileSystem Element](../../elements/10-persistence/FileSystem.md) - Detailed API docs

---

## Implementation Status

✅ **Fully Implemented**
- `isTauri()` detection function
- Environment-aware file system functions
- Graceful fallbacks (exists, readDir, getDocumentsDir)
- Dynamic import of Tauri APIs

⚠️ **Partially Implemented**
- UI feature toggles (some components don't check environment)
- Fallback to localStorage when Tauri fails

❌ **Not Implemented**
- Web → Desktop migration assistant
- Environment detection caching (calls `isTauri()` on every operation)
- Comprehensive error messages explaining environment limitations

See [IMPLEMENTATION_STATUS.md](../../IMPLEMENTATION_STATUS.md) for complete details.

---

## Performance Considerations

### Environment Check Overhead

**Current**: `isTauri()` called on every file operation

**Performance**: Negligible (~0.001ms per call)

**Optimization Potential**: Cache result on app startup
```typescript
let _isTauri: boolean | undefined;

export function isTauri(): boolean {
  if (_isTauri === undefined) {
    _isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  }
  return _isTauri;
}
```

**Trade-off**: Caching prevents runtime environment changes (e.g., hot reloading).

---

## Security Implications

### Tauri Sandbox

Desktop app runs in Tauri sandbox with restricted permissions:
- File system access via safe Rust APIs
- No arbitrary command execution
- OS-level permission dialogs for sensitive operations

### Web XSS Protection

Web environment protected by browser's same-origin policy:
- localStorage only accessible to same origin
- File downloads trigger browser security prompts
- No direct file system access (prevents malicious file writes)

---

## Future Enhancements

1. **Progressive Web App (PWA)**:
   - Detect PWA installation
   - Enable offline mode
   - Use File System Access API (Chrome/Edge)

2. **Environment Indicator**:
   - Show badge in UI: "Desktop Mode" vs "Web Mode"
   - Help users understand feature availability

3. **Smart Fallbacks**:
   - Detect File System Access API support
   - Use native file picker in supported browsers

4. **Migration Assistant**:
   - Automatic web → desktop data migration
   - Bidirectional sync between environments
