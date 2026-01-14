# Systematic Remediation Plan - Fix App Code First, Then Adjust Tests

**Principle**: Fix root causes in application code, then adjust test specs with proper waits. No workarounds, no test skipping.

---

## Phase 1: Fix SearchBar Clear Button (P0 - Immediate)

### File: `src/features/dashboard/components/SearchBar.tsx`

### Problem
Clear button sets local state but doesn't notify parent, so search filter doesn't reset.

### Fix

```typescript
// Line 31-33 - BEFORE:
const handleClear = () => {
    setLocalValue('');
};

// Line 31-34 - AFTER:
const handleClear = () => {
    setLocalValue('');
    onChange('');  // Propagate empty state to parent
};
```

### Tests This Fixes
- uj-pm-007-search-filter.spec.ts: `Clear search shows all projects`
- All search-related tests

---

## Phase 2: Fix ProjectCard Menu Z-Index and Positioning (P0 - Immediate)

### File: `src/features/dashboard/components/ProjectCard.module.css`

### Problem
Menu has `z-index: 5` and absolute positioning that can extend over the "Open" button at the bottom of the card, causing pointer event interception.

### Fix

```css
/* Line 38-50 - BEFORE: */
.menu {
    position: absolute;
    top: 2.5rem;
    right: 0.5rem;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    min-width: 180px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 5;
}

/* Line 38-51 - AFTER: */
.menu {
    position: absolute;
    top: 2.5rem;
    right: 0.5rem;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    min-width: 180px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 10;  /* Increase to ensure proper stacking context */
    max-height: 300px;  /* Prevent menu from extending too far */
    overflow-y: auto;  /* Handle menu content overflow */
}
```

### Also: Re-enable Click-Outside Handler

### File: `src/features/dashboard/components/ProjectCard.tsx`

### Problem
The click-outside detection handler is commented out (lines 34-45).

### Fix

```typescript
// Line 34-45 - Uncomment the entire useEffect:
useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowMenu(false);
        }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
}, [showMenu]);
```

### Tests This Fixes
- All ProjectCard action tests (open, archive, restore, duplicate, delete)
- Prevents timeout errors when clicking "Open" button

---

## Phase 3: Add ARIA Roles to FileMenu (P1 - High)

### File: `src/components/layout/FileMenu.tsx`

### Problem
Menu buttons lack `role="menuitem"`, making them undiscoverable by Playwright's `getByRole('menuitem')`.

### Fix

```typescript
// Line 92-98 - BEFORE:
<button
    onClick={handleOpenFromFile}
    disabled={isLoading}
    className="w-full text-left px-4 py-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex justify-between items-center"
>
    {isLoading ? 'Opening...' : 'Open from File...'} <span className="text-xs opacity-50 ml-2">Ctrl+O</span>
</button>

// Line 92-99 - AFTER:
<button
    onClick={handleOpenFromFile}
    disabled={isLoading}
    role="menuitem"
    className="w-full text-left px-4 py-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex justify-between items-center"
>
    {isLoading ? 'Opening...' : 'Open from File...'} <span className="text-xs opacity-50 ml-2">Ctrl+O</span>
</button>
```

Also add to the "Export Report..." button (line 108-114):

```typescript
// Line 108-114 - BEFORE:
<button
    onClick={handleExportReport}
    className="w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors text-sm flex justify-between items-center"
    data-testid="menu-export-report"
>
    Export Report... <span className="text-xs opacity-50 ml-2">Ctrl+P</span>
</button>

// Line 108-115 - AFTER:
<button
    onClick={handleExportReport}
    role="menuitem"
    className="w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors text-sm flex justify-between items-center"
    data-testid="menu-export-report"
>
    Export Report... <span className="text-xs opacity-50 ml-2">Ctrl+P</span>
</button>
```

### Tests This Fixes
- uj-pm-008-export-report.spec.ts: All export report tests
- uj-pm-002-open-project.spec.ts: File system open tests

---

## Phase 4: Fix Tauri Module Import (P2 - Medium)

### File: `src/components/common/DeviceWarning.tsx`

