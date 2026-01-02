# [UJ-PM-004] Delete Project

## Overview

This user journey covers permanently deleting an HVAC project from the dashboard, including project selection, confirmation dialog with safety measures, file system deletion, store cleanup, and user feedback. Includes safeguards against accidental deletion.

## PRD References

- **FR-PM-004**: User shall be able to delete projects from the dashboard
- **US-PM-004**: As a designer, I want to delete old or test projects so that I can keep my workspace organized
- **AC-PM-004-001**: Delete action requires explicit confirmation
- **AC-PM-004-002**: Confirmation dialog shows project name and entity count
- **AC-PM-004-003**: User must type project name to confirm deletion
- **AC-PM-004-004**: Project file and backup are permanently deleted from disk
- **AC-PM-004-005**: Deleted project removed from project list immediately

## Prerequisites

- User is on Dashboard page (`/dashboard`)
- At least one project exists in project list
- Project is not currently open in canvas editor
- User has write permissions to project directory

## User Journey Steps

### Step 1: Initiate Delete Action

**User Action**: Click "Delete" button (trash icon) on project card OR right-click project → "Delete" in context menu

**Expected Result**:
- Delete Confirmation Dialog opens
- Dialog overlays dashboard with dark backdrop
- Dialog title: "Delete Project?"
- Warning icon displayed (red triangle with exclamation)
- Project details shown:
  - Name: "Office Building HVAC"
  - Entity count: "12 entities"
  - Last modified: "2 days ago"
  - File size: "245 KB"
- Warning message in red box:
  - "⚠️ This action cannot be undone."
  - "The project file and backup will be permanently deleted."
- Confirmation input field (empty, focused)
- "Delete" button disabled (not yet confirmed)
- "Cancel" button enabled

**Validation Method**: E2E test
```typescript
await page.click('[aria-label="Delete project Office Building HVAC"]');

await expect(page.locator('dialog')).toBeVisible();
await expect(page.locator('dialog h2')).toHaveText('Delete Project?');
await expect(page.locator('dialog')).toContainText('Office Building HVAC');
await expect(page.locator('dialog')).toContainText('12 entities');
await expect(page.locator('button:has-text("Delete")')).toBeDisabled();
```

---

### Step 2: Read Warning and Type Confirmation

**User Action**: Read warning, then type project name "Office Building HVAC" in confirmation field

**Expected Result**:
- Text appears in input field as typed
- Real-time validation:
  - If typed text matches project name exactly → "Delete" button enables
  - If text doesn't match → "Delete" button remains disabled
  - Case-sensitive comparison
  - Whitespace trimmed
- Character counter shows: "24/24" when complete
- Visual feedback:
  - Input border turns green when match confirmed
  - Checkmark icon appears next to input

**Validation Method**: Unit test
```typescript
it('enables delete button when project name matches', () => {
  const { getByLabelText, getByText } = render(
    <DeleteConfirmDialog project={mockProject} onClose={mockClose} />
  );

  const confirmInput = getByLabelText('Type project name to confirm');

  // Partial match - button still disabled
  fireEvent.change(confirmInput, { target: { value: 'Office Building' } });
  expect(getByText('Delete')).toBeDisabled();

  // Exact match - button enables
  fireEvent.change(confirmInput, { target: { value: 'Office Building HVAC' } });
  expect(getByText('Delete')).not.toBeDisabled();
});
```

---

### Step 3: Confirm Deletion

**User Action**: Click "Delete" button (now enabled)

**Expected Result**:
- Button shows loading state:
  - Text changes to "Deleting..."
  - Spinner icon appears
  - Button becomes disabled during operation
- Dialog remains open during deletion
- Progress message updates:
  - "Removing from project list..."
  - "Deleting project file..."
  - "Deleting backup file..."
- All buttons disabled during operation
- User cannot cancel once deletion starts

**Validation Method**: Integration test
```typescript
it('shows loading state during deletion', async () => {
  const { getByText, getByLabelText } = render(
    <DeleteConfirmDialog project={mockProject} onClose={mockClose} />
  );

  fireEvent.change(getByLabelText('Type project name to confirm'), {
    target: { value: mockProject.name }
  });

  fireEvent.click(getByText('Delete'));

  expect(getByText('Deleting...')).toBeVisible();
  expect(getByText('Delete')).toBeDisabled();
});
```

