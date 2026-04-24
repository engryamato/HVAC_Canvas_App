# Duct Rendering & Run/Segment Overhaul — Design (Authoritative Scale + DuctRun)

Date: 2026-04-24

## Summary

This design replaces the legacy centerline `duct` entity + renderer/tooling with a model-true `duct_run` foundation that:

- Uses a **single authoritative scale contract** (`settings.planScale`) for on-screen rendering, snapping, labels, and PDF export.
- Renders ducts as **two-wall geometry** (round and rectangular) with **fabrication seam markers** and connection flanges.
- Introduces **Run → embedded Segment** hierarchy for deterministic fabricated sectioning and takeoff.
- Supports whole-run and per-segment selection without ballooning entity count.

## Non-goals

- Flat-oval/flex rendering (extension points only).
- Rebuilding BOM/export beyond ensuring the new run model is supported and scale information is accurate.
- Reworking 3D view.

## 1) Authoritative scale contract (no hard-coded conversions)

### Canonical units

- **World coordinates and entity geometry are stored in inches.**
- `viewport.zoom` remains a **relative user zoom multiplier**.
- `settings.planScale` is the **single source of truth** for mapping model units to on-screen pixels and to printed physical size.

### Project setting shape (validated)

`ProjectFile.settings.planScale?: { pixelsPerUnit: number (>0), unit: 'ft'|'in'|'m'|'cm'|'mm' }`

Default when missing: `{ pixelsPerUnit: 1, unit: 'in' }` (matches today’s effective behavior).

Keep `ProjectFile.settings.scale?: string` as a human-readable label (e.g., `"1/4 inch = 1 foot"`).

### Conversions (shared helpers)

Constants:

- `IN_PER_FT = 12`
- `CSS_PX_PER_IN = 96` (for physical print mapping when exporting snapshots)

Functions:

- `inchesPerUnit(unit)`:
  - `ft=12`, `in=1`, `m=39.37007874`, `cm=0.3937007874`, `mm=0.03937007874`
- `pxPerInchModel = planScale.pixelsPerUnit / inchesPerUnit(planScale.unit)`
- `viewScale = viewport.zoom * pxPerInchModel`

Canvas mapping:

- Render transform uses `viewScale`: `ctx.translate(panX, panY); ctx.scale(viewScale, viewScale)`
- Screen → world (inches): `(screen - pan) / viewScale`

Screen-stable tolerances and strokes:

- Any pixel tolerance (e.g., snapping) converts to world inches via `tolIn = tolPx / viewScale`.
- Any constant pixel stroke width converts via `lineWidth = px / viewScale`.

Grid:

- `gridSize` is treated as **inches between grid lines**.
- Grid UI must label options in inches/feet (remove/replace 96-DPI language).

## 2) Data model: `duct_run` + embedded segments

### New entity type: `duct_run`

- `transform`: `{ x: inches, y: inches, rotation: degrees }` (start point and heading)
- `props.endPointIn`: `{ x: inches, y: inches }` (world end coordinate)
- `props.shape`: `'round' | 'rectangular'`
- `props.diameterIn` (round) or `props.widthIn/heightIn` (rectangular)
- `props.installLengthFt`: stored number (derived from start/end, for takeoff and UI)
- `props.sectionLengthOverrideFt?`: optional per-run override
- `props.segments`: `DuctSegment[]` (embedded, not separate entities)
- `props.startConnectionId?`, `props.endConnectionId?`: fitting/equipment IDs where applicable
- Carry over legacy duct fields required by constraints/BOM (material, engineeringSystem, serviceId, etc.)

### Embedded record: `DuctSegment`

- `index: number`
- `startStationFt: number`
- `endStationFt: number`
- `lengthFt: number`
- `isPartial: boolean`

Determinism rules:

- Segments are regenerated deterministically from `(installLengthFt, activeProfileSectionLengthFt)`.
- Remainder piece, if any, is always placed at the **terminal end** and sets `isPartial=true`.

Length units:

- Stations and `installLengthFt` are stored in **feet**.
- World geometry remains inches; conversions use shared helpers only.

## 3) Interaction contract (tools + selection)

### Snapping

Priority when targets overlap:

1. Run endpoint
2. Fitting connection port
3. Run body

Tolerances:

- Define `SNAP_PX = 12` and compute `snapTolIn = SNAP_PX / viewScale` each frame.
- Minimum run length: `MIN_RUN_FT = 0.1` (block commit below this).

