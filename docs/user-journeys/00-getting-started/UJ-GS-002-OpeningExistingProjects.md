# User Journey: Opening Existing Projects

## 1. Overview

### Purpose
This document describes the complete user experience for accessing and opening existing HVAC projects in the Canvas App. Users can open projects from multiple entry points including the dashboard, recent projects list, file browser, and cloud storage. The journey ensures quick access to frequently used projects while providing robust search and filtering for larger project portfolios.

### Scope
- Accessing Dashboard with project list
- Browsing and searching existing projects
- Opening projects from recent list
- Opening projects from file system
- Opening projects from cloud storage (if configured)
- Project preview and metadata display
- Handling project open errors and recovery
- Auto-opening last active project

### User Personas
- **Primary**: Experienced HVAC designers managing multiple active projects
- **Secondary**: Team members accessing shared projects
- **Tertiary**: Project managers reviewing project status and progress

### Success Criteria
- User can locate and open desired project within 3 clicks
- Recent projects list shows last 10 accessed projects
- Search and filters help locate specific projects quickly
- Project preview shows sufficient metadata for identification
- Projects open within 2 seconds (typical size)
- Error messages clearly explain issues and provide recovery options
- User can open projects from multiple sources seamlessly

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Project opening and loading
- **Section 4.2: File Operations** - File system integration
- **Section 4.7: Cloud Integration** - Cloud storage access (optional)
- **Section 5.1: User Interface Layout** - Dashboard layout
- **Section 5.5: Search and Filters** - Project search functionality
- **Section 6.2: Project Persistence** - Project data loading

### Key Requirements Addressed
- REQ-PO-001: Application must display list of existing projects on Dashboard
- REQ-PO-002: Users must be able to open projects with single click from recent list
- REQ-PO-003: Projects must load within 2 seconds for typical sizes
- REQ-PO-004: Search and filter must help users locate projects quickly
- REQ-PO-005: Project preview must show metadata (name, date, thumbnail)
- REQ-PO-006: Application must handle corrupted projects gracefully
- REQ-PO-007: Users must be able to open projects from file system
- REQ-PO-008: Last active project can be auto-opened on launch (user preference)

## 3. Prerequisites

### User Prerequisites
- User has previously created or saved at least one project
- User understands basic project organization and naming conventions
- User knows project location (local storage, file system, or cloud)

### System Prerequisites
- Application fully initialized and loaded
- IndexedDB accessible for local project storage
- File system access permissions granted (for file-based projects)
- Network connectivity (if accessing cloud-based projects)

### Data Prerequisites
- At least one project exists in storage
- Project metadata indexed for search and filtering
- Thumbnails generated for existing projects (if available)
- Recent projects list populated from user's history

### Technical Prerequisites
- Browser supports File System Access API (for file-based projects)
- Sufficient memory to load project data (minimum 100MB available)
- No corrupted project data in storage

## 4. User Journey Steps

### Step 1: Accessing Dashboard and Project List

**User Actions:**
1. User launches HVAC Canvas App
2. User views Dashboard page (default landing page for returning users)
3. User observes project list with recent projects at top
4. User scans project cards for visual identification

**System Response:**
1. System checks onboarding status: `hasLaunched` flag is true
2. System skips welcome screen and loads Dashboard directly
3. System loads project list from ProjectStore
4. System queries IndexedDB for all projects: `getAllProjects()`
5. System sorts projects by last modified date (descending)
6. System retrieves recent projects list: last 10 opened projects
7. System displays Dashboard with two sections:
   - **Recent Projects** (top section, max 10 items)
   - **All Projects** (scrollable grid below)
8. System renders each project as card with:
   - Project name (bold, 18px)
   - Thumbnail preview (150x100px canvas snapshot)
   - Last modified date (relative: "2 hours ago", "Yesterday", "Jan 15")
   - Project metadata: equipment count, file size
   - Quick action buttons: Open, Duplicate, Delete
9. System displays empty state if no projects exist:
   - Message: "No projects yet. Create your first project!"
   - Button: "Create New Project"
10. System loads thumbnails asynchronously (lazy loading)
11. System displays loading skeletons while thumbnails load

**Visual State:**

```
┌────────────────────────────────────────────────────────────┐
│  HVAC Canvas App                    [Search] [+ New] [☰]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Recent Projects                              [View All >] │
│  ───────────────                                           │
│                                                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ [Thumbnail]  │ │ [Thumbnail]  │ │ [Thumbnail]  │       │
│  │              │ │              │ │              │       │
│  │ Office HVAC  │ │ Warehouse A  │ │ Retail Store │       │
│  │ 2 hours ago  │ │ Yesterday    │ │ Jan 15       │       │
│  │ 12 items     │ │ 8 items      │ │ 15 items     │       │
│  │ [Open] [⋮]   │ │ [Open] [⋮]   │ │ [Open] [⋮]   │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                            │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  All Projects                        [Grid ▼] [Sort ▼]    │
│  ────────────                                              │
│                                                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ [Thumbnail]  │ │ [Thumbnail]  │ │ [Thumbnail]  │       │
│  │              │ │              │ │              │       │
│  │ Building B   │ │ Hospital     │ │ School       │       │
│  │ Jan 12       │ │ Jan 10       │ │ Jan 8        │       │
│  │ [Open]       │ │ [Open]       │ │ [Open]       │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**User Feedback:**
- Recent projects section provides quick access to active work
- Thumbnails enable visual project recognition
- Relative dates ("2 hours ago") provide context
- Metadata (item count, size) helps identify projects
- Empty state guides new users toward creating first project

**Related Elements:**
- Components: `DashboardPage`, `ProjectCard`, `ProjectGrid`
- Stores: `ProjectStore`, `AppStateStore`
- Services: `ProjectService`, `ThumbnailService`
- Routes: `/dashboard` (default for returning users)

### Step 2: Searching and Filtering Projects

**User Actions:**
1. User looks for specific project but doesn't see it in recent list
2. User clicks search box in Dashboard header
3. User types project name or keyword: "warehouse"
4. User observes filtered results updating in real-time
5. User optionally applies additional filters:
   - Date range: Last 7 days, Last 30 days, Custom range
   - Sort by: Date modified, Name, Size, Item count
   - View mode: Grid, List, Compact
6. User finds target project in filtered results

**System Response:**
1. System focuses search input when clicked
2. System listens for input changes with 300ms debounce
3. System filters projects as user types:
   - Searches project name (case-insensitive)
   - Searches project description
   - Searches project tags/metadata
4. System updates project grid in real-time to show only matching projects
5. System highlights matching text in project cards
6. System displays result count: "5 projects found"
7. System shows "No results" message if no matches:
   - Message: "No projects match 'warehouse xyz'"
   - Suggestion: "Try different keywords or clear filters"
8. System allows filter combination:
   - Search + Date range + Sort order applied together
9. System saves filter preferences to settings for next session
10. System provides "Clear Filters" button to reset

**Visual State:**

```
┌────────────────────────────────────────────────────────────┐
│  HVAC Canvas App                                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Search projects... warehouse              [×]      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  Filters: [Last 30 days ▼] [Modified ▼]     5 results     │
│           [Clear Filters]                                  │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ [Thumbnail]  │ │ [Thumbnail]  │ │ [Thumbnail]  │       │
│  │              │ │              │ │              │       │
│  │ Warehouse A  │ │ Warehouse B  │ │ Warehouse    │       │
│  │     ████     │ │     ████     │ │ Complex      │       │
│  │ Jan 20       │ │ Jan 15       │ │  ████        │       │
│  │ [Open]       │ │ [Open]       │ │ Jan 10       │       │
│  └──────────────┘ └──────────────┘ │ [Open]       │       │
│                                    └──────────────┘       │
│  ┌──────────────┐ ┌──────────────┐                        │
│  │ [Thumbnail]  │ │ [Thumbnail]  │                        │
│  │              │ │              │                        │
│  │ Old          │ │ Distribution │                        │
│  │ Warehouse    │ │ Warehouse    │                        │
│  │  ████        │ │     ████     │                        │
│  │ Dec 28       │ │ Dec 15       │                        │
│  │ [Open]       │ │ [Open]       │                        │
│  └──────────────┘ └──────────────┘                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**User Feedback:**
- Real-time filtering provides immediate feedback
- Result count shows search effectiveness
- Highlighted matching text confirms search working correctly
- Clear filters button provides easy reset
- "No results" message with suggestions guides next action

