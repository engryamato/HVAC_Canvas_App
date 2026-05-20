# Phase 08: Loader and Deserialization Integration

## Goal

Integrate legacy-to-new conversion into project hydration.

## Scope

- Update project load/deserialization path.

## Deliverables

- Hydration map step that converts `entity.type === "duct"` to `duct_run`.
- Feature-flag guard path if rollout needs gating.

## Implementation Tasks

- Locate entrypoint where entities are parsed from persisted data.
- Inject conversion call prior to schema validation/rendering.
- Ensure id/history continuity remains stable.

## Acceptance Criteria

- Older files load successfully.
- Mixed old/new files hydrate without crashes.
