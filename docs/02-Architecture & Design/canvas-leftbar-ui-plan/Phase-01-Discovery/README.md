# Phase 01: Discovery & Scope

**Status:** In Progress · **Owner:** UX Lead + FE Lead · **Est. Duration:** 3 days

---

## 1. Problem Statement

The `CatalogPanel` renders HVAC library items as large `CatalogCard` tiles (see `CatalogPanel.tsx:69–219`). Each card is approximately **140 px tall** and occupies a full grid cell. At the default sidebar width of **300 px** with a `sm:grid-cols-2` grid, only **4–5 items** are visible before scrolling. This forces engineers to scroll constantly while placing ductwork on the canvas — a high-frequency workflow that deserves a tighter, faster list.

The primary intervention is a **compact row layout** (≈ 36–44 px per row) replacing the card grid, surfacing more items per viewport while keeping the critical metadata readable.

---

## 2. User Workflow Analysis

### Primary Use Case: Drag-and-Place from Catalog

1. Engineer opens canvas with a blank or partially built duct plan.
2. Opens the left sidebar to the **Library** tab.
3. Filters or scrolls to find the target component (e.g., `Standard Ductwork > Rectangular 12×8`).
4. Clicks the item to activate it (`selectEntry` call → `activeEntryId` in `useUnifiedCatalogStore`).
5. Clicks or drags on the canvas to place the component.
6. Repeats steps 3–5 many times per session.

**Pain Point:** Steps 3 and 6 are slow due to excessive scrolling in the current card grid.

### Secondary Use Case: Browse by Category

- User expands a root domain (e.g., `Air Distribution`) in the left accordion tree.
- Clicks a sub-category chip to filter the right-side card grid.
- The two-column layout forces a split-view with the sidebar taking 220 px for the tree + remaining space for cards.

**Pain Point:** The `lg:grid-cols-[220px_minmax(0,1fr)]` layout inside `CatalogPanel.tsx:443` requires a wide sidebar. At 300 px default width, the card column is only ~80 px — the layout breaks on smaller sidebar widths.

---

## 3. Scope Definition

### In-Scope

- Replace `CatalogCard` with a `CatalogRow` component in `CatalogPanel.tsx`.
- Add a **density toggle** (`compact` / `comfortable`) to the catalog header.
- Persist density preference in `useLayoutStore` via Zustand `persist` middleware (already wired to `localStorage` key `hvac-layout-preferences`).
- Ensure all existing `data-testid` attributes remain intact for Playwright continuity.
- Keep the left category tree intact; simplify it to a single-column vertical list.
- Update `catalogIcons.tsx` icon sizes: 16 px (compact) / 20 px (comfortable).

### Out-of-Scope

- No changes to `ManagePanel`, `RightSidebar`, `BOMPanel`, or `Toolbar`.
- No changes to `UnifiedComponentDefinition` Zod schema or store actions.
- No new API calls or data fetching — all catalog data is already in the Zustand store.
- No Tauri desktop-specific paths; the sidebar is Next.js (web) only.
- No dark mode implementation in this epic.

---

## 4. Success Metrics & Measurement Plan

| Metric | Measurement Method | Target |
|--------|--------------------|--------|
| **Items visible at default viewport** | Manual count: 300 px sidebar, 900 px window height, no scroll | ≥ 10 in Compact |
| **Time to first click (catalog → canvas)** | Playwright: `performance.measure()` from catalog tab open to `selectEntry` | < 150 ms p95 |
| **Layout break-point regression** | Playwright screenshot at sidebar widths: 250, 300, 400, 500 px | No horizontal overflow |
| **Density pref persistence** | Playwright: set to `comfortable`, reload page, assert toggle state | 100% reliable |
| **Search latency** | Playwright: type 3-char query, measure to results update | < 50 ms p95 |
| **a11y violations** | `axe-core` via `accessibility_checker.py` on catalog panel | 0 critical, 0 serious |

---

## 5. Stakeholder Map

| Stakeholder | Interest | Sign-Off Required |
|-------------|----------|-------------------|
| UX Lead | Row layout, density toggle UX, visual hierarchy | ✅ Design spec |
| FE Architect | Store shape, Tailwind token strategy, bundle impact | ✅ ADR for `useLayoutStore` extension |
| QA Lead | `data-testid` continuity, regression coverage | ✅ QA test plan |
| Product Owner | Scope boundary, rollout plan | ✅ Release notes |

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Long-time users disoriented by row layout | Medium | Medium | Default to Compact only; Comfortable mode available from day one |
| Sidebar at min-width (250 px) breaks row layout | Medium | High | Test at 250 px explicitly; use `min-w-0 truncate` on text |
| `data-testid` renames break Playwright CI | Low | High | Audit all `data-testid` in `CatalogPanel.tsx` before touching markup |
| `useLayoutStore` persist key conflict | Low | Medium | Extend existing `partialize` function; do not rename the storage key |
| Icon clarity lost at 16 px compact size | Low | Low | Validate with `catalogIcons.tsx` icon set at 16 px in Storybook |

---

## 7. Deliverables

- [ ] **Discovery Brief** (this document, revised after stakeholder review).
- [ ] **Signed metric targets** from Product Owner.
- [ ] **`data-testid` audit** — list of all test IDs in `CatalogPanel.tsx` and `LeftSidebar.tsx`.
- [ ] **Dependency map** — confirm `useUnifiedCatalogStore` selectors used by `CatalogPanel` and which will remain unchanged.

---

## 8. Dependencies

- Access to `src/core/store/componentLibraryStoreV2.ts` for store shape review.
- Access to `tailwind.config.ts` for token additions.
- Playwright test suite able to run locally (`npx playwright test`).

---

## Acceptance Criteria

- [ ] All stakeholders have reviewed and acknowledged this phase document.
- [ ] Success metrics are documented with concrete numeric targets (see §4).
- [ ] Risk register is accepted by UX Lead and FE Architect.
- [ ] Phase 02 kickoff date is confirmed.
