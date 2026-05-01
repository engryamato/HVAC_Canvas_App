# Phase 21 Visual QA Baseline

## Purpose

This runbook gives QA a repo-backed way to open a known duct-run hydration scenario and capture the phase 21 manual visual evidence required by the rollout gates.

## Browser Entry

- Route: `/canvas?projectId=11111111-1111-4111-8111-111111111111`
- Seed source: `hvac-design-app/e2e/03-visual-regression/phase-21-duct-run-baseline.spec.ts`
- The Playwright harness injects a hydrated localStorage envelope before navigation, so no dashboard setup is required.

## Representative Scenarios

The seeded project renders four representative duct-run shapes on a single canvas:

- Rectangular main run with segmented `5 ft + 5 ft + 3 ft` pieces
- Round rigid branch with two full pieces
- Flat oval transfer run with three full pieces
- Flexible diffuser drop with a partial trailing piece

The inspector baseline targets the rectangular run so QA can compare canvas segmentation against the `DuctRunInspector` whole-run summary.

## Capture Commands

From `hvac-design-app/`:

```bash
./node_modules/.bin/playwright test --config playwright.phase21.config.ts
```

Artifacts are written to:

- `screenshots/phase-21/phase21-duct-run-canvas-baseline.png`
- `screenshots/phase-21/phase21-duct-run-inspector-baseline.png`

## QA Notes

- Use the canvas baseline to check shape rendering, spacing, label placement, and obvious clipping/overlap regressions.
- Use the inspector baseline to check section math alignment for the segmented rectangular run.
- If a regression is found, preserve the screenshot pair and link it from the phase 21 issue thread before editing the project state.

## Current Runtime Limitation

The SIZAA Paperclip project already has a primary repo workspace, but phase 21 does not yet expose an issue-scoped runtime service URL for QA:

- Project workspace exists at `C:\Users\User\Downloads\GitHub\HVAC_Canvas_App`
- Project `executionWorkspacePolicy` is now `{"enabled": true, "defaultMode": "shared_workspace"}`
- The project workspace `runtimeConfig` is still `null`, so no managed `web` preview service is defined

That means QA can generate the baseline locally through Playwright today, but Paperclip cannot yet present a non-null `currentExecutionWorkspace` with a browser URL for `SIZAA-60`.

## Next Owner / Action

- CTO / Paperclip operator: keep the project on `executionWorkspacePolicy.defaultMode = shared_workspace`
- CTO / Paperclip operator: add a managed runtime service for the Next preview, for example a `web` command rooted at `hvac-design-app`
- After those two control-plane changes, re-wake `SIZAA-60`, start the managed service, and post the resulting runtime URL into the issue thread
