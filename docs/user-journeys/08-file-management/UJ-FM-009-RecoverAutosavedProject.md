# [UJ-FM-009] Recover Autosaved Project

## Overview

This user journey covers recovering a project from autosave backup after an unexpected crash or closure, enabling users to restore their work to the last automatically saved state.

## PRD References

- **FR-FM-009**: User shall be able to recover autosaved projects
- **US-FM-009**: As a designer, I want to recover autosaved work so that I don't lose progress after a crash
- **AC-FM-009-001**: Autosave creates backup every 5 minutes
- **AC-FM-009-002**: Recovery prompt shows on startup if autosave exists
- **AC-FM-009-003**: Recovery shows last autosave timestamp
- **AC-FM-009-004**: User can choose to recover or discard autosave
- **AC-FM-009-005**: Recovered project opens with unsaved changes indicator
- **AC-FM-009-006**: Original file unchanged until user saves

## Prerequisites

- Application previously crashed or closed unexpectedly
- Autosave file exists from previous session
- User launches application
- Dashboard page loads

## User Journey Steps

### Step 1: Detect Autosave on Startup

**User Action**: Launch application after crash

**Expected Result**:
- Application startup:
  - Tauri app initializes
  - Dashboard page loads
  - Background: Check for autosave files
- Autosave detection:
  - Scan autosave directory: `~/.hvac-canvas/autosave/`
  - Find autosave file: `project-uuid-123.autosave.sws`
  - Read autosave metadata:
    - Original file: `/Users/john/Projects/Office_HVAC.sws`
    - Timestamp: 2025-12-29 14:35:22 (5 minutes ago)
    - Entity count: 45
    - Last action: "Draw Duct"
  - Compare timestamps:
    - Autosave: 14:35:22
    - Original file: 14:20:15 (saved 15 minutes ago)
    - Autosave is newer ✓
- Recovery prompt triggered:
  - Modal dialog appears
  - Blocks dashboard interaction
  - User must respond
- Dialog content:
  - **Title**: "Unsaved Work Found"
  - **Icon**: ℹ️ or recovery icon
  - **Message**: "The application closed unexpectedly. An autosaved version of your project is available."
  - **Details**:
    - File: "Office_HVAC.sws"
    - Last autosave: "5 minutes ago (2:35 PM)"
    - Unsaved changes: "45 entities"
  - **Actions**:
    - [Recover] (primary button)
    - [Discard] (secondary button)
    - [View Details] (link)
- Visual emphasis:
  - Primary button highlighted
  - Default action: Recover
  - Enter key = Recover

**Validation Method**: E2E test - Verify autosave detection and recovery prompt

---

### Step 2: View Recovery Details

**User Action**: Click "View Details" in recovery dialog

**Expected Result**:
- Details panel expands:
  - **Original File**:
    - Path: `/Users/john/Projects/Office_HVAC.sws`
    - Last saved: 2:20 PM (15 minutes ago)
    - Size: 125 KB
  - **Autosave File**:
    - Path: `~/.hvac-canvas/autosave/project-uuid-123.autosave.sws`
    - Created: 2:35 PM (5 minutes ago)
    - Size: 132 KB (7 KB larger)
  - **Changes**:
    - Entities added: 3 (2 ducts, 1 room)
    - Entities modified: 5
    - Entities deleted: 0
    - Total actions: 8 (last 15 minutes)
  - **Last Actions**:
    - 2:35 PM - Draw Duct (500 CFM)
    - 2:33 PM - Resize Room B (200×150 → 250×150)
    - 2:31 PM - Create Room C
    - 2:29 PM - Delete Note
    - 2:27 PM - Draw Duct (400 CFM)
- Comparison view:
  - Side-by-side timestamps
  - Clear what would be recovered
  - User informed decision
- Actions still available:
  - [Recover] - Restore autosave
  - [Discard] - Delete autosave, use original
  - [Cancel] - Return to simple dialog

