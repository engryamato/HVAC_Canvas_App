# TICKET WS2 — Inline slide-open tool options + remove all tool-activation modals

**Milestone:** M1 Foundation · **Priority:** P0 · **Effort:** ~12–16h (equipment conversion + chip raise it)
**Type:** Feature + refactor · **Status:** Ready · **Code changes:** not in this ticket — spec only

## Context

Selecting a tool that has options should NOT pop a modal that blocks the canvas. Per the reference (`Toolbar_v2.html` `.subtoolbar-slot`) and `PRD_Toolbar_Redesign.md` Part 2, options slide open inline below the toolbar pill. This ticket replaces **all** tool-activation modals (duct + equipment) with one inline slot, relocates the fitting/support panels into it (from the sidebar, per WS1), and adds sticky settings + an auto-collapse summary chip.

**Scope decisions (locked this ticket):** equipment **is converted now** (D-WS2-1); panel gets **sticky last-used + auto-collapse chip** (D-WS2-2).

## Current state (verified)

- **Duct modal:** `DuctSizePromptDialog` auto-opens on tool switch — `CanvasContainer.tsx:136-138` (`if (currentTool === 'duct') setDuctSizePromptOpen(true)`); rendered `:618-630`. Replacement panel `DuctToolOptionsPanel.tsx` exists, hydrated to `useDuctDrawSettings`/`setDuctDrawSettings`.
- **Equipment modal:** `EquipmentPlacementDialog` auto-opens — `CanvasContainer.tsx:139-141`; rendered `:610-616`. It is a **rich workflow**: category map + grouped type `Select` + `Search` + auto-increment naming, wired to `useEquipmentPlacementDraft`, `useToolActions`, `useUnifiedCatalogStore`, and `EQUIPMENT_CATEGORY_MAP`/`EQUIPMENT_TYPE_LABELS` (`equipment.schema.ts`).
- **Fitting:** `FittingTypeSelector.tsx` (hydrated `useSelectedFittingType`/`setFittingType`) currently renders only in the sidebar `ToolButtons` (`Toolbar.tsx:543`).
- **Support:** `SupportWorkflowPanel` already renders inline in `TopToolBar.tsx:87` (and in sidebar `ToolButtons:544-548`).
- **Toolbar host:** `TopToolBar.tsx` is the single toolbar (post-WS1); it already has a flex-col container for a slot.

## Proposed change

### 1. One slide-open slot in `TopToolBar`
Registry `TOOL_OPTION_PANELS: Partial<Record<CanvasTool, ComponentType>>` = `{ duct: DuctToolOptionsPanel, fitting: FittingTypeSelector, support: SupportWorkflowPanel, equipment: EquipmentOptionsPanel }`. Render the active tool's panel in an animated `region` below the pill (CSS `max-height`/`opacity`/`transform` per `.subtoolbar-slot`; honor `prefers-reduced-motion`). `data-testid="tool-options-slot"`, `role="region"`, `aria-label="Tool options"`.

### 2. Remove the duct modal
Delete the `currentTool === 'duct'` auto-open branch (`CanvasContainer.tsx:136-138`) and the `<DuctSizePromptDialog/>` render (`:618-630`) + its `ductSizePromptOpen` state. Delete `DuctSizePromptDialog.tsx` (drawing already reads `useDuctDrawSettings()`). Duct options edited inline via `DuctToolOptionsPanel`.

