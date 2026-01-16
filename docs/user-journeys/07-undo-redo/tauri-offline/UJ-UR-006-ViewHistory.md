# [UJ-UR-006] View History

## Overview

This user journey covers viewing the complete undo/redo history stack, enabling designers to understand past actions, navigate to specific states, and restore earlier versions of their work.

## PRD References

- **FR-UR-006**: User shall be able to view undo/redo history
- **US-UR-006**: As a designer, I want to view my action history so that I can understand past changes and navigate to specific states
- **AC-UR-006-001**: History panel shows all actions in chronological order
- **AC-UR-006-002**: Current position indicated in history
- **AC-UR-006-003**: Click action to jump to that state
- **AC-UR-006-004**: History shows action descriptions and timestamps
- **AC-UR-006-005**: Search/filter history by action type or keyword
- **AC-UR-006-006**: History persists across sessions (saved in project)

## Prerequisites

- User is in Canvas Editor
- User has performed actions (history exists)
- History store contains command stack
- History panel accessible from UI

## User Journey Steps

### Step 1: Open History Panel

**User Action**: Click "History" tab in right sidebar (or View → History)

**Expected Result**:
- History panel opens:
  - Located in right sidebar
  - Replaces Inspector view (or tabs with Inspector)
  - Full panel height
- History stack displayed:
  - List of all commands in chronological order
  - Current state: 15 actions in history
  - Example history:
    ```
    15. ○ Draw Duct (500 CFM)           2:45 PM
    14. ○ Resize Room B                 2:43 PM
    13. ○ Create Room C                 2:41 PM
    12. ○ Delete Note                   2:39 PM
    11. ○ Draw Duct (400 CFM)           2:37 PM
    10. ● Align 3 Entities Left         2:35 PM ← Current
     9. ○ Distribute 5 Entities         2:33 PM
     8. ○ Group Entities (Room A, B)    2:31 PM
     7. ○ Lock Room A                   2:29 PM
     6. ○ Copy Format Room A → B        2:27 PM
     ... (older actions)
    ```
- Current position indicator:
  - Action #10 highlighted
  - Marker: ● (filled circle)
  - Or: Blue background
  - Clear visual distinction
- Action details:
  - Number: Sequential (1, 2, 3...)
  - Description: "Align 3 Entities Left"
  - Timestamp: "2:35 PM"
  - Icon (optional): Based on action type
- Navigation controls:
  - Scroll bar for long history
  - Keyboard navigation (arrows)
- Status info:
  - Total actions: 15
  - Undo available: 10 (above current)
  - Redo available: 5 (below current)

**Validation Method**: E2E test - Verify history panel display

---

### Step 2: Browse History Details

**User Action**: Hover over action "Resize Room B" in history

**Expected Result**:
- Hover interaction:
  - Action #14 highlighted on hover
  - Cursor: Pointer (clickable)
- Tooltip/detail pane shows:
  - **Action**: Resize Room B
  - **Type**: UpdatePropertyCommand
  - **Time**: 2:43 PM (2 minutes ago)
  - **Changes**:
    - Width: 200" → 250"
    - Height: 150" → unchanged
  - **Affected Entities**: Room B (ID: room-b)
  - **Before State**: 200×150
  - **After State**: 250×150
- Visual preview (optional):
  - Thumbnail of canvas at that state
  - Before/after comparison
  - Mini-map showing entity
- Action grouping:
  - If part of bulk operation:
    - "Align 3 Entities Left"
    - Expandable: Shows 3 sub-actions
    - Click to expand/collapse
- Status bar:
  - "Action 14 of 15: Resize Room B"

**Validation Method**: Integration test - Verify action details

---

### Step 3: Jump to Historical State

**User Action**: Click on action #8 "Group Entities (Room A, B)"

**Expected Result**:
- Jump command triggered:
  - Target: Action #8
  - Current: Action #10
  - Delta: -2 (undo 2 actions)
- Undo sequence executed:
  - Undo action #10: Align 3 Entities Left
  - Undo action #9: Distribute 5 Entities
  - Stop at action #8
- Canvas state updated:
  - All entities in state from action #8
  - Entities distributed but not aligned
  - Visual match to historical state
