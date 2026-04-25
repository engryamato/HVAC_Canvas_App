# Phase 06: Active Section Length Resolver

## Goal

Centralize how effective section length is resolved for a run.

## Scope

- Add `hvac-design-app/src/features/duct-runs/utils/getActiveSectionLength.ts`.

## Deliverables

- Shape-to-fabrication-family resolver.
- Active section length resolver (override first, then profile default).

## Implementation Tasks

- Map run shapes to fabrication families.
- Return `sectionLengthOverride` when present.
- Fallback to profile default value.

## Acceptance Criteria

- Run override always wins.
- No-override paths use profile defaults consistently.
