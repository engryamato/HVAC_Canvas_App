# Phase 1.3: Calculation Settings System with Templates


## Overview

Implement comprehensive calculation settings system with support for labor rates, markup, waste factors, engineering limits, and reusable templates.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/f52310a1-13a5-4d6f-b482-f30544acdb43` (Tech Plan - Decision 6)
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 7: Calculation Settings Configuration)

## Scope

**In Scope**:
- Create CalculationSettings schema with all setting categories
- Enhance settingsStore to support templates
- Implement template CRUD operations
- Add default templates ("Commercial Standard", "Residential Budget", "Industrial Heavy")
- Support estimation method selection (unit, assembly, parametric)

**Out of Scope**:
- UI for settings dialog (handled in Phase 5)
- Cost calculation logic using settings (handled in Phase 4)
- Project-level settings persistence (handled in Phase 5)

## Key Files

**Create**:
- `file:hvac-design-app/src/core/schema/calculation-settings.schema.ts` - Enhanced settings schema
- `file:hvac-design-app/src/core/schema/settings-template.schema.ts` - Template schema

**Modify**:
- `file:hvac-design-app/src/core/store/settingsStore.ts` - Add template support

## Acceptance Criteria

- [ ] CalculationSettings schema includes laborRates, markup, wasteFactors, engineeringLimits
- [ ] Settings schema includes estimationMethod field (unit, assembly, parametric)
- [ ] SettingsStore supports template CRUD (add, update, delete, list)
- [ ] Default templates pre-loaded with realistic values
- [ ] Template selection updates all settings atomically
- [ ] Settings can be exported/imported as JSON
- [ ] Unit tests for settings validation and template operations

## Dependencies

None - Can be done in parallel with Phase 1.1 and 1.2

## Technical Notes

**Settings Schema Structure**:
```typescript
interface CalculationSettings {
  laborRates: {
    baseRate: number;
    overtimeMultiplier: number;
    regionalAdjustment: number;
  };
  markup: {
    material: number;
    labor: number;
    overhead: number;
  };
  wasteFactors: {
    ducts: number;
    fittings: number;
    equipment: number;
    accessories: number;
    default: number;
  };
  engineeringLimits: EngineeringLimits;
  estimationMethod: 'unit' | 'assembly' | 'parametric';
}
```
