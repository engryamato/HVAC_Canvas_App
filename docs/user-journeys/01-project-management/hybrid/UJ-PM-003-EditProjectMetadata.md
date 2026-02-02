# [UJ-PM-003] Edit Project Metadata (Hybrid/Web)

## 1. Overview

### Purpose
This document describes editing project metadata in the browser, including validation, IndexedDB persistence, and dashboard synchronization.

### Scope
- Opening metadata edit mode from the canvas sidebar
- Editing project details, scope, and site conditions
- Validation and save actions
- IndexedDB persistence and list refresh

### User Personas
- **Primary**: HVAC designers updating project details during design
- **Secondary**: Project managers correcting client and site information
- **Tertiary**: QA reviewers validating metadata accuracy

### Success Criteria
- Metadata editor opens from canvas sidebar
- Validation errors appear inline
- Changes persist in IndexedDB
- Dashboard list reflects updated metadata without reload
- Storage errors surface with recovery guidance

### Platform Summary (Hybrid/Web)
- Storage: IndexedDB/localStorage
- File I/O: No disk writes
- Offline: Works for cached projects
- Quota: Subject to browser storage limits

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Metadata editing
- **Section 6.2: Project Persistence** - Browser storage updates

### Key Requirements Addressed
- FR-PM-003: Edit project metadata from canvas
- AC-PM-003-002: Editable fields (name, number, client, location)
- AC-PM-003-004: Save updates active project and list

## 3. Prerequisites

### User Prerequisites
- User is in Canvas Editor (`/canvas/{projectId}`)
- User understands metadata fields

### System Prerequisites
- Project loaded into memory
- Sidebar rendered and interactive

### Data Prerequisites
- Metadata schema available
- Existing project metadata loaded

### Technical Prerequisites
- `EditProjectDialog` available in sidebar
- `IDBService` for persistence
- `projectListStore` for list sync

## 4. User Journey Steps

### Step 1: Open Metadata Editor

**User Actions:**
1. Click edit icon in Project Details accordion

**System Response:**
1. Sidebar switches to editable inputs
2. Save/Cancel actions appear

**Visual State:**
```
┌────────────── Sidebar ──────────────┐
│ Project Details [Edit]              │
│ Name: [Office Building HVAC]        │
│ Client: [Acme Corp]                 │
│ [Save] [Cancel]                     │
└─────────────────────────────────────┘
```

**User Feedback:**
- Focus lands on Project Name

---

### Step 2: Edit Details

**User Actions:**
1. Change name, client, and location

**System Response:**
1. Inline validation on required fields
2. Save button enabled when valid

---

### Step 3: Edit Scope and Site Conditions

**User Actions:**
1. Expand Project Scope and Site Conditions
2. Adjust values and units

**System Response:**
1. Fields validate numeric input
2. Unsaved changes indicator shown

---

### Step 4: Save Changes

**User Actions:**
1. Click Save

**System Response:**
1. Write updated metadata to IndexedDB
2. Update `projectListStore` and recents in localStorage
3. Show success toast

**Hybrid-Specific Behavior:**
- Quota check runs before save
- If quota exceeded, show storage warning and block save

---

### Step 5: Verify Dashboard Updates

**User Actions:**
1. Return to dashboard

**System Response:**
1. Updated name and metadata appear in project list

## 5. Edge Cases and Handling

### Edge Case 1: Quota Exceeded
- Show storage warning and keep edits unsaved

### Edge Case 2: Concurrent Update
- If same project edited in another tab, warn on save and offer overwrite

### Edge Case 3: Invalid Field Values
- Inline errors and Save disabled until fixed

## 6. Error Scenarios and Recovery

### Error Scenario 1: IndexedDB Write Failure
- Show "Save failed" toast
- Preserve unsaved changes for retry

### Error Scenario 2: Storage Cleared
- Warn user and revert to last saved metadata

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save Changes | `Ctrl/Cmd + S` |
| Cancel Edit | `Esc` |

## 8. Related Elements

### Components
- [EditProjectDialog](../../../elements/01-components/dashboard/EditProjectDialog.md)
- `LeftSidebar`

### Stores
- [ProjectStore](../../../elements/02-stores/projectStore.md)
- [projectListStore](../../../elements/02-stores/projectListStore.md)

### Services
- [ProjectIO](../../../elements/10-persistence/ProjectIO.md)

## 9. Visual Diagrams

### Edit Metadata Flow (Hybrid/Web)
```
Canvas → Edit Sidebar → IndexedDB Save → Dashboard Sync
```

## Related Base Journey
- [Edit Project Metadata](../UJ-PM-003-EditProjectMetadata.md)
