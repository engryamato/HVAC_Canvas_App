# [UJ-PM-002] Open Existing Project (Tauri Offline)

## 1. Overview

### Purpose
This document describes the desktop-based flow for accessing and opening existing HVAC projects in the Tauri application. Users can open projects from the dashboard (file system index), recent list, or directly via native OS file dialogs.

### Scope
- Accessing Dashboard with project list (scanned from Documents folder)
- Browsing and searching existing projects
- Opening projects from recent list
- Opening projects from file system (Native Dialog)
- Project preview and metadata display
- Handling project open errors and recovery

### User Personas
- **Primary**: Experienced HVAC designers managing multiple active projects
- **Secondary**: Team members accessing shared network drive projects
- **Tertiary**: Project managers reviewing project status

### Success Criteria
- User can locate and open desired project within 3 clicks
- Recent projects list shows last 5 accessed projects
- Search and filters help locate specific projects quickly
- Projects open within 2 seconds
- Native file dialogs provide familiar experience

### Platform Summary (Tauri Offline)
- **Storage**: File System (`.sws` files in specific directory or user-selected)
- **File I/O**: Native OS Open/Save dialogs via Tauri APIs
- **Offline**: Fully offline capable
- **Backup**: Automatic `.sws.bak` generation

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Project opening and loading
- **Section 4.2: File Operations** - Native file system integration

### Key Requirements Addressed
- REQ-PO-001: Application must display list of existing projects on Dashboard
- REQ-PO-007: Users must be able to open projects from file system using native dialogs

## 3. Prerequisites

### User Prerequisites
- Access to local file system
- Read permissions for project directories

### System Prerequisites
- Tauri runtime initialized
- File system access permissions granted

## 4. User Journey Steps

### Step 1: Accessing Dashboard and Project List

**User Actions:**
1. User launches HVAC Canvas App (Desktop)
2. User views Dashboard page
3. User observes project list (scanned from default Projects directory)

**System Response:**
1. System scans default directory (e.g., `Documents/HVAC Canvas/Projects`) for `.sws` files
2. System reads metadata header from each file
3. System displays Dashboard with "Recent Projects" and "All Projects"
4. System renders project cards

### Step 2: Searching and Filtering Projects

**User Actions:**
1. User types in search box
2. User applies filters

**System Response:**
1. System filters valid project list from scan
2. Updates grid in real-time

### Step 3: Opening Project from Dashboard

**User Actions:**
1. User clicks "Open" on a project card

**System Response:**
1. System retrieves file path from project card
2. System reads file content from disk using Tauri `fs` API
3. System validates schema
4. System hydrates stores
5. System navigates to Canvas route `/canvas/:id`
6. System updates "Recent Projects" list in persistent config file

### Step 4: Opening Project from File System (Native)

**User Actions:**
1. User clicks "File > Open..."
2. Native OS File Dialog appears (Windows Explorer / macOS Finder)

**System Response:**
1. System calls `dialog.open({ filters: [{ name: 'HVAC Project', extensions: ['sws'] }] })`
2. User selects file and clicks Open
3. System receives file path
4. System reads file and loads project
5. System adds path to "Recent Projects"

### Step 5: Auto-Opening Last Project

**User Actions:**
1. User receives notification or auto-load on app start

**System Response:**
1. System checks `app.conf` for `lastActiveProjectPath`
2. System verifies file still exists
3. System auto-loads project

## 5. Edge Cases and Handling

### Edge Case 1: File Moved/Deleted
- **Scenario**: User clicks Recent project, but file is gone.
- **Handling**: Show "File not found" dialog. Offer to "Remove from Recent" or "Browse...".

### Edge Case 2: File Locked / Permission Denied
- **Scenario**: File is open in another process or read-only.
- **Handling**: Show "Access Denied" error. If locked, suggest closing other app.

### Edge Case 3: Corrupted File
- **Scenario**: Header invalid or JSON parse fail.
- **Handling**: Show error. Offer to try loading `.sws.bak` if available in same directory.

## 6. Error Scenarios and Recovery

### Error Scenario 1: Disk Read Failure
- **Message**: "Unable to read project file."
- **Recovery**: Retry or check disk health/permissions.

### Error Scenario 2: Legacy File Version
- **Message**: "Project from older version detected."
- **Recovery**: Auto-migrate data structure in memory. Warn that saving will update file version.

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open File | `Ctrl+O` |
| New Project | `Ctrl+N` |
| Search | `Ctrl+F` |

## 8. Related Elements

### Components
- `DashboardPage`
- `NativeFileMenu` (Tauri integration)

### Stores
- `ProjectStore` (File list + Metadata)

### Services
- `ProjectService` (Tauri implementation)
- `FileSystemService` (Tauri APIs)
