# Phase 1.2: Enhanced Entity Schemas for Parametric Design


## Overview

Enhance existing entity schemas (Duct, Fitting, Equipment) to support parametric design, engineering data, and constraint status while preserving existing `entity.warnings` pattern.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/f52310a1-13a5-4d6f-b482-f30544acdb43` (Tech Plan - Decision 2, 3)
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 2: Parametric Design, Flow 4: Property Editing)

## Scope

**In Scope**:
- Add parametric design fields to entity schemas (systemType, materialSpec, gauge, insulated)
- Add engineeringData object for calculated values (velocity, pressureDrop, friction)
- Add constraintStatus object for validation state
- Keep existing `entity.warnings` for persisted violations
- Update Zod schemas with new fields
- Ensure backward compatibility with existing entities

**Out of Scope**:
- Calculation logic (handled in Phase 2)
- UI for editing new fields (handled in Phase 2)
- Migration of existing entity data (handled in Phase 1.4)

## Key Files

**Modify**:
- `file:hvac-design-app/src/core/schema/duct.schema.ts` - Add parametric fields
- `file:hvac-design-app/src/core/schema/fitting.schema.ts` - Add parametric fields
- `file:hvac-design-app/src/core/schema/equipment.schema.ts` - Add parametric fields
- `file:hvac-design-app/src/core/schema/base.schema.ts` - Add common parametric types

**Create**:
- `file:hvac-design-app/src/core/schema/engineering-data.schema.ts` - EngineeringData type
- `file:hvac-design-app/src/core/schema/constraint-status.schema.ts` - ConstraintStatus type

## Acceptance Criteria

- [ ] All entity schemas include optional parametric design fields
- [ ] EngineeringData schema includes velocity, pressureDrop, friction, equivalentDiameter
- [ ] ConstraintStatus schema includes isValid, violations[], lastValidated
- [ ] Existing entity.warnings preserved and working
- [ ] Schemas validate correctly with Zod
- [ ] Backward compatible: old entities without new fields still validate
- [ ] Type exports available for use in services and components

## Dependencies

None - Can be done in parallel with Phase 1.1

## Technical Notes

**Enhanced Duct Schema**:
```typescript
export const DuctPropsSchema = z.object({
  // Existing fields...
  name: z.string(),
  shape: DuctShapeSchema,
  // ... existing dimension fields
  
  // NEW: Parametric design fields
  systemType: SystemTypeSchema.optional(),
  materialSpec: MaterialSpecSchema.optional(),
  gauge: z.number().optional(),
  insulated: z.boolean().optional(),
  insulationThickness: z.number().optional(),
  
  // NEW: Engineering data (calculated)
  engineeringData: DuctEngineeringDataSchema.optional(),
  
  // NEW: Constraint status
  constraintStatus: ConstraintStatusSchema.optional(),
  
  // NEW: Auto-sizing flag
  autoSized: z.boolean().optional(),
});
```
