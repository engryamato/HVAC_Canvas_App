# [UJ-PM-006] Duplicate Project

## Overview

This user journey covers creating an exact copy of an existing project from the dashboard, useful for creating project variations, templates, or backups. Similar to Save As but initiated from the dashboard instead of within the canvas editor.

## PRD References

- **FR-PM-006**: User shall be able to duplicate projects from dashboard
- **US-PM-006**: As a designer, I want to duplicate projects so that I can create variations without starting from scratch
- **AC-PM-006-001**: Duplicate action available from project card menu
- **AC-PM-006-002**: Duplicate creates new project with " - Copy" suffix
- **AC-PM-006-003**: New project has unique UUID
- **AC-PM-006-004**: All entities and settings copied
- **AC-PM-006-005**: Original project remains unchanged

## Prerequisites

- User is on Dashboard page (`/dashboard`)
- At least one project exists
- Project to duplicate is not corrupted
- File system has sufficient space

## User Journey Steps

### Step 1: Initiate Duplicate Action

**User Action**: Right-click project card → "Duplicate" OR click overflow menu (•••) → "Duplicate"

**Expected Result**:
- Duplicate operation begins immediately (no confirmation dialog for speed)
- Loading indicator on project card: "Duplicating..."
- Project card becomes semi-transparent
- Other projects remain interactive

**Validation Method**: E2E test
```typescript
await page.click('[aria-label="Project menu Office Building HVAC"]');
await page.click('button:has-text("Duplicate")');

await expect(page.locator('.project-card')).toContainText('Duplicating...');
```

---

### Step 2: Load Source Project Data

**User Action**: (Automatic)

**Expected Result**:
- System loads source project file from disk
- File path resolved: `/{projectId}.sws`
- File read and parsed (JSON)
- Schema validation performed
- All project data loaded:
  - Project metadata
  - All entities (rooms, ducts, equipment, notes, fittings)
  - Viewport state
  - Canvas settings
- Thumbnail loaded if exists

**Validation Method**: Integration test
```typescript
it('loads source project data for duplication', async () => {
  const sourceProject = mockProject;
  const projectData = await loadProject(sourceProject.id);

  expect(projectData.success).toBe(true);
  expect(projectData.data.entities.allIds).toHaveLength(12);
});
```

---

### Step 3: Create Duplicate Project

**User Action**: (Automatic)

**Expected Result**:
- New project created with:
  - **New UUID**: `crypto.randomUUID()`
  - **New name**: "Office Building HVAC - Copy"
  - **New timestamps**: createdAt and modifiedAt set to now
  - **Copied metadata**: projectNumber, clientName, location preserved
  - **Entity copy**: All entities deep-cloned (same IDs or new IDs)
  - **Settings copy**: All canvas settings preserved

```typescript
const duplicateProject: Project = {
  id: crypto.randomUUID(),
  name: `${sourceProject.name} - Copy`,
  projectNumber: sourceProject.projectNumber,
  clientName: sourceProject.clientName,
  location: sourceProject.location,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  entityCount: sourceProject.entityCount,
  thumbnailUrl: null,  // Will regenerate
  isArchived: false    // Never archive duplicates
};

const duplicateFile: ProjectFile = {
  schemaVersion: sourceData.schemaVersion,
  projectId: duplicateProject.id,
  projectMetadata: duplicateProject,
  entities: sourceData.entities,  // Deep clone
  viewportState: sourceData.viewportState,
  settings: sourceData.settings
};
```

**Validation Method**: Unit test
```typescript
it('creates duplicate with unique ID and modified name', () => {
  const source = mockProject;
  const duplicate = createDuplicate(source);

  expect(duplicate.id).not.toBe(source.id);
  expect(duplicate.name).toBe(`${source.name} - Copy`);
  expect(duplicate.createdAt).not.toBe(source.createdAt);
});
```

---

### Step 4: Save Duplicate to Disk

**User Action**: (Automatic)

**Expected Result**:
- Duplicate project serialized to JSON
- File written to disk: `/{newProjectId}.sws`
- File saved in same directory as original
- No backup created (new file)
- Write success verified
- Thumbnail copied if source has one (optional)

**Validation Method**: Integration test
```typescript
it('saves duplicate project to disk', async () => {
  const duplicate = await duplicateProject(mockProject.id);

  const filePath = await resolveProjectPath(duplicate.id);
  const fileExists = await invoke('file_exists', { path: filePath });

  expect(fileExists).toBe(true);

  const fileContent = await readFile(filePath);
  const projectData = JSON.parse(fileContent);
  expect(projectData.projectId).toBe(duplicate.id);
});
```

---

### Step 5: Add to Project List and Show Success

**User Action**: (Automatic)

