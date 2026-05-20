# Phase 04: Density Toggle & Persistence

**Status:** Not Started · **Owner:** FE Architect · **Est. Duration:** 2 days

---

## 1. Objective

Wire the density toggle UI (designed in Phase 02, implemented in Phase 03) to a persisted state in `useLayoutStore`. The user's preference must survive page reloads, hot-reloads, and tab switches within the same browser session.

---

## 2. Store Extension

### File: `src/stores/useLayoutStore.ts`

Add `catalogDensity` to the store interface and `partialize` function. The key `hvac-layout-preferences` in localStorage already exists — extending it avoids any migration issues.

```ts
// useLayoutStore.ts

interface LayoutStoreState {
  // ... existing fields ...

  /** Catalog panel density preference. Default: 'compact'. */
  catalogDensity: 'compact' | 'comfortable';
  setCatalogDensity: (density: 'compact' | 'comfortable') => void;
}

// Inside create():
catalogDensity: 'compact',  // safe default — more items visible

setCatalogDensity: (density) => set({ catalogDensity: density }),

// In partialize():
partialize: (state) => ({
  leftSidebarCollapsed: state.leftSidebarCollapsed,
  rightSidebarCollapsed: state.rightSidebarCollapsed,
  activeLeftTab: state.activeLeftTab,
  activeRightTab: state.activeRightTab,
  activeDockPanel: state.activeDockPanel,
  catalogDensity: state.catalogDensity,   // <-- ADD THIS
}),
```

> **Why `'compact'` as default?** This is the primary deliverable of this epic — shipping with Compact as default captures the density gain immediately. Comfortable remains available for users who prefer the larger card view.

---

## 3. Density Toggle Component

### Placement in `CatalogPanel.tsx`

Add the toggle to the catalog header row (the `div` containing the HVAC Library logo + Clear button). Place it between the logo group and the Clear button.

```tsx
// src/features/canvas/components/CatalogPanel.tsx

const catalogDensity = useLayoutStore((state) => state.catalogDensity);
const setCatalogDensity = useLayoutStore((state) => state.setCatalogDensity);

// In the header JSX:
<div
  role="group"
  aria-label="Catalog density"
  className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 gap-0.5"
>
  <button
    type="button"
    aria-pressed={catalogDensity === 'compact'}
    onClick={() => setCatalogDensity('compact')}
    className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition ${
      catalogDensity === 'compact'
        ? 'bg-white shadow-sm text-slate-900'
        : 'text-slate-500 hover:text-slate-700'
    }`}
    data-testid="density-toggle-compact"
  >
    Compact
  </button>
  <button
    type="button"
    aria-pressed={catalogDensity === 'comfortable'}
    onClick={() => setCatalogDensity('comfortable')}
    className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition ${
      catalogDensity === 'comfortable'
        ? 'bg-white shadow-sm text-slate-900'
        : 'text-slate-500 hover:text-slate-700'
    }`}
    data-testid="density-toggle-comfortable"
  >
    Comfortable
  </button>
</div>
```

---

## 4. Persistence Behavior Specification

| Scenario | Expected Behavior |
|----------|-------------------|
| User sets density to Comfortable | `localStorage['hvac-layout-preferences']` updates immediately (Zustand `persist` is synchronous on write) |
| User reloads the page | Density toggle shows Comfortable, catalog renders card grid |
| User opens a new tab (same origin) | New tab reads from localStorage; density preference applied on mount |
| User clears browser storage | Defaults to `'compact'` (set in `defaultState`) |
| Sidebar collapses and re-expands | Density preference unchanged; same mode rendered on re-expand |
| `setCatalogDensity` called during hot-reload (dev) | No conflict; Zustand `persist` re-hydrates from localStorage after next full mount |

### Storage Key Audit

Current `localStorage` key: **`hvac-layout-preferences`**

Current persisted fields (from `partialize`):
```json
{
  "leftSidebarCollapsed": false,
  "rightSidebarCollapsed": false,
  "activeLeftTab": "library",
  "activeRightTab": "properties",
  "activeDockPanel": "none"
}
```

After Phase 04:
```json
{
  "leftSidebarCollapsed": false,
  "rightSidebarCollapsed": false,
  "activeLeftTab": "library",
  "activeRightTab": "properties",
  "activeDockPanel": "none",
  "catalogDensity": "compact"
}
```

No version bump needed; Zustand `persist` merges missing fields with defaults on hydration.

---

## 5. Transition Animation

Switching density should animate smoothly, not flash. Apply a CSS transition on the catalog list container:

```tsx
<div
  className={`flex flex-col transition-all duration-150 ${
    catalogDensity === 'compact' ? 'gap-0.5' : 'gap-3'
  }`}
>
```

The `duration-150` matches existing sidebar transitions in `LeftSidebar.tsx`.

---

## 6. Tests

### Unit Test (Vitest)

File: `src/features/canvas/__tests__/CatalogPanel.density.test.tsx`

```ts
import { renderWithStore } from '@/test/utils';
import { CatalogPanel } from '../components/CatalogPanel';
import { useLayoutStore } from '@/stores/useLayoutStore';

test('defaults to compact density', () => {
  const { density } = useLayoutStore.getState();
  expect(density).toBe('compact');  // ← ensure default
});

test('toggles to comfortable on click', async () => {
  const { getByTestId } = renderWithStore(<CatalogPanel />);
  await userEvent.click(getByTestId('density-toggle-comfortable'));
  expect(useLayoutStore.getState().catalogDensity).toBe('comfortable');
});

test('persists density across re-mount', () => {
  useLayoutStore.setState({ catalogDensity: 'comfortable' });
  // simulate storage read by rehydrating
  // ... assert that store reads 'comfortable' from localStorage mock
});
```

### E2E Test (Playwright)

File: `e2e/catalog-density.spec.ts`

```ts
test('density preference persists after page reload', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="density-toggle-comfortable"]');
  await page.reload();
  await expect(page.locator('[data-testid="density-toggle-comfortable"]'))
    .toHaveAttribute('aria-pressed', 'true');
});
```

---

## 7. Deliverables

- [ ] `useLayoutStore.ts` extended with `catalogDensity` field and `setCatalogDensity` action.
- [ ] `catalogDensity` included in `partialize` (persisted to localStorage).
- [ ] Density toggle UI rendered in `CatalogPanel.tsx` header with `data-testid` attributes.
- [ ] Unit test for default value, toggle action, and persistence.
- [ ] E2E test confirming preference survives page reload.

---

## 8. Acceptance Criteria

- [ ] `localStorage['hvac-layout-preferences']` contains `catalogDensity` after first toggle.
- [ ] Toggling Comfortable → Compact → reload → Compact is shown (no flash of wrong mode).
- [ ] `aria-pressed` attribute correctly reflects active density on both toggle buttons.
- [ ] No TypeScript errors on `useLayoutStore.ts` after extension.
- [ ] All existing Playwright tests still pass.
