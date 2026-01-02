# [UJ-UR-002] Redo Last Undone Action

## Overview

This user journey covers redoing the most recently undone action using the redo command, restoring entity creation, modifications, or deletions to reinstate changes that were previously undone.

## PRD References

- **FR-UR-002**: User shall be able to redo last undone action with Ctrl/Cmd+Shift+Z
- **US-UR-002**: As a designer, I want to redo undone actions so that I can recover from accidental undos
- **AC-UR-002-001**: Ctrl/Cmd+Shift+Z redoes last undone action from redo stack
- **AC-UR-002-002**: Redo available only after undo operation
- **AC-UR-002-003**: Redo button shows disabled state when redo stack empty
- **AC-UR-002-004**: Status bar shows what action was redone
- **AC-UR-002-005**: Canvas updates immediately to reflect redone state
- **AC-UR-002-006**: New user action clears redo stack

## Prerequisites

- User is in Canvas Editor
- At least one undo operation has been performed (redo stack not empty)
- No new action performed since last undo (redo stack cleared on new action)

## User Journey Steps

### Step 1: Perform Undo Operation

**User Action**: Create room entity, then press Ctrl+Z to undo

**Expected Result**:
- Room creation undone successfully
- Command moved from undo stack to redo stack:
  - Command type: `CreateEntityCommand`
  - Command data: Entity ID, entity object
  - Undo operation completed (entity removed)
- Redo stack now contains command:
  - `redoStack.push(createEntityCommand)`
  - Redo stack size: 1 action
  - Stack position: Ready for redo
- Redo button becomes enabled (was disabled)
- Redo menu item shows: "Redo Create Room" with Ctrl+Shift+Z shortcut
- Undo button disabled (no more undo history after single action)
- Entity removed from canvas

**Validation Method**: Integration test - Verify undo operation populates redo stack

---

### Step 2: Trigger Redo

**User Action**: Press Ctrl+Shift+Z (Windows/Linux) or Cmd+Shift+Z (macOS) OR click Redo button in toolbar

**Expected Result**:
- Keyboard shortcut captured
- Redo stack checked:
  - Current redo position: 1
  - Has redo: Yes
  - Top command retrieved: `CreateEntityCommand`
- Redo validation passed (command exists)
- Status bar shows: "Redoing create room..."
- Redo button shows loading state briefly
- Canvas prepared for entity restoration

**Validation Method**: E2E test - Verify redo shortcut triggers action

---

### Step 3: Execute Redo Command

**User Action**: (Automatic - triggered by Step 2)

**Expected Result**:
- Command's `execute()` method called (same as original)
- Forward operation performed:
  - For `CreateEntityCommand`: Add entity back to store
  - Entity added: `entityStore.addEntity(roomId, roomData)`
  - Entity reappears on canvas at original position
- Command moved from redo stack back to undo stack:
  - Redo stack size: 0
  - Undo stack size: 1
  - History position: 1
- Canvas re-renders immediately
- Entity appears with same properties as before undo
- Entity ID remains unchanged (same UUID)

**Validation Method**: Integration test - Verify entity restored to store with same ID

---

### Step 4: Update UI Feedback

**User Action**: (Automatic - triggered by Step 3)

**Expected Result**:
- Visual updates:
  - Room entity visible on canvas again
  - Same position, size, and properties as original
  - No selection applied (unless previously selected)
  - Inspector panel remains empty (or shows selected entity)
- Toolbar updates:
  - Redo button disabled (redo stack now empty)
  - Undo button enabled (can undo the redone action)
  - Redo menu item grayed out
  - Undo menu item shows: "Undo Create Room"
- Status bar confirmation:
  - "Redone: Create Room"
  - Brief display (3 seconds), then returns to default
- Toast notification (optional):
  - "Room creation redone"
  - Auto-dismiss after 2 seconds

**Validation Method**: E2E test - Verify UI reflects redone state