---

### Step 4: Execute Deletion

**User Action**: (Automatic - triggered by Step 3)

**Expected Result**:
- System performs deletion operations in order:
  1. **Remove from store**:
     - `projectListStore.removeProject(projectId)`
     - Project immediately removed from UI list
  2. **Delete main file**:
     - Resolve file path: `/projects/{projectId}.sws`
     - Delete file via Tauri fs API: `invoke('delete_file', { path })`
     - Verify deletion success
  3. **Delete backup file**:
     - Resolve backup path: `/projects/{projectId}.sws.bak`
     - Delete backup if exists (no error if not found)
  4. **Delete thumbnail** (if exists):
     - Resolve thumbnail path: `/projects/{projectId}.thumb.png`
     - Delete thumbnail file
  5. **Update recent files list**:
     - Remove project from recent files menu
- All operations atomic (if any fails, previous steps rolled back)

**Validation Method**: Integration test
```typescript
it('deletes project from store and file system', async () => {
  const projectPath = '/path/to/project.sws';
  const backupPath = '/path/to/project.sws.bak';

  // Mock file system
  vi.mocked(invoke).mockResolvedValue(true);

  const { getByText, getByLabelText } = render(
    <DeleteConfirmDialog project={mockProject} onClose={mockClose} />
  );

  fireEvent.change(getByLabelText('Type project name to confirm'), {
    target: { value: mockProject.name }
  });

  fireEvent.click(getByText('Delete'));

  await waitFor(() => {
    // Verify store removal
    const projects = useProjectListStore.getState().projects;
    expect(projects.find(p => p.id === mockProject.id)).toBeUndefined();

    // Verify file system calls
    expect(invoke).toHaveBeenCalledWith('delete_file', { path: projectPath });
    expect(invoke).toHaveBeenCalledWith('delete_file', { path: backupPath });
  });
});
```

---

### Step 5: Show Success Feedback

**User Action**: (Automatic - deletion completes successfully)

**Expected Result**:
- Dialog closes automatically
- Dashboard updates:
  - Project card removed from list
  - Project count updates: "5 projects" → "4 projects"
  - If was only project, shows empty state: "No active projects yet"
  - Smooth fade-out animation on card removal
- Success toast appears:
  - "Project 'Office Building HVAC' deleted"
  - Toast auto-dismisses after 3 seconds
  - Includes "Undo" button (within 10 seconds)
- Focus returns to dashboard project list
- No more references to deleted project anywhere in UI

**Validation Method**: E2E test
```typescript
await page.click('[aria-label="Delete project Office Building HVAC"]');
await page.fill('[placeholder="Type project name"]', 'Office Building HVAC');
await page.click('button:has-text("Delete")');

await expect(page.locator('.toast-success')).toHaveText(/Project.*deleted/);
await expect(page.locator('.project-card:has-text("Office Building HVAC")')).not.toBeVisible();

// Verify project count updated
const projectCards = page.locator('.project-card');
await expect(projectCards).toHaveCount(4); // Was 5, now 4
```

---

## Edge Cases

### 1. Cancel Before Confirming

**User Action**: Open delete dialog, then click "Cancel" or press Escape

**Expected Behavior**:
- Dialog closes immediately
- No deletion occurs
- Project remains in list
- No file system operations
- No toast notification
- Focus returns to project card

**Test**:
```typescript
it('cancels deletion when cancel button clicked', () => {
  const { getByText } = render(
    <DeleteConfirmDialog project={mockProject} onClose={mockClose} />
  );

  fireEvent.click(getByText('Cancel'));

  expect(mockClose).toHaveBeenCalled();
  expect(useProjectListStore.getState().projects).toContain(mockProject);
});
```

---

### 2. Incorrect Project Name Typed

**User Action**: Type similar but incorrect name (e.g., "Office Building" instead of "Office Building HVAC")

**Expected Behavior**:
- "Delete" button remains disabled
- No visual indication of error (just disabled state)
- Input border remains default color (not green)
- User can backspace and correct
- Validation runs on every keystroke
- Case matters: "office building hvac" ≠ "Office Building HVAC"

