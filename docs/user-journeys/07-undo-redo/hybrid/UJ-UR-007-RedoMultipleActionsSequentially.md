# [UJ-UR-007] Redo Multiple Actions Sequentially

## Overview

This user journey covers redoing multiple undone actions in sequence, enabling designers to quickly restore previously undone work by stepping forward through the redo stack multiple times.

## PRD References

- **FR-UR-007**: User shall be able to redo multiple actions sequentially
- **US-UR-007**: As a designer, I want to redo multiple actions quickly so that I can restore work I previously undid
- **AC-UR-007-001**: Ctrl/Cmd+Shift+Z redoes single action
- **AC-UR-007-002**: Repeated keypress redoes multiple actions
- **AC-UR-007-003**: Key repeat throttled to prevent accidental mass redo
- **AC-UR-007-004**: Each redo executes independently
- **AC-UR-007-005**: Redo stops when stack exhausted
- **AC-UR-007-006**: Visual feedback shows each redo step

## Prerequisites

- User is in Canvas Editor
- User has previously undone actions (redo stack not empty)
- Redo stack contains at least 2 commands
- Canvas displaying state before redone actions

## User Journey Steps

### Step 1: Initial State with Redo Available

**User Action**: User has undone 5 actions, redo stack has 5 commands

**Expected Result**:
- Current state:
  - Undo stack: 10 actions
  - Redo stack: 5 actions (previously undone)
  - Current position: Action #10 of 15 total
- Redo stack contents:
  ```
  Redo Stack (newest to oldest):
  5. Draw Duct (500 CFM)
  4. Resize Room B
  3. Create Room C
  2. Delete Note
  1. Draw Duct (400 CFM)
  ```
- Canvas state:
  - Displaying state at action #10
  - Entities as they were before undone actions
  - 5 actions worth of work hidden
- Redo availability:
  - Edit menu: "Redo Draw Duct" (enabled)
  - Keyboard shortcut: Ctrl/Cmd+Shift+Z (active)
  - Toolbar: Redo button (enabled)
- Visual indicators:
  - Redo button: Normal state (not grayed)
  - Tooltip: "Redo Draw Duct (400 CFM)"
- Status bar:
  - "5 actions can be redone"
  - Or: Default message

**Validation Method**: Integration test - Verify redo stack state

---

### Step 2: First Redo Action

**User Action**: Press Ctrl/Cmd+Shift+Z (first redo)

**Expected Result**:
- Redo command triggered:
  - Pop command from redo stack
  - Command: Draw Duct (400 CFM)
  - Execute command's `execute()` method
- Command execution:
  - Duct entity created:
    - ID: `duct-uuid-456` (restored)
    - Start: (200, 150)
    - End: (400, 150)
    - Diameter: 10"
    - CFM: 400
  - Entity added to store:
    - `entityStore.addEntity('duct-uuid-456', ductData)`
    - Duct appears in entity list
- Canvas update:
  - Duct rendered on canvas
  - Visual: 10" diameter duct at specified position
  - Smooth appearance (optional fade-in)
- Stack updates:
  - Redo stack: 5 → 4 commands remaining
  - Command moved: Redo stack → Undo stack
  - Undo stack: 10 → 11 commands
- Current position:
  - Action #10 → Action #11
  - Progress: 11 of 15 total
- Visual feedback:
  - Redo button: Still enabled (4 more available)
  - Tooltip: "Redo Delete Note"
  - Canvas: Entity appears
- Status bar:
  - "Redo: Draw Duct (400 CFM)"
  - Flash message (2 seconds)

**Validation Method**: Integration test - Verify first redo

---

### Step 3: Rapid Sequential Redos

**User Action**: Quickly press Ctrl/Cmd+Shift+Z three more times (redos 2-4)

**Expected Result**:
- Key repeat detected:
  - User holds Shift+Z, presses Cmd rapidly
  - 3 keypresses in quick succession
  - Throttling: Max 5 redos/second (200ms interval)
- Sequential execution:
  - **Redo #2**: Delete Note
    - Note entity removed
    - Canvas: Note disappears
    - Stack: Redo 4→3, Undo 11→12
  - **Redo #3**: Create Room C
    - Room C created at (500, 200)
    - Canvas: Room appears
    - Stack: Redo 3→2, Undo 12→13
  - **Redo #4**: Resize Room B
    - Room B: 200×150 → 250×150
    - Canvas: Room grows
    - Stack: Redo 2→1, Undo 13→14
