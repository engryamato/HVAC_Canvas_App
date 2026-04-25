# Phase 15: DuctRun Inspector

## Goal

Expose run and segment sectioning/quantity information in properties UI.

## Scope

- Add `hvac-design-app/src/features/properties/components/DuctRunInspector.tsx`.

## Deliverables

- Whole-run mode fields.
- Single-segment mode fields.
- Multi-segment aggregate mode fields.

## Implementation Tasks

- Read selected run and selected segments from stores.
- Surface full and partial piece counts and partial lengths.
- Add override section-length editing and trigger recompute flow.

## Acceptance Criteria

- Inspector values match canvas segment visuals.
- Section-length override updates segment count deterministically.
