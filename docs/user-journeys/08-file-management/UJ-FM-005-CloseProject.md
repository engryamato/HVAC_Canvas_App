# [UJ-FM-005] Close Project

## Overview

This user journey covers closing the currently open project and returning to the dashboard, including unsaved changes handling, state cleanup, and navigation confirmation.

## PRD References

- **FR-FM-005**: User shall be able to close current project and return to dashboard
- **US-FM-005**: As a designer, I want to close projects when finished so that I can start new work or exit the app
- **AC-FM-005-001**: File → Close returns to dashboard
- **AC-FM-005-002**: Unsaved changes warning appears if project modified
- **AC-FM-005-003**: All project state cleared on close
- **AC-FM-005-004**: Recent files list updated with last-accessed time
- **AC-FM-005-005**: Keyboard shortcut Ctrl/Cmd+W closes project

## Prerequisites

- User is in Canvas Editor with a project open
- Project may have unsaved changes or be fully saved
- Dashboard page available for navigation

## User Journey Steps

### Step 1: Initiate Close Project

**User Action**: Click File menu → "Close Project" OR press `Ctrl/Cmd+W`

**Expected Result**:
- Close command triggered
- Check for unsaved changes:
  - Query `projectStore.hasUnsavedChanges` flag
  - If `true` → Proceed to Step 2 (unsaved changes warning)
  - If `false` → Skip to Step 4 (direct close)
- Close operation blocked until user decision
- UI remains responsive during check

**Validation Method**: Unit test - Verify close command checks unsaved changes flag

---

### Step 2: Handle Unsaved Changes Warning

**User Action**: (Automatic if unsaved changes detected)

**Expected Result**:
- Unsaved Changes Warning Dialog appears:
  - **Title**: "Unsaved Changes"
  - **Message**: "You have unsaved changes to '{Project Name}'. What would you like to do?"
  - **Details**: "Last saved: 5 minutes ago" or "Never saved"
  - **Three action buttons**:
    - **"Save and Close"** (primary, blue)
    - **"Discard Changes"** (destructive, red)
    - **"Cancel"** (default on Escape)
- Dialog modal (blocks other actions)
- Keyboard navigation:
  - Tab cycles through buttons
  - Enter activates focused button
  - Escape closes dialog (same as Cancel)
- Close operation paused until user chooses

**Validation Method**: E2E test - Verify unsaved changes dialog appears

---

### Step 3: User Chooses Action

**User Action**: Click "Save and Close" button

**Expected Result**:
- Save operation initiated:
  - Display "Saving project..." loading state
  - Call `triggerManualSave()` function
  - Wait for save completion (async)
- If save succeeds:
  - `hasUnsavedChanges` set to `false`
  - Success toast: "Project saved"
  - Proceed to Step 4 (close project)
- If save fails:
  - Error toast: "Failed to save project: {error message}"
  - Dialog remains open with options:
    - "Retry Save" - Attempt save again
    - "Discard Changes" - Close without saving
    - "Cancel" - Stay in project
  - User can retry or change decision
- Alternative: "Discard Changes" chosen:
  - No save operation
  - Set `hasUnsavedChanges` to `false`
  - Confirmation prompt: "Are you sure you want to discard all changes? This cannot be undone."
  - If confirmed → Proceed to Step 4
- Alternative: "Cancel" chosen:
  - Dialog closes
  - Close operation cancelled
  - User remains in canvas editor
  - Project unchanged

**Validation Method**: Integration test - Verify save-and-close workflow

---

### Step 4: Clear Project State

**User Action**: (Automatic after save/discard decision)

**Expected Result**:
- Application state cleared:
  - **Entity Store**: `entityStore.clear()`
    - Remove all entities from `byId` object
    - Clear `allIds` array
    - Reset entity count to 0
  - **Selection Store**: `selectionStore.clear()`
    - Clear `selectedIds` array
    - Reset selection bounds
  - **History Store**: `historyStore.clear()`
    - Clear undo stack
    - Clear redo stack
    - Reset history position
  - **Viewport Store**: `viewportStore.reset()`
    - Reset pan to (0, 0)
    - Reset zoom to 1.0
    - Clear viewport transforms
  - **Project Store**: `projectStore.closeProject()`
    - Clear active project metadata
    - Clear file path
    - Set `hasUnsavedChanges` to `false`
    - Set `activeProjectId` to `null`
  - **Canvas Store**: `canvasStore.reset()`
    - Clear canvas context
    - Reset tool to Select
    - Clear temporary drawing state