---

### Step 5: Verify State Consistency

**User Action**: (Automatic validation)

**Expected Result**:
- Entity store state matches post-original-action:
  - Entity count increased by 1
  - Entity ID in `allIds` array
  - Entity in `byId` object with correct properties
- Canvas state consistent:
  - No duplicate entities
  - No dangling references
  - All entities render correctly
- Selection state valid:
  - Selection doesn't automatically include redone entity
  - Previous selection state preserved
- Undo/redo stacks balanced:
  - Redo stack empty (0 actions)
  - Undo stack has 1 action (the redone action)
  - Can undo again to remove entity
  - Cannot redo (redo stack cleared)

**Validation Method**: Integration test - Verify complete state consistency

---

## Edge Cases

### 1. Redo with Empty Redo Stack

**User Action**: Press Ctrl+Shift+Z when no undos have been performed (empty redo stack)

**Expected Behavior**:
- Redo command ignored (no-op)
- No error message or dialog
- Subtle feedback:
  - Brief tooltip: "Nothing to redo"
  - Redo button remains disabled
  - No canvas changes
- System beep (optional, OS-dependent)
- User remains on current state

**Validation Method**: Unit test - Verify redo with empty stack is safe no-op

---

### 2. Redo Chain (Multiple Undos)

**User Action**: Create 5 rooms, undo all 5, then press Ctrl+Shift+Z five times

**Expected Behavior**:
- Each redo restores one room
- Rooms restored in reverse-undo order (FIFO from redo stack):
  - Redo 1: Restore Room 1 (first created, first undone)
  - Redo 2: Restore Room 2
  - Redo 3: Restore Room 3
  - Redo 4: Restore Room 4
  - Redo 5: Restore Room 5
- After 5 redos: All rooms back on canvas
- All 5 actions back in undo stack
- Redo stack empty
- Can undo all 5 again

**Validation Method**: E2E test - Verify complete redo chain

---

### 3. New Action Clears Redo Stack

**User Action**: Create room (A), undo, then create different room (B)

**Expected Behavior**:
- Initial state: Room A created
- After undo: Room A removed, redo stack has "Create Room A"
- Create Room B:
  - Room B added to canvas
  - Redo stack immediately cleared (Room A no longer redoable)
  - Cannot redo Room A creation
  - Can only undo Room B
- Redo button disabled
- New action creates new timeline branch
- Previous redo history permanently lost

**Validation Method**: Integration test - Verify new action clears redo stack

---

### 4. Redo After Save

**User Action**: Create room, undo, save project, then redo

**Expected Behavior**:
- Redo still works normally
- Room restored to canvas
- Project now has unsaved changes:
  - Asterisk appears in window title
  - "Unsaved changes" indicator shown
  - Saved file still has room removed (not auto-updated)
- User must save again to persist redo
- Redo works independently of save state
- No warning about redoing after save

**Validation Method**: Integration test - Verify redo works independently of save state

---

### 5. Redo Complex Command

**User Action**: Align 10 entities left, undo alignment, then redo

**Expected Behavior**:
- Single redo restores all 10 entities to aligned positions
- All entities move back to aligned state simultaneously
- Not 10 separate redos required
- Grouped command treated as atomic operation
- Efficient: One redo = one user action
- Same behavior as original action

**Validation Method**: Integration test - Verify bulk operations redo atomically

---

## Error Scenarios

### 1. Redo Command Execution Failure

**Scenario**: Redo command throws error during execution (corrupted state)

**Expected Handling**:
- Error caught by history system
- Error toast: "Cannot redo action. State may be inconsistent."
- Command remains in redo stack (can retry)
- Canvas state frozen (no partial redo)
- Redo button re-enabled for retry
- Error logged with stack trace
- User can try undo or manual fix
- Console shows detailed error information

**Validation Method**: Unit test - Verify error handling doesn't corrupt state

---

