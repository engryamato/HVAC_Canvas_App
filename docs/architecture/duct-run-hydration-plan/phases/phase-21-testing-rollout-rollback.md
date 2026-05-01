# Phase 21: Testing, Rollout, and Rollback

## Goal

Validate the duct-run hydration migration end to end and preserve a safe rollback path while the new architecture stabilizes.

## Scope

- Add targeted unit, integration, visual, and compatibility coverage for the duct-run architecture.
- Define rollout signoff gates that QA can execute consistently.
- Document rollback triggers, evidence, and the fallback path to the legacy `duct` behavior.

## QA Checkpoints

### 1. Unit coverage gates

Required before rollout signoff:

- `convertDuctToDuctRun` covers legacy project migration, including old projects with no duct-run metadata.
- `recomputeDuctRunSegments` covers section regeneration after edits and fitting changes.
- `getActiveSectionLength` covers `50/5`, `63/5`, and override precedence behavior.
- `summarizeDuctRunQuantity` covers quantity output parity between legacy `duct` input and hydrated duct-run output.
- Schema validation covers the new `duct-run` entity shape and unsupported combinations fail deterministically.

Evidence:

- Green targeted Vitest output for the new duct-run utilities and schema tests.
- Fixtures for at least one legacy payload and one fully hydrated payload checked into the repo.

### 2. Integration flow gates

Required before rollout signoff:

- Draw a new duct run and confirm selection, inspector editing, and serialization all operate on hydrated data.
- Load a legacy project and confirm conversion to duct-run state occurs without state residue.
- Exercise split, merge, fitting insertion, undo, and redo in one session and confirm state remains coherent.
- Confirm product-surface bridges continue to work after hydration: canvas rendering, selection rules, and quantity summary updates.

Evidence:

- Green integration tests for draw/select/split/merge/undo flows.
- A saved test project that is loaded, edited, saved again, and reloaded without data loss.

### 3. Visual regression gates

Required before rollout signoff:

- Capture representative rectangular, round rigid, flat oval, and flexible scenarios.
- Verify segment math aligns with on-canvas visuals after split/merge and fitting insertion.
- Verify legacy-project conversion does not introduce clipping, overlap, misaligned handles, or inspector/canvas disagreement.

Evidence:

- Baseline screenshots or visual snapshots for each representative scenario.
- QA screenshots for any manual verification where the rendered result is part of the acceptance decision.

### 4. Rollout signoff gates

Rollout is safe only when all of the following are true:

- All targeted duct-run unit and integration tests are green in CI.
- Legacy project open/save behavior is verified on both web hydration and Tauri file hydration paths.
- No open blocker remains against selection, undo/redo, rendering parity, or quantity summary parity.
- The fallback render path for legacy `duct` entities remains available during the stabilization window.
- QA has a known-good legacy project fixture, a known-good hydrated project fixture, and a written rollback trigger list.
- QA review is executed against `docs/architecture/duct-run-hydration-plan/DUCT-RUN-DOMAIN-ACCEPTANCE-GATES.md`.

## Rollback Triggers

Rollback should be initiated if any of the following are observed during rollout or immediately after merge:

- Legacy projects fail to open or silently lose duct geometry/state.
- Split/merge, fitting insertion, or undo/redo corrupts segment length math.
- Quantity summaries diverge between legacy and hydrated representations for the same saved design.
- Visual alignment breaks between rendered segments, handles, or inspector state.
- Canvas performance regresses below acceptable target scale for representative duct-run scenarios.

## Rollback Procedure

Minimum rollback path:

1. Disable or bypass the hydrated duct-run render/serialization path.
2. Route affected projects back through the legacy `duct` render path kept available during stabilization.
3. Preserve failing fixtures, screenshots, and command output before any cleanup or re-save.
4. Re-run the legacy-project open/save smoke test to confirm the fallback path is stable.

Required rollback evidence:

- Exact project fixture used.
- Repro steps.
- Expected versus actual behavior.
- Screenshot or equivalent UI evidence when rendering is involved.
- Targeted test output showing the failing surface, if an automated test exists.

## Current Baseline

### 2026-05-01 status

- Automated phase-21 evidence is green across hydration, migration, schema, geometry, quantity, pressure-drop, validation, and export-label Vitest slices.
- Rollout signoff is still blocked because there is no issue-scoped runtime service URL or screenshot baseline available for the required manual visual gates.
- The remaining phase-21 execution path is:
  1. expose a repo-backed preview/runtime service for QA,
  2. capture screenshot-backed manual visual evidence for representative duct-run scenarios,
  3. only then declare rollout safe or trigger rollback.

As of the phase 21 QA planning pass, the repo already contains hydration baseline tests for `ProjectStateOrchestrator` via:

- `src/features/canvas/__tests__/CanvasPageWrapper.hydration.web.test.ts`
- `src/features/canvas/__tests__/CanvasPageWrapper.hydration.tauri.test.ts`
- `src/features/canvas/__tests__/CanvasPageWrapper.hydration.backward-compat.test.ts`

These establish generic hydration behavior, but they do not yet satisfy the duct-run-specific phase 21 gates above. The planned duct-run schema and utility files referenced by earlier phases must exist before the full rollout checklist can pass.

Automated evidence captured in the restored workspace:

- Hydration baseline: 4 files passed, 13 tests passed.
- Duct-run schema/quantity/command baseline: 4 files passed, 41 tests passed.
- Pressure-drop, calculation hook, geometry, and duct-tool slice: 4 files passed, 16 tests passed.
- Segmenting and migration utility slice: 3 files passed, 6 tests passed.
- Auto-sizing and export-label slice: 2 files passed, 10 tests passed.

## Acceptance Criteria

- Legacy projects open correctly without residual state leakage.
- Segment math, visuals, and quantity summaries remain aligned after hydration.
- Undo/redo remains stable through split/merge and fitting insertion workflows.
- Performance remains acceptable at target scale.
- Rollback can be executed with preserved evidence and a confirmed legacy fallback path.
- Pressure-drop semantics, system-type validation, and quantity reconciliation satisfy the domain acceptance gates.
