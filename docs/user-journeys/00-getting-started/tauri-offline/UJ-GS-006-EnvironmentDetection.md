# [UJ-GS-006] Environment Detection

## Overview

This user journey covers how the HVAC Canvas App detects its runtime environment (Tauri Desktop vs Web Browser) and adapts its behavior accordingly, ensuring users have a seamless experience regardless of platform.

## PRD References

- **FR-INIT-002**: Application shall detect runtime environment at startup
- **FR-INIT-003**: Application shall gracefully degrade in web-only mode
- **AC-INIT-002-001**: `isTauri()` returns `true` in desktop, `false` in browser
- **AC-INIT-002-002**: File operations throw clear errors in web mode
- **AC-INIT-002-003**: Fallback operations (`exists`, `readDir`) return safe defaults

## Prerequisites

- Application bundle is built and deployed
- User is accessing via supported browser OR Tauri desktop app

## Environment Detection Flow

### Step 1: Application Load

**User Action**: Open application (web URL or desktop app)

**Expected Result**:
- `isTauri()` function executes: `typeof window !== 'undefined' && '__TAURI__' in window`
- Returns `true` (desktop) or `false` (web)
- No user-facing indication (detection is silent)

**Validation Method**: Unit test
```typescript
it('should detect web environment correctly', () => {
  expect(isTauri()).toBe(false); // In test/web environment
});
```

---

### Step 2: Storage Layer Selection

**User Action**: (Automatic during init)

**Expected Result**:
| Environment | Primary Storage | Backup | File Operations |
|-------------|-----------------|--------|-----------------|
| Desktop (Tauri) | File system (.sws) | localStorage | ✅ Full support |
| Web Browser | IndexedDB | localStorage | ✅ Full support |

**Validation Method**: E2E test
```typescript
test('should use localStorage in web mode', async ({ page }) => {
  const storageKeys = await page.evaluate(() => Object.keys(localStorage));
  expect(storageKeys).toContain('hvac-app-storage');
});
```

---

### Step 3: Feature Availability

**User Action**: Navigate application, attempt file operations

**Expected Result** (Web Mode):
- Project creation: ✅ Available (saves to localStorage)
- Project save: ⚠️ Triggers browser download (not file save)
- Open from file: ⚠️ Uses file upload (`<input type="file">`)
- Auto-save: ✅ Available (IndexedDB)
- Recent files: ⚠️ Limited to localStorage history

**Validation Method**: E2E test
```typescript
test('should allow project creation in web mode', async ({ page }) => {
  const newProjectBtn = page.getByRole('button', { name: /new project/i });
  await expect(newProjectBtn).toBeEnabled();
});
```

---

## Edge Cases

### 1. SSR/Node.js Environment

**Scenario**: Code runs during server-side rendering

**Expected Behavior**:
- `typeof window !== 'undefined'` check prevents crashes
- `isTauri()` returns `false` safely
- No errors thrown

**Test**:
```typescript
it('should handle SSR environment safely', () => {
  const testSSR = () => typeof window !== 'undefined' && '__TAURI__' in window;
  expect(testSSR()).toBe(false);
});
```

---

### 2. Missing LocalStorage

**Scenario**: Browser has localStorage disabled

**Expected Behavior**:
- Application shows error message
- Core functionality unavailable
- "Enable localStorage" instructions shown

---

### 3. Quota Exceeded

**Scenario**: localStorage quota full

**Expected Behavior**:
- Error caught and logged
- User notified: "Storage full. Please export and clear some projects."
- Existing data preserved

---

## Error Scenarios

### 1. File Operation in Web Mode

**Scenario**: Code attempts `writeTextFile()` in browser

**Expected Handling**:
```typescript
throw new Error('File system access requires Tauri runtime');
```

**User Impact**: Feature disabled, no crash

---

### 2. Tauri API Import Failure

**Scenario**: Dynamic import of `@tauri-apps/api/fs` fails

**Expected Handling**:
- Error caught in function
- Returns graceful fallback or throws with clear message
- Console logs error for debugging

---

## Related Elements

- [filesystem.ts](../../hvac-design-app/src/core/persistence/filesystem.ts) - Core detection function
- [OS-INIT-002-EnvironmentDetection.md](../../offline-storage/01-initialization/OS-INIT-002-EnvironmentDetection.md) - Technical spec
- [UJ-GS-001-FirstLaunchExperience.md](./UJ-GS-001-FirstLaunchExperience.md) - First launch flow

---

## Test Implementation

### Unit Tests
- `src/core/persistence/__tests__/filesystem.test.ts`
  - `isTauri()` detection (4 tests)
  - Web fallbacks (9 tests)
  - Tauri mocking (1 test)
  - Error handling (2 tests)

### E2E Tests
- `e2e/00-getting-started/uj-gs-006-environment-detection.spec.ts`
  - Core detection (2 tests)
  - Web fallbacks (2 tests)
  - Feature availability (2 tests)
  - Graceful degradation (2 tests)
  - Storage layer selection (2 tests)

---

## Implementation Status

✅ **Fully Implemented**
- `isTauri()` detection function
- Dynamic Tauri API imports
- Graceful fallbacks for `exists`, `readDir`, `getDocumentsDir`
- Web-mode file operations throw clear errors

⚠️ **Partially Implemented**
- UI indicators for environment mode
- Export via browser download fallback

❌ **Not Implemented**
- Web → Desktop migration assistant
- Environment detection caching
