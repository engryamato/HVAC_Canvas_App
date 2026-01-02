# [UJ-FM-006] Handle Unsaved Changes Warning

## Overview

This user journey covers the unsaved changes warning system that prevents accidental data loss when navigating away from a project with unsaved modifications. Includes change detection, warning dialogs, and user decision handling.

## PRD References

- **FR-FM-006**: Application shall warn users before discarding unsaved changes
- **US-FM-006**: As a designer, I want to be warned about unsaved changes so that I don't lose my work
- **AC-FM-006-001**: Warning appears when navigating away with unsaved changes
- **AC-FM-006-002**: Window title shows asterisk (*) when changes are unsaved
- **AC-FM-006-003**: User can save, discard, or cancel navigation
- **AC-FM-006-004**: Browser close/refresh triggers warning
- **AC-FM-006-005**: Warning bypassed if no changes made

## Prerequisites

- User is in Canvas Editor with an open project
- User has made at least one change (created, modified, or deleted entity)
- Auto-save timer has not yet saved changes

## User Journey Steps

### Step 1: Make Changes

**User Action**: Draw a room, edit a duct, or modify any entity property

**Expected Result**:
- Change detected by store
- `hasUnsavedChanges` flag set to `true`
- Visual indicator appears:
  - Window title: "Office Building HVAC * - SizeWise" (asterisk added)
  - Status bar: "Unsaved changes" with yellow indicator
  - Optional: Save button highlights
- Auto-save timer starts/resets (5 minutes)

**Validation Method**: Unit test
```typescript
it('sets unsaved changes flag on entity modification', () => {
  const room = createMockRoom();
  useEntityStore.getState().addEntity(room);

  expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
});
```

---

### Step 2: Attempt Navigation

**User Action**: Click "Dashboard" link in sidebar OR press browser back button OR click "Open" in File menu

**Expected Result**:
- Navigation intercepted before occurring
- Unsaved Changes Warning Dialog appears:
  - Title: "Unsaved Changes"
  - Message: "You have unsaved changes. What would you like to do?"
  - Details: "Last saved: 3 minutes ago" or "Never saved"
  - Three buttons:
    - **"Save and Continue"** (recommended, primary action)
    - **"Discard Changes"** (destructive, red)
    - **"Cancel"** (default on Escape)
- Underlying navigation blocked
- User must choose an option

**Validation Method**: E2E test
```typescript
// Make a change
await page.click('button[data-tool="room"]');
await page.mouse.click(200, 200);
await page.mouse.move(400, 300);
await page.mouse.up();

// Try to navigate away
await page.click('a[href="/dashboard"]');

// Should see warning dialog
await expect(page.locator('dialog h2')).toHaveText('Unsaved Changes');
await expect(page.locator('button:has-text("Save and Continue")')).toBeVisible();
```

---

### Step 3: Choose "Save and Continue"

**User Action**: Click "Save and Continue" button

**Expected Result**:
- Dialog shows loading state: "Saving..."
- Save operation executes:
  - Project data collected from stores
  - File written to disk
  - `hasUnsavedChanges` set to `false`
- If save succeeds:
  - Dialog closes
  - Original navigation proceeds
  - User reaches intended destination (dashboard, new project, etc.)
  - Brief toast: "Project saved"
- If save fails:
  - Error shown in dialog
  - Navigation blocked
  - User can retry or cancel

**Validation Method**: Integration test
```typescript
it('saves project and proceeds with navigation', async () => {
  const mockSave = vi.fn().mockResolvedValue({ success: true });
  vi.spyOn(ProjectIO, 'saveProject').mockImplementation(mockSave);

  const { getByText } = render(<UnsavedChangesDialog onProceed={mockProceed} />);

  fireEvent.click(getByText('Save and Continue'));

  await waitFor(() => {
    expect(mockSave).toHaveBeenCalled();
    expect(mockProceed).toHaveBeenCalled();
  });
});
```

---

### Step 4: Choose "Discard Changes"

**User Action**: Click "Discard Changes" button

**Expected Result**:
- Confirmation prompt (safety measure):
  - "Are you sure you want to discard all changes?"
  - "This cannot be undone."
  - "Yes, Discard" button
  - "No, Keep Editing" button
- If confirmed:
  - Dialog closes immediately
  - `hasUnsavedChanges` set to `false`
  - No save operation
  - Original navigation proceeds
  - Changes lost permanently
  - Toast: "Changes discarded"

**Validation Method**: E2E test
```typescript
await page.click('button:has-text("Discard Changes")');

// Confirmation prompt
await expect(page.locator('text=Are you sure')).toBeVisible();

await page.click('button:has-text("Yes, Discard")');

// Should navigate away
await expect(page).toHaveURL('/dashboard');
await expect(page.locator('.toast')).toContainText('discarded');
```

