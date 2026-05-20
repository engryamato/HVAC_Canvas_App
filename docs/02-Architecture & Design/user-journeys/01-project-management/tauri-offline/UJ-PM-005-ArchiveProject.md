# [UJ-PM-005] Archive Project (Tauri Offline)

## 1. Overview

### Purpose
This document describes how users archive and restore projects on desktop, including file-backed metadata updates to `.sws` and `.sws.bak`.

### Scope
- Archiving from the dashboard
- Viewing archived projects
- Restoring archived projects
- Persisting archive status in `.sws` metadata

### User Personas
- **Primary**: Designers organizing local archives
- **Secondary**: Project managers separating active vs completed work
- **Tertiary**: Admins auditing project lifecycles

### Success Criteria
- Archive moves project out of Active list
- Archived tab shows archived projects
- Restore returns project to Active list
- Archive status persists in file metadata

### Platform Summary (Tauri Offline)
- Storage: `.sws` file + `.sws.bak` backup
- File I/O: Read-modify-write to disk
- Offline: Full offline support
- Files remain in original directory (no physical move)

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Archive and restore
- **Section 4.2: File Operations** - File system integration

### Key Requirements Addressed
- FR-PM-005: Archive projects from dashboard
- AC-PM-005-003: Archived tab shows archived projects
- AC-PM-005-004: Restore returns project to active list

## 3. Prerequisites

### User Prerequisites
- User can access dashboard list
- User understands archive is reversible

### System Prerequisites
- Archive action enabled in UI
- File system access configured

### Data Prerequisites
- Project files exist on disk

### Technical Prerequisites
- `ArchiveDialog` available
- `ProjectIO` for metadata updates
- `projectListStore` for list sync

## 4. User Journey Steps

### Step 1: Archive Project (Immediate)

**User Actions:**
1. Click Archive icon on project card

**System Response:**
1. Write `isArchived: true` to `.sws` metadata
2. Update `.sws.bak` after success
3. Remove from Active list in `projectListStore`
4. Show toast with "Undo" action

**Visual State:**
```
┌─────────────────────────────┐
│ Project Card                │
│ [Archive] [Delete]          │
└─────────────────────────────┘
```

**User Feedback:**
- Toast: "Project archived" with [Undo] button
- Card disappears from Active list immediately

---

### Step 2: View Archived Projects

**User Actions:**
*Option A: Tab Navigation*
1. Locate the project filters above the search bar
2. Click the "Archived" tab

*Option B: File Menu*
1. Click "File" in the top navigation bar
2. Select "Archived Projects"

**System Response:**
1. Dashboard view switches to Archived mode (URL updates to `?view=archived`)
2. List filters to show ONLY projects scanning with `isArchived: true` (read from file headers)
3. Archived projects are REMOVED from the "Active" list and "Recent Projects" section
4. "Archived" tab appears active (highlighted)
5. Project cards display "Archived" badge

**Return to Dashboard:**
To return to the main view:
- Click the "Active" tab
- OR Click "File" > "Go to Dashboard"
- OR Click the Logo/Home link

---

### Step 3: Restore Project

**User Actions:**
1. Navigate to "Archived" view (see Step 2)
2. Locate the archived project card
3. Click the "Restore" action (found in the project actions menu `⋮` or as a primary button)

**System Response:**
1. Update metadata: Write `isArchived: false` to the local `.sws` file
2. Update backup: Update `.sws.bak` file
3. Remove project from the Archived filter view and return to "Active" list and "Recent Projects"
4. Show success toast "Project restored"

> **Note**: Restoring a project does not move the file on disk; it simply toggles the metadata flag.

---

## 5. Edge Cases and Handling

### Edge Case 1: File Read-Only
- Show "Archive failed" and keep project active

### Edge Case 2: File Moved or Deleted
- Remove from list and show informational banner

### Edge Case 3: Backup Write Failure
- Warn user but keep primary file intact

## 6. Error Scenarios and Recovery

### Error Scenario 1: Disk Write Failure
- Message: "Unable to update archive status"
- Recovery: Retry or open file location

### Error Scenario 2: Metadata Scan Failure
- Message: "Unable to read project metadata"
- Recovery: Skip entry and continue scan

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Archive (when focused) | `A` |
| Restore (when focused) | `R` |

## 8. Related Elements

### Components
- [ConfirmDialog](../../../elements/01-components/dashboard/ConfirmDialog.md)
- [ProjectCard](../../../elements/01-components/dashboard/ProjectCard.md)

### Stores
- [projectListStore](../../../elements/02-stores/projectListStore.md)

### Services
- [ProjectIO](../../../elements/10-persistence/ProjectIO.md)
- [FileSystem](../../../elements/10-persistence/FileSystem.md)

## 9. Visual Diagrams

### Archive Project Flow (Tauri Offline)
```
Active List → Update .sws Metadata → Archived Tab
```

## Related Base Journey
- [Archive Project](../UJ-PM-005-ArchiveProject.md)