- Timing:
  - Redo #2: 0ms (immediate)
  - Redo #3: +200ms (throttled)
  - Redo #4: +200ms (throttled)
  - Total: 400ms for 3 redos
- Visual feedback:
  - Smooth sequential updates
  - Each entity appears/changes in order
  - Optional: Brief highlight on each change
- Status bar:
  - Updates with each redo:
    - "Redo: Delete Note"
    - "Redo: Create Room C"
    - "Redo: Resize Room B"
  - Final: "3 actions redone"
- Current position:
  - Action #11 → Action #14
  - Progress: 14 of 15 total
- Redo availability:
  - Redo stack: 1 remaining
  - Button: Still enabled
  - Tooltip: "Redo Draw Duct (500 CFM)"

**Validation Method**: Performance test - Verify throttling

---

### Step 4: Final Redo (Stack Exhaustion)

**User Action**: Press Ctrl/Cmd+Shift+Z one more time (5th redo)

**Expected Result**:
- Last redo executed:
  - Command: Draw Duct (500 CFM)
  - Duct created at final position
  - Canvas: Duct appears
- Stack updates:
  - Redo stack: 1 → 0 (empty)
  - Undo stack: 14 → 15 commands
- Current position:
  - Action #14 → Action #15
  - Progress: 15 of 15 total
  - At latest state (fully redone)
- Redo exhausted:
  - Redo stack: Empty
  - No more commands to redo
  - All previous work restored
- Visual updates:
  - Redo button: Disabled (grayed out)
  - Edit menu: "Redo" (grayed out)
  - Tooltip: "Nothing to redo"
- Canvas state:
  - All 5 entities restored
  - State matches pre-undo state
  - Design complete as before
- Status bar:
  - "Redo: Draw Duct (500 CFM)"
  - Then: "No more actions to redo"
- Keyboard shortcut:
  - Ctrl/Cmd+Shift+Z: No effect
  - Silent no-op
  - Or: Beep/visual feedback

**Validation Method**: Integration test - Verify stack exhaustion

---

### Step 5: Attempt Redo Beyond Limit

**User Action**: Press Ctrl/Cmd+Shift+Z again (redo stack empty)

**Expected Result**:
- Redo check:
  - Check redo stack: Empty
  - No commands to redo
  - Cannot proceed
- No action taken:
  - No command executed
  - Canvas unchanged
  - Entities remain as is
- User feedback:
  - **Option A (Silent)**: No response
    - Keyboard shortcut ignored
    - No visual/audio feedback
  - **Option B (Feedback)**: Clear indication
    - Status bar: "Nothing to redo"
    - Or: System beep (macOS style)
    - Or: Toast message
- Default: Option A (silent no-op)
- UI state:
  - Redo button: Grayed out (disabled)
  - Menu item: Disabled
  - Clear that redo unavailable
- Expected behavior:
  - User understands: No more to redo
  - Can continue with new actions
  - Or: Undo to create redo stack again

**Validation Method**: Unit test - Verify empty stack handling

---

## Edge Cases

### 1. Redo Interrupted by New Action

**User Action**: Redo 2 actions, then create new entity

**Expected Behavior**:
- Initial: Redo stack has 5 commands
- Redo 2 actions:
  - Redo stack: 5 → 3 remaining
  - Undo stack: 10 → 12
  - Current: Action #12
- New action (Create Room D):
  - User creates new entity
  - New command: CreateRoomCommand
- Redo stack cleared:
  - Redo stack: 3 → 0 (cleared)
  - Remaining 3 commands discarded
  - Cannot redo them anymore
- Undo stack:
  - New command added to undo stack
  - Undo stack: 12 → 13
  - New action becomes current
- Rationale:
  - New action creates divergent branch
  - Old redo path no longer valid
  - Standard undo/redo behavior
- Warning (optional):
  - "Creating new action will discard 3 redoable actions"
  - User confirmation before clearing
  - Or: Silent (expected behavior)

**Validation Method**: Integration test - Verify redo stack clearing

---

### 2. Redo with Command Execution Failure

**User Action**: Redo action that fails to execute

**Expected Behavior**:
- Redo attempt:
  - Command: Create Room C
  - Execute: `command.execute()`
  - Execution fails (e.g., validation error)
