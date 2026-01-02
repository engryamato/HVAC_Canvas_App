# [UJ-UR-009] Save Points/Checkpoints

## Overview

This user journey covers creating named checkpoints in the undo history, enabling designers to mark important milestones and quickly return to those specific states without counting actions.

## PRD References

- **FR-UR-009**: User shall be able to create and restore checkpoints
- **US-UR-009**: As a designer, I want to create checkpoints so that I can easily return to important milestones in my design
- **AC-UR-009-001**: User can create named checkpoint at current state
- **AC-UR-009-002**: Checkpoints appear in history panel with marker
- **AC-UR-009-003**: Click checkpoint to jump to that state
- **AC-UR-009-004**: Checkpoint names editable/renamable
- **AC-UR-009-005**: Checkpoints persist in project file
- **AC-UR-009-006**: Maximum 20 checkpoints per project

## Prerequisites

- User is in Canvas Editor
- User has performed actions (history exists)
- User wants to mark significant milestone
- Checkpoint functionality available

## User Journey Steps

### Step 1: Create Checkpoint at Current State

**User Action**: Click "Create Checkpoint" in History panel (or Edit → Create Checkpoint)

**Expected Result**:
- Checkpoint dialog opens:
  - **Title**: "Create Checkpoint"
  - Modal or inline input
- Dialog contents:
  - **Name field**: "Checkpoint [date/time]" (default)
  - Suggested names:
    - "Checkpoint 1"
    - "Milestone - [current date]"
    - Auto-generated based on recent actions
  - **Description field** (optional):
    - Longer note about checkpoint
    - E.g., "Completed north wing layout"
  - **Buttons**: [Create] [Cancel]
- User enters name:
  - Type: "North Wing Complete"
  - Optional description: "Finalized all rooms and ducts for north wing"
- Create checkpoint:
  - Click [Create]
- Checkpoint created:
  - **Checkpoint object**:
    ```
    {
      id: 'checkpoint-uuid-123',
      name: 'North Wing Complete',
      description: 'Finalized all rooms and ducts...',
      actionIndex: 15, // Current history position
      timestamp: '2025-12-29T14:45:00Z',
      thumbnailData: '[base64 canvas screenshot]',
      entityCount: 42
    }
    ```
  - Added to checkpoint store
- Visual indicator:
  - History panel shows checkpoint marker:
    ```
    17. Draw Equipment
    16. Resize Duct 2
    15. ● North Wing Complete ← Checkpoint marker
    14. Align 3 Entities
    13. Create Room C
    ```
  - Marker: Star ⭐ or flag 🚩 icon
  - Highlight: Green background
  - Visible in history list
- Status bar:
  - "Checkpoint 'North Wing Complete' created"
- Command created:
  - `CreateCheckpointCommand` (metadata only)
  - Added to history (or separate tracking)

**Validation Method**: Integration test - Verify checkpoint creation

---

### Step 2: View Checkpoints List

**User Action**: Click "Checkpoints" tab in History panel

**Expected Result**:
- Checkpoints view opens:
  - List of all checkpoints
  - Chronological order (newest first)
- Checkpoint list:
  ```
  ⭐ North Wing Complete              Action #15
     Finalized all rooms and ducts...
     Dec 29, 2:45 PM • 42 entities
     [Thumbnail preview]

  ⭐ Initial Layout Draft             Action #8
     Basic room layout established
     Dec 29, 2:30 PM • 18 entities
     [Thumbnail preview]

  ⭐ Project Start                    Action #0
     Empty canvas
     Dec 29, 2:15 PM • 0 entities
     [Thumbnail preview]
  ```
- Checkpoint details:
  - Name: Bold, prominent
  - Description: Smaller text below
  - Action index: Shows position in history
  - Timestamp: When created
  - Entity count: State snapshot
  - Thumbnail: Visual preview (optional)
- Actions available:
  - Click: Jump to checkpoint
  - Edit: Rename/edit description
  - Delete: Remove checkpoint
  - Pin: Keep checkpoint (prevent deletion)