**Test**:
```typescript
it('keeps delete button disabled for incorrect name', () => {
  const { getByLabelText, getByText } = render(
    <DeleteConfirmDialog project={mockProject} onClose={mockClose} />
  );

  fireEvent.change(getByLabelText('Type project name to confirm'), {
    target: { value: 'Wrong Project Name' }
  });

  expect(getByText('Delete')).toBeDisabled();
});
```

---

### 3. Deleting Last Project

**User Action**: Delete the only remaining project

**Expected Behavior**:
- Deletion proceeds normally
- After completion, dashboard shows:
  - Empty state illustration
  - Message: "No active projects yet"
  - "Create New Project" button (prominent)
- Project count shows: "0 projects"
- No errors or crashes
- All functionality remains available

---

### 4. Attempting to Delete Open Project

**User Action**: Try to delete project that's currently open in another tab/window

**Expected Behavior**:
- Detection occurs before delete dialog opens
- Warning dialog appears instead:
  - "Cannot delete open project"
  - "Please close the project first, then try again."
  - "Close Project" button (closes the canvas tab)
  - "Cancel" button
- No delete action available until project closed
- Alternative: Auto-close the canvas tab and proceed with deletion

---

### 5. Special Characters in Project Name

**User Action**: Delete project named "Client #1 (2025) - [Main]"

**Expected Behavior**:
- Confirmation input must match exactly including special chars
- User must type: `Client #1 (2025) - [Main]`
- No sanitization or normalization
- Validation is strict character-by-character match
- Special characters don't cause issues with file deletion

---

## Error Scenarios

### 1. File System Permission Error

**Scenario**: User lacks permission to delete project files

**Expected Handling**:
- Store removal succeeds (in-memory)
- File deletion fails with permission error
- Error caught and handled:
  - Error toast: "Cannot delete project files. Permission denied."
  - Dialog remains open with error message
  - "Retry" button appears
  - Project re-added to store (rollback)
- User can:
  - Retry with elevated permissions
  - Cancel and keep project
  - Manually delete file outside app

**Test**:
```typescript
it('handles file deletion permission error', async () => {
  vi.mocked(invoke).mockRejectedValueOnce(new Error('Permission denied'));

  const { getByText, getByLabelText } = render(
    <DeleteConfirmDialog project={mockProject} onClose={mockClose} />
  );

  fireEvent.change(getByLabelText('Type project name to confirm'), {
    target: { value: mockProject.name }
  });

  fireEvent.click(getByText('Delete'));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Permission denied'));
    // Project should be restored to list
    expect(useProjectListStore.getState().projects).toContain(mockProject);
  });
});
```

---

### 2. File Not Found (Already Deleted Externally)

**Scenario**: Project file was deleted outside the app

**Expected Handling**:
- Delete attempt fails with "file not found" error
- Warning toast: "Project file already deleted. Removing from list."
- Project removed from store anyway
- Deletion considered successful
- No error state shown to user

---

### 3. Network/Disk I/O Error

**Scenario**: Disk read error or network drive disconnected during deletion

**Expected Handling**:
- Error caught during file operations
- Error toast: "Cannot delete project. Disk error occurred."
- Dialog remains open
- Project remains in list (not removed)
- "Retry" button available
- Log detailed error for debugging

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Delete Selected Project | `Delete` key (when project card focused) |
| Confirm Deletion | `Enter` (when confirm text matches) |
| Cancel Deletion | `Escape` |

---

## Related Elements

- [DeleteConfirmDialog](../../elements/01-components/dashboard/DeleteConfirmDialog.md) - Confirmation dialog
- [ProjectCard](../../elements/01-components/dashboard/ProjectCard.md) - Delete button location
- [projectListStore](../../elements/02-stores/projectListStore.md) - Project list management
- [ProjectIO](../../elements/10-persistence/ProjectIO.md) - File deletion logic
- [Toast](../../elements/01-components/ui/Toast.md) - Success/error notifications
- [DashboardPage](../../elements/12-pages/DashboardPage.md) - Parent page

---

## Test Implementation

### Unit Tests
- `src/__tests__/components/DeleteConfirmDialog.test.tsx`
  - Name validation
  - Button states
  - Confirmation logic

### Integration Tests
- `src/__tests__/integration/project-deletion.test.ts`
  - Store removal
  - File system deletion
  - Error handling
  - Rollback on failure

