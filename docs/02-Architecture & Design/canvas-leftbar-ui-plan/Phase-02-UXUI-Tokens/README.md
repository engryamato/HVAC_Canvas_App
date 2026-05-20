# Phase 02: UX/UI Specs & Design Tokens

**Status:** Not Started · **Owner:** Design Lead + FE Architect · **Est. Duration:** 3 days

---

## 1. Design Language Foundation

This phase formalizes the visual language for the new compact catalog row component. All decisions must align with `DESIGN_SYSTEM.md` (4 px grid, Slate/Technical-Blue palette, Tailwind-only).

### Spacing & Grid Contract

All dimensions are **multiples of 4 px**. The canonical row heights:

| Density Mode | Row Height | Icon Size | Padding (y/x) | Font Size |
|-------------|-----------|-----------|----------------|-----------|
| **Compact** | 36 px (`h-9`) | 16 px | `py-1.5 px-2` | `text-xs` (12 px) |
| **Comfortable** | 44 px (`h-11`) | 20 px | `py-2 px-3` | `text-sm` (14 px) |

> **Rationale:** 36 px × 10 items = 360 px — fits in a 900 px viewport with header overhead. This delivers the ≥ 10 items target from Phase 01.

---

## 2. CatalogRow Anatomy

```
┌─────────────────────────────────────────────────────────┐
│ [Icon 16/20px] [Name (primary)] [Class chip] [⋮ menu]  │
│               [Category · systemType]                   │
└─────────────────────────────────────────────────────────┘
```

### Field Hierarchy (Compact Mode)

| Position | Content | Token | Notes |
|----------|---------|-------|-------|
| Icon | `HvacCatalogIcon` via `resolveCatalogEntryIconKey(entry)` | `w-4 h-4` / `w-5 h-5` | Background color via `getCategoryColor(entry.categoryId)` |
| Primary text | `entry.name` | `text-xs font-semibold text-slate-900 truncate` | Max 1 line, truncate |
| Secondary text | `entry.categoryId.replace(/_/g, ' ')` + `entry.systemType` if set | `text-[10px] text-slate-500 truncate` | Combined on one line with `·` separator |
| Class chip | `COMPONENT_CLASS_LABELS[entry.componentClass]` | `rounded px-1.5 text-[9px] font-bold uppercase bg-slate-100 text-slate-600` | Only shown in Compact when row is hovered |
| Placeable badge | `entry.placeable` | `text-[9px] bg-emerald-50 text-emerald-700` | Inline, only if NOT placeable (manage-only items) |
| Context menu | `⋮` button | `opacity-0 group-hover:opacity-100` | Appears on hover; same actions as current `CatalogCard` |

### Active / Selected State

```
border-l-2 border-sky-500 bg-sky-50
```
Replaces the card's full-border highlight. Left border accent is consistent with the existing design system (`text-info = Blue-500`).

### Hover State

```
bg-slate-50 hover:bg-slate-100
```

### Focus Ring (Keyboard)

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1
```

---

## 3. Category Tree (Left Column) — Simplified

The current two-column layout (`lg:grid-cols-[220px_minmax(0,1fr)]`) requires a wide sidebar. Replace with a **single-panel layout** where the category tree is a **collapsible sidebar** *within* the catalog panel itself, toggled by a `≡` button at the catalog header.

**Default state:** Category tree hidden; shows all entries (or current search/filter results) as a flat list. A category filter chip strip appears below the search input.

**Expanded tree state:** Tree slides in from the left as a 180 px panel, narrowing the row list. This works at any sidebar width ≥ 250 px.

> This eliminates the fixed `220px` column that currently breaks at narrow sidebar widths.

### Category Chip Strip (Default)

```
[All] [Air Distribution] [Specialty Exhaust] [Universal]  →  (more)
```

- Scrollable horizontally; `overflow-x-auto` with hidden scrollbar (`scrollbar-none`).
- Each chip: `rounded-full px-2 py-0.5 text-[10px] font-semibold` with active state `bg-slate-900 text-white`.
- "All" chip always first, clears `selectedCategoryId`.

---

## 4. Density Toggle Placement & Visual

Location: **catalog panel header**, right-aligned next to the "Clear" button.

```
┌──────────────────────────────────────────────────────────────┐
│ [HVAC Library logo] Browse placeable …   [⋮⋮⋮] [Clear]     │
│                                          ↑ density toggle    │
└──────────────────────────────────────────────────────────────┘
```

**Toggle control:** A segmented button (two-state, not a dropdown).

```tsx
<div role="group" aria-label="Catalog density">
  <button aria-pressed={density === 'compact'} ...>Compact</button>
  <button aria-pressed={density === 'comfortable'} ...>Comfortable</button>