**Validation Method**: Integration test - Verify details panel content

---

### Step 3: Recover Autosaved Project

**User Action**: Click "Recover" button

**Expected Result**:
- Recovery process initiated:
  - Load autosave file: `project-uuid-123.autosave.sws`
  - Parse JSON content
  - Validate schema (Zod validation)
  - Restore all state:
    - Entities (45 entities)
    - Viewport (pan, zoom)
    - Selection state (cleared)
    - History stack (last 100 actions)
    - Layer visibility
    - Settings
- Project state loaded:
  - All stores hydrated:
    - `projectStore`: Project metadata
    - `entityStore`: 45 entities
    - `connectionStore`: All connections
    - `layerStore`: Layer states
    - `historyStore`: Command history
    - `viewportStore`: View settings
- Canvas rendering:
  - Navigate to Canvas page
  - Render all 45 entities
  - Restore viewport position
  - Apply layer visibility
- Project metadata:
  - **File path**: `/Users/john/Projects/Office_HVAC.sws`
  - **Status**: Unsaved changes ⚠️
  - **Last saved**: 2:20 PM (original save)
  - **Current state**: From autosave at 2:35 PM
- Visual indicators:
  - Title bar: "Office_HVAC.sws *" (asterisk = unsaved)
  - Status bar: "Recovered from autosave (5 minutes ago)"
  - Warning banner: "⚠️ This project was recovered from autosave. Save to preserve changes."
- Autosave cleanup:
  - Autosave file moved to: `~/.hvac-canvas/autosave/recovered/`
  - Or: Deleted after successful recovery
  - Prevents repeat recovery prompts
- Undo/redo:
  - History stack restored
  - Can undo to states before crash
  - Full undo/redo available
- Status message:
  - Toast: "Project recovered from autosave"
  - Disappears after 5 seconds

**Validation Method**: Integration test - Verify project recovery and state restoration

---

### Step 4: Save Recovered Project

**User Action**: Press Ctrl+S to save recovered project

**Expected Result**:
- Save operation:
  - Serialize current state to JSON
  - Write to original file: `/Users/john/Projects/Office_HVAC.sws`
  - Overwrite previous version
  - File size: 132 KB (matches autosave)
- File system:
  - Original file updated
  - Timestamp: Current time (2:40 PM)
  - Autosave file deleted (no longer needed)
- Project state:
  - **Status**: Saved ✓
  - **Last saved**: 2:40 PM (just now)
  - Unsaved indicator cleared
- Visual updates:
  - Title bar: "Office_HVAC.sws" (no asterisk)
  - Warning banner dismissed
  - Status bar: "Saved successfully"
- New autosave cycle:
  - Autosave timer resets
  - Next autosave in 5 minutes (2:45 PM)
  - Clean state baseline
- Recent files:
  - "Office_HVAC.sws" moved to top
  - Timestamp updated

**Validation Method**: E2E test - Verify save after recovery

---

### Step 5: Discard Autosave (Alternative Path)

**User Action**: Click "Discard" in recovery dialog

**Expected Result**:
- Discard confirmation:
  - Secondary confirmation dialog:
    - "Are you sure you want to discard autosaved changes?"
    - "This cannot be undone."
    - [Discard Changes] [Cancel]
  - Prevents accidental data loss
- User confirms discard:
  - Click "Discard Changes"
- Autosave cleanup:
  - Delete autosave file: `project-uuid-123.autosave.sws`
  - File permanently removed
  - Cannot recover again
- Dashboard state:
  - Return to normal dashboard
  - No project loaded
  - Recent files list shown
- User can now:
  - Open original file (last saved version at 2:20 PM)
  - Lost changes: Last 15 minutes of work
  - Open different project
  - Create new project
- Status message:
  - Toast: "Autosave discarded"
  - No warning (user confirmed)

**Validation Method**: Integration test - Verify autosave discard

---

## Edge Cases

### 1. Multiple Autosave Files Found

