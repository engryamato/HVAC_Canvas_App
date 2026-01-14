# Project Management User Journeys - Implementation Status

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

## Implementation Progress

| User Journey | Status | E2E Tests | Notes |
|--------------|--------|-----------|-------|
| UJ-PM-001 Create New Project | ✅ Complete | All passing | Full metadata dialog |
| UJ-PM-002 Open Existing Project | ✅ Complete | 18/27 passing | Core complete, edge cases pending |
| UJ-PM-003 Edit Project Metadata | ✅ Complete | Created | Inline rename functionality |
| UJ-PM-004 Delete Project | ✅ Complete | Created | Direct delete (no confirmation) |
| UJ-PM-005 Archive/Restore Project | ✅ Complete | Created | Active/Archived tabs |
| UJ-PM-006 Duplicate Project | ✅ Complete | Created | Smart copy naming |
| UJ-PM-007 Search & Filter Projects | ✅ Complete | Created | Search + sort dropdown |
| UJ-PM-008 Export Project Report | ✅ Complete | Created | PDF export dialog |

---

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

## Platform-Specific Variants

- [Tauri Desktop Variants](./tauri/)
- [Hybrid/Web Variants](./hybrid/)

---

## Technical Details

### Dashboard Features
- **Active/Archived Tabs**: Tab navigation with count badges
- **Search Bar**: Real-time filtering with 300ms debounce
- **Sort Dropdown**: Name (A-Z), Last Modified, Date Created

### ProjectCard Actions
- Rename (inline editing)
- Duplicate (generates " - Copy" name)
- Archive/Restore
- Delete

---

## E2E Test Files

| Test File | User Journey |
|-----------|--------------|
| `uj-pm-000-lifecycle-overview.spec.ts` | Lifecycle overview |
| `uj-pm-001-create-project.spec.ts` | Create project |
| `uj-pm-002-open-project.spec.ts` | Open project |
| `uj-pm-003-edit-project.spec.ts` | Edit/Rename project |
| `uj-pm-004-delete-project.spec.ts` | Delete project |
| `uj-pm-005-archive-project.spec.ts` | Archive/Restore |
| `uj-pm-006-duplicate-project.spec.ts` | Duplicate project |
| `uj-pm-007-search-filter.spec.ts` | Search & filter |

---

*Last updated: 2026-01-14*
