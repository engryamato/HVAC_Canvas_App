# [UJ-SM-004] Deselect Entity

## Overview

This user journey covers clearing the current selection to return to an unselected state, including click-on-empty-space deselection, keyboard shortcuts, and programmatic deselection after operations.

## PRD References

- **FR-SM-004**: User shall be able to deselect all entities
- **US-SM-004**: As a designer, I want to clear selection so that I can start fresh or avoid accidental edits
- **AC-SM-004-001**: Click on empty canvas area deselects all entities
- **AC-SM-004-002**: Escape key deselects all entities
- **AC-SM-004-003**: Selection highlights removed immediately
- **AC-SM-004-004**: Inspector returns to empty state
- **AC-SM-004-005**: Switching tools deselects entities (optional, configurable)

## Prerequisites

- User is in Canvas Editor with Select tool active
- At least one entity currently selected
- Canvas has empty space for clicking (not all entities)

## User Journey Steps

### Step 1: Entity Selected (Starting State)

**User Action**: (Prerequisite state - entity already selected)

**Expected Result**:
- Current state: 1 or more entities selected
- Example: Room A and Duct B selected
- Selection state:
  - `selectedIds`: ['room-a', 'duct-b']
  - Selection count: 2
- Visual indicators:
  - Both entities show blue selection outline
  - Bounding box with resize handles
  - Selection handles visible
- Inspector panel:
  - Shows "2 entities selected"
  - Multi-entity summary displayed
  - Bulk actions available
- Status bar: "2 entities selected"
- User ready to deselect

**Validation Method**: E2E test - Verify selected state before deselection

---

### Step 2: Click on Empty Canvas Area

**User Action**: Click on empty canvas space (no entity underneath)

**Expected Result**:
- Mouse click detected at position (300, 300)
- Hit testing performed:
  - Check all entities at click position
  - No entities found (empty space)
- Empty area click detected
- Deselect operation triggered:
  - Clear selection array: `selectedIds = []`
  - Selection count: 0
- Visual updates immediate:
  - Room A: Selection outline removed
  - Duct B: Selection outline removed
  - Bounding box disappears
  - Resize handles removed
  - Entities return to normal appearance
- Inspector panel:
  - Clears to empty state
  - Placeholder message: "Select an entity to edit properties"
  - No entity properties shown
- Status bar: "0 entities selected" (brief) or default message
- Cursor remains as Select tool cursor (arrow)

**Validation Method**: Integration test - Verify click-on-empty deselects all

---

### Step 3: Deselect with Escape Key

**User Action**: Press Escape key (alternative deselection method)

**Expected Result**:
- Keyboard event detected: KeyDown 'Escape'
- Current context checked: Canvas active (not in dialog)
- Deselect command triggered
- Same result as click-on-empty:
  - `selectedIds` cleared to empty array
  - Selection count: 0
- Visual updates:
  - All selection highlights removed
  - Entities return to normal state
  - Inspector clears
- Additional Escape key behaviors:
  - If in drawing mode (mid-operation): Cancel draw
  - If dialog open: Close dialog (takes precedence)
  - If selection exists: Clear selection
  - If nothing to do: No action (no error)
- Keyboard shortcut works from anywhere in canvas
- No confirmation required (instant deselection)

**Validation Method**: E2E test - Verify Escape key deselects

---

### Step 4: Verify Inspector Empty State

**User Action**: (Automatic after deselection)

**Expected Result**:
- Inspector panel transitions to empty state:
  - All property fields cleared
  - No entity-specific sections visible
  - Empty state placeholder shown:
    - Icon: Dashed selection box
    - Message: "Select an entity to edit properties"
    - Hint: "Click an entity or drag to select multiple"
- Bulk actions disabled:
  - Delete, Align, Distribute buttons grayed out
  - Require selection to enable
- Property history preserved:
  - Last viewed properties not shown
  - Clean slate for next selection
- Panel height may collapse (if collapsible)
- User sees clear visual feedback that nothing is selected

**Validation Method**: Unit test - Verify inspector empty state rendering

---

### Step 5: Attempt Operation with No Selection

**User Action**: With nothing selected, press Delete key

**Expected Result**:
- Delete command triggered
- Selection check: `selectedIds.length === 0`
- No entities to delete
- Operation ignored (no-op):
  - No error message
  - No dialog
  - No action taken
- Subtle feedback (optional):
  - Brief tooltip: "Nothing selected"
  - Status bar: "No entities to delete"
  - System beep (OS-dependent)