- Memory cleanup:
  - Garbage collection hint (if supported)
  - Large objects dereferenced
  - Canvas cleared and reset
- No data persists from closed project

**Validation Method**: Integration test - Verify all stores cleared

---

### Step 5: Navigate to Dashboard

**User Action**: (Automatic after state cleared)

**Expected Result**:
- Update recent files list:
  - Add/update entry for closed project:
    - Project name
    - File path
    - Last accessed: Current timestamp
    - Thumbnail (if available)
  - Move to top of recent files
  - Persist to local storage/database
- Navigation to dashboard:
  - Router navigates to `/dashboard`
  - Canvas editor unmounts
  - Dashboard page loads
- Dashboard displays:
  - Recent files list (closed project at top)
  - "Create New Project" button
  - "Open from File" button
  - Quick actions
- Success toast: "Project closed" (brief, 2 seconds)
- Window title updates: "SizeWise - Dashboard"
- Keyboard focus: On dashboard content
- Close operation complete

**Validation Method**: E2E test - Verify navigation to dashboard and recent files update

---

## Edge Cases

### 1. Close Project with No File Path (Never Saved)

**User Action**: Create new project, add entities, close without saving

**Expected Behavior**:
- Unsaved changes detected (entities added)
- Warning dialog appears
- Options:
  - **"Save and Close"** → Opens Save As dialog (no file path exists)
  - User must choose save location
  - After save → Project closed
  - **"Discard Changes"** → All work lost, close immediately
  - Extra confirmation: "Project has never been saved. All work will be lost. Continue?"
- If user cancels Save As dialog:
  - Return to warning dialog
  - Can retry or discard

**Validation Method**: Integration test - Verify Save As triggered for unsaved projects

---

### 2. Close Project Quickly (Double-Click Close)

**User Action**: Press Ctrl+W twice rapidly

**Expected Behavior**:
- First press triggers close
- Second press ignored (close already in progress)
- Debouncing prevents duplicate dialogs
- Single warning dialog shown
- Flag prevents re-entry: `isClosing = true`
- After close completes, flag reset
- No multiple navigations or errors

**Validation Method**: Unit test - Verify close operation is debounced

---

### 3. Close Project During Auto-Save

**User Action**: Close project while auto-save timer running (background save in progress)

**Expected Behavior**:
- Detect auto-save in progress
- Options:
  - **Wait for auto-save** to complete (1-2 seconds)
    - Show: "Saving project..." spinner
    - After save completes → Close without warning (no unsaved changes)
  - **Cancel auto-save** if user chooses "Discard Changes"
    - Abort background save
    - Proceed with close
- No conflicting save operations
- No corrupt file writes

**Validation Method**: Integration test - Verify auto-save coordination with close

---

### 4. Close Project with Pending Calculations

**User Action**: Close project while background calculations running (large system analysis)

**Expected Behavior**:
- Detect pending background tasks
- Warning: "Calculations in progress. Closing now may lose results."
- Options:
  - **"Wait for Calculations"** - Pause close until complete
  - **"Stop and Close"** - Cancel calculations, close immediately
  - **"Cancel"** - Stay in project
- If wait chosen:
  - Progress indicator: "Completing calculations... 75%"
  - Close proceeds after completion
- If stop chosen:
  - Background tasks cancelled
  - Resources cleaned up
  - Close proceeds

**Validation Method**: Integration test - Verify background task handling

---

### 5. Close Last Open Project (No Projects Open After)

**User Action**: Close only open project, resulting in no active projects

**Expected Behavior**:
- Close proceeds normally
- Dashboard shows empty state:
  - Message: "No projects open"
  - Prominent "Create New Project" button
  - Recent files list still visible
  - Quick start guide (optional)
