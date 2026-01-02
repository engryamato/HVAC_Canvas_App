# [UJ-FM-004] Load Project from File

## Overview

This user journey covers opening a project file (.sws) from the file system using the desktop app's file picker, including file selection, validation, parsing, state hydration, and error recovery.

## PRD References

- **FR-FM-004**: User shall be able to load projects from .sws files
- **US-FM-004**: As a designer, I want to open project files from my file system so that I can work on projects shared by others
- **AC-FM-004-001**: File → Open shows native file picker
- **AC-FM-004-002**: Only .sws files are selectable
- **AC-FM-004-003**: File validation occurs before loading
- **AC-FM-004-004**: Invalid files show descriptive error messages
- **AC-FM-004-005**: Successfully loaded project opens in canvas editor

## Prerequisites

- Desktop application is running
- User has read permissions to file system
- At least one .sws file exists on disk
- Dashboard or canvas editor is currently displayed

## User Journey Steps

### Step 1: Initiate File Open

**User Action**: Click File menu → "Open from File..." OR press `Ctrl/Cmd+O`

**Expected Result**:
- Native file picker dialog opens
- Dialog title: "Open Project"
- File type filter: "SizeWise Projects (*.sws)"
- Default location: User's Documents/Projects folder
- Recent files shown in sidebar (OS dependent)
- "Open" button (disabled until file selected)
- "Cancel" button

**Validation Method**: E2E test
```typescript
await page.click('button:has-text("File")');
await page.click('button:has-text("Open from File")');

await waitFor(() => {
  expect(invoke).toHaveBeenCalledWith('open_file_dialog', {
    title: 'Open Project',
    filters: [{ name: 'SizeWise Projects', extensions: ['sws'] }]
  });
});
```

---

### Step 2: Select File

**User Action**: Navigate to `/Users/john/Projects/`, select "ClientOffice.sws", click "Open"

**Expected Result**:
- File path captured: `/Users/john/Projects/ClientOffice.sws`
- Dialog closes
- Loading indicator appears: "Opening project..."
- File read operation begins
- Canvas shows loading skeleton/spinner

**Validation Method**: Integration test
```typescript
it('reads selected file from disk', async () => {
  const filePath = '/path/to/project.sws';
  vi.mocked(invoke).mockResolvedValueOnce(filePath);

  const result = await openProjectFile();

  expect(invoke).toHaveBeenCalledWith('read_file', { path: filePath });
});
```

---

### Step 3: Validate and Parse File

**User Action**: (Automatic)

**Expected Result**:
- File contents read as UTF-8 text
- JSON parsing attempted
- Schema validation performed:
  - Check `schemaVersion` field exists
  - Validate against `ProjectFileSchema`
  - Check all required fields present
  - Validate entity data structures
- If validation passes:
  - Extract project metadata
  - Extract entities
  - Extract viewport state
  - Extract settings
- If validation fails:
  - Specific error identified (missing field, wrong type, etc.)
  - Error message prepared for user

**Validation Method**: Unit test
```typescript
it('validates project file schema', () => {
  const validFile = {
    schemaVersion: '1.0.0',
    projectId: 'uuid',
    projectMetadata: { /* ... */ },
    entities: { byId: {}, allIds: [] },
    viewportState: { panX: 0, panY: 0, zoom: 1 },
    settings: { unitSystem: 'imperial' }
  };

  const result = ProjectFileSchema.safeParse(validFile);

  expect(result.success).toBe(true);
});
```

---

### Step 4: Check Schema Version and Migrate

**User Action**: (Automatic)

**Expected Result**:
- Schema version compared to current: `1.0.0`
- If versions match → proceed to load
- If file version older (e.g., `0.9.0`):
  - Migration system activated
  - Automatic upgrade applied:
    - v0.9 → v1.0: Add `settings` object
    - v0.8 → v0.9: Add `zIndex` to entities
  - Migration logged: "Migrated project from v0.9 to v1.0"
  - Toast notification: "Project updated to latest format"
- If file version newer (e.g., `2.0.0`):
  - Error: "This project requires a newer version of the app"
  - Suggest updating application
  - Offer to download update

