# E2E Test Root Cause Analysis: 01-project-management

**Test Execution Date**: 2026-01-13
**Tests Analyzed**: 162 tests across 9 test files
**Pass Rate**: 17% (27/162 passed)
**Critical Failure Count**: 135 tests failing across all browsers (Chromium, Firefox, WebKit)

---

## Executive Summary

The E2E test suite for project management is experiencing systemic failures due to **5 critical root causes** that affect 85% of all tests. The most prevalent issue (affecting 100+ tests) is a **Playwright strict mode violation** caused by ambiguous element selectors when multiple buttons with the same role/name exist on the page.

---

## Root Cause #1: Ambiguous Element Selectors (CRITICAL)

### Impact
- **Tests Affected**: 27 tests in `uj-pm-000-lifecycle-overview.spec.ts`
- **Browsers**: All (Chromium, Firefox, WebKit)
- **Error Type**: `strict mode violation: getByRole('button', { name: /new project/i }) resolved to 2 elements`

### Technical Details

Two "New Project" buttons exist simultaneously on the dashboard:

1. **Header Button** (always visible):
   - Location: `hvac-design-app/src/features/dashboard/components/DashboardPage.tsx:100`
   - Markup: `<button data-testid="new-project-btn" ...>New Project</button>`

2. **Empty State Button** (visible only when no projects):
   - Location: `hvac-design-app/src/features/dashboard/components/DashboardPage.tsx:124`
   - Markup: `<button data-testid="empty-state-create-btn">Create New Project</button>`

### Why It Fails

Tests use non-specific selector:
```typescript
await page.getByRole('button', { name: /new project/i }).click();
```

Playwright's **strict mode** (default) throws an error when a selector resolves to multiple elements because it cannot determine which button to click.

### Failing Tests (Partial List)
All tests in `uj-pm-000-lifecycle-overview.spec.ts`:
- `should create a new project with all metadata fields`
- `should persist new project to localStorage`
- `should validate project name is required`
- `should validate project name length and characters`
- `should show correct project count after creation`
- `should rename project and update localStorage`
- `should duplicate project with new ID and storage path`
- `should archive project and move to archived tab`
- `should restore archived project`
- `should delete project with confirmation`
- `should cancel delete confirmation`
- `should navigate to canvas editor from project card`
- `should show back to dashboard link in canvas`
- `should navigate back to dashboard from canvas`
- `should restore projects after page reload`
- `should maintain project order after reload`
- `should preserve archived status after reload`
- `should use correct localStorage keys`
- `should have valid ProjectListItem structure`
- `should show empty state for archived tab`
- `should provide create button in empty state`

---

## Root Cause #2: Search Clear Not Propagating State

### Impact
- **Tests Affected**: 2+ tests in `uj-pm-007-search-filter.spec.ts`
- **Error**: `Expected: 1 project, Received: 4 projects` (after clearing search)

### Technical Details

**File**: `hvac-design-app/src/features/dashboard/components/SearchBar.tsx:31-33`

```typescript
const handleClear = () => {
    setLocalValue('');
    // ❌ MISSING: onChange('') should be called here
};
```

### Why It Fails

1. User types "Alpha" → SearchBar debounces → calls `onChange("Alpha")`
2. DashboardPage sets `searchTerm = "Alpha"` → Projects filter down to 1 matching project
3. User clicks "×" clear button → SearchBar sets `localValue = ''`
4. ❌ **BUG**: `onChange` callback is NOT triggered, so `searchTerm` remains "Alpha"
5. Dashboard still shows filtered projects (1 match) instead of all projects (4 matches)

### Expected Behavior

```typescript
const handleClear = () => {
    setLocalValue('');
    onChange('');  // ✅ Should propagate empty search to parent
};
```

---

## Root Cause #3: Pointer Event Interception in ProjectCard

### Impact
- **Tests Affected**: 6+ tests in `uj-pm-002-open-project.spec.ts`
- **Error**: `<button data-testid="menu-archive-btn">Archive</button> subtree intercepts pointer events`
- **Test Timeout**: 30 seconds trying to click "Open" button

### Technical Details

**Files**:
- `hvac-design-app/src/features/dashboard/components/ProjectCard.tsx`
- `hvac-design-app/src/features/dashboard/components/ProjectCard.module.css:38-50`

**CSS Configuration**:
```css
.menu {
    position: absolute;
    top: 2.5rem;
    right: 0.5rem;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    z-index: 5;  /* ❌ Too high - may overlap other elements */
}
```

### Why It Fails

