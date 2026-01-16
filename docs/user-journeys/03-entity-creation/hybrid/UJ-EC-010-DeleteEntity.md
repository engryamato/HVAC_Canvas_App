# [UJ-EC-010] Delete Entity

## Overview

This user journey covers deleting selected entities from the canvas, including single and bulk deletion, connection cleanup, confirmation dialogs, and undo support for entity restoration.

## PRD References

- **FR-EC-010**: User shall be able to delete selected entities
- **US-EC-010**: As a designer, I want to delete entities so that I can remove mistakes or unwanted elements
- **AC-EC-010-001**: Delete key removes selected entities
- **AC-EC-010-002**: Confirmation dialog appears for bulk deletes (>5 entities)
- **AC-EC-010-003**: Connected entities handle deletion gracefully (orphaned connections removed)
- **AC-EC-010-004**: Deleted entities can be restored with undo
- **AC-EC-010-005**: Right-click context menu provides delete option
- **AC-EC-010-006**: Delete clears selection after operation

## Prerequisites

- User is in Canvas Editor with Select tool active
- At least one entity exists and is selected
- Entities are not locked (or lock can be overridden)
- Sufficient permissions to delete entities

## User Journey Steps

### Step 1: Select Entity to Delete

**User Action**: Select Room A (single entity selection)

**Expected Result**:
- Room A selected
- Selection state:
  - `selectedIds`: ['room-a']
  - Selection count: 1
  - Entity type: Room
- Visual feedback:
  - Blue selection outline on Room A
  - Resize handles visible
  - Selection bounding box
- Inspector panel:
  - Shows Room A properties
  - Delete button visible (red, bottom of panel)
- Delete options available:
  - Keyboard: Delete or Backspace key
  - Menu: Edit → Delete
  - Context menu: Right-click → Delete
  - Inspector: Delete button
- Entity details:
  - Room A has 2 connected ducts (supply and return)
  - Room size: 200×150
  - Position: (100, 100)

**Validation Method**: E2E test - Verify entity selection before delete

---

### Step 2: Trigger Delete Operation

**User Action**: Press Delete key

**Expected Result**:
- Delete command triggered
- Pre-delete validation:
  - Check selection not empty: `selectedIds.length > 0`
  - Check entities exist in store
  - Check deletion allowed (not locked, not protected)
- Single entity deletion (no confirmation needed):
  - Count = 1 entity, threshold = 5
  - Skip confirmation dialog
  - Proceed directly to deletion
- Delete operation prepared:
  - Entity ID collected: 'room-a'
  - Connected entities identified: 2 ducts
  - Command created: `DeleteEntityCommand`
- Status bar: "Deleting 1 entity..."
- Visual feedback: Brief highlight on entity being deleted

**Validation Method**: Unit test - Verify delete command triggered on key press

---

### Step 3: Remove Entity from Store

**User Action**: (Automatic)

**Expected Result**:
- Entity removed from entity store:
  - `entityStore.removeEntity('room-a')`
  - Entity removed from `byId` object
  - Entity ID removed from `allIds` array
  - Entity count decremented
- Entity data preserved in delete command:
  - Full entity object stored for undo:
    ```
    {
      id: 'room-a',
      type: 'room',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      props: { name: "Office", color: "#E0E0E0", ... }
    }
    ```
- Connection cleanup:
  - Find all connections involving 'room-a'
  - 2 ducts connected (supply and return)
  - Options for orphaned ducts:
    - **Option A (Delete)**: Delete connected ducts automatically
    - **Option B (Orphan)**: Leave ducts, mark as disconnected
    - **Option C (Prompt)**: Ask user what to do
  - Default: Option B (orphan) for flexibility
- Canvas immediately updates:
  - Room A disappears from canvas
  - Orphaned ducts remain but show warning indicator
  - Canvas re-renders affected area
- Performance: Single store transaction for all changes

**Validation Method**: Integration test - Verify entity removed from store

---

### Step 4: Handle Connected Entities

**User Action**: (Automatic - connection cleanup)

**Expected Result**:
- Connection system processes deletion:
  - Identify affected connections:
    - Supply duct: `{from: 'rtu-1', to: 'room-a'}` (broken)
    - Return duct: `{from: 'room-a', to: 'rtu-1'}` (broken)
  - Update connection metadata
