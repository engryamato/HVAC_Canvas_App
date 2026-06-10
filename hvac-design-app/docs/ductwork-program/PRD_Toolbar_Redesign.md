# PRD — Canvas Top Toolbar Redesign ("Dynamic Pill")

**Status:** Part 1 shipped (visual pill). Part 2 approved for implementation (inline slide-open options).
**Owner:** Canvas / UX
**Date:** 2026-06-02
**Reference design:** `C:\Users\User\Downloads\Toolbar_v2.html` (SizeWise Dynamic Pill Toolbar Preview)
**Target file:** `src/features/canvas/components/TopToolBar.tsx`

> **Part 1** (sections 1–6) = the dynamic-pill visual redesign, already implemented and verified live.
> **Part 2** (section 7) = the inline slide-open tool-options spec authored via gstack `/spec`. Read Part 2 for the next implementation pass.

---

## 1. Problem & Goal

The current `TopToolBar` is a flat row of 9 identical 36×36 icon buttons in a square-cornered
white card. Tools are visually undifferentiated (navigation, drawing, and placement all look the
same), the active tool is only distinguishable by a blue fill, and there is no inline labelling —
users must hover to discover what a tool is or its shortcut.

**Goal:** Ship a more compact, modern, engineering-grade toolbar that:
- Reads as a single floating **pill** (fully rounded) rather than a boxy card.
- **Groups** tools into logical sections (History · Navigate · Draw · Place · View) separated by hairline dividers.
- Surfaces the **active tool's label + shortcut inline** (no hover required) while keeping inactive tools as tight icon-only chips.
- **Minimizes footprint** — idle width is roughly icon-only; it grows only for the one active chip.
- Keeps the look quiet and technical (slate/blue, thin strokes), not playful.

**Non-goals:** Redesigning the left/right sidebars, the `ServiceContextStrip`, the bottom toolbar, or the sidebar `ToolButtons` variant. No new Zustand slices. No 3D view (it remains suspended).

---

## 2. Design Spec (derived from Toolbar_v2.html)

### Container — the pill
- Fully rounded (`rounded-full`), single hairline border, white gradient surface, soft elevation shadow.
- Horizontal layout, centered, `gap` ~4–6px between chips; compact vertical padding (~6–8px).
- Stays absolutely positioned, top-center, `z-40` (unchanged from today).
- Horizontal overflow scrolls rather than wrapping (keeps it one line on narrow canvases).

### Tool groups (left→right)
| Group    | Tools                          | Notes |
|----------|--------------------------------|-------|
| History  | Undo, Redo                     | command buttons, disabled when unavailable |
| Navigate | Select (V), Pan (Space)        | |
| Draw     | Duct (D), Fitting (F), Support (S) | duct label/icon is dynamic via `getPlacementToolbarMetadata` |
| Place    | Equipment (E), Room (R), Note (N) | |
| View     | `ViewModeToggle`               | existing component, reused as-is (Plan only) |

Groups are separated by a 1px vertical gradient **divider** (`section-divider`).

### Tool chip states
- **Idle:** icon-only, ~36–40px square, muted slate icon, transparent background, subtle shortcut hint.
- **Hover:** light slate background, darker icon, 1px lift.
- **Active (non-command):** blue→cyan gradient fill, white icon (heavier stroke), **expands** to show the label text + a keyboard-shortcut `kbd` badge.
- **Disabled (undo/redo):** 45% opacity, `not-allowed` cursor.