- Error handling:
  - Log error: "Redo failed: Create Room C"
  - Command: Not moved to undo stack
  - Remains in redo stack (or removed)
- Redo stack options:
  - **Option A (Remove)**: Remove failed command
    - Skip to next redo
    - Prevent repeated failures
  - **Option B (Keep)**: Keep in stack
    - Allow retry later
    - User can investigate
- Default: Option A (remove failed command)
- User notification:
  - Error dialog: "Cannot redo: Create Room C"
  - Details: Validation error message
  - [OK] [Skip All Errors] [Cancel Redo]
- Recovery:
  - User can:
    - Continue with next redo
    - Stop redoing
    - Fix issue manually
- Prevention:
  - Validate commands before adding to stack
  - Store valid state snapshots
  - Robust error handling

**Validation Method**: Unit test - Verify execution failure handling

---

### 3. Rapid Redo with Keyboard Repeat

**User Action**: Hold Shift+Z, system key repeat triggers 20 redos

**Expected Behavior**:
- Key repeat:
  - OS sends repeated keydown events
  - User holds keys for 2 seconds
  - 20+ redo events generated
- Throttling mechanism:
  - Max redo rate: 5/second (200ms interval)
  - Events queued and processed sequentially
  - Prevents overwhelming system
- Execution:
  - Process 1 redo every 200ms
  - 10 redos in 2 seconds (max)
  - Remaining events ignored
- Visual feedback:
  - Smooth sequential updates
  - Each redo visible (not too fast)
  - User sees changes happen
- Stack exhaustion:
  - If redo stack has 5 commands
  - Only 5 redos execute
  - Remaining 5 events: No-op
  - Stops naturally
- Performance:
  - No lag or freezing
  - 60fps maintained
  - Responsive UI
- Alternative: Debounce
  - Wait for key release
  - Then execute all at once
  - Trade-off: Less feedback

**Validation Method**: Performance test - Verify throttling

---

### 4. Redo Actions with Cascading Effects

**User Action**: Redo "Group Entities" which affects 5 entities

**Expected Behavior**:
- Redo command:
  - Command: GroupCommand
  - Creates group of 5 entities
- Cascading effects:
  - Group entity created
  - 5 member entities updated:
    - `parentGroup` property set
    - Position relative to group
  - Visual hierarchy established
- Single redo operation:
  - All effects in one command
  - Atomic execution
  - All or nothing
- Canvas update:
  - All 5 entities grouped
  - Group bounding box appears
  - Members repositioned
  - Single re-render
- Undo handling:
  - Single undo reverses entire group
  - All 5 entities ungrouped
  - Symmetrical undo/redo
- Performance:
  - Efficient batch update
  - No intermediate states
  - Clean execution

**Validation Method**: Integration test - Verify cascading effects

---

### 5. Redo After Undo Past Original State

**User Action**: Undo past project start, then redo