- Sorting options:
  - Chronological (default)
  - Alphabetical by name
  - By action index
- Status bar:
  - "3 checkpoints in project"

**Validation Method**: E2E test - Verify checkpoints list display

---

### Step 3: Jump to Checkpoint

**User Action**: Click "Initial Layout Draft" checkpoint

**Expected Result**:
- Checkpoint selection:
  - Checkpoint: Action #8
  - Current position: Action #15
  - Delta: -7 actions (undo 7)
- Confirmation dialog (optional):
  - "Jump to 'Initial Layout Draft'?"
  - "Current work will be undone (7 actions)"
  - [Jump] [Cancel]
- User confirms: [Jump]
- Undo sequence:
  - Execute undo 7 times
  - Actions 15 → 14 → 13 → ... → 8
  - Stop at action #8
- Canvas state updated:
  - All entities at action #8 state
  - Visual: Canvas shows "Initial Layout Draft"
  - 24 entities fewer (42 → 18)
- History panel updated:
  - Current position: Action #15 → #8
  - Actions 9-15: Grayed (undone)
  - Checkpoint marker: Highlighted at #8
- Redo availability:
  - Redo stack: 7 actions (9-15)
  - Can redo back to latest
- Visual feedback:
  - Smooth transition (optional animation)
  - Checkpoint marker: Emphasized
  - Status shows: "Jumped to checkpoint"
- Status bar:
  - "Restored checkpoint: Initial Layout Draft"

**Validation Method**: Integration test - Verify checkpoint jump

---

### Step 4: Edit Checkpoint Name

**User Action**: Right-click "North Wing Complete", select "Rename"

**Expected Result**:
- Rename dialog/inline edit:
  - Current name: "North Wing Complete"
  - Edit mode: Text field or inline edit
- User edits:
  - Type: "North Wing - Final Design"
  - Optional: Update description too
- Save changes:
  - Click outside or press Enter
  - Or: [Save] button
- Checkpoint updated:
  - Name: "North Wing Complete" → "North Wing - Final Design"
  - Description: Updated if changed
  - Other properties: Unchanged
- Visual update:
  - History panel: Shows new name
  - Checkpoints list: Updated
  - Marker reflects change
- Persistence:
  - Changes saved to checkpoint store
  - Saved in project file
  - Available after reload
- Status bar:
  - "Checkpoint renamed"

**Validation Method**: Integration test - Verify checkpoint editing

---

### Step 5: Delete Checkpoint

**User Action**: Select "Initial Layout Draft" checkpoint, click Delete

**Expected Result**:
- Delete confirmation:
  - Dialog: "Delete checkpoint 'Initial Layout Draft'?"
  - Warning: "This cannot be undone"
  - [Delete] [Cancel]
- User confirms: [Delete]
- Checkpoint removed:
  - Checkpoint object deleted from store
  - No longer in checkpoints list
  - Marker removed from history panel
- History unchanged:
  - Actions still in history
  - Can still navigate to action #8
  - Just no checkpoint marker
- Other checkpoints:
  - Unaffected
  - Remaining checkpoints visible
- Undo handling:
  - **Option A (No Undo)**: Deletion not undoable
    - Checkpoint permanently removed
  - **Option B (Undoable)**: Create DeleteCheckpointCommand
    - Can undo to restore checkpoint
    - Metadata preserved
- Default: Option A (no undo for checkpoint deletion)
- Status bar:
  - "Checkpoint deleted"

**Validation Method**: Integration test - Verify checkpoint deletion

---

## Edge Cases

### 1. Create Checkpoint at Every Action (Max Limit)

**User Action**: Create 25 checkpoints (exceeds limit of 20)

**Expected Behavior**:
- Checkpoint creation:
  - User creates 1st checkpoint: Success
  - User creates 2nd checkpoint: Success
  - ... (up to 20th checkpoint)
  - User creates 21st checkpoint: Limit check