---

### Step 5: Choose "Cancel"

**User Action**: Click "Cancel" button OR press Escape key

**Expected Result**:
- Dialog closes immediately
- Navigation cancelled
- User remains on current page (canvas editor)
- Unsaved changes still present
- Can continue editing
- Title still shows asterisk
- No toast notification

**Validation Method**: Unit test
```typescript
it('cancels navigation and keeps user on page', () => {
  const mockOnCancel = vi.fn();

  const { getByText } = render(<UnsavedChangesDialog onCancel={mockOnCancel} />);

  fireEvent.click(getByText('Cancel'));

  expect(mockOnCancel).toHaveBeenCalled();
  expect(useProjectStore.getState().hasUnsavedChanges).toBe(true);
});
```

---

## Edge Cases

### 1. Browser/Tab Close

**User Action**: Close browser tab or window (Alt+F4, close button)

**Expected Behavior**:
- `beforeunload` event triggered
- Browser shows native warning:
  - "Changes you made may not be saved." (browser-standard message)
  - "Leave" button
  - "Stay" button
- User decision:
  - Leave → Changes lost, tab closes
  - Stay → Remains on page, can save
- Note: Cannot customize browser warning text (security restriction)

**Implementation**:
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = ''; // Chrome requires returnValue set
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);
```

---

### 2. Multiple Rapid Changes

**User Action**: Create 10 entities quickly, then immediately navigate away

**Expected Behavior**:
- Change detection tracks all modifications
- Single warning dialog (not 10 dialogs)
- "Last saved" shows time before first change
- Save operation saves all changes at once
- Auto-save timer properly debounced

---

### 3. Auto-Save Triggers During Warning

**User Action**: Warning dialog open, auto-save timer (5 min) expires

**Expected Behavior**:
- Auto-save detects dialog is open
- Auto-save paused/deferred until dialog closed
- If "Save and Continue" chosen → Uses that save, skips auto-save
- If "Cancel" chosen → Auto-save resumes countdown
- No duplicate save operations

---

### 4. Save Fails During "Save and Continue"

**User Action**: Choose "Save and Continue" but disk is full

**Expected Behavior**:
- Save operation fails
- Dialog shows error:
  - "Cannot save project. Insufficient disk space."
  - Buttons update:
    - "Retry Save" (attempt again)
    - "Discard Changes" (still available)
    - "Cancel" (stay and fix issue)
- Navigation blocked until resolved
- User can free space and retry

**Test**:
```typescript
it('handles save failure during warning dialog', async () => {
  vi.mocked(saveProject).mockRejectedValueOnce(new Error('Disk full'));

  const { getByText } = render(<UnsavedChangesDialog />);

  fireEvent.click(getByText('Save and Continue'));

  await waitFor(() => {
    expect(screen.getByText(/Cannot save/)).toBeVisible();
    expect(screen.getByText('Retry Save')).toBeVisible();
  });
});
```

---

### 5. Navigation to Another Project

**User Action**: While editing Project A (unsaved), click "Open" to load Project B

**Expected Behavior**:
- Warning specific to current project:
  - "Save changes to 'Project A' before opening another project?"
- If saved → Project A saved, then Project B loads
- If discarded → Project A changes lost, Project B loads
- If cancelled → Project B load cancelled, remain in Project A

---

## Error Scenarios

### 1. State Corruption During Save

**Scenario**: Store data becomes corrupted during save attempt

**Expected Handling**:
- Validation catches corrupted data
- Error dialog:
  - "Cannot save project. Data is invalid."
  - Details: Specific validation error
- Recommend restarting app
- Offer to export entities to JSON (emergency backup)
- Block navigation until resolved

---

### 2. File Lock During Save

**Scenario**: Another process locks project file during save

**Expected Handling**:
- Save fails with lock error
- Auto-retry 3 times with 500ms delay
- If all retries fail:
  - Show error with "Retry" option
  - Suggest closing other apps
- Keep warning dialog open
- User can retry or discard

---

### 3. Network Drive Disconnect

**Scenario**: Project on network drive, connection lost during save

**Expected Handling**:
- Save timeout after 10 seconds
- Error: "Cannot save project. Network location unavailable."
- Offer to save to local disk instead
- Show "Save As" dialog with local default
- Original navigation still blocked

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Trigger Save Warning (if unsaved) | `Ctrl/Cmd + W` (close) |
| Quick Save (bypass warning) | `Ctrl/Cmd + S` |
| Force Close (discard, dev only) | `Ctrl/Cmd + Shift + W` |

---

## Related Elements

- [UnsavedChangesDialog](../../elements/01-components/canvas/UnsavedChangesDialog.md) - Warning dialog component
- [projectStore](../../elements/02-stores/projectStore.md) - `hasUnsavedChanges` state
- [useNavigationGuard](../../elements/07-hooks/useNavigationGuard.md) - Navigation interception hook
- [ProjectIO](../../elements/10-persistence/ProjectIO.md) - Save operations
- [CanvasEditorPage](../../elements/12-pages/CanvasEditorPage.md) - Page with unsaved changes

---

## Test Implementation

### Unit Tests
- `src/__tests__/hooks/useNavigationGuard.test.ts`
  - Change detection
  - Navigation interception
  - Dialog triggering

### Integration Tests
- `src/__tests__/integration/unsaved-changes.test.ts`
  - Complete warning workflow
  - Save and continue
  - Discard changes
  - Error handling

### E2E Tests
- `e2e/file-management/unsaved-changes.spec.ts`
  - Navigation scenarios
  - Browser close warning
  - All dialog options
  - Multiple changes

---

## Notes

### Implementation Details

```typescript
// useNavigationGuard.ts
export function useNavigationGuard() {
  const hasUnsavedChanges = useProjectStore(state => state.hasUnsavedChanges);
  const router = useRouter();

  useEffect(() => {
    // Intercept Next.js navigation
    const handleRouteChange = (url: string) => {
      if (hasUnsavedChanges) {
        const confirmed = showUnsavedChangesDialog();
        if (!confirmed) {
          router.events.emit('routeChangeError');
          throw 'Navigation cancelled by user'; // Stops navigation
        }
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [hasUnsavedChanges, router]);

  // Browser close/refresh warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
}

// UnsavedChangesDialog.tsx
const UnsavedChangesDialog: React.FC<Props> = ({ onProceed, onCancel }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleSaveAndContinue = async () => {
    setIsSaving(true);

    try {
      await triggerManualSave();
      onProceed();
    } catch (error) {
      toast.error(`Cannot save project: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setShowDiscardConfirm(true);
  };

  const confirmDiscard = () => {
    useProjectStore.getState().setHasUnsavedChanges(false);
    toast.info('Changes discarded');
    onProceed();
  };

  if (showDiscardConfirm) {
    return (
      <Dialog open>
        <DialogTitle>Discard Changes?</DialogTitle>
        <DialogContent>
          <p>Are you sure you want to discard all changes?</p>
          <p>This cannot be undone.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDiscardConfirm(false)}>
            No, Keep Editing
          </Button>
          <Button onClick={confirmDiscard} color="error">
            Yes, Discard
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open onClose={onCancel}>
      <DialogTitle>Unsaved Changes</DialogTitle>
      <DialogContent>
        <p>You have unsaved changes. What would you like to do?</p>
        <LastSavedInfo />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleDiscard} color="error">
          Discard Changes
        </Button>
        <Button
          onClick={handleSaveAndContinue}
          variant="contained"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save and Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### Change Detection Strategy

**What Triggers Unsaved Flag**:
- Entity creation (room, duct, equipment, etc.)
- Entity modification (property changes)
- Entity deletion
- Viewport changes (optional - usually excluded)
- Settings changes

**What Doesn't Trigger**:
- Selection changes
- Pan/zoom (unless setting enabled)
- Inspector panel opening/closing
- Undo/redo (tracked separately)

### User Experience Considerations

**Balance**: Prevent data loss vs. not being annoying
- Warning necessary for destructive actions
- Auto-save reduces warnings needed
- Clear visual indicators (asterisk in title)
- Respect user's choice (don't re-warn immediately)

**Best Practices**:
- Default to safest option (Save and Continue)
- Make Cancel easy (Escape key)
- Show time since last save
- Highlight unsaved indicator

### Performance

- Warning check: O(1) (simple flag check)
- Dialog render: <10ms
- Save operation: 100-500ms (same as manual save)
- No performance impact on editing

### Accessibility

- Dialog has proper ARIA roles
- Focus trapped in dialog
- Escape key cancels
- Screen reader announces warning
- Clear button labels
- Keyboard navigation supported

### Future Enhancements

- **Smart Warnings**: Track significance of changes (minor vs. major)
- **Auto-Recovery**: Show what changes would be lost
- **Diff View**: Show before/after comparison
- **Delayed Warning**: Wait 30s before warning on minor changes
- **Session Storage**: Cache unsaved changes for crash recovery
- **Multiple Saves**: "Save As..." option in warning dialog
