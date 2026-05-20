# Integrate Tool Previews with Professional Rendering


## Overview

Update all drawing tools (DuctTool, EquipmentTool, FittingTool) to use entity renderers for preview, ensuring WYSIWYG (What You See Is What You Get) consistency between preview and final rendering.

## Scope

**In Scope:**
- Modify `DuctTool.render()` to create preview entity and call `renderDuct()`
- Modify `EquipmentTool.render()` to create preview entity and call `renderEquipment()`
- Modify `FittingTool.render()` to create preview entity and call `renderFitting()`
- Ensure preview entities have all necessary properties for professional rendering
- Maintain existing preview behavior (dashed outline, transparency)
- Add visual distinction for "not yet placed" state
- Update tool tests

**Out of Scope:**
- Changes to renderer logic (already completed in previous tickets)
- Schema changes (separate ticket)
- New tool functionality

## Spec References

- `spec:c42960f7-7816-4adf-8ef1-426a4646422e/3b890b83-0a21-447a-be3b-6d51afa86814` - Tech Plan: WYSIWYG Preview Architecture, Tool Integration
- `spec:c42960f7-7816-4adf-8ef1-426a4646422e/0ee283f6-99b4-482d-8da8-b11e621920c5` - Core Flows: Flow 1, 2, 3 (Drawing/Placing)

## Key Implementation Details

**Preview Entity Creation:**
- Tools create lightweight entity objects with necessary properties
- Include `insulated`, `insulationThickness` for ducts
- Include `equipmentType` for equipment
- Include `fittingType` for fittings

**Renderer Integration:**
- Call entity renderer functions: `renderDuct()`, `renderEquipment()`, `renderFitting()`
- Pass `RenderContext` with `isSelected: false`, `isHovered: false`
- Apply preview styling (semi-transparent, dashed outline) via context manipulation

**WYSIWYG Guarantee:**
- Preview must visually match final rendering exactly
- Same double-lines, hatching, symbols as final entities
- Only difference: preview styling (transparency/dashed outline)

## Acceptance Criteria

- [ ] `DuctTool` preview shows professional double-line rendering
- [ ] `DuctTool` preview shows insulation hatching if applicable
- [ ] `EquipmentTool` preview shows 3D appearance and symbols
- [ ] `FittingTool` preview shows accurate parametric geometry
- [ ] Preview visually matches final rendering (WYSIWYG)
- [ ] Preview has visual distinction (semi-transparent or dashed outline)
- [ ] All existing tool functionality preserved
- [ ] Preview updates smoothly during mouse movement
- [ ] No performance degradation during preview
- [ ] Tool tests updated and passing

## Dependencies

- Ticket: "Enhance DuctRenderer with Professional Rendering" must be completed
- Ticket: "Create FittingRenderer with Parametric Geometry" must be completed
- Ticket: "Enhance EquipmentRenderer with 3D Appearance" must be completed

## Files to Modify

- `hvac-design-app/src/features/canvas/tools/DuctTool.ts`
- `hvac-design-app/src/features/canvas/tools/EquipmentTool.ts`
- `hvac-design-app/src/features/canvas/tools/FittingTool.ts`