**Related Elements:**
- Components: `SearchBar`, `FilterPanel`, `ProjectGrid`
- Stores: `ProjectStore` (filtered projects)
- Services: `SearchService`, `FilterService`
- Hooks: `useProjectSearch`, `useProjectFilters`

### Step 3: Opening Project from Dashboard

**User Actions:**
1. User locates desired project in grid
2. User clicks "Open" button on project card
   OR double-clicks anywhere on project card
   OR presses Enter key when project card focused
3. User waits while project loads (visual feedback)
4. User observes Canvas page with project fully loaded

**System Response:**
1. System detects open action (click, double-click, or keyboard)
2. System retrieves project ID from clicked card
3. System displays loading indicator:
   - Loading overlay on project card
   - Progress spinner with message: "Opening [Project Name]..."
4. System calls `ProjectService.loadProject(projectId)`
5. System reads project data from IndexedDB:
   - Project metadata (name, description, settings)
   - Entity data (all equipment, ducts, annotations)
   - Viewport state (zoom level, pan offset)
   - Edit history (for undo/redo)
6. System validates project data structure
7. System hydrates stores with project data:
   - `ProjectStore.setCurrentProject(project)`
   - `EntityStore.loadEntities(project.entities)`
   - `ViewportStore.loadViewport(project.viewport)`
   - `HistoryStore.loadHistory(project.history)`
8. System generates BOM from loaded entities
9. System navigates to Canvas route: `/canvas/${projectId}`
10. System renders Canvas page with all entities
11. System updates recent projects list (move opened project to top)
12. System saves last accessed timestamp for project
13. System displays success toast: "Project opened successfully"
14. System loads complete within 1-2 seconds for typical projects

**Visual State:**

```
┌────────────────────────────────────────────────────────────┐
│  Loading Project...                                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                    [Loading Spinner]                       │
│                                                            │
│               Opening "Office HVAC"...                     │
│                                                            │
│               ████████████████░░░░  75%                    │
│                                                            │
│               Loading entities...                          │
│                                                            │
└────────────────────────────────────────────────────────────┘

                         ↓ After load completes

┌────────────────────────────────────────────────────────────┐
│  Office HVAC                        [File] [Edit] [View]   │
├────────────────────────────────────────────────────────────┤
│  [Tools]                                         [Props]   │
│                                                            │
│    ┌──────┐     ┌──────┐                                  │
│    │ AHU  │═════│ VAV  │                                  │
│    └──────┘     └──────┘                                  │
│                   ║                                        │
│                   ║                                        │
│                 ┌───┐                                      │
│                 │Fan│                                      │
│                 └───┘                                      │
│                                                            │
│  (Project fully loaded and rendered)                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**User Feedback:**
- Loading overlay prevents multiple open attempts
- Progress indicator shows loading status
- Loading message confirms correct project being opened
- Success toast confirms load completion
- Immediate visual feedback with rendered entities

**Related Elements:**
- Components: `ProjectCard`, `LoadingOverlay`, `CanvasPage`
- Stores: `ProjectStore`, `EntityStore`, `ViewportStore`, `HistoryStore`
- Services: `ProjectService`, `LoadingService`
- Events: `ProjectOpenedEvent`, `EntitiesLoadedEvent`

### Step 4: Opening Project from File System

**User Actions:**
1. User clicks "File" menu in header
2. User clicks "Open from File..." option
3. User browses file system in native file picker
4. User navigates to folder containing .hvac project files
5. User selects desired project file
6. User clicks "Open" in file picker
7. User waits for project to load
8. User sees Canvas with loaded project

**System Response:**
1. System displays File menu dropdown when clicked
2. System shows "Open from File..." option with keyboard shortcut (Ctrl+O)
3. System triggers native file picker when clicked:
   - File type filter: "HVAC Projects (.hvac, .json)"
   - Starting directory: Last used directory or Documents folder
4. System waits for user file selection
5. System reads file contents using FileReader API
6. System parses file content:
   - Detects format: .hvac (binary) or .json (text)
   - Validates file structure and version
   - Checks for required fields
7. System handles version compatibility:
   - If older version, runs migration to current schema
   - If newer version, warns user and attempts best-effort load
8. System imports project data into stores (same as Step 3)
9. System optionally saves to local IndexedDB:
   - Prompt: "Save to local projects?" with checkbox "Don't ask again"
10. System adds to recent projects list
11. System navigates to Canvas with loaded project
12. System displays file path in window title: "Office HVAC - /path/to/file.hvac"

**Visual State:**

```
┌────────────────────────────────────────────────────────────┐
│  HVAC Canvas App                                           │
│  ┌──────────────────┐                                      │
│  │ File          ▼  │                                      │
│  ├──────────────────┤                                      │
│  │ New Project      │ Ctrl+N                               │
│  │ Open...          │ Ctrl+O  ← Click                      │
│  │ Open Recent    ▶ │                                      │
│  │ ────────────     │                                      │
│  │ Save             │ Ctrl+S                               │
│  │ Save As...       │ Ctrl+Shift+S                         │
│  │ ────────────     │                                      │
│  │ Import...        │                                      │
│  │ Export...        │                                      │
│  └──────────────────┘                                      │
│                                                            │
└────────────────────────────────────────────────────────────┘

                         ↓