- Limit reached:
  - Check: Checkpoint count = 20
  - At maximum capacity
- Warning dialog:
  - "Maximum 20 checkpoints reached"
  - "Delete old checkpoint or replace?"
  - Options:
    - [Replace Oldest]
    - [Select Checkpoint to Replace...]
    - [Cancel]
- User selects [Replace Oldest]:
  - Oldest checkpoint removed
  - New checkpoint created
  - Count remains 20
- Alternative: Auto-cleanup
  - Automatically remove oldest unpinned checkpoint
  - Allow pinned checkpoints to persist
  - Smart management
- Rationale:
  - Prevent excessive checkpoints
  - Keep project file size manageable
  - Encourage meaningful checkpoints

**Validation Method**: Unit test - Verify checkpoint limit

---

### 2. Checkpoint Before Undone Actions (Branch Point)

**User Action**: Undo 5 actions, create checkpoint, create new action

**Expected Behavior**:
- Initial state:
  - Current: Action #15
  - Undo 5: Jump to #10
  - Redo available: 5 actions (11-15)
- Create checkpoint:
  - Name: "Alternate Design"
  - Position: Action #10
  - Checkpoint created at branch point
- Create new action:
  - User creates Room D
  - New action #11' (branch)
  - Redo stack cleared (actions 11-15 lost)
- Checkpoint preserved:
  - "Alternate Design" still at action #10
  - Marks branch point
  - Can return to branching state
- Use case:
  - Explore alternative designs
  - Checkpoint before branching
  - Can return to try different approach
- History visualization:
  ```
  11'. Create Room D (new branch)
  10. ⭐ Alternate Design ← Checkpoint
  9. ...
  (Old actions 11-15 discarded)
  ```

**Validation Method**: Integration test - Verify branch checkpoints

---

### 3. Checkpoint with No Actions (Empty Canvas)

**User Action**: Create checkpoint at action #0 (empty canvas)

**Expected Behavior**:
- Empty canvas state:
  - Action #0: No entities
  - Initial state before any work
- Checkpoint creation:
  - Name: "Project Start"
  - Position: Action #0
  - Valid checkpoint
- Checkpoint properties:
  - Entity count: 0
  - Thumbnail: Empty canvas (white)
  - Description: "Starting point"
- Use case:
  - Baseline checkpoint
  - Return to blank state
  - Start over from scratch
- Jump to checkpoint:
  - Undo all actions
  - Return to empty canvas
  - Can rebuild design from start

**Validation Method**: Integration test - Verify empty checkpoint

---

### 4. Checkpoint Persistence Across Sessions

**User Action**: Create checkpoints, save project, close, reopen

**Expected Behavior**:
- Checkpoint creation:
  - Create 3 checkpoints
  - Save project (Ctrl+S)
- Project file:
  - Checkpoints saved in .sws file
  - Checkpoint metadata section:
    ```json
    {
      "checkpoints": [
        {
          "id": "checkpoint-1",
          "name": "North Wing Complete",
          "actionIndex": 15,
          "timestamp": "...",
          "description": "..."
        },
        ...
      ]
    }
    ```
- Close and reopen:
  - Close application
  - Reopen project
- Checkpoints restored:
  - All 3 checkpoints loaded
  - Appear in checkpoints list
  - Markers in history panel
  - Fully functional
- Validation:
  - Verify checkpoint references valid actions
  - Ensure action index still exists
  - Handle missing actions gracefully
- Use case:
  - Persistent milestones
  - Resume work with checkpoints intact
  - Long-term project organization

**Validation Method**: Integration test - Verify persistence

---

### 5. Checkpoint Auto-Creation on Major Events

**User Action**: Save project, checkpoint auto-created

**Expected Behavior**:
- Major events trigger auto-checkpoint:
  - **File Save**: Create "Saved at [time]"
  - **Export PDF**: Create "Before Export"
  - **Large Bulk Operation**: Create "Before Bulk Undo (50 actions)"
