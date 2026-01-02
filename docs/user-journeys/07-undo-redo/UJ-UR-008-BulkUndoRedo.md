# [UJ-UR-008] Bulk Undo/Redo

## Overview

This user journey covers undoing or redoing multiple actions at once through a bulk operation dialog, enabling designers to jump to a specific historical state efficiently without sequential stepping.

## PRD References

- **FR-UR-008**: User shall be able to undo/redo multiple actions in bulk
- **US-UR-008**: As a designer, I want to undo/redo many actions at once so that I can quickly navigate to distant historical states
- **AC-UR-008-001**: Bulk undo dialog accessible via Edit menu or History panel
- **AC-UR-008-002**: Shows list of actions to undo/redo
- **AC-UR-008-003**: User selects number of actions (slider or input)
- **AC-UR-008-004**: Preview shows resulting state
- **AC-UR-008-005**: Confirm to execute bulk operation
- **AC-UR-008-006**: Single compound command for undo/redo

## Prerequisites

- User is in Canvas Editor
- History stack has multiple actions (minimum 3-5)
- User needs to navigate to distant historical state
- Bulk operation more efficient than sequential

## User Journey Steps

### Step 1: Open Bulk Undo Dialog

**User Action**: Click Edit → Bulk Undo (or right-click History panel → Bulk Undo)

**Expected Result**:
- Bulk Undo dialog opens:
  - Modal dialog (center of screen)
  - Blocks other interactions
  - **Title**: "Bulk Undo"
- Dialog contents:
  - **Action List**:
    - Shows undo stack actions
    - Current: Action #15
    - List of undoable actions (1-15):
      ```
      15. Draw Duct (500 CFM)         ← Most recent
      14. Resize Room B
      13. Create Room C
      12. Delete Note
      11. Draw Duct (400 CFM)
      10. Align 3 Entities
       9. Distribute 5 Entities
       8. Group Entities
       ... (older actions)
       1. Create Room A              ← Oldest
      ```
  - **Selection Control**:
    - Slider: "Undo last N actions"
    - Range: 1 to 15 (current stack size)
    - Current value: 5 (default)
    - Label: "Undo 5 actions"
  - **Selected Actions Preview**:
    - Highlighted: Actions 11-15 (will be undone)
    - Visual: Blue background
    - Clear indication of what will be undone
  - **Result State**:
    - "After undo: Action #10 (Align 3 Entities)"
    - Shows where you'll land
  - **Preview Canvas** (optional):
    - Thumbnail of canvas at action #10
    - Visual preview of result
  - **Buttons**:
    - [Undo] (primary)
    - [Cancel] (secondary)
- Status info:
  - Total actions: 15
  - Selected to undo: 5
  - Resulting position: #10

**Validation Method**: E2E test - Verify bulk undo dialog

---

### Step 2: Select Number of Actions to Undo

**User Action**: Drag slider to "10 actions" or type "10" in input field

**Expected Result**:
- Slider interaction:
  - Drag slider right
  - Value: 5 → 10
  - Smooth slider movement
- Input field updates:
  - Value: "10"
  - Synced with slider
  - Can type directly: Type "10", press Enter
- Action list updates:
  - Highlighted: Actions 6-15 (10 actions)
  - Visual: Blue background on selected range
  - Clear demarcation
- Result state updates:
  - "After undo: Action #5 (Rotate Equipment)"
  - New landing point
- Preview updates (optional):
  - Thumbnail refreshes
  - Shows canvas at action #5
  - Real-time preview
- Validation:
  - Range check: 1-15 (valid)
  - Min: 1 action
  - Max: 15 actions (entire stack)
  - Input validation for numbers only
- Buttons:
  - [Undo 10 Actions] - button text updates
  - [Cancel]

**Validation Method**: Integration test - Verify slider interaction

---

### Step 3: Review Preview and Confirm

**User Action**: Review preview, click "Undo 10 Actions"