┌────────────────────────────────────────────────────────────┐
│  Open Project File                                         │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  Look in: [Documents ▼]                 [↑] [🏠] [⋆]      │
│                                                            │
│  📁 My Projects                                            │
│  📁 Client Projects                                        │
│  📁 Templates                                              │
│  📄 Office_HVAC.hvac                     Jan 15, 2025     │
│  📄 Warehouse_Design.hvac                Jan 12, 2025     │
│  📄 Retail_Store.hvac                    Jan 10, 2025     │
│                                                            │
│  File name: [Office_HVAC.hvac                         ]   │
│  File type: [HVAC Projects (*.hvac, *.json)           ▼]  │
│                                                            │
│                              [Open]  [Cancel]              │
└────────────────────────────────────────────────────────────┘
```

**User Feedback:**
- File picker provides familiar OS-native interface
- File type filter shows only relevant project files
- File path in title confirms source location
- Save prompt gives option to add to local projects
- Version migration warnings inform about compatibility

**Related Elements:**
- Components: `FileMenu`, `FileImportDialog`
- Services: `FileSystemService`, `ProjectImportService`, `MigrationService`
- Utils: `FileParser`, `VersionCompatibility`

### Step 5: Auto-Opening Last Project (Optional)

**User Actions:**
1. User has enabled "Open last project on startup" in settings
2. User launches application
3. User observes application automatically loads last active project
4. User can cancel auto-load if desired (ESC key during load)

**System Response:**
1. System checks settings: `settings.autoOpenLastProject === true`
2. System retrieves last active project ID from AppStateStore
3. System displays brief notification:
   - Message: "Opening last project: Office HVAC"
   - Duration: 2 seconds
   - Cancel button: "×" or ESC key
4. System waits 1 second before starting load (allows cancel)
5. If user cancels:
   - System navigates to Dashboard instead
   - System remembers cancellation (don't auto-open again this session)
6. If not cancelled:
   - System loads project using same logic as Step 3
   - System navigates directly to Canvas (bypasses Dashboard)
   - System displays loading progress
7. System tracks auto-open success rate in analytics
8. System disables auto-open if project fails to load:
   - Show error message
   - Redirect to Dashboard
   - Disable auto-open setting with explanation

**Visual State:**

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                    [HVAC Canvas Logo]                      │
│                                                            │
│                                                            │
│                ┌────────────────────────────┐              │
│                │ Opening last project...    │ [×]         │
│                │                            │              │
│                │ Office HVAC                │              │
│                │                            │              │
│                │ Press ESC to cancel        │              │
│                └────────────────────────────┘              │
│                                                            │
│                    ████████░░░░  60%                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**User Feedback:**
- Notification clearly shows which project is being opened
- Cancel option provides control over auto-open behavior
- ESC key provides quick cancellation method
- Auto-open saves time for users working on single project
- Failure handling prevents getting stuck in error loop

**Related Elements:**
- Components: `AutoOpenNotification`, `LoadingScreen`
- Stores: `SettingsStore`, `AppStateStore`, `ProjectStore`
- Services: `ProjectService`, `AutoOpenService`
- Settings: `autoOpenLastProject`, `lastActiveProjectId`

## 5. Edge Cases and Handling

### Edge Case 1: Project Corrupted or Invalid Data

**Scenario:**
User attempts to open project but the project data in IndexedDB is corrupted, has invalid structure, or is missing required fields.

**Handling:**
1. System detects corruption during project load:
   - JSON parse error
   - Schema validation failure (missing required fields)
   - Invalid entity data structure
2. System catches error and displays recovery dialog:
   - Title: "Project Cannot Be Opened"
   - Message: "This project appears to be corrupted or damaged."
   - Project name and last modified date shown
3. System offers recovery options:
   - **Option A**: "Try to Recover" - Attempts to load partial data
   - **Option B**: "Restore from Backup" - Shows available auto-save backups
   - **Option C**: "Delete Project" - Removes corrupted project from list
4. If user selects "Try to Recover":
   - System loads valid portions of project data
   - System replaces invalid entities with placeholder warnings
   - System displays warning banner: "Project partially recovered. Some data may be missing."
   - System suggests saving as new project
5. If user selects "Restore from Backup":
   - System displays list of auto-save backups with timestamps
   - User selects backup version
   - System loads backup data
6. If user selects "Delete Project":
   - System confirms deletion
   - System moves project to trash (soft delete, recoverable for 30 days)
7. System logs corruption details for debugging

**User Impact:**
- Medium: User may lose some project data
- Recovery options minimize data loss
- Backup system provides safety net

### Edge Case 2: Multiple Users Open Same Cloud Project

**Scenario:**
Two users attempt to open and edit the same cloud-stored project simultaneously, creating potential for conflicting changes.

**Handling:**
1. System detects project already open by another user (cloud lock file exists)
2. System displays collaboration warning:
   - Title: "Project Already Open"
   - Message: "User [email] is currently editing this project."
   - Last activity: "5 minutes ago"
3. System offers options:
   - **Option A**: "Open Read-Only" - View project without editing capability
   - **Option B**: "Open Anyway" - Force open with conflict warning
   - **Option C**: "Make a Copy" - Create personal duplicate
   - **Option D**: "Wait for Release" - Monitor and notify when available
4. If user selects "Open Read-Only":
   - System loads project with all editing tools disabled
   - System displays "READ ONLY" badge in header
   - System monitors for lock release
5. If user selects "Open Anyway":
   - System warns about potential conflicts
   - System enables local editing but marks as potentially conflicted
   - System attempts to merge changes on save (shows conflict resolution UI)
6. If user selects "Make a Copy":
   - System creates duplicate with name: "Office HVAC (Copy)"
   - System opens copy for full editing
7. System implements cloud lock timeout (30 minutes of inactivity releases lock)

**User Impact:**
- Medium: Collaboration requires coordination
- Read-only mode allows safe viewing
- Conflict resolution prevents data loss

### Edge Case 3: File System Project Moved or Deleted

**Scenario:**
User opens project from file system, but the original file has been moved or deleted since it was added to recent projects list.

**Handling:**
1. System attempts to load project from stored file path
2. System detects file not found error
3. System displays error dialog:
   - Title: "Project File Not Found"
   - Message: "The file 'Office_HVAC.hvac' could not be found at its original location."
   - Original path shown: "/Documents/Projects/Office_HVAC.hvac"
4. System offers options:
   - **Option A**: "Browse for File" - Open file picker to locate moved file
   - **Option B**: "Remove from Recent" - Clean up broken link
   - **Option C**: "Cancel" - Return to Dashboard
5. If user selects "Browse for File":
   - System opens file picker at parent directory (if exists)
   - User navigates to new location
   - System updates file path reference
   - System loads project normally
6. If user selects "Remove from Recent":
   - System removes entry from recent projects list
   - System returns to Dashboard
7. System optionally shows similar named projects: "Did you mean: Office_HVAC_v2.hvac?"

**User Impact:**
- Low: User can easily relocate or remove broken link
- Browse option allows quick recovery
- Similar suggestions help find renamed files

### Edge Case 4: Insufficient Memory to Load Large Project

**Scenario:**
User attempts to open very large project (1000+ entities) but browser doesn't have sufficient memory available.

**Handling:**
1. System estimates memory requirements during load:
   - Entity count × average entity size
   - History stack size
   - Thumbnail cache size
2. System checks available memory: `navigator.deviceMemory` and `performance.memory`
3. If insufficient memory detected:
   - System pauses load and displays warning:
     - Title: "Large Project - Performance Warning"
     - Message: "This project contains 1,245 entities and may affect performance."
     - Estimated memory: 450 MB
4. System offers options:
   - **Option A**: "Load Anyway" - Proceed with full load
   - **Option B**: "Load Simplified" - Reduce detail level (thumbnails, history depth)
   - **Option C**: "Close Other Tabs" - Prompt to free memory
5. If user selects "Load Simplified":
   - System disables entity thumbnails (use icons instead)
   - System limits history stack to last 20 actions
   - System lazy-loads entities (render only visible viewport)
   - System displays "Simplified Mode" indicator
6. System monitors memory usage during session:
   - Warns if approaching limits
   - Suggests saving and refreshing if critical
7. System provides "Performance Mode" toggle in settings for permanent simplification

**User Impact:**
- Medium: Large projects may have reduced features
- Simplified mode maintains core functionality
- Memory warnings prevent crashes

### Edge Case 5: Project Version Mismatch

**Scenario:**
User opens project created in newer version of application (e.g., project version 2.5, app version 2.0).

**Handling:**
1. System reads project version from metadata: `project.version`
2. System compares with current app version: `APP_VERSION`
3. If project version > app version:
   - System displays compatibility warning:
     - Title: "Newer Project Version"
     - Message: "This project was created with HVAC Canvas App v2.5. You are using v2.0."
     - Warning: "Some features may not work correctly or data may be lost."
4. System offers options:
   - **Option A**: "Open Anyway" - Attempt best-effort load with warnings
   - **Option B**: "Update App" - Link to download latest version
   - **Option C**: "Cancel" - Return to Dashboard
5. If user selects "Open Anyway":
   - System loads known/compatible fields
   - System ignores unknown fields (logs warnings)
   - System displays persistent banner: "⚠️ Project created with newer version. Update app for full compatibility."
   - System prevents saving over original (offer "Save As" only)
6. System tracks version mismatches for compatibility analytics
7. System maintains backward compatibility: older app can read older projects

**User Impact:**
- High: May lose access to newer features
- Update prompt provides clear resolution path
- Read-only protection prevents data corruption

## 6. Error Scenarios and Recovery

### Error Scenario 1: IndexedDB Read Failure

**Error Condition:**
System fails to read project data from IndexedDB due to browser error, quota issues, or database corruption.

**System Detection:**
1. `ProjectService.loadProject()` throws IndexedDB exception
2. Error types: QuotaExceededError, InvalidStateError, UnknownError
3. Error logged with details: project ID, error type, browser info

**Error Message:**
```
Title: Unable to Load Project
Message: The project could not be loaded from local storage.
Error Code: ERR_INDEXEDDB_READ_FAILED
Details: [Specific error, e.g., "Storage quota exceeded"]
```

**Recovery Steps:**
1. System displays error dialog with recovery options:
   - **Primary**: "Retry Loading" - Attempt to read again
   - **Secondary**: "Clear Cache and Retry" - Free storage space
   - **Tertiary**: "Load from File" - Import from backup file
2. If "Retry Loading" clicked:
   - System attempts up to 3 retries with exponential backoff
   - Success: Proceeds with normal load
   - Failure: Offers cache clearing
3. If "Clear Cache and Retry" clicked:
   - System shows storage usage breakdown
   - System offers to delete old thumbnails, temporary data
   - System retries load after clearing
4. If "Load from File" clicked:
   - System opens file picker
   - User selects backup .hvac file
   - System imports and loads
5. System provides "View Storage Usage" link to settings panel

**User Recovery Actions:**
- Wait for retry attempts
- Clear browser cache/data if quota exceeded
- Import from backup file if available
- Contact support if persistent database errors

**Prevention:**
- Monitor storage usage and warn before quota reached
- Implement automatic cache cleanup for old data
- Provide project export prompts for regular backups

### Error Scenario 2: Network Timeout Loading Cloud Project

**Error Condition:**
Network request to load cloud-stored project times out or fails due to connectivity issues.

**System Detection:**
1. `CloudStorageService.fetchProject()` exceeds timeout (30 seconds)
2. Network error or timeout exception thrown
3. Error logged with network diagnostics

**Error Message:**
```
Title: Network Error
Message: Unable to load project from cloud storage. Please check your internet connection.
Error Code: ERR_NETWORK_TIMEOUT
```

**Recovery Steps:**
1. System detects network failure during cloud load
2. System displays error dialog:
   - Message clearly states network issue
   - Shows last successful sync time if available
3. System offers options:
   - **Primary**: "Retry Now" - Immediate retry attempt
   - **Secondary**: "Work Offline" - Load cached version if available
   - **Tertiary**: "Cancel" - Return to Dashboard
4. If "Retry Now" clicked:
   - System checks network connectivity first
   - System displays connection status
   - System retries with fresh request
5. If "Work Offline" clicked:
   - System loads last cached version from IndexedDB
   - System displays offline indicator and cached timestamp
   - System disables cloud save (local only until online)
   - System monitors for connectivity restoration
6. System auto-retries in background every 60 seconds
7. System displays toast when connectivity restored: "Back online"

**User Recovery Actions:**
- Check internet connection
- Switch to different network if available
- Use cached offline version if recent enough
- Wait for automatic retry

**Prevention:**
- Cache cloud projects locally for offline access
- Implement incremental sync for large projects
- Use service worker for offline capability
- Display network status indicator

### Error Scenario 3: Project Schema Validation Error

**Error Condition:**
Project data structure fails validation against expected schema, indicating corrupted or incompatible data.

**System Detection:**
1. Schema validation using Zod fails during load
2. Missing required fields or invalid data types detected
3. Validation errors logged with specific field paths

**Error Message:**
```
Title: Invalid Project Data
Message: This project contains invalid or corrupted data and cannot be opened.
Error Code: ERR_SCHEMA_VALIDATION_FAILED
Details: Missing required field: entities.id
```

**Recovery Steps:**
1. System displays detailed validation error dialog:
   - Lists specific validation failures
   - Shows which fields are problematic
2. System offers intelligent recovery:
   - **Option A**: "Auto-Repair" - Attempt to fix common issues
   - **Option B**: "Load Partial Data" - Load valid portions
   - **Option C**: "View Raw Data" - Expert mode for manual repair
3. If "Auto-Repair" selected:
   - System applies common fixes:
     - Generate missing IDs
     - Set default values for missing required fields
     - Remove invalid entities
   - System displays repair report: "Fixed 3 issues, removed 1 invalid entity"
   - System loads repaired data with warning banner
4. If "Load Partial Data" selected:
   - System loads all valid entities
   - System skips invalid entities with warnings
   - System displays warning list of skipped data
5. If "View Raw Data" selected:
   - System shows JSON editor with validation highlights
   - Advanced users can manually fix and retry
6. System suggests exporting fixed version as new project
7. System offers to send error report for debugging

**User Recovery Actions:**
- Accept auto-repair for common issues
- Review partial data load to assess damage
- Manually edit raw JSON if experienced
- Contact support with error report for complex issues

**Prevention:**
- Validate data before saving (prevent corruption at source)
- Implement schema versioning and migrations
- Regular auto-save creates recovery points
- Export projects regularly for backups

## 7. Keyboard Shortcuts

### Dashboard Navigation

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+O` | Open from file | Opens file picker to load project from file system |
| `Ctrl+N` | New project | Navigate to project creation screen |
| `Ctrl+F` | Focus search | Activates project search input |
| `Esc` | Clear search | Clears search and filters, returns to all projects |
| `/` | Quick search | Focus search box (alternative to Ctrl+F) |
| `Arrow Up/Down` | Navigate projects | Move selection between project cards |
| `Enter` | Open selected | Opens currently focused project |
| `Delete` | Delete selected | Deletes currently focused project (with confirmation) |

