# [UJ-UR-004] Redo Multiple Actions

## Overview

This user journey covers redoing multiple previously undone actions in sequence by repeatedly pressing the redo shortcut, allowing users to step forward through their undo history.

## PRD References

- **FR-UR-004**: User shall be able to redo multiple actions in sequence
- **US-UR-004**: As a designer, I want to redo several undone actions so that I can restore recent states
- **AC-UR-004-001**: Repeated Ctrl/Cmd+Shift+Z redoes actions sequentially
- **AC-UR-004-002**: Each redo steps forward one action in history
- **AC-UR-004-003**: Status bar shows which action is being redone
- **AC-UR-004-004**: Canvas updates after each redo
- **AC-UR-004-005**: Can redo up to all previously undone actions
- **AC-UR-004-006**: New user action clears remaining redo stack

## Prerequisites

- User is in Canvas Editor
- Multiple undo operations have been performed
- Redo stack contains multiple commands
- No new actions performed since last undo (redo stack not cleared)

## User Journey Steps

### Step 1: Perform Actions and Undo Multiple Times

**User Action**: Create 5 rooms (A, B, C, D, E), then undo all 5 with Ctrl+Z

**Expected Result**:
- Initial state: 5 rooms created
- After 5 undos: All rooms removed
- History stack state:
  - Undo stack: Empty (size 0)
  - Redo stack: Full (size 5)
  - Redo stack contents (top to bottom):
    - Position 0 (first to redo): Create Room A
    - Position 1: Create Room B
    - Position 2: Create Room C
    - Position 3: Create Room D
    - Position 4 (last to redo): Create Room E
- Canvas: Empty (no rooms visible)
- UI state:
  - Undo button disabled (nothing to undo)
  - Redo button enabled: "Redo Create Room A"
  - Status bar: "Undone: Create Room E" (from last undo)
- Ready to redo actions sequentially

**Validation Method**: Integration test - Verify redo stack populated after multiple undos

---

### Step 2: First Redo Action

**User Action**: Press Ctrl/Cmd+Shift+Z (first redo)

**Expected Result**:
- Redo command triggered
- Top command retrieved from redo stack: Create Room A
- Redo operation executes:
  - `CreateRoomCommand.execute()` called
  - Room A added back to entity store
  - Room A appears on canvas
- History stack updated:
  - Command moved from redo stack to undo stack
  - Redo stack size: 4 (positions 1-4)
  - Undo stack size: 1 (Room A creation)
  - Current position: 1
- Visual feedback:
  - Room A appears immediately at original position (100, 100)
  - Canvas re-renders
  - Room A rendered with original properties
- Status bar: "Redone: Create Room A" (brief, 2 seconds)
- UI updates:
  - Undo button enabled: "Undo Create Room A"
  - Redo button tooltip updates: "Redo Create Room B"
- Smooth execution (no delay)

**Validation Method**: E2E test - Verify first redo restores earliest undone action

---

### Step 3: Second and Third Redo Actions

**User Action**: Press Ctrl/Cmd+Shift+Z twice more (redo 2 and 3)

**Expected Result**:
- Second redo:
  - Command: Create Room B
  - Room B added to entity store
  - Room B appears on canvas at (200, 150)
  - Redo stack size: 3
  - Undo stack size: 2
  - Status: "Redone: Create Room B"
  - Canvas shows: Room A, Room B
- Third redo:
  - Command: Create Room C
  - Room C added to entity store
  - Room C appears on canvas at (150, 250)
  - Redo stack size: 2
  - Undo stack size: 3
  - Status: "Redone: Create Room C"
  - Canvas shows: Room A, Room B, Room C
- Sequential execution:
  - Each redo processed individually
  - Separate canvas re-render for each
  - Separate status bar update
- Rapid execution supported:
  - Can press Ctrl+Shift+Z 3 times in 1 second
  - All redos execute without lag
  - Visual updates smooth (60fps maintained)
- Redo button tooltip: "Redo Create Room D"
- Undo button tooltip: "Undo Create Room C"

**Validation Method**: Integration test - Verify sequential redo updates state correctly

---

### Step 4: Complete All Redos

**User Action**: Press Ctrl/Cmd+Shift+Z two more times to redo remaining actions

**Expected Result**:
- Fourth redo: Restore Room D
  - Room D appears at (350, 100)
  - Canvas shows: Rooms A, B, C, D
  - Redo stack: 1, Undo stack: 4
