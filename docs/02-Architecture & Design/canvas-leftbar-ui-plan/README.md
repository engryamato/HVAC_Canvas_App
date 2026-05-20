# Canvas Left Bar — Compact Catalog UI Plan

> **Single source of truth** for the Library Catalog panel redesign in SizeWise HVAC Canvas.  
> **Status:** Drafting · **Branch:** `feat/resizable-inspector` · **Updated:** 2026-05-01

---

## Context & Motivation

The `CatalogPanel` (`src/features/canvas/components/CatalogPanel.tsx`) currently renders items as tall card tiles (`CatalogCard`) occupying ≈ 140px each. A dual-column grid at 300 px sidebar width shows only **4–5 items per viewport**. Engineers constantly scroll, interrupting the canvas placement workflow.

The goal: shift from card-first to **compact row-first** rendering so users see **10–15 items per viewport** at the default 300 px sidebar width — without losing the metadata richness that drives component selection decisions.

### Affected Files (code-level scope)

| File | Role | What Changes |
|------|------|--------------|
| `CatalogPanel.tsx` | Main panel component | Row layout, density prop, density toggle |
| `LeftSidebar.tsx` | Sidebar shell & tabs | Persistence wiring, sidebar width constraints |
| `AccordionLibrary.tsx` | Legacy library view | May be superseded or consolidated |
| `useLayoutStore.ts` | Zustand + persist store | Add `catalogDensity` field |
| `catalogIcons.tsx` | Icon resolver | Already has 18px icons, resize to 16/20px |
| `tailwind.config.ts` | Design tokens | Add `catalog-*` spacing tokens if needed |
| `globals.css` / `DESIGN_SYSTEM.md` | Design reference | Align to 4px grid, Slate/Technical-Blue palette |

### Non-Goals

- No changes to global `Header`, `RightSidebar`, or canvas rendering.
- No changes to `ManagePanel` or `BOMPanel`.
- No data model changes to `UnifiedComponentDefinition` or its Zod schema.
- No Tauri-specific code paths; the sidebar runs in the Next.js web layer only.

---

## Success Metrics

| Metric | Baseline | Target | How Measured |
|--------|----------|--------|--------------|
| Items visible in default viewport | 4–5 | ≥ 10 (Compact) | Manual count at 300 px width, 900 px window height |
| First-item click latency | < 50 ms | < 50 ms (no regression) | Playwright timeline trace |
| Lighthouse accessibility score | TBD | ≥ 95 | `lighthouse_audit.py` |
| axe-core violations on catalog panel | TBD | 0 critical, 0 serious | `accessibility_checker.py` |
| Density pref survival after page reload | N/A | 100% | Playwright assertion on localStorage key `hvac-layout-preferences` |
| Bundle size delta | — | < +2 KB gzipped | `bundle_analyzer.py` |

---

## Architecture Decision: Where Does Density Live?

`useLayoutStore` already uses `zustand/middleware/persist` with `partialize`. The `catalogDensity` field will be added to the store as `'compact' | 'comfortable'` and included in `partialize`. This avoids a new store and keeps all layout prefs co-located.

```ts
// useLayoutStore.ts — proposed extension
interface LayoutStoreState {
  // ... existing fields ...
  catalogDensity: 'compact' | 'comfortable';
  setCatalogDensity: (density: 'compact' | 'comfortable') => void;
}
```

---

## Phase Overview

| # | Phase | Owner | Est. Effort | Gate |
|---|-------|-------|-------------|------|
| 01 | [Discovery & Scope](./Phase-01-Discovery/README.md) | UX Lead + FE Lead | 3 days | Stakeholder sign-off on metrics |
| 02 | [UX/UI Specs & Design Tokens](./Phase-02-UXUI-Tokens/README.md) | Design Lead | 3 days | Token doc + annotated mockup |
| 03 | [Compact List Catalog Component](./Phase-03-Compact-List-UI/README.md) | FE Engineer | 4 days | Storybook + visual snapshot |
| 04 | [Density Toggle & Persistence](./Phase-04-DensityToggle/README.md) | FE Architect | 2 days | E2E: pref persists across reload |
| 05 | [Accessibility & Keyboard Nav](./Phase-05-Accessibility/README.md) | A11y Lead + FE | 3 days | 0 axe-core critical violations |
| 06 | [Search, Data & Performance](./Phase-06-DataSearchPerformance/README.md) | FE Perf Engineer | 2 days | Sub-50 ms search, smooth scroll |
| 07 | [Validation & QA](./Phase-07-ValidationQA/README.md) | QA Lead | 3 days | All test cases pass, no regressions |
| 08 | [Rollout & Handoff](./Phase-08-RolloutHandoff/README.md) | Product Owner | 1 day | Docs merged, changelog written |

**Total estimated effort:** ~3 weeks (with one engineer + designer pair).

---

## Key Constraints

1. **4 px grid** — all dimensions must be multiples of 4 (see `DESIGN_SYSTEM.md §2`).
2. **Tailwind-only** — no new CSS Modules; use existing Tailwind utilities and tokens.
3. **No MUI** — the catalog panel does not use Material UI; keep it that way.
4. **`isTauri` guards not needed** here — catalog panel is web-only logic.
5. **Do not break `data-testid` attributes** used by existing Playwright tests (`catalog-panel`, `tab-catalog`, `catalog-root-*`, `catalog-category-*`, `catalog-card-icon-*`).
