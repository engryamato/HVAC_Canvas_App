# [UJ-UR-003] Undo Multiple Actions

## Overview

This user journey covers undoing multiple consecutive actions in sequence by repeatedly pressing the undo shortcut, allowing users to step back through their entire edit history.

## PRD References

- **FR-UR-003**: User shall be able to undo multiple actions in sequence
- **US-UR-003**: As a designer, I want to undo several actions so that I can restore earlier project states
- **AC-UR-003-001**: Repeated Ctrl/Cmd+Z undoes actions sequentially
- **AC-UR-003-002**: Each undo steps back one action in history
- **AC-UR-003-003**: Status bar shows which action is being undone
- **AC-UR-003-004**: Canvas updates after each undo
- **AC-UR-003-005**: Can undo up to 100 previous actions (configurable limit)
- **AC-UR-003-006**: Undo button shows preview of next undoable action

## Prerequisites

- User is in Canvas Editor
- Multiple actions have been performed (at least 2+)
- Undo history contains multiple commands
- No blocking dialogs or operations in progress

## User Journey Steps

### Step 1: Perform Multiple Actions

**User Action**: Create 5 rooms sequentially (Room A, B, C, D, E)

**Expected Result**:
- Five separate create actions performed
- Each room added to canvas
- Undo history populated:
  - Position 0 (oldest): Create Room A
  - Position 1: Create Room B
  - Position 2: Create Room C
  - Position 3: Create Room D
  - Position 4 (newest): Create Room E
- History stack state:
  - Undo stack size: 5 commands
  - Redo stack size: 0 (no undos yet)
  - Current position: 5 (after all actions)
- Canvas displays all 5 rooms
- Undo button enabled with tooltip: "Undo Create Room E"
- Redo button disabled (no redo available)

**Validation Method**: Integration test - Verify history stack populated with multiple commands

---

### Step 2: First Undo Action

**User Action**: Press Ctrl/Cmd+Z (first undo)

**Expected Result**:
- Undo command triggered
- Top command retrieved from stack: Create Room E
- Undo operation executes:
  - `CreateRoomCommand.undo()` called
  - Room E removed from entity store
  - Room E disappears from canvas
- History stack updated:
  - Command moved from undo stack to redo stack
  - Undo stack size: 4 (positions 0-3)
  - Redo stack size: 1 (Room E creation)
  - Current position: 4
- Visual feedback:
  - Room E disappears immediately
  - Other rooms (A, B, C, D) remain visible
  - Canvas re-renders
- Status bar: "Undone: Create Room E" (brief, 2 seconds)
- Undo button tooltip updates: "Undo Create Room D"
- Redo button enabled: "Redo Create Room E"

**Validation Method**: E2E test - Verify first undo removes latest action

---

### Step 3: Second Undo Action

**User Action**: Press Ctrl/Cmd+Z again (second undo)

**Expected Result**:
- Second undo triggered immediately after first
- Next command retrieved: Create Room D
- Undo operation executes:
  - `CreateRoomCommand.undo()` for Room D
  - Room D removed from entity store
  - Room D disappears from canvas
- History stack updated:
  - Undo stack size: 3 (positions 0-2)
  - Redo stack size: 2 (Room E, Room D)
  - Current position: 3
- Visual updates:
  - Room D disappears
  - Rooms A, B, C remain
  - Canvas shows 3 rooms total
- Status bar: "Undone: Create Room D"
- Undo button tooltip: "Undo Create Room C"
- Redo button tooltip: "Redo Create Room D"
- Smooth sequential undo (no delay between actions)

**Validation Method**: Integration test - Verify sequential undo updates state correctly

---

### Step 4: Third, Fourth, Fifth Undo Actions

**User Action**: Press Ctrl/Cmd+Z three more times rapidly

**Expected Result**:
- Third undo: Remove Room C
  - Canvas shows: Room A, Room B
  - Undo stack: 2, Redo stack: 3
- Fourth undo: Remove Room B
  - Canvas shows: Room A only
  - Undo stack: 1, Redo stack: 4
- Fifth undo: Remove Room A
  - Canvas shows: Empty (no rooms)
  - Undo stack: 0, Redo stack: 5
- Each undo processed individually:
  - Separate undo execution
  - Separate canvas re-render
  - Separate status bar update
