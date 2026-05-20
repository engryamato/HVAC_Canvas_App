# Phase 19: Auto-Fitting Bridge

## Goal

Bridge DuctRun connection events into existing auto-fitting logic without rewrites.

## Scope

- Add compatibility adapter in existing connection pipeline.

## Deliverables

- Input mapping from DuctRun connection metadata to fitter resolver payload.
- Handling for straight, angle, size-transition, branch, and mid-run branch cases.

## Implementation Tasks

- Build adapter payload with run ids, shape/size, angle, and connection point/type.
- Invoke existing fitting resolver and persist returned fitting entities.
- Maintain run/fitting selection independence after insertion.

## Acceptance Criteria

- Existing auto-fitting logic remains authoritative.
- New DuctRun path does not bypass fitting rules.
