# TICKET WS4 — Axial menu (right-click radial for nested fitting variants)

**Milestone:** **M4 — co-ships with WS6** (build deferred; spec ready now) · **Priority:** P1 · **Effort:** ~10–14h (radial component + 6 family maps)
**Type:** Feature (net-new) · **Status:** Spec ready; build gated on WS6 · **Code changes:** not in this ticket — spec only

## Context

The axial menu is a **right-click radial/umbrella** for fast, nested, fitting-specific fabrication variants (e.g. rectangular elbow → vanes → double-wall). It does NOT exist today. Design pinned: bindings §23, family maps §9A–9D, non-goals §9C, engineer contract §9D. (`[[interaction-architecture-plan]]`.)

## Decisions (locked this ticket)

- **Co-ship with WS6 (D-WS4-1):** axial writes only fitting `variant` keys (WS10), whose geometry resolvers are WS6. Building it before WS6 means every pick is a no-op visually. So WS4 **spec is finalized now**, but it is **built and released together with WS6** so each action has immediate visible effect. WS4 becomes an M4 item, not M2.
- **All 6 families (D-WS4-2):** Elbow, Tee/Wye, Reducer, Transition, Takeoff/Tap, Cap.
- **Desktop only** (D7): **right-click opens immediately** (no press-hold; touch dropped).

## Current state (verified)

- No radial/pie/umbrella menu anywhere; the 3D canvas **suppresses contextmenu** (`createControls.ts:87`) — must be changed to **route** it, not globally `preventDefault()`.
- Selection + fitting detection: `selectionStore.ts`; WS3 provides the selected-fitting context + `Shift+F10` keyboard entry.
- Variant target: `FittingProps.variant` (WS10); shape via duct/duct-run shape (`flexible` ≡ round for gating).
- Write path: `entityActions` (WS0); geometry resolvers: **WS6** (co-dependency).

## Proposed change

### 1. Gesture / bindings (§23)
- **Mouse/trackpad:** right-click over a **fitting** opens the radial immediately. Route the `contextmenu` event to the menu; right-click on empty canvas / non-fitting → platform default / nothing.
- **Keyboard:** `Shift+F10` (or Menu key) with a fitting selected opens it centered; arrows/Tab navigate, Enter commits, Esc closes (WS3 a11y).
- **No touch** (D7). Pen: out of scope for v1 (desktop mouse only).

### 2. Radial component (new)
`src/features/canvas/components/AxialMenu/` — nested radial, **max 3 levels** (§30 anti-req). Shape-gated: contents filtered by the fitting's shape; if no valid options for the shape → don't appear, or one disabled note "No quick options for this duct shape; use Inspector."

### 3. Family maps (§9, all 6 families) → `variant` writes
Encode the §9B maps. Each leaf writes the canonical `variant` key (WS10 reconciliation table):
- **Elbow:** type (radius/mitered) → `variant.elbowType`; radiusClass → `variant.radiusClass`; vanes (rect/flat_oval only) → `variant.vaneType`.
- **Tee/Wye:** junction (`fittingType` tee/wye); branch side → `variant.branchSide`; branch angle → `variant.branchAngleDeg`.
- **Reducer:** concentric/eccentric → `variant.eccentricOffset` (set ⇒ eccentric); offset orientation → `variant.eccentricOffset`.
- **Transition:** alignment → `variant.transitionAlignment`; style → `variant.transitionStyle`.
- **Takeoff/Tap:** type → `variant.takeoffType`; entry angle → `variant.entryAngleDeg`; damper → `variant.hasDamper`.
- **Cap:** type → `variant.capType`.

### 4. Engineer contract (§9D) — co-ships with WS6
Each axial leaf is **one command** that: (1) updates the `variant` field via `entityActions`, (2) triggers **resolver recompute** → resolved geometry + ports (**WS6**), (3) updates connected duct endpoints via the duct-adjustment/cutback layer (`[[duct-cutback-restore-asymmetry]]`), (4) enforces `connectionProfile` compatibility. Steps 2–4 are WS6; **all four are one undo group** (§25). This is why WS4 co-ships with WS6.

### 5. Non-goals (§9C, enforced)
Axial never includes: Draw/Add tools, Undo/Redo, Export/Calculate/Validate, size/length/system/material edits, or "Open Inspector" (CAS-only). Test asserts the menu registry contains zero of these.

## Acceptance criteria

1. Right-click over a fitting opens the radial immediately; right-click elsewhere does not; `Shift+F10` opens it from a selected fitting; canvas no longer globally suppresses contextmenu.
2. Contents are shape-gated (`flexible`≡round); shape-invalid options hidden or a single disabled note.
3. All 6 family maps render; each leaf writes the correct `variant` key (verified at the store), max 3 nesting levels.
4. Each pick is one undoable command; with WS6 present, geometry + ports + duct endpoints update in the same undo group.
5. Non-goals enforced (registry test: no global/size/length/system/material/Open-Inspector entries).
6. a11y: keyboard nav, Esc close, ARIA `role="menu"`.
7. `pnpm typecheck` clean.

## Testing plan

| Layer | What | Count |
|---|---|---|
| Unit | right-click over fitting opens; over empty/non-fitting does not; Shift+F10 opens | +3 |
| Unit | shape gating: rect shows vanes, round hides them; no-options → disabled note | +2 |
| Unit | each family's leaves write the right `variant` key via `entityActions` | +6 |
| Unit | non-goals: registry has zero forbidden entries; max depth ≤3 | +2 |
| Integration (with WS6) | leaf pick → variant + resolver recompute + duct adjust = one undo group | +1 |
| E2E (gstack) | right-click rect elbow → vanes → double-wall → geometry updates (WS6 on) | +1 |

## Rollback

**[Decision] Co-shipped behind the WS6 feature flag** (no separate enablement — axial without WS6 is a no-op). Off → no radial; contextmenu routing reverts. Net-new; revert = drop the flag + restore contextmenu suppression.

## Files reference

| File | Change |
|---|---|
| `src/features/canvas/components/AxialMenu/` | **new** — radial component + 6 family maps |
| `src/features/canvas/3d/runtime/createControls.ts:87` | route contextmenu to the menu instead of global suppress |
| `src/core/schema/fitting.schema.ts` (WS10 `variant`) | consumed — leaf write targets |
| `src/core/actions/entityActions.ts` (WS0) | consumed — variant writes |
| `src/features/canvas/.../fitting resolvers` (WS6) | consumed — recompute (co-dependency) |
| `src/features/canvas/hooks/useKeyboardShortcuts.ts` | Shift+F10 (added in WS3) |

## Dependencies & blocks

- **Depends on (hard):** WS0 (`entityActions`), WS10 (`variant` keys), WS3 (selection + Shift+F10 entry), **WS6 (geometry resolvers — co-ship)**.
- **Blocks:** nothing (most downstream WS).

## Open items

- **[at-ticket] radial UX:** layout (sector sizes, labels), hover vs click-through, keyboard sector nav.
- **[at-ticket] max-depth confirm** (3) + whether Elbow L2C throat/heel (§9B optional) is in v1 (default: deferred to v1.1).
- **[at-ticket] Reducer concentric vs eccentric** representation: keep as `variant.eccentricOffset` presence (per WS10) vs a dedicated `reducerType` — align with WS10 final.

## Out of scope

Fitting geometry resolvers (WS6 — but co-shipped); touch/pen gestures (D7); any non-fitting selection; global commands of any kind.
