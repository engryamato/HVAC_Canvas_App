# Phase 4.1: Enhanced Cost Calculation with Multiple Estimation Methods


## Overview

Enhance existing `costCalculationService` to support multiple estimation methods (unit cost, assembly cost, parametric cost) for professional-grade estimation.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/f52310a1-13a5-4d6f-b482-f30544acdb43` (Tech Plan - Decision 5)
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 3: Real-Time Cost Estimation)

## Scope

**In Scope**:
- Keep existing unit cost method (material cost per unit)
- Add assembly cost method (grouped components with labor efficiency)
- Add parametric cost method (cost based on size, complexity, location)
- Method selection in calculation settings
- Cost breakdown display (material, labor, markup breakdown per item)
- Integration with existing BOM generation

**Out of Scope**:
- BOM UI enhancements (handled in Phase 4.2)
- Export functionality (handled in Phase 4.3)

## Key Files

**Modify**:
- `file:hvac-design-app/src/core/services/cost/costCalculationService.ts` - Add new methods

**Create**:
- `file:hvac-design-app/src/core/services/cost/assemblyCostCalculator.ts`
- `file:hvac-design-app/src/core/services/cost/parametricCostCalculator.ts`
- `file:hvac-design-app/src/core/schema/assembly.schema.ts` - Assembly definition

## Acceptance Criteria

- [ ] Unit cost method works (existing functionality preserved)
- [ ] Assembly cost method calculates grouped component costs with labor efficiency
- [ ] Parametric cost method applies size/complexity/location multipliers
- [ ] Estimation method selectable in calculation settings
- [ ] Cost breakdown shows material, labor, markup separately
- [ ] Integration with useBOM hook for real-time updates
- [ ] Performance: Calculate costs for 1000 items in < 200ms
- [ ] Unit tests for all calculation methods
- [ ] Validation: Assembly cost ≤ sum of unit costs (efficiency factor)

## Dependencies

- **Requires**: Phase 1.3 (calculation settings with estimation method)
- **Requires**: Phase 1.1 (component library with pricing data)

## Technical Notes

**Estimation Methods**:
- **Unit Cost**: `quantity × unitCost + (quantity × laborUnits × laborRate)`
- **Assembly Cost**: `sum(component costs) × laborEfficiency`
- **Parametric Cost**: `quantity × baseRate × sizeMultiplier × complexityMultiplier × locationFactor`

**Use Cases**:
- Unit: Standard projects, simple components
- Assembly: Complex installations, grouped work
- Parametric: Conceptual estimates, early budgeting
