# Phase 14: Select Tool Hydration

## Goal

Implement two-step selection semantics for runs and segments.

## Scope

- Update `hvac-design-app/src/features/canvas/tools/SelectTool.ts`.

## Deliverables

- First click selects run.
- Segment click works only when parent run is already selected.
- Shift/Ctrl multi-segment support.

## Implementation Tasks

- Use geometry service for run/segment hit tests.
- Apply selection rule ordering before generic entity hit logic.
- Clear segment selection on context switch or empty-canvas click.

## Acceptance Criteria

- Segment selection cannot occur without selected parent run.
- Existing non-duct selection behavior remains intact.