- History panel updated:
  - Current position: Action #8 ●
  - Actions 9-15: Grayed (undone)
  - Actions 1-8: Normal (active)
- Visual feedback:
  - Current marker moves to #8
  - Canvas re-renders to match
  - Smooth transition (optional animation)
- Undo/redo availability:
  - Undo: 8 actions available (above #8)
  - Redo: 7 actions available (#9-15)
- Status bar:
  - "Jumped to action #8: Group Entities"
- Command created:
  - `JumpToHistoryStateCommand` with:
    - From: Action #10
    - To: Action #8
  - Added to history (meta-action)
  - Or: Not added (pure navigation)

**Validation Method**: Integration test - Verify state jump

---

### Step 4: Search/Filter History

**User Action**: Type "Room" in history search box

**Expected Result**:
- Search box interaction:
  - Input field at top of history panel
  - Placeholder: "Search history..."
  - Type: "Room"
- Filter applied:
  - History filtered to matching actions:
    ```
    14. Resize Room B                   2:43 PM
    13. Create Room C                   2:41 PM
     8. Group Entities (Room A, B)      2:31 PM
     6. Copy Format Room A → B          2:27 PM
     3. Create Room B                   2:20 PM
     1. Create Room A                   2:15 PM
    ```
  - Only 6 actions match "Room"
  - Other actions hidden
- Match highlighting:
  - "Room" text highlighted in results
  - Bold or yellow background
  - Clear visual emphasis
- Filter controls:
  - Clear button: × to clear filter
  - Match count: "6 of 15 actions"
- Navigation:
  - Click filtered action: Jump to that state
  - Current position still indicated
- Advanced filters (optional):
  - Filter by type: Show only "Create" actions
  - Filter by entity: Show only Room A actions
  - Filter by time range: Last hour, today, etc.
- Clear filter:
  - Click × or clear search
  - All actions visible again

**Validation Method**: Integration test - Verify history search

---

### Step 5: View History Summary

**User Action**: Click "Summary" toggle in history panel

**Expected Result**:
- View mode change:
  - From: Detailed list (all actions)
  - To: Summary view (grouped/collapsed)
- Summary grouping:
  - Group by time:
    ```
    ▼ Recent (Last 5 minutes) - 10 actions
      • Align, Distribute, Resize, etc.
    ▶ Earlier Today (2:00 - 2:30 PM) - 5 actions
      • Create rooms, draw ducts
    ```
  - Or group by type:
    ```
    ▼ Entity Creation (8 actions)
      • Create Room A, B, C
      • Draw Duct 1, 2, 3
    ▼ Manipulation (4 actions)
      • Align, Distribute, Resize, Rotate
    ▼ Formatting (3 actions)
      • Copy Format, Lock, Group
    ```
- Expand/collapse:
  - Click group header to expand
  - Shows detailed actions within
  - Collapse to hide details
- Benefits:
  - Easier navigation for long history
  - Quick overview of work done
  - Pattern identification
- Toggle back:
  - Click "Detailed" to see all actions
  - Or: "Summary" / "Detailed" buttons

**Validation Method**: E2E test - Verify summary view

---

## Edge Cases

### 1. History Exceeds Maximum Length (100 Actions)

**User Action**: Perform 101st action, history at capacity

**Expected Behavior**:
- History limit: 100 actions (configurable)
- Circular buffer behavior:
  - Oldest action (#1) removed
  - New action (#101) added
  - History size: Still 100
- History renumbering:
  - Old action #2 becomes new #1
  - Old action #3 becomes new #2
  - ... (all renumbered)
  - New action #101 becomes #100
- Lost history:
  - Action #1 permanently removed
  - Cannot undo past #1 (now #0)
  - No longer accessible
- User notification:
  - Warning (first time): "History limit reached. Oldest actions will be removed."
  - Checkbox: "Don't show again"
  - Or: Silent (expected behavior)
- Alternative: Increase limit
  - Settings: History size = 200, 500, 1000
  - Trade-off: Memory usage
  - Default: 100 (reasonable)

**Validation Method**: Unit test - Verify circular buffer

---

### 2. Branching History (Undo then New Action)

**User Action**: Undo 5 actions, then perform new action

**Expected Behavior**:
- Initial state:
  - Current: Action #15
  - Undo 5: Jump to action #10
  - Undone actions: #11-15 (grayed)
- New action performed:
  - Create Room D
- History branching:
  - Actions #11-15: Discarded (lost)
  - New action becomes #11
  - New branch created
- Visual indication:
  - Old branch: Crossed out or removed
  - Warning: "5 redoable actions will be lost"
  - Confirm: [Proceed] [Cancel]
- Result:
  - History: 1-10, 11 (new)
  - Old 11-15: Gone forever
  - Cannot redo old branch
- Alternative: Branch preservation
  - Keep old branch in separate timeline
  - User can switch between branches
  - Advanced feature (V2)
- Default: Discard old branch (simple)

**Validation Method**: Integration test - Verify branch handling

---

### 3. History from Imported Project

**User Action**: Open project with saved history from different user

**Expected Behavior**:
- Project loading:
  - History saved in .sws file
  - Load history stack from file
- History restoration:
  - All commands loaded
  - Current position restored
  - Undo/redo available
- User context:
  - Timestamps: Original times
  - User IDs: Different user (collaborative)
  - Show creator: "Created by John (2:35 PM)"
- Compatibility:
  - Command versions may differ
  - Migration if schema changed
  - Or: Clear history if incompatible
- Privacy:
  - Option: Clear history on export
  - Checkbox: "Include editing history"
  - Default: Include (for undo capability)
- Use case:
  - Collaborative work
  - Understand colleague's changes
  - Undo others' mistakes

**Validation Method**: Integration test - Verify history persistence

---

### 4. History Panel Performance (1000 Actions)

**User Action**: View history with 1000 actions (max limit)

**Expected Behavior**:
- Performance optimization:
  - Virtual scrolling:
    - Render only visible actions (20-30)
    - Load more as user scrolls
    - Smooth scrolling
  - Lazy loading:
    - Load recent actions first
    - Load older actions on demand
  - Pagination:
    - Show 50 actions per page
    - "Load More" button
- Memory management:
  - Don't load all action details
  - Load summaries only
  - Details on hover/click
- Rendering:
  - 60fps scroll performance
  - No jank or lag
  - Responsive UI
- Alternative view:
  - Summary mode by default
  - Grouped by time/type
  - Expand to see details

**Validation Method**: Performance test - Verify large history

---

### 5. Keyboard Navigation in History

**User Action**: Use arrow keys to navigate history

**Expected Behavior**:
- Keyboard shortcuts:
  - **↑ Up Arrow**: Previous action (older)
  - **↓ Down Arrow**: Next action (newer)
  - **Home**: Jump to oldest action
  - **End**: Jump to newest action
  - **Ctrl+F**: Focus search box
  - **Enter**: Jump to selected action
  - **Escape**: Close history panel
- Selection behavior:
  - Arrow keys: Move selection highlight
  - Visual: Blue outline on selected action
  - Enter: Jump to selected state
- Focus management:
  - History panel has keyboard focus
  - Tab: Navigate between elements
  - Shift+Tab: Reverse navigation
- Accessibility:
  - Screen reader support
  - ARIA labels on actions
  - Keyboard-only navigation
- Power user workflow:
  - Quick history browsing
  - No mouse required
  - Efficient navigation

**Validation Method**: E2E test - Verify keyboard navigation

---

## Error Scenarios

### 1. History Corrupted or Invalid

**Scenario**: Load project with corrupted history data

**Expected Handling**:
- History loading:
  - Read history from project file
  - Parse command stack: FAILS
  - Corruption detected
- Error recovery:
  - Log error: "Corrupted history data"
  - Clear history:
    - Empty undo stack
    - Empty redo stack
    - Start fresh
- User notification:
  - Warning: "History could not be loaded. Starting with empty history."
  - Info: "Your project data is intact, only history is affected."
  - [OK]
- Functionality:
  - Project opens successfully
  - All entities loaded
  - No undo/redo available
  - Can create new history
- Prevention:
  - Validate history on save
  - Checksum for data integrity
  - Backup previous history

**Validation Method**: Unit test - Verify corruption handling

---

### 2. Memory Limit Exceeded

**Scenario**: History stack consumes too much memory (>100 MB)

**Expected Handling**:
- Memory monitoring:
  - Track history size
  - Limit: 100 MB (configurable)
  - Check on each action
- Limit exceeded:
  - Current size: 105 MB
  - Limit: 100 MB
  - Exceeds threshold
- Trimming:
  - Remove oldest actions
  - Trim to 50 MB (headroom)
  - Keep recent 50 MB of history
- User notification:
  - Toast: "History trimmed to free memory"
  - Or: Silent (automatic)
- Alternative: Compress
  - Compress old actions
  - Keep in compressed form
  - Decompress on access
  - Trade-off: CPU vs memory

**Validation Method**: Performance test - Verify memory limit

---

### 3. Concurrent History Updates (Multi-User)

**Scenario**: Two users editing same project simultaneously

**Expected Handling**:
- Scenario: Multi-user editing (future feature)
- Concurrent actions:
  - User A: Undo 2 actions
  - User B: Create Room D
  - Both at same time
- Conflict detection:
  - Both modify history state
  - Divergent histories
  - Conflict
- Resolution:
  - **Option A (Lock)**: Lock history during operations
    - First user's action succeeds
    - Second user sees conflict
    - Retry after first completes
  - **Option B (Merge)**: Merge histories
    - Combine both actions
    - Resolve conflicts
    - Complex logic
- Default: Option A (lock-based)
- For V1: Single-user only
  - Multi-user in V2
  - No concurrent history edits

**Validation Method**: Integration test - V2 feature

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open History Panel | `Ctrl/Cmd + H` |
| Next History Item | `↓` (in history panel) |
| Previous History Item | `↑` (in history panel) |
| Jump to Selected State | `Enter` (in history panel) |
| Search History | `Ctrl/Cmd + F` (in history panel) |
| Close History Panel | `Escape` |

---

## Related Elements

- [HistoryPanel](../../elements/01-components/sidebar/HistoryPanel.md) - History UI
- [historyStore](../../elements/02-stores/historyStore.md) - History state management
- [Command](../../elements/09-commands/Command.md) - Base command interface
- [JumpToHistoryStateCommand](../../elements/09-commands/JumpToHistoryStateCommand.md) - State navigation
- [UJ-UR-001](./UJ-UR-001-UndoLastAction.md) - Undo operation
- [UJ-UR-002](./UJ-UR-002-RedoLastUndoneAction.md) - Redo operation

---

## Visual Diagram

```
History Panel UI
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐              │
│  │ HISTORY                    [Search]  │              │
│  ├──────────────────────────────────────┤              │
│  │ 15. ○ Draw Duct (500 CFM)   2:45 PM │              │
│  │ 14. ○ Resize Room B         2:43 PM │              │
│  │ 13. ○ Create Room C         2:41 PM │              │
│  │ 12. ○ Delete Note           2:39 PM │              │
│  │ 11. ○ Draw Duct (400 CFM)   2:37 PM │              │
│  │ 10. ● Align 3 Entities      2:35 PM │ ← Current    │
│  │  9. ○ Distribute 5 Ent      2:33 PM │ (Grayed)     │
│  │  8. ○ Group Entities        2:31 PM │              │
│  │  7. ○ Lock Room A           2:29 PM │              │
│  │  6. ○ Copy Format A→B       2:27 PM │              │
│  │  5. ○ Rotate Equipment      2:25 PM │              │
│  │  4. ○ Delete Duct 3         2:23 PM │              │
│  │  3. ○ Create Room B         2:20 PM │              │
│  │  2. ○ Draw Duct 1           2:18 PM │              │
│  │  1. ○ Create Room A         2:15 PM │              │
│  ├──────────────────────────────────────┤              │
│  │ 15 actions • 10 can undo • 5 can redo│              │
│  └──────────────────────────────────────┘              │
│                                                        │
│  Legend:                                               │
│  ● = Current position                                  │
│  ○ = Available action                                  │
│  Grayed = Undone (can redo)                            │
└────────────────────────────────────────────────────────┘

Action Detail Tooltip
┌────────────────────────────────────────────────────────┐
│  Hover over "Resize Room B":                           │
│  ┌────────────────────────────────┐                    │
│  │ Resize Room B                  │                    │
│  ├────────────────────────────────┤                    │
│  │ Type: UpdatePropertyCommand    │                    │
│  │ Time: 2:43 PM (2 min ago)      │                    │
│  │                                │                    │
│  │ Changes:                       │                    │
│  │ • Width: 200" → 250"           │                    │
│  │ • Height: 150" (unchanged)     │                    │
│  │                                │                    │
│  │ Affected: Room B (room-b)      │                    │
│  │                                │                    │
│  │ Click to jump to this state    │                    │
│  └────────────────────────────────┘                    │
└────────────────────────────────────────────────────────┘

Jump to Historical State
┌────────────────────────────────────────────────────────┐
│  Before Jump (Current at #10):                         │
│  15. ○                                                 │
│  14. ○                                                 │
│  ...                                                   │
│  10. ● Align 3 Entities ← Current                      │
│   9. ○                                                 │
│   8. ○ Group Entities ← Click here                     │
│                                                        │
│  ↓ User clicks action #8                               │
│                                                        │
│  After Jump (Current at #8):                           │
│  15. ○ (Grayed - undone)                               │
│  14. ○ (Grayed - undone)                               │
│  ...                                                   │
│  10. ○ (Grayed - undone)                               │
│   9. ○ (Grayed - undone)                               │
│   8. ● Group Entities ← New current                    │
│   7. ○                                                 │
│                                                        │
│  Canvas state matches action #8                        │
│  Can redo actions 9-15                                 │
└────────────────────────────────────────────────────────┘

History Search/Filter
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐              │
│  │ HISTORY                              │              │
│  │ [Search: Room____________] [X]       │              │
│  ├──────────────────────────────────────┤              │
│  │ 14. Resize Room B           2:43 PM  │              │
│  │ 13. Create Room C           2:41 PM  │              │
│  │  8. Group Entities (Room A,B) 2:31PM │              │
│  │  6. Copy Format Room A → B  2:27 PM  │              │
│  │  3. Create Room B           2:20 PM  │              │
│  │  1. Create Room A           2:15 PM  │              │
│  ├──────────────────────────────────────┤              │
│  │ Showing 6 of 15 actions              │              │
│  └──────────────────────────────────────┘              │
│                                                        │
│  "Room" highlighted in results                         │
│  Other actions hidden                                  │
└────────────────────────────────────────────────────────┘

Summary View (Grouped)
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐              │
│  │ HISTORY          [Detailed] [Summary]│              │
│  ├──────────────────────────────────────┤              │
│  │ ▼ Recent (Last 5 min) - 10 actions   │              │
│  │   • Draw Duct (500 CFM)              │              │
│  │   • Resize Room B                    │              │
│  │   • Create Room C                    │              │
│  │   • ... 7 more                       │              │
│  │                                      │              │
│  │ ▶ Earlier (2:15-2:30 PM) - 5 actions │ ← Collapsed  │
│  │                                      │              │
│  │ ── By Type ──                        │              │
│  │ ▼ Entity Creation (8 actions)        │              │
│  │   • Create Room A, B, C              │              │
│  │   • Draw Duct 1, 2, 3                │              │
│  │   • ... 2 more                       │              │
│  │                                      │              │
│  │ ▶ Manipulation (4 actions)           │              │
│  │ ▶ Formatting (3 actions)             │              │
│  └──────────────────────────────────────┘              │
│                                                        │
│  Click group to expand/collapse                        │
└────────────────────────────────────────────────────────┘

Branching History Visualization
┌────────────────────────────────────────────────────────┐
│  Linear History (No Branching):                        │
│  1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 ●              │
│                                                        │
│  After Undo 5, Create New:                             │
│  1 → 2 → 3 → 4 → 5 ● (Current)                         │
│                 ↓                                      │
│            (6 → 7 → 8 → 9 → 10) ✗ Discarded           │
│                 ↓                                      │
│                 6' (New action)                        │
│                                                        │
│  New branch replaces old                               │
│  Old actions 6-10 lost                                 │
└────────────────────────────────────────────────────────┘

Circular Buffer (Max 100 Actions)
┌────────────────────────────────────────────────────────┐
│  History at capacity (100 actions):                    │
│  [1] [2] [3] ... [98] [99] [100] ← Full               │
│                                                        │
│  Add action #101:                                      │
│  [1] ✗ Removed (oldest)                                │
│  [2] becomes new [1]                                   │
│  [3] becomes new [2]                                   │
│  ...                                                   │
│  [101] becomes new [100]                               │
│                                                        │
│  Result:                                               │
│  [2] [3] [4] ... [99] [100] [101] ← Still 100         │
│   ↑ New #1                      ↑ New #100            │
│                                                        │
│  Circular buffer maintains max size                    │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/stores/historyStore.test.ts`

**Test Cases**:
- Add action to history
- Navigate to historical state
- Search/filter history
- Circular buffer at capacity
- Branch handling (discard old branch)

**Assertions**:
- Action added to stack
- Jump to state executes undo/redo sequence
- Filter returns matching actions
- Oldest action removed when exceeding capacity
- New action discards undone actions

---

### Integration Tests
**File**: `src/__tests__/integration/view-history.test.ts`

**Test Cases**:
- Complete history viewing workflow
- Jump to action restores state
- Search finds matching actions
- History persists across save/load
- Performance with 1000 actions

**Assertions**:
- History panel displays all actions
- Canvas state matches historical action
- Search highlights correct actions
- History loaded from saved project
- Virtual scrolling performs smoothly

---

### E2E Tests
**File**: `e2e/undo-redo/view-history.spec.ts`

**Test Cases**:
- Open history panel visually
- See action list with timestamps
- Click action, canvas updates
- Search for keyword, see filtered results
- Summary view groups actions

**Assertions**:
- History panel visible
- Actions displayed chronologically
- Canvas changes on action click
- Search results highlighted
- Groups expandable/collapsible

---

## Common Pitfalls

### ❌ Don't: Load entire history into DOM
**Problem**: 1000 actions in DOM causes lag, memory issues

**Solution**: Use virtual scrolling, render only visible items

---

### ❌ Don't: Lose redo history on new action without warning
**Problem**: User accidentally discards important redoable work

**Solution**: Warn user before discarding redo branch

---

### ❌ Don't: Store raw entity data in history
**Problem**: Massive memory usage, duplication

**Solution**: Store only deltas/changes, not full entity snapshots

---

### ✅ Do: Show timestamps and action descriptions
**Benefit**: User understands what each action did and when

---

### ✅ Do: Support keyboard navigation
**Benefit**: Power users navigate history efficiently

---

## Performance Tips

### Optimization: Virtual Scrolling for History List
**Problem**: Rendering 1000 action items is slow

**Solution**: Virtual scrolling
- Render only visible 20-30 items
- Reuse DOM elements as user scrolls
- Lazy load action details
- 100x faster with large history

---

### Optimization: Store Command Metadata Only
**Problem**: Storing full command objects consumes 100 MB

**Solution**: Store lightweight metadata
- Action type, timestamp, description
- Entity IDs, not full entities
- Reconstruct commands on undo/redo
- 90% memory savings

---

### Optimization: Compress Old History
**Problem**: Old actions rarely accessed but consume memory

**Solution**: Compress actions older than 1 hour
- Use compression algorithm (gzip)
- Decompress on access
- Trade CPU for memory
- 50% memory reduction

---

## Future Enhancements

- **Visual Timeline**: Graph view of history (timeline with branches)
- **Action Diff View**: Side-by-side comparison of before/after
- **Favorites**: Star important actions for quick access
- **Action Comments**: Add notes to specific actions
- **Export History**: Export action log as CSV/JSON
- **Undo/Redo Preview**: Preview state before jumping
- **Collaborative History**: See other users' actions (multi-user)
- **Smart Grouping**: Auto-group related actions
- **History Replay**: Animated playback of all actions
- **Checkpoint System**: Create named checkpoints to return to