**Expected Behavior**:
- Scenario:
  - User undoes all actions
  - Reaches empty canvas (action #0)
  - Then redoes
- Redo from empty:
  - First redo: Create Room A
  - Empty canvas → Room A appears
  - First entity recreated
- State progression:
  - Action #0: Empty canvas
  - Redo #1: Action #1 (Room A)
  - Redo #2: Action #2 (Draw Duct)
  - ... (rebuilding design)
- Full restoration:
  - Can redo all actions
  - Rebuild entire design
  - Return to latest state
- Use case:
  - Review design evolution
  - Understand design decisions
  - Training/demonstration

**Validation Method**: Integration test - Verify full redo sequence

---

## Error Scenarios

### 1. Redo Stack Corruption

**Scenario**: Redo stack contains invalid command data

**Expected Handling**:
- Redo attempt:
  - Pop command from stack
  - Command data: Corrupted/invalid
  - Cannot execute
- Validation:
  - Check command structure
  - Validation fails
  - Corruption detected
- Error recovery:
  - Skip corrupted command
  - Remove from stack
  - Log error: "Corrupted redo command skipped"
- User notification:
  - Toast: "Some redo actions could not be restored"
  - Or: Silent skip
- Continue redoing:
  - Move to next command
  - Process remaining stack
  - Best-effort recovery
- Prevention:
  - Validate commands on save
  - Schema validation (Zod)
  - Checksums for integrity

**Validation Method**: Unit test - Verify corruption handling

---

### 2. Redo During Background Operation

**Scenario**: User redoes while autosave is running

**Expected Handling**:
- Concurrent operations:
  - Redo: Updating entity store
  - Autosave: Reading entity store
  - Both access same data
- Handling:
  - **Option A (Non-blocking)**: Allow both
    - Redo updates immediately
    - Autosave captures state (before/after)
    - No blocking
  - **Option B (Queue)**: Queue redo
    - Wait for autosave completion
    - Then execute redo
    - 1-2 second delay
- Default: Option A (non-blocking)
- Data integrity:
  - Store mutations atomic
  - No race conditions
  - Consistent snapshots
- User experience:
  - No perceived delay
  - Smooth redo operation
  - Transparent autosave

**Validation Method**: Integration test - Verify concurrent operations

---

### 3. Memory Exhaustion During Bulk Redo

**Scenario**: Redo 100 actions rapidly, memory limit reached

**Expected Handling**:
- Bulk redo:
  - User triggers 100 redos
  - Memory usage spikes
  - Approaches limit (e.g., 500 MB)
- Memory check:
  - Monitor memory during redo
  - If exceeds threshold: Pause
- Pause and recover:
  - Pause redo sequence
  - Free memory (GC)
  - Resume after recovery
- User notification:
  - "Paused to free memory, resuming..."
  - Progress indicator: "50 of 100"
  - Transparent to user
- Completion:
  - All 100 redos complete
  - May take longer
  - No data loss
- Prevention:
  - Process in smaller batches (10 at a time)
  - GC between batches
  - Memory-aware throttling

**Validation Method**: Performance test - Verify memory handling

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Redo Single Action | `Ctrl/Cmd + Shift + Z` |
| Alternative Redo | `Ctrl/Cmd + Y` |
| Redo Multiple (hold key) | Hold `Ctrl/Cmd + Shift + Z` |
| Stop Redoing | Release keys |

---

## Related Elements

- [RedoCommand](../../elements/09-commands/RedoCommand.md) - Redo logic
- [historyStore](../../elements/02-stores/historyStore.md) - Redo stack management
- [Command](../../elements/09-commands/Command.md) - Base command interface
- [UJ-UR-002](./UJ-UR-002-RedoLastUndoneAction.md) - Single redo
- [UJ-UR-004](./UJ-UR-004-RedoMultipleActions.md) - Related redo workflow

---

## Visual Diagram

```
Sequential Redo Flow
┌────────────────────────────────────────────────────────┐
│  Initial State (5 undone actions):                     │
│                                                        │
│  Undo Stack (10)     Current     Redo Stack (5)       │
│  [Actions 1-10] ──────●──────── [Actions 11-15]       │
│                    Action #10                          │
│                                                        │
│  ↓ Press Ctrl+Shift+Z (Redo #1)                        │
│                                                        │
│  After Redo #1:                                        │
│  Undo Stack (11)     Current     Redo Stack (4)       │
│  [Actions 1-11] ──────●──────── [Actions 12-15]       │
│                    Action #11                          │
│  Canvas: Duct drawn (400 CFM)                          │
│                                                        │
│  ↓ Press Ctrl+Shift+Z three more times (Redos #2-4)   │
│                                                        │
│  After Redos #2-4:                                     │
│  Undo Stack (14)     Current     Redo Stack (1)       │
│  [Actions 1-14] ──────●──────── [Action 15]           │
│                    Action #14                          │
│  Canvas: Note deleted, Room C created, Room B resized  │
│                                                        │
│  ↓ Press Ctrl+Shift+Z (Final Redo)                     │
│                                                        │
│  After Final Redo:                                     │
│  Undo Stack (15)     Current     Redo Stack (0)       │
│  [Actions 1-15] ──────●                                │
│                    Action #15        Empty             │
│  Canvas: All actions restored                          │
│  Redo button: Disabled (nothing to redo)               │
└────────────────────────────────────────────────────────┘

Throttling Mechanism
┌────────────────────────────────────────────────────────┐
│  User Input: Hold Ctrl+Shift+Z                         │
│  OS generates events:                                  │
│  ↓    ↓    ↓    ↓    ↓    ↓    ↓    ↓    ↓    ↓      │
│  0ms 50ms 100ms 150ms 200ms 250ms 300ms ...            │
│  20 events in 1 second                                 │
│                                                        │
│  Throttled Execution (Max 5/second):                   │
│  ✓    ✗    ✗    ✗    ✓    ✗    ✗    ✗    ✓    ✗      │
│  0ms                 200ms                400ms         │
│  Redo 1              Redo 2              Redo 3        │
│                                                        │
│  Result: 5 redos/second (200ms interval)               │
│  Prevents overwhelming system                          │
│  Smooth visual feedback                                │
└────────────────────────────────────────────────────────┘

Redo Stack Exhaustion
┌────────────────────────────────────────────────────────┐
│  Redo Stack: [5, 4, 3, 2, 1] (5 commands)              │
│                                                        │
│  Redo #1: Pop 1 → Stack: [5, 4, 3, 2]                 │
│  Redo #2: Pop 2 → Stack: [5, 4, 3]                    │
│  Redo #3: Pop 3 → Stack: [5, 4]                       │
│  Redo #4: Pop 4 → Stack: [5]                          │
│  Redo #5: Pop 5 → Stack: []                           │
│                   ↑                                    │
│                   Empty (exhausted)                    │
│                                                        │
│  Redo #6 attempt:                                      │
│  - Check stack: Empty                                  │
│  - No command to redo                                  │
│  - No-op (ignored)                                     │
│  - Redo button: Disabled                               │
│                                                        │
│  User feedback: "Nothing to redo"                      │
└────────────────────────────────────────────────────────┘

Redo Interrupted by New Action
┌────────────────────────────────────────────────────────┐
│  Initial:                                              │
│  Undo: [1-10]  Current: ●10  Redo: [11,12,13,14,15]   │
│                                                        │
│  Redo 2 actions:                                       │
│  Undo: [1-12]  Current: ●12  Redo: [13,14,15]         │
│                                                        │
│  Create New Action (Room D):                           │
│  ↓                                                     │
│  Undo: [1-12,13']  Current: ●13'  Redo: []            │
│                                      ↑                 │
│                                   Cleared              │
│                                                        │
│  Actions 13-15: Discarded (redo stack cleared)         │
│  New branch created with action 13'                    │
│  Cannot redo old 13-15 anymore                         │
└────────────────────────────────────────────────────────┘

Visual Feedback During Sequential Redos
┌────────────────────────────────────────────────────────┐
│  Canvas State Updates:                                 │
│                                                        │
│  Before Redos:                                         │
│  ┌─────┐                                               │
│  │  A  │                                               │
│  └─────┘                                               │
│                                                        │
│  ↓ Redo #1: Draw Duct                                  │
│  ┌─────┐                                               │
│  │  A  │●──────●                                       │
│  └─────┘                                               │
│                                                        │
│  ↓ Redo #2: Create Room B                              │
│  ┌─────┐       ┌─────┐                                 │
│  │  A  │●──────│  B  │                                 │
│  └─────┘       └─────┘                                 │
│                                                        │
│  ↓ Redo #3: Resize Room B                              │
│  ┌─────┐       ┌─────────┐                             │
│  │  A  │●──────│    B    │ ← Wider                     │
│  └─────┘       └─────────┘                             │
│                                                        │
│  Each redo: Immediate visual update                    │
│  Smooth sequential progression                         │
│  Optional: Brief highlight on changed entity           │
└────────────────────────────────────────────────────────┘

Status Bar Updates
┌────────────────────────────────────────────────────────┐
│  During Sequential Redos:                              │
│                                                        │
│  Redo #1: "Redo: Draw Duct (400 CFM)"                 │
│           ──────────────────────                       │
│           [2 seconds display]                          │
│                                                        │
│  Redo #2: "Redo: Delete Note"                          │
│           ──────────────────                           │
│           [2 seconds display]                          │
│                                                        │
│  Redo #3: "Redo: Create Room C"                        │
│           ────────────────────                         │
│           [2 seconds display]                          │
│                                                        │
│  After sequence: "3 actions redone"                    │
│                  ─────────────────                     │
│                  [Summary message]                     │
└────────────────────────────────────────────────────────┘

Redo Button States
┌────────────────────────────────────────────────────────┐
│  Redo Available (stack not empty):                     │
│  ┌────────────────────────────┐                        │
│  │ [↪️ Redo Draw Duct]        │ ← Enabled, tooltip     │
│  └────────────────────────────┘                        │
│                                                        │
│  Redo Unavailable (stack empty):                       │
│  ┌────────────────────────────┐                        │
│  │ [↪️ Redo]                  │ ← Grayed out           │
│  └────────────────────────────┘                        │
│  Tooltip: "Nothing to redo"                            │
│                                                        │
│  During Redo Sequence:                                 │
│  ┌────────────────────────────┐                        │
│  │ [↪️ Redo (3 remaining)...]  │ ← Processing          │
│  └────────────────────────────┘                        │
│  Shows count of remaining redos                        │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/stores/historyStore.test.ts`

**Test Cases**:
- Redo single action from stack
- Redo multiple actions sequentially
- Redo throttling (max 5/second)
- Handle empty redo stack
- Clear redo stack on new action
- Command moved from redo to undo stack

**Assertions**:
- Command popped from redo stack
- Multiple redos execute in order
- Throttling limits rate to 200ms interval
- Empty stack returns no-op
- Redo stack cleared when new action added
- Command appears in undo stack after redo

---

### Integration Tests
**File**: `src/__tests__/integration/redo-multiple-sequential.test.ts`

**Test Cases**:
- Complete redo sequence (5 actions)
- Redo until stack exhausted
- Redo with cascading effects (group)
- Redo interrupted by new action
- Redo after undo to empty state
- Execution failure during redo

**Assertions**:
- All 5 actions restored correctly
- Redo stops at empty stack
- Group and members restored
- Redo stack cleared on new action
- Full design rebuilt from empty
- Failed command skipped, next redo continues

---

### E2E Tests
**File**: `e2e/undo-redo/redo-multiple-sequential.spec.ts`

**Test Cases**:
- Visual sequential redo with keyboard
- Entities appear in order
- Redo button disables at end
- Status bar updates with each redo
- Throttling visible (smooth updates)
- Hold key, see multiple redos

**Assertions**:
- Press Ctrl+Shift+Z, entity appears
- Each redo shows visual change
- Button grayed out when complete
- Status shows action descriptions
- Updates not too fast (throttled)
- Smooth sequential animation

---

## Common Pitfalls

### ❌ Don't: Execute redos without throttling
**Problem**: Rapid keypress causes 50 redos in 1 second, overwhelming UI

**Solution**: Throttle to max 5 redos/second (200ms interval)

---

### ❌ Don't: Forget to update undo stack after redo
**Problem**: Redo executes but command not added to undo stack, can't undo

**Solution**: Move command from redo stack to undo stack after execution

---

### ❌ Don't: Allow redo when stack is empty
**Problem**: Undefined behavior, potential crashes

**Solution**: Check redo stack not empty before executing

---

### ✅ Do: Clear redo stack when new action occurs
**Benefit**: Prevents invalid redo after branching history

---

### ✅ Do: Show visual feedback for each redo
**Benefit**: User sees progress, understands what's being redone

---

## Performance Tips

### Optimization: Batch Canvas Re-renders
**Problem**: 10 sequential redos trigger 10 re-renders, laggy

**Solution**: Batch updates, single re-render
- Queue all entity updates
- Apply in single transaction
- Re-render once at end
- 10x faster sequential redos

---

### Optimization: Async Redo Execution
**Problem**: Blocking UI during redo sequence

**Solution**: Execute redos asynchronously
- Use requestAnimationFrame
- Non-blocking execution
- Smooth 60fps updates
- Responsive UI

---

### Optimization: Skip Intermediate Renders
**Problem**: Rendering every step in 100 redos is slow

**Solution**: Render only every 10th redo
- Calculate all states
- Render milestones only
- Final state always rendered
- 10x faster bulk redo

---

## Future Enhancements

- **Redo Preview**: Preview next redo before executing
- **Bulk Redo Dialog**: "Redo next N actions" with confirmation
- **Redo Animation**: Smooth animated transitions between states
- **Selective Redo**: Choose specific actions to redo (non-sequential)
- **Redo Grouping**: Redo related actions as single operation
- **Redo Shortcuts**: Configurable keyboard shortcuts for redo
- **Redo Limit**: Set maximum redos per sequence
- **Redo Sound Effects**: Audio feedback for redo operations
- **Redo Progress Bar**: Visual indicator during long redo sequences
- **Smart Redo**: Skip irrelevant actions, redo only meaningful changes