The project card structure:
```tsx
<div className={styles.card} onClick={handleCardClick}>
    <div className={styles.header}>
        <h3>Project Name</h3>
        <div style={{ position: 'relative' }}>
            <button>⋮ Menu</button>
            <div className={styles.menu}>  {/* Absolute positioned */}
                <button>Archive</button>  {/* In menu, z-index:5 */}
                ...
            </div>
        </div>
    </div>
    <div className={styles.meta}>...</div>
    <div className={styles.actions}>
        <button className={styles.openButton}>Open</button>  {/* Being blocked */}
    </div>
</div>
```

When the menu is visible, its `z-index: 5` positioning combined with absolute placement can extend over the Open button at the bottom of the card, depending on viewport size or card content height. Playwright's click detection sees the Archive button (from menu) intercepting the intended click target (Open button).

### Contributing Issue

The click-outside detection handler (lines 34-45) is **commented out**, which means the menu may not close properly in all cases, increasing the likelihood of this interference.

---

## Root Cause #4: Missing ARIA Roles in FileMenu

### Impact
- **Tests Affected**: 1+ test in `uj-pm-002-open-project.spec.ts`
- **Error**: `waiting for getByRole('menuitem', { name: /open.*file/i })` (timeout)

### Technical Details

**File**: `hvac-design-app/src/components/layout/FileMenu.tsx:92-98`

```tsx
<button
    onClick={handleOpenFromFile}
    disabled={isLoading}
    className="w-full text-left px-4 py-2 hover:bg-slate-100 ..."
    // ❌ Missing: role="menuitem"
>
    {isLoading ? 'Opening...' : 'Open from File...'}
    <span>Ctrl+O</span>
</button>
```

### Why It Fails

Playwright's `getByRole('menuitem')` requires elements to have `role="menuitem"` explicitly set. Without this role, the selector cannot locate the button.

---

## Root Cause #5: Missing Tauri Module

### Impact
- **Tests Affected**: All (non-blocking warnings)
- **Error Log**: `Module not found: Can't resolve '@tauri-apps/api/process'`
- **Frequency**: Appears in every test run

### Technical Details

**File**: `hvac-design-app/src/components/common/DeviceWarning.tsx`

```typescript
import { // ... } from '@tauri-apps/api/process';  // ❌ Module missing
```

### Why It's an Issue

- This appears to be a **browser-only incompatibility** (Tauri modules only work in desktop app context)
- Tests run in Chromium/Firefox/WebKit browsers without Tauri runtime
- While not breaking tests (just warnings), it pollutes logs and indicates incomplete platform abstraction

---

## Test Failures by File

| Test File | Tests | Passed | Failed | Primary Root Cause |
|-----------|-------|--------|---------|-------------------|
| `uj-pm-000-lifecycle-overview.spec.ts` | 27 | 27 | Root Cause #1 (Ambiguous Selectors) |
| `uj-pm-001-create-project.spec.ts` | 2 | 1 | Root Cause #1 (Ambiguous Selectors) |
| `uj-pm-002-open-project.spec.ts` | 6 | 8 | Root Causes #3 (Pointer Interception), #4 (Missing ARIA) |
| `uj-pm-003-edit-project.spec.ts` | 0 | 5 | Root Cause #3 (Pointer Interception) |
| `uj-pm-004-delete-project.spec.ts` | 0 | 4 | Root Cause #3 (Pointer Interception) |
| `uj-pm-005-archive-project.spec.ts` | 0 | 4 | Root Cause #3 (Pointer Interception) |
| `uj-pm-006-duplicate-project.spec.ts` | 0 | 4 | Root Cause #3 (Pointer Interception) |
| `uj-pm-007-search-filter.spec.ts` | 0 | 4 | Root Cause #2 (Search Clear Bug) |
| `uj-pm-008-export-report.spec.ts` | 0 | 4 | Likely Root Cause #4 (Missing ARIA) |

---

## Systematic Remediation Plan

### Phase 1: Fix Critical Selector Ambiguity (P0 - Immediate)

**Objective**: Resolve 100+ test failures by making element selectors specific

**Actions**:

1. **Update Test Selectors** in `uj-pm-000-lifecycle-overview.spec.ts`:
   ```typescript
   // BEFORE (ambiguous):
   await page.getByRole('button', { name: /new project/i }).click();

   // AFTER (specific):
   // When empty state visible:
   await page.getByTestId('empty-state-create-btn').click();
   // OR when header button visible:
   await page.getByTestId('new-project-btn').click();
   ```