### Project Card Actions

| Shortcut | Action | Context |
|----------|--------|---------|
| `Space` | Quick preview | Shows project preview overlay without opening |
| `Ctrl+D` | Duplicate project | Creates copy of focused project |
| `Ctrl+E` | Export project | Opens export dialog for focused project |
| `Shift+Delete` | Permanent delete | Deletes without moving to trash (confirm) |
| `F2` | Rename project | Activates inline rename for focused project |

### File Menu Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Shift+O` | Open recent | Shows recent projects submenu |
| `Ctrl+Shift+S` | Save as | Save current project as new file |
| `Alt+F` | Open file menu | Opens File menu dropdown |

**Note:** All shortcuts are displayed in tooltips and help menu. Press `Ctrl+/` to view complete shortcut reference.

## 8. Related Elements

### Components
- `DashboardPage`: Main dashboard with project grid
  - Location: `src/pages/DashboardPage.tsx`
  - Props: `projects`, `recentProjects`, `onOpenProject`

- `ProjectCard`: Individual project display card
  - Location: `src/components/projects/ProjectCard.tsx`
  - Props: `project`, `onOpen`, `onDelete`, `onDuplicate`, `showActions`

- `ProjectGrid`: Grid layout for project cards
  - Location: `src/components/projects/ProjectGrid.tsx`
  - Props: `projects`, `viewMode`, `onProjectClick`

