# Phase 2.2: Parametric Update Service (Imperative)


## Overview

Implement parametric update service that cascades dimension changes to connected entities using imperative style (adapted to existing codebase patterns).

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/f52310a1-13a5-4d6f-b482-f30544acdb43` (Tech Plan - Decision 2)
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 2: Parametric Design with Auto-Sizing)

## Scope

**In Scope**:
- ParametricUpdateService with dimension change cascading
- Find connected entities using graph traversal
- Update connected fittings when duct size changes
- Update connected ducts when fitting changes
- Validate affected entities after updates
- Return list of updated entities and validation issues

**Out of Scope**:
- Pure functional approach (rejected in architecture validation)
- Auto-sizing logic (handled in Phase 3.2)
- UI for parametric updates (handled in Phase 2.4)

## Key Files

**Create**:
- `file:hvac-design-app/src/core/services/parametrics/ParametricUpdateService.ts`
- `file:hvac-design-app/src/core/services/parametrics/types.ts`

**Reference**:
- `file:hvac-design-app/src/core/services/graph/ConnectionGraphBuilder.ts` (from Phase 2.1)
- `file:hvac-design-app/src/core/services/constraintValidation.ts` (existing)
- `file:hvac-design-app/src/core/store/entityStore.ts` (existing)

## Acceptance Criteria

- [ ] applyDimensionChange() updates target entity and cascades to connected entities
- [ ] Changing duct width updates connected fittings to match
- [ ] Changing fitting size updates connected ducts (if needed)
- [ ] Validation runs on all affected entities
- [ ] Returns list of updated entity IDs and validation issues
- [ ] Service is stateless (accepts entities as parameters)
- [ ] Handles circular connections gracefully (no infinite loops)
- [ ] Performance: Update 10 connected entities in < 50ms
- [ ] Unit tests for cascading updates and validation

## Dependencies

- **Requires**: Phase 2.1 (connection graph system)
- **Requires**: Phase 1.2 (enhanced entity schemas)

## Technical Notes

**Update Algorithm**:
1. Update target entity dimension
2. Build connection graph
3. Get affected entities (within 2 hops)
4. For each affected entity:
   - Determine required update (e.g., fitting must match duct size)
   - Apply update to entity
5. Validate all affected entities
6. Return updated IDs + validation issues