**Expected Result**:
- Duplicate project added to project list store
- New project card appears in dashboard
- Card animates in (slide or fade effect)
- Positioned next to original project
- Original project unchanged
- Success toast: "Project duplicated successfully"
- Toast includes "Open" button to open duplicate
- Project count updates: "5 projects" → "6 projects"
- Loading indicator removed

**Validation Method**: E2E test
```typescript
await page.click('[aria-label="Duplicate project Office Building HVAC"]');

await waitFor(() => {
  expect(page.locator('.project-card:has-text("Office Building HVAC - Copy")')).toBeVisible();
  expect(page.locator('.toast-success')).toContainText('duplicated');
});

// Verify count
const projectCards = page.locator('.project-card');
await expect(projectCards).toHaveCount(6);
```

---

## Edge Cases

### 1. Duplicate Project with Existing " - Copy" Name

**User Action**: Duplicate a project named "Office Building HVAC - Copy"

**Expected Behavior**:
- Smart naming: "Office Building HVAC - Copy 2"
- If "Copy 2" exists → "Copy 3", etc.
- Detection logic:
  - Check for pattern: ` - Copy( N)?$`
  - Increment highest N found
  - Max iterations: 100 (prevents infinite loop)

**Test**:
```typescript
it('handles duplicate naming intelligently', () => {
  const existing = ['Project - Copy', 'Project - Copy 2', 'Project - Copy 3'];

  const newName = generateDuplicateName('Project', existing);

  expect(newName).toBe('Project - Copy 4');
});
```

---

### 2. Duplicate Very Large Project (1000+ Entities)

**User Action**: Duplicate project with 1500 entities

**Expected Behavior**:
- Operation takes 2-5 seconds
- Progress indicator shows percentage:
  - "Duplicating... 25%"
  - "Duplicating... 50%"
  - "Duplicating... 75%"
  - "Duplicating... Complete"