- User can continue normally
- Same behavior for other selection-dependent operations:
  - Align, Distribute, Group, etc.
  - All require selection to execute
- Prevents accidental operations

**Validation Method**: Unit test - Verify operations require selection

---

## Edge Cases

### 1. Deselect During Active Tool (Not Select Tool)

**User Action**: While using Room tool, click empty area

**Expected Behavior**:
- Active tool: Room tool (drawing mode)
- Click on empty area:
  - NOT treated as deselect
  - Treated as tool operation (place room)
- Selection cleared only when in Select tool mode
- Other tools have their own click behaviors:
  - Room tool: Place room corner
  - Duct tool: Start/end duct line
  - Pan tool: Start pan drag
- Deselection only works in Select mode
- User must switch to Select tool (V key) to deselect via click

**Validation Method**: Unit test - Verify deselect only works with Select tool

---

### 2. Deselect After Multi-Select (100 Entities)

**User Action**: 100 entities selected, click empty area to deselect all

**Expected Behavior**:
- Large selection: 100 entities
- Deselect operation triggered
- Batch clear operation:
  - Clear selection array: `selectedIds = []`
  - Trigger single re-render (not 100 re-renders)
- Visual updates optimized:
  - Batch remove all highlights
  - Single canvas redraw
  - No lag or stutter
- Performance maintained:
  - Deselect completes in <50ms
  - No frame drops
  - Smooth transition
- Inspector clears instantly
- Efficient even with large selections

**Validation Method**: Performance test - Verify large deselection performance

---

### 3. Deselect Mid-Drag Operation

**User Action**: Start dragging selected entity, press Escape to cancel

**Expected Behavior**:
- Drag operation in progress
- Escape key pressed
- Two possible interpretations:
  - **Option A (Cancel Drag)**: Cancel drag, keep selection
    - Entity returns to original position
    - Selection maintained
    - Drag operation aborted
  - **Option B (Deselect)**: Cancel drag AND deselect
    - Entity returns to original position
    - Selection cleared
    - Both operations cancelled
- Default: Option A (cancel drag only)
- Rationale: Escape cancels most recent action (drag), not selection
- User can press Escape again to deselect if desired

**Validation Method**: Integration test - Verify Escape during drag cancels operation

---

### 4. Click Entity Edge (Ambiguous Click)

**User Action**: Click on very edge of entity, borderline empty space

**Expected Behavior**:
- Hit testing with tolerance:
  - Click within entity bounds + 2px tolerance: Select entity
  - Click outside bounds + 2px tolerance: Deselect (empty space)
- Edge case: Click exactly on 1px border
  - Treated as entity click (selection)
  - Prevents accidental deselection from imprecise clicks
- Visual feedback during click:
  - If hit detected: Entity highlights briefly
  - If miss detected: No highlight (deselect)
- Forgiving hit detection favors keeping selection
- User can always click clearly empty area to deselect

**Validation Method**: Unit test - Verify hit detection tolerance

---

### 5. Programmatic Deselection After Delete

**User Action**: Select 3 entities, delete them with Delete key

**Expected Behavior**:
- Delete operation executed
- All 3 entities removed from store
- Automatic deselection:
  - Deleted entities no longer exist
  - Cannot remain selected (invalid state)
  - `selectedIds` automatically cleared
- Same behavior for other destructive operations:
  - Cut (Ctrl+X): Deselect after cut
  - Group: Deselect after grouping
- Prevents "ghost selection" of non-existent entities
- Inspector clears automatically
- User sees clean state after operation

**Validation Method**: Integration test - Verify auto-deselect after delete

---

## Error Scenarios

### 1. Selection State Corruption

**Scenario**: Selection state contains IDs of entities that no longer exist

**Expected Handling**:
- Deselect operation triggered
- Validation during deselect:
  - Check each ID in `selectedIds`
  - Verify entity exists: `entityStore.hasEntity(id)`
  - Remove invalid IDs: `selectedIds.filter(id => entityStore.hasEntity(id))`
- Auto-cleanup of corrupted state
- Deselect proceeds normally
- No error shown to user (silent correction)
- Logged: "Selection contained invalid entity IDs, cleaned up during deselect"
- Prevents cascading errors

**Validation Method**: Unit test - Verify selection validation on deselect

---

### 2. Deselect During Background Operation

**Scenario**: User deselects while auto-save is writing file

