# Phase 02: DuctRun Schema Hydration

## Goal

Introduce the canonical `duct_run` entity schema with embedded `segments`.

## Scope

- Add `hvac-design-app/src/core/schema/duct-run.schema.ts`.
- Model shape and family variants.
- Validate embedded segment structure.

## Deliverables

- `DuctSegmentSchema` with station and partial flags.
- `DuctRunPropsSchema` using discriminated shape unions.
- `DuctRunSchema` with `type: "duct_run"`.

## Implementation Tasks

- Define base/common run props.
- Add rectangular/round/flat-oval/flexible shape variants.
- Add family enum (`standard_duct`, `grease_duct`, `boiler_flue`, `generator_exhaust`).

## Acceptance Criteria

- Rectangular requires width/height.
- Round/flexible require diameter.
- Segment records are embedded and validated.
