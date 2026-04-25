# Phase 11: DuctRun Renderer

## Goal

Render full-width duct runs and section boundaries professionally.

## Scope

- Add `hvac-design-app/src/features/canvas/renderers/DuctRunRenderer.ts`.

## Deliverables

- Run body/walls and end planes.
- Segment separators from geometry segment planes.
- Run and segment selection overlays.
- Run label rendering.

## Implementation Tasks

- Consume geometry service output exclusively.
- Render selected segment overlays by `segmentIndex`.
- Keep style hooks for theme/selection state.

## Acceptance Criteria

- 50 ft / 5 ft visually shows 10 sections.
- 63 ft / 5 ft visually shows 13 sections with short final section.
