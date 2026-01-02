# [UJ-PM-005] Archive Project

## Overview

This user journey covers archiving completed or inactive HVAC projects to declutter the active project list while preserving project files. Includes archive action, project list filtering, restoration capability, and archived project management.

## PRD References

- **FR-PM-005**: User shall be able to archive projects to hide from active list
- **US-PM-005**: As a designer, I want to archive old projects so that I can focus on active work
- **AC-PM-005-001**: Archive action available from project card menu
- **AC-PM-005-002**: Archived projects hidden from default view
- **AC-PM-005-003**: "Archived" tab shows archived projects
- **AC-PM-005-004**: Archived projects can be restored to active list
- **AC-PM-005-005**: Archive status persists in project metadata

## Prerequisites

- User is on Dashboard page (`/dashboard`)
- At least one project exists in active project list
- Project is not currently open in canvas editor

## User Journey Steps

### Step 1: Initiate Archive Action

**User Action**: Click "Archive" button (folder icon) on project card OR right-click project → "Archive"

**Expected Result**:
- Confirmation dialog appears (optional - can skip for simpler UX)
- Dialog content:
  - Title: "Archive Project?"
  - Message: "This project will be moved to the archived list."
  - Project name shown: "Office Building HVAC"
  - Note: "You can restore it anytime from the Archived tab."
- "Archive" button (primary action)
- "Cancel" button
- Alternative (no dialog): Immediate archive with undo toast

**Validation Method**: E2E test
```typescript
await page.click('[aria-label="Archive project Office Building HVAC"]');

await expect(page.locator('dialog h2')).toHaveText('Archive Project?');
await expect(page.locator('dialog')).toContainText('Office Building HVAC');
```

---

### Step 2: Confirm Archive

**User Action**: Click "Archive" button in confirmation dialog

**Expected Result**:
- Project metadata updated:
```typescript
const updatedProject = {
  ...project,
  isArchived: true,
  archivedAt: new Date().toISOString()
};
```
- Project immediately removed from active list view
- Smooth fade-out animation on card
- Active project count updates: "5 projects" → "4 projects"
- Success toast: "Project archived" with "Undo" button (10 seconds)
- Dialog closes
- Focus returns to project list

**Validation Method**: Integration test
```typescript
it('archives project and updates metadata', async () => {
  const { getByText } = render(<ArchiveDialog project={mockProject} onClose={mockClose} />);

  fireEvent.click(getByText('Archive'));

  await waitFor(() => {
    const updated = useProjectListStore.getState().projects.find(p => p.id === mockProject.id);
    expect(updated.isArchived).toBe(true);
    expect(updated.archivedAt).toBeDefined();
  });

  expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('archived'));
});
```

---

### Step 3: View Archived Projects

**User Action**: Click "Archived" tab in dashboard header

**Expected Result**:
- Tab switches from "Active" to "Archived"
- Project list updates to show only archived projects
- Archived projects displayed with:
  - Grayed-out appearance (opacity: 0.7)
  - "Archived" badge on each card
  - Archived date: "Archived 2 days ago"
  - "Restore" button (instead of "Archive")
  - "Delete" button still available
- Empty state if no archived projects:
  - Illustration of empty archive box
  - Message: "No archived projects"
  - "View Active Projects" link
- Tab count badge: "Archived (3)"

**Validation Method**: E2E test
```typescript
await page.click('button:has-text("Archived")');

await expect(page.locator('.project-card')).toHaveCount(3);
await expect(page.locator('.project-card').first()).toHaveClass(/archived/);
await expect(page.locator('.project-card').first()).toContainText('Archived');
```

---

### Step 4: Restore Archived Project

**User Action**: Click "Restore" button on archived project card

**Expected Result**:
- Confirmation dialog (optional):
  - Title: "Restore Project?"
  - Message: "This project will be moved back to the active list."
- On confirmation:
  - Project metadata updated:
```typescript
const restoredProject = {
  ...project,
  isArchived: false,
  archivedAt: null,
  modifiedAt: new Date().toISOString() // Update timestamp
};
```
  - Project removed from archived view
  - If viewing active tab, project appears there immediately
  - Success toast: "Project restored to active list"
  - Undo option available (10 seconds)

**Validation Method**: Integration test
```typescript
it('restores archived project to active list', async () => {
  const archivedProject = { ...mockProject, isArchived: true };
  const { getByText } = render(<ProjectCard project={archivedProject} />);

  fireEvent.click(getByText('Restore'));

  await waitFor(() => {
    const restored = useProjectListStore.getState().projects.find(p => p.id === archivedProject.id);
    expect(restored.isArchived).toBe(false);
    expect(restored.archivedAt).toBeNull();
  });
});
```

---

### Step 5: File System Persistence

**User Action**: (Automatic - triggered by archive/restore actions)

**Expected Result**:
- Project file updated on disk:
  - `.sws` file metadata section updated
  - `isArchived` flag set to `true` or `false`
  - `archivedAt` timestamp added or removed
- Auto-save triggered (if project was open)
- No separate "archived" folder created
- Files remain in original location
- Backup created as usual (`.sws.bak`)

**Validation Method**: Integration test
```typescript
it('persists archive status to file', async () => {
  const project = mockProject;

  await archiveProject(project.id);

  const filePath = await resolveProjectPath(project.id);
  const fileContent = await readFile(filePath);
  const projectData = JSON.parse(fileContent);

  expect(projectData.projectMetadata.isArchived).toBe(true);
  expect(projectData.projectMetadata.archivedAt).toBeDefined();
});
```

---

## Edge Cases

### 1. Archive Currently Open Project

**User Action**: Attempt to archive project that's open in another tab

**Expected Behavior**:
- Detection occurs before archive
- Warning dialog:
  - "Cannot archive open project"
  - "Please close the project first, then archive."
  - "Close Project" button (navigates to dashboard, closes canvas)
  - "Cancel" button
- Alternative: Auto-close the canvas tab and proceed with archive

**Test**:
```typescript
it('prevents archiving open project', () => {
  const openProject = { ...mockProject };
  useProjectStore.getState().setActiveProject(openProject);

  const { getByText } = render(<ProjectCard project={openProject} />);

  fireEvent.click(getByText('Archive'));

  expect(screen.getByText(/cannot archive open project/i)).toBeVisible();
});
```

---

### 2. Undo Archive Action

**User Action**: Click "Undo" in toast notification within 10 seconds of archiving

**Expected Behavior**:
- Archive action reversed immediately
- Project restored to active list
- `isArchived` flag set back to `false`
- Project appears in same position as before
- Toast dismissed
- File metadata updated back

**Test**:
```typescript
it('allows undoing archive action', async () => {
  await archiveProject(mockProject.id);

  // Click undo within 10 seconds
  fireEvent.click(screen.getByText('Undo'));

  await waitFor(() => {
    const project = useProjectListStore.getState().projects.find(p => p.id === mockProject.id);
    expect(project.isArchived).toBe(false);
  });
});
```

---

### 3. Archive All Projects

**User Action**: Archive all 5 active projects

**Expected Behavior**:
- Active tab shows empty state:
  - "No active projects yet"
  - "Create New Project" button
  - "View Archived Projects" link
- Archived tab shows all 5 projects
- Tab badges update: "Active (0)" and "Archived (5)"
- No errors or crashes
- All functionality remains available

---

### 4. Search Within Archived Projects

**User Action**: Switch to Archived tab, use search to filter archived projects

**Expected Behavior**:
- Search works on archived projects
- Filters by name, client, project number
- Results update in real-time
- Search is scoped to current tab (archived only)
- Clear search shows all archived projects again

---

### 5. Bulk Archive

**User Action**: Select multiple projects (Shift+Click), then archive all at once

