# TICKET WS3 — CAS (Context Action System), full v1

**Milestone:** M2 · **Priority:** P0 · **Effort:** ~18–26h (net-new surface + popover primitive + all entity types)
**Type:** Feature (net-new) · **Status:** Ready · **Code changes:** not in this ticket — spec only
**Churn note:** high-dependency ticket — assumes WS0/WS5/WS10 artifacts exist. Build after they land or expect rework.

## Context

CAS is the on-canvas contextual edit surface for a selected entity — the 3–6 most common edits, near the selection, overflow to Inspector. It **does not exist today** (no context menu; the 3D canvas suppresses contextmenu). Design is pinned in the plan: truth table §21, anchor/lifecycle §22, registry §7A, multi-select §26, invariants/anti-requirements §30. (`[[interaction-architecture-plan]]`.)

## Decisions (locked this ticket)

- **Visibility = on-demand:** single-select shows a small **handle**; CAS opens on handle-click or **Enter** (NOT Space — Space is Pan). Quieter canvas than auto-show.
- **Edit interaction = hybrid:** enum ≤3 values → inline tap-cycle; >3 → popover/select. Numeric → popover edit.
- **Entity scope = all types now** (Duct, Elbow, Tee/Wye, Reducer, Transition, Cap, Takeoff, Equipment). **Caveat:** Reducer/Transition/Cap/Takeoff CAS writes `variant` keys whose geometry resolvers are **WS6** — those edits set the field but produce **no visible geometry change until WS6** (documented, not a bug).

## Current state (verified)

- **No CAS / context menu** anywhere; `createControls.ts:87` suppresses contextmenu.
- Selection: `selectionStore.ts` — `useSelectedIds`, `useSelectionCount` (single = 1), `selectedSegments:100-134` (segment-level), `useHoveredId`.
- **Write path = `entityActions` (WS0)** — CAS must call it, never the store directly.
- **Provenance (WS5):** size fields carry `specified|computed|default`.
- **Matrix + variant (WS10):** `shapeCompatibility(...)`; `FittingProps.variant`.
- **UI primitives:** `button/select/input/switch/radio-group/Dropdown/badge/IconButton` exist; **no Popover** → must build one.

## Proposed change

### 1. On-demand handle + open
Single entity selected in Select mode → render a small **selection handle** (affordance) anchored to the entity. Click the handle or press **Enter** → open CAS. `Esc` closes CAS (second `Esc` deselects). Switching tools / deselect closes it.

### 2. CAS container (anchor/lifecycle §22)
Anchored to the entity bbox edge nearest viewport center; flip/clamp to viewport; collapse to a chip if >~120px from the selection. `role="toolbar"`, `aria-label="Quick edits"`, 32px hit targets (desktop; no touch, D7). Tab order Toolbar→Canvas→CAS→Inspector; number keys trigger actions while CAS focused; `Shift+F10` opens the Axial menu (WS4) when a fitting is selected.

### 3. Popover primitive (new)
Build a lightweight `src/components/ui/popover.tsx` (anchored, dismiss-on-outside/Esc, focus-trapped) for the >3-value and numeric edits. Reuse `select`/`input` inside it.

### 4. Action registry (§7A, all entity types)
Encode the §7A registry. Each action declares a behavior: `inline-cycle` (≤3 enum), `popover-select` (>3 enum), `popover-edit` (numeric), `immediate` (command), `inspector-deeplink`. ≤6 actions shown per type; overflow → Inspector. Multi-select → summary + **Open Inspector** only (§26 MVP). Segment selection → segment-scoped actions (split-at-segment); whole-run edits go to Inspector.

### 5. All writes via `entityActions`
Every CAS edit calls `entityActions.*` (WS0) — **zero direct store writes** (enforced by lint/test). Shape change calls `shapeCompatibility` (WS10) → auto-insert transition (never block, D9). Size edits mark `specified` + trigger the WS5 recompute. Same debounce/undo grouping as Inspector (§25) — CAS+Inspector edit = one undo entry.