**Expected Handling**:
- Deselect operation independent of save
- No conflict:
  - Deselect only affects UI state
  - Save operates on entity data (unchanged)
- Both operations complete successfully:
  - UI clears selection immediately
  - Save continues in background
- No race conditions
- No errors
- User sees responsive UI (deselect instant)

**Validation Method**: Integration test - Verify deselect during background tasks

---

### 3. Rapid Deselect/Select Cycles

**Scenario**: User rapidly clicks empty space and entity repeatedly

**Expected Handling**:
- Click 1: Deselect (empty) → `selectedIds = []`
- Click 2: Select (entity) → `selectedIds = ['room-a']`
- Click 3: Deselect (empty) → `selectedIds = []`
- Click 4: Select (entity) → `selectedIds = ['room-a']`
- ...continues at high speed (10 clicks/second)
- Throttling applied:
  - Batch selection state updates
  - Max 10 updates/second
  - Prevents excessive re-renders
- Visual feedback smooth:
  - Highlights toggle correctly
  - No lag or stutter
- Performance maintained

**Validation Method**: Performance test - Verify rapid deselect handling

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Deselect All | `Escape` or Click empty area |
| Select All | `Ctrl/Cmd + A` (re-select) |
| Invert Selection | `Ctrl/Cmd + Shift + I` (future) |

---

## Related Elements

- [SelectTool](../../elements/04-tools/SelectTool.md) - Selection tool implementation
- [selectionStore](../../elements/02-stores/selectionStore.md) - Selection state management
- [SelectionHighlight](../../elements/01-components/canvas/SelectionHighlight.md) - Visual feedback
- [Inspector](../../elements/01-components/panels/Inspector.md) - Empty state display
- [UJ-SM-001](./UJ-SM-001-SelectSingleEntity.md) - Single selection (prerequisite)
- [UJ-SM-002](./UJ-SM-002-MultiSelectMarquee.md) - Multi-selection
- [UJ-SM-003](./UJ-SM-003-MultiSelectShiftClick.md) - Incremental selection

---

## Visual Diagram

```
Deselection Flow (Click Empty Area)
┌────────────────────────────────────────────────────────┐
│  Before: 2 Entities Selected                           │
│  ┌─────┐                                               │
│  │  A  │ ← Selected (blue outline)                     │
│  └─────┘                                               │
│   ═══B═══ ← Selected (blue outline)                    │
│    C  ← Not selected                                   │
│                                                        │
│  User clicks empty area (X)                            │
│                                                        │
│  After: All Deselected                                 │
│  ┌─────┐                                               │
│  │  A  │ ← Normal (no outline)                         │
│  └─────┘                                               │
│     B  ← Normal (no outline)                           │
│    C  ← Normal (no outline)                            │
└────────────────────────────────────────────────────────┘

Escape Key Deselection:
┌────────────────────────────────────────────────────────┐
│  State: Selected                                       │
│  Input: [Esc] keypress                                 │
│    ↓                                                   │
│  Check Context                                         │
│    ↓                                                   │
│  Dialog Open?     Drawing?      Selection Exists?      │
│    ↓ Yes            ↓ Yes          ↓ Yes              │
│  Close Dialog    Cancel Draw    Clear Selection        │
│                                     ↓                  │
│                                selectedIds = []         │
│                                     ↓                  │
│                                Remove Highlights        │
│                                     ↓                  │
│                                Clear Inspector          │
└────────────────────────────────────────────────────────┘

Selection State Transition:
┌────────────────────────────────────────────────────────┐
│  State Machine:                                        │
│                                                        │
│  ┌─────────────┐     Click Entity      ┌────────────┐ │
│  │ No Selection│ ───────────────────→   │  Selected  │ │
│  │ (Empty)     │                        │  (1+ IDs)  │ │
│  └─────────────┘                        └────────────┘ │
│       ↑                                       │        │
│       │           Click Empty / Escape        │        │
│       └───────────────────────────────────────┘        │
│                                                        │
│  Properties:                                           │
│  No Selection:                                         │
│    - selectedIds = []                                  │
│    - No highlights                                     │
│    - Inspector empty                                   │
│                                                        │
│  Selected:                                             │
│    - selectedIds = ['id1', 'id2', ...]                 │
│    - Entities highlighted                              │
│    - Inspector populated                               │
└────────────────────────────────────────────────────────┘

Inspector State Change:
┌────────────────────────────────────────────────────────┐
│  Before Deselect:                                      │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Inspector Panel                                 │  │
│  │ ─────────────────────────────────────────────── │  │
│  │ 2 entities selected                             │  │
│  │                                                 │  │
│  │ • 1 Room, 1 Duct                                │  │
│  │                                                 │  │
│  │ Common Properties:                              │  │
│  │   X: (Multiple values)                          │  │
│  │   Y: (Multiple values)                          │  │
│  │                                                 │  │
│  │ [Delete All] [Align] [Distribute]               │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  After Deselect:                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Inspector Panel                                 │  │
│  │ ─────────────────────────────────────────────── │  │
│  │                                                 │  │
│  │        ╔═══╗                                    │  │
│  │        ║   ║  ← Empty selection icon            │  │
│  │        ╚═══╝                                    │  │
│  │                                                 │  │
│  │  Select an entity to edit properties            │  │
│  │                                                 │  │
│  │  Hint: Click an entity or drag to select        │  │
│  │        multiple                                 │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/tools/SelectTool.deselect.test.ts`

