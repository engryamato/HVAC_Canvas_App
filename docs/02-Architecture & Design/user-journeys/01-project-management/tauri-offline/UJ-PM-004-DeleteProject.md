# [UJ-PM-004] Delete Project (Tauri Offline)

## 1. Overview

### Purpose
This document describes deleting projects stored on disk in the Tauri desktop runtime, including `.sws` file removal, backup cleanup, and UI updates.

### Scope
- Initiating delete from the dashboard
- Confirmation dialog and safety checks
- Deleting `.sws`, `.sws.bak`, and thumbnails
- Updating dashboard list and recents

### User Personas
- **Primary**: Designers managing local file storage
- **Secondary**: Users cleaning up offline archives
- **Tertiary**: Admins enforcing retention rules

### Success Criteria
- Delete requires explicit confirmation
- `.sws` and `.sws.bak` removed from disk
- Dashboard list updates immediately
- File errors surface with recovery guidance

### Platform Summary (Tauri Offline)
- Storage: File system
- File I/O: Direct disk deletion via Tauri APIs
- Offline: Full offline support
- Recovery: None unless OS recycle bin is enabled

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Delete projects
- **Section 4.2: File Operations** - File system integration

### Key Requirements Addressed
- FR-PM-004: Delete projects from dashboard
- AC-PM-004-004: Project file deleted from disk
- AC-PM-004-005: Removed from list immediately

## 3. Prerequisites

### User Prerequisites
- User can access dashboard list
- User understands deletion is permanent

### System Prerequisites
- Delete dialog available
- File system access configured

### Data Prerequisites
- Project files exist on disk

### Technical Prerequisites
- `DeleteConfirmDialog` available
- `ProjectIO` delete operation available
- `projectListStore` for list updates

## 4. User Journey Steps

### Step 1: Initiate Delete

**User Actions:**
1. Click Delete icon on project card

**System Response:**
1. Show confirmation dialog with file details
2. Disable Delete until name matches

**Visual State:**
```
┌─────────────────────────────┐
│ Delete Project?             │
│ File: /Projects/Office.sws  │
│ Type name to confirm: [___] │
│ [Cancel]        [Delete]    │
└─────────────────────────────┘
```

---

### Step 2: Confirm Deletion

**User Actions:**
1. Type exact project name

**System Response:**
1. Enable Delete button
2. Show validation checkmark

---

### Step 3: Execute Deletion

**User Actions:**
1. Click Delete

**System Response:**
1. Remove project from `projectListStore`
2. Delete `.sws`, `.sws.bak`, and thumbnail files
3. Remove recents entry from config
4. Show success toast

**Tauri-Specific Behavior:**
- Disk deletion is immediate and irreversible
- Permission errors must be surfaced

---

### Step 4: Confirm UI Update

**User Actions:**
1. Observe dashboard list

**System Response:**
1. Project card removed
2. Empty state shown if last project

## 5. Edge Cases and Handling

### Edge Case 1: Permission Denied
- Show "Access denied" and keep project listed

### Edge Case 2: File Missing
- Remove project from list and show informational banner

### Edge Case 3: File Locked
- Show "File in use" warning and allow retry

## 6. Error Scenarios and Recovery

### Error Scenario 1: Delete Command Fails
- Message: "Unable to delete project file"
- Recovery: Retry or open file location

### Error Scenario 2: Partial Cleanup
- Message: "Backup could not be deleted"
- Recovery: Keep main file removed and retry cleanup later

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Delete (dialog confirm) | `Enter` |
| Cancel | `Esc` |

## 8. Related Elements

### Components
- [DeleteConfirmDialog](../../../elements/01-components/dashboard/DeleteConfirmDialog.md)
- [ProjectCard](../../../elements/01-components/dashboard/ProjectCard.md)

### Stores
- [projectListStore](../../../elements/02-stores/projectListStore.md)

### Services
- [ProjectIO](../../../elements/10-persistence/ProjectIO.md)
- [FileSystem](../../../elements/10-persistence/FileSystem.md)

## 9. Visual Diagrams

### Delete Project Flow (Tauri Offline)
```
Dashboard → Confirm Delete → Disk Remove → List Refresh
```

## Related Base Journey
- [Delete Project](../UJ-PM-004-DeleteProject.md)