### Sub-toolbar
- When the **Support** tool is active, the existing `SupportWorkflowPanel` animates in **below** the pill (preserves today's behavior).
- The slot is animation-ready (CSS height/opacity transition) so Duct/Fitting panels can be wired later without restructuring. (Out of scope now to avoid double-rendering `FittingTypeSelector`, which already renders in the sidebar `ToolButtons`.)

---

## 3. Hydration / Wiring (must stay correct)

All store connections are **unchanged** from the current `TopToolBar.tsx`; the redesign is visual + the History group addition.

| Concern | Source | Behavior |
|---|---|---|
| Active tool | `useToolStore(s => s.currentTool)` | drives active chip |
| Duct label/icon | `getPlacementToolbarMetadata(activeSpecialtyToolId)` | dynamic duct chip |
| Select tool | `useToolStore(s => s.setTool)` | on click |
| Cursor | `useCursorStore(s => s.setCursorMode)` | `select → 'default'`, else `'crosshair'` (preserve current mapping; do **not** introduce cursor modes that don't exist in `cursorStore`) |
| Keyboard shortcuts | `useKeyboardShortcuts({})` | unchanged |
| Undo / Redo | `useCanUndo`/`useCanRedo` + `undo()`/`redo()` from `@/core/commands` | NEW in toolbar; same functions `EditMenu` already uses |
| View mode | `<ViewModeToggle />` | reused unchanged |
| Support panel | `<SupportWorkflowPanel />` from `./Toolbar` | unchanged |

**Equipment re-click behavior:** preserved if currently present — clicking Equipment is a plain `setTool('equipment')` in today's `TopToolBar` (the dialog re-open lives in the sidebar `ToolButtons`, not here), so no change is required in `TopToolBar`.

---

## 4. Acceptance Criteria

1. Toolbar renders as a single rounded pill with 5 visually separated groups.
2. The 8 tool chips preserve their existing `aria-label`s and the duct/support `data-testid` icon hooks (`top-toolbar-icon-support` with `data-icon-key="accessory_support_hanger"`).
3. Selecting a tool updates `currentTool`; the active chip expands to show label + shortcut badge.
4. Undo/Redo buttons appear, are disabled when `!canUndo`/`!canRedo`, and call `undo()`/`redo()`.
5. With Support active, `SupportWorkflowPanel` ("Support Workflow") renders below the pill.
6. `ViewModeToggle` still renders to the right.
7. Existing `TopToolBar.test.tsx` passes **without modification**.
8. `pnpm typecheck` (or `tsc --noEmit`) passes; no new lint errors.
9. App boots and the toolbar is interactive in a live browser (gstack QA).
10. Idle pill width is visibly narrower / no wider than today (compactness goal met).

---

## 5. Test & Verification Plan

- **Unit:** existing `src/features/canvas/components/__tests__/TopToolBar.test.tsx` must pass unchanged. Add one test asserting Undo/Redo buttons exist and reflect disabled state.
- **Type/build:** `pnpm typecheck`.
- **Live hydration (gstack):** launch dev server, load the canvas, confirm: pill renders, clicking each tool activates it + expands label, Support opens the workflow panel, undo/redo disabled on a fresh project.

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Breaking preserved test ids / aria labels | Keep `aria-label` = full label (e.g. "Supports"), keep `HvacCatalogIcon` testid hooks verbatim |
| Introducing invalid cursor modes | Reuse current `select→default / else crosshair` mapping only |
| Double-rendering sub-panels | Only Support panel rendered (as today); Duct/Fitting deferred — superseded by Part 2 |
| Pill overflow on small canvas | `overflow-x:auto` scroll frame, no wrap |
| Undo/redo not reactive | Use `useCanUndo`/`useCanRedo` hook selectors (already reactive) |

---
---

# Part 2 — Inline Slide-Open Tool Options (no dialogs)

**Authored via:** gstack `/spec` (file-only, PRD-mode) · branch `codex-fitting-restore-rerun`
**Status:** Approved for implementation · **Effort:** ~10–14h (see breakdown)
**Spec scope decision (user):** "All option-bearing tools" — Duct, Fitting, Support (P0) + Equipment, Room (P1).

## 7.1 Context

Clicking the **Duct** tool today pops a modal dialog (`DuctSizePromptDialog`: Shape + Width/Height + Cancel/Draw) that blocks the canvas and breaks drawing flow — confirmed live via gstack-browse on a fresh project (`/canvas?projectId=…` immediately shows the modal). Clicking **Equipment** likewise pops `EquipmentPlacementDialog`. The reference design `Toolbar_v2.html` instead **slides an inline options panel open directly below the pill** (`.subtoolbar-slot`, animated `max-height`/`opacity`/`transform`) — the user picks options in context and the canvas stays visible. **Support** already does this inline; **Duct** and **Fitting** have ready-made, already-hydrated panel components that are simply not wired into the toolbar slot.

This part replaces the dialogs with the slide-open inline panel for every option-bearing tool, and requires those panels to be fully **hydrated** (bound to the real Zustand stores / catalog, not stubs) by the end of the implementation.

## 7.2 Current State (verified 2026-06-02)

| Tool | Click behavior today | Options component | Hydrated? | Wired into top toolbar slot? |
|---|---|---|---|---|
| Support | inline panel below pill | `SupportWorkflowPanel` (`Toolbar.tsx:181`) | ✅ stores + catalog | ✅ `TopToolBar.tsx:87` |
| Duct | **modal dialog** | `DuctToolOptionsPanel` (`DuctToolOptionsPanel.tsx:30`) | ✅ `useDuctDrawSettings` / `setDuctDrawSettings` | ❌ not rendered anywhere |
| Fitting | inline only in sidebar | `FittingTypeSelector` (`FittingTypeSelector.tsx:17`) | ✅ `useSelectedFittingType` / `setFittingType` | ❌ sidebar only (`Toolbar.tsx:543`) |
| Equipment | **modal dialog** | `EquipmentPlacementDialog` (dialog) | ✅ (dialog wires stores) | ❌ dialog, not a panel |
| Room | plain placement, no options | — | — | — |

**Dialog triggers to remove/replace:**
- Duct: `CanvasContainer.tsx:136-138` (`if (currentTool === 'duct') setDuctSizePromptOpen(true)`) + render at `CanvasContainer.tsx:618-630`.
- Equipment: `CanvasContainer.tsx:139-141` (`if (currentTool === 'equipment') setEquipmentPlacementDialogOpen(true)`) + render block ending `CanvasContainer.tsx:612-616`.

**Reference animation (`Toolbar_v2.html`):** `.subtoolbar-slot { max-height:0; opacity:0; transform:translateY(-8px) scale(.98) }` → `.open { max-height:320px; opacity:1; transform:none }`, `transition: max-height .2s, opacity .16s, transform .16s`.

## 7.3 Proposed Change

Introduce one **slide-open sub-toolbar slot** rendered by `TopToolBar.tsx` directly under the pill (the flex-col container already exists). A single registry maps `currentTool → panel component`; the slot animates open whenever the active tool has a panel, and renders that tool's already-built, already-hydrated panel inside.

### 7.3.1 Sub-toolbar slot (in `TopToolBar.tsx`)

```tsx
const TOOL_OPTION_PANELS: Partial<Record<CanvasTool, React.ComponentType>> = {
  duct: DuctToolOptionsPanel,
  fitting: FittingTypeSelector,
  support: () => <SupportWorkflowPanel className="w-[min(92vw,920px)]" />,
  // P1: equipment: EquipmentOptionsPanel,
};

const ActivePanel = TOOL_OPTION_PANELS[currentTool] ?? null;
```

Render below the pill, replacing the current bare `currentTool === 'support'` block:

```tsx
<div
  className={[
    'w-[min(92vw,920px)] origin-top overflow-hidden transition-all duration-200',
    ActivePanel ? 'max-h-[360px] opacity-100 translate-y-0'
                : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none',
  ].join(' ')}
  role="region"
  aria-label="Tool options"
  data-testid="tool-options-slot"
>
  {ActivePanel ? <ActivePanel /> : null}
</div>
```

`prefers-reduced-motion`: drop the transition (snap open) under the media query.

### 7.3.2 Remove the dialogs

- **Duct (P0):** delete the `if (currentTool === 'duct') setDuctSizePromptOpen(true)` branch (`CanvasContainer.tsx:136-138`) and the `<DuctSizePromptDialog/>` render (`:618-630`). Drawing reads `useDuctDrawSettings()` directly (it already does), now edited inline via `DuctToolOptionsPanel`. Delete `DuctSizePromptDialog.tsx` + its `ductSizePromptOpen` state, OR keep the file unreferenced (decide at impl; prefer delete to avoid dead code).
- **Equipment (P1):** convert `EquipmentPlacementDialog` content into an inline `EquipmentOptionsPanel` (same store wiring) and remove the `setEquipmentPlacementDialogOpen(true)` auto-open at `CanvasContainer.tsx:139-141`. If the dialog carries interactions that do not fit a slim inline strip (large lists, previews), keep equipment as **P1 / follow-up** and leave its dialog until the panel is designed — do NOT ship a half-converted equipment flow.
- **Note/Room/Select/Pan:** no panel, slot stays closed.

### 7.3.3 Hydration requirement (acceptance-blocking)

Every panel in `TOOL_OPTION_PANELS` must read and write the **real** stores at ship time — no placeholder/stub values:
- Duct → `useDuctDrawSettings()` + `useToolActions().setDuctDrawSettings` (and `activeToolDefinition.metadata.shape`).
- Fitting → `useSelectedFittingType()` + `useToolActions().setFittingType`.
- Support → existing `SupportWorkflowPanel` store + `useUnifiedCatalogStore` wiring (unchanged).
- Equipment (if shipped) → same store actions the dialog uses today.

"Hydrated" = editing a control in the open panel mutates the store, and the canvas/draw tool consumes that store value on the next action (verified live, see Testing).

### 7.3.4 Avoid double-render

`FittingTypeSelector` renders in the sidebar `ToolButtons` (`Toolbar.tsx:543`). Before wiring it into the top slot, confirm whether `ToolButtons`/sidebar `Toolbar` is mounted in the canvas route (`CanvasPage` uses `UnifiedDock` + `TopToolBar`). If both can mount the selector for `currentTool === 'fitting'`, gate one of them so the fitting options render exactly once. Same audit for any duct/support duplication.

## 7.4 Acceptance Criteria

1. Clicking **Duct** opens NO modal; the inline options slot slides open showing `DuctToolOptionsPanel` (Shape-driven Width/Height or Diameter, ends, insulation). `DuctSizePromptDialog` never renders.
2. Clicking **Fitting** slides open `FittingTypeSelector` (Elbow 90/45, Tee, Reducer, Cap) in the slot; selecting a type sets `useSelectedFittingType`.
3. Clicking **Support** slides open `SupportWorkflowPanel` (unchanged behavior, now via the shared slot).
4. Switching to **Select/Pan/Room/Note** collapses the slot (`max-h-0`, `pointer-events-none`).
5. Editing a duct field (e.g. Width 12→18) updates `useDuctDrawSettings().width`, and the next duct drawn uses 18 in — verified live.
6. No tool that previously had options leaves a dialog behind: no `duct-size-prompt-dialog` and (if equipment is in scope) no equipment dialog auto-opens on tool select.
7. Slot has `role="region"` + `aria-label="Tool options"` + `data-testid="tool-options-slot"`; honors `prefers-reduced-motion`.
8. Existing test ids preserved: `tool-{id}`, `top-toolbar-icon-support`, `undo-button`, `redo-button`. `TopToolBar.test.tsx` passes unchanged.
9. `pnpm typecheck` clean; no new lint errors.
10. Equipment: either fully converted to an inline panel (no dialog) OR explicitly deferred to P1 with a one-line note in the PR — never partially converted.

## 7.5 Testing Plan

| Layer | What | Count |
|---|---|---|
| Unit | `TopToolBar`: slot opens for duct/fitting/support, closed for select/pan/room/note (assert `tool-options-slot` visibility + child testid) | +3 |
| Unit | Duct panel edit mutates `useDuctDrawSettings` (render `DuctToolOptionsPanel`, change width, assert store) | +1 |
| Unit/Integration | `CanvasContainer`: switching to `duct` no longer sets `ductSizePromptOpen` / renders `duct-size-prompt-dialog` (update or remove existing assertions) | +1/−n |
| E2E (gstack) | New project → click Duct → no modal, slot open, change width, draw, duct uses new width | +1 |

Regression: grep tests for `duct-size-prompt-dialog`, `setDuctSizePromptOpen`, `EquipmentPlacementDialog` auto-open and update them.

## 7.6 Rollback Plan

Single-feature, reversible. Keep the change behind a one-line registry: reverting `TOOL_OPTION_PANELS` to `{ support }` and restoring the two `CanvasContainer` dialog branches returns the old behavior. No data/schema/store changes, so rollback = revert the PR.

## 7.7 Effort Estimate

- Slot + registry in `TopToolBar.tsx`: ~2h
- Remove duct dialog + wire `DuctToolOptionsPanel`: ~2h
- Wire `FittingTypeSelector`, de-dupe vs sidebar: ~2h
- Move Support into shared slot (no behavior change): ~1h
- Equipment inline panel (P1, if in scope): ~4h (or defer)
- Tests (unit + 1 gstack E2E): ~3h
- **Total: ~10h (P0) / ~14h with equipment**

## 7.8 Files Reference

| File | Change |
|---|---|
| `src/features/canvas/components/TopToolBar.tsx` | Add slide-open slot + `TOOL_OPTION_PANELS` registry; render active panel |
| `src/features/canvas/components/CanvasContainer.tsx:136-141` | Remove duct (and equipment, if scoped) auto-open dialog branches |
| `src/features/canvas/components/CanvasContainer.tsx:612-630` | Remove `DuctSizePromptDialog` (and equipment dialog if scoped) render + state |
| `src/features/canvas/components/DuctSizePromptDialog.tsx` | Delete (or leave unreferenced) once duct uses inline panel |
| `src/features/canvas/components/DuctToolOptionsPanel.tsx` | No change — consumed by the slot (already hydrated) |
| `src/features/canvas/components/FittingTypeSelector.tsx` | No change — consumed by the slot; de-dupe vs sidebar render |
| `src/features/canvas/components/Toolbar.tsx:543` | Gate sidebar `FittingTypeSelector` render to avoid double-mount |
| `src/features/canvas/components/__tests__/TopToolBar.test.tsx` | Add slot open/close + hydration tests; keep existing ones passing |

## 7.9 Out of Scope

- Redesigning the contents of `DuctToolOptionsPanel` / `FittingTypeSelector` / `SupportWorkflowPanel` (reuse as-is).
- Adding options to tools that have none (Room, Note, Select, Pan).
- 3D view (remains suspended) and `ViewModeToggle` changes.
- Any store/schema changes — this is pure wiring + dialog removal.

## 7.10 Related

- Part 1 (this doc, §1–6) — the dynamic-pill visual redesign (shipped).
- `Toolbar_v2.html` — reference for the `.subtoolbar-slot` slide-open behavior.
