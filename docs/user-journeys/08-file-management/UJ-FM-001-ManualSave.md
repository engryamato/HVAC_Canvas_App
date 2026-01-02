# [UJ-FM-001] Manual Save

## Overview

This user journey covers the complete workflow for manually saving an HVAC project to disk, including triggering the save action, file validation, serialization, backup creation, disk writing, and user feedback. Manual save provides explicit save control complementing auto-save functionality.

## PRD References

- **FR-FM-001**: User shall be able to manually save projects with Ctrl/Cmd+S
- **US-FM-001**: As a designer, I want to save my work on demand so that I can ensure my changes are persisted
- **AC-FM-001-001**: Ctrl/Cmd+S triggers manual save
- **AC-FM-001-002**: Save button in toolbar triggers manual save
- **AC-FM-001-003**: Unsaved changes indicator shows asterisk (*) in title
- **AC-FM-001-004**: Successful save shows toast notification
- **AC-FM-001-005**: Save creates backup of existing file (.sws.bak)

## Prerequisites

- User is in Canvas Editor page (`/canvas/{projectId}`)
- Project has been created or loaded
- Project has unsaved changes (optional - can save without changes)
- File system is accessible and writable

## User Journey Steps

### Step 1: Trigger Manual Save

**User Action**: Press `Ctrl+S` (Windows/Linux) or `Cmd+S` (macOS) OR click "Save" button in toolbar

**Expected Result**:
- Save operation begins immediately
- Save button shows loading state:
  - Icon changes to spinner
  - Button becomes disabled
  - Tooltip changes to "Saving..."
- Keyboard shortcut is captured (prevents browser default)
- No dialog prompts (silent save to existing path)

**Validation Method**: E2E test
```typescript
await page.keyboard.press('Control+S'); // or Meta+S on macOS

await expect(page.locator('button[aria-label="Save"]')).toHaveAttribute('aria-busy', 'true');
await expect(page.locator('.save-spinner')).toBeVisible();
```

---

### Step 2: Collect Project State

**User Action**: (Automatic - triggered by Step 1)

**Expected Result**:
- System gathers data from all stores:
  - **entityStore**: All entities (byId, allIds)
  - **viewportStore**: Current pan position and zoom level
  - **projectStore**: Project metadata (name, client, dates)
  - **canvasStore**: Grid settings, snap settings, unit system
- Constructs `ProjectFile` object:
```typescript
const projectFile: ProjectFile = {
  schemaVersion: '1.0.0',
  projectId: activeProject.id,
  projectMetadata: {
    name: activeProject.name,
    projectNumber: activeProject.projectNumber,
    clientName: activeProject.clientName,
    location: activeProject.location,
    createdAt: activeProject.createdAt,
    modifiedAt: new Date().toISOString(), // Updated to now
    entityCount: allIds.length,
    thumbnailUrl: null,
    isArchived: false
  },
  entities: {
    byId: entityStore.byId,
    allIds: entityStore.allIds
  },
  viewportState: {
    panX: viewportStore.panX,
    panY: viewportStore.panY,
    zoom: viewportStore.zoom
  },
  settings: {
    unitSystem: canvasStore.unitSystem,
    gridSize: canvasStore.gridSize,
    snapToGrid: canvasStore.snapToGrid,
    showGrid: canvasStore.showGrid
  }
};
```

**Validation Method**: Unit test
```typescript
it('collects all project state for saving', () => {
  const projectFile = collectProjectState();

  expect(projectFile.schemaVersion).toBe('1.0.0');
  expect(projectFile.entities.allIds).toHaveLength(12);
  expect(projectFile.viewportState.zoom).toBe(1.0);
  expect(projectFile.settings.unitSystem).toBe('imperial');
  expect(projectFile.projectMetadata.modifiedAt).toBeDefined();
});
```

---

### Step 3: Validate and Serialize

**User Action**: (Automatic - triggered by Step 2)

**Expected Result**:
- **Validation**:
  - Schema version is current ('1.0.0')
  - Project metadata passes Zod validation
  - All entities pass their respective schemas
  - No circular references in data
  - All required fields present
- **Serialization**:
  - Convert `ProjectFile` to JSON string
  - Pretty-print with 2-space indentation
  - Ensure UTF-8 encoding
  - Calculate file size

