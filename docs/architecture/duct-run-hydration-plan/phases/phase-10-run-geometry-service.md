# Phase 10: Run Geometry Service

## Goal

Use one cached geometry source for rendering and hit testing.

## Scope

- Add `hvac-design-app/src/features/canvas/services/DuctRunGeometryService.ts`.

## Deliverables

- Computed centerline, walls, normals/direction.
- Segment planes and segment bounds polygons.
- Label anchors and hit bounds.
- Cache invalidation hooks.

## Implementation Tasks

- Build geometry from run start/end and rendered width.
- Project segment stations into canvas coordinates.
- Implement `hitTestRun` and `hitTestSegment`.

## Acceptance Criteria

- Geometry reused between render and selection.
- Segment hit areas align with rendered segments.
