# [UJ-FM-007] Auto-Save Project

## Overview

This user journey covers the automatic background saving of project changes at regular intervals to prevent data loss, including save timing, conflict resolution, error handling, and user notification of save status.

## PRD References

- **FR-FM-007**: Application shall auto-save projects at configurable intervals
- **US-FM-007**: As a designer, I want my work saved automatically so that I don't lose progress
- **AC-FM-007-001**: Auto-save triggers every 5 minutes (configurable)
- **AC-FM-007-002**: Auto-save only occurs when unsaved changes exist
- **AC-FM-007-003**: Save indicator shows "Saving..." during auto-save
- **AC-FM-007-004**: Auto-save does not interrupt user workflow
- **AC-FM-007-005**: Failed auto-save shows error notification with retry option
- **AC-FM-007-006**: User can disable auto-save in settings

## Prerequisites

- User is in Canvas Editor with project open
- Project has been saved at least once (has file path) OR auto-save creates temp file
- User has made at least one change since last save
- Auto-save enabled in settings (default: enabled)

## User Journey Steps

### Step 1: User Makes Changes

**User Action**: Create room entity, modify duct, or perform any edit action

**Expected Result**:
- Change detected by entity store
- `hasUnsavedChanges` flag set to `true`
- Auto-save timer started/reset:
  - Timer: 5 minutes (300,000ms)
  - Timer type: Debouncing (resets on each change)
  - Timer runs in background (non-blocking)
- Visual indicator updates:
  - Window title: "Office HVAC * - SizeWise" (asterisk)
  - Status bar: "Unsaved changes" with yellow dot
  - Last saved time: Shows time of last successful save
- Auto-save scheduled for 5 minutes from now
- User continues working uninterrupted

**Validation Method**: Unit test - Verify auto-save timer starts on change

---

### Step 2: Auto-Save Timer Expires

**User Action**: (Automatic after 5 minutes of inactivity)

**Expected Result**:
- Timer expires after 5 minutes
- Pre-save checks performed:
  - Check `hasUnsavedChanges` === `true`
  - Check project has file path OR create temp path
  - Check no manual save currently in progress
  - Check no critical operation blocking (dialog open, etc.)
- If all checks pass:
  - Auto-save operation begins
  - Status bar updates: "Auto-saving..." with spinning icon
  - Window title keeps asterisk (save in progress)
- If checks fail:
  - Auto-save skipped
  - Timer reset for another 5 minutes
  - Logged: "Auto-save skipped: {reason}"
- User workflow not interrupted:
  - Can continue editing during save
  - Canvas remains responsive
  - No modal dialogs or blocking

**Validation Method**: Integration test - Verify auto-save triggers after timer

---

### Step 3: Execute Background Save

**User Action**: (Automatic)

**Expected Result**:
- Save operation runs in background thread/worker:
  - Collect project data from stores (non-blocking read)
  - Serialize to JSON format
  - Validate against schema
  - Write to file system
- Save process:
  - Same logic as manual save (File → Save)
  - Uses existing file path
  - Atomic write (temp file + rename)
  - Preserves file permissions
- Progress tracking:
  - Stage 1: "Collecting data..." (50ms)
  - Stage 2: "Writing file..." (100-500ms)
  - Stage 3: "Verifying..." (50ms)
- Total duration: 200-600ms typical
- User can continue editing during entire process
- New changes made during save:
  - Flagged for next auto-save
  - Don't block current save
  - Timer resets after current save completes

**Validation Method**: Integration test - Verify background save execution

---

### Step 4: Auto-Save Completes Successfully

**User Action**: (Automatic)

**Expected Result**:
- Save completes without errors
- File written successfully to disk
- State updates:
  - `hasUnsavedChanges` set to `false`
  - `lastSavedTime` updated to current timestamp
  - `lastSaveType` set to "auto" (vs "manual")
- Visual feedback:
  - Status bar: "Auto-saved" with green checkmark (brief, 2 seconds)
  - Then: "Last saved: Just now"
  - Window title: Asterisk removed (if no new changes)
  - Save indicator: Green dot (success)