</div>
```

Tailwind classes for the container:
```
inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 gap-0.5
```

Active button: `bg-white shadow-sm text-slate-900 font-semibold`  
Inactive button: `text-slate-500 hover:text-slate-700`

---

## 5. Full Token Specification

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `catalog-name` | `text-xs font-semibold text-slate-900` | Item name in Compact |
| `catalog-name-comfortable` | `text-sm font-semibold text-slate-900` | Item name in Comfortable |
| `catalog-meta` | `text-[10px] text-slate-500` | Category + system type |
| `catalog-label` | `text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500` | Section headers ("Domains", "Search") |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `catalog-row-px` | `px-2` | Row horizontal padding (Compact) |
| `catalog-row-py` | `py-1.5` | Row vertical padding (Compact) |
| `catalog-row-gap` | `gap-2` | Icon + text gap |
| `catalog-section-gap` | `gap-1` | Between rows in list |

### Colors

| Token | Tailwind | Hex | Usage |
|-------|----------|-----|-------|
| `catalog-bg` | `bg-white` | `#ffffff` | Panel background |
| `catalog-row-hover` | `bg-slate-50` / `hover:bg-slate-100` | — | Row hover |
| `catalog-row-active` | `bg-sky-50 border-l-sky-500` | — | Selected row |
| `catalog-chip-bg` | `bg-slate-100` | `#f1f5f9` | Class chip |
| `catalog-icon-supply` | `#2563eb` | Blue-600 | Supply air category |
| `catalog-icon-exhaust` | `#ea580c` | Orange-600 | Exhaust category |
| `catalog-icon-neutral` | `#64748b` | Slate-500 | Universal / accessories |
| `catalog-icon-default` | `#0f766e` | Teal-700 | All others |

These mirror the existing `getCategoryColor` function in `CatalogPanel.tsx:51–67`.

---

## 6. Comfortable Mode (Backward Compatibility)

Comfortable mode renders the existing `CatalogCard` layout, or a slightly simplified version of it, as the `comfortable` density option. This ensures engineers who prefer the card view are not impacted at rollout.

**Decision:** Keep the card markup in `CatalogCard` as-is for Comfortable mode. Only Compact mode uses the new `CatalogRow` component.

---

## 7. Deliverables

- [ ] **Annotated Figma/wireframe** (or embedded ASCII spec in this document) for Compact and Comfortable modes.
- [ ] **Token reference table** (this document §5) reviewed and signed off by FE Architect.
- [ ] **Icon size validation** — screenshots of `catalogIcons.tsx` icons at 16 px and 20 px.
- [ ] **Density toggle behavior spec** — state machine diagram (see §4).
- [ ] **Responsive spec** — row layout at sidebar widths 250, 300, 400, 500 px.

---

## 8. Acceptance Criteria

- [ ] Token doc is consumable by FE engineers without needing to consult Design Figma.
- [ ] All interactive states (hover, focus, selected, disabled) are specified with Tailwind classes.
- [ ] Category chip strip design validated at sidebar width 250 px (no overflow without scroll).
- [ ] Comfortable mode spec reviewed and confirmed as backward-compatible with existing `CatalogCard` markup.

---

## SIZAA-75 Decision Update (2026-05-01)

This update resolves the ambiguity between "Library Icon Improvement" and the broader compact-catalog work in [SIZAA-74](/SIZAA/issues/SIZAA-74). Recommendation: treat the issue as a **catalog-density and icon-legibility polish pass**, not an icon-only asset swap. The icon work only succeeds if the row pattern, hierarchy, and density contract are defined at the same time.

### Evidence boundary

- Visual review completed on the current catalog shell at `1440x900` and `390x844`.
- Surface reviewed: `ProjectAssetsPanel` / `CatalogPanel` review route and live canvas shell.
- What was verifiable in-browser this run: header hierarchy, density toggle placement, empty-state framing, mobile wrapping pressure, and the current two-pane desktop proportions.
- What was not verifiable in-browser this run: a populated seeded list inside the temporary review route. Row-count guidance below is therefore based on the current implementation in `CatalogPanel.tsx` plus the approved compact-catalog plan.

### Decision 1: Keep a single row architecture, vary density with spacing only

Do **not** preserve a separate card layout for Comfortable mode. The current implementation has already converged on a single list architecture, and reintroducing cards would add avoidable complexity with little user value.