- `SearchBar`: Project search input with filtering
  - Location: `src/components/common/SearchBar.tsx`
  - Props: `value`, `onChange`, `placeholder`, `debounceMs`

- `FilterPanel`: Advanced filtering controls
  - Location: `src/components/projects/FilterPanel.tsx`
  - Props: `filters`, `onFilterChange`, `onClear`

- `LoadingOverlay`: Project loading progress indicator
  - Location: `src/components/common/LoadingOverlay.tsx`
  - Props: `message`, `progress`, `cancellable`, `onCancel`

- `FileImportDialog`: File system project import
  - Location: `src/components/files/FileImportDialog.tsx`
  - Props: `onImport`, `onCancel`, `acceptedFormats`

- `AutoOpenNotification`: Auto-open project notification
  - Location: `src/components/app/AutoOpenNotification.tsx`
  - Props: `projectName`, `onCancel`, `countdown`

### Zustand Stores
- `ProjectStore`: Project data and management
  - Location: `src/stores/ProjectStore.ts`
  - State: `projects`, `currentProject`, `recentProjects`, `isLoading`
  - Actions: `loadProject()`, `getAllProjects()`, `addToRecent()`, `setCurrentProject()`

- `AppStateStore`: Application state and navigation
  - Location: `src/stores/AppStateStore.ts`
  - State: `lastActiveProjectId`, `currentRoute`
  - Actions: `setLastActiveProject()`, `navigateToCanvas()`

- `EntityStore`: Entity data for loaded project
  - Location: `src/stores/EntityStore.ts`
  - State: `entities`, `selectedEntities`
  - Actions: `loadEntities()`, `clearEntities()`

- `ViewportStore`: Canvas viewport state
  - Location: `src/stores/ViewportStore.ts`
  - State: `zoom`, `panOffset`, `canvasDimensions`
  - Actions: `loadViewport()`, `resetViewport()`

- `HistoryStore`: Undo/redo history
  - Location: `src/stores/HistoryStore.ts`
  - State: `undoStack`, `redoStack`
  - Actions: `loadHistory()`, `clearHistory()`

- `SettingsStore`: User preferences
  - Location: `src/stores/SettingsStore.ts`
  - State: `autoOpenLastProject`, `projectViewMode`, `searchFilters`
  - Actions: `updateSetting()`, `getSettings()`

### Hooks
- `useProjectList`: Manages project list with search/filter
  - Location: `src/hooks/useProjectList.ts`
  - Returns: `projects`, `filteredProjects`, `search()`, `filter()`

- `useProjectSearch`: Debounced project search
  - Location: `src/hooks/useProjectSearch.ts`
  - Returns: `searchTerm`, `results`, `isSearching`, `setSearchTerm()`

- `useProjectFilters`: Advanced filtering logic
  - Location: `src/hooks/useProjectFilters.ts`
  - Returns: `filters`, `applyFilter()`, `clearFilters()`, `activeFilterCount`

- `useProjectOpen`: Project opening orchestration
  - Location: `src/hooks/useProjectOpen.ts`
  - Returns: `openProject()`, `isLoading`, `error`, `progress`

- `useRecentProjects`: Recent projects management
  - Location: `src/hooks/useRecentProjects.ts`
  - Returns: `recentProjects`, `addToRecent()`, `clearRecent()`