**Expected Result**:
- User review:
  - See highlighted actions (6-15)
  - See result state (Action #5)
  - Optional: View preview canvas
  - Confirm intention
- Confirmation click:
  - User clicks [Undo 10 Actions]
  - Bulk operation triggered
- Dialog processing:
  - Show progress indicator (optional):
    - "Undoing 10 actions..."
    - Progress bar: 0% → 100%
    - Or: Spinner
  - Execute bulk undo
- Bulk undo execution:
  - Create `BulkUndoCommand`:
    - Contains 10 sub-commands
    - Actions 6-15
    - Single atomic operation
  - Execute sequential undo:
    - Undo action #15
    - Undo action #14
    - ... (in reverse order)
    - Undo action #6
  - Timing:
    - Fast execution (optimized)
    - 10 undos in <500ms
    - Batched updates
- Canvas update:
  - Entity store updated
  - All 10 changes applied
  - Single re-render (batched)
  - Canvas shows state at action #5
- History stack updates:
  - Undo stack: 15 → 5 actions
  - Redo stack: 0 → 10 actions
  - Current position: #15 → #5
- Dialog closes:
  - Success message: "10 actions undone"
  - Or: Silent close
  - Return to canvas
- Status bar:
  - "Bulk undo: 10 actions"

**Validation Method**: Integration test - Verify bulk undo execution

---

### Step 4: Open Bulk Redo Dialog

**User Action**: Click Edit → Bulk Redo (or right-click History → Bulk Redo)

**Expected Result**:
- Bulk Redo dialog opens:
  - Similar to Bulk Undo dialog
  - **Title**: "Bulk Redo"
- Dialog contents:
  - **Action List**:
    - Shows redo stack actions
    - Current: Action #5
    - List of redoable actions (6-15):
      ```
       6. Delete Duct 3            ← Next to redo
       7. Lock Room A
       8. Group Entities
       9. Distribute 5 Entities
      10. Align 3 Entities
      11. Draw Duct (400 CFM)
      12. Delete Note
      13. Create Room C
      14. Resize Room B
      15. Draw Duct (500 CFM)      ← Most recent undone
      ```
  - **Selection Control**:
    - Slider: "Redo next N actions"
    - Range: 1 to 10 (redo stack size)
    - Default: 5
  - **Result State**:
    - "After redo: Action #10 (Align 3 Entities)"
- Availability:
  - Only available if redo stack not empty
  - Grayed out if nothing to redo

**Validation Method**: E2E test - Verify bulk redo dialog

---

### Step 5: Execute Bulk Redo

**User Action**: Select "10 actions", click "Redo 10 Actions"

**Expected Result**:
- Bulk redo execution:
  - Create `BulkRedoCommand`
  - 10 sub-commands (actions 6-15)
  - Atomic operation
- Sequential redo:
  - Redo action #6
  - Redo action #7
  - ... (in forward order)
  - Redo action #15
- Canvas update:
  - All 10 changes restored
  - Single batched re-render
  - Canvas shows state at action #15
  - Full restoration
- History stack updates:
  - Undo stack: 5 → 15 actions
  - Redo stack: 10 → 0 actions
  - Current position: #5 → #15
- Dialog closes:
  - Success message: "10 actions redone"
  - Return to canvas
- Final state:
  - Back at latest state
  - All work restored
  - Redo stack empty
- Status bar:
  - "Bulk redo: 10 actions"

**Validation Method**: Integration test - Verify bulk redo execution

---

## Edge Cases

### 1. Bulk Undo to Empty Canvas (Undo All)

**User Action**: Select all 15 actions to undo (entire stack)

**Expected Behavior**:
- Selection:
  - Slider: Max value (15)
  - All actions selected
  - Result: Action #0 (empty canvas)
- Preview shows:
  - "After undo: Empty canvas"
  - Thumbnail: Blank canvas
  - Warning: "This will remove all work"
- Confirmation dialog:
  - "Undo all actions? This will clear the entire design."
  - [Undo All] [Cancel]
  - Extra confirmation for destructive action
- Execution:
  - All 15 actions undone
  - Canvas: Completely empty
  - Undo stack: Empty
  - Redo stack: 15 actions
- Use case:
  - Start over from scratch
  - Review design evolution
  - Undo everything by mistake (can redo)

**Validation Method**: Integration test - Verify undo all

---

### 2. Bulk Undo with Grouped Commands

**User Action**: Bulk undo 10 actions including grouped command

**Expected Behavior**:
- Grouped command:
  - Action #8: "Align 3 Entities"
  - Contains 3 sub-commands (one per entity)
  - Displayed as single action
- Bulk undo:
  - Action #8 undone as single unit
  - All 3 entities un-aligned together
  - Atomic operation
- Counting:
  - Action #8 counts as 1 action (not 3)
  - Bulk undo of 10 = 10 top-level actions
  - Sub-commands included
- Result:
  - Grouped command fully reversed
  - Maintains atomicity
  - Consistent behavior

**Validation Method**: Integration test - Verify grouped command handling

---

### 3. Bulk Undo/Redo with Preview Rendering

**User Action**: Slide through different undo counts, see live preview

**Expected Behavior**:
- Slider interaction:
  - User drags slider: 1 → 2 → 3 → 5 → 10
  - Each stop triggers preview update
- Preview rendering:
  - Debounced update: 300ms after slider stops
  - Calculate state at selected position
  - Render preview canvas (small)
- Performance:
  - Preview: Low-resolution render
  - Fast calculation
  - No lag during slider drag
- Visual feedback:
  - User sees what canvas will look like
  - Helps decision-making
  - Confidence before confirming
- Implementation:
  - Clone entity state
  - Apply undo sequence (in memory)
  - Render to offscreen canvas
  - Display thumbnail

**Validation Method**: Performance test - Verify preview rendering

---

### 4. Canceling Bulk Operation Mid-Execution

**User Action**: Start bulk undo of 100 actions, cancel halfway

**Expected Behavior**:
- Bulk operation started:
  - Processing: 50 of 100 actions
  - Progress: 50%
  - Still executing
- User clicks [Cancel]:
  - During execution
  - Wants to abort
- Handling:
  - **Option A (Complete)**: Finish current batch
    - Can't stop mid-execution
    - Complete all 100
    - Or: Complete current 50, stop
  - **Option B (Rollback)**: Rollback partial
    - Undo the 50 already done
    - Return to starting state
    - Complex implementation
- Default: Option A (complete current batch)
- Rationale:
  - Partial undo creates inconsistent state
  - Better to complete or rollback fully
- Alternative: Disable cancel during execution
  - [Cancel] button: Disabled
  - Must wait for completion
  - Prevents partial states

**Validation Method**: Integration test - Verify cancel handling

---

### 5. Bulk Operation Exceeds Memory Limit

**User Action**: Bulk undo 500 actions, memory limit reached

**Expected Behavior**:
- Large bulk operation:
  - 500 actions selected
  - Memory usage: High
  - Potentially exceeds limit
- Memory check:
  - Estimate memory required
  - If exceeds limit: Warn user
- Warning dialog:
  - "Large operation may use significant memory"
  - "Recommend undoing in smaller batches (100 at a time)"
  - [Proceed Anyway] [Cancel]
- Execution with monitoring:
  - Process in batches of 50
  - Monitor memory
  - Pause if approaching limit
  - GC between batches
- Progressive update:
  - Show progress: "250 of 500 actions..."
  - User sees it's working
  - Can cancel if too slow
- Completion:
  - All 500 actions undone
  - May take 5-10 seconds
  - Canvas updates at end

**Validation Method**: Performance test - Verify large bulk operations

---

## Error Scenarios

### 1. Bulk Undo Includes Failed Command

**Scenario**: Bulk undo 10 actions, action #7 fails to undo

**Expected Handling**:
- Execution sequence:
  - Undo #15: Success
  - Undo #14: Success
  - ...
  - Undo #7: FAILS (error during undo)
- Error handling:
  - Log error: "Failed to undo action #7"
  - **Option A (Stop)**: Stop at failure
    - Undo actions 15-8
    - Skip #7
    - Stop bulk operation
    - Current: Action #8
  - **Option B (Skip)**: Skip failed, continue
    - Skip action #7
    - Continue with #6-#1
    - Current: Action #5 (skipping #7)
  - **Option C (Rollback)**: Rollback all
    - Redo actions 15-8
    - Return to starting state (#15)
    - Report failure
- Default: Option A (stop at failure)
- User notification:
  - Error dialog: "Bulk undo stopped at action #7"
  - Details: Error message
  - [OK] [Retry] [Skip and Continue]
- Recovery:
  - User can manually handle action #7
  - Continue with remaining actions
  - Or: Redo to restore

**Validation Method**: Unit test - Verify error handling

---

### 2. Concurrent Modification During Bulk Operation

**Scenario**: Autosave triggers during bulk undo

**Expected Handling**:
- Bulk operation in progress:
  - Undoing 50 of 100 actions
  - Autosave timer expires
  - Concurrent operations
- Locking:
  - Bulk operation: Locks history
  - Autosave: Waits for lock
  - Sequential execution
- Alternative: Allow concurrent
  - Bulk operation: Updates store
  - Autosave: Snapshots current state
  - No blocking
- Default: Lock during bulk operation
  - Ensures atomic operation
  - Prevents inconsistent snapshots
- Duration:
  - Bulk operation: 1-2 seconds
  - Acceptable delay for autosave
  - No user impact

**Validation Method**: Integration test - Verify locking

---

### 3. Bulk Redo After History Branch

**Scenario**: Bulk redo attempted but new actions created (branch)

**Expected Handling**:
- Scenario:
  - Undo 10 actions (redo stack: 10)
  - Create new action (redo stack: cleared)
  - Try to bulk redo (no redo stack)
- Bulk Redo dialog:
  - Redo stack: Empty
  - No actions to redo
  - Dialog: Disabled/grayed
- User feedback:
  - "No actions to redo"
  - Or: Dialog doesn't open
  - Edit menu: Bulk Redo (grayed)
- Prevention:
  - Check redo stack before opening dialog
  - Only allow if redo available
  - Clear UI indication

**Validation Method**: Unit test - Verify empty redo stack

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Bulk Undo Dialog | `Ctrl/Cmd + Alt + Z` |
| Open Bulk Redo Dialog | `Ctrl/Cmd + Alt + Shift + Z` |
| Confirm Bulk Operation | `Enter` (in dialog) |
| Cancel Bulk Operation | `Escape` (in dialog) |
| Increase Count | `↑` (in dialog) |
| Decrease Count | `↓` (in dialog) |

---

## Related Elements

- [BulkUndoCommand](../../elements/09-commands/BulkUndoCommand.md) - Bulk undo logic
- [BulkRedoCommand](../../elements/09-commands/BulkRedoCommand.md) - Bulk redo logic
- [BulkOperationDialog](../../elements/01-components/dialogs/BulkOperationDialog.md) - Dialog UI
- [historyStore](../../elements/02-stores/historyStore.md) - History management
- [UJ-UR-006](./UJ-UR-006-ViewHistory.md) - History viewing
- [UJ-UR-003](./UJ-UR-003-UndoMultipleActions.md) - Sequential undo

---

## Visual Diagram

```
Bulk Undo Dialog
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────┐      │
│  │ Bulk Undo                               [X]  │      │
│  ├──────────────────────────────────────────────┤      │
│  │ Select number of actions to undo:           │      │
│  │                                              │      │
│  │ [▬▬▬▬▬▬▬▬░░░░░░░] 10 actions                │      │
│  │ 1                              15           │      │
│  │                                              │      │
│  │ Actions to undo:                             │      │
│  │ ┌──────────────────────────────────────┐    │      │
│  │ │ 15. Draw Duct (500 CFM)      ✓       │    │      │
│  │ │ 14. Resize Room B            ✓       │    │      │
│  │ │ 13. Create Room C            ✓       │    │      │
│  │ │ 12. Delete Note              ✓       │    │      │
│  │ │ 11. Draw Duct (400 CFM)      ✓       │    │      │
│  │ │ 10. Align 3 Entities         ✓       │    │      │
│  │ │  9. Distribute 5 Entities    ✓       │    │      │
│  │ │  8. Group Entities            ✓       │    │      │
│  │ │  7. Lock Room A              ✓       │    │      │
│  │ │  6. Copy Format A→B          ✓       │    │      │
│  │ │  5. Rotate Equipment          -       │    │      │
│  │ │  ... (3 more)                 -       │    │      │
│  │ └──────────────────────────────────────┘    │      │
│  │                                              │      │
│  │ After undo: Action #5 (Rotate Equipment)    │      │
│  │                                              │      │
│  │ Preview: [Mini canvas thumbnail]             │      │
│  │                                              │      │
│  │         [Undo 10 Actions]  [Cancel]          │      │
│  └──────────────────────────────────────────────┘      │
│                                                        │
│  ✓ = Selected to undo (highlighted)                    │
│  - = Not selected (normal)                             │
└────────────────────────────────────────────────────────┘

Bulk Redo Dialog
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────┐      │
│  │ Bulk Redo                               [X]  │      │
│  ├──────────────────────────────────────────────┤      │
│  │ Select number of actions to redo:           │      │
│  │                                              │      │
│  │ [▬▬▬▬▬░░░░░░░░░░] 5 actions                 │      │
│  │ 1                              10           │      │
│  │                                              │      │
│  │ Actions to redo:                             │      │
│  │ ┌──────────────────────────────────────┐    │      │
│  │ │  6. Delete Duct 3            ✓       │    │      │
│  │ │  7. Lock Room A              ✓       │    │      │
│  │ │  8. Group Entities            ✓       │    │      │
│  │ │  9. Distribute 5 Entities    ✓       │    │      │
│  │ │ 10. Align 3 Entities         ✓       │    │      │
│  │ │ 11. Draw Duct (400 CFM)       -       │    │      │
│  │ │ 12. Delete Note               -       │    │      │
│  │ │ 13. Create Room C             -       │    │      │
│  │ │ 14. Resize Room B             -       │    │      │
│  │ │ 15. Draw Duct (500 CFM)       -       │    │      │
│  │ └──────────────────────────────────────┘    │      │
│  │                                              │      │
│  │ After redo: Action #10 (Align 3 Entities)   │      │
│  │                                              │      │
│  │         [Redo 5 Actions]  [Cancel]           │      │
│  └──────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────┘

Bulk Operation Execution Flow
┌────────────────────────────────────────────────────────┐
│  1. User Opens Dialog                                  │
│     [Edit → Bulk Undo]                                 │
│     ↓                                                  │
│  2. Dialog Displays Options                            │
│     - Slider: Select count                             │
│     - List: Show actions                               │
│     - Preview: Show result                             │
│     ↓                                                  │
│  3. User Selects 10 Actions                            │
│     Slider: 1 → 10                                     │
│     Highlighted: Actions 6-15                          │
│     ↓                                                  │
│  4. User Confirms                                      │
│     Click [Undo 10 Actions]                            │
│     ↓                                                  │
│  5. Bulk Undo Executes                                 │
│     Progress: "Undoing 10 actions..."                  │
│     ┌─────────────────────────────┐                    │
│     │ [▬▬▬▬▬▬▬▬░░░░░░] 80%        │                    │
│     └─────────────────────────────┘                    │
│     ↓                                                  │
│  6. Completion                                         │
│     Dialog closes                                      │
│     Canvas updated                                     │
│     Status: "10 actions undone"                        │
└────────────────────────────────────────────────────────┘

Slider Interaction with Preview
┌────────────────────────────────────────────────────────┐
│  Slider Position: 3 actions                            │
│  ┌──────────────────────────────────────────────┐      │
│  │ [▬▬▬░░░░░░░░░░░░] 3                          │      │
│  │                                              │      │
│  │ Preview:                                     │      │
│  │ ┌────────────┐                               │      │
│  │ │ [Canvas at │                               │      │
│  │ │  Action 12]│ ← Shows result                │      │
│  │ └────────────┘                               │      │
│  └──────────────────────────────────────────────┘      │
│                                                        │
│  ↓ Drag slider to 8                                    │
│                                                        │
│  Slider Position: 8 actions                            │
│  ┌──────────────────────────────────────────────┐      │
│  │ [▬▬▬▬▬▬▬▬░░░░░░░] 8                          │      │
│  │                                              │      │
│  │ Preview:                                     │      │
│  │ ┌────────────┐                               │      │
│  │ │ [Canvas at │                               │      │
│  │ │  Action 7] │ ← Updates automatically       │      │
│  │ └────────────┘                               │      │
│  └──────────────────────────────────────────────┘      │
│                                                        │
│  Live preview as slider moves                          │
│  Debounced update (300ms after stop)                   │
└────────────────────────────────────────────────────────┘

History Stack Changes (Bulk Undo)
┌────────────────────────────────────────────────────────┐
│  Before Bulk Undo:                                     │
│  Undo Stack (15)      Current      Redo Stack (0)     │
│  [Actions 1-15] ────────●                              │
│                     Action #15       Empty             │
│                                                        │
│  ↓ Bulk Undo: 10 actions                               │
│                                                        │
│  After Bulk Undo:                                      │
│  Undo Stack (5)       Current      Redo Stack (10)    │
│  [Actions 1-5] ────────●──────── [Actions 6-15]       │
│                     Action #5                          │
│                                                        │
│  - Undo stack: 15 → 5 actions                          │
│  - Redo stack: 0 → 10 actions                          │
│  - Current position: #15 → #5                          │
│  - 10 actions moved from undo to redo                  │
└────────────────────────────────────────────────────────┘

Progress Indicator During Execution
┌────────────────────────────────────────────────────────┐
│  Bulk Undo in Progress:                                │
│  ┌──────────────────────────────────────────────┐      │
│  │ Undoing 10 actions...                        │      │
│  │                                              │      │
│  │ Progress: 7 of 10 complete (70%)             │      │
│  │ ┌──────────────────────────────────────┐     │      │
│  │ │ [▬▬▬▬▬▬▬▬▬▬▬▬▬▬░░░░░░░] 70%         │     │      │
│  │ └──────────────────────────────────────┘     │      │
│  │                                              │      │
│  │ Current: Undoing "Group Entities"            │      │
│  │                                              │      │
│  │              [Cancel]                        │      │
│  └──────────────────────────────────────────────┘      │
│                                                        │
│  Shows real-time progress                              │
│  User sees it's working                                │
│  Can cancel if needed                                  │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/BulkUndoCommand.test.ts`

**Test Cases**:
- Create bulk undo command with N actions
- Execute bulk undo
- Undo bulk undo (redo all)
- Handle execution failure mid-bulk
- Validate action count range

**Assertions**:
- Bulk command contains N sub-commands
- All N actions undone in order
- Single undo restores all N actions
- Failed action stops or skips gracefully
- Count within valid range (1 to stack size)

---

### Integration Tests
**File**: `src/__tests__/integration/bulk-undo-redo.test.ts`

**Test Cases**:
- Complete bulk undo workflow
- Complete bulk redo workflow
- Bulk undo to empty canvas (all actions)
- Bulk operation with grouped commands
- Large bulk operation (100+ actions)
- Cancel bulk operation

**Assertions**:
- Canvas state matches selected action
- All selected actions reversed
- Entire stack can be undone
- Grouped commands handled atomically
- Large operation completes successfully
- Cancel stops or completes current batch

---

### E2E Tests
**File**: `e2e/undo-redo/bulk-undo-redo.spec.ts`

**Test Cases**:
- Open bulk undo dialog visually
- Slider interaction updates preview
- Confirm bulk undo, see canvas change
- Open bulk redo dialog
- Bulk redo restores state
- Progress bar during execution

**Assertions**:
- Dialog opens centered
- Slider moves smoothly, preview updates
- Canvas changes to selected state
- Redo dialog shows redo stack
- Canvas returns to later state
- Progress indicator visible

---

## Common Pitfalls

### ❌ Don't: Execute bulk operation without batching
**Problem**: 100 individual undos, 100 re-renders, very slow

**Solution**: Batch all updates, single re-render at end

---

### ❌ Don't: Allow bulk operation on empty stack
**Problem**: Undefined behavior, potential crash

**Solution**: Check stack not empty, disable dialog if empty

---

### ❌ Don't: Forget to update history stacks
**Problem**: Actions undone but stacks not updated, inconsistent state

**Solution**: Move commands between undo/redo stacks during bulk operation

---

### ✅ Do: Show preview of resulting state
**Benefit**: User confident about bulk operation outcome

---

### ✅ Do: Provide progress indicator for large operations
**Benefit**: User knows operation is working, not frozen

---

## Performance Tips

### Optimization: Batch Entity Updates
**Problem**: 100 undos = 100 entity store updates = slow

**Solution**: Batch all updates into single transaction
- Collect all entity changes
- Apply in one operation
- Single re-render
- 100x faster

---

### Optimization: Lazy Preview Rendering
**Problem**: Rendering preview for every slider position is slow

**Solution**: Debounce preview updates
- Update only after slider stops (300ms)
- Skip intermediate positions
- Render final preview only
- 10x fewer renders

---

### Optimization: Offscreen Preview Canvas
**Problem**: Full canvas render for preview is expensive

**Solution**: Render to small offscreen canvas
- Lower resolution (e.g., 400×300)
- Skip details
- Fast render
- Sufficient for preview

---

## Future Enhancements

- **Smart Bulk Undo**: Auto-select related actions to undo together
- **Bulk Operation Presets**: Save common bulk operations (e.g., "Undo last hour")
- **Bulk Undo by Time**: "Undo all actions in last 10 minutes"
- **Bulk Undo by Type**: "Undo all 'Create Room' actions"
- **Bulk Undo by Entity**: "Undo all actions affecting Room A"
- **Visual Timeline**: Graphical timeline with drag-to-select range
- **Bulk Operation Macros**: Record and replay bulk undo/redo sequences
- **Differential Preview**: Side-by-side before/after comparison
- **Async Bulk Operation**: Background execution with cancellation
- **Bulk Operation History**: Track bulk operations for auditing