- Auto-checkpoint:
  - Name: Auto-generated
  - Description: Event details
  - Marked as auto (vs manual)
  - Different icon: 📍 vs ⭐
- User control:
  - Settings: Enable/disable auto-checkpoints
  - Checkbox: "Create checkpoint on save"
  - Default: Enabled
- Auto-checkpoint limit:
  - Don't count toward 20 max
  - Or: Separate limit (10 auto, 20 manual)
  - Auto-clean old auto-checkpoints
- Visibility:
  - Show in checkpoints list
  - Filterable: "Show auto-checkpoints"
  - Can delete like manual checkpoints

**Validation Method**: Integration test - Verify auto-checkpoints

---

## Error Scenarios

### 1. Jump to Checkpoint with Invalid Action Index

**Scenario**: Checkpoint references action #50, but history only has 30 actions

**Expected Handling**:
- Checkpoint data:
  - Action index: 50
  - Current history: 30 actions max
  - Invalid reference
- Validation:
  - Check action index < history length
  - Validation fails
- Error handling:
  - Cannot jump to checkpoint
  - Error dialog: "Checkpoint invalid (history mismatch)"
  - Suggest: "Delete corrupted checkpoint"
  - [Delete Checkpoint] [Cancel]
- Recovery:
  - User deletes invalid checkpoint
  - Or: Manually navigate to action #30
- Prevention:
  - Validate checkpoints on load
  - Update action indices if history changes
  - Mark invalid checkpoints

**Validation Method**: Unit test - Verify validation

---

### 2. Checkpoint Name Collision

**Scenario**: User creates checkpoint with same name as existing

**Expected Handling**:
- Name validation:
  - User enters: "North Wing Complete"
  - Check: Name already exists
  - Collision detected
- Warning options:
  - **Option A (Prevent)**: "Name already exists, choose different"
    - User must pick unique name
  - **Option B (Allow)**: Allow duplicate names
    - Add number: "North Wing Complete (2)"
    - Distinguish by timestamp
- Default: Option B (allow with disambiguation)
- Alternative: Replace
  - Ask: "Replace existing checkpoint?"
  - [Replace] [Rename] [Cancel]
  - Update existing vs create new

**Validation Method**: Unit test - Verify name handling

---

### 3. Checkpoint File Corruption

**Scenario**: Load project with corrupted checkpoint data

**Expected Handling**:
- Project loading:
  - Parse checkpoint data: FAILS
  - Corruption detected
- Error recovery:
  - Log error: "Corrupted checkpoint data"
  - Skip corrupted checkpoints
  - Load valid checkpoints only
- User notification:
  - Warning: "Some checkpoints could not be loaded"
  - Details: "2 of 5 checkpoints corrupted"
  - [OK]
- Functionality:
  - Project loads successfully
  - Valid checkpoints available
  - Corrupted checkpoints discarded
- Prevention:
  - Validate on save
  - Checksum for integrity
  - Schema validation (Zod)

**Validation Method**: Unit test - Verify corruption handling

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Create Checkpoint | `Ctrl/Cmd + Shift + K` |
| Open Checkpoints Panel | `Ctrl/Cmd + K` |
| Jump to Next Checkpoint | `Ctrl/Cmd + ]` |
| Jump to Previous Checkpoint | `Ctrl/Cmd + [` |
| Delete Selected Checkpoint | `Delete` (in checkpoints list) |

---

## Related Elements

- [Checkpoint](../../elements/03-entities/Checkpoint.md) - Checkpoint data structure
- [checkpointStore](../../elements/02-stores/checkpointStore.md) - Checkpoint management
- [CreateCheckpointCommand](../../elements/09-commands/CreateCheckpointCommand.md) - Checkpoint creation
- [HistoryPanel](../../elements/01-components/sidebar/HistoryPanel.md) - History UI
- [UJ-UR-006](./UJ-UR-006-ViewHistory.md) - View history

---

## Visual Diagram