- Fifth redo: Restore Room E
  - Room E appears at (300, 300)
  - Canvas shows: All 5 rooms (A, B, C, D, E)
  - Redo stack: 0 (empty), Undo stack: 5 (full)
- After all 5 redos:
  - Canvas state restored to original (before any undos)
  - All rooms at original positions
  - Redo stack empty
  - Undo stack complete (can undo all 5 again)
- UI state after complete redo:
  - Redo button disabled (no more redos available)
  - Undo button enabled: "Undo Create Room E"
  - Status bar: "Redone: Create Room E"
- Complete cycle:
  - Created 5 rooms → Undid all 5 → Redid all 5
  - Back to original state
  - History preserved throughout

**Validation Method**: E2E test - Verify complete redo sequence restores original state

---

### Step 5: Verify Redo Stack Cleared on New Action

**User Action**: After redoing 3 rooms (A, B, C), create new duct

**Expected Result**:
- State before new action:
  - Canvas: Rooms A, B, C (redone)
  - Redo stack: 2 actions (Room D, Room E)
  - Can still redo D and E
- New action performed: Create duct
- Redo stack immediately cleared:
  - Redo stack size: 0
  - Rooms D and E no longer redoable
  - New timeline branch created
- History state after new action:
  - Undo stack: Rooms A, B, C, + Create Duct (4 actions)
  - Redo stack: Empty
  - Current position: 4
- UI updates:
  - Redo button disabled (no redos available)
  - Undo button enabled: "Undo Create Duct"
- Cannot return to Room D/E:
  - Those actions lost from redo history
  - New action creates new timeline
  - Standard undo/redo behavior (non-branching)

**Validation Method**: Unit test - Verify redo stack cleared on new action

---

## Edge Cases

### 1. Redo with Empty Redo Stack

**User Action**: Press Ctrl+Shift+Z when redo stack is empty (no undos performed)

**Expected Behavior**:
- Redo command triggered
- Redo stack checked: Empty (size 0)
- No action taken (no-op):
  - Canvas unchanged
  - No entities affected
  - No error dialog
- Subtle feedback:
  - Redo button already disabled (grayed out)
  - Optional: Brief tooltip "Nothing to redo"
  - Optional: System beep
- No error state:
  - Common scenario, not an error
  - User continues normally
- Cannot redo beyond redo stack size

**Validation Method**: Unit test - Verify redo with empty stack is safe no-op

---

### 2. Redo Mixed Action Types in Sequence

**User Action**: Create room, draw duct, resize room, delete duct, undo all 4, redo all 4

**Expected Behavior**:
- After 4 undos, redo stack contains:
  - Position 0: CreateRoomCommand
  - Position 1: CreateDuctCommand
  - Position 2: ResizeRoomCommand
  - Position 3: DeleteDuctCommand
- Redo sequence:
  - Redo 1: Room created (execute create)
  - Redo 2: Duct created (execute create)
  - Redo 3: Room resized (execute resize)
  - Redo 4: Duct deleted (execute delete)
- Different command types execute correctly:
  - Each type has specific execute() logic
  - Create → Add entity
  - Resize → Update dimensions
  - Delete → Remove entity
- Final state matches original:
  - Room exists at resized dimensions
  - Duct deleted (not visible)
  - Consistent with original action sequence
- No conflicts between command types

**Validation Method**: Integration test - Verify mixed command type redo sequence

---

### 3. Redo Grouped Commands

**User Action**: Delete 10 rooms (single bulk delete), undo, then redo

**Expected Behavior**:
- Bulk delete created grouped command:
  - `DeleteEntitiesCommand` with 10 entity IDs
  - Single command in history (not 10)
- After undo:
  - All 10 rooms restored
  - Single command in redo stack
- Single redo restores deletion:
  - Press Ctrl+Shift+Z once
  - All 10 rooms deleted simultaneously
  - Not 10 separate redos required
- Efficient history usage:
  - 1 redo action = entire bulk operation
  - Matches user mental model
  - Same behavior as undo of grouped commands
- Redo stack size: Decreases by 1 (not 10)

**Validation Method**: Integration test - Verify grouped command redo

---

### 4. Rapid Redo (Hold Ctrl+Shift+Z)

**User Action**: Hold down Ctrl+Shift+Z for 3 seconds (OS key repeat)

**Expected Behavior**:
- Key repeat triggers multiple redo events
- OS repeat rate: 10-15 events/second
- Holding 3 seconds = 30-45 redo attempts
- Throttling applied:
  - Max redo rate: 5 redos/second (200ms minimum between)
  - Excess events ignored
  - Prevents system overload
