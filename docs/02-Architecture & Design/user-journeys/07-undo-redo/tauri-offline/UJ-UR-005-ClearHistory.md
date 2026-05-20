# [UJ-UR-005] Clear History

## Overview

This user journey covers clearing the undo/redo history stack to free memory and start fresh, including confirmation dialogs, selective clearing options, and implications for the current design state.

## PRD References

- **FR-UR-005**: User shall be able to clear undo/redo history
- **US-UR-005**: As a designer, I want to clear history so that I can free memory and reduce project size
- **AC-UR-005-001**: Edit menu provides "Clear History" command
- **AC-UR-005-002**: Confirmation dialog warns about losing undo capability
- **AC-UR-005-003**: History cleared without affecting current design state
- **AC-UR-005-004**: Undo/redo buttons disabled after clearing
- **AC-UR-005-005**: Memory freed from command objects
- **AC-UR-005-006**: Option to clear only redo stack or both stacks

## Prerequisites

- User is in Canvas Editor
- Undo/redo history contains actions (not empty)
- User wants to free memory or reset history
- Project has been saved (recommended before clearing)

## User Journey Steps

### Step 1: Current History State (Before Clear)

**User Action**: (Starting state - user has performed many operations)

**Expected Result**:
- History stack populated:
  - Undo stack: 50 commands (create, edit, delete operations)
  - Redo stack: 10 commands (previously undone actions)
  - Total: 60 command objects in memory
- Memory usage:
  - Each command stores entity data for undo
  - Total history size: ~5MB (estimated)
  - Significant memory footprint for large projects
- Undo/redo availability:
  - Undo button enabled: "Undo Delete Room"
  - Redo button enabled: "Redo Create Duct"
  - Can navigate 50 steps back, 10 steps forward
- Current design state:
  - 100 entities on canvas
  - All entities result of 50 actions
  - Design complete and saved

**Validation Method**: Unit test - Verify history stack populated

---

### Step 2: Initiate Clear History

**User Action**: Click Edit menu → "Clear History"

**Expected Result**:
- Clear History command triggered
- Pre-clear validation:
  - Check history not empty: `undoStack.length + redoStack.length > 0`
  - History exists to clear
- Confirmation dialog appears:
  - **Title**: "Clear Undo/Redo History?"
  - **Message**: "This will clear all undo and redo actions. You will not be able to undo or redo any previous changes. The current design state will not be affected."
  - **Warning**: "⚠️ This action cannot be undone."
  - **Details**:
    - "Undo actions: 50"
    - "Redo actions: 10"
    - "Memory to be freed: ~5MB"
  - **Options** (checkboxes):
    - ☐ "Clear undo stack only (keep redo)"
    - ☐ "Clear redo stack only (keep undo)"
    - ☑ "Clear both stacks" (default)
  - **Buttons**:
    - "Clear History" (destructive, red)
    - "Cancel" (default on Escape)
- Dialog modal (blocks other actions)
- User must explicitly confirm
- Prevents accidental history loss

**Validation Method**: E2E test - Verify confirmation dialog appears

---

### Step 3: User Confirms Clear

**User Action**: Click "Clear History" button in dialog

**Expected Result**:
- User confirmation received
- Clear option: "Clear both stacks" selected
- History clearing initiated:
  - Status bar: "Clearing history..."
  - Brief processing indicator
- Undo stack cleared:
  - All 50 commands removed
  - Array emptied: `undoStack = []`
  - Command objects dereferenced
- Redo stack cleared:
  - All 10 commands removed
  - Array emptied: `redoStack = []`
  - Command objects dereferenced
- History state reset:
  - Undo stack size: 0
  - Redo stack size: 0
  - Current position: 0 (beginning)
- Memory freed:
  - Command objects eligible for garbage collection
  - ~5MB memory reclaimed (after GC)
  - Reduced memory footprint

**Validation Method**: Integration test - Verify history stacks cleared

---

### Step 4: Update UI State

**User Action**: (Automatic)

**Expected Result**:
- Undo/redo buttons updated:
  - Undo button disabled (grayed out)
  - Redo button disabled (grayed out)
  - Tooltips: "Nothing to undo" / "Nothing to redo"
