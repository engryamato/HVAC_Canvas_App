# [UJ-FM-003] Save As (Create Copy)

## Overview

This user journey covers saving the current project with a new name and/or location, creating a duplicate copy while preserving the original. Includes file path selection, metadata customization, file copying, and navigation options.

## PRD References

- **FR-FM-003**: User shall be able to save project with new name (Save As)
- **US-FM-003**: As a designer, I want to save a copy of my project so that I can create variations or backups
- **AC-FM-003-001**: Save As accessible via menu or Ctrl/Cmd+Shift+S
- **AC-FM-003-002**: Dialog allows editing project name and location
- **AC-FM-003-003**: New project created with new UUID
- **AC-FM-003-004**: Original project remains unchanged
- **AC-FM-003-005**: User can choose to open new copy or stay in original

## Prerequisites

- User is in Canvas Editor page (`/canvas/{projectId}`)
- Project is loaded (either newly created or opened)
- File system is accessible and writable
- User has write permissions to target directory

## User Journey Steps

### Step 1: Trigger Save As Action

**User Action**: Press `Ctrl/Cmd+Shift+S` OR click File menu → "Save As..." OR click "Save As" button in toolbar

**Expected Result**:
- Save As Dialog opens
- Dialog overlays canvas with backdrop
- Dialog title: "Save Project As..."
- Form pre-populated with current project data:
  - **New Project Name**: "Office Building HVAC - Copy" (editable, focused)
  - **Save Location**: Current project directory (with "Browse" button)
  - **Copy Options** (checkboxes):
    - ✓ Copy all entities (checked, disabled - always copies)
    - ✓ Copy viewport state (checked)
    - ✓ Copy settings (checked)
  - **After Save** (radio buttons):
    - ○ Open new copy
    - ● Stay in original project (selected by default)
- Character counter: "28/100" for project name
- "Save As" button enabled
- "Cancel" button enabled
- Save location path displayed: "/Users/.../Projects/"

**Validation Method**: E2E test
```typescript
await page.keyboard.press('Control+Shift+S'); // or Meta+Shift+S on macOS

await expect(page.locator('dialog h2')).toHaveText('Save Project As...');
await expect(page.locator('input[name="projectName"]')).toHaveValue('Office Building HVAC - Copy');
await expect(page.locator('input[name="projectName"]')).toBeFocused();
```

---

### Step 2: Edit New Project Name

**User Action**: Change name from "Office Building HVAC - Copy" to "Office Building HVAC - Second Floor"

**Expected Result**:
- Text updates in input field as typed
- Character counter shows: "37/100"
- Real-time validation:
  - If name empty → "Save As" button disables, error: "Project name required"
  - If name > 100 chars → "Save As" button disables, error: "Name too long"
  - If name valid → "Save As" button remains enabled
- No validation errors for current input
- Form marked as edited

**Validation Method**: Unit test
```typescript
it('validates new project name', () => {
  const { getByLabelText, getByText } = render(<SaveAsDialog project={mockProject} />);

  const nameInput = getByLabelText('New Project Name');

  // Empty name
  fireEvent.change(nameInput, { target: { value: '' } });
  expect(getByText('Save As')).toBeDisabled();

  // Valid name
  fireEvent.change(nameInput, { target: { value: 'New Project Name' } });
  expect(getByText('Save As')).not.toBeDisabled();
});
```

---

### Step 3: Choose Save Location (Optional)

**User Action**: Click "Browse..." button to select different save location

**Expected Result**:
- Native file dialog opens (Tauri file picker)
- Dialog type: "Select Folder"
- Current location pre-selected
- User can navigate to any writable directory
- After selection:
  - Dialog closes
  - Save location path updates in main dialog
  - Path displayed: "/Users/.../NewLocation/"
  - Validation checks write permissions
  - If no write permission → error: "Cannot write to selected location"

**Validation Method**: Integration test
```typescript
it('allows browsing for save location', async () => {
  vi.mocked(invoke).mockResolvedValueOnce('/Users/test/NewLocation');

  const { getByText } = render(<SaveAsDialog project={mockProject} />);

  fireEvent.click(getByText('Browse...'));

  await waitFor(() => {
    expect(invoke).toHaveBeenCalledWith('select_folder', expect.any(Object));
  });

  // Location should update
  expect(screen.getByText('/Users/test/NewLocation')).toBeVisible();
});
```

---

### Step 4: Configure Copy Options

**User Action**: Review copy options and select "Open new copy" radio button

**Expected Result**:
- Radio button selection updates
- "Open new copy" selected
- "Stay in original project" deselected
- Checkboxes remain checked (all project data will be copied)
- No immediate action (waiting for save confirmation)