**Expected Behavior** (future enhancement):
- Multi-select UI shows selection count
- "Archive Selected" button appears
- Confirmation: "Archive 3 projects?"
- All selected projects archived simultaneously
- Single toast: "3 projects archived" with undo
- Undo restores all 3 projects

---

## Error Scenarios

### 1. File Update Failure During Archive

**Scenario**: Cannot write updated metadata to project file

**Expected Handling**:
- Store update succeeds (optimistic)
- File write fails with error
- Error caught and handled:
  - Error toast: "Cannot update project file. Archive status may not persist."
  - Project remains archived in UI
  - Retry on next app launch or manual save
- Log error for debugging

**Test**:
```typescript
it('handles file update failure gracefully', async () => {
  vi.mocked(saveProject).mockRejectedValueOnce(new Error('Write failed'));

  await archiveProject(mockProject.id);

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Cannot update'));

    // Project still archived in store
    const project = useProjectListStore.getState().projects.find(p => p.id === mockProject.id);
    expect(project.isArchived).toBe(true);
  });
});
```

---

### 2. Corrupted Archive Status

**Scenario**: Project file has `isArchived: true` but not in archived list

**Expected Handling**:
- On app load, scan all project files
- Detect mismatch between file metadata and store
- Auto-correct: Sync store with file metadata
- Info toast: "Project list synchronized"
- No user intervention required

---

### 3. Restore During File Lock

**Scenario**: Try to restore project while file is locked by another process

**Expected Handling**:
- Restore fails with lock error
- Retry mechanism (3 attempts with 500ms delay)
- If still locked:
  - Error toast: "Cannot restore project. File is locked."
  - Project remains in archived state
  - "Retry" button in toast
- User can try again later

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Archive Selected Project | `Ctrl/Cmd + E` (when project card focused) |
| Restore Selected Project | `Ctrl/Cmd + Shift + E` |
| Switch to Archived Tab | `Ctrl/Cmd + Shift + A` |
| Switch to Active Tab | `Ctrl/Cmd + Shift + C` |

---

## Related Elements

- [ArchiveDialog](../../elements/01-components/dashboard/ArchiveDialog.md) - Confirmation dialog
- [ProjectCard](../../elements/01-components/dashboard/ProjectCard.md) - Archive/Restore buttons
- [projectListStore](../../elements/02-stores/projectListStore.md) - Archive state management
- [ProjectIO](../../elements/10-persistence/ProjectIO.md) - File metadata updates
- [DashboardPage](../../elements/12-pages/DashboardPage.md) - Tab switching
- [Toast](../../elements/01-components/ui/Toast.md) - Notifications

---

## Test Implementation

### Unit Tests
- `src/__tests__/components/ArchiveDialog.test.tsx`
  - Archive confirmation
  - Restore action
  - Button states

### Integration Tests
- `src/__tests__/integration/project-archive.test.ts`
  - Archive workflow
  - Restore workflow
  - Store updates
  - File persistence
  - Tab filtering

### E2E Tests
- `e2e/project-management/archive-project.spec.ts`
  - Complete archive flow
  - Tab switching
  - Restore flow
  - Undo action
  - Search in archives

---

## Notes

### Implementation Details