- Rapid execution supported:
  - Can press Ctrl+Z 5 times in 2 seconds
  - All undos execute without lag
  - Visual updates smooth (60fps maintained)
- After all 5 undos:
  - Canvas empty (back to initial state)
  - All 5 rooms removed
  - Undo button disabled (no more undo available)
  - Redo button enabled: "Redo Create Room A"
  - Status bar: "Undone: Create Room A"

**Validation Method**: E2E test - Verify rapid sequential undos

---

### Step 5: Verify History Limit

**User Action**: After undoing all 5, verify cannot undo further

**Expected Result**:
- Undo stack empty (size: 0)
- Redo stack full (size: 5)
- User presses Ctrl+Z again
- Undo attempt detected
- Validation check: `undoStack.length === 0`
- No action taken (no-op):
  - Canvas unchanged (still empty)
  - No error dialog
  - No status message
- Subtle feedback:
  - Undo button grayed out (already disabled)
  - Optional: System beep
  - Optional: Brief tooltip "Nothing to undo"
- History preserved:
  - All 5 actions still in redo stack
  - Can redo all 5 to restore state
- User cannot undo beyond history start

**Validation Method**: Unit test - Verify undo at history boundary is safe no-op

---

## Edge Cases

### 1. Undo Mixed Action Types

**User Action**: Create room, draw duct, resize room, delete duct, then undo all 4 actions

**Expected Behavior**:
- History contains different command types:
  - Position 0: CreateRoomCommand
  - Position 1: CreateDuctCommand
  - Position 2: ResizeRoomCommand
  - Position 3: DeleteDuctCommand
- Undo sequence:
  - Undo 1: Restore deleted duct (undo delete)
  - Undo 2: Restore room to original size (undo resize)
  - Undo 3: Remove duct (undo create)
  - Undo 4: Remove room (undo create)
- Each command type has different undo logic:
  - Create → Remove entity
  - Delete → Restore entity
  - Resize → Restore old dimensions
  - Move → Restore old position
- All command types work correctly in sequence
- No conflicts or errors between different types

**Validation Method**: Integration test - Verify mixed command type undo sequence

---

### 2. Undo to 100-Action Limit

**User Action**: Perform 150 actions, then attempt to undo all 150

**Expected Behavior**:
- History limit: 100 actions (configurable)
- After 150 actions performed:
  - Undo stack size: 100 (oldest 50 dropped)
  - Actions 1-50: Lost (circular buffer)
  - Actions 51-150: Available for undo
- Can undo 100 times:
  - Undo 1-100: All successful
  - Returns to state after action 50
- Cannot undo further:
  - Actions 1-50 not in history
  - Undo button disabled after 100 undos
  - Status: "Reached undo history limit"
- Warning (optional) when hitting limit:
  - After 100 undos: "Cannot undo further. History limit reached."
- Redo available for all 100 undone actions

**Validation Method**: Performance test - Verify 100-action history limit

---

### 3. Hold Ctrl+Z (Key Repeat)

**User Action**: Hold down Ctrl+Z for 3 seconds (OS key repeat)

**Expected Behavior**:
- Key repeat triggers multiple undo events
- OS repeat rate: Typically 10-15 events/second
- Holding 3 seconds = 30-45 undo attempts
- Throttling applied:
  - Max undo rate: 5 undos/second (200ms minimum between)
  - Excess events ignored
  - Prevents overwhelming system
- Visual feedback:
  - Canvas updates smoothly
  - Each undo visible (not too fast to see)
  - Status bar shows each action being undone
- Performance maintained:
  - 60fps canvas rendering
  - No lag or freeze
  - Responsive to key release
- When undo stack empty:
  - Further events ignored
  - No errors from rapid empty stack checks

**Validation Method**: E2E test - Verify key repeat throttling

---

### 4. Undo Grouped Commands

**User Action**: Select 10 rooms, delete all (single delete action), then undo

**Expected Behavior**:
- Bulk delete creates single grouped command:
  - `DeleteEntitiesCommand` with 10 entity IDs
  - Not 10 separate delete commands
  - Atomic operation
- Undo stack contains 1 command (not 10)
- Single undo restores all 10 rooms:
  - Press Ctrl+Z once
  - All 10 rooms reappear simultaneously
  - Not 10 separate undos required
- Efficient history usage:
  - 1 undo slot used (not 10)
  - Saves history space
  - Matches user mental model ("one action")