### 2. Entity Already Exists During Redo

**Scenario**: Redoing entity creation, but entity ID already exists (corrupted state)

**Expected Handling**:
- Redo attempts to recreate entity
- Duplicate ID detected in store
- Conflict resolution:
  - Generate new UUID for redone entity
  - Or: Skip redo with warning
- Warning: "Cannot redo entity creation. Entity already exists."
- Command removed from redo stack
- Partial success: Other entities in batch restored
- Console error with details
- User can manually recreate if needed

**Validation Method**: Unit test - Verify duplicate entity handling

---

### 3. Circular Redo Loop

**Scenario**: Redo triggers action that adds to history (bug)

**Expected Handling**:
- Loop detection: Track redo-in-progress flag
- Prevent recursive redo calls
- Error logged: "Redo loop detected"
- Break loop after 3 iterations
- Show error dialog: "Redo system error. Please restart."
- Disable undo/redo temporarily
- User must restart app to recover
- State preserved as much as possible

**Validation Method**: Unit test - Verify loop detection prevents infinite recursion

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Redo Last Undone Action | `Ctrl/Cmd + Shift + Z` |
| Alternative Redo | `Ctrl/Cmd + Y` (Windows only) |
| Redo Multiple (repeat) | `Ctrl/Cmd + Shift + Z` (press multiple times) |
| View Redo History | `Ctrl/Cmd + Shift + H` (opens history panel) |

---

## Related Elements

- [HistoryStore](../../elements/09-commands/HistoryStore.md) - Undo/redo stack management
- [EntityCommands](../../elements/09-commands/EntityCommands.md) - Redoable entity operations
- [CommandPattern](../../elements/09-commands/CommandPattern.md) - Base command interface
- [RedoButton](../../elements/01-components/canvas/RedoButton.md) - Toolbar redo button
- [StatusBar](../../elements/01-components/canvas/StatusBar.md) - Redo feedback display
- [UJ-UR-001](./UJ-UR-001-UndoLastAction.md) - Undo functionality (prerequisite)

---

## Visual Diagram

```
Redo Operation Flow
┌───────────────────────────────────────────────────────┐
│  Action Performed (e.g., Create Room)                │
│    ↓                                                  │
│  Command Created (CreateEntityCommand)               │
│    ↓                                                  │
│  Command Pushed to Undo Stack                        │
│  Undo: [CreateRoomCmd]                               │
│    ↓                                                  │
│  User Undoes (Ctrl+Z)                                │
│    ↓                                                  │
│  Command Moved to Redo Stack                         │
│  Undo: []                                            │
│  Redo: [CreateRoomCmd] ← Can Redo                    │
│    ↓                                                  │
│  User Redoes (Ctrl+Shift+Z)                          │
│    ↓                                                  │
│  Command.execute() → Entity Added Again              │
│    ↓                                                  │
│  Command Moved Back to Undo Stack                    │
│  Undo: [CreateRoomCmd] ← Can Undo Again              │
│  Redo: []                                            │
└───────────────────────────────────────────────────────┘

History Stack States Timeline:
1. Initial (Empty):
   Undo: []
   Redo: []

2. After Create Room:
   Undo: [CreateRoom]  ← Can undo
   Redo: []

3. After Undo:
   Undo: []
   Redo: [CreateRoom]  ← Can redo

4. After Redo:
   Undo: [CreateRoom]  ← Can undo again
   Redo: []

5. After New Action (Create Duct):
   Undo: [CreateRoom, CreateDuct]  ← Can undo both
   Redo: []  ← Cleared!

Redo Stack Clearing on New Action:
┌────────────────────────────────────────┐
│  State: Room created                   │
│  Undo: [CreateRoom]                    │
│  Redo: []                              │
│    ↓ (User undoes)                     │
│  State: Room removed                   │
│  Undo: []                              │
│  Redo: [CreateRoom]  ← Can redo        │
│    ↓ (User creates duct - NEW ACTION) │
│  State: Duct created                   │
│  Undo: [CreateDuct]                    │
│  Redo: []  ← CLEARED! Room lost        │
└────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/HistoryStore.redo.test.ts`

