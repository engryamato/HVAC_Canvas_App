# PLAN-compact-icon-only.md

**Task:** When Compact density is active, placeable catalog entries show only the icon.
**Hover popup:** Hovering the icon in compact mode reveals a rich description popup.
**File:** `PLAN-compact-icon-only.md`
**Branch target:** `feat/compact-icon-only`

---

## Context

The Traycer Catalog panel (`CatalogPanel.tsx`) already has a `compact` / `comfortable` density toggle
stored in `useLayoutStore.catalogDensity`. Today, `compact` mode only slightly shrinks padding,
icon size, and font size — it still renders the full card (name, class pill, detail row, spec text).

**Goal:** When `compact` is active, each `CatalogRow` must render **only its icon badge**.
Hovering the icon must **pop up a rich description card** so the user never loses context.

---

## Scope

| In scope | Out of scope |
|---|---|
| `CatalogRow` JSX restructure for compact icon-only view | Adding a third density tier |
| CSS hover popup (group-hover pattern, no new library) | Changing the density toggle UI |
| Rich popup content: name, class pill, spec text, detail row | Changing the sidebar/domain nav |
| Unit test updates for `CatalogRow` + popup | E2E / Playwright tests |

---

## Architecture Analysis

### Existing tooltip pattern (source of truth)

`Toolbar.tsx` (`ToolButton`, lines 57–66) already implements the project's hover-tooltip convention:

```tsx
{/* Tooltip */}
<div
  className="
    absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs
    whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none
    transition-opacity duration-150 z-50
  "
>
  {label} <span className="text-slate-400">({shortcut})</span>
</div>
```

Key characteristics:
- **Trigger:** Tailwind `group` on the outer element + `group-hover:opacity-100` on the popup div
- **Visibility:** `opacity-0` → `opacity-100` (no mount/unmount, no JS state)
- **Pointer events:** `pointer-events-none` so the popup never blocks clicks
- **No external library** — pure CSS, consistent with the rest of the app

### Files to touch

| File | Change |
|---|---|
| `hvac-design-app/src/features/canvas/components/CatalogPanel.tsx` | Primary — `CatalogRow` render logic + popup |
| `hvac-design-app/src/features/canvas/components/__tests__/CatalogPanel.test.tsx` | Update/add compact + popup assertions |

### No store changes needed
`catalogDensity` is already persisted in `useLayoutStore`. `isCompact` is already derived inside
`CatalogRow` at line 98. The feature is purely presentational.

---

## Implementation Plan

### Phase 1 — `CatalogRow` Compact Layout (Primary Change)

**File:** `CatalogPanel.tsx` → `CatalogRow` component (lines 124–255)

#### 1.1 — Icon-only branch in the button trigger

Replace the inner layout of the trigger `<button>` (lines 131–168) with a two-branch conditional:

**Compact branch (new):**
```
<button>
  flex items-center justify-center  p-2  (square tap target)
  
  <span>  icon badge  h-9 w-9  (no mt-0.5, fully centered)
    <HvacCatalogIcon size={16} />
  </span>

  <!-- Hover popup — see Phase 2 -->
</button>
```

**Comfortable branch:** unchanged from current code.

#### 1.2 — Article wrapper changes

| Property | Compact | Comfortable |
|---|---|---|
| Border radius | `rounded-xl` | `rounded-2xl` (existing) |
| The `group` class | ✅ already present via `article` tag | same |

#### 1.3 — Context menu button (⋮)

Remains accessible in compact mode:
- Position: `absolute right-1 top-1` (was `right-2 top-2`)
- Size: `p-1` (tighter hit area)
- Opacity behaviour: unchanged (`group-hover:opacity-100`)

#### 1.4 — Entry list gap

Already handled at line 633: `gap-2` compact / `gap-3` comfortable. No change needed.

---

### Phase 2 — Hover Description Popup (EXPANDED)

> **Primary discoverability mechanism in compact mode.**
> Uses the same CSS `group-hover` pattern as `Toolbar.tsx` — no new library or dependency.

#### 2.1 — Popup structure

The popup is a sibling `<div>` **inside** the compact `<button>` (or directly inside the `<article>`
at the same level as the button — choose the article level for wider popup width):

```tsx
{isCompact && (
  <div
    role="tooltip"
    id={`catalog-tooltip-${entry.id}`}
    className={`
      pointer-events-none absolute left-full top-0 z-50 ml-2
      w-56 rounded-xl border border-slate-200 bg-white shadow-lg
      opacity-0 group-hover:opacity-100
      transition-opacity duration-150
    `}
    data-testid={`catalog-row-tooltip-${entry.id}`}
  >
    {/* Tooltip content — see 2.2 */}
  </div>
)}
```

**Positioning notes:**
- `left-full ml-2` → popup floats to the **right** of the icon card (same side as `Toolbar.tsx`)
- `top-0` → aligns with the top of the card
- `w-56` (224 px) → enough width for name + spec text without overflow
- `z-50` → renders above neighboring rows