### Selection model

Selection store changes:

- Keep `selectedIds: string[]` for entity IDs (whole-run selection is run id).
- Add `selectedSegments: Array<{ runId: string; segmentIndex: number }>` for segment selection.

Behavior:

- First click on a run body/seam marker selects the whole run.
- Click on a segment while its run is selected selects the segment (parent run stays selected).
- Shift/Ctrl enables multi-select (whole runs or segments across runs).
- Escape clears segments first; second Escape clears runs.
- Dragging always moves **whole runs** only (never individual segments).

### Run splitting

- If user connects to a run body outside endpoint tolerance: show a ghost fitting preview and on commit:
  - Split the original run into upstream + downstream runs.
  - Insert the fitting that joins the new/old runs.
  - Re-segment both new runs deterministically.
- Splitting is blocked if either resulting run would be `< MIN_RUN_FT`.
- Implement as one atomic reversible command: `SPLIT_RUN` with inverse `MERGE_RUNS`.

## 4) Rendering + geometry caching (performance contract)

Introduce `DuctRunGeometryService` as the owner of cached computed geometry per run, including:

- Wall offsets (parallel boundaries)
- Seam and flange marker placement
- Label anchors
- Hit-test regions for run bodies and individual segments

Invalidation triggers (explicit):

- Run geometry inputs changed (endpoints, dims, shape, rotation)
- Fabrication profile for that run’s family changed
- View-scale crosses marker/label suppression thresholds (if implemented)

Renderer responsibilities:

- Renderer is declarative: it asks the service for geometry and draws it.
- No geometry math inside the renderer beyond applying style/paint.

## 5) Persistence + migration

### Schema wiring (repo-specific source of truth)

- Entity discriminated union is defined in `core/schema/project-file.schema.ts` (`EntitySchema`).
- Add `DuctRunSchema` to that union and export from `core/schema/index.ts`.

### Versioning

- Bump `CURRENT_SCHEMA_VERSION`.
- On load, if the project contains legacy `duct` entities, migrate in-memory to `duct_run`.
- On save, always write the new schema version (never write legacy `duct` back out).

### Migration mapping (legacy `duct` → `duct_run`)

- Create one `duct_run` per `duct`.
- Start point is legacy `transform.(x,y)`; end point is computed from legacy `lengthFt` and rotation.
- Create exactly one segment spanning full run length: `index=0`, `startStationFt=0`, `endStationFt=installLengthFt`, `isPartial=false`.
- Preserve relevant duct props required by validation, BOM, and services.

## 6) Fabrication profiles (app-global) + draft/commit UX

Profiles are app-global (Zustand `persist`), not stored in the project file.

Store shape:

- `profilesCommitted` (used by normal rendering + export)
- `profilesDraft` (live preview while editing)
- `commit()` persists draft → committed
- `revert()` resets draft from committed

Per-run override:

- `activeSectionLengthFt = run.sectionLengthOverrideFt ?? profilesDraft[family].defaultSectionLengthFt`

Validation:

- Draft edits must satisfy min/max constraints; invalid draft values show inline validation and **do not** trigger run regeneration.

## 7) PDF export contract (true-to-scale → scale-to-fit fallback)

Goal: export uses the same authoritative scale contract; PDF is a drafting deliverable.

Behavior:

1. Attempt **true-to-scale placement** using `planScale`.
2. If the plan doesn’t fit on selected paper size, **auto-scale down to fit**, and print the effective scale used.

Physical mapping assumptions:

- Treat snapshot pixels as CSS pixels (`CSS_PX_PER_IN = 96`).
- `pxPerInchModel` from `settings.planScale`.
- Printed inches per model inch: `printInPerModelIn = pxPerInchModel / 96`.

PDF annotations (always included):

- Scale bar + “Plan scale: …”
- If scaled-to-fit, also include “Effective scale: …”

Export detail:

- Export uses a full-detail render pass (independent of viewport zoom suppression) with print-stable marker sizes.

## 8) Acceptance criteria (must be true)

- Ducts render to true model width (round as two tangent lines; centerline optional/secondary).
- Seam markers and flange markers are screen-stable and export consistently at print size.
- Run selection → segment selection state machine behaves as specified (including Escape semantics).
- Segment regeneration is deterministic and responsive at the target scale (250 runs / 1,250 segments).
- Old projects open via migration; saving produces only the new schema.
- PDF export includes scale bar + effective scale labeling when scaled-to-fit.

