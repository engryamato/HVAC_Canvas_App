# [UJ-PM-003] Edit Project Metadata

## Overview

This user journey covers editing existing project metadata (name, project number, client name, location) from the canvas editor, including accessing the edit dialog, form validation, saving changes, and updating the UI across all components.

## PRD References

- **FR-PM-003**: User shall be able to edit project metadata from the canvas editor
- **US-PM-003**: As a designer, I want to update project details so that I can keep information current
- **AC-PM-003-001**: Project info button in left sidebar opens edit dialog
- **AC-PM-003-002**: All metadata fields are editable (name, number, client, location)
- **AC-PM-003-003**: Project name validation matches creation rules (1-100 chars, required)
- **AC-PM-003-004**: Changes save immediately to store and file
- **AC-PM-003-005**: modifiedAt timestamp updates on save

## Prerequisites

- User is in Canvas Editor page (`/canvas/{projectId}`)
- Project is loaded with existing metadata
- Left sidebar is visible
- User has write permissions to project file

## User Journey Steps

### Step 1: Open Edit Project Dialog

**User Action**: Click "Edit" icon button in left sidebar project details section OR use keyboard shortcut `Ctrl/Cmd+I`

**Expected Result**:
- Edit Project Dialog modal opens
- Dialog overlays canvas with backdrop
- Dialog title: "Edit Project Details"
- Form pre-populated with current values:
  - Project Name: "Office Building HVAC" (focused, selected)
  - Project Number: "2025-001"
  - Client Name: "Acme Corporation"
  - Location: "123 Main St, Chicago, IL"
- "Save" button enabled (even without changes)
- "Cancel" button enabled
- Dialog is centered on screen
- Focus on Project Name field

**Validation Method**: E2E test
```typescript
await page.click('[aria-label="Edit project details"]');

await expect(page.locator('dialog')).toBeVisible();
await expect(page.locator('dialog h2')).toHaveText('Edit Project Details');
await expect(page.locator('input[name="name"]')).toHaveValue('Office Building HVAC');
await expect(page.locator('input[name="name"]')).toBeFocused();
```

---

### Step 2: Edit Project Name

**User Action**: Change project name from "Office Building HVAC" to "Downtown Office Tower HVAC"

**Expected Result**:
- Text updates in input field as typed
- Character counter shows "28/100"
- No validation errors (valid length)
- "Save" button remains enabled
- Form marked as dirty (has changes)

**Validation Method**: Unit test
```typescript
it('allows editing project name', () => {
  const { getByLabelText } = render(<EditProjectDialog project={mockProject} />);

  const nameInput = getByLabelText('Project Name');
  fireEvent.change(nameInput, { target: { value: 'Downtown Office Tower HVAC' } });

  expect(nameInput).toHaveValue('Downtown Office Tower HVAC');
  expect(screen.getByText('28/100')).toBeVisible();
});
```

---

### Step 3: Edit Optional Fields

**User Action**: Update optional fields:
- Project Number: "2025-001" → "2025-007-REV-A"
- Client Name: "Acme Corporation" → "Acme Corp - Facilities Division"
- Location: "123 Main St, Chicago, IL" → "456 Commerce St, Suite 200, Chicago, IL 60607"

**Expected Result**:
- All fields update as typed
- No validation errors (optional fields have no strict format)
- Character counters update (if applicable)
- "Save" button remains enabled
- Unsaved changes indicator appears (asterisk in dialog title)

**Validation Method**: E2E test
```typescript
await page.fill('[name="projectNumber"]', '2025-007-REV-A');
await page.fill('[name="clientName"]', 'Acme Corp - Facilities Division');
await page.fill('[name="location"]', '456 Commerce St, Suite 200, Chicago, IL 60607');

await expect(page.locator('[name="projectNumber"]')).toHaveValue('2025-007-REV-A');
```

---

### Step 4: Save Changes