- `useAutoOpen`: Auto-open last project logic
  - Location: `src/hooks/useAutoOpen.ts`
  - Returns: `shouldAutoOpen`, `autoOpenProject()`, `cancelAutoOpen()`

### Services
- `ProjectService`: Core project operations
  - Location: `src/services/ProjectService.ts`
  - Methods: `loadProject()`, `getAllProjects()`, `validateProject()`, `deleteProject()`

- `FileSystemService`: File system integration
  - Location: `src/services/FileSystemService.ts`
  - Methods: `openFilePicker()`, `readFile()`, `writeFile()`, `getFileHandle()`

- `CloudStorageService`: Cloud project sync
  - Location: `src/services/CloudStorageService.ts`
  - Methods: `fetchProject()`, `syncProject()`, `checkLock()`, `acquireLock()`

- `SearchService`: Project search and indexing
  - Location: `src/services/SearchService.ts`
  - Methods: `searchProjects()`, `buildIndex()`, `highlightMatches()`

- `ThumbnailService`: Project thumbnail generation
  - Location: `src/services/ThumbnailService.ts`
  - Methods: `generateThumbnail()`, `cacheThumbnail()`, `loadThumbnail()`

- `MigrationService`: Project version migration
  - Location: `src/services/MigrationService.ts`
  - Methods: `migrateProject()`, `checkCompatibility()`, `getAvailableMigrations()`

- `ValidationService`: Project data validation
  - Location: `src/services/ValidationService.ts`
  - Methods: `validateProjectSchema()`, `repairProject()`, `getValidationErrors()`

## 9. Visual Diagrams

### Project Opening Flow

```
User Action
     │
     v
┌─────────────┐
│ Dashboard   │
│ Project List│
└──────┬──────┘
       │
    Click "Open"
       │
       v
┌──────────────────┐
│ ProjectService.  │
│ loadProject(id)  │
└────────┬─────────┘
         │
         v
    ┌────────┐
    │Read from│
    │IndexedDB│
    └────┬───┘
         │
    ┌────┴────┐
    │         │
Valid│   Invalid│
    │         │
    v         v
┌────────┐ ┌──────────┐
│Hydrate │ │  Error   │
│Stores  │ │ Handler  │
└───┬────┘ └────┬─────┘
    │           │
    │           v
    │      ┌─────────┐
    │      │Recovery │
    │      │Options  │
    │      └─────────┘
    │
    v
┌──────────────┐
│Navigate to   │
│Canvas Page   │
└──────┬───────┘
       │
       v
┌──────────────┐
│Render        │
│Entities      │
└──────────────┘
```

### Search and Filter Flow

```
User Types in Search Box
         │
         v
    [Debounce 300ms]
         │
         v
┌────────────────────┐
│ SearchService.     │
│ searchProjects()   │
└─────────┬──────────┘
          │
          v
┌─────────────────────────┐
│ Match against:          │
│ - Project name          │
│ - Description           │
│ - Tags/metadata         │
└──────────┬──────────────┘
           │
           v
┌──────────────────────────┐
│ Apply additional filters:│
│ - Date range             │
│ - Sort order             │
│ - Item count             │
└──────────┬───────────────┘
           │
           v
┌──────────────────────────┐
│ Update ProjectGrid       │
│ with filtered results    │
└──────────────────────────┘
           │
           v
┌──────────────────────────┐
│ Display result count     │
│ Highlight matches        │
└──────────────────────────┘
```

### Recent Projects Management

```
Project Opened
     │
     v
┌─────────────────────────┐
│ ProjectStore.           │
│ addToRecent(projectId)  │
└───────────┬─────────────┘
            │
            v
┌───────────────────────────┐
│ Load current recent list  │
│ from AppStateStore        │
└───────────┬───────────────┘
            │
            v
┌───────────────────────────┐
│ Remove projectId if       │
│ already in list           │
└───────────┬───────────────┘
            │
            v
┌───────────────────────────┐
│ Add projectId to          │
│ beginning of list         │
└───────────┬───────────────┘
            │
            v
┌───────────────────────────┐
│ Limit list to max 10      │
│ items (FIFO)              │
└───────────┬───────────────┘
            │
            v
┌───────────────────────────┐
│ Save updated list to      │
│ localStorage              │
└───────────────────────────┘
```

### Auto-Open Decision Tree

```
App Launch
     │
     v
┌─────────────┐
│ Check       │
│ Settings    │
└──────┬──────┘
       │
  ┌────┴────┐
  │autoOpen?│
  └─┬─────┬─┘
    │     │
 No │     │ Yes
    │     │
    v     v
┌────────┐ ┌──────────────┐
│Go to   │ │Get last      │
│Dash-   │ │active project│
│board   │ │ID            │
└────────┘ └──────┬───────┘
               │
               v
          ┌─────────┐
          │Project  │
          │exists?  │
          └──┬────┬─┘
             │    │
          No │    │ Yes
             │    │
             v    v
      ┌─────────┐ ┌──────────────┐
      │Go to    │ │Show          │
      │Dashboard│ │notification  │
      └─────────┘ │with countdown│
                  └──────┬───────┘
                         │
                   Wait 1 second
                         │
                  ┌──────┴────────┐
                  │               │
            Cancelled        Continue
                  │               │
                  v               v
           ┌──────────┐    ┌──────────┐
           │Go to     │    │Load      │
           │Dashboard │    │Project   │
           └──────────┘    └──────────┘
```

### Project Data Hydration

```
ProjectService.loadProject(id)
         │
         v
┌────────────────────┐
│ Read from          │
│ IndexedDB          │
└─────────┬──────────┘
          │
          v
┌─────────────────────┐
│ Validate schema     │
└─────────┬───────────┘
          │
          v
     [Valid?]
          │
    ┌─────┴─────┐
    │           │
  Yes│         No│
    │           │
    v           v
┌─────────┐ ┌────────────┐
│Parse    │ │Show error  │
│project  │ │& recovery  │
│data     │ └────────────┘
└────┬────┘
     │
     v
┌─────────────────────────────┐
│ Hydrate Stores (parallel):  │
│                             │
│ ┌─────────────────────┐     │
│ │ ProjectStore        │     │
│ │ .setCurrentProject()│     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ EntityStore         │     │
│ │ .loadEntities()     │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ ViewportStore       │     │
│ │ .loadViewport()     │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ HistoryStore        │     │
│ │ .loadHistory()      │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ BOMStore            │     │
│ │ .calculateBOM()     │     │
│ └─────────────────────┘     │
└─────────────┬───────────────┘
              │
              v
      ┌───────────────┐
      │ Navigate to   │
      │ /canvas/      │
      │ ${projectId}  │
      └───────────────┘
```

## 10. Testing

### Unit Tests

