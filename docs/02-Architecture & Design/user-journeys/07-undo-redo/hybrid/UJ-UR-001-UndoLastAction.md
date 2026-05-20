# [UJ-UR-001] Undo Last Action

## Overview

This user journey covers undoing the most recent action using the undo command, reverting entity creation, modifications, or deletions to restore the previous canvas state.

## PRD References

- **FR-UR-001**: User shall be able to undo last action with Ctrl/Cmd+Z
- **US-UR-001**: As a designer, I want to undo mistakes so that I can experiment without fear
- **AC-UR-001-001**: Ctrl/Cmd+Z undoes last action in history stack
- **AC-UR-001-002**: Up to 100 actions can be undone
- **AC-UR-001-003**: Undo button in toolbar shows disabled state when no history
- **AC-UR-001-004**: Status bar shows what action was undone
- **AC-UR-001-005**: Canvas updates immediately to reflect undone state

## Prerequisites

- User is in Canvas Editor
- At least one action has been performed (history stack not empty)
- User has not exceeded undo limit (100 actions)

## User Journey Steps

### Step 1: Perform Undoable Action

**User Action**: Create a room entity using Room tool

**Expected Result**:
- Room created successfully
- Command pattern wraps the action:
  - Command type: `CreateEntityCommand`
  - Command data: Entity ID, entity object
  - Execute method called (creates entity)
- Command pushed to history stack:
  - `historyStore.push(createEntityCommand)`
  - Stack position incremented
  - Stack size: 1 action
