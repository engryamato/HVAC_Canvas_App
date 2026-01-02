# [UJ-PM-002] Open Existing Project

## Overview

This user journey covers the complete workflow for opening an existing HVAC design project from the dashboard, including project selection, file loading, validation, state hydration, and navigation to the canvas editor.

## PRD References

- **FR-PM-002**: User shall be able to open existing projects from the dashboard
- **US-PM-002**: As a designer, I want to open my saved projects so that I can continue working on them
- **AC-PM-002-001**: Project list displays all non-archived projects sorted by modification date
- **AC-PM-002-002**: Double-clicking a project opens it in the canvas editor
- **AC-PM-002-003**: Failed project loads show error message and remain on dashboard
- **AC-PM-002-004**: Recently modified projects appear at the top of the list

## Prerequisites

- Application is launched and running
- User is on the Dashboard page (`/dashboard`)
- At least one project exists in the project list
- Project file is accessible and not corrupted

## User Journey Steps

### Step 1: View Project List

**User Action**: View dashboard with existing projects

**Expected Result**:
- Dashboard displays project list with cards showing:
  - Project name
  - Thumbnail preview (if available)
  - Client name (if provided)
  - Last modified date (relative time: "2 hours ago")
  - Entity count (e.g., "12 entities")
  - Project number badge (if provided)
- Projects sorted by `modifiedAt` (most recent first)
- Hover effects on project cards
- "Open" button visible on each card

**Validation Method**: E2E test
```typescript
await expect(page.locator('.project-card')).toHaveCount(3);
await expect(page.locator('.project-card').first()).toContainText('Office Building HVAC');
await expect(page.locator('.project-card').first()).toContainText('Modified 2 hours ago');
```

---

### Step 2: Select Project to Open

**User Action**: Double-click on project card OR click "Open" button

**Expected Result**:
- Project card shows loading state:
  - Overlay with spinner appears
  - Card becomes semi-transparent
  - "Opening..." text displays
- Other project cards remain interactive
- Navigation begins

**Validation Method**: Unit test
```typescript
it('shows loading state when opening project', async () => {
  const { getByTestId } = render(<ProjectCard project={mockProject} />);

  fireEvent.doubleClick(getByTestId('project-card'));

  await waitFor(() => {
    expect(getByTestId('loading-overlay')).toBeVisible();
    expect(getByText('Opening...')).toBeVisible();
  });
});
```

---

### Step 3: Load Project File

**User Action**: (Automatic - triggered by Step 2)

**Expected Result**:
- System performs the following operations:
  1. Resolves project file path from project ID
  2. Checks file exists and is readable
  3. Reads `.sws` file from disk (Tauri fs API)
  4. Parses JSON content
  5. Validates schema version
  6. Runs migrations if needed (e.g., v0.9 → v1.0)
  7. Validates all entity schemas
  8. Returns `LoadResult` object

**Validation Method**: Integration test
```typescript
it('loads and validates project file', async () => {
  const result = await loadProject('/path/to/project.sws');

  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
  expect(result.data.schemaVersion).toBe('1.0.0');
  expect(result.data.entities.allIds).toHaveLength(12);
  expect(result.data.projectMetadata.name).toBe('Office Building HVAC');
});
```

---

### Step 4: Hydrate Application State

**User Action**: (Automatic - triggered by Step 3)

**Expected Result**:
- State stores populated with loaded data:
  - **entityStore**: All entities (rooms, ducts, equipment, etc.)
  - **viewportStore**: Saved pan/zoom position
  - **projectStore**: Project metadata (name, client, dates)
  - **selectionStore**: Cleared (no selection on open)
  - **historyStore**: Cleared (new undo/redo stack)
- Entity calculations re-run for all entities
- Canvas ready for rendering

