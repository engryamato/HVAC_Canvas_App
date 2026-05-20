# Phase 07: Validation & QA

**Status:** Not Started · **Owner:** QA Lead + FE Engineer · **Est. Duration:** 3 days

---

## 1. Objective

Validate that all Phase 03–06 deliverables meet their acceptance criteria before rollout. This phase covers automated testing (unit, E2E, visual regression, accessibility), manual QA, and sign-off gate.

---

## 2. Test Strategy Overview

```
Unit Tests (Vitest)
  └── Store: catalogDensity default, setCatalogDensity, partialize
  └── CatalogRow: renders name, meta, icon, aria-pressed state
  └── Search debounce: debounces at 100ms

Integration Tests (Vitest + Testing Library)
  └── CatalogPanel: Compact mode renders CatalogRow, not CatalogCard
  └── CatalogPanel: Comfortable mode renders CatalogCard, not CatalogRow
  └── CatalogPanel: density toggle switches mode
  └── CatalogPanel: chip strip filters entries by category
  └── CatalogPanel: search query filters entries

E2E Tests (Playwright)
  └── Density pref persists after reload
  └── Compact: ≥ 10 rows visible at 300px × 900px
  └── Keyboard: Tab + ArrowDown navigate rows
  └── Keyboard: Escape closes context menu
  └── Search: < 50ms results render

Visual Regression (Playwright toHaveScreenshot)
  └── Compact mode at 250px, 300px, 400px sidebar width
  └── Comfortable mode (no visual change expected)
  └── Active row selection highlight
  └── Density toggle (both states)
  └── Category chip strip (All / filtered states)

Accessibility (axe-core via accessibility_checker.py)
  └── 0 critical, 0 serious violations on catalog panel
```

---

## 3. Unit Test Checklist

### `useLayoutStore.catalogDensity`

| Test Case | Expected |
|-----------|---------|
| Default value of `catalogDensity` | `'compact'` |
| `setCatalogDensity('comfortable')` | State becomes `'comfortable'` |
| `setCatalogDensity('compact')` | State becomes `'compact'` |
| `partialize` includes `catalogDensity` | `true` |
| After `resetLayout()`, `catalogDensity` returns to `'compact'` | `true` |

### `CatalogRow` Component

| Test Case | Expected |
|-----------|---------|
| Renders `entry.name` | Visible in DOM |
| Renders category meta | `categoryId.replace(/_/g, ' ')` present |
| `active={true}` applies active border class | `border-l-2 border-sky-500` in className |
| `aria-pressed={true}` on select button when active | Attribute present |
| `⋮` button opens context menu | `role="menu"` appears in DOM |
| `Escape` key on context menu closes it | `role="menu"` removed from DOM |
| Icon has `aria-hidden="true"` | Attribute present on icon element |

### Search Debounce

| Test Case | Expected |
|-----------|---------|
| Typing triggers `setSearchQuery` after 100 ms | Mock timer resolves to 1 call |
| Rapid typing (5 chars in 50 ms) calls `setSearchQuery` once | Not 5 times |

---

## 4. Integration Test Checklist

File: `src/features/canvas/__tests__/CatalogPanel.integration.test.tsx`

| Test Case | Expected |
|-----------|---------|
| Compact mode: items render as `[data-testid^="catalog-row-"]` | ≥ 1 present |
| Comfortable mode: items render as `[data-testid^="catalog-card-icon-"]` | ≥ 1 present |
| Compact mode: NO `[data-testid^="catalog-card-icon-"]` | 0 present |
| Comfortable mode: NO `[data-testid^="catalog-row-"]` | 0 present |
| Density toggle click changes mode | DOM switches from rows to cards |
| Chip strip "All" selected by default | `aria-pressed="true"` on "All" chip |
| Chip strip click filters `visibleEntries` | List length decreases |
| Search input filters entries | Fewer rows shown |
| Search "no results" state | Empty state element visible |
| `data-testid="catalog-active-fittings"` present when entry has fittings | Present |

---

## 5. E2E Test Cases

File: `e2e/catalog-density.spec.ts`