**User Action**: Click "Save" button OR press `Ctrl/Cmd+S` in dialog

**Expected Result**:
- Button shows loading state ("Saving...")
- Form validation runs:
  - Project name not empty ✓
  - Project name ≤ 100 characters ✓
- Project metadata updated in stores:
  - **projectStore**: Active project metadata updated
  - **projectListStore**: Project in list updated
- `modifiedAt` timestamp set to current time
- Changes persisted to disk (auto-save triggered)
- Success toast: "Project details updated"
- Dialog closes
- Left sidebar updates with new values:
  - Name: "Downtown Office Tower HVAC"
  - Number: "2025-007-REV-A"
  - Client: "Acme Corp - Facilities Division"
  - Location: "456 Commerce St, Suite 200, Chicago, IL 60607"
- Page title updates: "Downtown Office Tower HVAC - SizeWise"

**Validation Method**: Integration test
```typescript
it('saves metadata changes and updates stores', async () => {
  const { getByText, getByLabelText } = render(<EditProjectDialog project={mockProject} onClose={mockClose} />);

  fireEvent.change(getByLabelText('Project Name'), {
    target: { value: 'Downtown Office Tower HVAC' }
  });

  fireEvent.click(getByText('Save'));

  await waitFor(() => {
    const updatedProject = useProjectStore.getState().activeProject;
    expect(updatedProject.name).toBe('Downtown Office Tower HVAC');
    expect(updatedProject.modifiedAt).not.toBe(mockProject.modifiedAt);
  });

  expect(mockClose).toHaveBeenCalled();
  expect(toast.success).toHaveBeenCalledWith('Project details updated');
});
```

---

### Step 5: Verify Updates Across Application

**User Action**: (Automatic - triggered by Step 4)

**Expected Result**:
- **Left Sidebar**: Shows updated details immediately
- **Dashboard** (if navigated back): Shows updated name and metadata in project card
- **Browser Tab Title**: "Downtown Office Tower HVAC - SizeWise"
- **Recent Files Menu**: Shows updated project name
- **File System**: `.sws` file contains updated metadata:
```json
{
  "projectMetadata": {
    "name": "Downtown Office Tower HVAC",
    "projectNumber": "2025-007-REV-A",
    "clientName": "Acme Corp - Facilities Division",
    "location": "456 Commerce St, Suite 200, Chicago, IL 60607",
    "modifiedAt": "2025-01-15T14:32:18.000Z"
  }
}
```

**Validation Method**: E2E test
```typescript
await page.click('[aria-label="Edit project details"]');
await page.fill('[name="name"]', 'Updated Project Name');
await page.click('button:has-text("Save")');

await expect(page.locator('.left-sidebar h2')).toHaveText('Updated Project Name');
await expect(page).toHaveTitle('Updated Project Name - SizeWise');

// Navigate to dashboard
await page.click('[aria-label="Dashboard"]');
await expect(page.locator('.project-card h3')).toHaveText('Updated Project Name');
```

---

## Edge Cases

### 1. Empty Project Name

**User Action**: Clear project name field (delete all text)

**Expected Behavior**:
- Validation error appears: "Project name is required"
- Error message in red below input field
- "Save" button becomes disabled
- Cannot submit form
- Must enter valid name to re-enable save

**Test**:
```typescript
it('prevents saving with empty project name', () => {
  const { getByLabelText, getByText } = render(<EditProjectDialog project={mockProject} />);

  fireEvent.change(getByLabelText('Project Name'), { target: { value: '' } });

  expect(getByText('Project name is required')).toBeVisible();
  expect(getByText('Save')).toBeDisabled();
});
```

---

### 2. Project Name Too Long (>100 Characters)

**User Action**: Enter 105-character project name

**Expected Behavior**:
- Input field limits to 100 characters (hard limit)
- Character counter shows "100/100" (red)
- OR validation error: "Name must be 100 characters or less"
- "Save" button disabled if over limit