**User Action**: Launch app with autosaves for 3 different projects

**Expected Behavior**:
- Autosave scan finds:
  - `project-a.autosave.sws` (Office HVAC)
  - `project-b.autosave.sws` (Warehouse Design)
  - `project-c.autosave.sws` (Retail Store)
- Recovery dialog shows list:
  - **Title**: "Multiple Unsaved Projects Found"
  - **List**:
    - ☑️ Office_HVAC.sws (5 minutes ago, 45 entities)
    - ☑️ Warehouse_Design.sws (2 hours ago, 78 entities)
    - ☑️ Retail_Store.sws (1 day ago, 32 entities)
  - Checkboxes to select which to recover
  - Sorted by timestamp (newest first)
- User actions:
  - Select specific projects to recover
  - Select all / Deselect all
  - [Recover Selected] [Discard All]
- Recovery process:
  - Open each selected project in order
  - Tabs for multiple projects (if supported)
  - Or: Open first, show "2 more to recover" notification
- Autosave cleanup:
  - Move recovered autosaves to recovered/
  - Delete discarded autosaves
  - Clean slate for next session

**Validation Method**: Integration test - Verify multiple autosave recovery

---

### 2. Autosave Newer But Original File Deleted

**User Action**: Original file deleted, but autosave exists

**Expected Behavior**:
- Autosave scan:
  - Find: `project-uuid-123.autosave.sws`
  - Original path: `/Users/john/Projects/Office_HVAC.sws`
  - Original file: NOT FOUND ❌
- Recovery dialog:
  - **Warning**: "Original file not found"
  - **Message**: "The autosave file exists, but the original project file was deleted or moved."
  - **Actions**:
    - [Recover and Save As...] - Restore and choose new location
    - [Discard] - Delete autosave
- User recovers:
  - Load autosave data
  - Immediately show "Save As" dialog
  - User chooses new file path
  - Save recovered project to new location
- Autosave cleanup:
  - Delete original autosave after successful save
  - Associate new file with recovered data

**Validation Method**: Integration test - Verify missing original file handling

---

### 3. Autosave File Corrupted

**User Action**: Autosave file exists but is corrupted

**Expected Behavior**:
- Recovery attempt:
  - Load autosave file
  - Parse JSON: FAILS (corrupted data)
  - Schema validation: FAILS
  - Corruption detected
- Error handling:
  - Log error details
  - Show error dialog:
    - **Title**: "Cannot Recover Autosave"
    - **Message**: "The autosave file is corrupted and cannot be recovered."
    - **Details**: "JSON parse error at line 1234"
    - **Actions**: [Open Original File] [Discard Autosave]
- User options:
  - Open original file (last good save)
  - Lose changes from autosave
  - Report bug (include corrupted file)
- Autosave cleanup:
  - Move corrupted file to: `~/.hvac-canvas/autosave/corrupted/`
  - Preserve for debugging
  - Don't delete (may contain recoverable data)
- Prevention:
  - Autosave validation before write
  - Atomic writes (temp file + rename)
  - CRC checksums (future)

**Validation Method**: Unit test - Verify corrupted autosave handling

---

### 4. Autosave Older Than Original (User Saved After)

**User Action**: Autosave exists but original file is newer

**Expected Behavior**:
- Timestamp comparison:
  - Autosave: 2:35 PM
  - Original: 2:45 PM (10 minutes newer)
  - Original is more recent ✓
- Recovery decision:
  - **Option A (No Prompt)**: Silently delete old autosave
    - Autosave is stale
    - Original has newer changes
    - No recovery needed
  - **Option B (Inform)**: Show notification
    - "Autosave found but original file is newer. Autosave deleted."
    - User informed, no action needed
- Default: Option A (silent cleanup)
- Autosave cleanup:
  - Delete stale autosave
  - No recovery prompt
- Normal startup:
  - Dashboard loads normally
  - No interruption

**Validation Method**: Unit test - Verify timestamp comparison

