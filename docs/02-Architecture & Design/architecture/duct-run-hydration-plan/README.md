# Duct Run Hydration Plan

## Purpose
This folder captures the full DuctRun migration and hydration strategy for the HVAC canvas app, converted into an execution-ready phase plan.

## Approved Direction
- `DuctRun` is the top-level entity (`entity.type = "duct_run"`).
- Duct sections stay embedded in `DuctRun.props.segments`.
- Segment selection is tracked by `{ runId, segmentIndex }`, not by standalone entity IDs.
- Keep Canvas 2D, Zustand, and the existing command/history pattern.
- Keep legacy `duct` support during migration.

## Why This Direction
- Preserves a flat entity store and avoids thousands of child entities.
- Enables full-run and segment-level interaction without entity bloat.
- Keeps undo/redo and command semantics simpler.
- Makes quantity takeoff deterministic and aligned with visuals.

## Scope Covered
- Data model and schema hydration
- Legacy migration and backward compatibility
- Duct drawing, geometry, rendering, and selection
- Section-length profile settings and overrides
- Magnetic and split/merge connection behaviors
- Quantity summary extraction
- Testing and rollback safety

## Folder Contents
- `README.md` (this file): architecture decision + implementation scope
- `PHASE-BY-PHASE.md`: detailed execution phases with acceptance checks
- `DUCT-RUN-DOMAIN-ACCEPTANCE-GATES.md`: rollout domain gates for CTO, coder, and QA review

## Key Output Behavior
- 50 ft run at 5 ft sections -> 10 full sections
- 63 ft run at 5 ft sections -> 12 full + 1 partial (3 ft)
- Visual segment count must match quantity summary count
- Old projects must continue to open safely