**Validation Method**: Unit test
```typescript
it('updates navigation preference on radio selection', () => {
  const { getByLabelText } = render(<SaveAsDialog project={mockProject} />);

  const openNewCopy = getByLabelText('Open new copy');

  fireEvent.click(openNewCopy);

  expect(openNewCopy).toBeChecked();
  expect(getByLabelText('Stay in original project')).not.toBeChecked();
});
```

---

### Step 5: Execute Save As

**User Action**: Click "Save As" button

**Expected Result**:
- Button shows loading state: "Saving..."
- Dialog remains open during operation
- Save process executes:
  1. **Generate new UUID**: `newProjectId = crypto.randomUUID()`
  2. **Collect project state**: Gather all data from stores (same as manual save)
  3. **Create new project metadata**:
```typescript
const newProject: Project = {
  id: newProjectId,
  name: 'Office Building HVAC - Second Floor',
  projectNumber: originalProject.projectNumber, // Inherit
  clientName: originalProject.clientName,       // Inherit
  location: originalProject.location,           // Inherit
  createdAt: new Date().toISOString(),          // New timestamp
  modifiedAt: new Date().toISOString(),
  entityCount: originalProject.entityCount,
  thumbnailUrl: null,                           // Will regenerate
  isArchived: false
};
```
  4. **Copy entities**: Deep clone all entities with new IDs (optional, or keep same IDs)
  5. **Create ProjectFile object**: With new project ID and metadata
  6. **Serialize to JSON**: Pretty-print formatting
  7. **Write to disk**: `{newProjectId}.sws` at selected location
  8. **Add to project list**: `projectListStore.addProject(newProject)`
  9. **Navigate** (if "Open new copy" selected): Close original, open new

**Validation Method**: Integration test
```typescript
it('creates new project file with new UUID', async () => {
  const { getByText, getByLabelText } = render(<SaveAsDialog project={mockProject} onClose={mockClose} />);

  fireEvent.change(getByLabelText('New Project Name'), {
    target: { value: 'Project Copy' }
  });

  fireEvent.click(getByText('Save As'));

  await waitFor(() => {
    const projects = useProjectListStore.getState().projects;
    expect(projects).toHaveLength(2); // Original + new copy

    const newProject = projects.find(p => p.name === 'Project Copy');
    expect(newProject).toBeDefined();
    expect(newProject.id).not.toBe(mockProject.id); // Different UUID
  });

  expect(mockClose).toHaveBeenCalled();
});
```

---

### Step 6: Confirmation and Navigation

**User Action**: (Automatic - triggered by Step 5 completion)

**Expected Result**:
- **If "Stay in original project" selected**:
  - Success toast: "Project saved as 'Office Building HVAC - Second Floor'"
  - Dialog closes
  - User remains in original project canvas
  - Original project unsaved changes cleared
  - New project appears in project list (dashboard)
  - No navigation occurs

- **If "Open new copy" selected**:
  - Success toast: "Project saved. Opening new copy..."
  - Original project auto-saved (if unsaved changes)
  - Browser navigates to: `/canvas/{newProjectId}`
  - New project loads in canvas
  - Left sidebar shows new project name
  - Window title updates: "Office Building HVAC - Second Floor - SizeWise"
  - Status bar shows: "Entities: 12"

**Validation Method**: E2E test
```typescript
await page.keyboard.press('Control+Shift+S');
await page.fill('[name="projectName"]', 'Project Copy');
await page.click('input[value="open-new"]');
await page.click('button:has-text("Save As")');

await expect(page).toHaveURL(/\/canvas\/[a-f0-9-]{36}/);
await expect(page.locator('h1')).toHaveText('Project Copy');
await expect(page.locator('.toast-success')).toHaveText(/saved/);
```

---

## Edge Cases

### 1. Duplicate Project Name in Same Location

**User Action**: Save As with name that already exists in target directory

**Expected Behavior**:
- File write detects existing file
- Confirmation dialog appears:
  - "A project named 'Office Building HVAC - Copy' already exists."
  - "Do you want to replace it?"
  - "Replace" button (destructive, red)
  - "Cancel" button
- If Replace → Overwrites existing file (creates backup first)
- If Cancel → Returns to Save As dialog

**Test**:
```typescript
it('prompts when project name already exists', async () => {
  // Mock existing file
  vi.mocked(invoke).mockResolvedValueOnce(true); // fileExists = true

  const { getByText } = render(<SaveAsDialog project={mockProject} />);

  fireEvent.change(getByLabelText('New Project Name'), {
    target: { value: 'Existing Project' }
  });

  fireEvent.click(getByText('Save As'));

  await waitFor(() => {
    expect(screen.getByText(/already exists/)).toBeVisible();
  });
});
```

---

### 2. Save As Without Changing Name