- Redo also restores all 10 with single action
- Same behavior for other bulk operations:
  - Align 20 entities: Single undo restores all positions
  - Move 5 entities: Single undo restores all

**Validation Method**: Integration test - Verify grouped command undo

---

### 5. Undo During Auto-Save

**User Action**: Press Ctrl+Z while auto-save is writing file

**Expected Behavior**:
- Undo operation independent of save:
  - Undo modifies in-memory state
  - Auto-save writes snapshot to disk
  - No conflict between operations
- Undo executes immediately:
  - No blocking or delay
  - Entity removed/restored instantly
  - User sees responsive undo
- Auto-save continues:
  - May save pre-undo state (depending on timing)
  - Or post-undo state if save starts after undo
  - Either way is valid
- After auto-save completes:
  - File contains state at save time
  - May differ from current state (if undos continued)
  - Next auto-save captures latest state
- No race conditions or corruption

**Validation Method**: Integration test - Verify undo during background save

---

## Error Scenarios

### 1. Undo Command Execution Failure

**Scenario**: Undo operation throws error mid-execution (corrupted state)

**Expected Handling**:
- Undo command called: `command.undo()`
- Error thrown during execution
- Error caught by history system
- Error handling:
  - Error toast: "Cannot undo action. State may be inconsistent."
  - Command remains on undo stack (can retry)
  - Partial undo rolled back if possible
  - Canvas state frozen (no partial undo applied)
- User options:
  - Retry undo (may succeed after state correction)
  - Skip this undo (continue to next)
  - Reset application (if state corrupted)
- Error logged with full details for debugging
- Subsequent undos may still work (only one command failed)

**Validation Method**: Unit test - Verify error handling doesn't corrupt state

---

### 2. Circular Undo Dependencies

**Scenario**: Undo chain has circular references (bug in command implementation)

**Expected Handling**:
- User starts undoing actions
- After 3 undos, detects same action appearing again (circular)
- Loop detection:
  - Track undone command IDs in session
  - If same ID appears twice: Circular loop
  - Break after 2 iterations maximum
- Error dialog:
  - "Undo system error detected. History may be corrupted."
  - "Please save and restart application."
  - Options: Save Now, Ignore, Report Bug
- Undo/redo disabled temporarily
- User must restart to recover
- State preserved in memory (can still save)
- Critical bug report generated

**Validation Method**: Unit test - Verify loop detection prevents infinite undo

---

### 3. Memory Exhaustion from Large History

**Scenario**: 100 commands in history, each storing large entity data (100MB total)

**Expected Handling**:
- Memory monitoring active
- If history exceeds 50MB total:
  - Warning: "Undo history consuming significant memory"
  - Suggestion: "Clear old history or reduce limit?"
  - Options: Clear Old (keep last 50), Reduce Limit, Ignore
- If memory critically low:
  - Automatic history pruning
  - Keep only last 25 actions
  - Remove oldest 75 actions
  - Toast: "Cleared old undo history to free memory"