**Test**:
```typescript
it('enforces maximum name length', () => {
  const { getByLabelText } = render(<EditProjectDialog project={mockProject} />);

  const longName = 'A'.repeat(105);
  fireEvent.change(getByLabelText('Project Name'), { target: { value: longName } });

  const input = getByLabelText('Project Name') as HTMLInputElement;
  expect(input.value.length).toBeLessThanOrEqual(100);
});
```

---

### 3. No Changes Made

**User Action**: Open dialog, make no edits, click "Save"

**Expected Behavior**:
- Save operation proceeds normally
- No actual changes detected, but `modifiedAt` still updates
- Toast: "Project details updated" (no distinction from normal save)
- Dialog closes
- File is rewritten (idempotent operation)

**Rationale**: Simplifies UX - user expectation is that "Save" always saves

---

### 4. Special Characters in Fields

**User Action**: Enter special characters in name: "Office #1 (2025) - Main [Revision A]"

**Expected Behavior**:
- All printable characters allowed in all fields
- No sanitization or stripping
- Special characters saved as-is
- Proper escaping in JSON serialization
- Characters render correctly in UI

---

### 5. Very Long Optional Fields

**User Action**: Enter 500-character location

**Expected Behavior**:
- Optional fields have no strict length limit (reasonable limit: 1000 chars)
- Long text wraps in left sidebar display
- Tooltip shows full text on hover
- No validation error
- Saves successfully

---

## Error Scenarios

### 1. Save While File Is Locked

**Scenario**: Another process has file lock during save

**Expected Handling**:
- Save fails with file system error
- Error toast: "Cannot save changes. File is locked by another process."
- Dialog remains open
- Form retains edited values
- User can retry save
- "Save" button re-enables

**Test**:
```typescript
it('handles file lock error gracefully', async () => {
  vi.mocked(saveProject).mockRejectedValueOnce(new Error('File locked'));

  const { getByText } = render(<EditProjectDialog project={mockProject} />);

  fireEvent.click(getByText('Save'));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('locked'));
  });

  expect(getByText('Save')).not.toBeDisabled(); // Can retry
});
```

---

### 2. Concurrent Edit from Another Instance

**Scenario**: Two app instances edit same project simultaneously

**Expected Handling**:
- First save succeeds
- Second save detects file `modifiedAt` mismatch
- Warning dialog: "Project was modified externally. Your changes may overwrite recent edits."
- Options:
  - "Overwrite" - Save anyway
  - "Reload" - Discard edits, load latest
  - "Cancel" - Keep dialog open
- User makes informed decision

---

### 3. Store Update Failure

**Scenario**: Zustand store throws error during update

**Expected Handling**:
- Catch error in save handler
- Error toast: "Failed to update project. Please try again."
- Log error with stack trace
- Dialog remains open
- File not modified
- Store remains in previous state (atomic operation)