---

### 5. Recovery During Unsaved Project

**User Action**: Working on new project, trigger recovery for different project

**Expected Behavior**:
- Scenario:
  - User has new unsaved project open (Project A)
  - Autosave for different project found (Project B)
- Recovery prompt:
  - Shows recovery dialog for Project B
  - Warning: "You have unsaved changes in current project"
  - Options:
    - [Save Current and Recover] - Save Project A, then recover B
    - [Discard Current and Recover] - Close A, recover B
    - [Ignore Recovery] - Continue with A, dismiss recovery
- User choice handling:
  - Save Current: Prompt for save location, then recover
  - Discard Current: Close without saving, recover
  - Ignore: Dismiss dialog, mark autosave as ignored
- Autosave cleanup:
  - If recovered: Move/delete as normal
  - If ignored: Keep autosave, prompt again next launch
- Multiple projects:
  - Support multiple open projects (tabs)
  - Or: Single project limit, enforce save/close

**Validation Method**: Integration test - Verify unsaved project conflict

---

## Error Scenarios

### 1. Autosave Directory Not Accessible

**Scenario**: Permissions issue prevents reading autosave directory

**Expected Handling**:
- Directory access attempt:
  - Path: `~/.hvac-canvas/autosave/`
  - Operation: Read directory
  - Error: Permission denied
- Error handling:
  - Log error: "Cannot access autosave directory"
  - No recovery prompt shown
  - Normal startup continues
- User notification:
  - Status bar: "⚠️ Autosave not available (permission error)"
  - Or: Silent (no autosave, no recovery)
- Functionality impact:
  - No autosave this session
  - Manual save still works
  - Recovery unavailable
- User action:
  - Fix permissions: `chmod 755 ~/.hvac-canvas/autosave/`
  - Restart application
  - Autosave resumes

**Validation Method**: Integration test - Verify permission error handling

---

### 2. Disk Full During Autosave Recovery

**Scenario**: Disk full when trying to save recovered project

**Expected Handling**:
- Recovery successful:
  - Autosave loaded into memory
  - Project state restored
  - Canvas rendering complete
- Save attempt (Ctrl+S):
  - Write to file: FAILS
  - Error: ENOSPC (No space left on device)
- Error dialog:
  - **Title**: "Cannot Save Project"
  - **Message**: "Disk is full. Free up space and try again."
  - **Actions**: [Retry] [Save As...] [Cancel]
- User actions:
  - Free disk space
  - Retry save
  - Or: Save to different drive
- Data preservation:
  - Project remains in memory
  - Autosave file preserved
  - Can retry save without data loss
- Alternative storage:
  - "Save As" to external drive
  - Save to network location
  - Copy to USB drive

**Validation Method**: Integration test - Verify disk full error handling

---

### 3. Schema Mismatch (Autosave from Older Version)

**Scenario**: Autosave created by older app version, schema changed

**Expected Handling**:
- Schema validation:
  - Load autosave file
  - Parse JSON: Success
  - Validate with Zod schema: FAILS
  - Schema version mismatch
- Migration attempt:
  - Detect schema version: v1.0
  - Current version: v1.2
  - Run migration: v1.0 → v1.2
  - **Option A (Success)**: Migration successful
    - Upgrade schema
    - Recover project
  - **Option B (Fail)**: Migration fails
    - Show error
- Error dialog (if migration fails):
  - **Title**: "Incompatible Autosave"
  - **Message**: "Autosave was created by an older version and cannot be recovered."
  - **Actions**: [Open Original File] [Discard Autosave] [Export Data]
- Data export option:
  - Export raw JSON
  - User can manually recover data
  - Or: Contact support
- Prevention:
  - Include schema version in autosave
  - Maintain backward compatibility
  - Support 2 previous versions

**Validation Method**: Integration test - Verify schema migration

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Accept Recovery (in dialog) | `Enter` |
| Discard Autosave (in dialog) | `Escape` or `D` |
| View Details | `Space` |
| Save Recovered Project | `Ctrl/Cmd + S` |

