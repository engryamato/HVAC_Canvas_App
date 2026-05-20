# Phase 06: Search, Data & Performance

**Status:** Not Started · **Owner:** FE Performance Engineer · **Est. Duration:** 2 days

---

## 1. Objective

Ensure the compact catalog list remains **fast at every catalog size** and that the search/filter pipeline has no latency regressions. This phase establishes baselines, identifies bottlenecks in the current `CatalogPanel` data flow, and applies targeted optimizations.

---

## 2. Current Data Flow Analysis

### Data Sources

The `CatalogPanel` reads from `useUnifiedCatalogStore` (Zustand):

```
useUnifiedCatalogStore
  ├─ categories: ComponentCategory[]       (small: ~10–20 items)
  ├─ catalogEntries: UnifiedComponentDefinition[]  (medium: ~100–500 items)
  ├─ activeEntryId: string | null
  ├─ systemProfiles: SystemProfile[]
  ├─ searchQuery: string
  └─ selectedCategoryId: string | null
```

### Derived Computations (all `useMemo`)

| Selector | Cost | Notes |
|----------|------|-------|
| `matchesQuery` | O(1) — returns a predicate | Called once per render, cheap |
| `matchingEntries` | O(N) over `catalogEntries` | Re-runs when `catalogEntries` or `query` changes |
| `filteredEntries` | O(N) | Re-runs when `catalogEntries`, `matchesQuery`, or `selectedCategoryId` changes |
| `matchingCategoryIds` | O(N × M) | N = entries, M = categories — double loop; potentially expensive at large N |
| `visibleRoots` | O(M²) | Nested `.filter` + `.some` |
| `visibleChildrenByRoot` | O(M) | Map construction |

**Current Bottleneck:** `matchingCategoryIds` (O(N × M)) runs on **every keystroke** in the search box. At N=500 entries, M=20 categories, this is 10,000 operations per keystroke. On a fast machine, this is imperceptible (<1 ms), but should be measured as baseline.

### Search Input Latency

The search input calls `setSearchQuery` on every `onChange` event (no debounce). `setSearchQuery` triggers a Zustand state update, which causes all `useMemo` selectors to re-run synchronously. At N=500, this is acceptable. At N=2000+, consider debouncing.

**Recommendation:** Add a 100 ms debounce on `setSearchQuery` to prevent UI jank at large catalog sizes.

---

## 3. Performance Baselines & Targets

### Measurement Setup

Use Playwright's `performance.measure()` API:

```ts
// e2e/catalog-performance.spec.ts
test('search latency baseline', async ({ page }) => {
  await page.goto('/canvas');
  const start = await page.evaluate(() => performance.now());
  await page.fill('[placeholder*="Search name"]', 'duct');
  await page.waitForTimeout(200); // allow render
  const end = await page.evaluate(() => performance.now());
  console.log(`Search render time: ${end - start}ms`);
});
```

| Metric | Measurement Method | Target |
|--------|-------------------|--------|
| Search keystroke → visible results | `performance.measure()` | < 50 ms p95 |
| Density toggle → re-render complete | `performance.measure()` | < 100 ms p95 |
| Category chip click → list update | `performance.measure()` | < 30 ms p95 |
| Initial catalog panel mount | React DevTools Profiler | < 100 ms |
| Scroll FPS at N=500 rows (Compact) | Chrome DevTools → Frame rate | ≥ 60 FPS |

---

## 4. Virtualization Decision

### When Is Virtualization Needed?

The compact row height is 36 px. At N=500 items with all categories visible, the list is 18,000 px tall. DOM rendering 500 `<article>` elements is feasible but may cause scroll jank.

**Decision tree:**

```
N < 100 items → No virtualization needed
100 ≤ N < 300 → Monitor FPS; apply CSS containment
N ≥ 300 → Implement windowed virtualization (TanStack Virtual)
```

Current catalog size: ~100–150 placeable entries (typical HVAC project). **Virtualization is not needed now**, but the implementation should be **virtualization-ready** (use a flat `<ul>` list, not nested grids, so `@tanstack/react-virtual` can be dropped in later).

### CSS Containment (Apply Regardless)