```typescript
// projectListStore.ts
export const useProjectListStore = create<ProjectListState>((set) => ({
  projects: [],

  archiveProject: (projectId: string) => set((state) => {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return state;

    const updatedProject = {
      ...project,
      isArchived: true,
      archivedAt: new Date().toISOString()
    };

    // Update in store
    const updatedProjects = state.projects.map(p =>
      p.id === projectId ? updatedProject : p
    );

    // Trigger file update
    saveProjectMetadata(updatedProject);

    return { projects: updatedProjects };
  }),

  restoreProject: (projectId: string) => set((state) => {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return state;

    const restoredProject = {
      ...project,
      isArchived: false,
      archivedAt: null,
      modifiedAt: new Date().toISOString()
    };

    const updatedProjects = state.projects.map(p =>
      p.id === projectId ? restoredProject : p
    );

    saveProjectMetadata(restoredProject);

    return { projects: updatedProjects };
  })
}));

// DashboardPage.tsx
const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const projects = useProjectListStore(state => state.projects);

  const activeProjects = projects.filter(p => !p.isArchived);
  const archivedProjects = projects.filter(p => p.isArchived);

  const displayedProjects = activeTab === 'active' ? activeProjects : archivedProjects;

  return (
    <Container>
      <Header>
        <TabGroup>
          <Tab
            active={activeTab === 'active'}
            onClick={() => setActiveTab('active')}
          >
            Active ({activeProjects.length})
          </Tab>
          <Tab
            active={activeTab === 'archived'}
            onClick={() => setActiveTab('archived')}
          >
            Archived ({archivedProjects.length})
          </Tab>
        </TabGroup>
      </Header>

      <ProjectList>
        {displayedProjects.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          displayedProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              isArchived={activeTab === 'archived'}
            />
          ))
        )}
      </ProjectList>
    </Container>
  );
};

// ProjectCard.tsx
const ProjectCard: React.FC<{ project: Project; isArchived: boolean }> = ({ project, isArchived }) => {
  const archiveProject = useProjectListStore(state => state.archiveProject);
  const restoreProject = useProjectListStore(state => state.restoreProject);

  const handleArchive = () => {
    archiveProject(project.id);
    toast.success('Project archived', {
      action: {
        label: 'Undo',
        onClick: () => restoreProject(project.id)
      }
    });
  };

  const handleRestore = () => {
    restoreProject(project.id);
    toast.success('Project restored to active list', {
      action: {
        label: 'Undo',
        onClick: () => archiveProject(project.id)
      }
    });
  };

  return (
    <Card className={isArchived ? 'archived' : ''}>
      <CardHeader>
        <h3>{project.name}</h3>
        {isArchived && <Badge>Archived</Badge>}
      </CardHeader>

      <CardBody>
        <p>{project.entityCount} entities</p>
        <p>
          {isArchived
            ? `Archived ${formatRelativeTime(project.archivedAt)}`
            : `Modified ${formatRelativeTime(project.modifiedAt)}`
          }
        </p>
      </CardBody>

      <CardActions>
        {isArchived ? (
          <Button onClick={handleRestore}>Restore</Button>
        ) : (
          <Button onClick={handleArchive}>Archive</Button>
        )}
        <Button onClick={() => handleDelete(project)}>Delete</Button>
      </CardActions>
    </Card>
  );
};
```

### Performance Considerations

- **Tab Switching**: Instant (filter operation is O(n), very fast)
- **Archive Action**: 50-150ms (store update + file save)
- **List Filtering**: <10ms for typical project counts (<100)
- **No Re-render**: Only affected components re-render

### Archive vs Delete

**Archive**:
- Hides from active view
- Preserves all data
- Easily reversible
- Use for: Completed projects, old versions, paused work

**Delete**:
- Permanently removes file
- Cannot be undone (unless backup exists)
- Requires confirmation
- Use for: Test projects, duplicates, unwanted projects

### Accessibility

- Tab navigation with keyboard (Tab key cycles tabs)
- Archive/Restore actions announced to screen readers
- Badge indicates archived status visually and semantically
- Focus management when switching tabs
- Undo actions keyboard accessible

### Future Enhancements

- **Auto-Archive**: Automatically archive projects older than 6 months
- **Archive Reasons**: Tag archives with reason (Completed, On Hold, Cancelled)
- **Archive Search**: Advanced search in archived projects only
- **Bulk Operations**: Select and archive/restore multiple projects
- **Archive Folders**: Organize archives into custom folders/categories
- **Archive Export**: Export archived projects to external storage (zip)