```
Create Checkpoint Dialog
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────┐      │
│  │ Create Checkpoint                       [X]  │      │
│  ├──────────────────────────────────────────────┤      │
│  │                                              │      │
│  │ Name:                                        │      │
│  │ [North Wing Complete___________________]     │      │
│  │                                              │      │
│  │ Description (optional):                      │      │
│  │ ┌──────────────────────────────────────┐    │      │
│  │ │ Finalized all rooms and ducts for    │    │      │
│  │ │ north wing. Ready to start south.    │    │      │
│  │ └──────────────────────────────────────┘    │      │
│  │                                              │      │
│  │ Position: Action #15 (current)               │      │
│  │ Entities: 42                                 │      │
│  │ Timestamp: Dec 29, 2:45 PM                   │      │
│  │                                              │      │
│  │         [Create]  [Cancel]                   │      │
│  └──────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────┘

History Panel with Checkpoint Markers
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐              │
│  │ HISTORY                    [☑️ Show  │              │
│  │                           Checkpoints]│              │
│  ├──────────────────────────────────────┤              │
│  │ 17. ○ Draw Equipment        2:50 PM  │              │
│  │ 16. ○ Resize Duct 2         2:48 PM  │              │
│  │ 15. ⭐ North Wing Complete  2:45 PM  │ ← Checkpoint │
│  │ 14. ● Align 3 Entities      2:43 PM  │ ← Current    │
│  │ 13. ○ Create Room C         2:41 PM  │              │
│  │ 12. ○ Delete Note           2:39 PM  │              │
│  │ 11. ○ Draw Duct (400 CFM)   2:37 PM  │              │
│  │ 10. ○ Distribute 5 Ent      2:35 PM  │              │
│  │  9. ○ Group Entities        2:33 PM  │              │
│  │  8. ⭐ Initial Layout Draft 2:30 PM  │ ← Checkpoint │
│  │  7. ○ Lock Room A           2:28 PM  │              │
│  │  ... (older actions)                 │              │
│  │  0. ⭐ Project Start        2:15 PM  │ ← Checkpoint │
│  ├──────────────────────────────────────┤              │
│  │ [Create Checkpoint]                  │              │
│  └──────────────────────────────────────┘              │
│                                                        │
│  ⭐ = Checkpoint marker (green highlight)              │
│  ● = Current position                                  │
│  ○ = Regular action                                    │
└────────────────────────────────────────────────────────┘

Checkpoints List View
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐              │
│  │ CHECKPOINTS              [+ Create]  │              │
│  ├──────────────────────────────────────┤              │
│  │ ⭐ North Wing Complete               │              │
│  │    Action #15 • Dec 29, 2:45 PM      │              │
│  │    Finalized all rooms and ducts...  │              │
│  │    42 entities                       │              │
│  │    [Thumbnail: Canvas preview]       │              │
│  │    [Jump] [Edit] [Delete]            │              │
│  ├──────────────────────────────────────┤              │
│  │ ⭐ Initial Layout Draft              │              │
│  │    Action #8 • Dec 29, 2:30 PM       │              │
│  │    Basic room layout established     │              │
│  │    18 entities                       │              │
│  │    [Thumbnail: Canvas preview]       │              │
│  │    [Jump] [Edit] [Delete]            │              │
│  ├──────────────────────────────────────┤              │
│  │ ⭐ Project Start                     │              │
│  │    Action #0 • Dec 29, 2:15 PM       │              │
│  │    Empty canvas                      │              │
│  │    0 entities                        │              │
│  │    [Thumbnail: Empty canvas]         │              │
│  │    [Jump] [Edit] [Delete] [📌 Pinned]│              │
│  └──────────────────────────────────────┘              │
│                                                        │
│  3 checkpoints in project                              │
└────────────────────────────────────────────────────────┘

Jump to Checkpoint Flow
┌────────────────────────────────────────────────────────┐
│  1. Current State: Action #15                          │
│     ┌──────────────────────────────────┐               │
│     │ [Complex canvas with 42 entities]│               │
│     └──────────────────────────────────┘               │
│                                                        │
│  2. User Clicks "Initial Layout Draft" Checkpoint      │
│     Target: Action #8                                  │
│     ↓                                                  │
│  3. Confirmation Dialog                                │
│     "Jump to 'Initial Layout Draft'?"                  │
│     "Current work will be undone (7 actions)"          │
│     [Jump] [Cancel]                                    │
│     ↓                                                  │
│  4. Execute Undo Sequence (7 actions)                  │
│     15 → 14 → 13 → 12 → 11 → 10 → 9 → 8              │
│     ↓                                                  │
│  5. Restored State: Action #8                          │
│     ┌──────────────────────────────────┐               │
│     │ [Simpler canvas with 18 entities] │               │
│     └──────────────────────────────────┘               │
│                                                        │
│  Status: "Restored checkpoint: Initial Layout Draft"   │
│  Redo available: 7 actions (9-15)                      │
└────────────────────────────────────────────────────────┘

Checkpoint Limit Handling
┌────────────────────────────────────────────────────────┐
│  Current checkpoints: 20 (at maximum)                  │
│                                                        │
│  User creates 21st checkpoint:                         │
│  ↓                                                     │
│  ┌──────────────────────────────────────────────┐      │
│  │ ⚠️ Maximum Checkpoints Reached               │      │
│  ├──────────────────────────────────────────────┤      │
│  │ You have 20 checkpoints (maximum).           │      │
│  │ To create a new checkpoint:                  │      │
│  │                                              │      │
│  │ ⦿ Replace oldest unpinned checkpoint         │      │
│  │   "Project Start" (Dec 29, 2:15 PM)          │      │
│  │                                              │      │
│  │ ◯ Select checkpoint to replace...            │      │
│  │                                              │      │
│  │ Pinned checkpoints: 3 (protected)            │      │
│  │                                              │      │
│  │         [Continue]  [Cancel]                 │      │
│  └──────────────────────────────────────────────┘      │
│                                                        │
│  User selects [Continue]:                              │
│  - Oldest unpinned checkpoint removed                  │
│  - New checkpoint created                              │
│  - Count remains 20                                    │
└────────────────────────────────────────────────────────┘

Auto-Checkpoint Creation
┌────────────────────────────────────────────────────────┐
│  Trigger Event: User saves project (Ctrl+S)            │
│  ↓                                                     │
│  Auto-Checkpoint Created:                              │
│  📍 Saved at 2:55 PM                                   │
│     Action #20                                         │
│     Auto-generated checkpoint                          │
│     48 entities                                        │
│                                                        │
│  Appears in checkpoints list:                          │
│  ┌──────────────────────────────────────┐              │
│  │ CHECKPOINTS                          │              │
│  ├──────────────────────────────────────┤              │
│  │ 📍 Saved at 2:55 PM (auto)           │              │
│  │    Action #20 • Just now             │              │
│  │    Created on project save           │              │
│  │    [Jump] [Delete]                   │              │
│  ├──────────────────────────────────────┤              │
│  │ ⭐ North Wing Complete               │              │
│  │    Action #15 • 10 minutes ago       │              │
│  │    ...                               │              │
│  └──────────────────────────────────────┘              │
│                                                        │
│  📍 = Auto-checkpoint (different icon)                 │
│  ⭐ = Manual checkpoint                                │
└────────────────────────────────────────────────────────┘

Checkpoint Branching
┌────────────────────────────────────────────────────────┐
│  Timeline with Checkpoint at Branch Point:             │
│                                                        │
│  Main Branch:                                          │
│  1 → 2 → 3 → ... → 10 ⭐ Alternate Design              │
│                    ↓                                   │
│              (11 → 12 → 13 → 14 → 15) Undone           │
│                    ↓                                   │
│                   11' Create Room D (new branch)       │
│                                                        │
│  Checkpoint "Alternate Design" marks branch point      │
│  Can return to action #10 to explore different path    │
│                                                        │
│  Use case:                                             │
│  - Try different design approaches                     │
│  - Return to checkpoint if unsatisfied                 │
│  - Compare alternatives                                │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/stores/checkpointStore.test.ts`