**Validation Method**: Integration test
```typescript
it('migrates old schema versions automatically', async () => {
  const oldProject = {
    schemaVersion: '0.9.0',
    // ... v0.9 structure
  };

  const migrated = await loadAndMigrateProject(oldProject);

  expect(migrated.schemaVersion).toBe('1.0.0');
  expect(migrated.settings).toBeDefined(); // Added in v1.0
});
```

---

### Step 5: Hydrate Application State and Navigate

**User Action**: (Automatic)

**Expected Result**:
- Check if current project has unsaved changes:
  - If yes → Show "Save changes?" dialog first
  - If no → Proceed directly
- Clear existing state stores:
  - `entityStore.clear()`
  - `selectionStore.clear()`
  - `historyStore.clear()`
- Hydrate with loaded data:
  - `entityStore.hydrate(entities)`
  - `viewportStore.setPan(panX, panY)`
  - `viewportStore.setZoom(zoom)`
  - `projectStore.setActiveProject(metadata)`
  - `canvasStore.setSettings(settings)`
- Add to recent files list
- Navigate to canvas editor: `/canvas/{projectId}`
- Canvas renders all entities
- Success toast: "Project 'ClientOffice' opened"
- Loading indicator removed

**Validation Method**: E2E test
```typescript
const filePath = await createMockProjectFile({
  name: 'Test Project',
  entities: { byId: { 'room-1': mockRoom }, allIds: ['room-1'] }
});

await openProjectFromFile(filePath);

await expect(page).toHaveURL(/\/canvas\//);
await expect(page.locator('h1')).toHaveText('Test Project');
await expect(page.locator('.entity-room')).toBeVisible();
await expect(page.locator('.toast-success')).toContainText('opened');
```

---

## Edge Cases

### 1. File Not Found

**User Action**: Select file, but it's deleted before read operation

**Expected Behavior**:
- File read fails with "not found" error
- Error dialog:
  - Title: "File Not Found"
  - Message: "The selected file no longer exists. It may have been moved or deleted."
  - "OK" button
- User returns to previous screen (dashboard or current project)
- No state changes

**Test**:
```typescript
it('handles file not found error', async () => {
  vi.mocked(invoke).mockRejectedValueOnce(new Error('File not found'));

  await expect(openProjectFile('/path/to/missing.sws')).rejects.toThrow();

  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('not found'));
});
```

---

### 2. Corrupted JSON

**User Action**: Open file with invalid JSON (syntax error)

**Expected Behavior**:
- JSON.parse() throws error
- Error dialog:
  - Title: "Invalid Project File"
  - Message: "This file is corrupted or not a valid SizeWise project."
  - Details: "JSON parsing failed at line 42"
  - "OK" button
- File not loaded
- Suggest checking file or restoring from backup

**Test**:
```typescript
it('handles corrupted JSON gracefully', async () => {
  const corruptedContent = '{ "name": invalid json }';
  vi.mocked(invoke).mockResolvedValueOnce(corruptedContent);

  await expect(loadProjectFile('/path/to/corrupt.sws')).rejects.toThrow();

  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('corrupted'));
});
```

---

### 3. Wrong File Type

**User Action**: Somehow select non-.sws file (e.g., .txt)

**Expected Behavior**:
- File picker should prevent this (filter)
- If bypassed, file validation fails
- Error: "Invalid file type. Please select a .sws file."
- User can retry with correct file

---

### 4. Very Large File (100+ MB)

**User Action**: Open project with thousands of entities (large file)

**Expected Behavior**:
- File read takes 2-5 seconds
- Progress indicator shows:
  - "Reading file... (35 MB / 100 MB)"
  - "Parsing data..."
  - "Loading entities... (500 / 2000)"
