# [UJ-PM-004] Delete Project (Hybrid/Web)

## 1. Overview

### Purpose
This document describes how users delete projects stored in browser storage, including confirmation, IndexedDB removal, and dashboard updates.

### Scope
- Initiating delete from the dashboard
- Confirmation dialog and safety checks
- Deleting project records and cached thumbnails
- Updating dashboard list and recents

### User Personas
- **Primary**: Designers clearing test or obsolete projects
- **Secondary**: Users freeing browser storage quota
- **Tertiary**: Admins managing shared browser profiles

### Success Criteria
- Delete requires explicit confirmation
- Project removed from IndexedDB and UI list
- Recents list cleaned up
- Errors shown with recovery guidance

### Platform Summary (Hybrid/Web)
- Storage: IndexedDB/localStorage
- File I/O: No disk deletion
- Offline: Works for cached projects
- Quota: Deletion frees browser storage

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Delete projects
- **Section 6.2: Project Persistence** - Browser storage cleanup

### Key Requirements Addressed
- FR-PM-004: Delete projects from dashboard
- AC-PM-004-001: Confirmation required
- AC-PM-004-005: Remove from project list immediately

## 3. Prerequisites

### User Prerequisites
- User can access dashboard list
- User understands deletion is permanent

### System Prerequisites
- Delete dialog available
- IndexedDB initialized

### Data Prerequisites
- Target project exists in IndexedDB

### Technical Prerequisites
- `DeleteConfirmDialog` available
- `IDBService` for deletion
- `projectListStore` for list updates

## 4. User Journey Steps

### Step 1: Initiate Delete

**User Actions:**
1. Click Delete icon on project card

**System Response:**
1. Show confirmation dialog with project name and warning
2. Disable Delete button until name matches

**Visual State:**
```
┌─────────────────────────────┐
│ Delete Project?             │
│ Project: Office HVAC        │
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
2. Delete records from IndexedDB
3. Clear recents in localStorage
4. Show success toast

**Hybrid-Specific Behavior:**
- IDB delete is transactional; rollback if failure occurs

---

### Step 4: Confirm UI Update

**User Actions:**
1. Observe dashboard list

**System Response:**
1. Project card removed
2. Empty state shown if last project

## 5. Edge Cases and Handling

### Edge Case 1: IndexedDB Delete Failure
- Show error toast and restore list entry

### Edge Case 2: Project Open in Another Tab
- Warn user that other tab may show errors

### Edge Case 3: Recents Stale Entry
- Remove invalid entry on next dashboard load

## 6. Error Scenarios and Recovery

### Error Scenario 1: IDB Transaction Error
- Message: "Unable to delete project"
- Recovery: Retry or refresh browser storage

### Error Scenario 2: Quota Metadata Mismatch
- Message: "Storage cleanup incomplete"
- Recovery: Retry cleanup in background

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Delete (dialog confirm) | `Enter` |
| Cancel | `Esc` |

## 8. Related Elements

### Components
- `DeleteConfirmDialog`
- `ProjectCard`

### Stores
- `projectListStore`

### Services
- `IDBService`

## 9. Visual Diagrams

### Delete Project Flow (Hybrid/Web)
```
Dashboard → Confirm Delete → IndexedDB Remove → List Refresh
```

## Related Base Journey
- [Delete Project](../UJ-PM-004-DeleteProject.md)