---

## Related Elements

- [AutosaveService](../../elements/11-services/AutosaveService.md) - Autosave functionality
- [RecoveryService](../../elements/11-services/RecoveryService.md) - Recovery logic
- [FileIO](../../elements/10-persistence/FileIO.md) - File reading/writing
- [ProjectIO](../../elements/10-persistence/ProjectIO.md) - Project serialization
- [projectStore](../../elements/02-stores/projectStore.md) - Project state
- [UJ-FM-007](./UJ-FM-007-AutoSaveProject.md) - Autosave creation
- [UJ-FM-002](./UJ-FM-002-OpenExistingProject.md) - Project opening

---

## Visual Diagram

```
Autosave Recovery Flow
┌────────────────────────────────────────────────────────┐
│  1. Application Crash                                  │
│     [App Running] → X CRASH                            │
│     Last autosave: 2:35 PM                             │
│     Autosave file saved to disk ✓                      │
│                                                        │
│  2. Relaunch Application                               │
│     User opens app                                     │
│     ↓                                                  │
│  3. Autosave Detection                                 │
│     Scan: ~/.hvac-canvas/autosave/                     │
│     Found: project-uuid-123.autosave.sws               │
│     Timestamp: 2:35 PM (newer than original)           │
│     ↓                                                  │
│  4. Recovery Prompt                                    │
│     ┌────────────────────────────────┐                 │
│     │ ℹ️  Unsaved Work Found         │                 │
│     ├────────────────────────────────┤                 │
│     │ Application closed unexpectedly│                 │
│     │ Autosave available:            │                 │
│     │                                │                 │
│     │ File: Office_HVAC.sws          │                 │
│     │ Last autosave: 5 minutes ago   │                 │
│     │ Unsaved changes: 45 entities   │                 │
│     │                                │                 │
│     │  [Recover]  [Discard]          │                 │
│     │  [View Details]                │                 │
│     └────────────────────────────────┘                 │
│     ↓                                                  │
│  5. User Recovers                                      │
│     Load autosave → Restore state → Open canvas        │
│     Status: Unsaved changes *                          │
│     ↓                                                  │
│  6. User Saves                                         │
│     Ctrl+S → Save to original file → Autosave deleted  │
│     Status: Saved ✓                                    │
└────────────────────────────────────────────────────────┘

Recovery Details Panel
┌────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────┐        │
│  │ ℹ️  Recovery Details                       │        │
│  ├────────────────────────────────────────────┤        │
│  │ Original File:                             │        │
│  │   Path: /Users/john/Projects/              │        │
│  │         Office_HVAC.sws                    │        │
│  │   Last saved: 2:20 PM (15 min ago)         │        │
│  │   Size: 125 KB                             │        │
│  │                                            │        │
│  │ Autosave File:                             │        │
│  │   Created: 2:35 PM (5 min ago)             │        │
│  │   Size: 132 KB (+7 KB)                     │        │
│  │                                            │        │
│  │ Changes Since Last Save:                   │        │
│  │   • Entities added: 3                      │        │
│  │   • Entities modified: 5                   │        │
│  │   • Entities deleted: 0                    │        │
│  │   • Total actions: 8                       │        │
│  │                                            │        │
│  │ Last Actions:                              │        │
│  │   2:35 PM - Draw Duct (500 CFM)            │        │
│  │   2:33 PM - Resize Room B                  │        │
│  │   2:31 PM - Create Room C                  │        │
│  │   2:29 PM - Delete Note                    │        │
│  │   2:27 PM - Draw Duct (400 CFM)            │        │
│  │                                            │        │
│  │         [Recover]  [Discard]               │        │
│  └────────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────┘

Multiple Autosave Recovery
┌────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────┐        │
│  │ ℹ️  Multiple Unsaved Projects Found        │        │
│  ├────────────────────────────────────────────┤        │
│  │ Select projects to recover:                │        │
│  │                                            │        │
│  │ ☑️ Office_HVAC.sws                         │        │
│  │    5 minutes ago • 45 entities             │        │
│  │                                            │        │
│  │ ☑️ Warehouse_Design.sws                    │        │
│  │    2 hours ago • 78 entities               │        │
│  │                                            │        │
│  │ ☐ Retail_Store.sws                         │        │
│  │    1 day ago • 32 entities                 │        │
│  │                                            │        │
│  │         [Recover Selected]  [Discard All]  │        │
│  │         [Select All]  [Deselect All]       │        │
│  └────────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────┘

Recovered Project Indicators
┌────────────────────────────────────────────────────────┐
│  Title Bar:                                            │
│  Office_HVAC.sws * ← Asterisk indicates unsaved       │
│                                                        │
│  Warning Banner (top of canvas):                       │
│  ┌────────────────────────────────────────────┐        │
│  │ ⚠️ This project was recovered from         │        │
│  │ autosave. Save to preserve changes.   [X]  │        │
│  └────────────────────────────────────────────┘        │
│                                                        │
│  Status Bar:                                           │
│  Recovered from autosave (5 minutes ago) • 45 entities │
└────────────────────────────────────────────────────────┘

Autosave File Lifecycle
┌────────────────────────────────────────────────────────┐
│  Normal Operation:                                     │
│  ┌──────────────┐                                      │
│  │ Edit Project │                                      │
│  └──────┬───────┘                                      │
│         ↓ Every 5 minutes                              │
│  ┌──────────────┐                                      │
│  │  Autosave    │                                      │
│  │  Created     │                                      │
│  └──────┬───────┘                                      │
│         │ Overwrite previous autosave                  │
│         ↓                                              │
│  ~/.hvac-canvas/autosave/project-uuid.autosave.sws     │
│                                                        │
│  After Manual Save:                                    │
│  User saves (Ctrl+S) → Delete autosave (clean state)   │
│                                                        │
│  After Crash:                                          │
│  Autosave preserved → Recovery prompt → Recover        │
│  → Move to recovered/ folder                           │
│                                                        │
│  After Discard:                                        │
│  User discards → Delete autosave permanently           │
└────────────────────────────────────────────────────────┘

Timestamp Comparison Logic
┌────────────────────────────────────────────────────────┐
│  Case 1: Autosave Newer (RECOVER)                      │
│  Original:  2:20 PM ────┐                              │
│  Autosave:  2:35 PM ────┼─→ Autosave is newer          │
│                         │   Show recovery prompt       │
│                         │                              │
│  Case 2: Original Newer (DELETE AUTOSAVE)              │
│  Original:  2:45 PM ────┼─→ Original is newer          │
│  Autosave:  2:35 PM ────┘   Delete stale autosave      │
│                             No recovery needed         │
│                                                        │
│  Case 3: Same Time (DELETE AUTOSAVE)                   │
│  Original:  2:35 PM ────┐                              │
│  Autosave:  2:35 PM ────┴─→ Same timestamp             │
│                            Delete autosave             │
│                            Already saved               │
└────────────────────────────────────────────────────────┘

Error Handling Flow
┌────────────────────────────────────────────────────────┐
│  Corrupted Autosave:                                   │
│  Load autosave → Parse JSON → FAIL                     │
│       ↓                                                │
│  Show error: "Cannot recover (corrupted)"              │
│  Options: [Open Original] [Discard Autosave]           │
│  Move corrupted file to corrupted/ folder              │
│                                                        │
│  Missing Original:                                     │
│  Load autosave → Check original → NOT FOUND            │
│       ↓                                                │
│  Warning: "Original file not found"                    │
│  Options: [Recover and Save As] [Discard]              │
│  Prompt for new save location                          │
│                                                        │
│  Schema Mismatch:                                      │
│  Load autosave → Validate schema → FAIL                │
│       ↓                                                │
│  Attempt migration v1.0 → v1.2                         │
│  If success: Recover                                   │
│  If fail: Show error, [Open Original] [Export Data]    │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/services/RecoveryService.test.ts`