**ProjectService Tests:**
```
describe('ProjectService', () => {
  test('loadProject successfully loads valid project')
  test('loadProject throws error for non-existent project')
  test('loadProject validates project schema correctly')
  test('getAllProjects returns all projects from IndexedDB')
  test('getAllProjects returns empty array when no projects exist')
  test('addToRecent adds project to beginning of recent list')
  test('addToRecent maintains max 10 recent projects')
  test('addToRecent removes duplicate before adding')
  test('deleteProject soft deletes project (moves to trash)')
  test('handles IndexedDB read errors gracefully')
})
```

**SearchService Tests:**
```
describe('SearchService', () => {
  test('searchProjects matches by project name (case-insensitive)')
  test('searchProjects matches by description')
  test('searchProjects matches by tags/metadata')
  test('searchProjects returns empty for no matches')
  test('searchProjects handles special characters correctly')
  test('highlightMatches returns correct highlight positions')
  test('buildIndex creates searchable index from projects')
})
```

**MigrationService Tests:**
```
describe('MigrationService', () => {
  test('migrateProject upgrades v1.0 to v2.0 successfully')
  test('migrateProject preserves all data during migration')
  test('checkCompatibility returns true for compatible versions')
  test('checkCompatibility returns false for newer project version')
  test('getAvailableMigrations returns correct migration path')
  test('migrateProject handles missing fields gracefully')
})
```

### Integration Tests

**Dashboard to Canvas Flow:**
```
describe('Dashboard to Canvas Integration', () => {
  test('clicking Open button loads project and navigates to Canvas')
  test('double-clicking project card opens project')
  test('Enter key on focused project opens project')
  test('project data correctly hydrates all stores')
  test('Canvas renders all entities from loaded project')
  test('recent projects list updates after opening')
  test('loading progress indicator shows during load')
  test('error displayed if project load fails')
})
```

**Search and Filter Integration:**
```
describe('Search and Filter Integration', () => {
  test('typing in search updates filtered project list in real-time')
  test('search highlights matching text in project cards')
  test('result count updates as search term changes')
  test('applying date filter reduces visible projects')
  test('combining search and filters works correctly')
  test('clearing filters restores all projects')
  test('filter preferences persist across sessions')
})
```

**File System Import:**
```
describe('File System Import Integration', () => {
  test('File > Open triggers native file picker')
  test('selecting .hvac file loads project successfully')
  test('selecting .json file parses and loads correctly')
  test('imported project appears in recent projects')
  test('save to local storage prompt appears')
  test('declining local save still opens project in session')
  test('version migration runs for older project files')
})
```

### End-to-End Tests

**Complete Project Opening Flow:**
```
test('E2E: Open project from Dashboard', async () => {
  // 1. Navigate to Dashboard
  await page.goto('http://localhost:3000/dashboard')

  // 2. Verify projects loaded
  await expect(page.locator('[data-testid="project-card"]')).toHaveCount(5)

  // 3. Locate specific project
  const projectCard = page.locator('[data-testid="project-card"]', { hasText: 'Office HVAC' })
  await expect(projectCard).toBeVisible()

  // 4. Click Open button
  await projectCard.locator('[data-testid="open-btn"]').click()

  // 5. Verify loading overlay appears
  await expect(page.locator('[data-testid="loading-overlay"]')).toBeVisible()
  await expect(page.locator('text=Opening Office HVAC')).toBeVisible()

  // 6. Wait for navigation to Canvas
  await expect(page).toHaveURL(/\/canvas\//)

  // 7. Verify Canvas loaded with entities
  await expect(page.locator('[data-testid="canvas-area"]')).toBeVisible()
  await expect(page.locator('[data-testid="entity"]')).toHaveCount(12) // Office HVAC has 12 entities

  // 8. Verify project name in header
  await expect(page.locator('[data-testid="project-title"]')).toHaveText('Office HVAC')

  // 9. Verify success toast
  await expect(page.locator('[data-testid="toast"]')).toHaveText('Project opened successfully')

  // 10. Navigate back to Dashboard
  await page.goto('http://localhost:3000/dashboard')

  // 11. Verify project moved to top of recent list
  const firstRecent = page.locator('[data-testid="recent-project"]').first()
  await expect(firstRecent).toHaveText(/Office HVAC/)
})
```

**Search and Filter E2E:**
```
test('E2E: Search and filter projects', async () => {
  await page.goto('http://localhost:3000/dashboard')

  // 1. Enter search term
  await page.fill('[data-testid="search-input"]', 'warehouse')

  // 2. Verify filtered results
  await expect(page.locator('[data-testid="project-card"]')).toHaveCount(3)
  await expect(page.locator('[data-testid="result-count"]')).toHaveText('3 projects found')

  // 3. Verify search highlighting
  await expect(page.locator('[data-testid="project-card"]').first()).toContainText('Warehouse')
  await expect(page.locator('mark')).toHaveCount(3) // Highlighted matches

  // 4. Apply date filter
  await page.selectOption('[data-testid="date-filter"]', 'last-7-days')

  // 5. Verify combined filter results
  await expect(page.locator('[data-testid="project-card"]')).toHaveCount(2)
  await expect(page.locator('[data-testid="result-count"]')).toHaveText('2 projects found')

  // 6. Clear filters
  await page.click('[data-testid="clear-filters-btn"]')

  // 7. Verify all projects restored
  await expect(page.locator('[data-testid="project-card"]')).toHaveCount(15)
  await expect(page.locator('[data-testid="search-input"]')).toHaveValue('')
})
```

## 11. Common Pitfalls and Solutions

### Pitfall 1: Recent Projects List Grows Unbounded

**Problem:**
Recent projects list keeps growing indefinitely instead of maintaining maximum of 10 items, eventually causing performance issues and UI clutter.

**Why It Happens:**
- Missing logic to limit list size
- Appending instead of prepending with FIFO eviction
- Not removing duplicates before adding

