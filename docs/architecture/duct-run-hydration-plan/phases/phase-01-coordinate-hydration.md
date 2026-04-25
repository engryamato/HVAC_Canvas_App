# Phase 01: Coordinate Hydration

## Goal

Centralize model-to-canvas conversion logic in one shared constants module.

## Scope

- Add `hvac-design-app/src/core/constants/coordinates.ts`.
- Replace ad hoc conversion usage in duct-run-related flows.

## Deliverables

- `PIXELS_PER_INCH`, `INCHES_PER_FOOT`, `PIXELS_PER_FOOT`.
- `feetToPixels`, `pixelsToFeet`, `inchesToPixels`, `pixelsToInches`.
- Optional rounding helper for stable displayed feet values.

## Implementation Tasks

- Create constants/functions module.
- Update duct tools/rendering helpers to consume new conversions.
- Remove inline `* 12` usage in touched duct paths.

## Acceptance Criteria

- Duct run workflow has no scattered `* 12` conversion logic.
- Displayed lengths match model lengths.
- Canvas scale is consistent across preview/render/properties.