**Test Cases**:
- Create checkpoint
- Retrieve checkpoint by ID
- Update checkpoint name/description
- Delete checkpoint
- Enforce checkpoint limit (20 max)
- Validate action index

**Assertions**:
- Checkpoint created with correct properties
- Checkpoint retrieved successfully
- Name/description updated
- Checkpoint removed from store
- 21st checkpoint replaces oldest
- Invalid action index rejected

---

### Integration Tests
**File**: `src/__tests__/integration/checkpoints.test.ts`

**Test Cases**:
- Complete checkpoint workflow
- Jump to checkpoint restores state
- Checkpoints persist across save/load
- Auto-checkpoint on major events
- Checkpoint at branch point
- Edit and delete checkpoints

**Assertions**:
- Checkpoint marks current action
- Canvas state matches checkpoint action
- Checkpoints loaded from project file
- Auto-checkpoint created on save
- Branch checkpoint preserved
- Checkpoint modifications saved

---

### E2E Tests
**File**: `e2e/undo-redo/checkpoints.spec.ts`

**Test Cases**:
- Create checkpoint via dialog
- Checkpoint marker visible in history
- Click checkpoint to jump
- Checkpoints list displays all
- Edit checkpoint name inline
- Delete checkpoint with confirmation

**Assertions**:
- Dialog opens for checkpoint creation
- Star icon appears in history panel
- Canvas changes on checkpoint click
- All checkpoints listed with details
- Inline edit updates name
- Confirmation dialog before delete