- Background operation (doesn't block UI)
- User can interact with other projects during duplication
- Success toast when complete

**Test**:
```typescript
it('handles large project duplication efficiently', async () => {
  const largeProject = createMockProject({ entityCount: 1500 });

  const startTime = performance.now();
  const duplicate = await duplicateProject(largeProject.id);
  const duration = performance.now() - startTime;

  expect(duration).toBeLessThan(5000); // Under 5 seconds
  expect(duplicate.entityCount).toBe(1500);
});
```

---

### 3. Duplicate Archived Project

**User Action**: Switch to Archived tab, duplicate an archived project

**Expected Behavior**:
- Duplicate created successfully
- New project is NOT archived (active by default)
- New project appears in Active tab
- Original remains in Archived tab
- Toast: "Project duplicated and added to active list"

---

### 4. Duplicate While Original Is Open

**User Action**: Duplicate project that's currently open in canvas editor

**Expected Behavior**:
- Duplication proceeds normally
- No conflict (different UUIDs)
- Open project remains unchanged
- Duplicate NOT auto-opened
- User can open duplicate manually from dashboard

---

### 5. Rapid Multiple Duplications

**User Action**: Duplicate same project 5 times quickly

**Expected Behavior**:
- All 5 duplicates created successfully
- Names: "Project - Copy", "Project - Copy 2", ..., "Project - Copy 5"
- Operations queued (run sequentially to prevent conflicts)
- Loading indicators on each operation
- Toast for each completion (or single toast: "5 projects duplicated")

---

## Error Scenarios

### 1. Source Project File Not Found

**Scenario**: Project file was deleted externally

**Expected Handling**:
- File read fails with "not found" error
- Error toast: "Cannot duplicate project. Source file not found."
- Project card shows error state
- Offer to remove project from list
- No duplicate created

**Test**:
```typescript
it('handles missing source file gracefully', async () => {
  vi.mocked(loadProject).mockRejectedValueOnce(new Error('File not found'));

  await expect(duplicateProject(mockProject.id)).rejects.toThrow();

  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Source file not found'));
});
```

---

### 2. Disk Full During Duplication

**Scenario**: Insufficient disk space for duplicate file

**Expected Handling**:
- File write fails
- Error toast: "Cannot duplicate project. Insufficient disk space."
- No partial file left on disk (cleanup)
- Original project unchanged
- Project not added to list

---

### 3. Corrupted Source Data

**Scenario**: Source project has invalid entity data

**Expected Handling**:
- Schema validation fails during load
- Warning dialog:
  - "Source project contains invalid data."
  - "Duplicate may be incomplete or corrupted."
  - "Continue anyway?" (Yes/No)
- If Yes → Create duplicate with warning flag
- If No → Cancel duplication

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Duplicate Selected Project | `Ctrl/Cmd + D` (when project card focused) |

---

## Related Elements

- [ProjectCard](../../elements/01-components/dashboard/ProjectCard.md) - Duplicate button
- [projectListStore](../../elements/02-stores/projectListStore.md) - Project list management
- [ProjectIO](../../elements/10-persistence/ProjectIO.md) - File operations
- [DashboardPage](../../elements/12-pages/DashboardPage.md) - Parent page
- [Toast](../../elements/01-components/ui/Toast.md) - Notifications

---

## Test Implementation

### Unit Tests
- `src/__tests__/utils/duplicateProject.test.ts`
  - Name generation
  - UUID uniqueness
  - Metadata copying

### Integration Tests
- `src/__tests__/integration/project-duplication.test.ts`
  - Complete duplication flow
  - File I/O
  - Store updates
  - Error handling

### E2E Tests
- `e2e/project-management/duplicate-project.spec.ts`
  - Dashboard duplication
  - Multiple duplicates
  - Large projects
  - Error scenarios

---

## Notes

### Implementation Details

```typescript
// projectService.ts
export async function duplicateProject(sourceProjectId: string): Promise<Project> {
  try {
    // 1. Load source project
    const sourceData = await loadProject(sourceProjectId);
    if (!sourceData.success) {
      throw new Error('Cannot load source project');
    }

    // 2. Generate unique name
    const existingProjects = useProjectListStore.getState().projects;
    const newName = generateUniqueName(sourceData.data.projectMetadata.name, existingProjects);

    // 3. Create duplicate project
    const duplicateId = crypto.randomUUID();
    const duplicateMetadata: Project = {
      id: duplicateId,
      name: newName,
      projectNumber: sourceData.data.projectMetadata.projectNumber,
      clientName: sourceData.data.projectMetadata.clientName,
      location: sourceData.data.projectMetadata.location,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      entityCount: sourceData.data.entities.allIds.length,
      thumbnailUrl: null,
      isArchived: false
    };

    // 4. Create duplicate file
    const duplicateFile: ProjectFile = {
      schemaVersion: sourceData.data.schemaVersion,
      projectId: duplicateId,
      projectMetadata: duplicateMetadata,
      entities: JSON.parse(JSON.stringify(sourceData.data.entities)), // Deep clone
      viewportState: { ...sourceData.data.viewportState },
      settings: { ...sourceData.data.settings }
    };

    // 5. Save to disk
    const filePath = await resolveProjectPath(duplicateId);
    const saveResult = await saveProject(duplicateFile, filePath);

    if (!saveResult.success) {
      throw new Error(saveResult.error);
    }

    // 6. Add to project list
    useProjectListStore.getState().addProject(duplicateMetadata);

    // 7. Copy thumbnail if exists
    if (sourceData.data.projectMetadata.thumbnailUrl) {
      await copyThumbnail(sourceProjectId, duplicateId);
    }

    return duplicateMetadata;

  } catch (error) {
    console.error('Duplication failed:', error);
    throw error;
  }
}

function generateUniqueName(baseName: string, existingProjects: Project[]): string {
  const existingNames = existingProjects.map(p => p.name);

  // Check if base name already has " - Copy" suffix
  const copyMatch = baseName.match(/^(.*) - Copy( \d+)?$/);
  const cleanName = copyMatch ? copyMatch[1] : baseName;

  // Find highest copy number
  let maxCopyNumber = 0;
  const pattern = new RegExp(`^${escapeRegex(cleanName)} - Copy( (\\d+))?$`);

  existingNames.forEach(name => {
    const match = name.match(pattern);
    if (match) {
      const num = match[2] ? parseInt(match[2], 10) : 1;
      maxCopyNumber = Math.max(maxCopyNumber, num);
    }
  });

  // Generate new name
  const newNumber = maxCopyNumber + 1;
  return newNumber === 1
    ? `${cleanName} - Copy`
    : `${cleanName} - Copy ${newNumber}`;
}
```

### Duplicate vs Save As

**Duplicate** (Dashboard):
- Initiated from dashboard
- Source project not opened
- Faster operation (no canvas state)
- Name automatically generated
- Duplicate stays on dashboard

**Save As** (Canvas):
- Initiated from canvas editor
- Current project is open
- Includes current viewport/zoom
- User chooses name and location
- Option to open new copy

### Performance Considerations

**Typical Duplication Times**:
- Small project (< 50 entities): 200-500ms
- Medium project (50-200 entities): 500ms-1s
- Large project (200-1000 entities): 1-3s
- Very large project (1000+ entities): 3-5s

**Optimization**:
- Background threading for large projects
- Incremental progress updates
- Lazy thumbnail copying (after main file)

### Accessibility

- Duplicate action keyboard accessible
- Progress announced to screen readers
- Success confirmation announced
- Error messages have proper roles
- Focus management after completion

### Future Enhancements

- **Template Creation**: Save duplicate as reusable template
- **Selective Duplication**: Choose which entities to include
- **Cross-Project Copying**: Copy entities between projects
- **Batch Duplication**: Duplicate multiple projects at once
- **Smart Defaults**: Pre-fill common changes (e.g., increment project number)
- **Duplication History**: Track which projects were duplicated from which
