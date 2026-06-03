# TICKET WS1 — De-duplicate command surfaces (one toolbar, one undo/redo home)

**Milestone:** M1 Foundation · **Priority:** P0 · **Effort:** ~3–4h incl. test updates
**Type:** Cleanup / regression-prevention · **Status:** Ready · **Code changes:** not in this ticket — spec only

## Context

Global tools and undo/redo are duplicated across multiple surfaces; the duplicate tool row is the "second toolbar" the program is trying to kill. One source per command (decomposition WS1, `[[interaction-architecture-plan]]`).

## Current state (verified)

- **Duplicate tool row (live):** `LeftSidebar.tsx:158` mounts `<ToolButtons orientation="horizontal" />`. `ToolButtons` (in `Toolbar.tsx`) renders the same 8 `setTool` buttons as `TopToolBar`, plus undo/redo (`Toolbar.tsx:552-577`), plus `FittingTypeSelector` (`:543`) and `SupportWorkflowPanel` (`:544-548`).
  - Note: the standalone `<Toolbar/>` wrapper (`Toolbar.tsx:591`) is **test-only** — not mounted in the app. Only `ToolButtons` (via LeftSidebar) is live.
- **Undo/redo duplicated across:** `TopToolBar.tsx:208/216` (canonical), `Toolbar.tsx:552-577` (in ToolButtons → LeftSidebar), `DockRail.tsx:62-70` (live via `UnifiedDock/index.tsx:13` → `CanvasPage.tsx:176`), `InspectorOverviewPanel.tsx:580/592`, and keyboard (`useKeyboardShortcuts.ts`).
- **`data-testid` collision (real):** `undo-button`/`redo-button` exist in BOTH `TopToolBar.tsx:208/216` AND `Toolbar.tsx:563/576` — duplicate DOM ids today.
- **Grid toggle:** `ZoomControls.tsx:184` (live, bottom-right of canvas) and `GridSettings.tsx:32` (mounted only via `BottomToolbar.tsx:14`). **`<BottomToolbar/>` does not appear mounted in the app** → the grid-toggle "duplication" may already be moot. **Verify at ticket.**

## Proposed change

1. **Remove the duplicate tool-selection buttons + undo/redo from the sidebar.** In `LeftSidebar.tsx:158`, stop rendering the tool-selection + undo/redo parts of `ToolButtons`. **[Decision] Keep `ToolButtons` as the panel host** — do NOT delete `Toolbar.tsx`/`ToolButtons`; WS2 relocates `FittingTypeSelector` (`:543`) and `SupportWorkflowPanel` (`:544-548`) from it to the TopToolBar slide-open slot. Sequence WS1 with/just before WS2 so no panel gap ships.
2. **Remove undo/redo from DockRail** (`DockRail.tsx:62-70`); DockRail keeps only its panel toggles.
3. **Remove undo/redo from InspectorOverviewPanel** (`:580/592`).
4. **Canonical undo/redo = `TopToolBar` + keyboard only.** Keep the `undo-button`/`redo-button` testids on `TopToolBar`; the `Toolbar.tsx:563/576` copies go away with the sidebar tool-row removal.
5. **Grid toggle: RESOLVED — no work.** `BottomToolbar` is **not mounted** anywhere (verified; defined only). `ZoomControls.tsx:184` is the single live grid toggle. `BottomToolbar.tsx` + `GridSettings.tsx` are dead code (optional delete, no functional change).
6. **Document the keyboard map — keep current bindings.** [Decision] No binding changes: Pan stays **Space**; tools `V/D/F/S/E/R/N`; undo/redo `Ctrl+Z`/`Ctrl+Y`/`Ctrl+Shift+Z`; `Esc`→Select. Publish this existing map as the reachability replacement for the removed sidebar buttons (no relearning).

## Acceptance criteria

1. Exactly one surface calls `setTool` for the 8 tools (`TopToolBar`). DOM has no second tool row.
2. `undo()`/`redo()` reachable from exactly one button surface (`TopToolBar`) + keyboard; DockRail and InspectorOverview have none.
3. `data-testid="undo-button"`/`"redo-button"` resolve to exactly one element.
4. Grid toggle is single (`ZoomControls`); `BottomToolbar`/`GridSettings` confirmed unmounted (dead code, no second toggle).
5. No regression: switching tools, undo/redo, and the (relocated) fitting/support panels all still work via their canonical surfaces.
6. Keyboard map documented; every toolbar tool keeps its current binding (Pan=Space).
7. `pnpm typecheck` clean.

## Testing plan

| Layer | What | Count / change |
|---|---|---|
| Unit | `LeftSidebar` no longer renders tool-selection/undo buttons | update |
| Unit | `DockRail` exposes panel toggles only, no undo/redo | update `DockRail.test.tsx` |
| Unit | only one `undo-button` in the DOM for a full canvas render | +1 |
| Regression | `TopToolBar.test.tsx` green unchanged | — |
| Regression | `Toolbar.test.tsx` — keep `ToolButtons` (panel host); update only assertions that touch the removed tool-row/undo-redo | update |

## Rollback

Pure removals + test updates; revert restores the duplicate surfaces. No schema/store change. Low risk. **[Decision] Land behind a dedicated WS1 feature flag** (per-workstream flagging) so the surface removal can be toggled independently of WS2.

## Files reference

| File | Change |
|---|---|
| `src/features/canvas/components/LeftSidebar.tsx:158` | stop rendering tool-selection + undo/redo from `ToolButtons` |
| `src/features/canvas/components/Toolbar.tsx:486-577` | remove tool buttons + undo/redo; keep panel pieces for WS2 to relocate |
| `src/features/canvas/components/UnifiedDock/DockRail.tsx:62-70` | remove undo/redo; keep panel toggles |
| `src/features/canvas/components/Inspector/InspectorOverviewPanel.tsx:580/592` | remove undo/redo buttons |
| `src/features/canvas/components/ZoomControls.tsx:184` | canonical grid toggle — no change; `BottomToolbar.tsx`/`GridSettings.tsx` are unmounted dead code (optional delete) |
| `src/features/canvas/components/__tests__/Toolbar.test.tsx`, `UnifiedDock/__tests__/DockRail.test.tsx` | update/retire assertions |

## Dependencies & blocks

- **Depends on:** none. **Coordinate with:** WS0 (testid ownership), WS2 (fitting/support panel relocation — same milestone, must land together so no panel gap ships).
- **Blocks:** clean single-toolbar baseline assumed by WS2/WS3/WS4.

## Open items

All prior open items RESOLVED:
- Grid toggle → `BottomToolbar` not mounted; no dedup work (ZoomControls is canonical).
- Keyboard map → keep current bindings (Pan=Space), document only.
- `ToolButtons` → keep as panel host for WS2; only remove the tool-row + undo/redo from the sidebar mount.
- Release → dedicated WS1 feature flag (per-workstream).

None blocking.

## Out of scope

The TopToolBar visual redesign (shipped, Part 1); inline option panels (WS2); CAS (WS3).