- Menu items updated:
  - Edit → Undo (disabled)
  - Edit → Redo (disabled)
  - Edit → Clear History (disabled - nothing to clear)
- Status bar confirmation:
  - "History cleared" (brief, 2 seconds)
  - Then returns to default
- Keyboard shortcuts inactive:
  - Ctrl/Cmd+Z: No action (no undo available)
  - Ctrl/Cmd+Shift+Z: No action (no redo available)
- History panel (if visible):
  - Shows empty state
  - Message: "History is empty"
  - No actions listed
- Canvas state unchanged:
  - All 100 entities remain on canvas
  - No visual changes
  - Design intact

**Validation Method**: E2E test - Verify UI updates after clear

---

### Step 5: Continue Working After Clear

**User Action**: Create new room entity

**Expected Result**:
- New action performed
- New command created: `CreateRoomCommand`
- History starts fresh:
  - Undo stack: [CreateRoomCommand]
  - Redo stack: [] (empty)
  - History size: 1 action
- Undo/redo availability:
  - Undo button enabled: "Undo Create Room"
  - Redo button disabled (no redos yet)
- Previous history lost:
  - Cannot undo previous 50 actions
  - Those operations permanently forgotten
  - Only new actions since clear are undoable
- Normal workflow resumes:
  - History accumulates from this point
  - Undo/redo work as expected
  - Fresh start for history tracking

**Validation Method**: Integration test - Verify new history after clear

---

## Edge Cases

### 1. Clear Undo Stack Only

**User Action**: In confirmation dialog, select "Clear undo stack only", confirm

**Expected Behavior**:
- Selective clear option chosen
- Undo stack cleared:
  - All 50 undo commands removed
  - `undoStack = []`
- Redo stack preserved:
  - 10 redo commands remain
  - Can still redo previously undone actions
- UI state:
  - Undo button disabled (nothing to undo)
  - Redo button enabled: "Redo Create Duct"
- Use case:
  - Free memory from undo operations
  - Preserve ability to redo
  - Partial history clearing
- Next action:
  - New action clears redo stack (standard behavior)
  - History accumulates fresh undo actions

**Validation Method**: Unit test - Verify selective undo stack clear

---

### 2. Clear Redo Stack Only

**User Action**: In confirmation dialog, select "Clear redo stack only", confirm

**Expected Behavior**:
- Selective clear option chosen
- Redo stack cleared:
  - All 10 redo commands removed
  - `redoStack = []`
- Undo stack preserved:
  - 50 undo commands remain
  - Can still undo previous actions
- UI state:
  - Undo button enabled: "Undo Delete Room"
  - Redo button disabled (nothing to redo)
- Use case:
  - Commit to current state (no more redo)
  - Free redo memory
  - Keep undo capability
- Behavior:
  - Same as performing new action (clears redo)
  - But explicit and intentional

**Validation Method**: Unit test - Verify selective redo stack clear

---

### 3. Clear Empty History

**User Action**: Attempt to clear history when both stacks already empty

**Expected Behavior**:
- Edit → Clear History menu item:
  - Grayed out (disabled)
  - Tooltip: "History is already empty"
- If somehow triggered (programmatically):
  - No-op (nothing to clear)
  - No confirmation dialog
  - Status: "History already empty"
- Prevents unnecessary operations
- User feedback avoids confusion

**Validation Method**: Unit test - Verify empty history handling

---

### 4. Clear During Active Operation

**User Action**: While drawing duct, clear history

**Expected Behavior**:
- Drawing operation in progress
- Clear History triggered
- Active operation state:
  - Drawing state independent of history
  - Duct start point preserved
  - Tool state maintained
- History cleared:
  - Undo/redo stacks emptied
  - Previous actions cannot be undone
- Complete drawing:
  - Finish drawing duct
  - New duct created successfully
  - Create command added to fresh history
- Workflow uninterrupted:
  - Can clear history mid-operation
  - Active tool not affected

**Validation Method**: Integration test - Verify clear preserves tool state

---

### 5. Clear After Project Save

