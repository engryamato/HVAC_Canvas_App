# PSR-09: Settings Dialog: Storage Section
- Phase: Phase 4: UI Integration
- Dependencies: PSR-04, PSR-05
- Status: ❌ **NOT STARTED**

## Objective
Add settings controls to view and relocate storage root.

## Spec References
- **Core Flows**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="c67b5d33-0683-432c-a167-6eef71ca51f2" title="Core Flows - Persistent Storage Root">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/c67b5d33-0683-432c-a167-6eef71ca51f2`</traycer-spec>
  - Flow 4: Changing Storage Location
  - Storage Location Setting Placement: "New 'Storage' section in Settings Dialog"
  - Storage Root Display: "Full absolute path"
- **Tech Plan**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="09530bad-8225-4708-82bf-8b821aca0b7d" title="">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/09530bad-8225-4708-82bf-8b821aca0b7d`</traycer-spec>
  - Section: Component Architecture → Layer 5: UI Components → Settings Dialog Extension

## Implementation Details

### File Location
- `hvac-design-app/src/components/dialogs/SettingsDialog.tsx` (to be modified)

### UI Components to Add
**Storage Section**:
```tsx
<div className="section">
  <div className="section-title">Storage</div>
  
  <div className="setting-row">
    <div>
      <div className="setting-label">Storage Location</div>
      <div className="setting-value">{storageRootPath}</div>
    </div>
    <button onClick={handleChangeLocation}>Change Location</button>
  </div>
  
  <div className="setting-row">
    <span className="setting-label">Quarantined Files</span>
    <button onClick={handleViewQuarantine}>View Quarantine</button>
  </div>
</div>
```

### Functionality
**Change Location Flow**:
1. User clicks "Change Location"
2. Native directory picker opens (Tauri dialog)
3. User selects new directory
4. **Validation**:
   - Directory exists and is writable
   - Sufficient disk space
   - Not a subdirectory of current root
5. **If valid**:
   - Close settings dialog
   - Show non-blocking progress toast
   - Background: Move all projects to new location
   - Update storage root in store
   - Refresh project list
   - Update toast: "Projects moved successfully"
6. **If invalid**:
   - Show error message in settings
   - Keep settings dialog open

**View Quarantine Flow**:
1. User clicks "View Quarantine"
2. Open QuarantineManagerDialog (PSR-10)

### Integration Points
- Hook: `useStorageRoot()` to read current storage root path
- Service: `ProjectRepository.relocateStorageRoot(newPath)`
- Events: Subscribe to `storageRoot:changed` for live updates
- Toast: Show progress during relocation

## Checklist
- [ ] Add Storage section with current absolute root path display
- [ ] Implement "Change Location" flow with directory picker
- [ ] Hook relocate action to repository/service and progress UX
- [ ] Expose quarantine manager entry action
- [ ] Handle relocation errors with user-friendly messaging
- [ ] Add component tests for settings interactions

## Acceptance Criteria
- [ ] Storage section appears in Settings dialog
- [ ] Current storage root path displays as full absolute path
- [ ] "Change Location" button opens native directory picker
- [ ] Invalid location shows error message (not writable, insufficient space)
- [ ] Valid location triggers background relocation with progress toast
- [ ] Settings dialog closes immediately after validation passes
- [ ] Progress toast shows "Moving projects..." with spinner
- [ ] Success toast shows "Projects moved successfully" (auto-dismiss 3s)
- [ ] Failure toast shows "Some projects failed to move. See logs."
- [ ] "View Quarantine" button opens QuarantineManagerDialog

## Test Cases
- [ ] Component: renders configured storage root path
- [ ] Component: invokes directory picker and relocation on confirm
- [ ] Component: shows error state when relocation fails
- [ ] Component: view quarantine action opens manager dialog
- [ ] Integration: relocation updates project list after completion
- [ ] Integration: relocation handles partial failures gracefully
- [ ] E2E: user can change storage location via settings
- [ ] E2E: progress toast appears during relocation

## Definition of Done
- [ ] Implementation merged with passing targeted tests
- [ ] Acceptance criteria from Core Flows and Tech Plan satisfied
- [ ] UI matches wireframe from Core Flows
- [ ] Error handling provides clear user feedback

## Implementation Notes
**UI Wireframe**: See Core Flows Flow 4 for detailed wireframe.

**Implementation Steps**:
1. Add Storage section to `SettingsDialog.tsx`
2. Implement `useStorageRoot()` hook if not exists
3. Add directory picker integration (Tauri dialog API)
4. Implement validation logic
5. Add toast notification component
6. Wire up relocation flow
7. Add error handling and user feedback
8. Test on all platforms (Windows/macOS/Linux)

**Related Files**:
- `hvac-design-app/src/components/dialogs/SettingsDialog.tsx`
- `hvac-design-app/src/hooks/useStorageRoot.ts`
- `hvac-design-app/src/core/persistence/ProjectRepository.ts`