- Subtle notification:
  - Small toast in corner: "Auto-saved" (optional)
  - Auto-dismiss after 2 seconds
  - Non-intrusive (doesn't block view)
- Auto-save timer:
  - Stopped (no unsaved changes)
  - Will restart on next change
- Undo/redo stack preserved (not affected by save)

**Validation Method**: E2E test - Verify auto-save success feedback

---

### Step 5: Continue Working After Auto-Save

**User Action**: User continues editing after auto-save completes

**Expected Result**:
- Edit operation proceeds normally
- New change detected
- `hasUnsavedChanges` set to `true` again
- Auto-save timer resets and starts:
  - 5 minutes from this new change
  - Previous auto-save complete and cleared
- Window title: Asterisk reappears
- Status bar: "Unsaved changes" again
- Last saved indicator:
  - Shows: "Last saved: 30 seconds ago"
  - Updates every minute: "1 minute ago", "2 minutes ago", etc.
- Cycle repeats:
  - Edit → Wait 5 min → Auto-save → Edit → Repeat
- User never needs to manually save (unless closing/exiting)

**Validation Method**: Integration test - Verify auto-save cycle repeats

---

## Edge Cases

### 1. Auto-Save First-Time Project (No File Path)

**User Action**: Create new project, make changes, wait for auto-save

**Expected Behavior**:
- Project has no file path (never saved)
- Auto-save timer expires
- Auto-save detects missing file path
- Two options:
  - **Option A (Temp Save)**: Save to temp directory
    - Path: `~/.sizewise/autosave/project-{id}-{timestamp}.sws`
    - Silent save (no user prompt)
    - Can recover on crash
    - File deleted after manual save to real location
  - **Option B (Prompt Save As)**: Show Save As dialog
    - "Auto-save requires save location"
    - User chooses where to save
    - After saved, auto-save uses that path going forward
- Default: Option A (less intrusive)
- Status bar: "Auto-saved to temporary location"

**Validation Method**: Integration test - Verify temp file auto-save

---

### 2. Rapid Changes (Timer Reset)

**User Action**: User makes 20 changes in rapid succession (every 10 seconds)

**Expected Behavior**:
- Each change resets auto-save timer
- Timer: Debouncing behavior
  - Change 1: Timer starts at 5 min
  - Change 2 (10 sec later): Timer resets to 5 min
  - Change 3 (10 sec later): Timer resets to 5 min
  - ...continues
- Auto-save only triggers 5 minutes after LAST change
- Prevents excessive saves during active editing
- Once user stops editing for 5 minutes → Auto-save executes
- Efficient: One save for entire edit session, not 20 saves

**Validation Method**: Unit test - Verify timer debouncing

---

### 3. Auto-Save During Manual Save

**User Action**: User presses Ctrl+S while auto-save is running

**Expected Behavior**:
- Manual save triggered
- Detects auto-save in progress
- Two options:
  - **Option A (Wait)**: Wait for auto-save to complete, then skip manual save
    - Auto-save already saving same changes
    - Manual save becomes redundant
    - Status: "Already saving..."
  - **Option B (Queue)**: Queue manual save after auto-save
    - Auto-save completes
    - Then manual save executes (guarantees user-initiated save)
- Default: Option A (avoid duplicate work)
- User sees: "Saving..." → "Saved" (no distinction shown)
- No conflicts or errors

**Validation Method**: Integration test - Verify concurrent save handling

---

### 4. Auto-Save Disabled in Settings

**User Action**: User disables auto-save in Settings → Preferences

**Expected Behavior**:
- Auto-save setting toggled to OFF
- Current auto-save timer (if running) cancelled
- No future auto-saves triggered
- User responsible for manual saves (Ctrl+S or File → Save)
- Unsaved changes warning still works:
  - On close, navigate away, etc.
  - Warns user to save before losing work
- Setting persists across sessions
- Status bar: No auto-save indicator
- Window title still shows asterisk for unsaved changes

**Validation Method**: E2E test - Verify auto-save disable setting

---

### 5. Long-Running Auto-Save (Large Project)

**User Action**: Auto-save starts on 5000-entity project (large file, 50MB)

**Expected Behavior**:
- Save operation takes longer: 5-10 seconds
- Background operation doesn't block UI:
  - User can continue editing
  - Canvas remains responsive at 60fps
  - Tools still work normally
- Progress indicator shows stages:
  - "Auto-saving... (1/3) Collecting data"
  - "Auto-saving... (2/3) Writing file"
  - "Auto-saving... (3/3) Verifying"
- If user makes changes during save:
  - Changes queued for next auto-save
  - Current save completes with pre-change data
  - Next auto-save scheduled after current finishes
- If save exceeds 30 seconds:
  - Timeout warning: "Save taking longer than expected..."
  - Option to cancel save
  - Logs performance data for investigation

**Validation Method**: Performance test - Verify large project auto-save

---

## Error Scenarios

### 1. Auto-Save Fails (Disk Full)

**Scenario**: Auto-save attempts to write but disk is full

**Expected Handling**:
- Save operation fails with disk space error
- Error caught and handled gracefully
- User notification:
  - Toast (persistent): "Auto-save failed: Insufficient disk space"
  - Status bar: Red X icon "Auto-save failed"
  - Details button: Shows full error message
- Options provided:
  - "Free Space" - Opens file manager to delete files
  - "Save As..." - Choose different location (e.g., external drive)
  - "Retry" - Attempt auto-save again
  - "Disable Auto-Save" - Turn off until resolved
- Changes remain unsaved:
  - `hasUnsavedChanges` stays `true`
  - Window title keeps asterisk
- Auto-save timer:
  - Paused (won't retry automatically to avoid repeated errors)
  - User must resolve issue and manually trigger retry
- Error logged for debugging

**Validation Method**: Unit test - Verify disk full error handling

---

### 2. Auto-Save File Locked

**Scenario**: Another process locks project file during auto-save

**Expected Handling**:
- Save operation fails with file lock error
- Auto-retry logic:
  - Retry 1: Wait 500ms, try again
  - Retry 2: Wait 1000ms, try again
  - Retry 3: Wait 2000ms, try again
  - After 3 retries: Give up
- If all retries fail:
  - Error notification: "Auto-save failed: File is locked by another process"
  - Suggestion: "Close other applications and retry"
  - Retry button available
- Lock usually temporary (other app reading file)
- Most retries succeed on attempt 1 or 2
- Prevents permanent failure from transient locks

**Validation Method**: Integration test - Verify retry logic on file lock

---

### 3. Auto-Save Corruption Detection

**Scenario**: Auto-save completes but file validation fails (corrupted write)

**Expected Handling**:
- Save completes writing file
- Post-save validation:
  - Read file back
  - Parse JSON
  - Validate schema
- Corruption detected:
  - File unreadable or invalid
  - Error: "Auto-save verification failed"
- Recovery actions:
  - Restore previous backup (auto-save keeps 1 backup)
  - Delete corrupted file
  - Attempt save again
- If recovery succeeds:
  - Silent correction
  - Log warning for investigation
- If recovery fails:
  - Error notification: "Auto-save corrupted. Please save manually."
  - Force manual save dialog
  - Preserve unsaved changes in memory

**Validation Method**: Integration test - Verify corruption detection and recovery

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Manual Save (Skip Auto-Save Timer) | `Ctrl/Cmd + S` |
| Toggle Auto-Save (Settings) | N/A (must use settings menu) |
| Force Auto-Save Now | `Ctrl/Cmd + Shift + S` (advanced) |

---

## Related Elements

- [AutoSaveService](../../elements/11-services/AutoSaveService.md) - Auto-save timer and logic
- [ProjectIO](../../elements/10-persistence/ProjectIO.md) - Save operations
- [projectStore](../../elements/02-stores/projectStore.md) - Unsaved changes tracking
- [SaveIndicator](../../elements/01-components/canvas/SaveIndicator.md) - Status bar indicator
- [SettingsPanel](../../elements/01-components/panels/SettingsPanel.md) - Auto-save settings
- [UJ-FM-003](./UJ-FM-003-SaveProjectFile.md) - Manual save (related)
- [UJ-FM-006](./UJ-FM-006-HandleUnsavedChangesWarning.md) - Unsaved changes handling

---

## Visual Diagram

```
Auto-Save Workflow
┌────────────────────────────────────────────────────────┐
│  User Makes Change                                     │
│    ↓                                                   │
│  hasUnsavedChanges = true                              │
│    ↓                                                   │
│  Start/Reset Auto-Save Timer (5 minutes)               │
│    ↓                                                   │
│  User Continues Working...                             │
│    ↓                                                   │
│  [5 minutes pass with no new changes]                  │
│    ↓                                                   │
│  Timer Expires                                         │
│    ↓                                                   │
│  Pre-Save Checks                                       │
│    - Has unsaved changes? ✓                            │
│    - Has file path? ✓                                  │
│    - No blocking operations? ✓                         │
│    ↓                                                   │
│  Execute Background Save                               │
│    - Collect data                                      │
│    - Serialize JSON                                    │
│    - Write file                                        │
│    - Verify                                            │
│    ↓                                                   │
│  Save Complete                                         │
│    ↓                                                   │
│  hasUnsavedChanges = false                             │
│  lastSavedTime = now                                   │
│    ↓                                                   │
│  Show "Auto-saved" (2 seconds)                         │
│    ↓                                                   │
│  Timer Stopped (awaits next change)                    │
└────────────────────────────────────────────────────────┘

Timer Debouncing Behavior:
┌────────────────────────────────────────────────────────┐
│  Time:  0s    10s   20s   30s   40s   ...   300s      │
│         │     │     │     │     │            │         │
│  Change 1     2     3     4     5                      │
│         │     │     │     │     │            │         │
│  Timer: Start Reset Reset Reset Reset    [Expires]    │
│         └─5min──────────────────────────────→          │
│                     └─5min──────────────────→          │
│                           └─5min──────────────→        │
│                                 └─5min────────→        │
│                                       └─5min──→ SAVE!  │
│                                                         │
│  Result: Only 1 auto-save after user stops editing     │
└────────────────────────────────────────────────────────┘

Save Status Indicator States:
┌────────────────────────────────────────────────────────┐
│  State                 │ Indicator                     │
│────────────────────────┼───────────────────────────────│
│  No unsaved changes    │ ● Green "Saved"               │
│  Unsaved changes       │ ● Yellow "Unsaved changes"    │
│  Auto-saving...        │ ⟳ Blue "Auto-saving..."       │
│  Auto-saved (brief)    │ ✓ Green "Auto-saved"          │
│  Auto-save failed      │ ✗ Red "Auto-save failed"      │
└────────────────────────────────────────────────────────┘

Error Recovery Flow:
┌────────────────────────────────────────────────────────┐
│  Auto-Save Triggered                                   │
│    ↓                                                   │
│  Write File                                            │
│    ↓                                                   │
│  Error Occurred (e.g., Disk Full)                      │
│    ↓                                                   │
│  Catch Error                                           │
│    ↓                                                   │
│  Determine Error Type                                  │
│    ↓              ↓              ↓                     │
│  Disk Full    File Locked    Corruption                │
│    ↓              ↓              ↓                     │
│  Notify       Retry 3x       Restore Backup            │
│  User         │              │                         │
│  Show         ↓              ↓                         │
│  Options      Success?       Try Again                 │
│               ↓  ↓           ↓                         │
│              Yes No          Success?                  │
│               ↓  ↓           ↓  ↓                      │
│              Done Error     Done Error                 │
│                  ↓                ↓                    │
│                Notify          Notify                  │
│                User            User                    │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/services/AutoSaveService.test.ts`

**Test Cases**:
- Timer starts on unsaved change
- Timer resets on subsequent changes (debouncing)
- Timer expires after 5 minutes
- Pre-save checks before execution
- Save only when `hasUnsavedChanges === true`
- Timer stops after successful save
- Timer pauses on error

**Assertions**:
- Timer initialized to 5 minutes (300000ms)
- Each change resets timer to 5 minutes
- Save triggered exactly 5 minutes after last change
- No save when `hasUnsavedChanges === false`
- `lastSavedTime` updated on success

---

### Integration Tests
**File**: `src/__tests__/integration/auto-save.test.ts`

**Test Cases**:
- Complete auto-save workflow
- Background save doesn't block UI
- Concurrent manual and auto-save
- Auto-save with no file path (temp save)
- Error handling and retry logic
- Settings toggle (enable/disable)
- Large project auto-save performance

**Assertions**:
- Project saved after timer expires
- User can edit during save
- Manual save takes precedence
- Temp file created for new projects
- Retries on transient errors
- Setting persists across sessions
- Large saves complete within timeout

---

### E2E Tests
**File**: `e2e/file-management/auto-save.spec.ts`

**Test Cases**:
- Visual save indicator updates
- "Auto-saving..." status during save
- "Auto-saved" confirmation after save
- Window title asterisk behavior
- Last saved timestamp updates
- Error toast on save failure
- Settings panel auto-save toggle

**Assertions**:
- Status bar shows "Auto-saving..." spinner
- Status changes to "Auto-saved" with checkmark
- Asterisk removed from window title after save
- "Last saved: Just now" appears in status
- Error toast visible and actionable
- Toggle in settings disables auto-save

---

## Common Pitfalls

### ❌ Don't: Auto-save on every change
**Problem**: Excessive disk writes, poor performance, battery drain

**Solution**: Use debouncing timer (5 minutes) to batch changes

---

### ❌ Don't: Block UI during auto-save
**Problem**: User frustrated by frozen interface

**Solution**: Run save in background thread/worker

---

### ❌ Don't: Silently fail auto-save
**Problem**: User thinks work is saved but it's not

**Solution**: Always notify user of save failures with actionable options

---

### ✅ Do: Reset timer on each change (debouncing)
**Benefit**: Only one save after user stops editing, not multiple saves during active work

---

### ✅ Do: Show last saved timestamp
**Benefit**: User knows exactly when their work was last saved

---

## Performance Tips

### Optimization: Incremental Save (Delta)
**Problem**: Saving entire 50MB project every 5 minutes is slow and wasteful

**Solution**: Save only changed entities (delta save)
- Track which entities modified since last save
- Save only those entities
- Merge with existing file on disk
- 90% smaller save payload
- 10x faster save operation

---

### Optimization: Compress Auto-Save Files
**Problem**: Auto-saves accumulate disk space (temp files, backups)

**Solution**: Compress auto-save files with gzip
- 50MB project → 5MB compressed
- Decompress on load (fast)
- 90% space savings
- Automatic cleanup of old auto-saves (keep only last 3)

---

### Optimization: Background Thread for Save
**Problem**: Main thread blocked during JSON serialization (large projects)

**Solution**: Offload serialization to Web Worker
- Main thread: Continue UI updates
- Worker thread: Serialize project data
- Post message when complete
- Main thread: Write file
- Zero UI lag during save

---

## Future Enhancements

- **Adaptive Auto-Save Interval**: Adjust timer based on edit frequency (faster when actively editing)
- **Cloud Auto-Save**: Save to cloud storage in addition to local disk
- **Version History**: Keep last 10 auto-save versions for recovery
- **Conflict Resolution**: Detect and merge changes from multiple sessions
- **Auto-Save Preview**: Show what will be saved before auto-save executes
- **Selective Auto-Save**: Choose which entity types to auto-save
- **Auto-Save Notifications**: Desktop notifications for save events
- **Battery-Aware**: Reduce auto-save frequency on battery power
- **Network-Aware**: Skip auto-save on metered connections (mobile hotspot)
