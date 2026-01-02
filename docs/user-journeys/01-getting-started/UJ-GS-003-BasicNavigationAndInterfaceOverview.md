# User Journey: Basic Navigation and Interface Overview

## 1. Overview

### Purpose
This document provides a comprehensive overview of the HVAC Canvas App interface, teaching users how to navigate between different areas, understand the layout structure, and efficiently use primary interface elements. This foundational knowledge enables users to confidently explore the application and access all features.

### Scope
- Understanding the overall application layout
- Main navigation patterns and routes
- Sidebar functionality (left and right)
- Toolbar organization and tools
- Menu system and shortcuts
- Canvas workspace orientation
- Status bar information
- Modal dialogs and panels
- Keyboard-driven navigation
- Responsive behavior on different screen sizes

### User Personas
- **Primary**: New users learning the application interface
- **Secondary**: Experienced users seeking to optimize workflow
- **Tertiary**: Power users looking for advanced navigation techniques

### Success Criteria
- User understands the purpose of each interface region
- User can navigate between Dashboard and Canvas efficiently
- User knows how to access key features from navigation
- User can toggle sidebars and panels as needed
- User understands keyboard shortcuts for navigation
- User feels confident exploring the interface independently

## 2. PRD References

### Related PRD Sections
- **Section 5.1: User Interface Layout** - Overall layout structure
- **Section 5.2: Navigation System** - Routing and navigation patterns
- **Section 5.3: Toolbar and Menus** - Tool organization
- **Section 5.4: Sidebars** - Left and right sidebar functionality
- **Section 5.5: Canvas Workspace** - Main design area
- **Section 5.6: Keyboard Navigation** - Shortcuts and accessibility

### Key Requirements Addressed
- REQ-UI-001: Application must provide intuitive layout with clear regions
- REQ-UI-002: Navigation between pages must be seamless and fast
- REQ-UI-003: Sidebars must be collapsible to maximize workspace
- REQ-UI-004: Toolbar must organize tools by function and frequency of use
- REQ-UI-005: Menu system must follow platform conventions
- REQ-UI-006: Interface must be responsive to different screen sizes
- REQ-UI-007: Keyboard navigation must support all primary actions
- REQ-UI-008: Status bar must display relevant contextual information

## 3. Prerequisites

### User Prerequisites
- Application successfully launched and user has completed first launch experience
- User has basic computer literacy and familiarity with standard applications
- User understands drag-and-drop interactions
- Screen resolution of at least 1280x720 pixels

### System Prerequisites
- Application fully loaded and initialized
- At least one project created or loaded (for Canvas view)
- All UI components rendered and interactive

### Data Prerequisites
- User settings loaded (sidebar preferences, theme, etc.)
- Equipment library loaded for left sidebar
- Help documentation accessible

### Technical Prerequisites
- JavaScript enabled
- CSS Grid and Flexbox support
- Modern browser with keyboard event handling

## 4. User Journey Steps

### Step 1: Understanding the Main Layout Regions

**User Actions:**
1. User observes the Canvas page after creating or opening a project
2. User visually identifies the major layout regions
3. User mentally maps the interface organization
4. User notes the fixed vs. flexible regions

**System Response:**
1. System renders the main application layout with five primary regions:

   **A. Top Header (Fixed Height: 50px)**
   - Application branding/logo (left)
   - Project name (center)
   - Menu bar: File, Edit, View, Tools, Help
   - User account button (right)
   - Settings icon (right)

   **B. Toolbar (Fixed Height: 45px)**
   - Primary drawing tools (left section)
   - Undo/Redo buttons (center-left)
   - View controls: Zoom, Grid toggle (center-right)
   - Quick actions (right)

   **C. Left Sidebar (Collapsible, Default Width: 280px)**
   - Equipment library (default tab)
   - Layers panel (tab)
   - Recently used items (tab)
   - Search equipment

   **D. Canvas Area (Flexible, Fills Remaining Space)**
   - Main design workspace
   - Scrollable and pannable
   - Grid overlay (toggleable)
   - Coordinate indicators

   **E. Right Sidebar (Collapsible, Default Width: 320px)**
   - Properties panel (default tab)
   - Calculations panel (tab)
   - BOM panel (tab)
   - Notes panel (tab)

   **F. Status Bar (Fixed Height: 30px)**
   - Cursor coordinates (left)
   - Zoom level (center)
   - Grid status (center)
   - Entity count (center-right)
   - Connection status (right)

2. System displays all regions in default configuration
3. System applies saved user preferences for sidebar states
4. System ensures responsive layout adapts to window size

**Visual State:**

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Project Name [File] [Edit] [View] [Tools] [Help] [⚙]│ ← Header
├────┬────────────────────────────────────────────────────┬───┤
│ ≡  │ [Tools: Line, Duct, Select, Delete] [↶↷] [Zoom] [│] │ ← Toolbar
├────┴────────────────────────────────────────────────────┴───┤
│        │                                          │          │
│ Equip  │                                          │ Prop-    │
│ ment   │                                          │ erties   │
│        │           CANVAS AREA                    │          │
│ [AHU]  │                                          │ No item  │
│ [VAV]  │       (Main design workspace)            │ selected │
│ [Fan]  │                                          │          │
│        │                                          │          │
│  Left  │                                          │  Right   │
│ Sidebar│                                          │ Sidebar  │
│        │                                          │          │
│   [<]  │                                          │   [>]    │
├────────┴──────────────────────────────────────────┴──────────┤
│ X: 1250, Y: 680 | Zoom: 100% | Grid: On | 12 items | ● Online│ ← Status
└─────────────────────────────────────────────────────────────┘
```

**User Feedback:**
- Clear visual separation between regions
- Consistent header and toolbar across all pages
- Collapsible sidebars indicated by collapse arrows
- Status bar provides contextual information
- Responsive layout adapts to window resizing

**Related Elements:**
- Components: `AppLayout`, `Header`, `Toolbar`, `LeftSidebar`, `RightSidebar`, `Canvas`, `StatusBar`
- Stores: `LayoutStore` (sidebar states, panel visibility)
- Services: `LayoutService`

### Step 2: Navigating Between Dashboard and Canvas

**User Actions:**
1. User wants to return to Dashboard from Canvas view
2. User clicks application logo or "File" > "Dashboard"
   OR uses keyboard shortcut (Ctrl+Shift+D)
3. User observes transition to Dashboard
4. User wants to return to Canvas
5. User opens a project from Dashboard
6. User observes transition back to Canvas

**System Response:**
1. System provides multiple navigation methods to Dashboard:
   - Click logo/app name in header (breadcrumb behavior)
   - File menu > "Dashboard" option
   - Keyboard shortcut: Ctrl+Shift+D
   - Browser back button (if supported)

2. When navigation triggered:
   - System auto-saves current project changes (if any)
   - System displays brief "Saving..." indicator if needed
   - System animates transition (fade or slide)
   - System navigates to `/dashboard` route
   - System loads Dashboard page component

3. System renders Dashboard with:
   - Same header layout (consistent branding)
   - Recent projects section
   - All projects grid
   - Search and filters

4. When user opens project from Dashboard:
   - System navigates to `/canvas/${projectId}` route
   - System loads project data
   - System renders Canvas page
   - System restores viewport state (last position/zoom)

5. System maintains navigation history:
   - Browser back/forward buttons work correctly
   - Navigation stack tracked in AppStateStore

6. System displays breadcrumb trail in header:
   - Dashboard: "Dashboard"
   - Canvas: "Dashboard > Project Name"

**Visual State:**

```
Header with Breadcrumb Navigation:

┌─────────────────────────────────────────────────────────────┐
│ [HVAC Logo] Dashboard > Office HVAC          [File] [Edit]  │
│              ↑ Clickable breadcrumb                          │
└─────────────────────────────────────────────────────────────┘

File Menu Dropdown:

┌──────────────────────┐
│ File              ▼  │
├──────────────────────┤
│ Dashboard            │ Ctrl+Shift+D  ← Navigate to Dashboard
│ ─────────────        │
│ New Project          │ Ctrl+N
│ Open...              │ Ctrl+O
│ Save                 │ Ctrl+S
│ Save As...           │ Ctrl+Shift+S
│ ─────────────        │
│ Export...            │
│ ─────────────        │
│ Close Project        │ Ctrl+W
└──────────────────────┘
```

**User Feedback:**
- Breadcrumb navigation shows current location
- Multiple navigation methods accommodate different user preferences
- Auto-save prevents data loss on navigation
- Smooth transitions maintain context
- Browser back button behaves as expected

**Related Elements:**
- Components: `Header`, `Breadcrumb`, `FileMenu`
- Stores: `AppStateStore` (routing, navigation history)
- Services: `RouterService`, `NavigationService`
- Routes: `/dashboard`, `/canvas/:projectId`

### Step 3: Exploring the Left Sidebar - Equipment Library

**User Actions:**
1. User observes left sidebar with equipment library
2. User browses equipment categories
3. User expands/collapses categories
4. User searches for specific equipment
5. User toggles between sidebar tabs
6. User collapses sidebar to maximize canvas space
7. User re-expands sidebar when needed

**System Response:**
1. System displays left sidebar with tabs:
   - **Equipment** (default active tab)
   - **Layers**
   - **Recent Items**

2. Equipment tab structure:
   - Search box at top (placeholder: "Search equipment...")
   - Category tree below with expandable sections:
     - Air Handling Units (5 items) [▼]
     - VAV Boxes (8 items) [▼]
     - Fans (12 items) [▼]
     - Ductwork (6 items) [▼]
     - Fittings (15 items) [▼]

3. When user clicks category:
   - System toggles expansion: ▼ (expanded) / ► (collapsed)
   - System animates smooth expand/collapse
   - System shows equipment items with icons and names
   - System persists expanded state in LayoutStore

4. When user types in search:
   - System filters equipment list in real-time (300ms debounce)
   - System highlights matching text
   - System shows "No results" if no matches
   - System clears filter when search cleared

5. When user clicks sidebar collapse button (« icon):
   - System animates sidebar collapse to 40px width
   - System shows vertical tab labels
   - System saves collapsed state to settings
   - Collapse button changes to expand (» icon)

6. When user clicks expand button:
   - System animates sidebar expansion to 280px width
   - System shows full tab content
   - System restores last active tab

7. Layers tab shows:
   - List of canvas layers with visibility toggles
   - Layer names editable inline
   - Drag to reorder layers

8. Recent Items tab shows:
   - Last 10 used equipment items
   - Quick access for frequently used items

**Visual State:**

```
Left Sidebar - Expanded (Equipment Tab):

┌────────────────────────────┐
│ Equipment | Layers | Recent│ ← Tabs
├────────────────────────────┤
│ [Search equipment...    ]  │
├────────────────────────────┤
│                            │
│ ▼ Air Handling Units (5)   │
│   ┌────┐ AHU - York MCA    │
│   │[I] │ 5000 CFM          │
│   └────┘                   │
│   ┌────┐ AHU - Trane       │
│   │[I] │ 3000 CFM          │
│   └────┘                   │
│                            │
│ ► VAV Boxes (8)            │
│                            │
│ ▼ Fans (12)                │
│   ┌────┐ Exhaust Fan       │
│   │[I] │ 1000 CFM          │
│   └────┘                   │
│                            │
│                      [«]   │ ← Collapse
└────────────────────────────┘

Left Sidebar - Collapsed:

┌───┐
│ E │ ← Equipment (vertical)
│ q │
│ u │
│ i │
│ p │
├───┤
│ L │ ← Layers
│ a │
│ y │
├───┤
│ R │ ← Recent
│ e │
│   │
│   │
│ » │ ← Expand button
└───┘
```

**User Feedback:**
- Tabbed organization keeps related items grouped
- Category expansion provides hierarchical browsing
- Search enables quick item location
- Collapse/expand maximizes workspace when needed
- Visual feedback on hover and selection

**Related Elements:**
- Components: `LeftSidebar`, `EquipmentLibrary`, `CategoryTree`, `SearchBox`
- Stores: `EquipmentStore`, `LayoutStore`
- Services: `EquipmentLibraryService`, `SearchService`

### Step 4: Understanding the Right Sidebar - Properties and Panels

**User Actions:**
1. User observes right sidebar with multiple panel tabs
2. User switches between tabs: Properties, Calculations, BOM, Notes
3. User interacts with Properties panel when entity selected
4. User views Calculations results
5. User reviews BOM in BOM panel
6. User adds notes in Notes panel
7. User collapses/expands right sidebar as needed

**System Response:**
1. System displays right sidebar with four tabs:
   - **Properties** (default)
   - **Calculations**
   - **BOM** (Bill of Materials)
   - **Notes**

2. **Properties Tab** (when no selection):
   - Shows message: "No item selected"
   - Shows project properties:
     - Project name
     - Created date
     - Last modified
     - Total entities

3. **Properties Tab** (when entity selected):
   - Shows selected entity type (e.g., "Air Handler Unit")
   - Shows editable properties:
     - Name (text input)
     - Model (dropdown)
     - CFM (number input)
     - Voltage (dropdown)
     - Custom properties
   - Shows "Apply" and "Reset" buttons
   - Real-time preview of changes

4. **Calculations Tab**:
   - Shows calculation results for selected entity/system
   - Displays formulas used
   - Shows unit conversions
   - Provides export button for results

5. **BOM Tab**:
   - Shows complete bill of materials table
   - Displays columns: Item, Quantity, Unit Cost, Total
   - Provides filter and sort controls
   - Shows total cost at bottom
   - Export button for BOM

6. **Notes Tab**:
   - Shows project-wide notes (when no selection)
   - Shows entity-specific notes (when entity selected)
   - Rich text editor for formatting
   - Timestamp and author displayed
   - Auto-save every 5 seconds

7. When user clicks collapse button (» icon):
   - System collapses sidebar to 40px width
   - System shows vertical tab labels
   - Button changes to expand (« icon)

8. System maintains independent collapse state for left and right sidebars

**Visual State:**

```
Right Sidebar - Properties Panel (Entity Selected):