### E2E Tests
- `e2e/project-management/delete-project.spec.ts`
  - Complete deletion flow
  - Success path
  - Cancel action
  - Error scenarios
  - Empty state after deleting last project

---

## Notes

### Implementation Details

```typescript
// DeleteConfirmDialog.tsx
const DeleteConfirmDialog: React.FC<Props> = ({ project, onClose }) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeProject = useProjectListStore(state => state.removeProject);
  const addProject = useProjectListStore(state => state.addProject);

  const isConfirmed = confirmText.trim() === project.name;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      // 1. Remove from store (optimistic)
      removeProject(project.id);

      // 2. Delete files
      const projectPath = await resolveProjectPath(project.id);
      const backupPath = `${projectPath}.bak`;
      const thumbnailPath = await resolveThumbnailPath(project.id);

      try {
        await invoke('delete_file', { path: projectPath });
      } catch (err) {
        if (!err.message.includes('not found')) {
          throw err; // Re-throw unless file not found
        }
      }

      try {
        await invoke('delete_file', { path: backupPath });
      } catch (err) {
        // Ignore if backup doesn't exist
      }

      try {
        await invoke('delete_file', { path: thumbnailPath });
      } catch (err) {
        // Ignore if thumbnail doesn't exist
      }

      // 3. Success feedback
      toast.success(`Project "${project.name}" deleted`, {
        action: {
          label: 'Undo',
          onClick: () => handleUndo(project)
        }
      });

      // 4. Close dialog
      onClose();

    } catch (err) {
      console.error('Failed to delete project:', err);

      // Rollback: Re-add to store
      addProject(project);

      // Show error
      setError(err.message);
      toast.error(`Cannot delete project. ${err.message}`);

    } finally {
      setIsDeleting(false);
    }
  };

  const handleUndo = (deletedProject: Project) => {
    // Restore project to list (files are gone, but user can recreate)
    addProject(deletedProject);
    toast.info('Project restored to list');
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>
        <WarningIcon /> Delete Project?
      </DialogTitle>
      <DialogContent>
        <ProjectDetails>
          <strong>{project.name}</strong>
          <div>{project.entityCount} entities</div>
          <div>Last modified: {formatRelativeTime(project.modifiedAt)}</div>
        </ProjectDetails>

        <WarningBox>
          ⚠️ This action cannot be undone.
          <br />
          The project file and backup will be permanently deleted.
        </WarningBox>

        <TextField
          label="Type project name to confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={project.name}
          fullWidth
          autoFocus
          error={!!error}
          helperText={error}
        />

        {isConfirmed && (
          <ConfirmationCheck>
            <CheckIcon /> Name confirmed
          </ConfirmationCheck>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={!isConfirmed || isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### Undo Functionality

**Undo Window**: 10 seconds after deletion

**Undo Behavior**:
- Project re-added to store
- **Files are NOT restored** (permanent deletion)
- Project shows warning badge: "Files deleted - save to recreate"
- Opening project shows error: "Project file not found. Would you like to create a new file?"
- Alternative: Keep deleted files in trash/recycle bin for 30 days

### Safety Measures

1. **Confirmation Required**: Must type project name exactly
2. **Warning Displayed**: Clear message about permanent deletion
3. **Undo Option**: 10-second window to restore (to list only)
4. **No Accidental Deletion**: Disabled button until confirmed
5. **Atomic Operation**: Rollback on any failure

### Performance Considerations

- **Store Removal**: Synchronous, instant (<1ms)
- **File Deletion**: 10-50ms per file (async)
- **Total Time**: Typically 50-150ms for complete deletion
- **UI Responsiveness**: Dialog remains responsive during operation

### Accessibility

- Dialog has `role="alertdialog"` (important action)
- Warning message announced with `aria-live="assertive"`
- Delete button has `aria-label="Delete project {name}"`
- Confirmation input has clear label
- Focus management (returns to project list on close)
- Keyboard navigation fully supported

### Future Enhancements

- **Soft Delete**: Move to trash/archive instead of permanent deletion
- **Batch Delete**: Select multiple projects, delete at once
- **Delete with Backup**: Option to export before deleting
- **Recovery**: 30-day recovery window from recycle bin
- **Cloud Sync**: Delete from cloud storage if synced