### 6. Provenance-aware display
CAS size controls show `specified` vs `computed`/`default` distinctly (WS5), so the user sees which values are protected.

## Acceptance criteria

1. Single-select shows a handle; handle-click or Enter opens CAS anchored per §22; Esc closes; Space still pans (no conflict).
2. CAS renders only on non-empty selection; ≤6 actions; **zero global commands** (registry test: `every(a => !a.isGlobal)`); **zero direct store writes** (lint/test: no store-setter imports in CAS).
3. Hybrid edits: system type (6) opens a popover; elbow type (2) tap-cycles; numeric (angle, size) opens a popover edit.
4. All §7A entity types render their action set; shape-change auto-inserts a transition via the matrix.
5. CAS edit + the same Inspector edit produce one identical undo entry (shared `entityActions`).
6. Multi-select → summary + Open Inspector only; segment selection → segment-scoped actions.
7. a11y: tab order, number-key actions, Esc dismissal, `Shift+F10`→axial, ARIA roles, 32px targets.
8. Reducer/Transition/Cap/Takeoff edits write the correct `variant` key (verified at the store) even though geometry is WS6.
9. `pnpm typecheck` clean.

## Testing plan

| Layer | What | Count |
|---|---|---|
| Unit | handle shows on single-select; Enter opens, Esc closes; Space unaffected | +3 |
| Unit | registry: zero global ids; ≤6 per type; CAS imports no store setters | +2 |
| Unit | hybrid: ≤3 cycles, >3 popovers, numeric popover-edits | +2 |
| Unit | each entity type's actions write the right field/`variant` via `entityActions` | +6 |
| Unit | shape change → `shapeCompatibility` → transition inserted | +1 |
| Unit | CAS+Inspector same field → one undo entry | +1 |
| Unit | multi-select → summary+Open Inspector; segment → segment actions | +2 |
| E2E (gstack) | select duct → handle → Enter → CAS → edit size (marked specified) → draw | +1 |

## Rollback

**[Decision] Behind a WS3 feature flag.** Off → no handle/CAS (Inspector remains the only edit surface). Net-new + additive; revert = drop flag. The new popover primitive is reusable and stays.

## Files reference

| File | Change |
|---|---|
| `src/features/canvas/components/CAS/` | **new** — handle, container, registry, action renderers |
| `src/components/ui/popover.tsx` | **new** — anchored popover primitive |
| `src/core/actions/entityActions.ts` (WS0) | consumed — all CAS writes |
| `src/core/services/connectionPoints/shapeCompatibility.ts` (WS10) | consumed — shape change |
| `src/features/canvas/store/selectionStore.ts` | consumed — selection + segments |
| `src/features/canvas/hooks/useKeyboardShortcuts.ts` | add Enter-opens-CAS, number-key actions, Shift+F10 (avoid Space) |

## Dependencies & blocks

- **Depends on (hard):** WS0 (`entityActions`), WS10 (matrix + `variant`), WS5 (provenance). Build after all three.
- **Blocks:** WS4 (Axial — opens from a selected fitting via the CAS/selection layer).

## Open items

- **[at-ticket] handle affordance** design (shape/position; how it reads as "edit this").
- **[at-ticket] ≤6 cap trimming** for Duct if material/insulation are added (which lower-value actions drop).
- **[at-ticket] "dead-ish" variant edits:** should CAS hint that a reducer/transition/cap/takeoff variant edit has no geometry effect until WS6 (e.g. a subtle "pending" note), or apply silently? Decide when WS6 timing is known.
- **[at-ticket] popover primitive** scope (full focus-trap + portal vs minimal) — reusable beyond CAS.

## Out of scope

Axial menu (WS4); the fitting geometry resolvers (WS6); batch multi-edit (fast-follow after §26 MVP); equipment full property editing (Inspector).