- `compact`: 36 px effective row height, icon tile 24 px, icon glyph 16 px, horizontal gap 8 px.
- `comfortable`: 44 px effective row height, icon tile 28 px, icon glyph 18 px, horizontal gap 12 px.
- Both modes use the same information architecture and action model.

Rationale:
- `Cognitive Load` and `Selective Attention`: one pattern is faster to learn than a row/card mode switch with different scanning behavior.
- `Jakob's Law`: engineers expect density controls to change spacing, not completely change interaction structure.
- `Tesler's Law`: complexity belongs in code once, not in two parallel catalog components.

### Decision 2: Icon treatment should support recognition first, not decoration

Use the existing `HvacCatalogIcon` + category-color tile pattern, but normalize it into a stricter alignment contract.

- Icon tile is a fixed square with centered glyph: `24x24` compact, `28x28` comfortable.
- Glyph size is `16` compact and `18` comfortable. Do not exceed `20`.
- Stroke weight should stay visually consistent across families. If a glyph reads lighter than its neighbors, adjust the source icon, not the row padding.
- Category color belongs to the **tile background**, not the row border.
- Row text should align to the icon tile centerline, not the top edge.

Rationale:
- `Recognition over Recall`: users identify families by silhouette faster than by label.
- `Similarity` and `Common Region`: the tile creates a consistent icon container across duct, fitting, equipment, and accessory families.
- `Aesthetic-Usability Effect`: consistent icon framing makes the denser list feel intentional instead of cramped.

### Decision 3: Replace the left accent stripe with a full-row selected state

Do **not** use `border-l-2` as the primary selected affordance. It creates a weak, easily missed signal in dense lists and visually fights the icon tile.

Selected row spec:

- Background: `bg-sky-50`
- Border: `border border-sky-200`
- Focus/keyboard: `focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1`
- Hover on unselected rows: `hover:bg-slate-50 hover:border-slate-300`

Rationale:
- `Von Restorff`: the selected item should be distinct across the whole row, not only at the left edge.
- `Fitts's Law`: a larger highlighted hit region improves target confidence.
- `WCAG POUR`: full-row color plus focus ring is easier to perceive than a thin color-only stripe.

### Decision 4: Compact rows should show one primary line and one metadata line only

Compact mode must not show description/spec copy inline by default. The current row implementation is carrying too much vertical content for the stated density target.

- Line 1: component name, truncated.
- Line 2: category label plus system type, truncated.
- Class chip remains visible at all times on desktop, but may collapse on narrow mobile widths.
- `Custom` or `Manage-only` status appears as a badge only when present.
- Longer spec content moves to the lower "Active component" details region after selection.

Rationale:
- `Chunking`: name and family metadata are the minimum decision set for browse mode.
- `Miller's Law`: too many simultaneous row signals reduce scan speed.
- `Progressive Disclosure`: detailed specs belong after selection, not before.

### Decision 5: Domain navigation should collapse from tree to chip strip below 300 px

Desktop can keep the current split-pane relationship when width allows, but the domain tree should not remain a permanent column below `300 px` panel width.

- `>= 300 px`: allow tree or chip-strip, but the list must remain visually dominant.
- `< 300 px`: convert to a horizontal chip strip above results.
- The first chip is always `All`.
- Chips show counts only on desktop; hide counts on narrow mobile widths.

Rationale:
- `Responsive Principles` and `mobile thumb zones`: the permanent left column costs too much width in a constrained drawer.
- `Information Scent`: chips keep category context visible without burying the list.

### Engineering handoff

Implement in terms of existing surfaces first:

- Component: `CatalogPanel`
- Container: `ProjectAssetsPanel`
- Icon primitive: `HvacCatalogIcon`
- Layout state: `useLayoutStore`
- Existing design references: `DESIGN_SYSTEM.md`, `tailwind.config.ts`, `app/globals.css`

Token guidance:

- No new global color tokens are required for this pass.
- Prefer existing `slate-*`, `sky-*`, `amber-*`, and `emerald-*` scales already in use.
- If engineering needs named aliases, add them as semantic documentation in `DESIGN_SYSTEM.md` first, not as one-off inline values scattered through the component.

### Acceptance criteria for engineering

- At `300 px` panel width and `900 px` viewport height, compact mode shows at least `10` rows before scroll.
- Icon tiles stay aligned across mixed result sets; no row-to-row icon wobble.
- Selected, hover, focus, empty, and manage-only states are all visibly distinct without relying on color alone.
- At `390x844`, the density toggle, search, category navigation, result summary, and service context remain usable without clipped controls.