- Prevents application crash
- User can continue working
- Graceful degradation (reduce features, don't crash)

**Validation Method**: Performance test - Verify memory-aware history management

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Undo One Action | `Ctrl/Cmd + Z` |
| Undo Multiple | `Ctrl/Cmd + Z` (repeat) |
| Redo One Action | `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` |
| View Undo History | `Ctrl/Cmd + Shift + H` (opens history panel) |

---

## Related Elements

- [HistoryStore](../../elements/09-commands/HistoryStore.md) - Undo/redo stack management
- [CommandPattern](../../elements/09-commands/CommandPattern.md) - Base command interface
- [EntityCommands](../../elements/09-commands/EntityCommands.md) - Entity-specific undo logic
- [UndoButton](../../elements/01-components/canvas/UndoButton.md) - Toolbar undo button
- [StatusBar](../../elements/01-components/canvas/StatusBar.md) - Undo feedback display
- [UJ-UR-001](./UJ-UR-001-UndoLastAction.md) - Single undo (prerequisite)
- [UJ-UR-002](./UJ-UR-002-RedoLastUndoneAction.md) - Redo functionality

---

## Visual Diagram

```
Multiple Undo Sequence
┌────────────────────────────────────────────────────────┐
│  Initial State: 5 Rooms Created                        │
│  Canvas: [A] [B] [C] [D] [E]                           │
│  Undo Stack: [CreateA, CreateB, CreateC, CreateD,      │
│               CreateE]                                 │
│  Redo Stack: []                                        │
│                                                        │
│  ↓ Undo 1 (Ctrl+Z)                                     │
│  Canvas: [A] [B] [C] [D]                               │
│  Undo Stack: [CreateA, CreateB, CreateC, CreateD]      │
│  Redo Stack: [CreateE]                                 │
│                                                        │
│  ↓ Undo 2 (Ctrl+Z)                                     │
│  Canvas: [A] [B] [C]                                   │
│  Undo Stack: [CreateA, CreateB, CreateC]               │
│  Redo Stack: [CreateE, CreateD]                        │
│                                                        │
│  ↓ Undo 3 (Ctrl+Z)                                     │
│  Canvas: [A] [B]                                       │
│  Undo Stack: [CreateA, CreateB]                        │
│  Redo Stack: [CreateE, CreateD, CreateC]               │
│                                                        │
│  ↓ Undo 4 (Ctrl+Z)                                     │
│  Canvas: [A]                                           │
│  Undo Stack: [CreateA]                                 │
│  Redo Stack: [CreateE, CreateD, CreateC, CreateB]      │
│                                                        │
│  ↓ Undo 5 (Ctrl+Z)                                     │
│  Canvas: []                                            │
│  Undo Stack: []                                        │
│  Redo Stack: [CreateE, CreateD, CreateC, CreateB,      │
│               CreateA]                                 │
│                                                        │
│  ↓ Undo 6 (Ctrl+Z) - NO ACTION                         │
│  Canvas: [] (unchanged)                                │
│  Status: "Nothing to undo"                             │
└────────────────────────────────────────────────────────┘

History Stack Movement:
┌────────────────────────────────────────────────────────┐
│  Position in History (0 = oldest, 5 = newest)          │
│                                                        │
│  After 5 Creates:                                      │
│  0:[CreateA] 1:[CreateB] 2:[CreateC] 3:[CreateD]       │
│  4:[CreateE] ← Current position: 5                     │
│                                                        │
│  After Undo 1:                                         │
│  0:[CreateA] 1:[CreateB] 2:[CreateC] 3:[CreateD]       │
│  ← Current position: 4                                 │
│  Redo available: [CreateE]                             │
│                                                        │
│  After Undo 2:                                         │
│  0:[CreateA] 1:[CreateB] 2:[CreateC]                   │
│  ← Current position: 3                                 │
│  Redo available: [CreateE, CreateD]                    │
│                                                        │
│  After Undo 3:                                         │
│  0:[CreateA] 1:[CreateB]                               │
│  ← Current position: 2                                 │
│  Redo available: [CreateE, CreateD, CreateC]           │
│                                                        │
│  After Undo 4:                                         │
│  0:[CreateA]                                           │
│  ← Current position: 1                                 │
│  Redo available: [CreateE, CreateD, CreateC, CreateB]  │
│                                                        │
│  After Undo 5:                                         │
│  ← Current position: 0 (beginning)                     │
│  Redo available: [CreateE, CreateD, CreateC, CreateB,  │
│                   CreateA]                             │
└────────────────────────────────────────────────────────┘

Undo Rate Throttling:
┌────────────────────────────────────────────────────────┐
│  Ctrl+Z Events (Key Repeat):                           │
│  Time:    0ms  50ms 100ms 150ms 200ms 250ms 300ms      │
│  Event:    1    2    3     4     5     6     7         │
│            │    │    │     │     │     │     │         │
│  Throttle: ✓    ✗    ✗     ✗     ✓     ✗     ✓        │
│            │                      │           │         │
│         Undo 1               Undo 2      Undo 3        │
│                                                        │
│  Throttle Rate: 200ms minimum between undos            │
│  Result: 5 undos/second maximum                        │
│  Prevents: UI overload, excessive re-renders           │
└────────────────────────────────────────────────────────┘

Grouped Command Undo:
┌────────────────────────────────────────────────────────┐
│  Bulk Delete 10 Rooms:                                 │
│                                                        │
│  Single Command in History:                            │
│  DeleteEntitiesCommand({                               │
│    entityIds: ['room-1', 'room-2', ..., 'room-10']     │
│  })                                                    │
│                                                        │
│  Undo Once:                                            │
│  ↓                                                     │
│  All 10 Rooms Restored Simultaneously                  │
│  ✓ Room 1                                              │
│  ✓ Room 2                                              │
│  ✓ Room 3                                              │
│  ...                                                   │
│  ✓ Room 10                                             │
│                                                        │
│  History Space: 1 command slot (not 10)                │
│  User Experience: Logical (matches single delete)      │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/HistoryStore.multipleUndo.test.ts`

**Test Cases**:
- Undo multiple commands sequentially
- Verify stack sizes update correctly
- Commands move from undo to redo stack
- Each undo executes correct command
- Undo stops at empty stack
- History limit enforced (100 actions)

**Assertions**:
- Undo stack decreases by 1 per undo
- Redo stack increases by 1 per undo
- Commands moved in correct order (LIFO)
- Empty stack check prevents errors
- Oldest commands dropped when exceeding limit

---

### Integration Tests
**File**: `src/__tests__/integration/multiple-undo.test.ts`

**Test Cases**:
- Complete multiple undo workflow
- Mixed command types in sequence
- Entity state restoration through multiple undos
- Grouped command undo (bulk operations)
- Undo during background operations
- Performance with rapid sequential undos

**Assertions**:
- All entities restored to correct states
- Different command types execute properly
- Bulk undos restore all entities atomically
- Background tasks don't interfere with undo
- 10 rapid undos complete in <500ms

---

### E2E Tests
**File**: `e2e/undo-redo/multiple-undo.spec.ts`

**Test Cases**:
- Visual multiple entity removal via undo
- Status bar updates for each undo
- Undo button tooltip changes
- Redo button becomes enabled
- Canvas re-renders after each undo
- Key repeat handling (hold Ctrl+Z)

**Assertions**:
- Entities disappear one-by-one from canvas
- Status bar shows "Undone: {action}" for each
- Tooltip shows next undoable action
- Redo button enabled after first undo
- Smooth visual updates (60fps)
- Throttling prevents excessive rapid undos

---

## Common Pitfalls

### ❌ Don't: Process every key repeat event
**Problem**: OS key repeat sends 15 events/second, overwhelming undo system

**Solution**: Throttle undo to maximum 5 per second (200ms minimum)

---

### ❌ Don't: Re-render after every micro-step in undo
**Problem**: Complex undo with 10 sub-steps causes 10 re-renders

**Solution**: Batch all undo changes, render once at end

---

### ❌ Don't: Store unlimited history
**Problem**: Memory exhaustion after thousands of actions

**Solution**: Enforce history limit (100 actions default), circular buffer

---

### ✅ Do: Show which action is being undone
**Benefit**: User understands what each undo does, builds trust in system

---

### ✅ Do: Handle grouped commands atomically
**Benefit**: Matches user mental model, efficient history usage

---

## Performance Tips

### Optimization: Lazy Canvas Re-render
**Problem**: Full canvas re-render after each undo is expensive for large projects

**Solution**: Mark only affected entities dirty
- Undo identifies changed entities
- Canvas re-renders only those entities
- Other entities use cached render
- 10x faster for selective undos

---

### Optimization: Command Pooling
**Problem**: Creating/destroying command objects for each undo causes GC pressure

**Solution**: Reuse command objects from pool
- Pool of pre-allocated command instances
- Reset and reuse instead of new allocation
- Reduces garbage collection pauses
- Smooth undo performance even with rapid usage

---

### Optimization: Progressive History Load
**Problem**: Loading 100-command history on project open is slow

**Solution**: Lazy load history as needed
- Load only last 10 commands immediately
- Load older commands on first undo past 10
- User rarely undos >10 actions
- 90% faster project load time

---

## Future Enhancements

- **Visual History Timeline**: Scrub through history with visual preview
- **Named Checkpoints**: Mark important states to jump back to
- **Branching History**: Explore alternate timelines (undo, make different changes)
- **Undo Preview**: Hover over undo to see what will change
- **Smart Undo**: Undo all changes to specific entity with single command
- **Undo Groups**: Collapse related undos (e.g., "Drawing Session") into single undo
- **Persistent History**: Save undo history with project file
- **Collaborative Undo**: Undo only your own changes in multi-user editing
- **Undo Analytics**: Track most commonly undone actions to improve UX