```ts
test.describe('Catalog Compact Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForSelector('[data-testid="catalog-panel"]');
  });

  test('shows ≥ 10 rows at default 300px sidebar width', async ({ page }) => {
    const rows = page.locator('[data-testid^="catalog-row-"]');
    expect(await rows.count()).toBeGreaterThanOrEqual(10);
  });

  test('density pref persists after page reload', async ({ page }) => {
    await page.click('[data-testid="density-toggle-comfortable"]');
    await page.reload();
    await expect(page.locator('[data-testid="density-toggle-comfortable"]'))
      .toHaveAttribute('aria-pressed', 'true');
    // And no compact rows visible
    expect(await page.locator('[data-testid^="catalog-row-"]').count()).toBe(0);
  });

  test('keyboard ArrowDown navigates rows', async ({ page }) => {
    await page.focus('[data-testid^="catalog-row-"]:first-child button');
    await page.keyboard.press('ArrowDown');
    // Second row button is now focused
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    // assert it's the second row's button
  });

  test('Escape closes context menu and returns focus', async ({ page }) => {
    const triggerBtn = page.locator('[aria-label^="Actions for"]').first();
    await triggerBtn.click();
    await expect(page.locator('[role="menu"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="menu"]')).not.toBeVisible();
    // Focus should be back on trigger
  });

  test('search results update within 50ms', async ({ page }) => {
    const start = Date.now();
    await page.fill('[placeholder*="Search name"]', 'duct');
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('[data-testid^="catalog-row-"]');
      return rows.length > 0; // at least some results
    });
    expect(Date.now() - start).toBeLessThan(500); // generous bound for CI
  });
});
```

---

## 6. Visual Regression Test Cases

File: `e2e/catalog-visual.spec.ts`

| Scenario | Snapshot Name |
|----------|---------------|
| Compact mode, sidebar 300 px, no filter | `compact-300px-all.png` |
| Compact mode, sidebar 250 px, no filter | `compact-250px-all.png` |
| Compact mode, sidebar 400 px, no filter | `compact-400px-all.png` |
| Comfortable mode, sidebar 300 px | `comfortable-300px-all.png` |
| Compact mode, first row selected (active state) | `compact-row-active.png` |
| Compact mode, chip filter active | `compact-chip-filter.png` |
| Density toggle showing Comfortable active | `density-toggle-comfortable.png` |
| Empty state (no search results) | `compact-empty-state.png` |

Use `toHaveScreenshot({ maxDiffPixels: 100 })` for tolerance on anti-aliasing.

---

## 7. Regression: Existing Playwright Tests

Run the full Playwright suite (`npx playwright test`) after Phase 03–06 implementation. The following tests are known to touch the catalog panel and **must not break**:

- Any test using `data-testid="catalog-panel"` — still present in `LeftSidebar.tsx`.
- Any test using `data-testid="tab-catalog"` — unchanged in `LeftSidebar.tsx`.
- Any test using `data-testid="catalog-category-*"` — migrated to chip strip with same testid.
- Any test using `data-testid="catalog-active-fittings"` / `catalog-active-accessories` — unchanged (in panel footer).

---

## 8. Manual QA Checklist

Complete these manually before signing off:

- [ ] Open the app at default window size; confirm Compact is default.
- [ ] Count visible rows without scrolling at 300 px sidebar width — must be ≥ 10.
- [ ] Toggle to Comfortable; confirm card grid renders as before.
- [ ] Reload page; confirm Comfortable mode persists.
- [ ] Toggle back to Compact; reload; confirm Compact persists.
- [ ] Resize sidebar to 250 px; confirm no horizontal overflow in chip strip or rows.
- [ ] Resize sidebar to 500 px; confirm rows expand cleanly.
- [ ] Type a search query; confirm rows filter correctly.
- [ ] Click a chip; confirm rows filter by category.
- [ ] Click "All" chip; confirm all rows return.
- [ ] Click a row; confirm it becomes visually selected (blue left border + bg).
- [ ] Click `⋮` on a row; confirm context menu appears.
- [ ] Press `Escape` on the open context menu; confirm it closes.
- [ ] Navigate rows with keyboard (Tab + ArrowDown/ArrowUp); confirm focus rings visible.

---

## 9. QA Sign-Off Document

After all tests pass, the QA Lead creates a sign-off comment in the PR using this template:

```
## QA Sign-Off

Phase: 07 Validation & QA
Date: YYYY-MM-DD
Tested by: [Name]

### Automated
- [ ] Vitest unit: 0 failures
- [ ] Playwright E2E: 0 failures
- [ ] Visual regression: 0 unexpected diffs
- [ ] axe-core: 0 critical, 0 serious violations

### Manual
- [ ] All 15 manual checklist items passed
- [ ] Tested on Chrome + Firefox at 1440×900

### Verdict: ✅ APPROVED for rollout
```

---

## 10. Acceptance Criteria

- [ ] All unit tests pass (Vitest).
- [ ] All E2E tests pass (Playwright) including new density tests.
- [ ] All existing Playwright tests still pass (no regressions).
- [ ] 0 axe-core critical/serious violations.
- [ ] All visual regression snapshots approved.
- [ ] Manual QA checklist 100% complete.
- [ ] QA sign-off comment posted in PR.