**User Action**: Save project, then clear history

**Expected Behavior**:
- Project saved to disk:
  - All entity data persisted
  - File contains current design state
  - No undo/redo data in file (history not saved)
- Clear history:
  - Undo/redo stacks cleared in memory
  - Saved file unchanged
- Best practice workflow:
  - Save before clearing (safety)
  - Clearing doesn't affect saved state
  - Can reload project if needed
- Continue working:
  - New changes create fresh history
  - Must save again to persist new changes

**Validation Method**: Integration test - Verify clear after save

---

## Error Scenarios

### 1. Memory Leak During Clear

**Scenario**: Cleared commands not garbage collected (memory leak)

**Expected Handling**:
- History cleared from arrays
- Command objects should be GC'd
- Memory monitoring detects retained objects
- Investigation:
  - Check for circular references
  - Ensure all references removed
  - Explicit cleanup in command destructor
- Fix:
  - Break circular references
  - Explicit `command.dispose()` method
  - Set command properties to null
- Long-term monitoring:
  - Track memory after clear
  - Alert if memory not freed

**Validation Method**: Performance test - Verify memory freed after clear

---

### 2. Clear During Auto-Save

**Scenario**: User clears history while auto-save writing file

**Expected Handling**:
- Clear operation independent of save:
  - Clear updates in-memory history
  - Save writes entity data to disk
  - No conflict
- Both complete successfully:
  - History cleared in memory
  - Save completes normally
- No data corruption:
  - Saved file contains entities (not history)
  - History not persisted anyway
- Safe concurrent operations

**Validation Method**: Integration test - Verify clear during background save

---

### 3. Clear Confirmation Interrupted

**Scenario**: User opens clear dialog, then closes browser/app before confirming

**Expected Handling**:
- Confirmation dialog open
- Browser/app closed
- Dialog dismissed automatically
- History NOT cleared:
  - No confirmation received
  - Stacks remain intact
  - Safe default (preserve history)