**Test**:
```typescript
it('rolls back on store update failure', async () => {
  const originalProject = { ...mockProject };

  vi.spyOn(useProjectStore.getState(), 'updateProject').mockImplementation(() => {
    throw new Error('Store error');
  });

  const { getByText } = render(<EditProjectDialog project={mockProject} />);
  fireEvent.click(getByText('Save'));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalled();
  });

  // Verify no changes persisted
  expect(useProjectStore.getState().activeProject).toEqual(originalProject);
});
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Edit Dialog | `Ctrl/Cmd + I` |
| Save Changes | `Ctrl/Cmd + S` (within dialog) |
| Cancel / Close Dialog | `Escape` |
| Focus Next Field | `Tab` |
| Focus Previous Field | `Shift + Tab` |

---

## Related Elements

- [EditProjectDialog](../../elements/01-components/canvas/EditProjectDialog.md) - Dialog component
- [LeftSidebar](../../elements/01-components/canvas/LeftSidebar.md) - Project info display
- [projectStore](../../elements/02-stores/projectStore.md) - Active project state
- [projectListStore](../../elements/02-stores/projectListStore.md) - Project list updates
- [ProjectIO](../../elements/10-persistence/ProjectIO.md) - File save operations
- [Toast](../../elements/01-components/ui/Toast.md) - Notifications
- [CanvasEditorPage](../../elements/12-pages/CanvasEditorPage.md) - Parent page

---

## Test Implementation

### Unit Tests
- `src/__tests__/components/EditProjectDialog.test.tsx`
  - Form validation
  - Input handling
  - Button states
  - Character limits

### Integration Tests
- `src/__tests__/integration/project-metadata-edit.test.ts`
  - Store updates
  - File persistence
  - Multi-store synchronization
  - Error handling

### E2E Tests
- `e2e/project-management/edit-project-metadata.spec.ts`
  - Complete edit flow
  - Success path
  - Validation errors
  - Cross-component updates
  - Keyboard shortcuts

---

## Notes

### Implementation Details

```typescript
// EditProjectDialog.tsx
const EditProjectDialog: React.FC<Props> = ({ project, onClose }) => {
  const [formData, setFormData] = useState({
    name: project.name,
    projectNumber: project.projectNumber || '',
    clientName: project.clientName || '',
    location: project.location || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const updateProject = useProjectStore(state => state.updateProject);
  const updateProjectInList = useProjectListStore(state => state.updateProject);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);

    try {
      // Create updated project object
      const updatedProject: Project = {
        ...project,
        name: formData.name.trim(),
        projectNumber: formData.projectNumber.trim() || null,
        clientName: formData.clientName.trim() || null,
        location: formData.location.trim() || null,
        modifiedAt: new Date().toISOString()
      };

      // Update stores
      updateProject(updatedProject);
      updateProjectInList(updatedProject.id, updatedProject);

      // Trigger auto-save to persist changes
      await triggerManualSave();

      // Show success feedback
      toast.success('Project details updated');

      // Close dialog
      onClose();

    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Edit Project Details</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <TextField
            label="Project Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name || `${formData.name.length}/100`}
            required
            fullWidth
            autoFocus
            inputProps={{ maxLength: 100 }}
          />

          <TextField
            label="Project Number"
            name="projectNumber"
            value={formData.projectNumber}
            onChange={(e) => setFormData({ ...formData, projectNumber: e.target.value })}
            fullWidth
            margin="normal"
          />

          <TextField
            label="Client Name"
            name="clientName"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            fullWidth
            margin="normal"
          />

          <TextField
            label="Location"
            name="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving || !!errors.name}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### Performance Considerations

- **Form Validation**: Runs on every keystroke (debounced 300ms for character count)
- **Store Updates**: Synchronous Zustand updates (~2ms)
- **File Save**: Async auto-save triggered (~100-300ms)
- **UI Update**: React re-renders sidebar and title (~5-10ms)

**Expected Total Time**: < 500ms for complete save operation

### Data Flow

```
User Input
    ↓
Form State Update
    ↓
Validation
    ↓
Store Updates (projectStore + projectListStore)
    ↓
Trigger Auto-Save
    ↓
File Write
    ↓
UI Updates (sidebar, title, dashboard)
    ↓
Success Notification
```

### Accessibility

- Dialog has `role="dialog"` and `aria-labelledby`
- All form fields have associated labels
- Error messages have `aria-describedby` links
- Focus management (auto-focus name field, return focus on close)
- Keyboard navigation fully supported
- Screen reader announces validation errors

### Future Enhancements

- **Project Tags**: Add tags/labels for categorization
- **Project Description**: Multi-line description field
- **Project Status**: Dropdown (Planning, In Progress, Complete)
- **Custom Fields**: User-defined metadata fields
- **Change History**: Log of all metadata edits with timestamps
- **Bulk Edit**: Edit metadata for multiple projects from dashboard
