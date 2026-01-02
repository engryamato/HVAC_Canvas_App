# [UJ-FM-002] Auto-Save

## Overview

This user journey covers the automatic background saving of HVAC projects while working in the canvas editor, including change detection, timer-based triggers, save execution, user feedback, and error recovery. Auto-save ensures work is continuously protected without user intervention.

## PRD References

- **FR-FM-002**: Application shall auto-save projects every 5 minutes when changes are detected
- **US-FM-002**: As a designer, I want my work saved automatically so that I don't lose progress if something goes wrong
- **AC-FM-002-001**: Auto-save triggers every 5 minutes if unsaved changes exist
- **AC-FM-002-002**: Auto-save runs silently in background (non-blocking)
- **AC-FM-002-003**: Status bar shows last auto-save timestamp
- **AC-FM-002-004**: Manual save resets auto-save timer
- **AC-FM-002-005**: Auto-save pauses when user is idle for 30+ minutes

## Prerequisites

- User is in Canvas Editor page (`/canvas/{projectId}`)
- Project is loaded and active
- useAutoSave hook is initialized
- File system is accessible

## User Journey Steps

### Step 1: Make Changes to Project

**User Action**: User creates/modifies entities (e.g., draws a room, edits duct size)

**Expected Result**:
- Entity changes trigger store updates
- `hasUnsavedChanges` flag set to `true` in project store
- Unsaved changes indicator appears in UI:
  - Window title shows asterisk: "Office Building HVAC * - SizeWise"
  - Status bar shows: "Unsaved changes"
- Auto-save timer starts/resets (if not already running)
- Timer countdown begins: 5 minutes (300 seconds)

**Validation Method**: Integration test
```typescript
it('detects changes and sets unsaved flag', () => {
  const { createEntity } = useEntityCommands();

  // Initially no unsaved changes
  expect(useProjectStore.getState().hasUnsavedChanges).toBe(false);

  // Create entity
  createEntity(mockRoom);

  // Unsaved changes detected
  expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
});
```

---

### Step 2: Auto-Save Timer Countdown

**User Action**: User continues working while timer counts down

**Expected Result**:
- Timer runs in background (not visible to user)
- Status bar optionally shows countdown: "Auto-save in 4:23" (configurable)
- User can continue working normally
- Any new changes reset the 5-minute timer (debounced)
- No performance impact on canvas rendering
- Timer state persists across component re-renders

**Validation Method**: Unit test
```typescript
it('resets timer when new changes occur', () => {
  vi.useFakeTimers();

  const { result } = renderHook(() => useAutoSave());

  // Make initial change
  act(() => {
    useProjectStore.getState().setHasUnsavedChanges(true);
  });

  // Wait 3 minutes
  act(() => {
    vi.advanceTimersByTime(3 * 60 * 1000);
  });

  // Make another change (resets timer)
  act(() => {
    useProjectStore.getState().setHasUnsavedChanges(true);
  });

  // Timer should restart from 5 minutes
  expect(result.current.timeUntilAutoSave).toBeGreaterThan(4 * 60); // > 4 min remaining
});
```

---

### Step 3: Auto-Save Execution

**User Action**: (Automatic - 5 minutes elapsed since last change)

**Expected Result**:
- Auto-save triggered automatically
- Save operation begins in background:
  1. Collect project state from all stores
  2. Validate data schemas
  3. Serialize to JSON
  4. Create backup of existing file (`.sws.bak`)
  5. Write new file atomically
  6. Verify write success
- During save (200-500ms):
  - UI remains responsive
  - User can continue editing
  - Status bar shows: "Auto-saving..." with spinner icon
- No modal dialogs or interruptions
- Canvas rendering continues at 60fps

**Validation Method**: Integration test
```typescript
it('executes auto-save after 5 minutes', async () => {
  vi.useFakeTimers();

  const saveProjectSpy = vi.spyOn(ProjectIO, 'saveProject');

  renderHook(() => useAutoSave());

  // Set unsaved changes
  act(() => {
    useProjectStore.getState().setHasUnsavedChanges(true);
  });

  // Fast-forward 5 minutes
  act(() => {
    vi.advanceTimersByTime(5 * 60 * 1000);
  });

  await waitFor(() => {
    expect(saveProjectSpy).toHaveBeenCalledTimes(1);
  });
});
```

---

### Step 4: Auto-Save Completion

**User Action**: (Automatic - save completes successfully)

**Expected Result**:
- Save completes in 100-500ms
- Store states updated:
  - `hasUnsavedChanges` set to `false`
  - `lastSavedAt` updated to current timestamp
