# Phase 7.1: Enhanced Undo/Redo for Parametric Changes


## Overview

Enhance undo/redo system to support parametric changes that affect multiple entities, with clear undo descriptions showing scope.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Error Handling: Undo/Redo with Parametric Changes)

## Scope

**In Scope**:
- Undo/redo for parametric operations (dimension change + cascading updates)
- Undo description shows scope: "Resize Duct A (affected 3 components)"
- Undo reverts all affected entities atomically
- Undo stack persists across save/load
- Undo limit: 50 operations (configurable)
- Undo for bulk operations

**Out of Scope**:
- Redo branching (linear undo/redo only)
- Undo visualization (future enhancement)

## Key Files

**Modify**:
- `file:hvac-design-app/src/core/store/historyStore.ts` - Enhance for parametric changes

**Create**:
- `file:hvac-design-app/src/core/services/history/ParametricHistoryEntry.ts` - History entry type

## Acceptance Criteria

- [ ] Undo parametric change reverts all affected entities
- [ ] Undo description: "Resize Duct A (and 2 connected components)"
- [ ] Redo reapplies all changes
- [ ] Undo stack persists across save/load
- [ ] Undo limit: 50 operations (oldest removed when exceeded)
- [ ] Undo for bulk operations: "Undo: Bulk material change (45 ducts)"
- [ ] Ctrl+Z triggers undo, Ctrl+Y triggers redo
- [ ] Undo menu shows operation descriptions
- [ ] Performance: Undo 100-entity change in < 50ms

## Dependencies

- **Requires**: Phase 2.2 (parametric updates to track affected entities)
- **Requires**: Phase 5.3 (bulk operations to support bulk undo)

## Technical Notes

**Parametric History Entry**:
```typescript
interface ParametricHistoryEntry {
  type: 'parametric-update';
  description: string;
  affectedEntityIds: string[];
  changes: Map<string, EntitySnapshot="">; // entityId → before state
}
```

**Undo Flow**:
1. User presses Ctrl+Z
2. historyStore pops last entry
3. For each affected entity, restore previous state
4. Trigger re-render
</string,>