- Visual feedback:
  - Canvas updates smoothly
  - Each redo visible (not too fast to see)
  - Status bar shows each action being redone
- Performance maintained:
  - 60fps canvas rendering
  - No lag or freeze
  - Responsive to key release
- When redo stack empty:
  - Further events ignored
  - No errors from rapid empty stack checks
  - Redo button disabled after stack exhausted

**Validation Method**: E2E test - Verify key repeat throttling for redo

---

### 5. Redo During Auto-Save

**User Action**: Press Ctrl+Shift+Z while auto-save is writing file

**Expected Behavior**:
- Redo operation independent of save:
  - Redo modifies in-memory state
  - Auto-save writes snapshot to disk
  - No conflict between operations
- Redo executes immediately:
  - No blocking or delay
  - Entity added/restored instantly
  - User sees responsive redo
- Auto-save continues:
  - May save pre-redo state (depending on timing)
  - Or post-redo state if save starts after redo
  - Either way is valid
- After auto-save completes:
  - File contains state at save time
  - May differ from current state (if redos continued)
  - Next auto-save captures latest state
- No race conditions or corruption

**Validation Method**: Integration test - Verify redo during background save

---

## Error Scenarios

### 1. Redo Command Execution Failure

**Scenario**: Redo operation throws error mid-execution (corrupted state)

**Expected Handling**:
- Redo command called: `command.execute()`
- Error thrown during execution
- Error caught by history system
- Error handling:
  - Error toast: "Cannot redo action. State may be inconsistent."
  - Command remains on redo stack (can retry)
  - Partial redo rolled back if possible
  - Canvas state frozen (no partial redo applied)
- User options:
  - Retry redo (may succeed after state correction)
  - Skip this redo (continue to next)
  - Reset application (if state corrupted)
- Error logged with full details for debugging
- Subsequent redos may still work (only one command failed)

**Validation Method**: Unit test - Verify error handling doesn't corrupt state

---

### 2. Redo Entity Already Exists

**Scenario**: Redoing entity creation, but entity ID already exists (data corruption)

**Expected Handling**:
- Redo attempts to recreate entity
- Duplicate ID detected in store
- Conflict resolution:
  - Generate new UUID for redone entity
  - Or: Skip redo with warning
- Warning: "Cannot redo entity creation. Entity already exists."
- Options:
  - Generate new ID and continue
  - Skip this redo
  - Manual resolution
- Command removed from redo stack (prevent repeated attempts)
- Other entities in batch redone successfully
- Error logged for investigation

**Validation Method**: Unit test - Verify duplicate entity handling

---

### 3. Redo Stack Corrupted

**Scenario**: Redo stack contains invalid command data

**Expected Handling**:
- Redo triggered
- Command data retrieved from redo stack
- Validation fails: Invalid command structure
- Error handling:
  - Error: "Redo history corrupted. Cannot redo this action."
  - Skip corrupted command
  - Move to next valid command in stack
  - Or: Clear redo stack entirely (safe reset)
- User notified:
  - "Some redo actions may be unavailable due to data corruption"
  - Suggest: Save and restart application
- Partial redo stack preserved if possible
- No crash or hang

**Validation Method**: Unit test - Verify corrupted redo stack handling

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Redo One Action | `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` |
| Redo Multiple | `Ctrl/Cmd + Shift + Z` (repeat) |
| Undo One Action | `Ctrl/Cmd + Z` |
| View History | `Ctrl/Cmd + Shift + H` (opens history panel) |

---

## Related Elements

- [HistoryStore](../../elements/09-commands/HistoryStore.md) - Undo/redo stack management
- [CommandPattern](../../elements/09-commands/CommandPattern.md) - Base command interface
- [EntityCommands](../../elements/09-commands/EntityCommands.md) - Entity-specific redo logic
- [RedoButton](../../elements/01-components/canvas/RedoButton.md) - Toolbar redo button
- [StatusBar](../../elements/01-components/canvas/StatusBar.md) - Redo feedback display
- [UJ-UR-002](./UJ-UR-002-RedoLastUndoneAction.md) - Single redo (prerequisite)
- [UJ-UR-003](./UJ-UR-003-UndoMultipleActions.md) - Multiple undo (related)

---

## Visual Diagram

