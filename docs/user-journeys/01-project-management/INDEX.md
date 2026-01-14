# Project Management User Journeys

This category covers the end-to-end lifecycle of HVAC projects, including creation, opening, editing, duplication, archiving, deletion, search, and reporting.

## Platform Support Matrix

| Journey | Tauri Desktop | Web Browser | Notes |
| --- | --- | --- | --- |
| Create New Project | ✅ Full | ✅ Full | Web storage quotas apply |
| Open Existing Project | ✅ Full | ✅ Full | Tauri supports native dialogs |
| Edit Project Metadata | ✅ Full | ✅ Full | Same UI, different persistence |
| Delete Project | ✅ Full | ✅ Full | Tauri deletes files permanently |
| Archive Project | ✅ Full | ✅ Full | Metadata-only operation |
| Duplicate Project | ✅ Full | ✅ Full | Web may warn on quota limits |
| Search & Filter | ✅ Full | ✅ Full | Same UX across platforms |
| Export Project Report | ✅ Full | ✅ Full | Tauri save dialog vs browser download |

## Journeys Overview

| ID | Document | Description | Est. Duration |
| --- | --- | --- | --- |
| UJ-PM-001 | [Create New Project](./UJ-PM-001-CreateNewProject.md) | Create a project from the dashboard and enter metadata | ~30s |
| UJ-PM-002 | [Open Existing Project](./UJ-PM-002-OpenExistingProject.md) | Open saved projects from recent list, file, or cloud | ~10s |
| UJ-PM-003 | [Edit Project Metadata](./UJ-PM-003-EditProjectMetadata.md) | Update project details, scope, and site conditions | ~45s |
| UJ-PM-004 | [Delete Project](./UJ-PM-004-DeleteProject.md) | Permanently remove projects with confirmation | ~60s |
| UJ-PM-005 | [Archive Project](./UJ-PM-005-ArchiveProject.md) | Hide completed projects from active view | ~20s |
| UJ-PM-006 | [Duplicate Project](./UJ-PM-006-DuplicateProject.md) | Clone projects for variants or templates | ~5-60s |
| UJ-PM-007 | [Search and Filter Projects](./UJ-PM-007-SearchFilterProjects.md) | Find projects using search, sort, and filters | Variable |
| UJ-PM-008 | [Export Project Report](./UJ-PM-008-ExportProjectReport.md) | Generate PDF reports for clients and records | ~10-30s |

## Prerequisites

- Application is launched and dashboard is accessible
- Project list has finished loading
- User has permission to create or modify projects

## Recommended Learning Path

1. Start with UJ-PM-001 (Create New Project)
2. Learn UJ-PM-002 (Open Existing Project)
3. Explore UJ-PM-003 (Edit Project Metadata)
4. Use UJ-PM-007 (Search and Filter Projects) for larger portfolios
5. Review UJ-PM-005 (Archive) and UJ-PM-004 (Delete)
6. Finish with UJ-PM-006 (Duplicate) and UJ-PM-008 (Export)

## Platform-Specific Variants

- [Tauri Desktop Variants](./tauri/)
- [Hybrid/Web Variants](./hybrid/)

## Related Journeys

- [Getting Started](../00-getting-started/)
- [File Management](../08-file-management/)
- [Export](../09-export/)
- [Keyboard Shortcuts](../11-keyboard-shortcuts/)
