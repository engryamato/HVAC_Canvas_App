# Phase 17: Split and Merge Command Hydration

## Goal

Support atomic split/merge run operations with undo/redo integrity.

## Scope

- Update `hvac-design-app/src/core/commands/commandTypes.ts`.
- Update `hvac-design-app/src/core/commands/entityCommands.ts`.
- Add or update `hvac-design-app/src/core/commands/ductRunCommands.ts`.

## Deliverables

- `SPLIT_RUN` command and handler.
- `MERGE_RUNS` command and handler.
- Inverse command generation for history stability.

## Implementation Tasks

- Validate split station and merge compatibility.
- Recompute segments after topology changes.
- Preserve connection references and optional fitting linkage.

## Acceptance Criteria

- Split and merge each undo in one history action.
- Resulting segment counts and connections are correct.
