# Phase 5.3: Bulk Operations with Preview and Undo


## Overview

Implement bulk edit functionality for changing material, resizing, or deleting multiple components simultaneously with preview and undo support.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 11: Bulk Component Operations)

## Scope

**In Scope**:
- Bulk Edit dialog UI
- Multi-select on canvas (Shift+Click, Ctrl+Click, drag-select)
- Bulk operations: Change material, resize, delete, apply system template
- Preview before apply (show affected count, cost impact)
- Undo support for bulk operations
- Orphaned fitting detection on bulk delete

**Out of Scope**:
- System template application (handled in Phase 5.5)
- Advanced filtering (handled in Phase 4.2)

## Key Files

**Create**:
- `file:hvac-design-app/src/features/canvas/components/BulkEditDialog.tsx`
- `file:hvac-design-app/src/features/canvas/components/BulkOperationPreview.tsx`
- `file:hvac-design-app/src/core/services/bulkOperations.ts` - Bulk operation logic

**Modify**:
- `file:hvac-design-app/src/features/canvas/store/selectionStore.ts` - Multi-select support
- `file:hvac-design-app/src/core/store/historyStore.ts` - Bulk operation undo

## Acceptance Criteria

- [ ] Multi-select: Shift+Click selects range, Ctrl+Click toggles individual
- [ ] Drag-select: Drag rectangle selects all entities within
- [ ] Right-click selected entities → "Bulk Edit Properties" menu item
- [ ] Bulk Edit dialog shows: "Editing 8 ducts"
- [ ] Change material dropdown updates all selected entities
- [ ] Preview shows: "8 ducts will update. Cost impact: +$145"
- [ ] "Apply Changes" button applies bulk operation
- [ ] Success notification: "8 ducts updated to Stainless Steel 304"
- [ ] Undo available: "Undo: Bulk material change"
- [ ] Bulk delete shows confirmation: "Delete 15 items? Cost impact: -$1,250"
- [ ] Orphaned fitting detection: "3 fittings no longer connected. Delete them too?"
- [ ] Matches flow scenarios from Flow 11

## Dependencies

- **Requires**: Phase 2.2 (parametric updates for cascading changes)
- **Requires**: Phase 4.1 (cost calculation for impact preview)

## Technical Notes

**Bulk Operation Flow**:
1. User selects multiple entities
2. User chooses bulk operation
3. Preview calculates impact
4. User confirms
5. Service applies changes to all entities
6. History stores bulk operation for undo
7. BOM updates
