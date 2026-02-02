# [UJ-PM-005] Archive Project (Hybrid/Web)

## 1. Overview

### Purpose
This document describes how users archive and restore projects in the browser, including IndexedDB persistence and dashboard filtering.

### Scope
- Archiving from the dashboard
- Viewing archived projects
- Restoring archived projects
- Persisting archive status in IndexedDB

### User Personas
- **Primary**: Designers organizing large portfolios
- **Secondary**: Project managers separating active vs completed work
- **Tertiary**: Admins enforcing lightweight retention policies

### Success Criteria
- Archive moves project out of Active list
- Archived tab shows archived projects
- Restore returns project to Active list
- Archive status persists across sessions

### Platform Summary (Hybrid/Web)
- Storage: IndexedDB/localStorage
- File I/O: No disk writes
- Offline: Works for cached projects
- Quota: Archived projects still consume storage

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Archive and restore
- **Section 6.2: Project Persistence** - Browser storage updates

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
- IndexedDB initialized

### Data Prerequisites
- Project exists in IndexedDB

### Technical Prerequisites
- `ArchiveDialog` available
- `IDBService` for persistence
- `projectListStore` for list updates

## 4. User Journey Steps

### Step 1: Archive Project (Immediate)

**User Actions:**
1. Click Archive icon on project card

**System Response:**
1. Set `isArchived: true` in IndexedDB
2. Remove from Active list in `projectListStore`
3. Show toast with "Undo" action

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
2. List filters to show ONLY projects with `isArchived: true`
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
1. Set `isArchived: false` in IndexedDB
2. Remove project from the Archived filter view
3. Show success toast "Project restored"
4. Project reappears in the "Active" list and "Recent Projects" (if applicable)

---

## 5. Edge Cases and Handling

### Edge Case 1: IndexedDB Update Failure
- Show "Archive failed" toast and keep project active

### Edge Case 2: Concurrent Tab Updates
- Warn if another tab changes status while current view is stale

### Edge Case 3: Storage Cleared
- Archived status lost if browser data cleared

## 6. Error Scenarios and Recovery

### Error Scenario 1: IDB Transaction Error
- Message: "Unable to update archive status"
- Recovery: Retry or reload dashboard

### Error Scenario 2: Recents List Out of Sync
- Message: "Recent list updated"
- Recovery: Refresh recents in localStorage

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

## 9. Visual Diagrams

### Archive Project Flow (Hybrid/Web)
```
Active List → Archive Flag → Archived Tab
```

## Related Base Journey
- [Archive Project](../UJ-PM-005-ArchiveProject.md)
