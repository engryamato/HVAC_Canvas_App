# Create FittingRenderer with Parametric Geometry


## Overview

Create a new renderer for fitting entities with accurate parametric geometry following ASHRAE/SMACNA standards. Fittings (elbows, tees, reducers, caps) currently have no dedicated renderer.

## Scope

**In Scope:**
- Create `FittingRenderer` with parametric geometry calculations
- Implement accurate geometry for all fitting types:
  - **Elbows (90°, 45°):** Curved arcs with radius = 1.5× duct width
  - **Tees:** Branch connections (top/side/bottom) with proper angles
  - **Reducers:** Tapered transitions showing size change
  - **Caps:** End termination symbols
- Calculate geometry based on connected duct dimensions
- Double-line consistency with connected ducts
- Integrate with `CanvasPerformanceService` for adaptive rendering
- Selection highlighting
- Export renderer from index

**Out of Scope:**
- Tool preview integration (separate ticket)
- Automatic fitting insertion logic (existing functionality)
- Schema changes (separate ticket)

## Spec References

- `spec:c42960f7-7816-4adf-8ef1-426a4646422e/3b890b83-0a21-447a-be3b-6d51afa86814` - Tech Plan: Component Architecture, FittingRenderer section
- `spec:c42960f7-7816-4adf-8ef1-426a4646422e/0ee283f6-99b4-482d-8da8-b11e621920c5` - Core Flows: Flow 3 (Placing Fittings)

## Key Implementation Details

**Parametric Geometry:**
- Query connected ducts via `inletDuctId` and `outletDuctId`
- Calculate fitting dimensions based on duct width/diameter
- Use ASHRAE standard ratios (e.g., elbow radius = 1.5× width)
- Handle missing connections gracefully (use default dimensions)

**Rendering:**
- Use `helper.drawElbow()`, `helper.drawTee()`, `helper.drawReducer()` from foundation
- Maintain double-line representation
- Show fitting type label
- Apply service color if available

## Acceptance Criteria

- [ ] `FittingRenderer` created following existing renderer pattern
- [ ] Elbows render with accurate curved geometry (radius = 1.5× width)
- [ ] Tees render with proper branch connections (top/side/bottom)
- [ ] Reducers show tapered transition between different duct sizes
- [ ] Caps show end termination symbols
- [ ] Geometry adapts to connected duct dimensions
- [ ] Double-line rendering consistent with ducts
- [ ] Selection highlighting works correctly
- [ ] Performance mode simplifies geometry when needed
- [ ] Fitting type labels are clear and readable
- [ ] Renderer exported from `renderers/index.ts`
- [ ] Visual regression tests for all fitting types

## Dependencies

- Ticket: "Implement Professional Rendering Foundation" must be completed

## Files to Create

- `hvac-design-app/src/features/canvas/renderers/FittingRenderer.ts`

## Files to Modify

- `hvac-design-app/src/features/canvas/renderers/index.ts` (add export)
