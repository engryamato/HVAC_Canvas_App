# DuctRun Hydration: Phase-by-Phase Execution Plan

## Execution Rules

- Implement phases in order.
- Do not remove legacy `duct` rendering/compatibility until stabilization.
- Do not rewrite the existing auto-fitting system; bridge into it.
- Keep changes behind safe guards where needed (`FEATURE_DUCT_RUNS` recommended).

## Phase 1 - Coordinate Hydration

- Goal: Centralize model/canvas unit conversion.
- Deliverables: add `hvac-design-app/src/core/constants/coordinates.ts` with `feetToPixels`, `pixelsToFeet`, `inchesToPixels`, `pixelsToInches`.
- Acceptance: no scattered `* 12` conversion logic in duct run workflow.

## Phase 2 - DuctRun Schema Hydration

- Goal: Introduce canonical `duct_run` with embedded `segments`.
- Deliverables: add `hvac-design-app/src/core/schema/duct-run.schema.ts`; support shapes `rectangular`, `round`, `flat_oval`, `flexible` and families `standard_duct`, `grease_duct`, `boiler_flue`, `generator_exhaust`.
- Acceptance: shape-specific size validation works.

## Phase 3 - Entity Union Integration

- Goal: Make `duct_run` first-class in entity typing.
- Deliverables: update `hvac-design-app/src/core/schema/base.schema.ts` and `hvac-design-app/src/core/schema/index.ts`.
- Acceptance: `duct_run` parses through the main entity union.

## Phase 4 - Fabrication Profile Hydration

- Goal: Add global defaults for section lengths.
- Deliverables: add `hvac-design-app/src/core/schema/fabrication-profile.schema.ts` and `hvac-design-app/src/core/store/fabricationProfileStore.ts`; default rectangular and round rigid to 5 ft.
- Acceptance: profile values persist locally and can be reset.

## Phase 5 - Segment Recompute Utility

- Goal: Deterministic section generation from run length.
- Deliverables: add `hvac-design-app/src/features/duct-runs/utils/recomputeDuctRunSegments.ts`.
- Acceptance: `50/5 => 10 full`; `63/5 => 12 full + 1 partial (3)`.

## Phase 6 - Active Section Length Resolver

- Goal: One source of truth for effective section length.
- Deliverables: add `hvac-design-app/src/features/duct-runs/utils/getActiveSectionLength.ts`.
- Acceptance: run override wins; fallback uses fabrication profile default.

## Phase 7 - Legacy Migration Utility

- Goal: Convert old `duct` entities to `duct_run` in memory.
- Deliverables: add `hvac-design-app/src/features/duct-runs/utils/convertDuctToDuctRun.ts`; generate segments during conversion.
- Acceptance: old projects load and converted runs contain segments.

## Phase 8 - Loader/Deserialization Integration

- Goal: Apply conversion during project hydration.
- Deliverables: integrate conversion in load pipeline.
- Acceptance: existing data remains readable without destructive rewrite.

## Phase 9 - Duct Tool Hydration

- Goal: New drawing creates `duct_run` only.
- Deliverables: update `hvac-design-app/src/features/canvas/tools/DuctTool.ts` for start/end, angle, install length, section logic, and segments.
- Acceptance: new drawings are persisted as `duct_run`.

## Phase 10 - Run Geometry Service

- Goal: Shared geometry for render, hit-test, and labels.
- Deliverables: add `hvac-design-app/src/features/canvas/services/DuctRunGeometryService.ts`; compute/cache centerline, walls, segment bounds/planes, label anchor, and hit bounds.
- Acceptance: renderer and selection both use this service.

## Phase 11 - DuctRun Renderer

- Goal: Professional-width duct visuals with segment lines.
- Deliverables: add `hvac-design-app/src/features/canvas/renderers/DuctRunRenderer.ts`.
- Acceptance: visual segment count matches generated segments.

## Phase 12 - Canvas Dispatch Integration

- Goal: Route `duct_run` to new renderer while preserving legacy display.
- Deliverables: update `hvac-design-app/src/features/canvas/components/CanvasContainer.tsx`.
- Acceptance: both `duct_run` and legacy `duct` render in migration window.

## Phase 13 - Selection Store Hydration

- Goal: Support full-run and segment-level selection.
- Deliverables: update `hvac-design-app/src/features/canvas/store/selectionStore.ts` with `selectedSegments` and segment actions.
- Acceptance: segment selection model uses `{ runId, segmentIndex }`.

## Phase 14 - Select Tool Hydration

- Goal: Enforce two-step selection model.
- Deliverables: update `hvac-design-app/src/features/canvas/tools/SelectTool.ts`; segment selection allowed only when parent run is selected.
- Acceptance: first click selects run; second click can select segment.

## Phase 15 - DuctRun Inspector

- Goal: Expose run/segment quantity and section details.
- Deliverables: add `hvac-design-app/src/features/properties/components/DuctRunInspector.tsx` with whole-run, single-segment, and multi-segment modes.
- Acceptance: UI shows full vs partial pieces and partial lengths.

## Phase 16 - Fabrication Profile Settings Panel

- Goal: Make global defaults editable by duct family.
- Deliverables: add `hvac-design-app/src/features/properties/components/FabricationProfileSettingsPanel.tsx`.
- Acceptance: non-overridden runs react to global changes; overridden runs do not.

## Phase 17 - Split/Merge Command Hydration

- Goal: Atomic and undoable run topology editing.
- Deliverables: update `hvac-design-app/src/core/commands/commandTypes.ts`, `hvac-design-app/src/core/commands/entityCommands.ts`, and add/update `hvac-design-app/src/core/commands/ductRunCommands.ts`; implement `SPLIT_RUN` and `MERGE_RUNS`.
- Acceptance: split and merge each undo in one history step.

## Phase 18 - Magnetic Connection Completion

- Goal: Reliable endpoint/body snapping with split triggers.
- Deliverables: update/add `hvac-design-app/src/features/canvas/services/magneticConnectionService.ts`; apply priority endpoint -> fitting port -> equipment point -> run body -> grid -> free.
- Acceptance: near-end body snaps act as endpoint snaps; mid-run snap can trigger split.

## Phase 19 - Auto-Fitting Bridge

- Goal: Reuse existing fitting resolver from DuctRun connection events.
- Deliverables: add compatibility adapter that forwards connection context.
- Acceptance: fitting insertion remains stable and selectable.

## Phase 20 - Quantity Summary Bridge

- Goal: Produce estimating-ready run quantity summary.
- Deliverables: add `hvac-design-app/src/features/duct-runs/utils/summarizeDuctRunQuantity.ts`.
- Acceptance: output matches visual segments and includes partial lengths.

## Phase 21 - Test, Rollout, and Rollback Guardrails

- Goal: Validate behavior and preserve migration safety.
- Deliverables: add unit/integration/visual tests for `50/5`, `63/5`, override precedence, selection rules, legacy conversion, and split/merge undo.
- Acceptance: old projects still open, undo/redo remains stable, and performance remains acceptable at scale.

---

## Suggested Launch Default Decision

- Recommended for launch: separate defaults by family from day one (rectangular, round rigid, flat oval, flexible), with rectangular and round rigid initialized at 5 ft.
- Reason: supports realistic estimating differences now while keeping migration low-risk.