**Validation Method**: Integration test
```typescript
it('validates and serializes project data', async () => {
  const projectFile = collectProjectState();

  // Validation
  const validationResult = ProjectFileSchema.safeParse(projectFile);
  expect(validationResult.success).toBe(true);

  // Serialization
  const jsonString = JSON.stringify(projectFile, null, 2);
  expect(jsonString).toBeDefined();
  expect(jsonString.length).toBeGreaterThan(0);

  // Verify parseable
  const parsed = JSON.parse(jsonString);
  expect(parsed.schemaVersion).toBe('1.0.0');
});
```

---

### Step 4: Create Backup and Write File

**User Action**: (Automatic - triggered by Step 3)

**Expected Result**:
- **Backup Creation** (if file exists):
  - Check if `{projectId}.sws` exists
  - If exists, copy to `{projectId}.sws.bak`
  - Overwrite previous backup
  - Keep only 1 backup (not versioned)
- **File Write**:
  - Write serialized JSON to `{projectId}.sws`
  - Use atomic write (write to temp file, then rename)
  - Ensure file permissions are correct (read/write for user)
  - Verify write success
- **Tauri File Operation**:
```typescript
// Pseudo-code for Tauri backend
await invoke('save_project', {
  projectId: projectFile.projectId,
  content: jsonString,
  createBackup: true
});
```

**Validation Method**: Integration test
```typescript
it('creates backup before writing new file', async () => {
  // Setup: existing file
  const existingContent = '{"schemaVersion":"1.0.0"}';
  await writeFile(projectPath, existingContent);

  // Save new version
  const result = await saveProject(projectFile, projectPath, { createBackup: true });

  // Verify backup created
  const backupPath = `${projectPath}.bak`;
  const backupExists = await fileExists(backupPath);
  expect(backupExists).toBe(true);

  const backupContent = await readFile(backupPath);
  expect(backupContent).toBe(existingContent); // Old version preserved

  // Verify new file written
  const newContent = await readFile(projectPath);
  expect(JSON.parse(newContent).projectMetadata.modifiedAt).toBeDefined();
});
```

---

### Step 5: Update UI and Notify User

**User Action**: (Automatic - triggered by Step 4)

**Expected Result**:
- **Success State**:
  - Save button returns to normal state (spinner → checkmark → save icon)
  - Success toast appears: "Project saved successfully"
  - Unsaved changes indicator removed (asterisk disappears from title)
  - `modifiedAt` timestamp updated in project metadata
  - `hasUnsavedChanges` flag set to `false`
- **Status Bar Update**:
  - Shows "Saved at [time]" (e.g., "Saved at 2:34 PM")
- **Auto-save Timer Reset**:
  - Manual save resets the 5-minute auto-save countdown

**Validation Method**: E2E test
```typescript
await page.keyboard.press('Control+S');

// Wait for save to complete
await expect(page.locator('.toast-success')).toHaveText('Project saved successfully');

// Verify unsaved indicator removed
await expect(page.locator('h1')).not.toContainText('*');

// Verify status bar
await expect(page.locator('.status-bar')).toContainText(/Saved at \d{1,2}:\d{2}/);

// Verify button restored
await expect(page.locator('button[aria-label="Save"]')).not.toHaveAttribute('aria-busy', 'true');
```

---

## Edge Cases

### 1. Save Without Changes

**User Action**: Press Ctrl+S when no changes have been made since last save

**Expected Behavior**:
- Save operation proceeds normally
- File is rewritten with same data (idempotent)
- `modifiedAt` timestamp updated to current time
- Toast: "Project saved successfully" (no distinction from normal save)
- Backup still created (overwrites previous backup)

**Rationale**: User expects Ctrl+S to always save, even if unchanged

**Test**:
```typescript
it('allows saving without changes', async () => {
  // Initial save
  await saveProject(projectFile, projectPath);
  const firstModified = (await readProjectFile(projectPath)).projectMetadata.modifiedAt;

  // Save again without changes
  await new Promise(resolve => setTimeout(resolve, 10)); // Ensure time difference
  await saveProject(projectFile, projectPath);
  const secondModified = (await readProjectFile(projectPath)).projectMetadata.modifiedAt;

  expect(secondModified).not.toBe(firstModified); // Timestamp updated
});
```

---

### 2. Rapid Successive Saves

**User Action**: Press Ctrl+S multiple times rapidly (e.g., 5 times in 2 seconds)

**Expected Behavior**:
- First save starts normally
- Subsequent save attempts are queued or debounced
- Only one file write occurs at a time
- Last save request wins (if data changed between saves)
- No file corruption from concurrent writes
- User sees one toast notification (not 5)

