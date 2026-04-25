# Phase 21: Testing, Rollout, and Rollback

## Goal

Validate the full migration and preserve a safe rollback path.

## Scope

- Add unit/integration/visual test coverage.
- Define rollout checks and rollback triggers.

## Deliverables

- Unit tests for conversion, sectioning, and active-length resolution.
- Integration tests for draw/select/split/merge/undo flows.
- Visual checks for representative duct scenarios.
- Rollback toggles and operational triggers documented.

## Implementation Tasks

- Add test cases for `50/5`, `63/5`, and override precedence.
- Verify legacy project load behavior.
- Confirm undo/redo stability around split/merge and fitting insertions.
- Keep legacy `duct` render path available during stabilization.

## Acceptance Criteria

- Legacy projects open correctly.
- Segment math and visuals remain aligned.
- Undo/redo is stable and performance stays acceptable at target scale.