**User Action**: Keep default name "Office Building HVAC - Copy" and save

**Expected Behavior**:
- New project created with " - Copy" suffix
- Original and copy both exist in project list
- Both have different UUIDs
- Both files exist on disk
- No confusion or errors
- If multiple copies: " - Copy 2", " - Copy 3", etc.

---

### 3. Save As to Read-Only Location

**User Action**: Select save location that's read-only (e.g., system directory)

**Expected Behavior**:
- Browse dialog may prevent selection (OS-level)
- If selected, write permission check fails
- Error message: "Cannot save to this location. Permission denied."
- Save location path shows error icon
- "Save As" button disabled until valid location selected
- User must choose different location

---

### 4. Save As During Unsaved Changes

**User Action**: Make changes to original project, then Save As without saving original first

**Expected Behavior**:
- Save As dialog includes warning:
  - "⚠️ You have unsaved changes in the current project."
  - "Save As will create a copy including these changes."
  - "Original project will NOT be saved automatically."
- User understands consequence
- Option: Checkbox "Save original project first" (checked by default)
- If checked → Save original before creating copy
- If unchecked → Only copy is saved (original changes lost if not saved)

---

### 5. Very Long Project Name Path

**User Action**: Save with very long name + deep folder path (total > 260 characters on Windows)

**Expected Behavior**:
- Path length validation detects issue
- Warning message: "File path too long. Choose shorter name or different location."
- Suggest using shorter project name
- Platform-specific limits enforced
- User must adjust to proceed

---

## Error Scenarios

### 1. Disk Full During Save As

**Scenario**: Insufficient disk space for new project file

**Expected Handling**:
- Write operation fails partway
- Error caught and handled:
  - Error toast: "Cannot save project. Insufficient disk space."
  - Dialog remains open
  - Partial file deleted (cleanup)
  - Project NOT added to project list
- User can:
  - Free disk space and retry
  - Choose different location (e.g., external drive)
  - Cancel operation

**Test**:
```typescript
it('handles disk full error during save as', async () => {
  vi.mocked(invoke).mockRejectedValueOnce(new Error('Disk full'));

  const { getByText } = render(<SaveAsDialog project={mockProject} />);

  fireEvent.click(getByText('Save As'));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('disk space'));
    expect(useProjectListStore.getState().projects).toHaveLength(1); // Only original
  });
});
```

---

### 2. File Write Permission Error

**Scenario**: User loses write permission during save (e.g., folder becomes read-only)

**Expected Handling**:
- Write fails with permission error
- Error toast: "Cannot save project. Permission denied."
- Dialog shows error with "Retry" button
- User can:
  - Grant permissions (desktop app prompt)
  - Choose different location
  - Cancel

---

### 3. Entity Serialization Failure

**Scenario**: One entity has corrupted data that can't serialize

**Expected Handling**:
- Serialization validation catches issue
- Error dialog:
  - "Cannot save project. Entity data is invalid."
  - Details: "Room 5 (ID: room-abc) has invalid dimensions"
- Options:
  - "Fix in Inspector" - Closes dialog, selects problematic entity
  - "Skip Invalid Entities" - Saves without problematic entities
  - "Cancel"
- User makes informed decision

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Save As Dialog | `Ctrl/Cmd + Shift + S` |
| Confirm Save | `Enter` (when name is valid) |
| Cancel Save As | `Escape` |

---

## Related Elements

- [SaveAsDialog](../../elements/01-components/canvas/SaveAsDialog.md) - Dialog component
- [ProjectIO](../../elements/10-persistence/ProjectIO.md) - File save operations
- [projectStore](../../elements/02-stores/projectStore.md) - Project metadata
- [projectListStore](../../elements/02-stores/projectListStore.md) - Project list updates
- [entityStore](../../elements/02-stores/entityStore.md) - Entity data copying
- [CanvasEditorPage](../../elements/12-pages/CanvasEditorPage.md) - Parent page
- [Toast](../../elements/01-components/ui/Toast.md) - Notifications

---

## Test Implementation

### Unit Tests
- `src/__tests__/components/SaveAsDialog.test.tsx`
  - Form validation
  - Name generation (" - Copy")
  - Option selection
  - Button states

### Integration Tests
- `src/__tests__/integration/save-as.test.ts`
  - UUID generation
  - File creation
  - Store updates
  - Navigation logic
  - Error handling

### E2E Tests
- `e2e/file-management/save-as.spec.ts`
  - Complete Save As flow
  - Both navigation options
  - Location selection
  - Duplicate name handling
  - Error scenarios

---

## Notes

### Implementation Details