- Background processing (doesn't freeze UI)
- Incremental hydration (batch entities)
- Success after loading completes
- Warning toast: "Large project loaded. Performance may vary."

**Test**:
```typescript
it('handles large project files efficiently', async () => {
  const largeProject = createMockProjectFile({ entityCount: 2000 });

  const startTime = performance.now();
  await loadProjectFile(largeProject);
  const duration = performance.now() - startTime;

  expect(duration).toBeLessThan(10000); // Under 10 seconds
});
```

---

### 5. Load While Another Project Open

**User Action**: Open new file while already editing a project

**Expected Behavior**:
- Check for unsaved changes
- If unsaved → "Save changes before opening?" dialog:
  - "Save and Open" button
  - "Discard and Open" button
  - "Cancel" button
- If saved or discarded → Proceed with load
- Previous project state cleared completely
- New project loaded fresh

---

## Error Scenarios

### 1. Insufficient Memory

**Scenario**: Loading massive project exhausts available RAM

**Expected Handling**:
- Memory allocation fails during hydration
- Error caught: "Out of memory"
- Error dialog:
  - "Cannot open project. File is too large for available memory."
  - Suggestion: "Close other applications and try again."
- State rollback (if partially loaded)
- User remains on previous screen

**Test**:
```typescript
it('handles out of memory errors', async () => {
  vi.spyOn(entityStore, 'hydrate').mockImplementation(() => {
    throw new Error('Out of memory');
  });

  await expect(openProjectFile('/path/to/huge.sws')).rejects.toThrow();

  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('memory'));
});
```

---

### 2. Permission Denied

**Scenario**: User lacks read permissions for selected file

**Expected Handling**:
- File read fails with permission error
- Error dialog:
  - "Cannot read file. Permission denied."
  - Suggestion: "Check file permissions or contact your administrator."
- Desktop app: Offer to request elevated permissions
- User can retry or cancel

---

### 3. Entity Validation Failure

**Scenario**: File contains entities that fail schema validation

**Expected Handling**:
- Detect invalid entities during parsing
- Warning dialog:
  - "Project contains invalid data:"
  - List of issues: "Room 3: width must be positive"
  - Options:
    - "Skip Invalid Entities" - Load valid entities only
    - "Cancel" - Don't load project
- If Skip selected:
  - Load valid entities
  - Show warning badge in canvas
  - List invalid entities in console

**Test**:
```typescript
it('handles invalid entity data', async () => {
  const projectWithInvalidEntity = {
    schemaVersion: '1.0.0',
    entities: {
      byId: {
        'room-1': { type: 'room', props: { width: -100 } } // Invalid
      },
      allIds: ['room-1']
    }
  };

  const result = await loadProjectFile(projectWithInvalidEntity, { skipInvalid: true });

  expect(result.skippedEntities).toHaveLength(1);
  expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('invalid data'));
});
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open from File | `Ctrl/Cmd + O` |
| Open Recent (menu) | `Ctrl/Cmd + Shift + O` |

---

## Related Elements

- [ProjectIO](../../elements/10-persistence/ProjectIO.md) - File loading logic
- [ProjectFileSchema](../../elements/03-schemas/ProjectFileSchema.md) - Validation
- [entityStore](../../elements/02-stores/entityStore.md) - State hydration
- [projectStore](../../elements/02-stores/projectStore.md) - Project metadata
- [DashboardPage](../../elements/12-pages/DashboardPage.md) - File menu location
- [CanvasEditorPage](../../elements/12-pages/CanvasEditorPage.md) - Navigation target

---

## Test Implementation

### Unit Tests
- `src/__tests__/persistence/ProjectIO.test.ts`
  - File reading
  - JSON parsing
  - Schema validation
  - Migration logic

### Integration Tests
- `src/__tests__/integration/file-loading.test.ts`
  - Complete load workflow
  - State hydration
  - Error recovery
  - Migration testing

### E2E Tests
- `e2e/file-management/load-project.spec.ts`
  - File picker interaction
  - Success path
  - Error scenarios
  - Large files

---

## Notes

### Implementation Details

```typescript
// projectIO.ts
export async function openProjectFile(): Promise<void> {
  try {
    // 1. Show file picker
    const filePath = await invoke<string>('open_file_dialog', {
      title: 'Open Project',
      filters: [{ name: 'SizeWise Projects', extensions: ['sws'] }]
    });

    if (!filePath) {
      return; // User cancelled
    }

    // 2. Check for unsaved changes
    if (projectStore.getState().hasUnsavedChanges) {
      const shouldSave = await confirmSaveChanges();
      if (shouldSave === 'cancel') return;
      if (shouldSave === 'save') {
        await triggerManualSave();
      }
    }

    // 3. Show loading indicator
    setIsLoading(true);
    toast.info('Opening project...');

    // 4. Read file
    const fileContent = await invoke<string>('read_file', { path: filePath });

    // 5. Parse JSON
    const projectData = JSON.parse(fileContent);

    // 6. Validate schema
    const validationResult = ProjectFileSchema.safeParse(projectData);
    if (!validationResult.success) {
      throw new Error(`Invalid project file: ${validationResult.error.message}`);
    }

    // 7. Check and migrate schema version
    const migratedData = await migrateIfNeeded(validationResult.data);

    // 8. Clear existing state
    entityStore.getState().clear();
    selectionStore.getState().clear();
    historyStore.getState().clear();

    // 9. Hydrate stores
    entityStore.getState().hydrate(migratedData.entities);
    viewportStore.getState().setPan(migratedData.viewportState.panX, migratedData.viewportState.panY);
    viewportStore.getState().setZoom(migratedData.viewportState.zoom);
    projectStore.getState().setActiveProject(migratedData.projectMetadata);
    canvasStore.getState().setSettings(migratedData.settings);

    // 10. Add to recent files
    addRecentFile(filePath, migratedData.projectMetadata.name);

    // 11. Navigate to canvas
    router.push(`/canvas/${migratedData.projectId}`);

    // 12. Show success
    toast.success(`Project "${migratedData.projectMetadata.name}" opened`);

  } catch (error) {
    console.error('Failed to open project file:', error);

    if (error.message.includes('not found')) {
      toast.error('File not found. It may have been moved or deleted.');
    } else if (error.message.includes('JSON')) {
      toast.error('Invalid project file. The file may be corrupted.');
    } else if (error.message.includes('permission')) {
      toast.error('Cannot read file. Permission denied.');
    } else {
      toast.error(`Failed to open project: ${error.message}`);
    }
  } finally {
    setIsLoading(false);
  }
}

async function migrateIfNeeded(projectData: ProjectFile): Promise<ProjectFile> {
  const currentVersion = '1.0.0';

  if (projectData.schemaVersion === currentVersion) {
    return projectData;
  }

  console.log(`Migrating project from ${projectData.schemaVersion} to ${currentVersion}`);

  let migrated = { ...projectData };

  // Apply migrations in sequence
  if (migrated.schemaVersion === '0.8.0') {
    migrated = migrateV08ToV09(migrated);
  }
  if (migrated.schemaVersion === '0.9.0') {
    migrated = migrateV09ToV10(migrated);
  }

  toast.info(`Project updated from v${projectData.schemaVersion} to v${currentVersion}`);

  return migrated;
}
```

### File Format Validation

**Critical Checks**:
1. Valid JSON syntax
2. `schemaVersion` field exists
3. `projectId` is valid UUID
4. `projectMetadata` has required fields
5. `entities.byId` is object
6. `entities.allIds` is array
7. Entity IDs in `allIds` exist in `byId`
8. All entities pass type-specific schema validation

### Migration Strategy

**Version Migrations**:
- v0.8 → v0.9: Add `zIndex` to all entities (default: type-based)
- v0.9 → v1.0: Add `settings` object (default: imperial, 12" grid)
- v1.0 → v1.1: Add `siteConditions` to project metadata

**Backward Compatibility**: Files always upgraded to latest version on load

### Performance Considerations

**Typical Load Times**:
- Small project (< 50 entities): 100-300ms
- Medium project (50-200 entities): 300ms-1s
- Large project (200-1000 entities): 1-3s
- Very large project (1000+ entities): 3-10s

**Optimization**:
- Stream large files (don't load entirely in memory)
- Batch entity hydration (100 at a time)
- Progress updates every 10%
- Lazy calculation (calculate on demand, not during load)

### Accessibility

- File picker is native (OS accessible)
- Loading states announced to screen readers
- Error dialogs have proper roles
- Keyboard navigation throughout
- Focus management after load

### Future Enhancements

- **Drag-and-Drop**: Drag .sws file into app window to open
- **Double-Click**: Associate .sws files with app (OS registration)
- **Cloud Import**: Open from Google Drive/Dropbox
- **Project Preview**: Show thumbnail before opening
- **Batch Open**: Open multiple projects in tabs
- **Partial Load**: Load only metadata first, entities on demand