┌────────────────────────────────────┐
│ Properties | Calc | BOM | Notes    │
├────────────────────────────────────┤
│ Air Handler Unit                   │
│ ──────────────────                 │
│                                    │
│ Name:                              │
│ ┌────────────────────────────────┐ │
│ │ AHU-1                          │ │
│ └────────────────────────────────┘ │
│                                    │
│ Model:                             │
│ ┌────────────────────────────────┐ │
│ │ York MCA ▼                     │ │
│ └────────────────────────────────┘ │
│                                    │
│ CFM:                               │
│ ┌────────────────────────────────┐ │
│ │ 5000                           │ │
│ └────────────────────────────────┘ │
│                                    │
│ Voltage:                           │
│ ┌────────────────────────────────┐ │
│ │ 480V ▼                         │ │
│ └────────────────────────────────┘ │
│                                    │
│         [Apply]  [Reset]           │
│                                    │
│                              [»]   │
└────────────────────────────────────┘

Right Sidebar - BOM Panel:

┌────────────────────────────────────┐
│ Properties | Calc | BOM | Notes    │
├────────────────────────────────────┤
│ Bill of Materials                  │
│ ──────────────────                 │
│ [Search] [Filter ▼] [Export]      │
│                                    │
│ Item           Qty  Unit   Total   │
│ ────────────────────────────────   │
│ AHU - York      2   $3,450 $6,900  │
│ VAV Box         5   $875   $4,375  │
│ Exhaust Fan     3   $420   $1,260  │
│ Ductwork       120  $45    $5,400  │
│                                    │
│ ────────────────────────────────   │
│ Grand Total:              $17,935  │
│                                    │
└────────────────────────────────────┘
```

**User Feedback:**
- Tab organization separates different information types
- Properties update immediately on selection
- Calculations show live results
- BOM provides comprehensive material list
- Notes enable project documentation
- Collapse maximizes canvas when panels not needed

**Related Elements:**
- Components: `RightSidebar`, `PropertiesPanel`, `CalculationsPanel`, `BOMPanel`, `NotesPanel`
- Stores: `EntityStore`, `BOMStore`, `NotesStore`, `LayoutStore`
- Services: `PropertyService`, `CalculationService`, `BOMService`

### Step 5: Using the Toolbar and Accessing Tools

**User Actions:**
1. User examines the toolbar below the header
2. User identifies tool groups and organization
3. User clicks on drawing tools to activate them
4. User uses undo/redo buttons
5. User adjusts zoom level
6. User toggles grid visibility
7. User accesses quick actions

**System Response:**
1. System displays toolbar organized into logical groups:

   **Group 1: Drawing Tools (Left)**
   - Select Tool (cursor icon) - Default active
   - Line Tool (line icon)
   - Duct Tool (duct icon)
   - Equipment Tool (component icon)
   - Annotation Tool (text icon)
   - Delete Tool (trash icon)

   **Group 2: Edit Operations (Center-Left)**
   - Undo (↶ icon) - Ctrl+Z
   - Redo (↷ icon) - Ctrl+Shift+Z
   - Disabled state shown when no actions to undo/redo

   **Group 3: View Controls (Center-Right)**
   - Zoom Out (-) button
   - Zoom level display: "100%" (clickable dropdown)
   - Zoom In (+) button
   - Fit to Screen (⛶ icon)
   - Grid Toggle (# icon) - Active/inactive states

   **Group 4: Quick Actions (Right)**
   - Auto-Route (⚡ icon) - Automatic duct routing
   - Calculate (Σ icon) - Run calculations
   - Generate BOM (📋 icon) - Update BOM
   - Export (⬆ icon) - Quick export

2. When user clicks a tool:
   - System highlights active tool with background color
   - System changes cursor to tool-specific cursor on canvas
   - System deactivates previously active tool
   - System displays tool-specific instructions in status bar

3. When user clicks undo/redo:
   - System executes undo/redo operation
   - System updates canvas immediately
   - System updates undo/redo button disabled states
   - System shows toast: "Undone: Place AHU"

4. When user adjusts zoom:
   - +/- buttons: Change zoom by 10% increments
   - Zoom dropdown: Select from preset values (25%, 50%, 75%, 100%, 150%, 200%)
   - Fit to Screen: Calculates zoom to fit all entities
   - Mouse wheel: Zoom at cursor position (if enabled in settings)

5. When user toggles grid:
   - System shows/hides grid overlay on canvas
   - Button shows active state (highlighted) when grid visible
   - Grid settings accessible via button right-click menu

**Visual State:**

```
Toolbar - Full Layout:

┌───────────────────────────────────────────────────────────┐
│ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ │ ┌─┐ ┌─┐ │ ┌─┐ ┌─────┐ ┌─┐ ┌─┐│
│ │▌│ │/│ │═│ │□│ │A│ │🗑│ │ │↶│ │↷│ │ │-│ │100%▼│ │+│ │⛶││
│ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ │ └─┘ └─┘ │ └─┘ └─────┘ └─┘ └─┘│
│  Select  Line Duct Equip │ Undo Redo│ Zoom Controls       │
│         Tools             │  Edit    │                     │
│                                                            │
│ ┌─┐ │ ┌─┐ ┌─┐ ┌─┐ ┌─┐                                    │
│ │#│ │ │⚡│ │Σ│ │📋│ │⬆│                                    │
│ └─┘ │ └─┘ └─┘ └─┘ └─┘                                    │
│ Grid│  Auto Calc BOM Export                               │
│     │  Quick Actions                                      │
└───────────────────────────────────────────────────────────┘

Tool Active State:

┌───────────────────────────────────────────────────────────┐
│ ┌─┐ ┌───┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐                                │
│ │▌│ │═══│ │□│ │A│ │🗑│ │↶│                                │
│ └─┘ └───┘ └─┘ └─┘ └─┘ └─┘                                │
│      ↑                                                    │
│   Active tool (highlighted background)                    │
└───────────────────────────────────────────────────────────┘
```

**User Feedback:**
- Visual grouping organizes related tools
- Active tool clearly highlighted
- Tooltips on hover explain each tool
- Disabled states prevent invalid actions
- Quick actions provide one-click access to common operations

**Related Elements:**
- Components: `Toolbar`, `ToolButton`, `ZoomControl`, `GridToggle`
- Stores: `ToolStore` (active tool), `ViewportStore` (zoom, grid)
- Services: `ToolService`, `ZoomService`

## 5. Edge Cases and Handling

### Edge Case 1: Narrow Screen Width (< 1024px)

**Scenario:**
User opens application on laptop or tablet with screen width less than 1024px, causing layout constraints.

**Handling:**
1. System detects viewport width < 1024px
2. System applies responsive layout adjustments:
   - Both sidebars auto-collapse to maximize canvas space
   - Toolbar groups may stack or compress based on available space
   - Status bar displays only critical info (zoom, entity count)
   - Project name in header may truncate with ellipsis
3. System displays notification: "Sidebars auto-collapsed for small screen"
4. System allows manual sidebar expansion (overlays canvas instead of pushing)
5. System shows mobile-optimized touch targets (larger buttons)
6. System saves responsive state separately from user preferences
7. System restores full layout when viewport expands > 1024px

**User Impact:**
- Low: Application remains functional with optimized layout
- Canvas area maximized for primary work
- Sidebars accessible but non-intrusive

### Edge Case 2: Very Large Entity Count (500+ items)

**Scenario:**
User loads project with 500+ entities, potentially causing performance issues in sidebar and property panels.

**Handling:**
1. System detects high entity count during project load
2. System applies performance optimizations:
   - Left sidebar: Virtualized scrolling for equipment list
   - Right sidebar: Lazy load property panels (render only when visible)
   - BOM panel: Paginate results (50 items per page)
   - Layers panel: Show only top-level layers initially
3. System displays performance indicator: "Large project loaded (512 entities)"
4. System enables "Performance Mode" automatically:
   - Simplify entity rendering (reduce detail)
   - Limit undo history to last 50 actions
   - Disable real-time BOM updates (manual refresh)
5. System provides toggle to disable performance mode if desired
6. System warns before operations that may be slow: "Calculating BOM for 512 entities..."

**User Impact:**
- Medium: Some features simplified for performance
- Core functionality maintained
- User can override performance mode if needed

### Edge Case 3: Keyboard Navigation While Dialog Open

**Scenario:**
User opens a modal dialog (e.g., Export dialog) and attempts to use keyboard shortcuts that would normally affect canvas (e.g., Ctrl+Z for undo).

**Handling:**
1. System detects modal dialog is open
2. System temporarily disables canvas-specific keyboard shortcuts
3. System focuses keyboard input to dialog
4. System trap focus within dialog (Tab cycles through dialog elements only)
5. System maps Esc key to close dialog
6. System maps Enter key to confirm dialog primary action
7. When dialog closes:
   - System restores canvas keyboard shortcuts
   - System returns focus to canvas or previously focused element
8. System shows visual focus indicator for keyboard users
9. System maintains keyboard shortcut context stack for nested dialogs

**User Impact:**
- Low: Keyboard shortcuts work contextually and predictably
- Focus management prevents accidental actions
- Esc key provides consistent dialog dismissal

### Edge Case 4: Sidebar Collapsed State Not Persisting

**Scenario:**
User collapses sidebars and reloads application, but sidebars reset to expanded state instead of remembering collapsed preference.

**Handling:**
1. System detects issue: LayoutStore not persisting to localStorage
2. System implements robust persistence:
   - Save sidebar states on every collapse/expand action
   - Debounce saves (500ms) to prevent excessive writes
   - Validate saved state on load
   - Fallback to defaults if saved state invalid
3. System provides "Reset Layout" option in View menu:
   - Restores default sidebar states
   - Clears saved preferences
   - Useful if layout becomes corrupted
4. System logs persistence errors for debugging
5. System displays warning if localStorage unavailable: "Layout preferences will not be saved"

**User Impact:**
- Low: Layout preferences remember correctly across sessions
- Reset option provides recovery if needed
- Warning informs user of limitations

### Edge Case 5: Conflicting Keyboard Shortcuts

**Scenario:**
Browser or OS keyboard shortcut conflicts with application shortcut (e.g., Ctrl+W closes browser tab instead of closing project).

**Handling:**
1. System detects browser environment and known conflicts
2. System provides alternative shortcuts for conflicting actions:
   - Close Project: Ctrl+W (may conflict) → Alternative: Ctrl+Alt+W
   - Print: Ctrl+P (browser) → Alternative: Ctrl+Shift+P
3. System displays shortcut conflict warning on first use:
   - "Ctrl+W may close your browser tab. Use Ctrl+Alt+W to close project."
   - Checkbox: "Don't show again"
4. System allows custom shortcut mapping in settings:
   - Users can rebind conflicting shortcuts
   - Validation prevents duplicate bindings
5. System prevents default browser behavior for mapped shortcuts:
   - `event.preventDefault()` for captured shortcuts
   - Only for shortcuts explicitly used by application
6. System provides "Restore Default Shortcuts" option

**User Impact:**
- Medium: Awareness of conflicts prevents frustration
- Alternative shortcuts provide workarounds
- Custom mapping enables personalization

## 6. Error Scenarios and Recovery

### Error Scenario 1: Sidebar Component Fails to Load

**Error Condition:**
Left or right sidebar component encounters JavaScript error during initialization and fails to render.

**System Detection:**
1. Error boundary catches sidebar component error
2. Error logged: "LeftSidebar component failed to render: [error details]"
3. Console error with full stack trace

**Error Message:**
```
Title: Sidebar Unavailable
Message: The sidebar could not be loaded due to an unexpected error. Some features may be unavailable.
Error Code: ERR_SIDEBAR_LOAD_FAILED
```

**Recovery Steps:**
1. System displays error boundary fallback UI in sidebar region:
   - Shows error icon and message
   - Provides "Retry" button to attempt re-render
   - Provides "Hide Sidebar" button to dismiss error area
2. System maintains canvas functionality (unaffected)
3. If user clicks "Retry":
   - System attempts to re-mount sidebar component
   - Success: Sidebar renders normally
   - Failure: Shows error again with "Report Issue" link
4. If user clicks "Hide Sidebar":
   - System collapses failed sidebar area
   - System marks sidebar as unavailable in LayoutStore
   - User can manually expand later to retry
5. System sends error report to logging service with:
   - Error details and stack trace
   - Browser and device information
   - Sidebar state data (if recoverable)

**User Recovery Actions:**
- Click "Retry" to attempt reload
- Hide sidebar and continue working on canvas
- Refresh entire application if issue persists
- Report issue with error code for support

**Prevention:**
- Robust error boundaries around all major components
- Validate sidebar data before rendering
- Graceful degradation if data unavailable

### Error Scenario 2: Navigation Route Not Found

**Error Condition:**
User navigates to non-existent route (e.g., manually types invalid URL `/canvas/invalid-id`).

**System Detection:**
1. Router detects no matching route for requested path
2. ProjectService.loadProject() returns null for invalid ID
3. 404 error logged with requested path

**Error Message:**
```
Title: Project Not Found
Message: The requested project could not be found. It may have been deleted or you may not have access.
Error Code: ERR_PROJECT_NOT_FOUND
```

**Recovery Steps:**
1. System displays 404 error page with helpful information:
   - Clear message explaining project not found
   - Possible reasons: deleted, invalid link, no access
   - Suggested actions shown
2. System provides recovery options:
   - **Primary**: "Go to Dashboard" button
   - **Secondary**: "Search Projects" - Opens search dialog
   - **Tertiary**: "Recent Projects" - Shows recent list
3. If user clicks "Go to Dashboard":
   - System navigates to /dashboard route
   - System displays all available projects
4. If user clicks "Search Projects":
   - System opens search modal overlay
   - User can search by name or filter
   - Selecting result navigates to that project
5. System tracks 404 errors for analytics (identify broken links)
6. System updates browser history to prevent back button returning to 404

**User Recovery Actions:**
- Navigate to Dashboard to find project
- Use search to locate project if renamed
- Check recent projects list
- Contact support if project should be accessible

**Prevention:**
- Validate project IDs before generating links
- Soft delete projects (move to trash) instead of hard delete
- Maintain project ID mapping when migrating data

### Error Scenario 3: Keyboard Shortcut Not Responding

**Error Condition:**
User presses keyboard shortcut but expected action doesn't occur (e.g., Ctrl+Z doesn't undo).

**System Detection:**
1. Keyboard event captured by browser
2. Event handler receives event
3. Handler determines action should execute
4. Action execution fails or is blocked
5. No error thrown (silent failure)

**Error Message:**
```
Status Bar Message: "Undo unavailable - no actions to undo"
OR
Toast Notification: "Cannot execute action - project is read-only"
```

**Recovery Steps:**
1. System determines why shortcut didn't execute:

   **Case A: No actions to undo/redo**
   - Display status message: "Nothing to undo"
   - No error - expected behavior

   **Case B: Focus in input field**
   - Keyboard event captured by input, not reaching app handler
   - Expected behavior - typing in input
   - No recovery needed

   **Case C: Dialog/modal open**
   - Shortcuts disabled while modal active
   - Status message: "Shortcuts disabled while dialog open"
   - Close dialog to re-enable shortcuts

   **Case D: Shortcut handler error**
   - Action execution threw exception
   - Error logged with details
   - Toast: "An error occurred. Please try again."
   - Provide "Report Issue" button

2. System provides debugging information in developer mode:
   - Console log of keyboard events
   - Shortcut bindings currently active
   - Focus element and event target

3. System maintains shortcut help dialog (Ctrl+/):
   - Lists all available shortcuts
   - Shows context-specific shortcuts
   - Indicates which shortcuts currently available

**User Recovery Actions:**
- Check shortcut help dialog (Ctrl+/) to verify binding
- Ensure no modal dialogs blocking shortcuts
- Click out of input fields to enable global shortcuts
- Try alternative method (menu or button click)
- Report persistent issues with error details

**Prevention:**
- Comprehensive event handling with error catching
- Clear status messages for shortcut state
- Visual feedback when shortcuts execute
- Shortcut availability indicators in UI

## 7. Keyboard Shortcuts

### Global Navigation

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Shift+D` | Go to Dashboard | Navigate to Dashboard from anywhere |
| `Ctrl+,` | Open Settings | Opens settings dialog |
| `Ctrl+/` | Show Keyboard Shortcuts | Displays complete shortcut reference |
| `Ctrl+H` | Toggle History Panel | Shows/hides edit history panel |
| `F11` | Toggle Fullscreen | Fullscreen canvas mode |
| `Esc` | Close Modal/Deselect | Closes open dialog or clears selection |