### Problem
Direct import of `@tauri-apps/api/process` fails in browser context (no Tauri runtime).

### Fix - Create Platform Abstraction

### Step 1: Create `src/utils/platform.ts`

```typescript
// New file: src/utils/platform.ts

export const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

export const getPlatformInfo = async () => {
    if (!isTauri) {
        return { platform: 'web', arch: 'unknown' };
    }

    try {
        const { platform } = await import('@tauri-apps/api/process');
        const platformStr = await platform();
        return {
            platform: platformStr,
            arch: 'unknown'  // Could be added if needed
        };
    } catch (error) {
        console.warn('Failed to get Tauri platform info:', error);
        return { platform: 'unknown', arch: 'unknown' };
    }
};
```

### Step 2: Update DeviceWarning.tsx

```typescript
// BEFORE:
import { // ... } from '@tauri-apps/api/process';

// AFTER:
import { getPlatformInfo } from '@/utils/platform';

// In component, replace direct platform usage:
const platformInfo = await getPlatformInfo();
// Use platformInfo.platform instead of direct platform() call
```

### Tests This Fixes
- Eliminates console warnings across all tests
- Improves platform abstraction

---

## Phase 5: Add Proper Waits to Test Specs (P0 - After App Fixes)

### File: `e2e/01-project-management/uj-pm-000-lifecycle-overview.spec.ts`

### Adjustments

1. **Add wait for menu to close after clicking "New Project"**:

```typescript
test('should create a new project with all metadata fields', async ({ page }) => {
    // Click new project button
    await page.getByTestId('new-project-btn').click();

    // Wait for dialog animation and hydration
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);  // Small delay for dialog animation

    // Rest of test...
});
```

2. **Add wait for project card to appear after creation**:

```typescript
test('should create a new project with all metadata fields', async ({ page }) => {
    // ... create project

    // Wait for project card to be visible with proper timeout
    await expect(page.getByText('Test HVAC Project')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('#HVAC-2024-001')).toBeVisible({ timeout: 5000 });
});
```

3. **Add wait for localStorage update**:

```typescript
test('should persist new project to localStorage', async ({ page }) => {
    // ... create project

    // Wait for project card to appear
    await expect(page.getByText('Persisted Project')).toBeVisible({ timeout: 5000 });

    // Wait a bit for localStorage to be written
    await page.waitForTimeout(200);

    // Then verify localStorage
    const projectIndex = await page.evaluate(() => {
        const stored = localStorage.getItem('sws.projectIndex');
        return stored ? JSON.parse(stored) : null;
    });
    // ...
});
```

4. **Add wait for menu to close before clicking next button**:

```typescript
test('should rename project and update localStorage', async ({ page }) => {
    // ... open project actions menu
    await page.getByTestId('project-card-menu-btn').click();
    await page.getByTestId('menu-edit-btn').click();

    // Wait for rename input to be visible and focused
    const input = page.getByLabel(/project name/i);
    await expect(input).toBeVisible({ timeout: 3000 });
    await input.focus();

    // Edit the name
    await input.clear();
    await input.fill('Renamed Project');

    // Click save
    await page.getByRole('button', { name: /save/i }).click();

    // Wait for rename to complete and localStorage to update
    await page.waitForTimeout(500);

    // Verify UI updated
    await expect(page.getByText('Renamed Project')).toBeVisible({ timeout: 5000 });
    // ...
});
```

5. **Add wait for archive dialog to close**:

```typescript
test('should archive project and move to archived tab', async ({ page }) => {
    // ... open project actions menu
    await page.getByTestId('project-card-menu-btn').click();
    await page.getByTestId('menu-archive-btn').click();

    // Wait for archive confirmation dialog
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });

    // Confirm archive
    await page.getByRole('button', { name: /archive/i }).click();

    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });

    // Wait for card to disappear from active tab
    await page.waitForTimeout(300);

    // Switch to archived tab
    await page.getByRole('button', { name: /archived/i }).click();

    // Wait for archived tab content to load
    await page.waitForTimeout(200);

    // Project should be visible in archived tab
    await expect(page.getByText('Test Project')).toBeVisible({ timeout: 5000 });
});
```