```
Multiple Redo Sequence
┌────────────────────────────────────────────────────────┐
│  After Creating and Undoing 5 Rooms:                  │
│  Canvas: [] (empty)                                    │
│  Undo Stack: []                                        │
│  Redo Stack: [CreateA, CreateB, CreateC, CreateD,      │
│               CreateE]                                 │
│                                                        │
│  ↓ Redo 1 (Ctrl+Shift+Z)                               │
│  Canvas: [A]                                           │
│  Undo Stack: [CreateA]                                 │
│  Redo Stack: [CreateB, CreateC, CreateD, CreateE]      │
│                                                        │
│  ↓ Redo 2 (Ctrl+Shift+Z)                               │
│  Canvas: [A] [B]                                       │
│  Undo Stack: [CreateA, CreateB]                        │
│  Redo Stack: [CreateC, CreateD, CreateE]               │
│                                                        │
│  ↓ Redo 3 (Ctrl+Shift+Z)                               │
│  Canvas: [A] [B] [C]                                   │
│  Undo Stack: [CreateA, CreateB, CreateC]               │
│  Redo Stack: [CreateD, CreateE]                        │
│                                                        │
│  ↓ Redo 4 (Ctrl+Shift+Z)                               │
│  Canvas: [A] [B] [C] [D]                               │
│  Undo Stack: [CreateA, CreateB, CreateC, CreateD]      │
│  Redo Stack: [CreateE]                                 │
│                                                        │
│  ↓ Redo 5 (Ctrl+Shift+Z)                               │
│  Canvas: [A] [B] [C] [D] [E]                           │
│  Undo Stack: [CreateA, CreateB, CreateC, CreateD,      │
│               CreateE]                                 │
│  Redo Stack: [] (empty)                                │
│                                                        │
│  ↓ Redo 6 (Ctrl+Shift+Z) - NO ACTION                   │
│  Canvas: [A] [B] [C] [D] [E] (unchanged)               │
│  Status: "Nothing to redo"                             │
└────────────────────────────────────────────────────────┘

Redo Stack Cleared on New Action:
┌────────────────────────────────────────────────────────┐
│  State: 3 Rooms Redone (A, B, C)                       │
│  Redo Stack: [CreateD, CreateE] ← Still redoable       │
│                                                        │
│  ↓ User creates new duct (NEW ACTION)                  │
│                                                        │
│  Redo Stack: [] ← CLEARED!                             │
│  Rooms D and E can no longer be redone                 │
│  New timeline branch created                           │
│                                                        │
│  Timeline Visualization:                               │
│  Create A → B → C → D → E                              │
│              ↓ (undo all)                              │
│            Empty                                       │
│              ↓ (redo A, B, C)                          │
│            A → B → C                                   │
│              ↓ (create duct - NEW BRANCH)              │
│            A → B → C → Duct                            │
│                                                        │
│  D and E lost (not on current timeline)                │
└────────────────────────────────────────────────────────┘

History Position Movement (Redo):
┌────────────────────────────────────────────────────────┐
│  Position in History (0 = oldest, 5 = newest)          │
│                                                        │
│  After All Undone (Position 0):                        │
│  ← Current position: 0 (beginning)                     │
│  Redo available: [A, B, C, D, E]                       │
│                                                        │
│  After Redo 1 (Position 1):                            │
│  0:[CreateA] ← Current position: 1                     │
│  Redo available: [B, C, D, E]                          │
│                                                        │
│  After Redo 2 (Position 2):                            │
│  0:[CreateA] 1:[CreateB] ← Current position: 2         │
│  Redo available: [C, D, E]                             │
│                                                        │
│  After Redo 3 (Position 3):                            │
│  0:[CreateA] 1:[CreateB] 2:[CreateC]                   │
│  ← Current position: 3                                 │
│  Redo available: [D, E]                                │
│                                                        │
│  After Redo 4 (Position 4):                            │
│  0:[CreateA] 1:[CreateB] 2:[CreateC] 3:[CreateD]       │
│  ← Current position: 4                                 │
│  Redo available: [E]                                   │
│                                                        │
│  After Redo 5 (Position 5):                            │
│  0:[CreateA] 1:[CreateB] 2:[CreateC] 3:[CreateD]       │
│  4:[CreateE] ← Current position: 5 (end)               │
│  Redo available: [] (none)                             │
└────────────────────────────────────────────────────────┘

Redo Rate Throttling:
┌────────────────────────────────────────────────────────┐
│  Ctrl+Shift+Z Events (Key Repeat):                     │
│  Time:    0ms  50ms 100ms 150ms 200ms 250ms 300ms      │
│  Event:    1    2    3     4     5     6     7         │
│            │    │    │     │     │     │     │         │
│  Throttle: ✓    ✗    ✗     ✗     ✓     ✗     ✓        │
│            │                      │           │         │
│         Redo 1               Redo 2      Redo 3        │
│                                                        │
│  Throttle Rate: 200ms minimum between redos            │
│  Result: 5 redos/second maximum                        │
│  Prevents: UI overload, excessive re-renders           │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/HistoryStore.multipleRedo.test.ts`