**Solution:**
- Implement strict 10-item limit in `addToRecent()` method
- Use FIFO (First In, First Out) eviction when adding 11th item
- Remove existing entry before adding (move to top, don't duplicate)
- Validate list size on every add operation

**Implementation:**
```
addToRecent(projectId) {
  let recent = this.recentProjects
  // Remove if already exists
  recent = recent.filter(id => id !== projectId)
  // Add to beginning
  recent.unshift(projectId)
  // Limit to 10
  recent = recent.slice(0, 10)
  // Save
  this.recentProjects = recent
}
```

### Pitfall 2: Stale Project Data After External Changes

**Problem:**
User opens project that was modified by another application or sync process, but sees stale cached data instead of latest version.

**Why It Happens:**
- No cache invalidation mechanism
- Not checking last modified timestamp
- IndexedDB cache never refreshes

**Solution:**
- Check project last modified timestamp before loading from cache
- Compare IndexedDB version with file system version (if file-based)
- Implement cache TTL (Time To Live) for project data
- Provide "Refresh" button to force reload
- Show warning if file modified externally: "Project modified externally. Reload?"

**Cache Validation:**
```
loadProject(id) {
  const cached = await indexedDB.get(id)
  const fileModTime = await getFileModifiedTime(cached.filePath)

  if (fileModTime > cached.lastSynced) {
    showWarning('Project modified externally. Reload?')
    // Offer to reload from file
  }

  return cached
}
```

### Pitfall 3: Memory Leak from Unreleased Project Data

**Problem:**
Opening multiple projects in sequence causes memory usage to continuously increase, eventually degrading performance or crashing the application.

**Why It Happens:**
- Previous project data not cleared from stores
- Event listeners not removed
- Large objects retained in closure scope
- Canvas contexts and images not disposed

**Solution:**
- Clear all stores when loading new project
- Implement `cleanup()` method for each store
- Remove event listeners on project close
- Dispose canvas contexts and clear image references
- Use WeakMap for object references where appropriate
- Monitor memory usage in development

**Cleanup Implementation:**
```
openProject(newProjectId) {
  // Clean up current project first
  EntityStore.clearEntities()
  HistoryStore.clearHistory()
  BOMStore.clearBOM()
  ViewportStore.resetViewport()
  CanvasService.disposeContext()

  // Now load new project
  const project = await ProjectService.loadProject(newProjectId)
  // ... hydrate stores
}
```

### Pitfall 4: Poor Search Performance with Many Projects

**Problem:**
Project search becomes slow and unresponsive when user has hundreds of projects, causing UI lag during typing.

**Why It Happens:**
- Linear search through all projects on each keystroke
- No search indexing
- Debounce delay too short or missing
- Re-rendering entire project grid on each search

**Solution:**
- Build search index on application initialization
- Use debounce of 300ms for search input
- Implement virtual scrolling for project grid
- Cache search results for identical queries
- Use Web Worker for search operations (offload from main thread)
- Paginate results: show first 50, load more on scroll

**Optimized Search:**
```
// Build index once
const searchIndex = buildSearchIndex(projects) // Run on init

// Debounced search
const debouncedSearch = debounce((term) => {
  const results = searchIndex.search(term) // Fast index lookup
  setFilteredProjects(results.slice(0, 50)) // Limit initial results
}, 300)
```

### Pitfall 5: Auto-Open Creates Infinite Error Loop

**Problem:**
If auto-open is enabled and the last active project is corrupted, application enters infinite error loop: launches → tries to auto-open → fails → user restarts → repeats.

**Why It Happens:**
- No error handling for auto-open failures
- Failed auto-open doesn't disable the setting
- User can't access dashboard to fix the issue

**Solution:**
- Catch auto-open errors and redirect to Dashboard
- Automatically disable auto-open after failure
- Show clear error message explaining what happened
- Provide "Safe Mode" launch option that skips auto-open
- Track auto-open failures: disable after 3 consecutive failures
- Always provide cancel option during auto-open countdown

**Safe Auto-Open:**
```
async attemptAutoOpen() {
  try {
    const lastProjectId = AppStateStore.lastActiveProjectId
    await ProjectService.loadProject(lastProjectId)
  } catch (error) {
    console.error('Auto-open failed:', error)

    // Disable auto-open to prevent loop
    SettingsStore.updateSetting('autoOpenLastProject', false)

    // Show error and redirect
    showError('Failed to auto-open last project. Auto-open disabled.')
    navigate('/dashboard')

    // Clear last active project
    AppStateStore.setLastActiveProject(null)
  }
}
```

## 12. Performance Tips

### Tip 1: Lazy Load Project Thumbnails

Generate and load thumbnails only when project cards enter viewport, not all at once on Dashboard load.

**Implementation:**
- Use Intersection Observer API to detect card visibility
- Load thumbnail only when card intersects viewport
- Show placeholder icon until thumbnail loads
- Cache loaded thumbnails in memory for instant re-display

**Impact:** Reduces initial Dashboard load time from 2s to under 500ms for 100+ projects

### Tip 2: Virtual Scrolling for Large Project Lists

Render only visible project cards in DOM, not entire list, especially important for users with 100+ projects.

**Implementation:**
- Use react-window or react-virtualized library
- Calculate visible range based on scroll position
- Render only visible + buffer (10 above/below viewport)
- Maintain scroll position when filtering

**Impact:** Maintains 60fps scrolling even with 1000+ projects

### Tip 3: Optimize Project Metadata Queries

Instead of loading full project data for Dashboard display, load only metadata (name, date, item count, thumbnail).

**Implementation:**
- Store metadata separately in IndexedDB with lightweight access
- Load full project data only when opening
- Index metadata fields for fast filtering/sorting
- Batch metadata queries instead of individual reads

**Impact:** Dashboard loads 10x faster (300ms vs 3s for 50 projects)

### Tip 4: Debounce and Throttle Appropriately

Use debouncing for search input (wait for pause) and throttling for scroll events (limit frequency).

**Implementation:**
- Search input: 300ms debounce (balance responsiveness and performance)
- Scroll events: 16ms throttle (60fps max)
- Resize events: 150ms debounce
- Auto-save: 5s debounce

**Impact:** Reduces CPU usage during typing/scrolling by 70%

### Tip 5: Preload Next Likely Project

Predictively preload project data for top recent project while user is on Dashboard.

**Implementation:**
- Start loading most recent project in background after Dashboard loads
- Store preloaded data in memory cache
- If user opens preloaded project, instant load from cache
- If user opens different project, discard preloaded data

**Impact:** Perceived load time reduced to near-zero for most common case (opening recent project)

## 13. Future Enhancements

1. **Project Collections/Folders**: Organize projects into user-defined collections or folders for better management at scale

2. **Advanced Search Syntax**: Support search operators like "tag:commercial", "items:>10", "modified:last-week" for power users

3. **Project Comparison View**: Side-by-side comparison of two projects to visualize differences and changes

4. **Team Collaboration Indicators**: Show which projects are shared, who's currently viewing, and recent collaborator activity

5. **Project Templates from Existing**: One-click conversion of any project to reusable template

6. **Smart Project Recommendations**: Suggest relevant past projects based on current work patterns or similar characteristics

7. **Cloud Sync Status Indicators**: Real-time sync status for cloud projects with conflict indicators and resolution tools

8. **Project Health Dashboard**: Analytics showing project metrics: completion status, error count, optimization suggestions

9. **Bulk Operations**: Select multiple projects for batch actions: export, delete, move to folder, share

10. **Project Timeline View**: Visualize project history and changes over time with interactive timeline scrubbing
