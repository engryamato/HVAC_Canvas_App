# PSR-05: ProjectRepository Policy Layer
- Phase: Phase 2: Core Services
- Dependencies: PSR-01, PSR-03, PSR-04
- Status: 🟡 **MOSTLY COMPLETED** (export method stubbed)

## Objective
Repository policy wrapper over adapter enforcing storage-root canonical project layout.

## Spec References
- **Core Flows**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="c67b5d33-0683-432c-a167-6eef71ca51f2" title="Core Flows - Persistent Storage Root">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/c67b5d33-0683-432c-a167-6eef71ca51f2`</traycer-spec>
  - Flow 3: Opening External Project (Auto-Copy)
  - Flow 4: Changing Storage Location (relocation)
- **Tech Plan**: <traycer-spec epicId="c516c5e7-d2be-4ead-8995-027f0e3890bd" specId="09530bad-8225-4708-82bf-8b821aca0b7d" title="">`spec:c516c5e7-d2be-4ead-8995-027f0e3890bd/09530bad-8225-4708-82bf-8b821aca0b7d`</traycer-spec>
  - Section: Architectural Approach → Decision 2: Repository Pattern with Managed Adapter
  - Section: Component Architecture → Layer 3: Repository Layer → ProjectRepository

## Implementation Details

### File Locations
- `hvac-design-app/src/core/persistence/ProjectRepository.ts`
- `hvac-design-app/src/core/persistence/__tests__/ProjectRepository.test.ts`

### Canonical Path Structure
```
{storageRoot}/projects/{projectId}/project.sws
{storageRoot}/projects/{projectId}/project.sws.bak
{storageRoot}/projects/{projectId}/thumbnail.png
{storageRoot}/projects/{projectId}/meta.json // Future: not yet implemented
```

### Methods
1. **`saveProject(project, options?): Promise<SaveResult>`**
   - Acquires per-project lock (`project:{uuid}`)
   - Resolves canonical path from storage root
   - Saves to `{root}/projects/{uuid}/project.sws`
   - Updates project index in localStorage
   - Emits `project:changed` event

2. **`loadProject(projectId): Promise<LoadResult>`**
   - Resolves canonical path
   - Loads from `{root}/projects/{uuid}/project.sws`
   - Returns project with migration flag if applicable

3. **`deleteProject(projectId): Promise<DeleteResult>`**
   - Acquires per-project lock
   - Deletes project file, backup, thumbnail, metadata
   - Removes project directory
   - Updates project index
   - Emits `project:changed` event

4. **`listProjects(): Promise<ProjectMetadata[]>`**
   - Delegates to adapter (reads from localStorage index)

5. **`importProject(externalPath): Promise<ImportResult>`**
   - Acquires import lock
   - Loads project from external path
   - Copies to canonical location with atomic write
   - Copies backup and thumbnail if present
   - Updates project index
   - Emits `projects:changed` event

6. **`exportProject(projectId, destPath): Promise<ExportResult>`**
   - ⚠️ **NOT IMPLEMENTED** (stubbed with "Not implemented")

7. **`getProjectPath(projectId): Promise<string>`**
   - Returns canonical path for project

8. **`relocateStorageRoot(newPath): Promise<RelocationResult>`**
   - Delegates to StorageRootService

9. **`getQuarantinedFiles(): Promise<QuarantinedFile[]>`**
   - Delegates to StorageRootService

### Events Emitted
- **`project:changed`**: Single project change (detail: { projectId, action })
- **`projects:changed`**: Bulk change (detail: { action, projectId?, sourcePath? })

### Factory Pattern
```typescript
createProjectRepository(adapter, queue, store): ProjectRepository
getProjectRepository(): Promise<ProjectRepository>  // Global cache
```

## Checklist
- [x] Implement canonical path resolution under `{root}/projects/{uuid}`
- [x] Ensure CRUD operations route through queue and adapter
- [x] Persist and read metadata via localStorage index (deviation: not meta.json file)
- [x] Implement import escape hatch
- [ ] ⚠️ Implement export escape hatch (currently stubbed)
- [x] Emit `project:changed` and `projects:changed` events
- [x] Add repository unit tests for pathing and events

## Acceptance Criteria
- [x] Save writes to canonical project path `{root}/projects/{uuid}/project.sws`
- [x] List/load/delete target canonical directory
- [x] Import copies external project into root-managed folder
- [ ] ⚠️ Export writes project to requested external destination (not implemented)
- [x] Event emission fires for save/delete/import
- [x] Per-project operations are serialized via queue
- [x] Atomic file operations prevent corruption

## Test Cases
- [x] Unit: save writes canonical project path
- [x] Unit: list/load/delete target canonical directory
- [x] Unit: import copies external project into root-managed folder
- [ ] ⚠️ Unit: export writes project to requested external destination (not tested)
- [x] Unit: event emission fires for save/delete/import
- [x] Unit: concurrent saves to same project are serialized
- [x] Integration: import handles backup and thumbnail files

## Definition of Done
- [ ] Implementation merged with passing targeted tests
- [ ] Acceptance criteria from Core Flows and Tech Plan satisfied (except export)
- [ ] ⚠️ Export method implemented or scope documented

## Implementation Notes
🟡 Mostly complete. All core functionality implemented except `exportProject()` which is stubbed.

**Deviation from Tech Plan**: Metadata is stored in localStorage index (`sws.projectIndex`) rather than as `meta.json` files. This is acceptable for current implementation but should be documented.

**Action Required**:
- Implement `exportProject()` method or document why it's deferred
- Consider adding `meta.json` file support for better file-system portability