**Test Cases**:
- Push command to redo stack
- Pop command from redo stack
- Execute redo operation
- Move command back to undo stack
- Clear redo stack on new action
- Empty redo stack handling

**Assertions**:
- Command added to redo stack correctly
- Redo stack size increments appropriately
- Redo operation calls command.execute()
- Command moves back to undo stack
- New action clears redo stack completely
- Redo with empty stack is safe no-op

---

### Integration Tests
**File**: `src/__tests__/integration/undo-redo.redo.test.ts`

**Test Cases**:
- Complete undo-redo workflow
- Entity creation undo then redo
- Entity modification undo then redo
- Entity deletion undo then redo
- Multiple redos in sequence
- Redo cleared by new action
- Complex command redo

**Assertions**:
- Entity restored to store after redo
- Canvas state matches post-original-action state
- Undo stack populated correctly after redo
- UI updates reflect redone state
- New action clears redo history

---

### E2E Tests
**File**: `e2e/undo-redo/redo-action.spec.ts`

**Test Cases**:
- Keyboard shortcut (Ctrl+Shift+Z)
- Toolbar redo button click
- Visual entity restoration
- Status bar feedback
- Multiple sequential redos
- Redo button state changes
- New action disables redo

**Assertions**:
- Entity reappears on canvas
- Redo button disabled when appropriate
- Status bar shows "Redone: ..." message
- Undo button becomes enabled
- New action clears redo availability

---

## Common Pitfalls

### ❌ Don't: Keep redo stack after new user action
**Problem**: User expects new action to create new timeline, not preserve alternate history

**Solution**: Always clear redo stack when new command executed (not undo/redo)

---

### ❌ Don't: Use different logic for redo vs original action
**Problem**: Redo produces different result than original, causing state inconsistency

**Solution**: Redo calls same `execute()` method as original action

---

### ❌ Don't: Allow redo to change entity IDs
**Problem**: Redone entity gets new UUID, breaks references and confuses users

**Solution**: Store original entity ID in command, reuse on redo

---

### ✅ Do: Provide clear visual feedback on redo availability
**Benefit**: User knows when redo is possible without trying shortcut

---

### ✅ Do: Show what will be redone in menu/tooltip
**Benefit**: User understands what action will occur before triggering redo

---

## Performance Tips

### Optimization: Reuse Command Objects
**Problem**: Creating new command objects for redo wastes memory

**Solution**: Move same command instance between stacks
- No new allocation needed
- Reduces GC pressure
- Command already has all necessary data
- Maintains history without duplication

---

### Optimization: Batch Redo Operations
**Problem**: Rapid redo operations (holding Ctrl+Shift+Z) cause UI lag

**Solution**: Batch multiple redo operations
- Queue redo requests
- Execute in single frame
- Update UI once at end
- 10x faster for sequential redos

---

### Optimization: Defer Canvas Re-render
**Problem**: Full canvas re-render on every redo is expensive

**Solution**: Mark only affected entities as dirty
- Redo marks specific entities for re-render
- Other entities use cached render
- 5-10x faster visual updates
- Same approach as undo optimization

---

## Future Enhancements

- **Redo History Panel**: Visual timeline showing all redoable actions
- **Named Branches**: Save redo stack when creating new timeline branch
- **Selective Redo**: Cherry-pick specific actions to redo (non-linear)
- **Redo Preview**: Hover over redo to see what will change
- **Persistent Redo History**: Save redo stack with project file
- **Collaborative Redo**: Track which user made each redoable action
- **Smart Redo**: Only redo changes to selected entity, not all actions
- **Redo Shortcuts**: Ctrl+Y as alternative redo shortcut (Windows standard)