- UI updates:
  - Window title asterisk removed: "Office Building HVAC - SizeWise"
  - Status bar shows: "Auto-saved at 2:34 PM" (no intrusive toast)
  - Spinner icon replaced with checkmark (brief flash)
- Auto-save timer resets
- File on disk contains latest project state
- Backup file (`.sws.bak`) contains previous version
- User continues working without interruption

**Validation Method**: E2E test
```typescript
await page.evaluate(() => {
  // Simulate 5 minutes passing
  vi.advanceTimersByTime(5 * 60 * 1000);
});

await waitFor(() => {
  expect(page.locator('.status-bar')).toContainText(/Auto-saved at \d{1,2}:\d{2}/);
  expect(page).toHaveTitle(/^(?!.*\*).*SizeWise$/); // No asterisk
});
```

---

### Step 5: Continue Working After Auto-Save

**User Action**: User makes more changes after auto-save completes

**Expected Result**:
- Auto-save system remains active
- New changes detected immediately
- `hasUnsavedChanges` flag set to `true` again
- Timer restarts for another 5-minute cycle
- Process repeats indefinitely while user works
- Each auto-save creates new backup of previous version
- System handles multiple save cycles gracefully (no memory leaks)

**Validation Method**: Integration test
```typescript
it('continues auto-save cycle after completion', async () => {
  vi.useFakeTimers();

  const saveProjectSpy = vi.spyOn(ProjectIO, 'saveProject');

  renderHook(() => useAutoSave());

  // First cycle
  act(() => {
    useProjectStore.getState().setHasUnsavedChanges(true);
  });

  act(() => {
    vi.advanceTimersByTime(5 * 60 * 1000);
  });

  await waitFor(() => {
    expect(saveProjectSpy).toHaveBeenCalledTimes(1);
  });

  // Second cycle
  act(() => {
    useProjectStore.getState().setHasUnsavedChanges(true);
  });

  act(() => {
    vi.advanceTimersByTime(5 * 60 * 1000);
  });

  await waitFor(() => {
    expect(saveProjectSpy).toHaveBeenCalledTimes(2);
  });
});
```

---

## Edge Cases

### 1. No Changes Made

**Scenario**: User opens project but makes no changes for 5+ minutes

**Expected Behavior**:
- Auto-save timer does NOT start (no unsaved changes)
- No save operations triggered
- Status bar shows: "No unsaved changes"
- File remains unchanged on disk
- `modifiedAt` timestamp not updated
- System remains idle (no unnecessary I/O)

**Test**:
```typescript
it('does not auto-save when no changes exist', () => {
  vi.useFakeTimers();

  const saveProjectSpy = vi.spyOn(ProjectIO, 'saveProject');

  renderHook(() => useAutoSave());

  // hasUnsavedChanges remains false
  expect(useProjectStore.getState().hasUnsavedChanges).toBe(false);

  // Wait 10 minutes (twice the auto-save interval)
  act(() => {
    vi.advanceTimersByTime(10 * 60 * 1000);
  });

  // No save triggered
  expect(saveProjectSpy).not.toHaveBeenCalled();
});
```

---

### 2. Manual Save During Auto-Save Countdown

**Scenario**: User presses Ctrl+S with 2 minutes left on auto-save timer

**Expected Behavior**:
- Manual save executes immediately
- Auto-save timer cancels/resets
- Timer restarts from 5 minutes after manual save completes
- No duplicate save operations
- User sees toast: "Project saved successfully"
- Status bar updated with manual save time

**Test**:
```typescript
it('resets auto-save timer on manual save', async () => {
  vi.useFakeTimers();

  renderHook(() => useAutoSave());

  // Changes made
  act(() => {
    useProjectStore.getState().setHasUnsavedChanges(true);
  });

  // Wait 3 minutes
  act(() => {
    vi.advanceTimersByTime(3 * 60 * 1000);
  });

  // Manual save
  await act(async () => {
    await handleManualSave();
  });

  // Timer should reset
  const timeRemaining = result.current.timeUntilAutoSave;
  expect(timeRemaining).toBeCloseTo(5 * 60, 1); // ~5 minutes
});
```

---

### 3. Auto-Save During Active Drawing

**Scenario**: Auto-save triggers while user is actively dragging a room tool

**Expected Behavior**:
- Auto-save deferred until tool interaction completes
- Save waits for `onMouseUp` event
- No interference with drawing operation
- Save executes after room creation
- Alternative: Queue save operation, execute after 500ms idle