**Validation Method**: Integration test
```typescript
it('hydrates stores with loaded project data', async () => {
  const projectData = await loadProject('/path/to/project.sws');

  // Simulate hydration
  useEntityStore.getState().hydrate(projectData.data.entities);
  useViewportStore.getState().setPan(projectData.data.viewportState.panX, projectData.data.viewportState.panY);
  useViewportStore.getState().setZoom(projectData.data.viewportState.zoom);
  useProjectStore.getState().setActiveProject(projectData.data.projectMetadata);

  // Verify state
  expect(useEntityStore.getState().allIds).toHaveLength(12);
  expect(useViewportStore.getState().zoom).toBe(1.0);
  expect(useProjectStore.getState().activeProject.name).toBe('Office Building HVAC');
  expect(useSelectionStore.getState().selectedIds).toHaveLength(0);
});
```

---

### Step 5: Navigate to Canvas Editor

**User Action**: (Automatic - triggered by Step 4)

**Expected Result**:
- Browser navigates to `/canvas/{projectId}`
- Canvas editor page loads with:
  - **Left Sidebar**: Project details populated
  - **Canvas**: All entities rendered at saved viewport position
  - **Right Sidebar**: No selection (inspector panel empty state)
  - **Toolbar**: Select tool active by default
  - **Status Bar**: Shows entity count (e.g., "Entities: 12")
  - **Zoom Level**: Restored from saved state (e.g., 100%)
- Success toast: "Project 'Office Building HVAC' opened"
- Auto-save timer starts (5-minute interval)

**Validation Method**: E2E test
```typescript
await page.dblclick('.project-card:has-text("Office Building HVAC")');

await expect(page).toHaveURL(/\/canvas\/[a-f0-9-]{36}/);
await expect(page.locator('h1')).toHaveText('Office Building HVAC');
await expect(page.locator('.status-bar')).toContainText('Entities: 12');
await expect(page.locator('.toast-success')).toHaveText(/Project.*opened/);

// Verify canvas rendered
const canvas = page.locator('canvas');
await expect(canvas).toBeVisible();
```

---

## Edge Cases

### 1. Project File Missing

**User Action**: Attempt to open project whose `.sws` file was deleted

**Expected Behavior**:
- Loading state shows briefly
- Error toast: "Project file not found. It may have been moved or deleted."
- Project card shows error state (red border)
- Option to "Remove from List" or "Locate File"
- Dashboard remains visible (no navigation)

**Test**:
```typescript
it('handles missing project file gracefully', async () => {
  // Mock file system error
  vi.mocked(invoke).mockRejectedValueOnce(new Error('File not found'));

  const { getByText } = render(<DashboardPage />);

  fireEvent.dblclick(getByText('Missing Project'));

  await waitFor(() => {
    expect(getByText(/Project file not found/)).toBeVisible();
  });

  expect(window.location.pathname).toBe('/dashboard'); // Still on dashboard
});
```

---

### 2. Corrupted Project File

**User Action**: Attempt to open project with invalid JSON

**Expected Behavior**:
- Loading state shows
- File read succeeds but JSON.parse() fails
- Error toast: "Project file is corrupted. Cannot open project."
- Offer to restore from backup (`.sws.bak` if exists)
- Log error details to console for debugging

**Test**:
```typescript
it('detects and reports corrupted files', async () => {
  const corruptedContent = '{ "name": "Invalid JSON';

  vi.mocked(invoke).mockResolvedValueOnce(corruptedContent);

  const result = await loadProject('/path/to/corrupted.sws');

  expect(result.success).toBe(false);
  expect(result.error).toContain('corrupted');
});
```

---

### 3. Schema Version Mismatch

**User Action**: Open project created with older app version (e.g., v0.8)

**Expected Behavior**:
- File loads successfully
- Migration system detects old schema version
- Automatic migration applied:
  - v0.8 → v0.9: Add `zIndex` to entities
  - v0.9 → v1.0: Add `settings` object
