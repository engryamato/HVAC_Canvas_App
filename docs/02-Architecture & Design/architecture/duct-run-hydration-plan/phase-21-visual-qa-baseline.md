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

## Visual Comparison Rubric

Use this section as the pass/fail rubric when comparing a fresh capture against:

- `screenshots/phase-21/phase21-duct-run-canvas-baseline.png`
- `screenshots/phase-21/phase21-duct-run-inspector-baseline.png`

### 1. Canvas layout baseline

Compare the seeded desktop canvas against the baseline with attention to:

- **Information Scent / Jakob's Law**: the screen should still read like the standard canvas workspace, with left navigation, top action bar, central drawing surface, and right properties rail visible in their expected positions.
- **Proximity / Common Region**: each run label should stay visually tied to its own geometry, not drift into another run's zone.
- **Pragnanz / Aesthetic-Usability Effect**: the four sample runs should remain easy to parse at a glance, with no visual clutter from hydration artifacts.

Defect-worthy changes:

- Missing run geometry or labels for any of the four representative runs.
- Segment divider count no longer matching the seeded scenario.
- Run labels overlapping geometry, floating far away from the run, or clipping outside the visible working area.
- Sidebar, minimap, zoom controls, or toolbar obscuring the run stack.
- Noticeable stroke/color inconsistencies that make one run appear selected, disabled, or errored when it is not.

Expected variation that QA should not file by itself:

- Minor text anti-aliasing differences between machines.
- Small sub-pixel shifts that do not break grouping, readability, or segment-count comprehension.

### 2. Representative run expectations

The seeded canvas is valid only if these scenario cues remain intact:

- `Rectangular Main`: 3 visible pieces with a partial trailing section, rendered as the top-most run.
- `Round Branch`: 2 full pieces, centered below the rectangular main.
- `Flat Oval Transfer`: 3 full pieces, longest of the lower three runs.
- `Flexible Diffuser Drop`: 2 pieces with a partial trailing section, shortest run at the bottom.

Fail the comparison if any run changes order, loses its partial/full-piece pattern, or no longer reads as a distinct representative case.

### 3. Inspector baseline

The inspector baseline targets the selected `Rectangular Main` run. Compare against the inspector screenshot with attention to:

- **Recognition over Recall / Chunking**: the inspector should still separate identity, section rule, and run summary into distinct cards.
- **Miller's Law / Cognitive Load**: summary values should remain scannable without forcing QA to mentally reconcile scattered numbers.
- **Consistency / Norman feedback**: the badge and section controls should clearly indicate whether the run is using the global rule or an override.

Expected baseline values:

- Name: `Rectangular Main`
- Subtitle: `standard duct · 30" x 16"`
- Badge: `Using global default`
- Fabrication profile: `Rectangular (5 ft default)`
- Install length: `13 ft`
- Active section length: `5 ft`
- Total pieces: `3`
- Full pieces: `2`
- Partial pieces: `1`
- Partial lengths: `3 ft`

Defect-worthy changes:

- Summary math no longer reconciles with the visible canvas segmentation.
- Missing section-length controls or missing default/override signifier.
- Summary fields collapsing into a single column at desktop width or truncating values that fit in the baseline.
- Copy changes that make the state ambiguous for QA, such as removing whether the rule is global vs. custom.

Expected variation that QA should not file by itself:

- Focus ring differences when the numeric input happens to be active during capture.
- Slight button-width differences if fonts render differently, as long as all preset lengths remain visible and tappable/clickable.

### 4. Setup and viewport boundaries

These states are important, but they are not phase 21 visual regressions in the duct-run surface itself:

- A fresh browser session opening `http://127.0.0.1:3010/canvas?projectId=11111111-1111-4111-8111-111111111111` can still land on `Project Not Found` if the seeded local browser state is absent. Treat that as an environment/setup dependency unless the issue owner explicitly claims the route should be self-seeding.
- Mobile viewport `390x844` currently shows the app's `Device Incompatible` guard instead of the canvas. Treat that as expected platform gating for this workflow, not a duct-run hydration regression.

### 5. Evidence to attach on failure

When QA finds a visual failure, attach:

- A full desktop canvas screenshot at the failure viewport.
- An inspector crop if the selected run state is involved.
- A one-line note stating whether the failure breaks canvas layout, inspector math/state, or seeded-scenario integrity.

## Current Runtime State

The SIZAA Paperclip project now has a managed phase 21 preview configuration:

- Project workspace exists at `C:\Users\User\Downloads\GitHub\HVAC_Canvas_App`
- Project `executionWorkspacePolicy` is `{"enabled": true, "defaultMode": "shared_workspace"}`
- Project workspace `runtimeConfig` defines a managed `web` service rooted at `hvac-design-app`
- Shared execution workspace `a933877b-7973-4fd9-9132-20b034a87700` is running a healthy `web` runtime at `http://127.0.0.1:3010`

QA can open the seeded canvas directly at:

- `http://127.0.0.1:3010/canvas?projectId=11111111-1111-4111-8111-111111111111`

## Remaining Control-Plane Limitation

Paperclip still does not surface that preview through `SIZAA-60`'s `currentExecutionWorkspace` field:

- The heartbeat realized shared execution workspaces for `SIZAA-60`, but the issue row still returns `executionWorkspaceId = null`
- Direct `PATCH /api/issues/:id` attempts to set `executionWorkspaceId` are accepted but the field is stripped back to `null`
- On Windows, managed runtime startup also falls back to `sh -lc` when `SHELL` is unset, so the runtime had to be adopted from a live local Node process instead of launched cleanly by Paperclip

## Next Owner / Action

- CTO / Paperclip operator: fix the issue-to-execution-workspace binding path so `SIZAA-60` exposes a non-null `currentExecutionWorkspace`
- CTO / Paperclip operator: fix the Windows runtime launcher to avoid the `sh -lc` fallback when no POSIX shell is present
- After those control-plane fixes, re-wake `SIZAA-60`, bind the shared workspace to the issue, and confirm the same preview URL appears in `heartbeat-context.currentExecutionWorkspace.runtimeServices`
