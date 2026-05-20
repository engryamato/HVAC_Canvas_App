# Project Management (Tauri Offline)

These journeys describe project management behavior when the app runs in the Tauri desktop runtime. Use them alongside the platform-agnostic journeys in `../` for shared flow details.

## Journeys

| ID | Document | Focus |
| --- | --- | --- |
| UJ-PM-001 | [Create New Project](./UJ-PM-001-CreateNewProject.md) | File-system-backed project creation |
| UJ-PM-002 | [Open Existing Project](./UJ-PM-002-OpenExistingProject.md) | Native file dialog + recent projects |
| UJ-PM-003 | [Edit Project Metadata](./UJ-PM-003-EditProjectMetadata.md) | Write-through metadata persistence |
| UJ-PM-004 | [Delete Project](./UJ-PM-004-DeleteProject.md) | Permanent file deletion + backup cleanup |
| UJ-PM-005 | [Archive Project](./UJ-PM-005-ArchiveProject.md) | Metadata flags stored in `.sws` file |
| UJ-PM-006 | [Duplicate Project](./UJ-PM-006-DuplicateProject.md) | File copy + new UUID |
| UJ-PM-007 | [Search & Filter Projects](./UJ-PM-007-SearchFilterProjects.md) | In-memory filtering of local list |
| UJ-PM-008 | [Export Project Report](./UJ-PM-008-ExportProjectReport.md) | Native save dialog for PDF output |

## Related Journeys
- [Project Management Overview](../INDEX.md)
- [Getting Started](../../00-getting-started/)
