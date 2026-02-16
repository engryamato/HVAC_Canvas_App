# Phase 8: Comprehensive Testing and Documentation


## Overview

Create comprehensive test suite (unit, integration, E2E) and documentation (user guide, API docs, migration guide) for the Unified Engineering Core.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/62b16242-0d14-4b0e-9561-57daf3214aea` (Epic Brief - Success Metrics)

## Scope

**In Scope**:

**Unit Tests**:
- ParametricUpdateService tests
- CostCalculationService tests (all methods)
- ValidationAggregationService tests
- FittingInsertionService tests
- ConnectionGraphBuilder tests
- MigrationService tests
- Target: 80%+ code coverage

**Integration Tests**:
- Component selection → placement → property editing → BOM update
- Duct drawing → automatic fitting insertion → validation
- Dimension change → parametric update → cost recalculation
- Project initialization → template application → export
- Data migration → validation → save

**E2E Tests** (Playwright):
- Complete user journey: New project → design → validate → export
- Migration journey: Open old project → migrate → validate → save
- Bulk operations: Select multiple → bulk edit → verify changes

**Documentation**:
- User guide (getting started, features, workflows)
- API documentation (services, stores, schemas)
- Migration guide (for users upgrading)
- Architecture documentation (for developers)

**Out of Scope**:
- Performance benchmarking (separate effort)
- Load testing (separate effort)

## Key Files

**Create**:
- `file:hvac-design-app/__tests__/services/parametricUpdateService.test.ts`
- `file:hvac-design-app/__tests__/services/costCalculationService.test.ts`
- `file:hvac-design-app/__tests__/services/fittingInsertionService.test.ts`
- `file:hvac-design-app/__tests__/services/connectionGraphBuilder.test.ts`
- `file:hvac-design-app/__tests__/services/migrationService.test.ts`
- `file:hvac-design-app/__tests__/integration/parametric-workflow.test.ts`
- `file:hvac-design-app/__tests__/integration/cost-estimation-workflow.test.ts`
- `file:hvac-design-app/__tests__/integration/migration-workflow.test.ts`
- `file:hvac-design-app/e2e/unified-engineering-core.spec.ts`
- `file:hvac-design-app/docs/user-guide/unified-engineering-core.md`
- `file:hvac-design-app/docs/api/services.md`
- `file:hvac-design-app/docs/migration-guide.md`

## Acceptance Criteria

**Unit Tests**:
- [ ] 80%+ code coverage for all services
- [ ] All calculation functions tested against known values
- [ ] Edge cases tested (zero airflow, extreme dimensions)
- [ ] Error cases tested (invalid input, missing data)

**Integration Tests**:
- [ ] 5 critical workflows tested end-to-end
- [ ] All tests pass consistently
- [ ] Tests run in < 5 minutes

**E2E Tests**:
- [ ] Complete user journey tested (new project → export)
- [ ] Migration journey tested (old project → migrated → saved)
- [ ] Tests run in < 10 minutes

**Documentation**:
- [ ] User guide covers all 15 flows
- [ ] API docs cover all public services and stores
- [ ] Migration guide explains version detection and rollback
- [ ] Architecture docs explain key decisions and trade-offs
- [ ] All docs reviewed and accurate

## Dependencies

- **Requires**: All previous phases (testing the complete system)

## Technical Notes

**Test Strategy**:
- Unit: Jest for services and stores
- Integration: Jest + React Testing Library
- E2E: Playwright for full user journeys

**Documentation Structure**:
- User Guide: Flow-based (how to accomplish tasks)
- API Docs: Reference (what each service does)
- Migration Guide: Step-by-step (how to upgrade)
- Architecture Docs: Decision records (why we built it this way)