---

## Common Pitfalls

### ❌ Don't: Create checkpoints without validation
**Problem**: Invalid action indices, corrupted checkpoints

**Solution**: Validate action index exists in history before creating

---

### ❌ Don't: Store full entity snapshots in checkpoints
**Problem**: Massive memory usage, bloated project files

**Solution**: Store only action index, reconstruct state from history

---

### ❌ Don't: Allow unlimited checkpoints
**Problem**: Performance degradation, large files

**Solution**: Enforce reasonable limit (20 checkpoints)

---

### ✅ Do: Provide meaningful default checkpoint names
**Benefit**: User doesn't have to think of names for every checkpoint

---

### ✅ Do: Show visual preview/thumbnail
**Benefit**: User can quickly identify checkpoint by visual appearance

---

## Performance Tips

### Optimization: Lazy Load Checkpoint Thumbnails
**Problem**: Loading 20 full-res thumbnails on panel open is slow

**Solution**: Load thumbnails on demand
- Load as user scrolls
- Placeholder until loaded
- Cache loaded thumbnails
- 10x faster panel opening

---

### Optimization: Store Thumbnails at Low Resolution
**Problem**: High-res thumbnails consume 5 MB per checkpoint

**Solution**: Thumbnail at 200×150 px
- Sufficient for preview
- <50 KB per thumbnail
- 100x smaller file size

---

### Optimization: Compress Thumbnail Data
**Problem**: Base64 thumbnails still large (200 KB each)

**Solution**: Use JPEG compression
- Quality: 70%
- 10x compression ratio
- ~20 KB per thumbnail

---

## Future Enhancements

- **Checkpoint Comparison**: Side-by-side comparison of two checkpoints
- **Checkpoint Export**: Export checkpoints as separate project files
- **Checkpoint Sharing**: Share checkpoints with team members
- **Checkpoint Notes**: Rich text notes with images/links
- **Checkpoint Tags**: Categorize checkpoints with tags
- **Smart Checkpoint Naming**: AI-suggested names based on recent actions
- **Checkpoint Timeline**: Visual timeline of checkpoints
- **Checkpoint Alerts**: Remind user to create checkpoints periodically
- **Checkpoint Diff**: Show differences between current state and checkpoint
- **Checkpoint Merging**: Combine multiple checkpoints
