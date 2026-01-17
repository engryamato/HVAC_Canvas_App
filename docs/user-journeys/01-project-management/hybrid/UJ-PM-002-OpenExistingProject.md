# [UJ-PM-002] Open Existing Project (Hybrid/Web)

## 1. Overview

### Purpose
This document describes the browser-based flow for accessing and opening existing HVAC projects in the Canvas App using IndexedDB, recent history, and file import.

### Scope
- Accessing Dashboard with project list
- Browsing and searching existing projects
- Opening projects from recent list
- Importing projects from local file (browser upload)
- Opening projects from cloud storage (if configured)
- Project preview and metadata display
- Handling open errors and recovery

### User Personas
- **Primary**: HVAC designers managing multiple active projects in a browser
- **Secondary**: Team members accessing shared projects through imports
- **Tertiary**: Project managers reviewing project status and progress

### Success Criteria
- User can locate and open a project within 3 clicks
- Recent list shows last 5 accessed projects
- Search and filters locate projects quickly
- Typical projects open within 2 seconds
- Storage and file errors surface with recovery guidance

### Platform Summary (Hybrid/Web)
- Storage: IndexedDB (projects) + localStorage (recents)
- File I/O: Browser file upload and download only
- Offline: Cached projects can open without network
- Quota: Subject to browser storage limits

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Project opening and loading
- **Section 4.7: Cloud Integration** - Cloud storage access
- **Section 6.2: Project Persistence** - Browser storage persistence

### Key Requirements Addressed
- REQ-PO-001: Show list of existing projects on Dashboard
- REQ-PO-002: Open projects with single click from list
- REQ-PO-004: Search and filter help locate projects
- REQ-PO-007: Import projects from file system

## 3. Prerequisites

### User Prerequisites
- Existing project stored in browser storage or available as file
- Browser supports IndexedDB

### System Prerequisites
- Dashboard loads successfully
- IndexedDB initialized and available
- Project schema validation ready

### Data Prerequisites
- Project metadata indexed for search
- Recent list present in localStorage (if any)

### Technical Prerequisites
- `ProjectService` configured for web storage
- `IDBService` available for persistence
- `SearchService` available for filtering

## 4. User Journey Steps

### Step 1: Access Dashboard and Project List

**User Actions:**
1. User opens the app URL
2. User lands on Dashboard
3. User scans Recent Projects and All Projects

**System Response:**
1. Query IndexedDB for all projects
2. Render Recent Projects (last 5) and All Projects
3. Display empty state if no projects exist

**Visual State:**
```
┌────────────────────────────────────────────────┐
│ HVAC Canvas App           [Search] [+ New]     │
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
- Empty state guides user to import or create new

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
1. Filter projects in memory after IndexedDB load
2. Debounce input (300ms) for performance
3. Display count: "Showing X of Y projects"

**User Feedback:**
- Results update in real time
- Clear button resets filters

---

### Step 3: Open from Dashboard

**User Actions:**
1. Click "Open" on a project card

**System Response:**
1. Load project by ID from IndexedDB
2. Validate schema and hydrate stores
3. Update recents in localStorage
4. Navigate to `/canvas/{projectId}`

**User Feedback:**
- Toast: "Opening project..."
- Canvas loads with project name in header

---

### Step 4: Import from File (Browser Upload)

**User Actions:**
1. Click File menu → "Open from File" (or Import)
2. Choose a `.sws` file via browser picker

**System Response:**
1. Trigger `<input type="file" accept=".sws">`
2. Read file with FileReader
3. Validate JSON schema
4. Prompt: "Save to dashboard?"
   - Yes: persist to IndexedDB (if quota allows)
   - No: open in transient mode
5. Navigate to Canvas

**User Feedback:**
- Inline banner indicates whether project is saved or transient

---

### Step 5: Auto-Open Last Project

**User Actions:**
1. User revisits app URL

**System Response:**
1. Read `lastActiveProjectId` from localStorage
2. Attempt IndexedDB load
3. If found, auto-open with notification

**User Feedback:**
- Toast: "Opening last project"

## 5. Edge Cases and Handling

### Edge Case 1: Browser Storage Cleared
- Dashboard empty; user prompted to import or create

### Edge Case 2: Quota Exceeded on Import
- Show "Storage full" warning
- Offer transient open or cleanup

### Edge Case 3: Corrupted IndexedDB Record
- Show "Project data invalid" dialog
- Offer delete corrupted entry

## 6. Error Scenarios and Recovery

### Error Scenario 1: IndexedDB Read Failure
- Message: "Unable to access local storage"
- Recovery: Check browser privacy settings

### Error Scenario 2: Invalid File Format
- Message: "File is not a valid HVAC project"
- Recovery: Require `.sws` and valid schema

### Error Scenario 3: Import Validation Failure
- Message: "Project file schema mismatch"
- Recovery: Show file version and suggest upgrade path

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open File (Import) | `Ctrl+O` |
| New Project | `Ctrl+N` |
| Search | `Ctrl+F` |

## 8. Related Elements

### Components
- `DashboardPage`
- `FileImportDialog`
- `ProjectCard`

### Stores
- `ProjectStore`
- `projectListStore`

### Services
- `ProjectService` (Web)
- `IDBService`
- `SearchService`

## 9. Visual Diagrams

### Open Existing Project (Hybrid/Web)
```
Dashboard → IndexedDB Load → Canvas
File Import → Validate → IndexedDB Save → Canvas
```

## Related Base Journey
- [Open Existing Project](../UJ-PM-002-OpenExistingProject.md)
