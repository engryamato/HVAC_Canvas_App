# Phase 12: Canvas Dispatch Integration

## Goal

Route `duct_run` entities to `DuctRunRenderer` while retaining legacy renderer support.

## Scope

- Update `hvac-design-app/src/features/canvas/components/CanvasContainer.tsx`.

## Deliverables

- Render dispatch case for `entity.type === "duct_run"`.
- Selected segment index mapping into renderer options.
- Legacy `duct` case retained during migration.

## Implementation Tasks

- Add `duct_run` renderer branch.
- Pass run selection and segment selection state.
- Preserve existing rendering order semantics.

## Acceptance Criteria

- Both `duct_run` and legacy `duct` render during migration window.