### 3. Convert equipment to an inline panel
New `EquipmentOptionsPanel.tsx` that reuses the **exact data layer** of `EquipmentPlacementDialog` (category/type/search/name via `useEquipmentPlacementDraft` + catalog store) but renders in the slot instead of a `Dialog`. Remove the `setEquipmentPlacementDialogOpen` auto-open (`CanvasContainer.tsx:139-141`) and the `<EquipmentPlacementDialog/>` render (`:610-616`). Placement trigger (today the dialog's confirm) becomes an explicit **"Place"** action in the panel + click-to-place on canvas — **[at-ticket] confirm the placement interaction** (see open items).

### 4. Relocate fitting/support into the slot
Move `FittingTypeSelector` and `SupportWorkflowPanel` rendering from the sidebar `ToolButtons` (WS1 keeps `ToolButtons` as host but stops mounting tool-row in the sidebar) into the slot registry. Ensure each mounts **exactly once** (no double-render with the old `TopToolBar.tsx:87` support block — remove that bespoke block in favor of the registry).

### 5. Sticky settings + auto-collapse chip
- **Sticky:** duct already persists via `useDuctDrawSettings` (store-backed, free); equipment via `useEquipmentPlacementDraft`; fitting via `useSelectedFittingType`. Confirm last-used carries across runs for each.
- **Chip:** panel state = `expanded | collapsed`. After the first successful draw/placement with a tool, collapse to a one-line **summary chip** (e.g. `Supply · Rect 16×8 · click-draw`) that re-expands on click. Switching to a tool with no draw-yet-this-session opens expanded; with prior state opens as chip. **[at-ticket]** collapse-state storage (local UI state vs a small ui slice) + per-tool chip summary format.

## Acceptance criteria

1. Clicking Duct/Fitting/Support/Equipment opens the inline slot with that tool's panel — **no modal** renders (`duct-size-prompt-dialog` and the equipment dialog never mount).
2. Editing a duct field updates `useDuctDrawSettings()`; the next duct uses it. Equipment category/type/search/name all work inline; placing creates the equipment.
3. Each panel (duct/fitting/support/equipment) mounts exactly once for its tool (no double-render).
4. Switching to Select/Pan/Room/Note collapses the slot (`max-h-0`, `pointer-events-none`).
5. Sticky: last-used settings persist across runs per tool. Chip: after first draw, the panel collapses to an editable summary chip that re-expands on click.
6. Slot has `role="region"`, `aria-label`, `data-testid="tool-options-slot"`; honors `prefers-reduced-motion`.
7. Preserved testids: `tool-{id}`, `top-toolbar-icon-support`; `TopToolBar.test.tsx` passes (update the support-panel assertion to the slot if needed).
8. `pnpm typecheck` clean.

## Testing plan

| Layer | What | Count |
|---|---|---|
| Unit | slot opens for duct/fitting/support/equipment, closed for select/pan/room/note | +4 |
| Unit | duct panel edit mutates `useDuctDrawSettings`; no `DuctSizePromptDialog` rendered on duct select | +2 |
| Unit | `EquipmentOptionsPanel`: category→type→search→name flow + place action | +3 |
| Unit | chip: collapses after first draw, re-expands on click; sticky value persists | +2 |
| Integration | `CanvasContainer` switching to duct/equipment no longer sets modal-open state | +1 |
| E2E (gstack) | new project → Duct → no modal, slot open, change width, draw uses it; Equipment → inline place | +1 |

Regression: grep tests for `duct-size-prompt-dialog`, `EquipmentPlacementDialog`, `setDuctSizePromptOpen`, `setEquipmentPlacementDialogOpen` and update.

## Rollback

**[Decision] Behind a dedicated WS2 feature flag** (per-workstream). Flag off → restore the two dialogs + their triggers (keep `DuctSizePromptDialog`/`EquipmentPlacementDialog` files until the flag is removed, even though the new path deletes their wiring). No schema change. Revert = drop the flag + restore triggers.

## Files reference

| File | Change |
|---|---|
| `src/features/canvas/components/TopToolBar.tsx` | add `TOOL_OPTION_PANELS` slot; remove bespoke support block (`:87`) |
| `src/features/canvas/components/CanvasContainer.tsx:136-141` | remove duct + equipment modal auto-open branches |
| `src/features/canvas/components/CanvasContainer.tsx:610-630` | remove both dialog renders + their `useState` |
| `src/features/canvas/components/DuctSizePromptDialog.tsx` | delete (behind flag until removal) |
| `src/features/canvas/components/EquipmentOptionsPanel.tsx` | **new** — inline equipment workflow (reuses dialog's data layer) |
| `src/features/canvas/components/EquipmentPlacementDialog.tsx` | retire once panel is proven (keep behind flag) |
| `src/features/canvas/components/DuctToolOptionsPanel.tsx` / `FittingTypeSelector.tsx` | consumed by the slot (no logic change) |
| `src/features/canvas/components/Toolbar.tsx:543-548` | stop rendering fitting/support here (relocated to slot) |
| `src/features/canvas/components/__tests__/TopToolBar.test.tsx` | slot open/close + chip tests; keep existing green |

## Dependencies & blocks

- **Depends on / co-lands with:** WS1 (must land together — WS1 removes the sidebar tool row + keeps `ToolButtons` as host; WS2 relocates the panels out of it, so no panel gap ships).
- **Independent of:** WS0 (no shared write layer needed here — panels use their own existing store actions; CAS/§16 provenance is later).
- **Blocks:** clean inline-options baseline assumed by CAS (WS3).

## Open items

- **[at-ticket] Equipment placement interaction:** with no modal confirm, how is an equipment item placed? (Proposal: "Place" button in the panel arms click-to-place on canvas; name auto-increments per placement.) Confirm before building.
- **[at-ticket] Chip state storage + per-tool summary format** (local UI state vs small ui slice; chip strings per tool).
- **[at-ticket] First-draw detection** signal for collapse (per-tool "has drawn this session").

## Out of scope

CAS/Axial (WS3/WS4); manual-vs-auto Size Mode + provenance (WS5); the TopToolBar visual pill (shipped, Part 1).