- Undo button becomes enabled (was disabled)
- Undo menu item shows: "Undo Create Room" with Ctrl+Z shortcut
- Redo stack cleared (can't redo after new action)

**Validation Method**: Unit test - Verify command added to history stack

---

### Step 2: Trigger Undo

**User Action**: Press Ctrl+Z (Windows/Linux) or Cmd+Z (macOS) OR click Undo button in toolbar

**Expected Result**:
- Keyboard shortcut captured
- History stack checked:
  - Current position: 1
  - Has history: Yes
  - Top command retrieved: `CreateEntityCommand`
- Undo validation passed (command exists)
- Status bar shows: "Undoing create room..."
- Undo button shows loading state briefly

**Validation Method**: E2E test - Verify undo shortcut triggers action

---

### Step 3: Execute Undo Command

**User Action**: (Automatic - triggered by Step 2)

**Expected Result**:
- Command's `undo()` method called
- Reverse operation performed:
  - For `CreateEntityCommand`: Remove entity from store
  - Entity removed: `entityStore.removeEntity(roomId)`
  - Entity disappears from canvas
- Command moved from undo stack to redo stack:
  - Undo stack size: 0
  - Redo stack size: 1
  - History position: 0
- Canvas re-renders immediately
- Selection cleared if undone entity was selected

**Validation Method**: Integration test - Verify entity removed from store

---

### Step 4: Update UI Feedback

**User Action**: (Automatic - triggered by Step 3)

**Expected Result**:
- Visual updates:
  - Room entity removed from canvas (no longer visible)
  - Selection handles removed (if room was selected)
  - Inspector panel shows empty state (if room was in inspector)
- Toolbar updates:
  - Undo button disabled (no more history)
  - Redo button enabled (can redo the undone action)
  - Undo menu item grayed out
  - Redo menu item shows: "Redo Create Room"
- Status bar confirmation:
  - "Undone: Create Room"
  - Brief display (3 seconds), then returns to default
- Toast notification (optional):
  - "Room creation undone"
  - Auto-dismiss after 2 seconds

**Validation Method**: E2E test - Verify UI reflects undone state

---

### Step 5: Verify State Consistency

**User Action**: (Automatic validation)

**Expected Result**:
- Entity store state matches pre-action:
  - Entity count decreased by 1
  - Entity ID no longer in `allIds` array
  - Entity not in `byId` object
- Canvas state consistent:
  - No ghost entities
  - No dangling references
  - All remaining entities render correctly
- Selection state valid:
  - Selected IDs don't reference removed entity
  - Inspector shows valid entity or empty state
- Undo/redo stacks balanced:
  - Total actions = undo stack + redo stack
  - No duplicate commands
  - No memory leaks

**Validation Method**: Integration test - Verify complete state consistency

---

## Edge Cases

### 1. Undo with No History

**User Action**: Press Ctrl+Z when no actions have been performed (empty project)

**Expected Behavior**:
- Undo command ignored (no-op)
- No error message or dialog
- Subtle feedback:
  - Brief tooltip: "Nothing to undo"
  - Undo button remains disabled
  - No canvas changes
- System beep (optional, OS-dependent)

**Validation Method**: Unit test - Verify undo with empty stack is safe no-op

---

### 2. Undo Chain (Multiple Actions)

**User Action**: Create 5 rooms, then press Ctrl+Z five times

**Expected Behavior**:
- Each undo removes one room
- Rooms removed in reverse order (LIFO):
  - Undo 1: Remove Room 5
  - Undo 2: Remove Room 4
  - Undo 3: Remove Room 3
  - Undo 4: Remove Room 2
  - Undo 5: Remove Room 1
- After 5 undos: Canvas empty again
- All 5 actions in redo stack
- Can redo all 5 to restore rooms

**Validation Method**: E2E test - Verify complete undo chain

---

### 3. Undo After Save

**User Action**: Create room, save project, then undo

**Expected Behavior**:
- Undo still works normally
- Room removed from canvas
- Project now has unsaved changes:
  - Asterisk appears in window title
  - "Unsaved changes" indicator shown
  - Saved file still contains the room (not auto-updated)
- User must save again to persist undo
- No warning about undoing saved work

**Validation Method**: Integration test - Verify undo works independently of save state

---

### 4. Undo Complex Command

**User Action**: Align 10 entities left, then undo

**Expected Behavior**:
- Single undo restores all 10 entities to original positions
- All entities move back simultaneously
- Not 10 separate undos required
- Grouped command treated as atomic operation
- Efficient: One undo = one user action

**Validation Method**: Integration test - Verify bulk operations undo atomically

---

### 5. Undo at History Limit (100 Actions)

**User Action**: Perform 100 actions, then perform 101st action

**Expected Behavior**:
- 101st action pushes oldest action out of history
- History stack maintains size 100 (circular buffer)
- Cannot undo past 100 actions
- Warning (one-time): "Undo history limited to 100 actions"
- First action permanently lost (cannot undo back to it)
- Newest 100 actions still undoable

**Validation Method**: Unit test - Verify history stack size cap

---

## Error Scenarios

### 1. Undo Command Execution Failure

**Scenario**: Undo command throws error during execution (corrupted state)

**Expected Handling**:
- Error caught by history system
- Error toast: "Cannot undo action. State may be inconsistent."
- Command remains in undo stack (can retry)
- Canvas state frozen (no partial undo)
- Undo button re-enabled for retry
- Error logged with stack trace
- User can try redo or manual fix

**Validation Method**: Unit test - Verify error handling doesn't corrupt state

---

### 2. Entity Not Found During Undo

**Scenario**: Undoing entity deletion, but entity data lost

**Expected Handling**:
- Undo attempts to restore entity
- Entity data retrieved from command
- If data missing/corrupted:
  - Warning: "Cannot restore entity. Data unavailable."
  - Command skipped
  - Move to next undo action
- Partial success: Other entities in batch restored
- Console error with details

---

### 3. Circular Undo Loop

**Scenario**: Undo triggers action that adds to history (bug)

**Expected Handling**:
- Loop detection: Track undo-in-progress flag
- Prevent recursive undo calls
- Error logged: "Undo loop detected"
- Break loop after 3 iterations
- Show error dialog: "Undo system error. Please restart."
- Disable undo/redo temporarily

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Undo Last Action | `Ctrl/Cmd + Z` |
| Undo Multiple (repeat) | `Ctrl/Cmd + Z` (press multiple times) |
| View Undo History | `Ctrl/Cmd + Shift + Z` (opens history panel) |

---

## Related Elements

- [HistoryStore](../../elements/09-commands/HistoryStore.md) - Undo/redo stack management
- [EntityCommands](../../elements/09-commands/EntityCommands.md) - Undoable entity operations
- [CommandPattern](../../elements/09-commands/CommandPattern.md) - Base command interface
- [UndoButton](../../elements/01-components/canvas/UndoButton.md) - Toolbar undo button
- [StatusBar](../../elements/01-components/canvas/StatusBar.md) - Undo feedback display

---

## Visual Diagram

```
Undo Operation Flow
┌───────────────────────────────────────────────────────┐
│  Action Performed (e.g., Create Room)                │
│    ↓                                                  │
│  Command Created (CreateEntityCommand)               │
│    ↓                                                  │
│  Command.execute() → Entity Added                    │
│    ↓                                                  │
│  Command Pushed to Undo Stack                        │
│  [CreateRoomCmd] ← Current Position                  │
│    ↓                                                  │
│  User Presses Ctrl+Z                                 │
│    ↓                                                  │
│  Pop Command from Undo Stack                         │
│    ↓                                                  │
│  Command.undo() → Entity Removed                     │
│    ↓                                                  │
│  Command Pushed to Redo Stack                        │
│  [CreateRoomCmd] ← Can Redo                          │
└───────────────────────────────────────────────────────┘

History Stack States:
Initial (Empty):
  Undo: []
  Redo: []

After Create Room:
  Undo: [CreateRoom]  ← Can undo
  Redo: []

After Undo:
  Undo: []
  Redo: [CreateRoom]  ← Can redo

After Redo:
  Undo: [CreateRoom]  ← Can undo again
  Redo: []
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/HistoryStore.test.ts`

**Test Cases**:
- Push command to history
- Pop command from history
- Execute undo operation
- Move command to redo stack
- History size limit (100 actions)
- Empty history handling

**Assertions**:
- Command added to stack correctly
- Stack size increments appropriately
- Undo operation calls command.undo()
- Command moves to redo stack
- Stack never exceeds 100 items

---

### Integration Tests
**File**: `src/__tests__/integration/undo-redo.test.ts`

**Test Cases**:
- Complete undo workflow
- Entity creation and undo
- Entity modification and undo
- Entity deletion and undo
- Multiple undos in sequence
- Undo after save
- Complex command undo

**Assertions**:
- Entity removed from store after undo
- Canvas state matches pre-action state
- Redo stack populated correctly
- UI updates reflect undone state

---

### E2E Tests
**File**: `e2e/undo-redo/undo-action.spec.ts`

**Test Cases**:
- Keyboard shortcut (Ctrl+Z)
- Toolbar undo button click
- Visual entity removal
- Status bar feedback
- Multiple sequential undos
- Undo button state changes

**Assertions**:
- Entity disappears from canvas
- Undo button disabled when appropriate
- Status bar shows "Undone: ..." message
- Redo button becomes enabled

---

## Common Pitfalls

### ❌ Don't: Directly mutate entity store without command pattern
**Problem**: Changes not tracked in history, cannot be undone

**Solution**: Always wrap state changes in commands (CreateEntity, UpdateEntity, etc.)

---

### ❌ Don't: Clear redo stack on every action except new user actions
**Problem**: Undo then make change should clear redo, but undo itself shouldn't

**Solution**: Only clear redo stack when new command executed, not on undo/redo

---

### ❌ Don't: Store entire entity state in every command
**Problem**: Memory usage explodes with large entities (100 actions × full state)

**Solution**: Store only changed properties (delta) in commands

---

### ✅ Do: Group related actions into single command
**Benefit**: Bulk operations (align 10 entities) undo as one action, not 10

---

### ✅ Do: Validate state before and after undo
**Benefit**: Catch corruption early, prevent cascading errors

---

## Performance Tips

### Optimization: Command Pooling
**Problem**: Creating 100 command objects causes GC pressure

**Solution**: Reuse command objects from pool
- Reset and recycle commands
- Reduces allocations by 90%
- Maintains history size without memory spikes

---

### Optimization: Lazy Entity Serialization
**Problem**: Serializing full entity for each command is slow

**Solution**: Store entity reference, serialize only on stack overflow
- Serialize to backup only when pushed out of 100-item limit
- 10x faster command creation
- Same undo functionality

---

### Optimization: Incremental UI Updates
**Problem**: Full canvas re-render on every undo is expensive

**Solution**: Mark only affected entities as dirty
- Undo marks specific entities for re-render
- Other entities use cached render
- 5-10x faster visual updates

---

## Future Enhancements

- **Undo History Panel**: Visual timeline showing all undoable actions
- **Named Checkpoints**: Create restore points "Save checkpoint before major changes"
- **Selective Undo**: Cherry-pick specific actions to undo (non-linear)
- **Undo Preview**: Hover over undo to see what will change
- **Persistent History**: Save undo history with project file
- **Collaborative Undo**: Track which user made each action
- **Smart Undo**: Undo only changes to selected entity, not all actions

