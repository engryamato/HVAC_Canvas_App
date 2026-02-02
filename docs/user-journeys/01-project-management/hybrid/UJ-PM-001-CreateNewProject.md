# [UJ-PM-001] Create New Project (Hybrid/Web)

## 1. Overview

### Purpose
This document describes the browser-based flow for creating a new HVAC project from the dashboard, including metadata entry, validation, persistence to IndexedDB, and navigation to the canvas editor.

### Scope
- Opening the New Project dialog from the dashboard
- Entering required and optional project metadata
- Validation and submission
- IndexedDB persistence and recent list update
- Navigation to the canvas after creation

### User Personas
- **Primary**: HVAC designers starting a new project in a browser
- **Secondary**: Project managers creating standardized entries
- **Tertiary**: Trainees creating practice projects in a shared environment

### Success Criteria
- New Project dialog opens from dashboard within one click
- Required fields validate with clear errors and guidance
- Project persists to IndexedDB and appears in dashboard list
- User reaches canvas editor without data loss
- Storage and quota issues are surfaced with recovery options

### Platform Summary (Hybrid/Web)
- Storage: IndexedDB/localStorage (quota-limited)
- File I/O: Browser download/upload only
- Offline: Limited to cached projects and templates
- No native dialogs or file system access

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Creating and managing projects
- **Section 4.8: User Settings** - Default preferences and configuration
- **Section 6.2: Project Persistence** - Browser storage persistence

### Key Requirements Addressed
- FR-PM-001: Create new project with metadata
- AC-PM-001-001: New Project dialog opens from dashboard
- AC-PM-001-002: Project name required (1-100 chars)
- AC-PM-001-004: Successful creation navigates to canvas
- AC-PM-001-005: Validation errors shown for invalid input

## 3. Prerequisites

### User Prerequisites
- Access to dashboard (`/dashboard`)
- Basic understanding of project naming conventions
- Browser supports IndexedDB and LocalStorage

### System Prerequisites
- Core modules and stores loaded
- Dashboard list rendered and actions enabled
- Storage backend ready (IndexedDB available)

### Data Prerequisites
- Project metadata schema loaded
- Equipment library available for later canvas use

### Technical Prerequisites
- `NewProjectDialog` available in dashboard
- `ProjectService` configured for web storage
- `IDBService` initialized for persistence

## 4. User Journey Steps

### Step 1: Open New Project Dialog

**User Actions:**
1. User clicks “New Project” button in the dashboard header

**System Response:**
1. Dialog opens with “Create New Project” title
2. Form shows accordion sections for Project Details, Project Scope, Site Conditions
3. “Create” button disabled until name is provided

**Visual State:**
```
┌─────────────────────────────────────────────┐
│ Dashboard                  [+ New Project] │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Create New Project                            │
│ [Project Details] [Project Scope] [Site Conditions] │
│ Project Name: [________________________]     │
│ [Cancel]                       [Create]     │
└─────────────────────────────────────────────┘
```

**User Feedback:**
- Focus lands on Project Name field
- Clear affordance for required fields

**Related Elements:**
- [DashboardPage](../../../elements/01-components/dashboard/DashboardPage.md)
- [NewProjectDialog](../../../elements/01-components/dashboard/NewProjectDialog.md)

---

### Step 2: Enter Required Metadata

**User Actions:**
1. Enter project name: “Office Building HVAC”

**System Response:**
1. Character counter updates
2. “Create” button enabled
3. No validation errors

**User Feedback:**
- Inline counter shows “21/100”
- Button state indicates form is valid

---

### Step 3: Enter Optional Metadata

**User Actions:**
1. Expand Project Scope
2. Select materials and project type
3. Expand Site Conditions and enter values

**System Response:**
1. Optional fields accept values without errors
2. Form remains valid for submission

**User Feedback:**
- Unit hints visible for numeric fields
- Material sub-options appear only when parent is checked

---

### Step 4: Submit and Persist

**User Actions:**
1. Click “Create”

**System Response:**
1. Form shows loading state
2. Project saved to IndexedDB
3. Dashboard list updated in-memory
4. Recent list updated in localStorage

**Hybrid-Specific Behavior:**
- Storage quota check runs before commit
- If near quota, show warning banner with “Continue”/“Manage Storage”

**User Feedback:**
- Toast: “Project created successfully”
- Dialog closes after success

---

### Step 5: Navigate to Canvas

**User Actions:**
1. System navigates to `/canvas/{projectId}`

**System Response:**
1. Canvas loads with new project metadata
2. Left sidebar shows Project Details section

**User Feedback:**
- Header displays new project name
- Status bar indicates “Entities: 0”

## 5. Edge Cases and Handling

### Edge Case 1: IndexedDB Quota Exceeded
- Show “Storage Low” dialog
- Provide option to delete old projects or export a backup
- Block creation until resolved

### Edge Case 2: IndexedDB Unavailable
- Detect private browsing or disabled storage
- Offer in-memory fallback with warning that data will not persist

### Edge Case 3: Duplicate Project Name
- Allow duplicates (IDs remain unique)
- Provide optional tooltip: “Duplicate names allowed”

## 6. Error Scenarios and Recovery

### Error Scenario 1: Save Transaction Fails
- Show error toast: “Failed to save project”
- Keep dialog open and preserve form inputs

### Error Scenario 2: Validation Failure
- Inline errors next to invalid fields
- Disable “Create” button

### Error Scenario 3: Storage Cleared by Browser
- On next load, show recovery banner and prompt to restore from exports

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open New Project Dialog | `Ctrl/Cmd + N` |
| Submit Form | `Enter` (when focused in form) |
| Cancel / Close Dialog | `Esc` |

## 8. Related Elements

### Components
- [NewProjectDialog](../../../elements/01-components/dashboard/NewProjectDialog.md)
- [DashboardPage](../../../elements/01-components/dashboard/DashboardPage.md)

### Stores
- [projectListStore](../../../elements/02-stores/projectListStore.md)
- [ProjectStore](../../../elements/02-stores/projectStore.md)

### Services
- [ProjectIO](../../../elements/10-persistence/ProjectIO.md)

## 9. Visual Diagrams

### Create Project Flow (Hybrid/Web)
```
Dashboard → New Project Dialog → IndexedDB Save → Canvas
```

## Related Base Journey
- [Create New Project](../UJ-PM-001-CreateNewProject.md)
