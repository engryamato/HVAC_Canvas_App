# Enhance DuctRenderer with Professional Rendering


## Overview

Transform duct rendering from simple filled rectangles to professional double-line representation with insulation hatching, centerlines, and flanges following ASHRAE/SMACNA standards.

## Scope

**In Scope:**
- Replace single-line rendering with double-line using `ProfessionalRenderingHelper`
- Add insulation hatching when `insulated === true`
- Add centerline for round ducts (dash-dot pattern)
- Add flanges/connections at duct endpoints
- Maintain existing airflow arrows and size labels
- Integrate with `CanvasPerformanceService` for adaptive rendering
- Enhanced selection highlighting (both lines highlighted)
- Visual regression tests

**Out of Scope:**
- Tool preview integration (separate ticket)
- Schema changes (separate ticket)
- Equipment or fitting rendering

## Spec References

- `spec:c42960f7-7816-4adf-8ef1-426a4646422e/3b890b83-0a21-447a-be3b-6d51afa86814` - Tech Plan: Component Architecture, DuctRenderer Enhancement
- `spec:c42960f7-7816-4adf-8ef1-426a4646422e/0ee283f6-99b4-482d-8da8-b11e621920c5` - Core Flows: Flow 1 (Drawing New Ducts), Flow 5 (Selecting Entities)

## Key Implementation Details

**Rendering Logic:**
- Use `helper.drawDoubleLine()` for main duct body
- Check `duct.props.insulated` to conditionally render hatching
- Use `duct.props.insulationThickness` for hatching density
- Query `performanceService.getPerformanceHints()` to adapt detail level
- Maintain service color coding for supply/return/exhaust

**Selection Enhancement:**
- When `isSelected === true`, highlight both top and bottom lines
- Use blue (#1976D2) for selection color
- Keep hatching visible through selection

## Acceptance Criteria

- [ ] Ducts render with double-line representation (two parallel strokes)
- [ ] Round ducts show centerline with dash-dot pattern
- [ ] Rectangular ducts show proper width-based spacing
- [ ] Insulated ducts show diagonal hatching pattern
- [ ] Insulation thickness affects hatching density
- [ ] Flanges appear at duct start and end points
- [ ] Airflow arrows and labels remain functional
- [ ] Service colors (supply/return/exhaust) are preserved
- [ ] Selection highlights both lines in blue
- [ ] Performance mode simplifies hatching when FPS drops
- [ ] Visual regression tests pass for all duct types
- [ ] Existing duct entities render correctly (backward compatible)

## Dependencies

- Ticket: "Implement Professional Rendering Foundation" must be completed

## Files to Modify

- `hvac-design-app/src/features/canvas/renderers/DuctRenderer.ts`
