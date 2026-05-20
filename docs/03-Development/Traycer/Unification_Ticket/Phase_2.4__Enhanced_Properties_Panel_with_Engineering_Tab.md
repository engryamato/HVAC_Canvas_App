# Phase 2.4: Enhanced Properties Panel with Engineering Tab


## Overview

Enhance the Properties panel with tabbed interface (Dimensions, Engineering, Costing) and real-time constraint validation display.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 4: Component Property Editing with Engineering Validation)

## Scope

**In Scope**:
- Tabbed Properties panel UI (Dimensions, Engineering, Costing tabs)
- Engineering tab showing calculated values (velocity, pressure drop, friction)
- Real-time constraint violation display with suggested fixes
- Integration with ParametricUpdateService for dimension changes
- Visual feedback for constraint violations (orange outline on canvas)
- "Apply Suggestion" button for constraint fixes

**Out of Scope**:
- Costing tab implementation (handled in Phase 4.2)
- Bulk edit functionality (handled in Phase 5.3)

## Key Files

**Create**:
- `file:hvac-design-app/src/features/canvas/components/Inspector/EngineeringTab.tsx`
- `file:hvac-design-app/src/features/canvas/components/Inspector/CostingTab.tsx` (placeholder)
- `file:hvac-design-app/src/features/canvas/components/Inspector/ConstraintViolationDisplay.tsx`

**Modify**:
- `file:hvac-design-app/src/features/canvas/components/Inspector/DuctInspector.tsx` - Add tabs
- `file:hvac-design-app/src/features/canvas/components/Inspector/InspectorPanel.tsx` - Tab container

## Acceptance Criteria

- [ ] Properties panel shows three tabs: Dimensions, Engineering, Costing
- [ ] Dimensions tab shows editable fields (width, height, length, material, gauge)
- [ ] Engineering tab shows calculated values (airflow, velocity, pressure drop, friction)
- [ ] Engineering tab shows constraint status (✓ OK or ⚠️ Warning)
- [ ] Constraint violations display with severity, message, suggested fix
- [ ] "Apply Suggestion" button applies fix and clears warning
- [ ] Dimension changes trigger parametric updates via ParametricUpdateService
- [ ] Real-time updates: changing dimension updates Engineering tab immediately
- [ ] Visual feedback: constraint violations show orange outline on canvas
- [ ] Matches wireframe from Flow 4

## Dependencies

- **Requires**: Phase 2.2 (ParametricUpdateService for cascading updates)
- **Requires**: Phase 2.3 (ValidationStore for validation display)

## Technical Notes

**Tab Structure**:
- Use Radix UI Tabs component (existing pattern)
- Dimensions tab: Existing DuctInspector fields
- Engineering tab: Read-only calculated values + constraint display
- Costing tab: Placeholder for Phase 4