```typescript
// SaveAsDialog.tsx
const SaveAsDialog: React.FC<Props> = ({ project, onClose }) => {
  const [formData, setFormData] = useState({
    name: `${project.name} - Copy`,
    location: project.filePath ? path.dirname(project.filePath) : defaultProjectsPath,
    openNewCopy: false,
    saveOriginalFirst: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const addProject = useProjectListStore(state => state.addProject);
  const router = useRouter();

  const handleSaveAs = async () => {
    setIsSaving(true);

    try {
      // 1. Save original if requested and has unsaved changes
      if (formData.saveOriginalFirst && projectStore.hasUnsavedChanges) {
        await triggerManualSave();
      }

      // 2. Generate new project ID
      const newProjectId = crypto.randomUUID();

      // 3. Collect current project state
      const currentState = collectProjectState();

      // 4. Create new project metadata
      const newProject: Project = {
        id: newProjectId,
        name: formData.name.trim(),
        projectNumber: project.projectNumber,
        clientName: project.clientName,
        location: project.location,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        entityCount: currentState.entities.allIds.length,
        thumbnailUrl: null,
        isArchived: false
      };

      // 5. Create new project file with new ID
      const newProjectFile: ProjectFile = {
        ...currentState,
        projectId: newProjectId,
        projectMetadata: newProject
      };

      // 6. Determine file path
      const newFilePath = path.join(formData.location, `${newProjectId}.sws`);

      // 7. Check if file exists
      const exists = await invoke('file_exists', { path: newFilePath });
      if (exists) {
        const confirmed = await confirmOverwrite(formData.name);
        if (!confirmed) {
          setIsSaving(false);
          return;
        }
      }

      // 8. Save to disk
      const result = await saveProject(newProjectFile, newFilePath, {
        createBackup: false // New file, no backup needed
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // 9. Add to project list
      addProject(newProject);

      // 10. Navigate if requested
      if (formData.openNewCopy) {
        toast.success(`Project saved. Opening new copy...`);
        router.push(`/canvas/${newProjectId}`);
      } else {
        toast.success(`Project saved as "${formData.name}"`);
      }

      // 11. Close dialog
      onClose();

    } catch (error) {
      console.error('Save As failed:', error);
      toast.error(`Failed to save project. ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Save Project As...</DialogTitle>
      <DialogContent>
        <TextField
          label="New Project Name"
          name="projectName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          fullWidth
          autoFocus
          required
          helperText={`${formData.name.length}/100`}
          inputProps={{ maxLength: 100 }}
        />

        <LocationPicker>
          <TextField
            label="Save Location"
            value={formData.location}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <Button onClick={handleBrowse}>Browse...</Button>
        </LocationPicker>

        {projectStore.hasUnsavedChanges && (
          <WarningBox>
            ⚠️ You have unsaved changes in the current project.
            <Checkbox
              label="Save original project first"
              checked={formData.saveOriginalFirst}
              onChange={(e) => setFormData({ ...formData, saveOriginalFirst: e.target.checked })}
            />
          </WarningBox>
        )}

        <RadioGroup
          label="After Save"
          value={formData.openNewCopy ? 'open-new' : 'stay'}
          onChange={(e) => setFormData({ ...formData, openNewCopy: e.target.value === 'open-new' })}
        >
          <Radio value="stay" label="Stay in original project" />
          <Radio value="open-new" label="Open new copy" />
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
        <Button
          onClick={handleSaveAs}
          variant="contained"
          disabled={!formData.name.trim() || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save As'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### Entity ID Preservation

**Question**: Should copied entities keep same IDs or get new UUIDs?

**Option 1: Keep Same IDs** (Recommended)
- Simpler implementation
- Entities remain identical
- Useful for versioning (can compare projects)
- No ID conflicts (different project files)

**Option 2: Generate New IDs**
- More independent copies
- Prevents any potential ID collision
- More complex (need ID mapping for connections)

**Decision**: Keep same IDs for simplicity unless specific requirements need new IDs

### Performance Considerations

- **State Collection**: Same as manual save (~10-50ms)
- **UUID Generation**: <1ms
- **Serialization**: 50-200ms (depending on project size)
- **File Write**: 50-150ms
- **Store Updates**: <5ms
- **Navigation**: 100-200ms (if opening new copy)

**Expected Total Time**: 300-600ms for typical project

### Accessibility

- Dialog has `role="dialog"` and `aria-labelledby`
- All form fields have labels
- Warning messages have `aria-live="polite"`
- Keyboard navigation works throughout
- Focus management (returns to canvas on close)

### Future Enhancements

- **Template Creation**: Save project as reusable template
- **Export Options**: Include thumbnails, reports in copy
- **Incremental Naming**: Auto-detect " - Copy N" pattern
- **Version Control**: Git-like branching for project versions
- **Cloud Save As**: Save copy to cloud storage directly
- **Selective Copy**: Choose which entities to include in copy