- Orphaned duct handling:
  - Ducts remain on canvas
  - Connection references cleared:
    - Supply duct: `to: null` (was 'room-a')
    - Return duct: `from: null` (was 'room-a')
  - Visual indicators added:
    - Ducts outlined in yellow (warning)
    - Warning icon at disconnected endpoint
    - Tooltip: "Not connected to any entity"
- Design validation updated:
  - Orphaned ducts flagged in validation report
  - Warning: "2 ducts not connected to rooms"
  - User can reconnect or delete manually
- Alternative: Auto-delete connected entities
  - If setting enabled: "Delete connected entities"
  - Both ducts also deleted
  - Cleaner result but less flexible
  - User must confirm in settings

**Validation Method**: Integration test - Verify connection cleanup

---

### Step 5: Clear Selection and Update UI

**User Action**: (Automatic)

**Expected Result**:
- Selection automatically cleared:
  - `selectedIds = []`
  - Deleted entity cannot remain selected (doesn't exist)
  - Selection count: 0
- Visual updates:
  - Selection highlight removed
  - Resize handles hidden
  - Canvas shows remaining entities only
- Inspector panel:
  - Clears to empty state
  - Placeholder: "Select an entity to edit properties"
  - Delete button no longer visible
- Undo/redo state:
  - Delete command added to history stack:
    - `DeleteEntityCommand` with entity data
    - Can undo to restore entity
  - Undo button enabled: "Undo Delete Room"
  - Redo stack cleared (new action)
- Status bar confirmation:
  - "Deleted 1 entity" (brief, 2 seconds)
  - Or: "Deleted: Room A"
- Toast notification (optional):
  - "Room deleted" with undo button
  - Click undo in toast to restore immediately
  - Auto-dismiss after 5 seconds

**Validation Method**: E2E test - Verify UI updates after delete

---

## Edge Cases

### 1. Bulk Delete with Confirmation

**User Action**: Select 10 rooms, press Delete key

**Expected Behavior**:
- Bulk deletion detected:
  - Selection count: 10 entities
  - Threshold: 5 entities (configurable)
  - Confirmation required
- Confirmation dialog appears:
  - **Title**: "Delete 10 Entities?"
  - **Message**: "Are you sure you want to delete 10 entities? This action can be undone."
  - **Details**: List of entities being deleted
    - "Room A, Room B, Room C, ..." (first 5 shown)
    - "+ 5 more"
  - **Checkboxes** (optional):
    - ☐ "Also delete connected ducts (15 ducts)"
    - ☐ "Don't ask again for this session"
  - **Buttons**:
    - "Delete" (destructive, red)
    - "Cancel" (default on Escape)
- If user confirms:
  - All 10 entities deleted
  - Single grouped delete command
  - One undo restores all 10
- If user cancels:
  - No entities deleted
  - Selection maintained
  - Return to canvas

**Validation Method**: E2E test - Verify bulk delete confirmation

---

### 2. Delete with Ctrl+X (Cut)

**User Action**: Select entity, press Ctrl+X (cut)

**Expected Behavior**:
- Cut operation combines copy + delete:
  - Entity copied to clipboard (same as Ctrl+C)
  - Entity deleted from canvas
  - Can be pasted elsewhere with Ctrl+V
- Clipboard contains:
  - Full entity data
  - Same format as copy operation
- Delete occurs immediately:
  - No confirmation dialog (cut is intentional)
  - Entity removed from canvas
  - Can undo to restore
- Paste available:
  - Ctrl+V creates new copy at cursor/offset
  - Original entity remains deleted
  - New ID generated for pasted entity
- Useful for moving entities between projects:
  - Cut from Project A
  - Switch to Project B
  - Paste

**Validation Method**: Integration test - Verify cut operation

---

### 3. Delete Last Entity on Canvas

**User Action**: Delete only remaining entity (canvas becomes empty)

**Expected Behavior**:
- Single entity on canvas
- Delete operation proceeds normally
- Result: Empty canvas
  - No entities in `allIds` array
  - Entity count: 0
  - Canvas shows blank workspace
- Valid state (not an error):
  - User can start fresh
  - Create new entities
  - Or load/import entities
- Visual feedback:
  - Empty state message (optional):
    - "Canvas is empty"
    - "Press R to create a room"
    - Helpful hints for beginners
- Undo available:
  - Undo restores deleted entity
  - Canvas no longer empty

**Validation Method**: Unit test - Verify empty canvas state handling

---

### 4. Delete Entity During Active Tool

**User Action**: While drawing duct, press Delete to cancel

**Expected Behavior**:
- Active tool: Duct tool (mid-drawing)
- Delete key pressed
- Two possible interpretations:
  - **Option A (Cancel Draw)**: Cancel current draw operation
    - Partial duct discarded
    - Return to ready state
    - Delete key = cancel action
  - **Option B (Delete Selected)**: Delete any selected entities
    - Complete/cancel draw first
    - Then delete selection
- Default: Option A (cancel active operation)
- Context-sensitive Delete key:
  - Drawing mode: Cancel draw
  - Edit mode: Delete selection
  - Pan mode: No action

**Validation Method**: Integration test - Verify Delete key behavior by context

---

### 5. Delete with Orphaned Notes

**User Action**: Delete room that has note attached

**Expected Behavior**:
- Room has note attached via attachment system
- Note references room: `attachedTo: 'room-a'`
- Room deleted
- Note attachment handling:
  - Attachment reference cleared: `attachedTo: null`
  - Note becomes freestanding
  - Leader line (connection) removed
  - Note remains at current position
- Note not deleted automatically:
  - Notes are independent entities
  - User may want to keep notes
  - Can manually delete note if unwanted
- Visual indicator:
  - Note border changes to indicate freestanding
  - No leader line shown
- Undo room deletion:
  - Room restored
  - Attachment re-established
  - Leader line reappears

**Validation Method**: Integration test - Verify note attachment handling

---

## Error Scenarios

### 1. Delete Protected Entity

**Scenario**: User attempts to delete entity marked as protected/locked

**Expected Handling**:
- Delete operation triggered
- Protection check: `entity.protected === true`
- Delete blocked
- Error dialog:
  - **Title**: "Cannot Delete Protected Entity"
  - **Message**: "Room A is protected and cannot be deleted."
  - **Options**:
    - "Unlock and Delete" (if user has permission)
    - "Cancel"
- If user unlocks:
  - Protection removed
  - Delete proceeds normally
- If user cancels:
  - Entity remains protected
  - No deletion
- Status bar: "Protected entity cannot be deleted"

**Validation Method**: Unit test - Verify protected entity deletion prevented

---

### 2. Delete During Background Operation

**Scenario**: User deletes entity while auto-save is writing file

**Expected Handling**:
- Delete operation independent of save
- Entity removed from in-memory store
- Auto-save may or may not include deletion:
  - If save started before delete: Entity in saved file
  - If save snapshots after delete: Entity not in saved file
- No conflict between operations
- Both complete successfully
- Next auto-save captures deleted state
- User can undo to restore entity

**Validation Method**: Integration test - Verify delete during background tasks

---

### 3. Delete Command Execution Failure

**Scenario**: Entity removal from store throws error

**Expected Handling**:
- Delete command executed
- Store operation fails (rare)
- Error caught
- Rollback to previous state:
  - Entity not removed
  - Selection maintained
  - Canvas unchanged
- Error dialog:
  - "Cannot delete entity. Please try again."
  - Technical details in console
- Error logged for debugging
- User can retry delete
- No partial deletion (atomic operation)

**Validation Method**: Unit test - Verify delete error handling

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Delete Selected Entities | `Delete` or `Backspace` |
| Cut (Copy + Delete) | `Ctrl/Cmd + X` |
| Delete Without Confirmation | `Shift + Delete` (bypass threshold) |
| Delete Connected Entities Too | `Alt + Delete` (also delete connections) |

---

## Related Elements

- [SelectTool](../../elements/04-tools/SelectTool.md) - Entity selection for deletion
- [DeleteCommand](../../elements/09-commands/DeleteCommand.md) - Delete undo/redo support
- [entityStore](../../elements/02-stores/entityStore.md) - Entity removal
- [ConnectionSystem](../../elements/08-systems/ConnectionSystem.md) - Connection cleanup
- [ConfirmationDialog](../../elements/01-components/dialogs/ConfirmationDialog.md) - Bulk delete confirmation
- [HistoryStore](../../elements/09-commands/HistoryStore.md) - Command history
- [UJ-SM-001](../04-selection-and-manipulation/UJ-SM-001-SelectSingleEntity.md) - Selection (prerequisite)

---

## Visual Diagram

```
Delete Operation Flow
┌────────────────────────────────────────────────────────┐
│  1. Select Entity                                      │
│     ┌─────┐                                            │
│     │  A  │ ← Selected for deletion                    │
│     └─────┘                                            │
│      ↕ (connected ducts)                               │
│                                                        │
│  2. Press Delete Key                                   │
│     ↓                                                  │
│  3. Validate                                           │
│     - Selection not empty? ✓                           │
│     - Entity exists? ✓                                 │
│     - Not protected? ✓                                 │
│     - Bulk threshold (>5)? No                          │
│     ↓                                                  │
│  4. Remove from Store                                  │
│     entityStore.removeEntity('room-a')                 │
│     ↓                                                  │
│  5. Handle Connections                                 │
│     - Find connected ducts: 2 found                    │
│     - Clear connection references                      │
│     - Mark ducts as orphaned (yellow warning)          │
│     ↓                                                  │
│  6. Update UI                                          │
│     - Clear selection                                  │
│     - Remove entity from canvas                        │
│     - Show orphaned duct warnings                      │
│     ↓                                                  │
│  7. Create Undo Command                                │
│     DeleteEntityCommand(room-a, entityData)            │
│     ↓                                                  │
│  8. Complete                                           │
│     Status: "Deleted 1 entity"                         │
└────────────────────────────────────────────────────────┘

Bulk Delete Confirmation:
┌────────────────────────────────────────────────────────┐
│  Selection: 10 Rooms                                   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐             │
│  │  A  │ │  B  │ │  C  │ │  D  │ │  E  │ ...         │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘             │
│                                                        │
│  ↓ Press Delete                                        │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Delete 10 Entities?                          [×] │ │
│  │ ──────────────────────────────────────────────── │ │
│  │                                                  │ │
│  │ Are you sure you want to delete 10 entities?    │ │
│  │ This action can be undone.                      │ │
│  │                                                  │ │
│  │ Entities:                                        │ │
│  │ • Room A                                         │ │
│  │ • Room B                                         │ │
│  │ • Room C                                         │ │
│  │ • Room D                                         │ │
│  │ • Room E                                         │ │
│  │ + 5 more...                                      │ │
│  │                                                  │ │
│  │ ☐ Also delete connected ducts (15 ducts)        │ │
│  │                                                  │ │
│  │                        [Cancel] [Delete]         │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘

Connection Cleanup Options:
┌────────────────────────────────────────────────────────┐
│  Before Delete:                                        │
│  ┌─────┐  duct-1  ┌─────┐                             │
│  │RM-A │─────────→│RM-B │                             │
│  └─────┘          └─────┘                             │
│                                                        │
│  Delete RM-A → What happens to duct-1?                 │
│                                                        │
│  Option A (Orphan - Default):                          │
│  duct-1  ┌─────┐                                       │
│  ───────→│RM-B │                                       │
│  (orphan)└─────┘                                       │
│  • Duct remains                                        │
│  • Warning indicator shown                             │
│  • User can reconnect or delete                        │
│                                                        │
│  Option B (Auto-Delete):                               │
│         ┌─────┐                                        │
│         │RM-B │                                        │
│         └─────┘                                        │
│  • Duct deleted automatically                          │
│  • Cleaner result                                      │
│  • Less flexible (can't undo just room)                │
│                                                        │
│  Option C (Prompt User):                               │
│  Dialog: "Delete duct-1 too? [Yes] [No]"               │
│  • User decides per connection                         │
│  • Most control but slower workflow                    │
└────────────────────────────────────────────────────────┘

Delete Command Structure:
┌────────────────────────────────────────────────────────┐
│  DeleteEntityCommand {                                 │
│    entityId: "room-a",                                 │
│    entityData: {                                       │
│      id: "room-a",                                     │
│      type: "room",                                     │
│      position: { x: 100, y: 100 },                     │
│      size: { width: 200, height: 150 },                │
│      props: { ... }  // Full entity for restore        │
│    },                                                  │
│    connections: [                                      │
│      { ductId: "duct-1", port: "outlet" },             │
│      { ductId: "duct-2", port: "inlet" }               │
│    ],                                                  │
│                                                        │
│    execute() {                                         │
│      // Remove entity from store                       │
│      entityStore.removeEntity(this.entityId)           │
│      // Clear connections                              │
│      clearConnections(this.connections)                │
│    },                                                  │
│                                                        │
│    undo() {                                            │
│      // Restore entity to store                        │
│      entityStore.addEntity(this.entityData)            │
│      // Restore connections                            │
│      restoreConnections(this.connections)              │
│    }                                                   │
│  }                                                     │
└────────────────────────────────────────────────────────┘

Orphaned Duct Indicator:
┌────────────────────────────────────────────────────────┐
│  Before Room Deletion:                                 │
│  ┌─────┐ ─────→ ┌─────┐                                │
│  │RM-A │  Duct  │RM-B │                                │
│  └─────┘        └─────┘                                │
│  Normal duct (connected both ends)                     │
│                                                        │
│  After Room A Deleted:                                 │
│   ⚠                                                    │
│  ─────→ ┌─────┐                                        │
│   Duct  │RM-B │                                        │
│  (yellow)└─────┘                                       │
│                                                        │
│  Orphaned duct indicators:                             │
│  • Yellow outline (warning state)                      │
│  • Warning icon (⚠) at disconnected end                │
│  • Tooltip: "Not connected to any entity"              │
│  • Flagged in validation report                        │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/DeleteCommand.test.ts`

**Test Cases**:
- Delete single entity
- Delete multiple entities (bulk)
- Entity removed from store
- Connections cleared
- Protected entity deletion prevented
- Undo restores entity

**Assertions**:
- Entity removed from `allIds` and `byId`
- Selection cleared after delete
- Connection references set to null
- Protected flag blocks deletion
- Undo adds entity back to store

---

### Integration Tests
**File**: `src/__tests__/integration/delete-entity.test.ts`

**Test Cases**:
- Complete delete workflow
- Orphaned duct handling
- Bulk delete with confirmation
- Cut operation (Ctrl+X)
- Delete with undo/redo
- Delete during background operations

**Assertions**:
- Entity disappears from canvas
- Orphaned ducts marked with warnings
- Confirmation dialog shows for >5 entities
- Cut copies to clipboard then deletes
- Undo restores all deleted entities
- Delete works during auto-save

---

### E2E Tests
**File**: `e2e/entity-creation/delete-entity.spec.ts`

**Test Cases**:
- Visual entity deletion (Delete key)
- Bulk delete confirmation dialog
- Orphaned duct warning indicators
- Status bar delete confirmation
- Undo button restores entity
- Inspector clears after delete

**Assertions**:
- Entity disappears from canvas visually
- Confirmation dialog visible for bulk delete
- Yellow warning on orphaned ducts
- Status shows "Deleted X entities"
- Undo button enabled after delete
- Inspector shows empty state

---

## Common Pitfalls

### ❌ Don't: Delete entity without preserving data for undo
**Problem**: Cannot restore deleted entity

**Solution**: Store complete entity object in delete command

---

### ❌ Don't: Leave dangling connection references
**Problem**: Crashes when trying to access deleted entity through connection

**Solution**: Clean up all connection references on deletion

---

### ❌ Don't: Require confirmation for every delete
**Problem**: Frustrating for single entity deletes

**Solution**: Only confirm for bulk deletes (>5 entities threshold)

---

### ✅ Do: Clear selection after delete
**Benefit**: Prevents confusion (can't operate on deleted entity)

---

### ✅ Do: Provide visual feedback for orphaned connections
**Benefit**: User knows which ducts need attention after deletion

---

## Performance Tips

### Optimization: Batch Delete Operations
**Problem**: Deleting 100 entities one-by-one causes 100 store updates

**Solution**: Batch all deletions into single transaction
- Collect all entity IDs
- Remove in single store operation
- One re-render instead of 100
- 100x faster bulk delete

---

### Optimization: Lazy Connection Cleanup
**Problem**: Finding and updating all connections during delete is slow

**Solution**: Mark connections dirty, clean up in background
- Delete entity immediately
- Queue connection cleanup
- Process during idle time
- Maintains responsive UI

---

### Optimization: Defer Validation Report Update
**Problem**: Recalculating full validation report after each delete lags UI

**Solution**: Debounce validation updates
- Mark report dirty on delete
- Recalculate after 1 second of no changes
- User doesn't need instant validation during active editing

---

## Future Enhancements

- **Soft Delete**: Mark entity as deleted instead of removing (recoverable)
- **Delete History**: View list of recently deleted entities
- **Smart Delete**: Auto-delete orphaned connections
- **Delete Preview**: Show what will be deleted before confirming
- **Cascade Delete**: Option to delete all dependent entities
- **Delete Protection**: Mark important entities as non-deletable
- **Trash/Recycle Bin**: Deleted entities stored for 30 days
- **Bulk Operations Panel**: Delete by type, layer, or property filter
- **Delete Animation**: Fade out animation when entity deleted
- **Delete Sound**: Audio feedback for deletion (optional)