**Rationale**: Prevents race conditions with command execution

---

### 4. Multiple Rapid Changes

**Scenario**: User creates 20 entities in 30 seconds

**Expected Behavior**:
- Each change resets the auto-save timer (debounced)
- Timer effectively waits 5 minutes from LAST change
- Only ONE auto-save triggers (5 min after final change)
- No save operation every 5 minutes during active editing
- Prevents excessive file I/O

**Debounce Logic**:
```typescript
// Timer resets on each change, but waits 5 min from last change
useEffect(() => {
  if (!hasUnsavedChanges) return;

  const timeout = setTimeout(() => {
    autoSave();
  }, 5 * 60 * 1000);

  return () => clearTimeout(timeout); // Reset on new change
}, [hasUnsavedChanges, entityChangeHash]); // Trigger on change
```

---

### 5. User Idle for 30+ Minutes

**Scenario**: User opens project, makes changes, then leaves computer

**Expected Behavior**:
- Auto-save triggers normally at 5 minutes
- After 30 minutes of no mouse/keyboard activity:
  - Auto-save pauses (no more saves)
  - Status bar shows: "Auto-save paused (idle)"
- When user returns and interacts:
  - Auto-save resumes
  - Timer restarts from 5 minutes
  - Status bar updates: "Auto-save active"

**Idle Detection**:
```typescript
useEffect(() => {
  let idleTimer: NodeJS.Timeout;

  const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    setIsIdle(false);

    idleTimer = setTimeout(() => {
      setIsIdle(true); // Pause auto-save
    }, 30 * 60 * 1000); // 30 minutes
  };

  window.addEventListener('mousemove', resetIdleTimer);
  window.addEventListener('keydown', resetIdleTimer);

  return () => {
    clearTimeout(idleTimer);
    window.removeEventListener('mousemove', resetIdleTimer);
    window.removeEventListener('keydown', resetIdleTimer);
  };
}, []);
```

---

## Error Scenarios

### 1. Disk Full During Auto-Save

**Scenario**: Insufficient disk space for save operation

**Expected Handling**:
- Save fails partway through
- Error caught by try/catch block
- Subtle error notification:
  - Status bar shows: "Auto-save failed (disk full)" with warning icon
  - No intrusive toast (user may be focused on work)
  - Desktop notification (if permitted): "Cannot auto-save. Disk full."
- `hasUnsavedChanges` remains `true` (not cleared)
- Unsaved changes indicator persists
- Auto-save retries in 1 minute (not 5 minutes)
- User prompted to free space or save elsewhere

**Test**:
```typescript
it('handles disk full error gracefully', async () => {
  vi.mocked(saveProject).mockRejectedValueOnce(new Error('Disk full'));

  renderHook(() => useAutoSave());

  act(() => {
    useProjectStore.getState().setHasUnsavedChanges(true);
  });

  act(() => {
    vi.advanceTimersByTime(5 * 60 * 1000);
  });

  await waitFor(() => {
    expect(useProjectStore.getState().hasUnsavedChanges).toBe(true); // Still unsaved
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('auto-save failed'));
  });
});
```

---

### 2. File Locked by Another Process

**Scenario**: External program has exclusive lock on `.sws` file

**Expected Handling**:
- Save fails with lock error
- Retry mechanism (3 attempts with 500ms delay)
- If all retries fail:
  - Status bar: "Auto-save failed (file locked)"
  - Desktop notification with "Retry" button
  - Retry interval increases: 1 min → 2 min → 5 min
- User can manually save to trigger immediate retry
- Changes remain in memory (not lost)

---

### 3. Auto-Save During Application Close

**Scenario**: User closes browser tab while auto-save is in progress

**Expected Handling**:
- `beforeunload` event detected
- Check if save is in progress: `isSaving === true`
- If saving:
  - Wait for save to complete (block close for up to 2 seconds)
  - Show browser prompt: "Saving... Please wait."
- If save completes: Allow close
- If save times out: Show prompt "Unsaved changes may be lost. Close anyway?"
- User makes final decision