**Test**:
```typescript
it('debounces rapid save attempts', async () => {
  const saveSpy = vi.fn();

  // Trigger 5 saves rapidly
  for (let i = 0; i < 5; i++) {
    saveProject(projectFile, projectPath);
  }

  await waitFor(() => {
    expect(saveSpy).toHaveBeenCalledTimes(1); // Only one actual write
  });
});
```

---

### 3. Save During Auto-Save

**User Action**: Press Ctrl+S while auto-save is in progress

**Expected Behavior**:
- Auto-save operation is cancelled
- Manual save takes priority
- Only one save operation completes
- User sees "Project saved successfully" (manual save confirmation)
- Auto-save timer resets after manual save completes

---

### 4. Very Large Project (10MB+ file)

**User Action**: Save project with 2000+ entities (large file)

**Expected Behavior**:
- Save operation takes 1-3 seconds
- Progress indicator shows during save
- UI remains responsive (save runs in background)
- Status bar shows "Saving..." text
- File writes successfully
- Toast notification confirms completion
- No performance degradation

**Test**:
```typescript
it('handles large project saves efficiently', async () => {
  const largeProject = createMockProject({ entityCount: 2000 });

  const startTime = performance.now();
  const result = await saveProject(largeProject, projectPath);
  const saveTime = performance.now() - startTime;

  expect(result.success).toBe(true);
  expect(saveTime).toBeLessThan(3000); // Under 3 seconds
});
```

---

### 5. Save to Read-Only Location

**User Action**: Attempt to save project to read-only directory

**Expected Behavior**:
- File write fails with permission error
- Error toast: "Cannot save project. The file location is read-only."
- Desktop app: Prompt "Save As" dialog to choose new location
- Web app: Suggest downloading file instead
- Original file remains unchanged
- Unsaved changes indicator remains (asterisk stays)

---

## Error Scenarios

### 1. Disk Full

**Scenario**: Insufficient disk space for file write

**Expected Handling**:
- Write operation fails midway
- Error caught by Tauri backend
- Error toast: "Cannot save project. Insufficient disk space."
- Partial file is deleted (cleanup)
- Backup file is preserved (not corrupted)
- User prompted to free disk space or save elsewhere
- Unsaved changes retained in memory

**Test**:
```typescript
it('handles disk full error gracefully', async () => {
  // Mock Tauri error
  vi.mocked(invoke).mockRejectedValueOnce(new Error('Disk full'));

  const result = await saveProject(projectFile, projectPath);

  expect(result.success).toBe(false);
  expect(result.error).toContain('disk space');

  // Verify backup not corrupted
  const backupExists = await fileExists(`${projectPath}.bak`);
  expect(backupExists).toBe(true);
});
```

---

### 2. File Locked by Another Process

**Scenario**: Another application has exclusive lock on `.sws` file

**Expected Handling**:
- File write fails with lock error
- Retry mechanism attempts 3 times with 500ms delay
- If still locked, error toast: "Cannot save project. File is in use by another program."
- Suggest closing other applications
- Offer "Save As" option
- Data retained in memory (not lost)

---

### 3. Serialization Failure

**Scenario**: Entity contains circular reference or non-serializable data

**Expected Handling**:
- `JSON.stringify()` throws error
- Error caught before file write
- Error toast: "Cannot save project. Data contains invalid values."
- Console log shows problematic entity ID
- Diagnostic info saved to error log
- User instructed to report bug
- Recommend reverting recent changes

