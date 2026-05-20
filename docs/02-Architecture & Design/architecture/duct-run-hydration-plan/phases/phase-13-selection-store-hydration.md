# Phase 13: Selection Store Hydration

## Goal

Support run-level and segment-level selection in store state.

## Scope

- Update `hvac-design-app/src/features/canvas/store/selectionStore.ts`.

## Deliverables

- `selectedSegments: Array<{ runId: string; segmentIndex: number }>`
- APIs for select/add/remove/clear segment selection.

## Implementation Tasks

- Extend state shape and actions.
- Prevent duplicate segment references.
- Clear segment selection when entity context changes.

## Acceptance Criteria

- Segment selection references use `{ runId, segmentIndex }` only.
- Multi-select operations remain stable with modifier keys.
