# Enhance EquipmentRenderer with 3D Appearance


## Overview

Enhance equipment rendering with professional 3D appearance including shadows, depth effects, and improved ASHRAE-compliant symbols.

## Scope

**In Scope:**
- Add shadow/depth effects for 3D appearance
- Enhance type-specific symbols to follow ASHRAE standards:
  - AHU: "X" marking with coil representation
  - Fan: Circle with blade symbols
  - Diffuser: Grid pattern
  - Damper: Blade representation
  - Hood: Exhaust arrow
- Professional border styling
- Integrate with `CanvasPerformanceService` (disable shadows in performance mode)
- Maintain existing color coding by equipment type
- Selection highlighting

**Out of Scope:**
- Tool preview integration (separate ticket)
- Schema changes (separate ticket)
- New equipment types

## Spec References

- `spec:c42960f7-7816-4adf-8ef1-426a4646422e/3b890b83-0a21-447a-be3b-6d51afa86814` - Tech Plan: Component Architecture, EquipmentRenderer Enhancement
- `spec:c42960f7-7816-4adf-8ef1-426a4646422e/0ee283f6-99b4-482d-8da8-b11e621920c5` - Core Flows: Flow 2 (Placing Equipment)

## Key Implementation Details

**3D Appearance:**
- Use `ctx.shadowColor`, `ctx.shadowBlur`, `ctx.shadowOffsetX/Y` for depth
- Shadow parameters: `rgba(0, 0, 0, 0.3)`, blur `10/zoom`, offset `5/zoom`
- Disable shadows when `performanceHints.enableShadows === false`

**Symbol Enhancement:**
- Use `helper.drawEquipmentSymbol()` for standardized symbols
- Ensure symbols are clear at all zoom levels
- Maintain existing icon rendering functions but enhance quality

## Acceptance Criteria

- [ ] Equipment renders with shadow/depth effects
- [ ] Shadows create 3D appearance (offset and blur)
- [ ] All equipment types have enhanced ASHRAE-compliant symbols
- [ ] Symbols are clear and recognizable at all zoom levels
- [ ] Professional border styling applied
- [ ] Equipment type colors preserved
- [ ] Name labels remain clear and positioned correctly
- [ ] Selection highlighting works correctly
- [ ] Performance mode disables shadows when FPS drops
- [ ] Visual regression tests pass for all equipment types
- [ ] Existing equipment entities render correctly (backward compatible)

## Dependencies

- Ticket: "Implement Professional Rendering Foundation" must be completed

## Files to Modify

- `hvac-design-app/src/features/canvas/renderers/EquipmentRenderer.ts`