- On app restart:
  - History not persisted (doesn't reload)
  - Starts with empty history anyway
  - No issue

**Validation Method**: Unit test - Verify dialog dismissal cancels clear

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Clear History | None (menu only, intentionally no shortcut) |
| Undo (if available) | `Ctrl/Cmd + Z` |
| Redo (if available) | `Ctrl/Cmd + Shift + Z` |

Note: No keyboard shortcut for Clear History to prevent accidental triggering.

---

## Related Elements

- [HistoryStore](../../elements/09-commands/HistoryStore.md) - Undo/redo stack management
- [ClearHistoryDialog](../../elements/01-components/dialogs/ClearHistoryDialog.md) - Confirmation dialog
- [EditMenu](../../elements/01-components/menus/EditMenu.md) - Clear History menu item
- [CommandPattern](../../elements/09-commands/CommandPattern.md) - Command objects
- [UJ-UR-001](./UJ-UR-001-UndoLastAction.md) - Undo functionality
- [UJ-UR-002](./UJ-UR-002-RedoLastUndoneAction.md) - Redo functionality

---

## Visual Diagram

```
Clear History Flow
┌────────────────────────────────────────────────────────┐
│  1. User Triggers Clear History                       │
│     Edit → Clear History                              │
│     ↓                                                  │
│  2. Confirmation Dialog                               │
│     ┌──────────────────────────────────────────────┐  │
│     │ Clear Undo/Redo History?                 [×] │  │
│     │ ──────────────────────────────────────────── │  │
│     │                                              │  │
│     │ This will clear all undo and redo actions.  │  │
│     │ You will not be able to undo or redo any    │  │
│     │ previous changes.                            │  │
│     │                                              │  │
│     │ ⚠️ This action cannot be undone.            │  │
│     │                                              │  │
│     │ Undo actions: 50                             │  │
│     │ Redo actions: 10                             │  │
│     │ Memory to be freed: ~5MB                     │  │
│     │                                              │  │
│     │ Options:                                     │  │
│     │ ☐ Clear undo stack only                     │  │
│     │ ☐ Clear redo stack only                     │  │
│     │ ☑ Clear both stacks (default)               │  │
│     │                                              │  │
│     │                  [Cancel] [Clear History]    │  │
│     └──────────────────────────────────────────────┘  │
│     ↓ User clicks "Clear History"                     │
│  3. Clear Stacks                                      │
│     undoStack = []                                    │
│     redoStack = []                                    │
│     ↓                                                  │
│  4. Update UI                                         │
│     - Undo button: Disabled                           │
│     - Redo button: Disabled                           │
│     - Status: "History cleared"                       │
│     ↓                                                  │
│  5. Memory Freed                                      │
│     ~5MB reclaimed (after GC)                         │
└────────────────────────────────────────────────────────┘

History State Before/After Clear:
┌────────────────────────────────────────────────────────┐
│  Before Clear:                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Undo Stack (50 commands):                       │  │
│  │ [CreateRoom, DeleteDuct, MoveEquip, ...]        │  │
│  │ Memory: ~4MB                                     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Redo Stack (10 commands):                       │  │
│  │ [CreateNote, ResizeRoom, ...]                   │  │
│  │ Memory: ~1MB                                     │  │
│  └──────────────────────────────────────────────────┘  │
│  Total: 60 commands, ~5MB                              │
│                                                        │
│  ↓ Clear Both Stacks                                   │
│                                                        │
│  After Clear:                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Undo Stack: []                                   │  │
│  │ Memory: 0 bytes                                  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Redo Stack: []                                   │  │
│  │ Memory: 0 bytes                                  │  │
│  └──────────────────────────────────────────────────┘  │
│  Total: 0 commands, 0 bytes                            │
│  ~5MB freed (after garbage collection)                 │
└────────────────────────────────────────────────────────┘

Selective Clear Options:
┌────────────────────────────────────────────────────────┐
│  Option 1: Clear Both Stacks (Default)                 │
│  Before:                                               │
│  Undo: [50 commands]  Redo: [10 commands]              │
│  After:                                                │
│  Undo: []             Redo: []                         │
│  Result: Full clear, fresh start                       │
│                                                        │
│  Option 2: Clear Undo Only                             │
│  Before:                                               │
│  Undo: [50 commands]  Redo: [10 commands]              │
│  After:                                                │
│  Undo: []             Redo: [10 commands]              │
│  Result: Can still redo, no undo                       │
│                                                        │
│  Option 3: Clear Redo Only                             │
│  Before:                                               │
│  Undo: [50 commands]  Redo: [10 commands]              │
│  After:                                                │
│  Undo: [50 commands]  Redo: []                         │
│  Result: Can still undo, no redo                       │
└────────────────────────────────────────────────────────┘

UI State Changes:
┌────────────────────────────────────────────────────────┐
│  Before Clear:                                         │
│  Toolbar:                                              │
│  [↶ Undo] [↷ Redo] [Clear History]                    │
│   Enabled   Enabled    Enabled                        │
│                                                        │
│  Edit Menu:                                            │
│  ✓ Undo Delete Room        Ctrl+Z                     │
│  ✓ Redo Create Duct        Ctrl+Shift+Z               │
│  ─────────────────────────────────                    │
│  ✓ Clear History...                                   │
│                                                        │
│  After Clear:                                          │
│  Toolbar:                                              │
│  [↶ Undo] [↷ Redo] [Clear History]                    │
│   Disabled  Disabled   Disabled                        │
│                                                        │
│  Edit Menu:                                            │
│  ✗ Undo                    Ctrl+Z                     │
│  ✗ Redo                    Ctrl+Shift+Z               │
│  ─────────────────────────────────                    │
│  ✗ Clear History...                                   │
│                                                        │
│  (All history-related actions disabled)                │
└────────────────────────────────────────────────────────┘

Memory Impact:
┌────────────────────────────────────────────────────────┐
│  Command Object Memory (Example):                      │
│                                                        │
│  CreateRoomCommand {                                   │
│    entityId: "room-123",                               │
│    entityData: {                                       │
│      ... (full room object: ~100 bytes)                │
│    }                                                   │
│  }                                                     │
│  Size per command: ~100-500 bytes                      │
│                                                        │
│  50 undo commands × 200 bytes avg = 10 KB              │
│  But entity data can be large:                         │
│  - Complex entities: 1-10 KB each                      │
│  - Total for 50 commands: 50-500 KB                    │
│  - Add redo stack: 10-100 KB                           │
│  - Realistic total: 0.5-5 MB                           │
│                                                        │
│  Memory freed after clear:                             │
│  Immediate: Stacks emptied (references removed)        │
│  After GC: Command objects collected (~0.5-5 MB)       │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/HistoryStore.clear.test.ts`

**Test Cases**:
- Clear both stacks
- Clear undo stack only
- Clear redo stack only
- Clear empty history (no-op)
- UI state after clear
- Memory references removed

**Assertions**:
- Undo stack length === 0 after clear
- Redo stack length === 0 after clear
- Selective clear preserves chosen stack
- No action on already empty history
- Undo/redo buttons disabled
- Command objects dereferenced

---

### Integration Tests
**File**: `src/__tests__/integration/clear-history.test.ts`

**Test Cases**:
- Complete clear workflow
- New history after clear
- Clear during active operation
- Clear after project save
- Memory freed after clear
- Confirmation dialog interaction

**Assertions**:
- History fully cleared
- New actions create fresh history
- Tool state preserved during clear
- Saved file unaffected by clear
- Memory usage decreases after GC
- Dialog dismissal cancels clear

---

### E2E Tests
**File**: `e2e/undo-redo/clear-history.spec.ts`

**Test Cases**:
- Visual clear history dialog
- Confirmation required to clear
- Undo/redo buttons disabled after clear
- Status bar confirmation message
- Menu item disabled after clear
- New action creates new history

**Assertions**:
- Dialog appears with warning message
- Must click "Clear History" to confirm
- Buttons grayed out after clear
- Status shows "History cleared"
- Edit menu items disabled
- New action enables undo button

---

## Common Pitfalls

### ❌ Don't: Clear history without confirmation
**Problem**: Accidental clear loses all undo capability

**Solution**: Require explicit confirmation with warning dialog

---

### ❌ Don't: Clear history and affect current design
**Problem**: User fears clearing will delete entities

**Solution**: Clearly communicate that only history is cleared, not entities

---

### ❌ Don't: Leave memory references after clear
**Problem**: Memory leak, cleared commands not garbage collected

**Solution**: Explicitly dereference command objects, break circular refs

---

### ✅ Do: Provide selective clear options
**Benefit**: Flexibility to clear only undo or redo as needed

---

### ✅ Do: Show memory to be freed in dialog
**Benefit**: User understands benefit of clearing history

---

## Performance Tips

### Optimization: Batch Clear Operation
**Problem**: Clearing 1000 commands one-by-one triggers 1000 updates

**Solution**: Clear array in single operation
- `undoStack.length = 0` faster than loop
- Or `undoStack = []` and reassign
- Single memory operation

---

### Optimization: Explicit Command Disposal
**Problem**: Circular references prevent garbage collection

**Solution**: Add dispose() method to commands
- Break circular references
- Set entity data to null
- Clear event listeners
- Explicit cleanup before removing from array

---

### Optimization: Defer Garbage Collection
**Problem**: Immediate GC after clear causes UI pause

**Solution**: Clear stacks, let GC run on idle
- Don't force synchronous GC
- Allow browser to GC during idle time
- No visible lag for user

---

## Future Enhancements

- **Auto-Clear Threshold**: Automatically clear when history exceeds 1000 actions
- **Clear Old History**: Clear actions older than 24 hours
- **History Size Limit**: Cap history at specific memory size (e.g., 100MB)
- **Compress History**: Compress old commands to save memory without full clear
- **Selective Clear by Type**: Clear only specific command types (e.g., all move commands)
- **History Export**: Export history to file before clearing (for debugging)
- **Undo Clear**: Temporarily preserve cleared history (30 seconds to undo clear)
- **Memory Monitor**: Show real-time history memory usage
- **Smart Clear**: Clear redundant commands (consecutive moves of same entity)
- **History Archival**: Move old history to compressed archive instead of deleting