- Migration log saved to console
- Project opens normally
- Auto-save creates new `.sws` file with updated schema
- Original file backed up as `.sws.v0.8.bak`

**Test**:
```typescript
it('migrates old schema versions automatically', async () => {
  const oldProject = {
    schemaVersion: '0.8',
    // ... v0.8 structure
  };

  const result = await loadProject('/path/to/old.sws');

  expect(result.success).toBe(true);
  expect(result.data.schemaVersion).toBe('1.0.0');
  expect(result.data.entities.byId['room-1'].zIndex).toBeDefined(); // Added in v0.9
  expect(result.data.settings).toBeDefined(); // Added in v1.0
});
```

---

### 4. Large Project File (1000+ Entities)

**User Action**: Open project with 1500 entities

**Expected Behavior**:
- Loading takes 2-5 seconds (acceptable)
- Progress indicator shows during load
- File loads in chunks to prevent UI freeze
- Entities hydrated in batches (100 at a time)
- Canvas renders with virtualization (only visible entities)
- Performance warning if entity count > 1000:
  - Toast: "Large project loaded (1500 entities). Performance may vary."
- All functionality works normally

**Test**:
```typescript
it('handles large projects efficiently', async () => {
  const largeProject = createMockProject({ entityCount: 1500 });

  const startTime = performance.now();
  const result = await loadProject('/path/to/large.sws');
  const loadTime = performance.now() - startTime;

  expect(result.success).toBe(true);
  expect(loadTime).toBeLessThan(5000); // Under 5 seconds
  expect(result.data.entities.allIds).toHaveLength(1500);
});
```

---

### 5. Concurrent Open Attempts

**User Action**: Double-click project twice rapidly

**Expected Behavior**:
- First click starts loading
- Second click is ignored (debounced)
- Only one navigation occurs
- No duplicate file reads
- No state corruption

**Test**:
```typescript
it('prevents concurrent open attempts', async () => {
  const { getByTestId } = render(<ProjectCard project={mockProject} />);

  const card = getByTestId('project-card');

  // Rapid double-clicks
  fireEvent.dblclick(card);
  fireEvent.dblclick(card);
  fireEvent.dblclick(card);

  await waitFor(() => {
    expect(invoke).toHaveBeenCalledTimes(1); // Only one file read
  });
});
```

---

## Error Scenarios

### 1. File System Permission Error

**Scenario**: User lacks read permissions for project file

**Expected Handling**:
- Tauri `invoke` returns permission error
- Error toast: "Cannot read project file. Check file permissions."
- Desktop app: Prompt to grant permissions
- Project remains in list (not removed)
- Suggest running app with elevated permissions

---

### 2. Out of Memory (Very Large File)

**Scenario**: Project file is 500MB+ (extremely rare)

**Expected Handling**:
- Attempt to load file
- JavaScript heap limit exceeded
- Error toast: "Project file is too large to open."
- Suggest optimizing project (remove unused entities)
- Log memory usage to console
- Recommend desktop app (more memory available)

---

### 3. Entity Validation Failure

**Scenario**: Loaded entities fail Zod schema validation

**Expected Handling**:
- File loads and parses successfully
- Entity validation detects invalid data:
  - Room with negative width
  - Duct with missing required fields
- Error toast: "Project contains invalid data. Some entities may not display correctly."
- Invalid entities logged to console
- Valid entities load normally
- Option to "Skip Invalid Entities" or "Cancel Load"

