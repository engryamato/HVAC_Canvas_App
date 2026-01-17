# [UJ-PM-002] Open Existing Project (Tauri Offline)

## 1. Overview

### Purpose
This document describes the offline desktop flow for accessing and opening existing HVAC projects in the Tauri application using file-backed metadata, recent files, and native file dialogs.

### Scope
- Accessing Dashboard with project list
- Browsing and searching existing projects
- Opening projects from recent list
- Opening projects from file system (native dialog)
- Project preview and metadata display
- Handling open errors and recovery

### User Personas
- **Primary**: HVAC designers managing multiple active projects on desktop
- **Secondary**: Team members accessing projects from a shared drive
- **Tertiary**: Project managers reviewing project status

### Success Criteria
- User can locate and open a project within 3 clicks
- Recent list shows last 5 accessed projects
- Search and filters locate projects quickly
- Typical projects open within 2 seconds
- File errors surface with clear recovery options

### Platform Summary (Tauri Offline)
- Storage: `.sws` files + `.sws.bak` backups on disk
- File I/O: Native OS open dialogs via Tauri APIs
- Offline: Fully offline capable
- Recents: File paths stored in app config

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Project opening and loading
- **Section 4.2: File Operations** - Native file system integration

### Key Requirements Addressed
- REQ-PO-001: Show list of existing projects on Dashboard
- REQ-PO-002: Open projects with single click
- REQ-PO-007: Open projects via native dialogs

## 3. Prerequisites

### User Prerequisites
- Access to local file system
- Read permissions for project directories

### System Prerequisites
- Tauri runtime initialized
- File system access permissions granted
- Project schema validation ready

### Data Prerequisites
- Project metadata indexed from disk
- Recent list present in app config (if any)

### Technical Prerequisites
- `ProjectService` configured for file persistence
- `ProjectIO` available for `.sws` reads
- `SearchService` available for filtering

## 4. User Journey Steps

### Step 1: Access Dashboard and Project List

**User Actions:**
1. Launch HVAC Canvas App (Desktop)
2. View Dashboard
3. Scan Recent Projects and All Projects

**System Response:**
1. Scan default project directory for `.sws` files
2. Read metadata headers from disk
3. Render Recent Projects and All Projects
4. Display empty state if no files found

**Visual State:**
```
┌────────────────────────────────────────────────┐
│ HVAC Canvas Desktop       [Search] [+ New]     │
├────────────────────────────────────────────────┤
│ Recent Projects                                  │
│ ┌──────────┐ ┌──────────┐                        │
│ │ Thumb    │ │ Thumb    │                        │
│ │ Project  │ │ Project  │                        │
│ └──────────┘ └──────────┘                        │
│ All Projects                                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Thumb    │ │ Thumb    │ │ Thumb    │           │
│ └──────────┘ └──────────┘ └──────────┘           │
└────────────────────────────────────────────────┘
```

**User Feedback:**
- Thumbnails help identify projects quickly
- Empty state guides user to open from file

**Related Elements:**
- `DashboardPage`
- `ProjectCard`
- `ProjectGrid`

---

### Step 2: Search and Filter

**User Actions:**
1. Type a query in search box
2. Apply sort or active/archived filter

**System Response:**
1. Filter in memory after file metadata scan
2. Debounce input for performance
3. Display count: "Showing X of Y projects"

**User Feedback:**
- Results update in real time
- Clear button resets filters

---

### Step 3: Open from Dashboard

**User Actions:**
1. Click "Open" on a project card

**System Response:**
1. Resolve file path from metadata index
2. Read `.sws` file from disk
3. Validate schema and hydrate stores
4. Update recents in app config
5. Navigate to `/canvas/{projectId}`

**User Feedback:**
- Toast: "Opening project..."
- Canvas loads with project name in header

---

### Step 4: Open from File (Native Dialog)

**User Actions:**
1. Click File menu → "Open..."
2. Select a `.sws` file in native file dialog

**System Response:**
1. Call `dialog.open` with `.sws` filter
2. Read file path and parse project
3. Add file path to recents
4. Navigate to Canvas

**User Feedback:**
- Native dialog uses OS conventions
- Toast confirms file opened

---

### Step 5: Auto-Open Last Project

**User Actions:**
1. Launch app after previous session

**System Response:**
1. Read `lastActiveProjectPath` from app config
2. Verify file exists
3. Auto-open if valid

**User Feedback:**
- Notification: "Opening last project"

## 5. Edge Cases and Handling

### Edge Case 1: File Moved or Deleted
- Show "File not found" dialog
- Offer "Remove from Recents" or "Browse..."

### Edge Case 2: Permission Denied or File Locked
- Show "Access denied" error
- Suggest closing other apps or adjusting permissions

### Edge Case 3: Corrupted File
- Show error and offer to load `.sws.bak`

## 6. Error Scenarios and Recovery

### Error Scenario 1: Disk Read Failure
- Message: "Unable to read project file"
- Recovery: Retry or check disk health

### Error Scenario 2: Legacy File Version
- Message: "Project from older version detected"
- Recovery: Auto-migrate in memory and warn on save

### Error Scenario 3: Missing Recents Entry
- Message: "Recent project path invalid"
- Recovery: Remove entry and refresh list

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open File | `Ctrl+O` |
| New Project | `Ctrl+N` |
| Search | `Ctrl+F` |

## 8. Related Elements

### Components
- `DashboardPage`
- `NativeFileMenu`
- `ProjectCard`

### Stores
- `ProjectStore`
- `projectListStore`

### Services
- `ProjectService` (Tauri)
- `ProjectIO`
- `FileDialogService`

## 9. Visual Diagrams

### Open Existing Project (Tauri Offline)
```
Dashboard → File Scan → Open .sws → Canvas
Native Dialog → Read File → Canvas
```

## Related Base Journey
- [Open Existing Project](../UJ-PM-002-OpenExistingProject.md)
