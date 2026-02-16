# Phase 2.3: Validation Store and Dashboard Integration


## Overview

Create validation store for ephemeral UI state (dashboard, filters, aggregation) that reads from persisted `entity.warnings` as single source of truth.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/f52310a1-13a5-4d6f-b482-f30544acdb43` (Tech Plan - Decision 3)
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 12: Design Validation and Error Resolution)

## Scope

**In Scope**:
- ValidationStore with summary, filters, selected issue state
- refreshSummary() action that reads from entity.warnings
- Aggregation logic (count errors, warnings, info by severity)
- Filter and sort validation issues
- Integration with existing ConstraintValidationService

**Out of Scope**:
- Validation Dashboard UI (handled in Phase 5.2)
- Changing entity.warnings structure (keep existing)
- New validation rules (use existing)

## Key Files

**Create**:
- `file:hvac-design-app/src/core/store/validationStore.ts`
- `file:hvac-design-app/src/core/services/validation/validationAggregationService.ts` - Enhanced aggregation

**Reference**:
- `file:hvac-design-app/src/core/schema/duct.schema.ts` (entity.warnings)
- `file:hvac-design-app/src/core/services/constraintValidation.ts` (existing)

## Acceptance Criteria

- [ ] ValidationStore maintains summary (error/warning/info counts)
- [ ] refreshSummary() reads from all entity.warnings and aggregates
- [ ] Store supports filtering by severity, category, entity type
- [ ] Store tracks selected issue for navigation
- [ ] Store is read-only view of entity.warnings (no direct mutation)
- [ ] Store rebuilds on project load from entity.warnings
- [ ] Performance: Aggregate 1000 entities in < 100ms
- [ ] Unit tests for aggregation and filtering

## Dependencies

- **Requires**: Phase 1.2 (entity.warnings in schemas)
- **Requires**: Phase 2.2 (parametric updates generate validation issues)

## Technical Notes

**Data Flow**:
```
entity.warnings (persisted) → ValidationStore.refreshSummary() → Aggregated UI state
                                                                ↓
                                                          Dashboard displays
```

**Store Structure**:
```typescript
interface ValidationStore {
  summary: { errors: number; warnings: number; info: number };
  filters: { severity: ValidationSeverity[]; category: string[] };
  selectedIssueId: string | null;
  refreshSummary: () => void;
  setFilters: (filters: Filters) => void;
  selectIssue: (id: string) => void;
}
```
