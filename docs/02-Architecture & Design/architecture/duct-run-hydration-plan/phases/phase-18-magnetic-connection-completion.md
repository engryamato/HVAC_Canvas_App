# Phase 18: Magnetic Connection Completion

## Goal

Finalize reliable magnetic snapping for duct run endpoints and body connections.

## Scope

- Update/add `hvac-design-app/src/features/canvas/services/magneticConnectionService.ts`.

## Deliverables

- Snap priority model: endpoint -> fitting port -> equipment point -> run body -> grid -> free.
- Result object with snap type and resolved point metadata.

## Implementation Tasks

- Implement strict snap resolution order.
- Treat near-end run-body snap as endpoint snap.
- Trigger split flow for valid mid-run body snap.
- Add clear visual snap markers for professional UX.

## Acceptance Criteria

- Endpoint snaps are deterministic and visually clear.
- Mid-run connection can dispatch split behavior.