### Sidebar and Panel Controls

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+B` | Toggle Left Sidebar | Show/hide equipment library sidebar |
| `Ctrl+Shift+B` | Toggle Right Sidebar | Show/hide properties sidebar |
| `Ctrl+P` | Open Properties | Switch to Properties tab in right sidebar |
| `Ctrl+Shift+P` | Open Calculations | Switch to Calculations tab |
| `Ctrl+M` | Open BOM | Switch to BOM tab |
| `Ctrl+Shift+N` | Open Notes | Switch to Notes tab |
| `Ctrl+L` | Toggle Layers Panel | Show/hide layers in left sidebar |

### Toolbar Actions

| Shortcut | Action | Context |
|----------|--------|---------|
| `V` | Select Tool | Activates selection tool |
| `L` | Line Tool | Activates line drawing tool |
| `D` | Duct Tool | Activates duct drawing tool |
| `E` | Equipment Tool | Opens equipment picker |
| `T` | Annotation Tool | Activates text annotation tool |
| `Del` / `Backspace` | Delete Tool | Activates delete tool or deletes selection |
| `Ctrl+Z` | Undo | Undo last action |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo | Redo previously undone action |
| `Ctrl+0` | Zoom to 100% | Reset zoom to actual size |
| `Ctrl++` / `Ctrl+=` | Zoom In | Increase zoom level by 10% |
| `Ctrl+-` | Zoom Out | Decrease zoom level by 10% |
| `Ctrl+Shift+F` | Fit to Screen | Zoom to fit all entities |
| `Ctrl+G` | Toggle Grid | Show/hide canvas grid |

### Focus Navigation

| Shortcut | Action | Context |
|----------|--------|---------|
| `Tab` | Next Element | Move focus to next interactive element |
| `Shift+Tab` | Previous Element | Move focus to previous interactive element |
| `Alt+1` | Focus Left Sidebar | Jump focus to left sidebar |
| `Alt+2` | Focus Canvas | Jump focus to canvas area |
| `Alt+3` | Focus Right Sidebar | Jump focus to right sidebar |
| `Alt+4` | Focus Toolbar | Jump focus to toolbar |

**Note:** All shortcuts respect modal dialog context and input field focus. Press `Ctrl+/` anytime to view context-specific shortcuts.

## 8. Related Elements

### Components
- `AppLayout`: Main application layout wrapper
  - Location: `src/components/layout/AppLayout.tsx`
  - Props: `children`, `showSidebars`, `layoutMode`

- `Header`: Top application header with navigation
  - Location: `src/components/layout/Header.tsx`
  - Props: `projectName`, `breadcrumb`, `onNavigate`

- `Toolbar`: Tool selection and quick actions bar
  - Location: `src/components/layout/Toolbar.tsx`
  - Props: `activeTool`, `onToolSelect`, `canUndo`, `canRedo`

- `LeftSidebar`: Equipment library and layers
  - Location: `src/components/layout/LeftSidebar.tsx`
  - Props: `activeTab`, `collapsed`, `onToggle`

- `RightSidebar`: Properties, calculations, BOM, notes
  - Location: `src/components/layout/RightSidebar.tsx`
  - Props: `activeTab`, `collapsed`, `selectedEntity`

- `StatusBar`: Bottom status information bar
  - Location: `src/components/layout/StatusBar.tsx`
  - Props: `cursorPos`, `zoom`, `entityCount`, `connectionStatus`

- `Breadcrumb`: Navigation breadcrumb component
  - Location: `src/components/navigation/Breadcrumb.tsx`
  - Props: `path`, `onNavigate`

- `KeyboardShortcutDialog`: Shortcut reference dialog
  - Location: `src/components/help/KeyboardShortcutDialog.tsx`
  - Props: `onClose`, `filterByContext`

### Zustand Stores
- `LayoutStore`: UI layout state management
  - Location: `src/stores/LayoutStore.ts`
  - State: `leftSidebarCollapsed`, `rightSidebarCollapsed`, `activeLeftTab`, `activeRightTab`
  - Actions: `toggleLeftSidebar()`, `toggleRightSidebar()`, `setActiveTab()`

- `ToolStore`: Active tool and toolbar state
  - Location: `src/stores/ToolStore.ts`
  - State: `activeTool`, `toolOptions`
  - Actions: `setActiveTool()`, `updateToolOptions()`

- `ViewportStore`: Canvas viewport state
  - Location: `src/stores/ViewportStore.ts`
  - State: `zoom`, `panOffset`, `gridVisible`, `gridSize`
  - Actions: `setZoom()`, `toggleGrid()`, `fitToScreen()`

- `AppStateStore`: Global application state
  - Location: `src/stores/AppStateStore.ts`
  - State: `currentRoute`, `navigationHistory`, `isFullscreen`
  - Actions: `navigate()`, `goBack()`, `toggleFullscreen()`

### Hooks
- `useLayout`: Layout state and control
  - Location: `src/hooks/useLayout.ts`
  - Returns: `leftSidebarCollapsed`, `rightSidebarCollapsed`, `toggleLeftSidebar()`, `toggleRightSidebar()`

- `useKeyboardShortcuts`: Keyboard shortcut handling
  - Location: `src/hooks/useKeyboardShortcuts.ts`
  - Returns: `registerShortcut()`, `unregisterShortcut()`, `activeShortcuts`

- `useNavigation`: Routing and navigation
  - Location: `src/hooks/useNavigation.ts`
  - Returns: `navigate()`, `goBack()`, `currentRoute`, `canGoBack`

- `useToolbar`: Toolbar state management
  - Location: `src/hooks/useToolbar.ts`
  - Returns: `activeTool`, `selectTool()`, `canUndo`, `canRedo`, `undo()`, `redo()`

- `useResponsiveLayout`: Responsive behavior
  - Location: `src/hooks/useResponsiveLayout.ts`
  - Returns: `isMobile`, `isTablet`, `isDesktop`, `screenWidth`, `adaptLayout()`

### Services
- `LayoutService`: Layout management logic
  - Location: `src/services/LayoutService.ts`
  - Methods: `saveLayoutPreferences()`, `loadLayoutPreferences()`, `resetLayout()`

- `RouterService`: Application routing
  - Location: `src/services/RouterService.ts`
  - Methods: `navigate()`, `getRoute()`, `registerRoute()`, `handleNotFound()`

- `KeyboardService`: Keyboard event handling
  - Location: `src/services/KeyboardService.ts`
  - Methods: `registerShortcut()`, `handleKeyEvent()`, `getShortcutsByContext()`

- `ZoomService`: Zoom and viewport calculations
  - Location: `src/services/ZoomService.ts`
  - Methods: `setZoom()`, `zoomIn()`, `zoomOut()`, `fitToScreen()`, `zoomToPoint()`

## 9. Visual Diagrams

### Complete Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                          HEADER (50px)                          │
│ ┌────┐                                                          │
│ │Logo│ Breadcrumb    [File] [Edit] [View] [Tools] [Help]  [⚙]  │
│ └────┘                                                          │
├─────────────────────────────────────────────────────────────────┤
│                         TOOLBAR (45px)                          │
│ [Tools...] │ [Undo] [Redo] │ [Zoom Controls] │ [Quick Actions]│
├──────┬──────────────────────────────────────────────────┬───────┤
│      │                                                  │       │
│ LEFT │                  CANVAS AREA                     │ RIGHT │
│ SIDE │                  (Flexible)                      │ SIDE  │
│ BAR  │                                                  │ BAR   │
│      │                                                  │       │
│ 280px│              Main Workspace                      │ 320px │
│      │                                                  │       │
│      │                                                  │       │
│ [Eq] │                                                  │ [Prop]│
│ [Ly] │                                                  │ [Calc]│
│ [Re] │                                                  │ [BOM] │
│      │                                                  │ [Note]│
│  [<] │                                                  │  [>]  │
├──────┴──────────────────────────────────────────────────┴───────┤
│                       STATUS BAR (30px)                         │
│ X:1250, Y:680 │ Zoom: 100% │ Grid: On │ 12 items │ ● Online   │
└─────────────────────────────────────────────────────────────────┘
```