**Test**:
```typescript
it('handles entity validation failures', async () => {
  const projectWithInvalidEntity = {
    schemaVersion: '1.0.0',
    entities: {
      byId: {
        'room-1': { id: 'room-1', type: 'room', props: { width: -100 } } // Invalid
      },
      allIds: ['room-1']
    }
  };

  const result = await loadProject('/path/to/invalid.sws');

  expect(result.success).toBe(false);
  expect(result.error).toContain('validation');
  expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid entity'));
});
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Selected Project | `Enter` (when project card focused) |
| Quick Search Projects | `Ctrl/Cmd + F` (on dashboard) |
| Open Recent Project | `Ctrl/Cmd + Shift + O` |
| Refresh Project List | `F5` |

---

## Related Elements

- [DashboardPage](../../elements/12-pages/DashboardPage.md) - Parent page
- [ProjectCard](../../elements/01-components/dashboard/ProjectCard.md) - Project list item
- [projectListStore](../../elements/02-stores/projectListStore.md) - Project list state
- [ProjectIO](../../elements/10-persistence/ProjectIO.md) - File loading logic
- [entityStore](../../elements/02-stores/entityStore.md) - Entity state hydration
- [viewportStore](../../elements/02-stores/viewportStore.md) - Viewport state restoration
- [CanvasEditorPage](../../elements/12-pages/CanvasEditorPage.md) - Navigation target
- [Toast](../../elements/01-components/ui/Toast.md) - Notification system

---

## Test Implementation

### Unit Tests
- `src/__tests__/components/ProjectCard.test.tsx`
  - Double-click handling
  - Loading states
  - Error display

### Integration Tests
- `src/__tests__/integration/project-loading.test.ts`
  - File I/O integration
  - State hydration
  - Schema migration
  - Error handling

### E2E Tests
- `e2e/project-management/open-project.spec.ts`
  - Complete open flow
  - Success path
  - Error scenarios
  - Large projects
  - Concurrent attempts

---

## Notes

### Implementation Details

```typescript
// DashboardPage.tsx
const handleOpenProject = async (projectId: string) => {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  setLoadingProjectId(projectId);

  try {
    // 1. Load file from disk
    const filePath = await resolveProjectPath(projectId);
    const result = await loadProject(filePath);

    if (!result.success) {
      throw new Error(result.error);
    }

    // 2. Hydrate stores
    entityStore.getState().hydrate(result.data.entities);
    viewportStore.getState().setPan(result.data.viewportState.panX, result.data.viewportState.panY);
    viewportStore.getState().setZoom(result.data.viewportState.zoom);
    projectStore.getState().setActiveProject(result.data.projectMetadata);
    selectionStore.getState().clear();
    historyStore.getState().clear();

    // 3. Show success toast
    toast.success(`Project "${project.name}" opened`);

    // 4. Navigate to canvas
    router.push(`/canvas/${projectId}`);

  } catch (error) {
    console.error('Failed to open project:', error);
    toast.error('Failed to open project. The file may be corrupted or inaccessible.');
  } finally {
    setLoadingProjectId(null);
  }
};
```

### Performance Considerations

- **File Read**: 10-50ms for typical projects (50-200 entities)
- **JSON Parse**: 5-20ms for typical file sizes (100KB-1MB)
- **Schema Validation**: 10-30ms for all entities
- **State Hydration**: 5-15ms (synchronous Zustand updates)
- **Navigation**: 50-100ms (Next.js client-side routing)

**Expected Total Time**: 100-250ms for typical projects

### Large Project Optimization

For projects with 500+ entities:
- Use Web Workers for JSON parsing (offload main thread)
- Batch entity hydration (100 entities per frame)
- Defer non-critical calculations
- Show progress bar for loads > 1 second

### Accessibility

- Project cards are keyboard navigable (`Tab` to focus)
- `Enter` key opens focused project
- Screen reader announces "Opening project [name]"
- Focus returns to dashboard if load fails
- Error messages are announced to screen readers

### Future Enhancements

- **Cloud Sync**: Open projects from cloud storage (Dropbox, Google Drive)
- **Recent Projects**: Dedicated "Recent" tab with last 10 opened
- **Project Preview**: Hover to see larger thumbnail + entity list
- **Quick Open Dialog**: `Cmd+O` to fuzzy search all projects
- **Project Templates**: Open new project based on existing one