#### 2.2 — Popup content (rich card)

```tsx
<div className="p-3">
  {/* Row 1: Name + class pill */}
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-sm font-semibold text-slate-900">{entry.name}</span>
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold
                     uppercase tracking-[0.16em] text-slate-700">
      {COMPONENT_CLASS_LABELS[entry.componentClass]}
    </span>
    {entry.source === 'custom' && (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold
                       uppercase tracking-[0.16em] text-amber-700">
        Custom
      </span>
    )}
  </div>

  {/* Row 2: Detail row (system · manufacturer · model OR category) */}
  <span className="mt-1 block text-[11px] uppercase tracking-[0.16em] text-slate-500">
    {detailPreview}
  </span>

  {/* Row 3: Spec preview */}
  {specPreview && (
    <span className="mt-1 block text-xs text-slate-700">{specPreview}</span>
  )}
</div>
```

This mirrors the exact same data already computed at lines 94–97 of `CatalogRow`
(`specPreview`, `detailPreview`) — **zero new data fetching**.

#### 2.3 — Accessibility

- `role="tooltip"` on the popup `<div>`
- `aria-describedby={`catalog-tooltip-${entry.id}`}` on the `<button>` trigger (compact branch only)
- `aria-label={entry.name}` on the compact `<button>` (fallback for screen readers without tooltip support)

#### 2.4 — Edge cases

| Case | Handling |
|---|---|
| Popup clips the right edge of the panel | Use `right-full mr-2` fallback (flip to left) — defer to Phase 2b if needed |
| Last row in list — popup clips bottom | `top-0` anchoring means it grows downward; acceptable for V1 |
| Entry has no `specPreview` | `specPreview &&` guard renders the row conditionally |
| Active entry (sky-500 border) | Popup unchanged; active state is on the `<article>` border, not the popup |

---

### Phase 3 — Test Updates

**File:** `__tests__/CatalogPanel.test.tsx`

```
describe('CatalogRow — compact mode')

  Layout:
  ✓ renders only the icon badge — name text NOT in document
  ✓ does not render component-class pill inline
  ✓ does not render detail row text inline
  ✓ does not render spec preview text inline

  Popup:
  ✓ popup element is present in DOM (opacity controlled by CSS, not mount)
  ✓ popup contains entry.name
  ✓ popup contains COMPONENT_CLASS_LABELS[entry.componentClass]
  ✓ popup contains detailPreview text
  ✓ popup contains specPreview text when defined
  ✓ popup has role="tooltip"
  ✓ compact button has aria-label equal to entry.name
  ✓ compact button has aria-describedby pointing to popup id

  Interaction:
  ✓ action menu (⋮) is still reachable via keyboard
  ✓ ArrowDown/Up keyboard nav works across compact rows
```

---

## Visual Specification

### Comfortable mode (unchanged)
```
┌──────────────────────────────────────────────┐
│ [Icon]  Rectangular Duct           [ROUTING] │
│         SUPPLY · Standard Ductwork           │
│         14" x 10", Flat oval                 │
│                                          [⋮] │
└──────────────────────────────────────────────┘
```

### Compact mode — idle
```
┌──────┐
│ [Icon] │  ← icon badge only, ⋮ on hover
└──────┘
```

### Compact mode — on hover
```
┌──────┐  ┌─────────────────────────────────┐
│ [Icon] │  │ Rectangular Duct     [ROUTING]  │
└──────┘  │ SUPPLY · Standard Ductwork       │
           │ 14" x 10", Flat oval             │
           └─────────────────────────────────┘
           (popup floats right of the icon card)
```

---

## Verification Checklist

- [ ] Compact toggle → only colored icon badge visible, no inline text
- [ ] Comfortable toggle → full card restored, identical to today
- [ ] Hovering compact icon → popup slides in to the right with `entry.name`, class, detail, spec
- [ ] Popup disappears immediately on mouse-out (CSS transition, no flicker)
- [ ] `⋮` action menu still appears on hover in compact mode and is keyboard-reachable
- [ ] Active entry (sky-500 border) looks correct in compact mode
- [ ] Keyboard navigation (ArrowUp/Down) still works through compact rows
- [ ] `role="tooltip"` and `aria-describedby` are present in compact mode
- [ ] All existing `CatalogRow` unit tests still pass
- [ ] New compact + popup unit tests pass
- [ ] `pnpm parity:check` exits 0

---

## Agent Assignment

| Agent | Task |
|---|---|
| `frontend-specialist` | Phase 1 — compact layout restructure |
| `frontend-specialist` | Phase 2 — hover popup (CSS group-hover) |
| `frontend-specialist` | Phase 3 — test updates |

---

## Estimated Effort

| Phase | Effort |
|---|---|
| Phase 1 — Compact layout | ~25 min |
| Phase 2 — Hover popup | ~25 min |
| Phase 3 — Tests | ~25 min |
| **Total** | **~75 min** |
