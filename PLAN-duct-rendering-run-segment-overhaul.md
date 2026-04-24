# PLAN — Duct Rendering & Run/Segment Overhaul (Authoritative Scale + DuctRun)

Spec: `docs/superpowers/specs/2026-04-24-duct-rendering-run-segment-overhaul-design.md`

Branch: `codex/ductrun-overhaul` (via git worktree)

## Goal

Implement the approved design end-to-end:

1. Single authoritative `settings.planScale` contract for **on-screen rendering, snapping, labels, and PDF export**.
2. New `duct_run` entity with embedded segments, deterministic regeneration, and whole-run + per-segment selection.
3. Model-true duct rendering (two-wall geometry), seam/flange markers, run splitting, and app-global fabrication profiles.

## Preconditions / Setup

- [ ] Work on a worktree (already created): `.worktrees/ductrun-overhaul`
- [ ] Install dependencies: `cd hvac-design-app && pnpm install`
- [ ] Clean baseline checks (stop if failing):
  - [ ] `cd hvac-design-app && pnpm type-check`
  - [ ] `cd hvac-design-app && pnpm test`

## Task 1 — Authoritative scale contract (planScale)

### 1.1 Schema + persistence wiring
- [ ] Update `ProjectSettingsSchema` in `hvac-design-app/src/core/schema/project-file.schema.ts` to explicitly validate:
  - `scale?: string`
  - `planScale?: { pixelsPerUnit: number>0, unit: 'ft'|'in'|'m'|'cm'|'mm' }`
- [ ] Update `createEmptyProject()` in `hvac-design-app/src/core/schema/project-file.schema.ts` to include default `settings.planScale = { pixelsPerUnit: 1, unit: 'in' }`.
- [ ] Update `snapshotFromStores()` in `hvac-design-app/src/core/persistence/ProjectStateOrchestrator.ts` to persist `settings.planScale` and `settings.scale` (if present).
- [ ] Update `hydrateToStores()` in `hvac-design-app/src/core/persistence/ProjectStateOrchestrator.ts` to hydrate `projectStore` with plan scale (or default) so render/tool code can read it.

### 1.2 Shared helpers (no `* 12` scattered)
- [ ] Add a new module `hvac-design-app/src/core/constants/scale.ts` exporting:
  - `CSS_PX_PER_IN = 96`
  - `IN_PER_FT = 12`
  - `inchesPerUnit(unit)`
  - `planScaleToPxPerInch(planScale)`
  - `inchesToFeet(in)`
  - `feetToInches(ft)`
  - `getViewScale({ zoom, planScale })`

### 1.3 Canvas transform + event mapping
- [ ] Update `CanvasContainer` (`hvac-design-app/src/features/canvas/components/CanvasContainer.tsx`) to:
  - compute `pxPerInchModel` from project settings planScale (defaulted)
  - compute `viewScale = viewport.zoom * pxPerInchModel`
  - apply `ctx.scale(viewScale, viewScale)` (not `zoom`)
  - update `screenToCanvas()` to divide by `viewScale`
  - pass `viewScale` through `ToolRenderContext` and `RenderContext`

### 1.4 Renderer updates (use `viewScale`)
- [ ] Update `RenderContext` (`hvac-design-app/src/features/canvas/renderers/RoomRenderer.ts`) to include `viewScale` and keep `zoom` for UX display only.
- [ ] Update `RoomRenderer`, `DuctRenderer`, `EquipmentRenderer` to:
  - use `1 / viewScale` for line widths and screen-stable sizes
  - use helpers for feet display (`inchesToFeet`) instead of `/ 12` literals

### 1.5 Tool updates (use `viewScale` for tolerances)
- [ ] Update `ToolRenderContext` (`hvac-design-app/src/features/canvas/tools/BaseTool.ts`) to include `viewScale`.
- [ ] Update `DuctTool` snapping to use screen-stable tolerance:
  - `SNAP_PX=12` and `snapTolIn = SNAP_PX / viewScale`
  - remove world-unit hardcoded tolerance for endpoint snapping
- [ ] Update `ConnectionDetectionService` tolerance to be viewScale-aware (or replace it with a helper that accepts tolIn).

### Verification
- [ ] `cd hvac-design-app && pnpm type-check`
- [ ] `cd hvac-design-app && pnpm test`

## Task 2 — New `duct_run` schema + entity wiring

