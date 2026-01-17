# [UJ-PM-003] Edit Project Metadata (Tauri Offline)

## 1. Overview

### Purpose
This document describes editing project metadata in the offline desktop runtime, including file write-through updates to `.sws` and backup generation.

### Scope
- Opening metadata edit mode from the canvas sidebar
- Editing project details, scope, and site conditions
- Validation and save actions
- Write-through persistence to `.sws` and `.sws.bak`

### User Personas
- **Primary**: HVAC designers updating project details on desktop
- **Secondary**: Project managers correcting client and site information
- **Tertiary**: QA reviewers validating metadata accuracy

### Success Criteria
- Metadata editor opens from canvas sidebar
- Validation errors appear inline
- Changes persist to `.sws` file
- Dashboard list reflects updated metadata without reload
- File errors surface with recovery guidance

### Platform Summary (Tauri Offline)
- Storage: `.sws` file + `.sws.bak` backup
- File I/O: Direct file writes via Tauri APIs
- Offline: Full offline support
- No browser quota constraints

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Metadata editing
- **Section 4.2: File Operations** - File system integration

### Key Requirements Addressed
- FR-PM-003: Edit project metadata from canvas
- AC-PM-003-002: Editable fields (name, number, client, location)
- AC-PM-003-004: Save updates active project and list

## 3. Prerequisites

### User Prerequisites
- User is in Canvas Editor (`/canvas/{projectId}`)
- User has write permissions to project directory

### System Prerequisites
- Project loaded into memory
- Sidebar rendered and interactive
- File system access configured

### Data Prerequisites
- Metadata schema available
- Existing project metadata loaded

### Technical Prerequisites
- `EditProjectDialog` available in sidebar
- `ProjectIO` for file persistence
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
1. Write updated metadata to `.sws`
2. Update `.sws.bak` after successful save
3. Refresh `projectListStore` from file-backed metadata
4. Show success toast

**Tauri-Specific Behavior:**
- Writes are atomic where possible
- Disk write failures keep edits staged

---

### Step 5: Verify Dashboard Updates

**User Actions:**
1. Return to dashboard

**System Response:**
1. Updated name and metadata appear in project list

## 5. Edge Cases and Handling

### Edge Case 1: Permission Denied
- Show error and keep edits unsaved
- Offer retry after permissions fixed

### Edge Case 2: Disk Full
- Show "Storage full" dialog
- Prevent save until resolved

### Edge Case 3: Backup Write Failure
- Warn user but keep primary file intact

## 6. Error Scenarios and Recovery

### Error Scenario 1: File Write Failure
- Show "Save failed" toast
- Preserve edits for retry

### Error Scenario 2: File Locked by Another Process
- Show "File in use" warning
- Suggest closing other applications

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save Changes | `Ctrl/Cmd + S` |
| Cancel Edit | `Esc` |

## 8. Related Elements

### Components
- `EditProjectDialog`
- `LeftSidebar`

### Stores
- `ProjectStore`
- `projectListStore`

### Services
- `ProjectService` (Tauri)
- `ProjectIO`

## 9. Visual Diagrams

### Edit Metadata Flow (Tauri Offline)
```
Canvas → Edit Sidebar → .sws Write + .sws.bak → Dashboard Sync
```

## Related Base Journey
- [Edit Project Metadata](../UJ-PM-003-EditProjectMetadata.md)