**Test Cases**:
- Detect autosave file
- Compare timestamps
- Load autosave data
- Validate autosave schema
- Delete autosave after recovery
- Handle corrupted autosave

**Assertions**:
- Autosave file detected correctly
- Timestamp comparison accurate
- Autosave data parsed successfully
- Schema validation passes/fails appropriately
- Autosave file removed after use
- Corrupted file handled gracefully

---

### Integration Tests
**File**: `src/__tests__/integration/autosave-recovery.test.ts`

**Test Cases**:
- Complete recovery workflow
- Recover and save project
- Discard autosave
- Multiple autosave recovery
- Original file missing scenario
- Schema migration

**Assertions**:
- Recovery prompt appears
- Project state fully restored
- Save overwrites original file
- Autosave deleted after discard
- All projects recovered correctly
- Missing file handled with Save As
- Migration upgrades schema

---

### E2E Tests
**File**: `e2e/file-management/autosave-recovery.spec.ts`

**Test Cases**:
- Visual recovery prompt
- Recover button restores project
- Discard button removes autosave
- Recovered project shows unsaved indicator
- Save clears unsaved indicator
- View details expands panel

**Assertions**:
- Dialog visible on startup
- Canvas loads with recovered data
- Autosave file deleted
- Asterisk in title bar
- Asterisk removed after save
- Details panel shows correct info