### Navigation Flow

```
┌──────────────┐
│ Application  │
│    Launch    │
└──────┬───────┘
       │
       v
  ┌─────────┐
  │First    │
  │Launch?  │
  └────┬────┘
       │
  ┌────┴────┐
  │         │
Yes│       No│
  │         │
  v         v
┌────────┐ ┌──────────┐
│Welcome │ │Dashboard │
│Screen  │ │  Page    │
└────┬───┘ └────┬─────┘
     │          │
     v          │
┌─────────┐     │
│Tutorial │     │
│Optional │     │
└────┬────┘     │
     │          │
     v          │
┌────────────┐  │
│Project     │  │
│Creation    │  │
└──────┬─────┘  │
       │        │
       └────┬───┘
            │
            v
     ┌────────────┐
     │Open/Create │
     │ Project    │
     └──────┬─────┘
            │
            v
     ┌────────────┐
     │Canvas Page │
     │            │
     └────────────┘
            │
     ┌──────┴────────┐
     │               │
Logo Click      Ctrl+Shift+D
File > Dashboard
     │               │
     └───────┬───────┘
             │
             v
      ┌────────────┐
      │Dashboard   │
      │   Page     │
      └────────────┘
```

### Sidebar Collapse Behavior

```
Expanded State (Default):

┌────────────┬──────────────────┬────────────┐
│            │                  │            │
│  Equipment │                  │ Properties │
│  Library   │                  │   Panel    │
│            │                  │            │
│  [AHU]     │     CANVAS       │  Name: []  │
│  [VAV]     │                  │  CFM:  []  │
│  [Fan]     │                  │            │
│            │                  │            │
│      [«]   │                  │   [»]      │
│  (280px)   │                  │  (320px)   │
└────────────┴──────────────────┴────────────┘

Collapsed State:

┌──┬──────────────────────────────────┬──┐
│E │                                  │P │
│q │                                  │r │
│u │                                  │o │
│i │                                  │p │
│p │                                  │s │
│  │          CANVAS                  │  │
│L │      (Maximized)                 │C │
│a │                                  │a │
│y │                                  │l │
│  │                                  │c │
│R │                                  │  │
│e │                                  │B │
│  │                                  │O │
││»││                                  ││«││
│40│                                  │40│
│px│                                  │px│
└──┴──────────────────────────────────┴──┘

Partially Collapsed (Left Only):

┌──┬──────────────────────┬────────────┐
│E │                      │            │
│q │                      │ Properties │
│u │                      │   Panel    │
│i │                      │            │
│p │      CANVAS          │  Name: []  │
│  │   (More Space)       │  CFM:  []  │
│L │                      │            │
│a │                      │            │
│y │                      │            │
│  │                      │            │
│R │                      │            │
│e │                      │            │
││»││                      │   [»]      │
│40│                      │  (320px)   │
└──┴──────────────────────┴────────────┘
```

