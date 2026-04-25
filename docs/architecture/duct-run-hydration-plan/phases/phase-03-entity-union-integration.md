# Phase 03: Entity Union Integration

## Goal

Make `duct_run` a first-class entity type in global schema unions.

## Scope

- Update `hvac-design-app/src/core/schema/base.schema.ts`.
- Update `hvac-design-app/src/core/schema/index.ts`.

## Deliverables

- Entity type enum includes `duct_run`.
- Main discriminated union includes `DuctRunSchema`.

## Implementation Tasks

- Add enum value in base schema.
- Import and append `DuctRunSchema` to union assembly.
- Confirm no existing entity parsing regressions.

## Acceptance Criteria

- `duct_run` parses through main schema entrypoint.
- Existing entity schema parsing remains intact.