**Test Cases**:
- Redo multiple commands sequentially
- Verify stack sizes update correctly
- Commands move from redo to undo stack
- Each redo executes correct command
- Redo stops at empty stack
- New action clears redo stack

**Assertions**:
- Redo stack decreases by 1 per redo
- Undo stack increases by 1 per redo
- Commands moved in correct order (FIFO from redo stack)
- Empty stack check prevents errors
- New action empties redo stack completely

---

### Integration Tests
**File**: `src/__tests__/integration/multiple-redo.test.ts`

**Test Cases**:
- Complete multiple redo workflow
- Mixed command types in sequence
- Entity state restoration through multiple redos
- Grouped command redo (bulk operations)
- Redo during background operations
- Performance with rapid sequential redos

**Assertions**:
- All entities restored to correct states
- Different command types execute properly
- Bulk redos restore all entities atomically
- Background tasks don't interfere with redo
- 10 rapid redos complete in <500ms

---

### E2E Tests
**File**: `e2e/undo-redo/multiple-redo.spec.ts`

**Test Cases**:
- Visual multiple entity restoration via redo
- Status bar updates for each redo
- Redo button tooltip changes
- Undo button becomes enabled
- Canvas re-renders after each redo
- Key repeat handling (hold Ctrl+Shift+Z)

**Assertions**:
- Entities appear one-by-one on canvas
- Status bar shows "Redone: {action}" for each
- Tooltip shows next redoable action
- Undo button enabled after first redo
- Smooth visual updates (60fps)
- Throttling prevents excessive rapid redos

---

## Common Pitfalls

### ❌ Don't: Process every key repeat event
**Problem**: OS key repeat sends 15 events/second, overwhelming redo system

**Solution**: Throttle redo to maximum 5 per second (200ms minimum)

---

### ❌ Don't: Preserve redo stack after new action
**Problem**: User expects new action to create new timeline, not preserve alternate history

**Solution**: Clear redo stack whenever new command executed (not undo/redo)

---

### ❌ Don't: Redo in different order than undo
**Problem**: Entities restored in wrong sequence, connections broken

**Solution**: Redo pops from redo stack in FIFO order (reverse of undo)

---

### ✅ Do: Show which action will be redone
**Benefit**: User understands what each redo does, builds trust in system

---

### ✅ Do: Handle grouped commands atomically
**Benefit**: Matches user mental model, efficient history usage

---

## Performance Tips

### Optimization: Lazy Canvas Re-render
**Problem**: Full canvas re-render after each redo is expensive for large projects

**Solution**: Mark only affected entities dirty
- Redo identifies changed entities
- Canvas re-renders only those entities
- Other entities use cached render
- 10x faster for selective redos

---

### Optimization: Command Pooling
**Problem**: Creating/destroying command objects for each redo causes GC pressure

**Solution**: Reuse command objects from pool
- Pool of pre-allocated command instances
- Reset and reuse instead of new allocation
- Reduces garbage collection pauses
- Smooth redo performance even with rapid usage

---

### Optimization: Batch Redo State Updates
**Problem**: Each redo triggers store subscriptions and re-renders

**Solution**: Batch rapid redos within 100ms window
- Queue redo operations
- Apply all in single transaction
- Single re-render after batch
- 5x faster for rapid sequential redos

---

## Future Enhancements

- **Visual History Timeline**: Scrub through history with redo preview
- **Redo to Checkpoint**: Jump forward to named checkpoint (skip intermediate redos)
- **Branching History**: Explore alternate timelines instead of clearing redo stack
- **Redo Preview**: Hover over redo to see what will change
- **Smart Redo**: Redo all changes to specific entity with single command
- **Redo Groups**: Collapse related redos (e.g., "Drawing Session") into single redo
- **Persistent Redo History**: Save redo stack with project file
- **Collaborative Redo**: Redo only your own undone changes in multi-user editing
- **Redo Analytics**: Track most commonly redone actions to improve UX