### Keyboard Focus Flow

```
Tab Navigation Order:

Header → Toolbar → Left Sidebar → Canvas → Right Sidebar → Status Bar
  ↓         ↓          ↓            ↓           ↓              ↓
[Logo]   [Tools]  [Search]      [Entities]  [Props]      [Zoom Info]
[Menu]   [Undo]   [Categories]  [Selection] [Tabs]
[Settings][Redo]  [Tabs]                    [Inputs]

Alt+1: Jump to Left Sidebar
Alt+2: Jump to Canvas
Alt+3: Jump to Right Sidebar
Alt+4: Jump to Toolbar

Shift+Tab: Reverse direction
Esc: Clear focus / Close modal
```

## 10. Testing

### Unit Tests

**LayoutStore Tests:**
```
describe('LayoutStore', () => {
  test('toggleLeftSidebar toggles collapsed state')
  test('toggleRightSidebar toggles collapsed state')
  test('setActiveTab updates active tab for correct sidebar')
  test('sidebar states persist to localStorage')
  test('loadLayoutPreferences restores saved states')
  test('resetLayout restores default configuration')
  test('handles invalid saved state gracefully')
})
```

**KeyboardService Tests:**
```
describe('KeyboardService', () => {
  test('registerShortcut adds shortcut to registry')
  test('handleKeyEvent triggers correct action for shortcut')
  test('handleKeyEvent ignores shortcuts when modal open')
  test('handleKeyEvent ignores shortcuts when input focused')
  test('getShortcutsByContext returns context-specific shortcuts')
  test('conflicting shortcuts show warning')
  test('preventDefault called for registered shortcuts')
})
```

**RouterService Tests:**
```
describe('RouterService', () => {
  test('navigate changes current route')
  test('navigate updates browser history')
  test('handleNotFound displays 404 page for invalid routes')
  test('getRoute returns correct route configuration')
  test('navigation history tracks visited routes')
  test('goBack navigates to previous route')
})
```

### Integration Tests

**Sidebar Toggle Integration:**
```
describe('Sidebar Toggle Integration', () => {
  test('clicking collapse button collapses left sidebar')
  test('clicking expand button expands left sidebar')
  test('Ctrl+B keyboard shortcut toggles left sidebar')
  test('Ctrl+Shift+B keyboard shortcut toggles right sidebar')
  test('collapsed state persists across page refresh')
  test('sidebar content maintains state when toggling')
  test('canvas resizes appropriately when sidebar toggles')
})
```

**Navigation Integration:**
```
describe('Navigation Integration', () => {
  test('clicking logo navigates to Dashboard')
  test('File > Dashboard menu navigates to Dashboard')
  test('Ctrl+Shift+D shortcut navigates to Dashboard')
  test('opening project navigates to Canvas with correct ID')
  test('browser back button navigates to previous page')
  test('breadcrumb clicking navigates to Dashboard')
  test('navigation auto-saves project changes')
})
```

**Tool Selection Integration:**
```
describe('Tool Selection Integration', () => {
  test('clicking tool button activates tool')
  test('keyboard shortcut activates correct tool')
  test('only one tool active at a time')
  test('active tool shows highlighted state')
  test('cursor changes to tool-specific cursor on canvas')
  test('status bar displays tool instructions')
  test('ESC key deselects tool')
})
```

### End-to-End Tests

**Complete Interface Navigation:**
```
test('E2E: Navigate application interface', async () => {
  // 1. Start at Dashboard
  await page.goto('http://localhost:3000/dashboard')
  await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible()

  // 2. Verify layout regions present
  await expect(page.locator('[data-testid="header"]')).toBeVisible()
  await expect(page.locator('[data-testid="project-grid"]')).toBeVisible()
  await expect(page.locator('[data-testid="status-bar"]')).toBeVisible()

  // 3. Open project
  await page.click('[data-testid="project-card"]', { hasText: 'Office HVAC' })
  await expect(page).toHaveURL(/\/canvas\//)

  // 4. Verify Canvas layout regions
  await expect(page.locator('[data-testid="toolbar"]')).toBeVisible()
  await expect(page.locator('[data-testid="left-sidebar"]')).toBeVisible()
  await expect(page.locator('[data-testid="canvas-area"]')).toBeVisible()
  await expect(page.locator('[data-testid="right-sidebar"]')).toBeVisible()

  // 5. Toggle left sidebar
  await page.click('[data-testid="left-sidebar-toggle"]')
  await expect(page.locator('[data-testid="left-sidebar"]')).toHaveClass(/collapsed/)

  // 6. Use keyboard shortcut to expand
  await page.keyboard.press('Control+b')
  await expect(page.locator('[data-testid="left-sidebar"]')).not.toHaveClass(/collapsed/)

  // 7. Switch right sidebar tabs
  await page.click('[data-testid="tab-bom"]')
  await expect(page.locator('[data-testid="bom-panel"]')).toBeVisible()

  // 8. Select tool from toolbar
  await page.click('[data-testid="tool-duct"]')
  await expect(page.locator('[data-testid="tool-duct"]')).toHaveClass(/active/)

  // 9. Navigate back to Dashboard via breadcrumb
  await page.click('[data-testid="breadcrumb-dashboard"]')
  await expect(page).toHaveURL('/dashboard')

  // 10. Verify layout states persisted
  await page.click('[data-testid="project-card"]', { hasText: 'Office HVAC' })
  await expect(page.locator('[data-testid="left-sidebar"]')).not.toHaveClass(/collapsed/)
})
```

## 11. Common Pitfalls and Solutions

### Pitfall 1: Sidebar Toggle State Desync

**Problem:**
Sidebar collapse button state doesn't match actual sidebar collapsed state, causing confusion (button shows expand icon but sidebar is already expanded).

**Why It Happens:**
- State updated in LayoutStore but component doesn't re-render
- Multiple sources of truth for collapsed state
- CSS transition not completing before state check

**Solution:**
- Use single source of truth: LayoutStore
- Subscribe components to store state properly
- Use store state for both CSS class and button icon
- Wait for CSS transition to complete before considering toggle done
- Add visual feedback during transition (animation)

**Implementation:**
```
const { leftSidebarCollapsed, toggleLeftSidebar } = useLayoutStore()

return (
  <button onClick={toggleLeftSidebar}>
    {leftSidebarCollapsed ? <ExpandIcon /> : <CollapseIcon />}
  </button>
)

// CSS ensures visual state matches store state
<div className={leftSidebarCollapsed ? 'sidebar collapsed' : 'sidebar'}>
```

### Pitfall 2: Keyboard Shortcuts Fire Multiple Times

**Problem:**
Pressing keyboard shortcut once triggers action multiple times (e.g., Ctrl+Z undoes 3 actions instead of 1).