---

## Common Pitfalls

### ❌ Don't: Automatically recover without user confirmation
**Problem**: User may prefer original version, loses control

**Solution**: Always prompt user, let them choose recover or discard

---

### ❌ Don't: Delete autosave before successful recovery
**Problem**: If recovery fails, autosave lost permanently

**Solution**: Keep autosave until recovery confirmed successful and saved

---

### ❌ Don't: Silently ignore corrupted autosave
**Problem**: User unaware of recovery failure, loses data

**Solution**: Show error dialog, move to corrupted/ folder, preserve for debugging

---

### ✅ Do: Show timestamp and change summary in recovery prompt
**Benefit**: User makes informed decision about recovery

---

### ✅ Do: Support undo/redo after recovery
**Benefit**: User can undo back to states before crash

---

## Performance Tips

### Optimization: Lazy Load Autosave Metadata
**Problem**: Loading full autosave file to check timestamp is slow

**Solution**: Store metadata in separate JSON file
- `project-uuid.autosave.meta.json` with timestamp, entity count
- Read metadata first (< 1KB)
- Load full autosave only if recovering
- 100x faster startup with many autosaves

---

### Optimization: Background Autosave Validation
**Problem**: Validating autosave schema blocks UI on startup

**Solution**: Validate in background worker
- Show recovery prompt immediately
- Validate schema asynchronously
- Update prompt if validation fails
- Non-blocking startup

---

### Optimization: Incremental Recovery
**Problem**: Loading 10,000 entities from autosave takes 10 seconds

**Solution**: Stream entities incrementally
- Load entities in batches of 100
- Render progressively
- Show loading indicator
- Responsive UI during recovery

---

## Future Enhancements

- **Autosave History**: Keep last 5 autosaves, allow recovery to any
- **Selective Recovery**: Recover specific entities/layers only
- **Cloud Autosave**: Sync autosaves to cloud for cross-device recovery
- **Conflict Resolution**: Merge autosave with manual changes
- **Recovery Preview**: Show side-by-side comparison before recovering
- **Automatic Recovery**: Auto-recover if timestamp very recent (< 1 minute)
- **Recovery Notifications**: Email/notification when autosave available
- **Version Control Integration**: Commit autosaves to git for history
- **Recovery Analytics**: Track recovery usage, improve autosave timing
- **Partial Recovery**: Recover specific time ranges, not all changes
