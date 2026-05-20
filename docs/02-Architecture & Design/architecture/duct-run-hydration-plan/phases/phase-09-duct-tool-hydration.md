# Phase 09: Duct Tool Hydration

## Goal

Update drawing behavior so new ducts are created as `duct_run`.

## Scope

- Update `hvac-design-app/src/features/canvas/tools/DuctTool.ts`.

## Deliverables

- Creation payload includes run geometry fields and generated segments.
- Magnetic snap integration for start/end points.

## Implementation Tasks

- Capture start/end and compute angle/length.
- Resolve shape and size inputs from current tool settings.
- Resolve active section length and generate segments.
- Emit entity with `type: "duct_run"`.

## Acceptance Criteria

- New drawing creates `duct_run` only.
- Properties panel values match drawn geometry.