**Test**:
```typescript
it('handles serialization errors', async () => {
  // Create project with circular reference
  const circularProject = { ...projectFile };
  circularProject.entities.byId['room-1'].circularRef = circularProject;

  const result = await saveProject(circularProject, projectPath);

  expect(result.success).toBe(false);
  expect(result.error).toContain('serialization');
  expect(console.error).toHaveBeenCalled();
});
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Manual Save | `Ctrl/Cmd + S` |
| Save As (future) | `Ctrl/Cmd + Shift + S` |
| Quick Save (no notification) | `Ctrl/Cmd + Alt + S` |

---

## Related Elements

- [CanvasEditorPage](../../elements/12-pages/CanvasEditorPage.md) - Parent page
- [ProjectIO](../../elements/10-persistence/ProjectIO.md) - File save logic
- [SaveButton](../../elements/01-components/canvas/SaveButton.md) - Toolbar button
- [projectStore](../../elements/02-stores/projectStore.md) - Project metadata
- [entityStore](../../elements/02-stores/entityStore.md) - Entity data
- [viewportStore](../../elements/02-stores/viewportStore.md) - Viewport state
- [useAutoSave](../../elements/07-hooks/useAutoSave.md) - Auto-save integration
- [Toast](../../elements/01-components/ui/Toast.md) - Notification system

---

## Test Implementation

### Unit Tests
- `src/__tests__/persistence/ProjectIO.test.ts`
  - Serialization
  - Validation
  - Backup creation
  - Error handling

### Integration Tests
- `src/__tests__/integration/manual-save.test.ts`
  - Full save flow
  - State collection
  - File I/O integration
  - Store updates

### E2E Tests
- `e2e/file-management/manual-save.spec.ts`
  - Keyboard shortcut
  - Toolbar button
  - Success path
  - Error scenarios
  - Large files
  - Rapid saves

---

## Notes

### Implementation Details

```typescript
// SaveButton.tsx & keyboard handler
const handleSave = async () => {
  if (isSaving) return; // Prevent concurrent saves

  setIsSaving(true);

  try {
    // 1. Collect state from all stores
    const projectFile: ProjectFile = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      projectId: activeProject.id,
      projectMetadata: {
        ...activeProject,
        modifiedAt: new Date().toISOString(),
        entityCount: entityStore.allIds.length
      },
      entities: {
        byId: entityStore.byId,
        allIds: entityStore.allIds
      },
      viewportState: {
        panX: viewportStore.panX,
        panY: viewportStore.panY,
        zoom: viewportStore.zoom
      },
      settings: {
        unitSystem: canvasStore.unitSystem,
        gridSize: canvasStore.gridSize,
        snapToGrid: canvasStore.snapToGrid,
        showGrid: canvasStore.showGrid
      }
    };

    // 2. Validate
    const validationResult = ProjectFileSchema.safeParse(projectFile);
    if (!validationResult.success) {
      throw new Error('Project validation failed');
    }

    // 3. Resolve file path
    const filePath = await resolveProjectPath(activeProject.id);

    // 4. Save to disk
    const result = await saveProject(projectFile, filePath, {
      createBackup: true
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // 5. Update UI state
    projectStore.getState().setHasUnsavedChanges(false);
    projectStore.getState().updateLastSavedAt(new Date());

    // 6. Show success notification
    toast.success('Project saved successfully');

    // 7. Reset auto-save timer
    resetAutoSaveTimer();

  } catch (error) {
    console.error('Manual save failed:', error);
    toast.error('Failed to save project. Please try again.');
  } finally {
    setIsSaving(false);
  }
};

// Keyboard shortcut handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault(); // Prevent browser save dialog
      handleSave();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleSave]);
```

### Performance Considerations

**Typical Save Times** (for reference):
- **Small project** (< 50 entities): 50-100ms
- **Medium project** (50-200 entities): 100-300ms
- **Large project** (200-1000 entities): 300-1000ms
- **Very large project** (1000+ entities): 1-3 seconds

**Optimization Strategies**:
1. **Debounce rapid saves**: 300ms debounce on Ctrl+S
2. **Background serialization**: Use Web Worker for JSON.stringify (large files)
3. **Incremental backup**: Only backup if file changed since last backup
4. **Compression**: Optionally compress JSON (gzip) for files > 1MB

### File Size Expectations

| Entity Count | Typical File Size | Compressed Size |
|--------------|-------------------|-----------------|
| 10 entities  | 5-10 KB          | 2-3 KB          |
| 50 entities  | 25-50 KB         | 8-15 KB         |
| 200 entities | 100-200 KB       | 30-60 KB        |
| 1000 entities| 500KB-1MB        | 150-300 KB      |

### Accessibility

- Save button has `aria-label="Save project"`
- Loading state announced: `aria-busy="true"` and `aria-label="Saving project"`
- Success toast announced to screen readers
- Error messages have `role="alert"`
- Keyboard shortcut works in all contexts (no focus traps)

### Future Enhancements

- **Save As**: Allow saving to different location/name
- **Version History**: Keep last 10 saves with timestamps
- **Cloud Save**: Sync to cloud storage (Dropbox, Google Drive)
- **Compression**: Automatic gzip for files > 500KB
- **Conflict Resolution**: Detect external file changes before save
- **Quick Save Mode**: Skip backup for faster saves (user preference)
