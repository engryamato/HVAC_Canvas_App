# [UJ-PM-001] Create New Project (Tauri Offline)

## 1. Overview

### Purpose
This document describes the offline desktop flow for creating a new HVAC project using Tauri file-based persistence, including `.sws` creation, backup generation, and navigation to the canvas editor.

### Scope
- Opening the New Project dialog from the dashboard
- Entering required and optional project metadata
- Validation and submission
- File write to `.sws` and `.sws.bak` creation
- Navigation to the canvas after creation

### User Personas
- **Primary**: HVAC designers creating new projects on desktop
- **Secondary**: Project managers building offline project archives
- **Tertiary**: QA reviewers testing file persistence workflows

### Success Criteria
- New Project dialog opens from dashboard within one click
- Required fields validate with clear errors and guidance
- `.sws` file written to disk and appears in dashboard list
- User reaches canvas editor without data loss
- File system errors are surfaced with recovery options

### Platform Summary (Tauri Offline)
- Storage: `.sws` file + `.sws.bak` backup on disk
- File I/O: Native file system APIs
- Offline: Full offline support
- Native dialogs used only for import/export, not creation

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Creating and managing projects
- **Section 4.2: File Operations** - File system integration
- **Section 6.2: Project Persistence** - Desktop persistence

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
- Write access to app documents directory

### System Prerequisites
- Core modules and stores loaded
- Dashboard list rendered and actions enabled
- File system access configured for Tauri

### Data Prerequisites
- Project metadata schema loaded
- Equipment library available for later canvas use

### Technical Prerequisites
- `NewProjectDialog` available in dashboard
- `ProjectService` configured for file persistence
- `ProjectIO` initialized for `.sws` writes

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
│ Desktop Dashboard          [+ New Project] │
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
- `DashboardPage`
- `NewProjectDialog`

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
2. `.sws` file written to app documents directory
3. `.sws.bak` backup created after primary write
4. Dashboard list updated from file metadata index

**Tauri-Specific Behavior:**
- Write is atomic where possible to avoid partial files
- File paths are resolved under the app documents directory

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

### Edge Case 1: Disk Full
- Show “Storage full” dialog
- Keep dialog open and preserve form state

### Edge Case 2: Permission Denied
- Show actionable error and retry option
- Log diagnostics for support

### Edge Case 3: Duplicate Project Name
- Allow duplicates (IDs remain unique)
- Show optional “Duplicate names allowed” hint

## 6. Error Scenarios and Recovery

### Error Scenario 1: File Write Fails
- Show error toast: “Failed to save project to disk”
- Keep dialog open and preserve form inputs

### Error Scenario 2: Backup Write Fails
- Warn user but keep primary `.sws` file intact
- Offer “Retry backup creation” action

### Error Scenario 3: Validation Failure
- Inline errors next to invalid fields
- Disable “Create” button

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open New Project Dialog | `Ctrl/Cmd + N` |
| Submit Form | `Enter` (when focused in form) |
| Cancel / Close Dialog | `Esc` |

## 8. Related Elements

### Components
- `NewProjectDialog`
- `ProjectCreationScreen`

### Stores
- `projectListStore`
- `ProjectStore`

### Services
- `ProjectService`
- `ProjectIO`

## 9. Visual Diagrams

### Create Project Flow (Tauri Offline)
```
Dashboard → New Project Dialog → .sws Write + .sws.bak → Canvas
```

## Related Base Journey
- [Create New Project](../UJ-PM-001-CreateNewProject.md)