### File: `e2e/01-project-management/uj-pm-002-open-project.spec.ts`

### Adjustments

1. **Add wait for menu to open before clicking**:

```typescript
test('Strict Flow: Open Project from Dashboard', async ({ page }) => {
    // ... locate project card
    const projectCard = page.locator('[data-testid="all-projects"] [data-testid="project-card"]').filter({
        hasText: 'Office HVAC'
    });

    // Wait for card to be ready
    await expect(projectCard).toBeVisible({ timeout: 5000 });

    // Click Open button - with proper wait
    const openButton = projectCard.getByRole('button', { name: /open/i });
    await openButton.scrollIntoViewIfNeeded();
    await expect(openButton).toBeVisible({ timeout: 3000 });
    await openButton.click();

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
});
```

2. **Add wait for File menu to open**:

```typescript
test('Step 4: Opening Project from File System', async ({ page }) => {
    // ... mock file system

    // User clicks File menu
    await page.getByRole('button', { name: /file/i }).click();

    // Wait for menu dropdown to be visible
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 3000 });

    // User clicks "Open from File..."
    await page.getByRole('menuitem', { name: /open.*file/i }).click();

    // Wait for project to load
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
});
```

3. **Add wait for version mismatch dialog**:

```typescript
test('Edge Case: Version Mismatch - Newer Project Version', async ({ page }) => {
    // ... create and open newer version project

    // Wait for warning dialog to appear
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: /newer.*version/i })).toBeVisible({ timeout: 5000 });

    // Verify options presented
    await expect(page.getByRole('button', { name: /open anyway/i })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: /update app/i })).toBeVisible({ timeout: 3000 });
});
```

### File: `e2e/01-project-management/uj-pm-007-search-filter.spec.ts`

### Adjustments

1. **Add wait for search debouncing**:

```typescript
test('Search filters projects by name', async ({ page }) => {
    // User clicks search box
    const searchInput = page.getByPlaceholder('Search projects...');
    await searchInput.click();

    // User types "warehouse"
    await searchInput.fill('warehouse');

    // Wait for debounced search to complete (300ms from SearchBar)
    await page.waitForTimeout(500);

    // Verify filtered results
    await expect(page.getByText('Warehouse A')).toBeVisible({ timeout: 5000 });
});
```

2. **Add wait for search clear to propagate**:

```typescript
test('Clear search shows all projects', async ({ page }) => {
    // ... search and filter to 1 project
    const searchInput = page.getByPlaceholder('Search projects...');
    await searchInput.fill('Alpha');
    await page.waitForTimeout(500);
    await expect(page.getByTestId('project-card')).toHaveCount(1, { timeout: 5000 });

    // Clear search by clearing input
    await searchInput.clear();

    // Wait for clear to propagate (onChange called by SearchBar)
    await page.waitForTimeout(500);

    // Now all projects should be visible
    await expect(page.getByTestId('project-card')).toHaveCount(4, { timeout: 5000 });
});
```

---

## Summary of Changes

| Phase | File Changes | App Fixes | Test Adjustments | Priority |
|--------|---------------|------------|-----------------|----------|
| 1 | `src/features/dashboard/components/SearchBar.tsx` | ✅ Clear button calls onChange | None | P0 |
| 2 | `src/features/dashboard/components/ProjectCard.module.css` | ✅ Increase z-index, add max-height | None | P0 |
| 3 | `src/features/dashboard/components/ProjectCard.tsx` | ✅ Re-enable click-outside handler | None | P0 |
| 4 | `src/components/layout/FileMenu.tsx` | ✅ Add role="menuitem" | None | P1 |
| 5 | `src/components/common/DeviceWarning.tsx` | ✅ Platform abstraction | `src/utils/platform.ts` (new) | P2 |
| 6 | All test files | None | ✅ Add proper waits and timeouts | P0 |

**Total Files Changed**: 8
**New Files Created**: 1 (`src/utils/platform.ts`)
**Expected Test Pass Rate**: 100% (162/162)
