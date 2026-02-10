# PSR-10: Quarantine Manager Dialog
- Phase: Phase 4: UI Integration
- Dependencies: PSR-05, PSR-07
- Status: ❌ **NOT STARTED**

## Objective
UI for listing and managing quarantined files.

## Spec References
- **Core Flows**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="c67b5d33-0683-432c-a167-6eef71ca51f2" title="Core Flows - Persistent Storage Root">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/c67b5d33-0683-432c-a167-6eef71ca51f2`</traycer-spec>
  - Flow 5: Quarantine Manager
  - Corrupted Files Quarantine Access: "Dedicated quarantine manager UI in settings"
- **Tech Plan**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="09530bad-8225-4708-82bf-8b821aca0b7d" title="">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/09530bad-8225-4708-82bf-8b821aca0b7d`</traycer-spec>
  - Section: Component Architecture → Layer 5: UI Components → Quarantine Manager Dialog

## Implementation Details

### File Location
- `hvac-design-app/src/components/dialogs/QuarantineManagerDialog.tsx` (to be created)

### UI Components
**Dialog Structure**:
```tsx
<Dialog title="Quarantined Files">
  <Description>
    These files were corrupted and moved to quarantine for safekeeping.
  </Description>
  
  {quarantinedFiles.length === 0 ? (
    <EmptyState>
      <Icon>📁</Icon>
      <Title>No quarantined files</Title>
      <Subtitle>All your project files are healthy!</Subtitle>
    </EmptyState>
  ) : (
    <FileList>
      {quarantinedFiles.map(file => (
        <FileItem key={file.path}>
          <FileInfo>
            <FileName>{file.name}</FileName>
            <FileMeta>
              Quarantined on {file.timestamp} • {file.size}
            </FileMeta>
          </FileInfo>
          <FileActions>
            <Button onClick={() => openInExplorer(file.path)}>
              Open in Explorer
            </Button>
            <Button variant="danger" onClick={() => deleteFile(file.path)}>
              Delete
            </Button>
          </FileActions>
        </FileItem>
      ))}
    </FileList>
  )}
  
  <DialogFooter>
    <Button variant="danger" onClick={handleClearAll}>
      Clear All
    </Button>
    <Button onClick={handleClose}>Close</Button>
  </DialogFooter>
</Dialog>
```

### Functionality
**List Quarantined Files**:
- Call `ProjectRepository.getQuarantinedFiles()`
- Display file name, quarantine date/time, file size
- Show empty state if no files

**Open in Explorer/Finder**:
- Use Tauri shell plugin to open file location
- Platform-specific: Explorer (Windows), Finder (macOS), file manager (Linux)

**Delete Permanently**:
- Call `ProjectRepository.deleteQuarantinedFile(filePath)`
- Remove from list after successful deletion
- Show error toast if deletion fails

**Clear All**:
- Show confirmation dialog: "Delete all quarantined files? This cannot be undone."
- If confirmed: Delete all files
- Refresh list (should show empty state)

## Checklist
- [ ] Create QuarantineManagerDialog with file list and metadata
- [ ] Implement open-in-system-file-manager action
- [ ] Implement delete single and clear-all actions with confirmation
- [ ] Handle empty state and loading/error states
- [ ] Refresh list after operations
- [ ] Add component/integration tests for all actions

## Acceptance Criteria
- [ ] Dialog lists all quarantined files from `.quarantine/` directory
- [ ] Each file shows: name, quarantine timestamp, file size
- [ ] "Open in Explorer/Finder" opens file location in system file manager
- [ ] "Delete" removes single file after confirmation
- [ ] "Clear All" removes all files after confirmation dialog
- [ ] Empty state shows when no quarantined files exist
- [ ] List refreshes after delete operations
- [ ] Error handling for failed operations (show toast)

## Test Cases
- [ ] Component: lists quarantined files from repository
- [ ] Component: delete single removes row after success
- [ ] Component: clear-all removes all files after confirmation
- [ ] Component: empty state renders when no files exist
- [ ] Component: open in explorer calls correct system command
- [ ] Integration: delete updates quarantine counter in store
- [ ] E2E: user can view and delete quarantined files

## Definition of Done
- [ ] Implementation merged with passing targeted tests
- [ ] Acceptance criteria from Core Flows and Tech Plan satisfied
- [ ] UI matches wireframe from Core Flows
- [ ] Platform-specific file manager integration tested

## Implementation Notes
**UI Wireframe**: See Core Flows Flow 5 for detailed wireframe.

**Implementation Steps**:
1. Create `QuarantineManagerDialog` component
2. Implement file list rendering
3. Add "Open in Explorer/Finder" using Tauri shell plugin
4. Add delete single file functionality
5. Add "Clear All" with confirmation dialog
6. Implement empty state
7. Add error handling and toast notifications
8. Test on all platforms

**Platform-Specific Commands**:
- Windows: `explorer /select,"{filePath}"`
- macOS: `open -R "{filePath}"`
- Linux: `xdg-open "{directoryPath}"`

**Related Files**:
- `hvac-design-app/src/components/dialogs/QuarantineManagerDialog.tsx` (new)
- `hvac-design-app/src/core/persistence/ProjectRepository.ts`
- `hvac-design-app/src/core/services/StorageRootService.ts`