**Why It Happens:**
- Event listener registered multiple times
- No debouncing on keyboard events
- Key repeat from holding down key
- Event bubbling triggers multiple handlers

**Solution:**
- Register keyboard listeners once at app level
- Use event.preventDefault() to stop propagation
- Debounce rapid key events (50ms)
- Use keydown, not keypress (fires once per key press)
- Unregister listeners on component unmount
- Check event.repeat property to ignore key holds

**Implementation:**
```
useEffect(() => {
  const handleKeyDown = (event) => {
    if (event.repeat) return // Ignore key holds

    if (event.ctrlKey && event.key === 'z') {
      event.preventDefault()
      undo() // Fires once
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

### Pitfall 3: Canvas Doesn't Resize When Sidebar Toggles

**Problem:**
Toggling sidebar collapses/expands it, but canvas area doesn't resize to fill available space, leaving white gaps or cutting off content.

**Why It Happens:**
- Canvas size hardcoded instead of responsive
- No ResizeObserver watching container size changes
- CSS Flexbox/Grid not properly configured
- Canvas element not redrawing on size change

**Solution:**
- Use CSS Flexbox or Grid for responsive layout
- Canvas area should have `flex: 1` to fill space
- Implement ResizeObserver to detect container size changes
- Trigger canvas redraw when size changes
- Debounce resize events (150ms) for performance

**Implementation:**
```
// CSS
.layout {
  display: flex;
}
.sidebar { flex: 0 0 280px; } // Fixed width
.canvas-area { flex: 1; } // Fill remaining space

// JavaScript
const canvasContainer = useRef()
useEffect(() => {
  const observer = new ResizeObserver(debounce(() => {
    resizeCanvas() // Trigger canvas redraw
  }, 150))

  observer.observe(canvasContainer.current)
  return () => observer.disconnect()
}, [])
```

### Pitfall 4: Navigation Loses Unsaved Changes

**Problem:**
User makes changes on Canvas, navigates to Dashboard, and loses all unsaved work without warning.

**Why It Happens:**
- No navigation guard checking for unsaved changes
- Auto-save not triggering before navigation
- No confirmation dialog on navigation with changes

**Solution:**
- Implement navigation guard that checks for unsaved changes
- Show confirmation dialog: "You have unsaved changes. Save before leaving?"
- Provide options: Save and Leave, Leave Without Saving, Cancel
- Trigger auto-save before navigation (wait for completion)
- Track dirty state in ProjectStore
- Use browser beforeunload event for page refresh/close

**Implementation:**
```
const navigate = useNavigation()
const { hasUnsavedChanges, save } = useProjectStore()

const handleNavigate = async (destination) => {
  if (hasUnsavedChanges) {
    const result = await showConfirmDialog({
      title: 'Unsaved Changes',
      message: 'Save changes before leaving?',
      options: ['Save and Leave', 'Leave Without Saving', 'Cancel']
    })

    if (result === 'Cancel') return
    if (result === 'Save and Leave') await save()
  }

  navigate(destination)
}
```

### Pitfall 5: Status Bar Information Stale

**Problem:**
Status bar shows outdated information (e.g., entity count shows 12 but actual count is 15 after adding entities).

**Why It Happens:**
- Status bar not subscribed to EntityStore changes
- No event triggering status bar update
- Update logic has race condition
- Memoization caching stale values

**Solution:**
- Subscribe status bar to relevant stores (EntityStore, ViewportStore)
- Update status bar on all relevant events
- Use reactive state management (Zustand subscriptions)
- Clear memoization cache when data changes
- Ensure updates are synchronous or properly awaited

**Implementation:**
```
// Status bar subscribes to stores
const { entities } = useEntityStore()
const { zoom, cursorPos } = useViewportStore()
const { isOnline } = useConnectionStore()

// Auto-updates when store state changes
return (
  <StatusBar>
    <span>X: {cursorPos.x}, Y: {cursorPos.y}</span>
    <span>Zoom: {zoom}%</span>
    <span>{entities.length} items</span>
    <span>{isOnline ? '● Online' : '○ Offline'}</span>
  </StatusBar>
)
```

## 12. Performance Tips

### Tip 1: Virtualize Long Lists in Sidebars

Use virtual scrolling for equipment library and layers panel to render only visible items, not entire list.

**Implementation:**
- Use react-window or react-virtualized library
- Render only items in viewport + small buffer
- Calculate item heights for accurate scrollbar

**Impact:** Equipment library with 200+ items renders 60fps scrolling vs. laggy without virtualization

### Tip 2: Debounce Sidebar Resize Events

Debounce sidebar collapse/expand animations to prevent rapid toggling causing performance issues.

**Implementation:**
- Debounce toggle function by 50ms
- Use CSS transitions for smooth animation
- Disable pointer events during transition

**Impact:** Prevents jank from rapid clicking, maintains 60fps animation

### Tip 3: Lazy Load Tab Content

Load tab content only when tab is activated, not all tabs on sidebar mount.

**Implementation:**
- Use conditional rendering: `{activeTab === 'bom' && <BOMPanel />}`
- Cache loaded tab content to avoid reload on switch
- Preload next likely tab in background

**Impact:** Initial sidebar load 3x faster, reduced memory usage

### Tip 4: Optimize Canvas Redraw on Resize

Don't redraw entire canvas on every pixel of resize; debounce resize events and batch redraws.

**Implementation:**
- Debounce resize events by 150ms
- Use requestAnimationFrame for redraws
- Only redraw visible viewport, not entire scene

**Impact:** Smooth resize without dropped frames, 60fps maintained

### Tip 5: Cache Keyboard Shortcut Bindings

Build keyboard shortcut map once on initialization instead of checking on every keypress.

**Implementation:**
- Create shortcut registry Map on app init
- Map key combinations to handlers
- O(1) lookup on keypress vs. O(n) array iteration

**Impact:** Keyboard shortcut response time: <5ms vs. 20-50ms for complex apps

## 13. Future Enhancements

1. **Customizable Layout Presets**: Allow users to save and switch between layout configurations (e.g., "Focused Design" with collapsed sidebars, "Full Detail" with all panels visible)

2. **Floating Panels**: Detach panels from sidebars to float as independent windows, useful for multi-monitor setups

3. **Workspace Tabs**: Multiple canvas tabs within single window to work on multiple projects simultaneously

4. **Command Palette**: Cmd+K style command palette for quick access to all features without navigating menus

5. **Adaptive Sidebar Width**: Smart sidebar resizing based on content (e.g., wider when long equipment names, narrower for icons only)

6. **Contextual Toolbars**: Show different toolbar layouts based on selected entity type or active workflow

7. **Mini-Map Navigation**: Small overview map of entire canvas in corner for quick navigation in large projects

8. **Breadcrumb Actions**: Right-click breadcrumb items for quick actions (e.g., recent projects, project actions)

9. **Status Bar Customization**: Allow users to choose which information displays in status bar

10. **Gesture Navigation**: Touch gestures (swipe) and trackpad gestures for sidebar toggle, navigation, and canvas control