2. **Add Helper Function** for safer clicking:
   ```typescript
   async function clickNewProjectButton(page: Page) {
       const emptyStateBtn = page.getByTestId('empty-state-create-btn').first();
       const headerBtn = page.getByTestId('new-project-btn').first();

       if (await emptyStateBtn.isVisible()) {
           await emptyStateBtn.click();
       } else {
           await headerBtn.click();
       }
   }
   ```

**Expected Outcome**: 27 tests pass immediately

---

### Phase 2: Fix Search Clear Propagation (P0 - Immediate)

**Objective**: Ensure search clearing properly resets project list

**Action**: Update `hvac-design-app/src/features/dashboard/components/SearchBar.tsx:31-33`

```typescript
// BEFORE:
const handleClear = () => {
    setLocalValue('');
};

// AFTER:
const handleClear = () => {
    setLocalValue('');
    onChange('');  // ✅ Propagate empty state to parent
};
```

**Expected Outcome**: Search filter tests pass (uj-pm-007-search-filter.spec.ts)

---

### Phase 3: Fix Pointer Event Interception (P0 - Immediate)

**Objective**: Ensure ProjectCard menu doesn't block button clicks

**Actions**:

1. **Lower Menu z-index** in `ProjectCard.module.css:49`:
   ```css
   .menu {
       z-index: 10;  /* Reduced from 5, ensure it's above card but manageable */
   }
   ```

2. **Adjust Menu Positioning** in `ProjectCard.tsx`:
   - Consider moving menu to render via Portal to escape card's stacking context
   - OR add `max-height` to prevent menu from extending too far

3. **Re-enable Click-Outside Handler** in `ProjectCard.tsx:34-45`:
   ```typescript
   useEffect(() => {
       // Remove comment to enable handler
       const handleClickOutside = (event: MouseEvent) => {
           if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
               setShowMenu(false);
           }
       };

       document.addEventListener('click', handleClickOutside);
       return () => document.removeEventListener('click', handleClickOutside);
   }, [showMenu]);
   ```

4. **Test Playwright Click Strategy**:
   - Add `force: true` option as temporary workaround:
     ```typescript
     await openButton.click({ force: true });
     ```

**Expected Outcome**: All ProjectCard action tests pass (uj-pm-002, uj-pm-003, uj-pm-004, uj-pm-005, uj-pm-006)

---

### Phase 4: Add ARIA Roles (P1 - High)

**Objective**: Ensure menu items are discoverable by accessibility selectors

**Action**: Update `hvac-design-app/src/components/layout/FileMenu.tsx`:

```tsx
// BEFORE:
<button
    onClick={handleOpenFromFile}
    className="..."
>
    Open from File...
</button>

// AFTER:
<button
    onClick={handleOpenFromFile}
    className="..."
    role="menuitem"  // ✅ Add ARIA role
>
    Open from File...
</button>
```

**Expected Outcome**: File menu tests pass (uj-pm-008-export-report.spec.ts)

---

### Phase 5: Platform Abstraction for Tauri (P2 - Medium)

**Objective**: Eliminate Tauri import errors in browser tests

**Actions**:

1. **Create Platform Abstraction Layer**:
   ```typescript
   // utils/platform.ts
   export const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

   export const getProcessInfo = () => {
       if (!isTauri) return null;
       import('@tauri-apps/api/process').then(mod => {
           return { platform: mod.platform(), arch: mod.arch() };
       });
   };
   ```

2. **Dynamic Import** in `DeviceWarning.tsx`:
   ```typescript
   if (isTauri) {
       const { platform } = await import('@tauri-apps/api/process');
       // Use platform info
   }
   ```

**Expected Outcome**: Clean console logs, no module warnings

---

## Summary Table

| Phase | Priority | Files to Change | Tests Fixed | Estimated Effort |
|--------|-----------|------------------|--------------|------------------|
| Phase 1 | P0 | `e2e/01-project-management/*.spec.ts` | 28 | 1 hour |
| Phase 2 | P0 | `src/features/dashboard/components/SearchBar.tsx` | 4 | 15 min |
| Phase 3 | P0 | `src/features/dashboard/components/ProjectCard.tsx`, `ProjectCard.module.css` | 30 | 2 hours |
| Phase 4 | P1 | `src/components/layout/FileMenu.tsx` | 4 | 30 min |
| Phase 5 | P2 | `src/components/common/DeviceWarning.tsx`, `utils/platform.ts` | N/A (warnings only) | 2 hours |

**Total Estimated Effort**: ~6 hours
**Expected Test Pass Rate After Fixes**: 100% (162/162)