### 2.1 Core schema
- [ ] Update `EntityTypeSchema` in `hvac-design-app/src/core/schema/base.schema.ts` to include `'duct_run'`.
- [ ] Add `hvac-design-app/src/core/schema/duct-run.schema.ts` implementing:
  - `DuctRunSchema` with `type: 'duct_run'`
  - props including `endPointIn`, `installLengthFt`, `segments`, dims, connection IDs, overrides, and required carry-over fields.
- [ ] Add `DuctRunSchema` to `EntitySchema` union in `hvac-design-app/src/core/schema/project-file.schema.ts`.
- [ ] Export from `hvac-design-app/src/core/schema/index.ts`.

### 2.2 Entity factory defaults
- [ ] Add `createDuctRun()` defaults in `hvac-design-app/src/features/canvas/entities/` (parallel to `ductDefaults`) with:
  - start transform + endPointIn
  - derived `installLengthFt`
  - initial segments generated from fabrication profile (or placeholder single segment until Task 4 is in place)

### Verification
- [ ] `cd hvac-design-app && pnpm type-check`
- [ ] `cd hvac-design-app && pnpm test`

## Task 3 — Project migration: legacy `duct` → `duct_run`

- [ ] Add a migration in `hvac-design-app/src/core/services/migration/` invoked by `migrateProjectFileV1ToV2` (or bump and add a new migration registry entry) that:
  - converts all `duct` entities to `duct_run` entities
  - maps start transform and computed endPointIn
  - creates 1 segment spanning full `installLengthFt`
- [ ] Ensure deserialization + save path always writes the new schema version (no legacy ducts).

### Verification
- [ ] Add/adjust tests in `hvac-design-app/src/core/persistence/__tests__/serialization.test.ts` to cover duct→duct_run migration.
- [ ] `cd hvac-design-app && pnpm test`

## Task 4 — DuctRun rendering + geometry service + selection

### 4.1 Geometry service
- [ ] Add `DuctRunGeometryService` under `hvac-design-app/src/features/canvas/services/` providing:
  - computed wall lines, seam markers, flange markers, label anchors
  - hit regions for run-body + per-segment selection
  - invalidation triggers per spec

### 4.2 Renderer
- [ ] Add `DuctRunRenderer` under `hvac-design-app/src/features/canvas/renderers/` and integrate into `CanvasContainer` switch:
  - draw two-wall geometry for round + rectangular
  - draw seam markers between segments + flanges at ends
  - optional centerline for round (secondary)

### 4.3 Selection store + SelectTool updates
- [ ] Extend `hvac-design-app/src/features/canvas/store/selectionStore.ts` with `selectedSegments`.
- [ ] Update `SelectTool` to:
  - select run on body click
  - select segment on segment click while run selected
  - implement Escape semantics (segments clear first)
  - ensure dragging moves whole run only

### 4.4 DuctTool emits duct_run
- [ ] Update `DuctTool` to create `duct_run` entities and generate segments from profile.
- [ ] Add split-run detection:
  - body snap outside endpoint tolerance triggers `SPLIT_RUN` command
  - add inverse `MERGE_RUNS`

### Verification
- [ ] `cd hvac-design-app && pnpm type-check`
- [ ] `cd hvac-design-app && pnpm test`
- [ ] (Optional) `cd hvac-design-app && pnpm e2e -- --project=chromium` if stable

## Task 5 — Fabrication profiles (app-global) + UI wiring

- [ ] Add `fabricationProfileStore` under `hvac-design-app/src/core/store/` using Zustand `persist` with:
  - committed + draft state
  - `commit()` and `revert()`
  - validation rules per duct family
- [ ] Add minimal UI entry point to edit profiles (settings panel) and wire live-preview recalculation.

### Verification
- [ ] `cd hvac-design-app && pnpm test`

## Task 6 — PDF export: true-to-scale → scale-to-fit + annotations

- [ ] Add a dedicated “export render snapshot” path (offscreen render at `zoom=1`, `viewScale=pxPerInchModel`, full-detail mode) and use it in `exportProjectPDF`.
- [ ] Update `hvac-design-app/src/features/export/pdf.ts` to:
  - attempt true-to-scale placement based on `planScale` and `CSS_PX_PER_IN=96`
  - scale-to-fit fallback if page overflow
  - render scale bar + “Plan scale” and “Effective scale” text

### Verification
- [ ] Update `hvac-design-app/src/features/export/__tests__/export.test.ts` to assert:
  - PDF header still valid
  - scale text present when planScale is set

## Done criteria

- [ ] All verifications above pass on this branch.
- [ ] No remaining hard-coded `* 12` for scale/units in canvas rendering/tools (except inside the centralized helper module).
- [ ] New spec-aligned behavior is documented in the spec (already committed).