**Test Cases**:
- Clear selection array on deselect
- Verify empty selection state after deselect
- Escape key triggers deselect
- Click empty area triggers deselect
- Deselect only works with Select tool active
- Selection validation removes invalid IDs

**Assertions**:
- `selectedIds.length === 0` after deselect
- No entity IDs remain in selection
- Escape key event calls deselect function
- Empty area click detected and handled
- Other tools don't trigger deselect

---

### Integration Tests
**File**: `src/__tests__/integration/deselect.test.ts`

**Test Cases**:
- Complete deselection workflow
- Inspector clears on deselect
- Visual highlights removed
- Auto-deselect after entity deletion
- Deselect during background operations
- Performance with large selections

**Assertions**:
- All selection highlights removed from canvas
- Inspector shows empty state
- Deleted entities auto-deselected
- Background tasks unaffected by deselect
- 100-entity deselect completes in <50ms

---

### E2E Tests
**File**: `e2e/selection/deselect.spec.ts`

**Test Cases**:
- Visual deselection via click empty
- Visual deselection via Escape key
- Selection outline disappears
- Inspector panel empty state
- Status bar updates
- Bulk action buttons disabled

**Assertions**:
- Blue outlines removed from entities
- No selection handles visible
- Inspector shows placeholder message
- Status bar shows "0 entities selected"
- Delete/Align/Distribute buttons grayed out

---

## Common Pitfalls

### ❌ Don't: Require confirmation for deselection
**Problem**: Extra step frustrates users for simple action

**Solution**: Instant deselection with no confirmation (can easily reselect)

---

### ❌ Don't: Trigger deselect from any tool
**Problem**: Drawing tools become unusable (every click deselects)

**Solution**: Only deselect when Select tool is active

---

### ❌ Don't: Leave invalid entity IDs in selection
**Problem**: Errors when operating on deleted entities

**Solution**: Validate and clean selection state on deselect

---

### ✅ Do: Provide multiple deselection methods
**Benefit**: Users can choose: click empty, Escape, or tool switch

---

### ✅ Do: Clear inspector immediately
**Benefit**: User sees instant visual feedback that nothing is selected

---

## Performance Tips

### Optimization: Batch Highlight Removal
**Problem**: Removing 100 selection highlights one-by-one causes 100 re-renders

**Solution**: Batch all highlight removals into single update
- Clear all highlights at once
- Single canvas redraw
- 100x faster deselection

---

### Optimization: Lazy Inspector Clear
**Problem**: Clearing complex inspector panel slows deselection

**Solution**: Hide inspector content immediately, clear async
- Set visibility: hidden (instant)
- Clear form fields in background (100ms later)
- User sees instant response
- Cleanup happens invisibly

---

### Optimization: Skip Validation for Empty Selection
**Problem**: Validating empty selection array wastes CPU

**Solution**: Early return if selection already empty
- Check `selectedIds.length === 0` first
- Skip all deselect logic if already clear
- Prevents redundant operations

---

## Future Enhancements

- **Deselect Animation**: Smooth fade-out of selection highlights
- **Undo Deselection**: Ctrl+Z to restore previous selection
- **Smart Deselect**: Keep selection when switching between compatible tools
- **Partial Deselect**: Click entity while holding Alt to remove from multi-selection
- **Selection History**: Navigate through previous selections (back/forward)
- **Deselect Confirmation**: Optional "Are you sure?" for large selections (>50 entities)
- **Persistent Selection**: Save selection state for session recovery
- **Named Selections**: Save and recall custom selection groups
