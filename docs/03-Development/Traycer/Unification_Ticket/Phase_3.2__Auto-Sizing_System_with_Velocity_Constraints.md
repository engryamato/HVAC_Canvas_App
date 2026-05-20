# Phase 3.2: Auto-Sizing System with Velocity Constraints


## Overview

Implement automatic duct sizing based on airflow and velocity constraints, integrated with parametric update system.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 2: Parametric Design with Auto-Sizing)

## Scope

**In Scope**:
- Auto-sizing algorithm (calculate required duct size from airflow + max velocity)
- Integration with ParametricUpdateService
- Support for round and rectangular ducts
- Standard size selection (use ASHRAE standard sizes)
- Auto-sized flag on entities
- User can override auto-sizing

**Out of Scope**:
- Auto-sizing UI controls (handled in Phase 5)
- Pressure drop optimization (future enhancement)

## Key Files

**Create**:
- `file:hvac-design-app/src/core/services/automation/autoSizing.ts`

**Reference**:
- `file:hvac-design-app/src/core/services/engineeringCalculations.ts` (existing, has suggestDuctSize)
- `file:hvac-design-app/src/core/services/parametrics/ParametricUpdateService.ts` (from Phase 2.2)

## Acceptance Criteria

- [ ] calculateRequiredSize() returns duct size based on airflow and max velocity
- [ ] Selects nearest standard size from ASHRAE sizes
- [ ] Supports round ducts (diameter) and rectangular ducts (width x height)
- [ ] Sets autoSized flag on entity when auto-sizing applied
- [ ] Integration: User sets airflow → system suggests size → user accepts/rejects
- [ ] Respects engineering limits from calculation settings
- [ ] Unit tests for sizing calculations
- [ ] Integration test: Set airflow 1200 CFM, max velocity 2000 fpm → suggests 12" round duct

## Dependencies

- **Requires**: Phase 2.2 (ParametricUpdateService for applying size changes)
- **Requires**: Phase 1.3 (Calculation settings for velocity limits)

## Technical Notes

**Sizing Algorithm**:
```typescript
function calculateRequiredSize(
  airflowCfm: number,
  maxVelocityFpm: number,
  shape: 'round' | 'rectangular'
): DuctSize {
  const requiredArea = airflowCfm / maxVelocityFpm; // sq ft
  
  if (shape === 'round') {
    const diameter = Math.sqrt((4 * requiredArea * 144) / Math.PI);
    return selectStandardRoundSize(diameter);
  } else {
    return selectStandardRectangularSize(requiredArea);
  }
}
```