**Implementation**:
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges || isSaving) {
      e.preventDefault();
      e.returnValue = ''; // Modern browsers show generic message
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges, isSaving]);
```

---

## Keyboard Shortcuts

Auto-save has no direct keyboard shortcuts, but related actions:

| Action | Shortcut |
|--------|----------|
| Manual Save (bypasses auto-save) | `Ctrl/Cmd + S` |
| Pause Auto-Save (future) | `Ctrl/Cmd + Shift + P` |
| Force Auto-Save Now (future) | `Ctrl/Cmd + Shift + S` |

---

## Related Elements

- [useAutoSave](../../elements/07-hooks/useAutoSave.md) - Auto-save hook implementation
- [ProjectIO](../../elements/10-persistence/ProjectIO.md) - File save operations
- [projectStore](../../elements/02-stores/projectStore.md) - Unsaved changes tracking
- [StatusBar](../../elements/01-components/canvas/StatusBar.md) - Save status display
- [CanvasEditorPage](../../elements/12-pages/CanvasEditorPage.md) - Hook integration point

---

## Test Implementation

### Unit Tests
- `src/__tests__/hooks/useAutoSave.test.ts`
  - Timer logic
  - Change detection
  - Debouncing
  - Idle detection
  - Error recovery

### Integration Tests
- `src/__tests__/integration/auto-save.test.ts`
  - Full save cycle
  - Store integration
  - File I/O
  - Error scenarios
  - Manual save interaction

### E2E Tests
- `e2e/file-management/auto-save.spec.ts`
  - Auto-save during active work
  - Status bar updates
  - Multiple save cycles
  - Error recovery
  - Browser close handling

---

## Notes

### Implementation Details

```typescript
// useAutoSave.ts
export const useAutoSave = () => {
  const hasUnsavedChanges = useProjectStore(state => state.hasUnsavedChanges);
  const activeProject = useProjectStore(state => state.activeProject);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);

  const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const RETRY_INTERVAL = 1 * 60 * 1000; // 1 minute for errors

  useEffect(() => {
    if (!hasUnsavedChanges || !activeProject || isSaving) return;

    const interval = lastSaveError ? RETRY_INTERVAL : AUTO_SAVE_INTERVAL;

    const timeout = setTimeout(async () => {
      await performAutoSave();
    }, interval);

    return () => clearTimeout(timeout);
  }, [hasUnsavedChanges, activeProject, isSaving, lastSaveError]);

  const performAutoSave = async () => {
    setIsSaving(true);
    setLastSaveError(null);

    try {
      // Collect state
      const projectFile = collectProjectState();

      // Resolve file path
      const filePath = await resolveProjectPath(activeProject.id);

      // Save to disk
      const result = await saveProject(projectFile, filePath, {
        createBackup: true
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update stores
      useProjectStore.getState().setHasUnsavedChanges(false);
      useProjectStore.getState().setLastSavedAt(new Date());

      console.log('Auto-save successful');

    } catch (error) {
      console.error('Auto-save failed:', error);
      setLastSaveError(error.message);

      // Show subtle notification
      if (error.message.includes('disk full')) {
        showStatusBarError('Auto-save failed: Disk full');
      } else if (error.message.includes('locked')) {
        showStatusBarError('Auto-save failed: File locked');
      } else {
        showStatusBarError('Auto-save failed');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    lastSaveError,
    performAutoSave // Expose for manual trigger
  };
};
```

### Performance Considerations

**Auto-Save Overhead**:
- Timer: Negligible (<1ms per check)
- Save operation: 100-500ms (background thread)
- UI blocking: 0ms (fully async)
- Memory usage: No leaks (timer cleanup)

**Typical Save Times**:
- Small project: 50-150ms
- Medium project: 150-300ms
- Large project: 300-800ms

**Optimization**:
- Debounce rapid changes (wait for editing pause)
- Skip save if no actual data changed (compare hash)
- Use Web Worker for serialization (large projects)

### User Feedback Design

**Visibility Levels** (least to most intrusive):

1. **Silent** (default): No feedback except status bar
2. **Subtle**: Status bar + brief icon flash
3. **Moderate**: Status bar + desktop notification
4. **Prominent**: Toast notification

**Recommendation**: Use "Subtle" for success, "Moderate" for errors

### Accessibility

- Status bar auto-save messages have `aria-live="polite"`
- Errors have `aria-live="assertive"` for immediate announcement
- Screen reader announces: "Auto-save completed at [time]"
- Visual indicators have text alternatives

### Future Enhancements

- **Configurable Interval**: User preference for auto-save frequency (1-15 minutes)
- **Cloud Sync**: Auto-save to cloud storage (Google Drive, Dropbox)
- **Conflict Resolution**: Merge changes from multiple devices
- **Version Snapshots**: Keep hourly snapshots for recovery
- **Save on Blur**: Auto-save when switching browser tabs
- **Offline Queue**: Queue saves when offline, sync when online