Add `contain: strict` on the scrollable list container:

```tsx
<ul
  role="list"
  style={{ contain: 'strict' }}
  className="min-h-0 flex-1 overflow-y-auto"
>
```

`contain: strict` tells the browser the element's subtree does not affect layout or paint outside its bounds, enabling aggressive paint optimizations.

---

## 5. Search Debounce Implementation

### Current (no debounce)

```tsx
// CatalogPanel.tsx:436
onChange={(event) => setSearchQuery(event.target.value)}
```

### Proposed (100 ms debounce)

```tsx
import { useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce'; // already a dep? check package.json

const handleSearchChange = useDebouncedCallback(
  (value: string) => setSearchQuery(value),
  100
);

// In JSX:
onChange={(e) => handleSearchChange(e.target.value)}
```

> Check `hvac-design-app/package.json` for `use-debounce`. If not present, implement with `useRef` + `setTimeout` rather than adding a new dependency.

**Alternative (no new dep):**

```tsx
const debounceRef = useRef<NodeJS.Timeout>();
const handleSearchChange = (value: string) => {
  clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => setSearchQuery(value), 100);
};
```

---

## 6. `matchingCategoryIds` Optimization

The current O(N × M) double loop can be restructured to O(N + M):

```ts
// Before (CatalogPanel.tsx:285–305): O(N × M) — one filter per category
matchingEntries.some((entry) => entry.categoryId === category.id)

// After: O(N) — build a Set first, then O(1) lookups
const matchedCategoryIdSet = useMemo(() => {
  return new Set(matchingEntries.map((e) => e.categoryId));
}, [matchingEntries]);

// Then in matchingCategoryIds:
const hasMatchingEntry = matchedCategoryIdSet.has(category.id);  // O(1)
```

This optimization keeps the `useMemo` dep array clean and reduces re-computation cost significantly at large N.

---

## 7. React Rendering Optimizations

### Memoize `CatalogRow` and `CatalogCard`

Wrap both components with `React.memo` to prevent re-renders when sibling items change selection:

```tsx
const CatalogRow = React.memo(function CatalogRow({ entry, active, ... }) {
  ...
});

const CatalogCard = React.memo(function CatalogCard({ entry, active, ... }) {
  ...
});
```

Ensure the `active` prop is derived from `activeEntryId === entry.id` at the list level (already done in current `CatalogPanel.tsx:543`), not inside the component.

### Stable Callback References

All `onSelect`, `onClone`, `onCustomize`, `onEdit`, `onDelete` callbacks are created inline in the `visibleEntries.map()` call. Memoize them per-entry with `useCallback` if `React.memo` shows they're still causing re-renders (measure first with React DevTools Profiler).

---

## 8. Bundle Impact

The changes in this epic should add minimal bundle weight:

| Change | Expected Bundle Delta |
|--------|----------------------|
| `CatalogRow` component | +1–2 KB (markup only, no new deps) |
| `useLayoutStore` extension | +0.1 KB |
| Debounce (if using `useRef`) | +0 KB |
| CSS containment | +0 KB |
| `React.memo` wrappers | +0 KB |

Run `bundle_analyzer.py` before and after Phase 03–04 implementation to confirm < 2 KB gzipped delta.

---

## 9. Deliverables

- [ ] Performance baselines measured and documented (Playwright + Chrome DevTools).
- [ ] `matchingCategoryIds` optimized from O(N×M) to O(N+M) using Set pre-indexing.
- [ ] Search debounce implemented (100 ms).
- [ ] `CatalogRow` and `CatalogCard` wrapped in `React.memo`.
- [ ] `contain: strict` applied to the scrollable list container.
- [ ] Bundle delta measured and confirmed < 2 KB gzipped.

---

## 10. Acceptance Criteria

- [ ] Search keystroke → results update in < 50 ms p95 (Playwright measurement).
- [ ] Density toggle re-renders in < 100 ms p95.
- [ ] Scroll FPS ≥ 60 at N=150 rows in Compact mode (Chrome DevTools).
- [ ] `bundle_analyzer.py` reports < 2 KB gzipped increase.
- [ ] No new React warnings about excessive re-renders in DevTools Profiler.