- Application remains open (doesn't exit)
- User can create or open another project
- No errors from null project state

**Validation Method**: E2E test - Verify dashboard empty state

---

## Error Scenarios

### 1. Save Fails During "Save and Close"

**Scenario**: User chooses "Save and Close" but disk is full

**Expected Handling**:
- Save operation fails with error
- Error dialog appears:
  - **Title**: "Cannot Save Project"
  - **Message**: "Insufficient disk space. Project not saved."
  - **Details**: Technical error message
  - **Options**:
    - "Retry Save" - Attempt save again
    - "Save As..." - Choose different location/filename
    - "Discard Changes" - Close without saving
    - "Cancel" - Return to project
- Close operation blocked until resolved
- User can free disk space and retry
- Or save to different location
- Or discard changes if acceptable
- Project not closed until user decides

**Validation Method**: Unit test - Verify error handling during save-and-close

---

### 2. State Cleanup Failure

**Scenario**: Entity store throws error during clear operation

**Expected Handling**:
- Error caught during state cleanup
- Log error: "Failed to clear entity store: {error}"
- Attempt partial cleanup:
  - Continue clearing other stores
  - Skip failed store
- Warning toast: "Project closed with errors. Please restart app."
- Navigation to dashboard proceeds anyway
- Dashboard may show stale data
- Recommend app restart for clean state
- No crash or hang

**Validation Method**: Unit test - Verify graceful degradation on cleanup errors

---

### 3. Navigation Failure

**Scenario**: Router fails to navigate to dashboard

**Expected Handling**:
- Navigation error caught
- Error logged: "Failed to navigate to dashboard"
- Retry navigation once
- If retry fails:
  - Manual fallback: `window.location.href = '/dashboard'`
  - Forces full page reload
- User reaches dashboard eventually
- State still cleared (close successful)
- No stuck state

**Validation Method**: Integration test - Verify navigation error recovery

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Close Project | `Ctrl/Cmd + W` |
| Save and Close | `Ctrl/Cmd + Shift + W` (if unsaved) |
| Force Close (Discard) | `Ctrl/Cmd + Alt + W` (dev only) |

---

## Related Elements

- [UnsavedChangesDialog](../../elements/01-components/canvas/UnsavedChangesDialog.md) - Warning dialog component
- [projectStore](../../elements/02-stores/projectStore.md) - Project state management
- [entityStore](../../elements/02-stores/entityStore.md) - Entity state (cleared on close)
- [historyStore](../../elements/09-commands/HistoryStore.md) - Undo/redo state (cleared)
- [ProjectIO](../../elements/10-persistence/ProjectIO.md) - Save operations
- [DashboardPage](../../elements/12-pages/DashboardPage.md) - Navigation target
- [CanvasEditorPage](../../elements/12-pages/CanvasEditorPage.md) - Current page (unmounted)
- [UJ-FM-006](./UJ-FM-006-HandleUnsavedChangesWarning.md) - Unsaved changes handling
- [UJ-FM-003](./UJ-FM-003-SaveProjectFile.md) - Save operation (prerequisite)

---

## Visual Diagram

```
Close Project Flow
┌────────────────────────────────────────────────────────┐
│  User Triggers Close (Ctrl+W or File → Close)         │
│    ↓                                                   │
│  Check for Unsaved Changes                            │
│    ↓                           ↓                       │
│  Has Changes?              No Changes                  │
│    ↓ Yes                       ↓                       │
│  Show Warning Dialog        Skip Warning              │
│    ↓                           ↓                       │
│  User Chooses:              Clear State                │
│    - Save and Close            ↓                       │
│    - Discard Changes       Navigate to Dashboard      │
│    - Cancel                    ↓                       │
│    ↓                       Close Complete              │
│  Execute Choice                                        │
│    ↓                                                   │
│  Clear State                                           │
│    ↓                                                   │
│  Navigate to Dashboard                                 │
└────────────────────────────────────────────────────────┘

State Cleanup Process:
┌────────────────────────────────────────────────────────┐
│  Before Close:                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ entityStore: { byId: {...}, allIds: [...] }      │ │
│  │ selectionStore: { selectedIds: [...] }           │ │
│  │ historyStore: { undoStack: [...], redoStack: [] }│ │
│  │ viewportStore: { pan: (100, 50), zoom: 1.5 }     │ │
│  │ projectStore: { activeProjectId: 'uuid-123' }    │ │
│  └──────────────────────────────────────────────────┘ │
│                      ↓ clear()                         │
│  After Close:                                          │
│  ┌──────────────────────────────────────────────────┐ │
│  │ entityStore: { byId: {}, allIds: [] }            │ │
│  │ selectionStore: { selectedIds: [] }              │ │
│  │ historyStore: { undoStack: [], redoStack: [] }   │ │
│  │ viewportStore: { pan: (0, 0), zoom: 1.0 }        │ │
│  │ projectStore: { activeProjectId: null }          │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘

Unsaved Changes Decision Tree:
┌────────────────────────────────────────────────────────┐
│  Close Project                                         │
│    ↓                                                   │
│  Has Unsaved Changes?                                  │
│    ↓                           ↓                       │
│   Yes                          No                      │
│    ↓                           ↓                       │
│  Show Warning              Clear State                 │
│    ↓                       Navigate Away               │
│  User Chooses:                                         │
│    ↓            ↓             ↓                        │
│  Save       Discard       Cancel                       │
│    ↓            ↓             ↓                        │
│  Save()      Confirm?      Close                       │
│    ↓            ↓          Dialog                      │
│  Success?    Yes  No       Stay in                     │
│   ↓  ↓        ↓   ↓        Project                     │
│  Yes No      Lose Cancel                               │
│   ↓  ↓       Work                                      │
│  Close Retry  ↓                                        │
│           Clear                                        │
│           State                                        │
│            ↓                                           │
│         Navigate                                       │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/stores/projectStore.close.test.ts`

**Test Cases**:
- Close project with no unsaved changes
- Close project with unsaved changes triggers warning
- Save-and-close workflow
- Discard-and-close workflow
- Cancel close operation
- State cleanup on close

**Assertions**:
- `hasUnsavedChanges` flag checked before close
- All stores cleared after close
- `activeProjectId` set to null
- Close operation cancellable

---

### Integration Tests
**File**: `src/__tests__/integration/project-close.test.ts`

**Test Cases**:
- Complete close workflow (with save)
- Complete close workflow (without save)
- Close during auto-save
- Close with background tasks
- Recent files list updated
- Navigation to dashboard

**Assertions**:
- Project saved before close (if Save chosen)
- All state stores empty after close
- Recent files contains closed project
- Dashboard displays correctly
- No memory leaks after close

---

### E2E Tests
**File**: `e2e/file-management/close-project.spec.ts`

**Test Cases**:
- File menu → Close Project
- Keyboard shortcut Ctrl+W
- Unsaved changes warning dialog
- Save and Close button
- Discard Changes button
- Cancel button
- Dashboard navigation
- Recent files display

**Assertions**:
- Close command accessible from File menu
- Ctrl+W triggers close
- Warning dialog appears for unsaved changes
- Dashboard loads after close
- Closed project appears in recent files
- Can open new project after close

---

## Common Pitfalls

### ❌ Don't: Close project without checking unsaved changes
**Problem**: User loses work unintentionally

**Solution**: Always check `hasUnsavedChanges` flag and warn user

---

### ❌ Don't: Leave state from closed project in memory
**Problem**: Memory leaks, stale data affecting new projects

**Solution**: Explicitly clear all stores on close

---

### ❌ Don't: Allow multiple close operations simultaneously
**Problem**: Race conditions, duplicate dialogs, navigation errors

**Solution**: Use `isClosing` flag to prevent re-entry

---

### ✅ Do: Update recent files list on every close
**Benefit**: User can quickly reopen recently closed projects

---

### ✅ Do: Provide clear keyboard shortcut (Ctrl+W)
**Benefit**: Matches standard application behavior, user expectations

---

## Performance Tips

### Optimization: Lazy State Cleanup
**Problem**: Clearing thousands of entities synchronously blocks UI

**Solution**: Clear stores asynchronously in background
- Navigate to dashboard immediately
- Clear state after navigation (non-blocking)
- User sees dashboard faster
- Cleanup happens during idle time

---

### Optimization: Batch Store Clear Operations
**Problem**: Each store clear triggers subscriptions and re-renders

**Solution**: Suspend subscriptions during close
- Batch all clear operations
- Single notification after all cleared
- Prevents cascade of re-renders
- 10x faster close operation

---

### Optimization: Defer Garbage Collection
**Problem**: Large project cleanup can cause GC pause (lag spike)

**Solution**: Hint garbage collector to defer collection
- Clear references incrementally
- Allow GC to run during idle
- Smooth user experience
- No visible lag on close

---

## Future Enhancements

- **Close Confirmation Preference**: "Don't ask again" option for experienced users
- **Project Snapshots**: Auto-save snapshot before close for easy recovery
- **Close All Projects**: Close multiple open projects (tab support)
- **Smart Close**: Suggest saving only if significant changes made
- **Close and Exit**: Single command to close project and quit application
- **Session Restore**: Automatically reopen last closed project on next launch
- **Close Animation**: Smooth transition animation from canvas to dashboard
- **Quick Reopen**: Keyboard shortcut to reopen last closed project
