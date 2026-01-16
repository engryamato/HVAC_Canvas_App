# [UJ-PM-002] Open Existing Project (Hybrid/Web)

## 1. Overview

### Purpose
This document describes the browser-based flow for accessing and opening existing HVAC projects in the Canvas App. Users can open projects from the dashboard (IndexedDB), recent list, or import from file (.hvac/.json) via browser upload.

### Scope
- Accessing Dashboard with project list
- Browsing and searching existing projects
- Opening projects from recent list
- Opening projects from file system (Import)
- Opening projects from cloud storage (if configured)
- Project preview and metadata display
- Handling project open errors and recovery

### User Personas
- **Primary**: Experienced HVAC designers managing multiple active projects
- **Secondary**: Team members accessing shared projects
- **Tertiary**: Project managers reviewing project status and progress

### Success Criteria
- User can locate and open desired project within 3 clicks
- Recent projects list shows last 5 accessed projects
- Search and filters help locate specific projects quickly
- Projects open within 2 seconds (typical size)
- Error messages clearly explain issues (e.g. Quota Exceeded) and provide recovery options

### Platform Summary (Hybrid/Web)
- **Storage**: IndexedDB (persistent) + localStorage (recent list)
- **File I/O**: Browser `<input type="file">` for opening, Blob download for saving
- **Offline**: Cached projects available without network, but cloud sync requires connection
- **Quota**: Subject to browser storage limits (quota management required)

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Project opening and loading
- **Section 4.7: Cloud Integration** - Cloud storage access
- **Section 6.2: Project Persistence** - Browser storage persistence

### Key Requirements Addressed
- REQ-PO-001: Application must display list of existing projects on Dashboard
- REQ-PO-002: Users must be able to open projects with single click
- REQ-PO-003: Projects must load within 2 seconds
- REQ-PO-007: Users must be able to import projects from file system

## 3. Prerequisites

### User Prerequisites
- Existing project saved in browser storage or available as file
- Browser supports IndexedDB

### System Prerequisites
- Dashboard loads successfully
- IndexedDB initialized

## 4. User Journey Steps

### Step 1: Accessing Dashboard and Project List

**User Actions:**
1. User launches HVAC Canvas App in browser
2. User views Dashboard page
3. User observes project list (fetched from IndexedDB)

**System Response:**
1. System queries IndexedDB for all projects
2. System displays Dashboard with "Recent Projects" and "All Projects"
3. System renders project cards with thumbnails
4. System displays empty state if IndexedDB is empty

**Visual State:**
(Standard Dashboard Layout)

### Step 2: Searching and Filtering Projects

**User Actions:**
1. User types in search box
2. User applies filters

**System Response:**
1. System filters in-memory project list (client-side filtering)
2. Updates grid in real-time
3. Debounces input for performance

### Step 3: Opening Project from Dashboard

**User Actions:**
1. User clicks "Open" on a project card

**System Response:**
1. System retrieves project ID
2. System reads full project object from IndexedDB
3. System validates schema
4. System hydrates stores (`ProjectStore`, `EntityStore`, etc.)
5. System navigates to Canvas route `/canvas/:id`
6. System updates "Recent Projects" in localStorage

### Step 4: Opening Project from File System (Import)

**User Actions:**
1. User clicks "File > Open from File..." (or Import)
2. Browser file picker opens

**System Response:**
1. System triggers `<input type="file" accept=".hvac,.json">`
2. User selects file
3. System reads file using `FileReader` API
4. System parses JSON content and validates schema
5. System loads project into memory
6. **Prompt**: "Save this project to your local dashboard?"
   - **Yes**: Save to IndexedDB (if quota allows)
   - **No**: Open properly in "Transient Mode" (not persisted)
7. System navigates to Canvas

### Step 5: Auto-Opening Last Project

**User Actions:**
1. User revisits the app URL

**System Response:**
1. System checks `localStorage` for `lastActiveProjectId`
2. System attempts to load ID from IndexedDB
3. If found, displays notification "Opening last project..."
4. Auto-loads project and redirects to Canvas

## 5. Edge Cases and Handling

### Edge Case 1: Browser Storage Cleared
- **Scenario**: User cleared browser data.
- **Handling**: Dashboard is empty. User must import projects from backup files or cloud.

### Edge Case 2: Quota Exceeded on Import
- **Scenario**: User imports large project, IndexedDB is full.
- **Handling**: Show "Storage Full" warning. Offer to open in "Transient Mode" (memory only) or delete old projects.

### Edge Case 3: Corrupted IndexedDB Data
- **Scenario**: JSON parse error from IDB.
- **Handling**: Show error dialog. Suggest deleting the corrupted entry or attempting repair.

## 6. Error Scenarios and Recovery

### Error Scenario 1: IndexedDB Read Failure
- **Message**: "Unable to access local storage."
- **Recovery**: Check browser privacy settings (Private mode may block IDB).

### Error Scenario 2: Invalid File Format
- **Message**: "The selected file is not a valid HVAC project."
- **Recovery**: Ensure file extension is `.hvac` or `.json` and structure matches schema.

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open File (Import) | `Ctrl+O` |
| New Project | `Ctrl+N` |
| Search | `Ctrl+F` |

## 8. Related Elements

### Components
- `DashboardPage`
- `FileImportDialog` (wraps file input)

### Stores
- `ProjectStore` (IndexedDB interaction)

### Services
- `ProjectService` (Web implementation)
- `IDBService`
