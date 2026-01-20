# User Journey: First Launch Experience

## 1. Overview

### Purpose
This document describes the complete user experience when launching the HVAC Canvas App for the first time. The first launch introduces users to the application's core functionality through an intuitive onboarding flow, ensuring they understand the canvas-based design approach and can quickly start creating their first HVAC system layout.

### Scope
- Initial application launch and splash screen
- Welcome screen with application overview
- Quick Start tutorial walkthrough
- Template selection or blank canvas creation
- First-time user guidance and tooltips
- Initial settings configuration
- Creating the first project

### User Personas
- **Primary**: New HVAC designers with no prior experience using the application
- **Secondary**: Experienced HVAC professionals evaluating the tool for the first time
- **Tertiary**: Technical managers assessing the application for team adoption

### Success Criteria
- User successfully completes onboarding within 5 minutes
- User understands the canvas-based design approach
- User creates their first project (template or blank canvas)
- User knows where to find help and documentation
- User feels confident to start designing HVAC systems
- User has appropriate default settings configured

## 2. PRD References

### Related PRD Sections
- **Section 3.1: Canvas-Based Design Interface** - Core canvas interaction model
- **Section 3.2: Equipment Library** - Equipment selection and placement
- **Section 3.3: Connection Tools** - Connecting equipment with ductwork
- **Section 4.1: Project Management** - Creating and managing projects
- **Section 4.8: User Settings** - Default preferences and configuration
- **Section 5.1: User Interface Layout** - Application layout overview
- **Section 5.6: Onboarding & Help** - First-time user experience

### Key Requirements Addressed
- REQ-GS-001: Application must provide guided onboarding for first-time users
- REQ-GS-002: First launch must display welcome screen with overview
- REQ-GS-003: Quick Start tutorial must introduce core functionality
- REQ-GS-004: Users must be able to start from template or blank canvas
- REQ-GS-005: Default settings must be configured during first launch
- REQ-GS-006: Help resources must be clearly accessible
- REQ-GS-007: Onboarding must be skippable for experienced users
- REQ-GS-008: First project creation must be streamlined

## 3. Prerequisites

### User Prerequisites
- HVAC Canvas App installed on local machine or accessible via web browser
- Basic understanding of HVAC systems and components
- Familiarity with drag-and-drop interfaces (helpful but not required)
- Screen resolution of at least 1280x720 pixels recommended

### System Prerequisites
- Application successfully installed and configured
- All dependencies and libraries loaded
- localStorage available for persistence
- Network connectivity for template downloads (optional)
- Sufficient disk space for project files (minimum 100MB recommended)

### Data Prerequisites
- Built-in equipment library pre-loaded
- Sample templates available (optional)
- Default settings schema initialized
- Help documentation accessible

### Technical Prerequisites
- Browser: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- JavaScript enabled
- Canvas API support
- localStorage enabled
- No conflicting browser extensions

## 4. User Journey Steps

### Step 1: Application Launch and Splash Screen

**User Actions:**
1. User double-clicks the application icon or navigates to the web URL
2. User waits while the application loads
3. User observes splash screen with branding and progress indicator

**System Response:**
1. System displays splash screen with HVAC Canvas App logo
2. System loads core application modules and dependencies
3. System initializes stores (EntityStore, ViewportStore, SettingsStore, etc.)
4. System checks for first-time launch flag in local storage
5. System pre-loads equipment library and default templates
6. System validates browser compatibility and system requirements
7. System displays loading progress: "Loading equipment library... 60%"
8. System completes initialization within 2-3 seconds
9. System detects this is first launch (no `app.hasLaunched` flag in storage)
10. System transitions to Welcome Screen

**Visual State:**

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│         [Application Logo]                  │
│        (Gradient Background)                │
│             animate-in                      │
│                                             │
│         HVAC Canvas App                     │
│    Initializing canvas engine...            │
│       (Pulsing Animation)                   │
│                                             │
│  [━━━━━━━━━━━━━━━━━━━━━━○─────] 70%         │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**User Feedback:**
- Splash screen provides visual feedback that application is loading
- Progress bar shows loading completion percentage
- Loading messages indicate what's being initialized
- Premium branding establishes credibility

**Related Elements:**
- Components: `SplashScreen`, `Progress`, `Card`
- Services: `AppInitializer`
- Stores: `AppStateStore`

### Step 2: Welcome Screen Display

**User Actions:**
1. User reads welcome message and application overview
2. User reviews feature highlights (3-4 key features)
3. User decides whether to take Quick Start tutorial or skip
4. User clicks "Start Tutorial" or "Skip to App" button

**System Response:**
1. System displays Welcome Screen with animated entrance
2. System shows application title: "Welcome to HVAC Canvas App"
3. System displays tagline: "Design professional HVAC systems with ease"
4. System presents feature highlights with icons:
   - "Drag-and-drop canvas design"
   - "Automatic duct routing"
   - "Real-time calculations"
   - "Export to industry formats"
5. System shows two prominent action buttons:
   - Primary: "Start Quick Tutorial" (blue, recommended)
   - Secondary: "Skip and Explore" (ghost variant)
6. System displays checkbox: "Don't show this again"
7. System waits for user interaction
8. System tracks user's choice for analytics (tutorial vs. skip)

**Visual State:**

```
┌─────────────────────────────────────────────────────────┐
│ [Glassmorphism Card]                                    │
│                                                         │
│              Welcome to HVAC Canvas                     │
│    Design professional HVAC systems with ease...        │
│                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────┐     │
│  │   [Icon]      │  │   [Icon]      │  │  [Icon]  │ ... │
│  │  Drag-and-    │  │  Auto         │  │  Calc    │     │
│  │  drop         │  │  Routing      │  │          │     │
│  └───────────────┘  └───────────────┘  └──────────┘     │
│      (Hover^)           (Hover^)                        │
│                                                         │
│        ┌───────────────────────────────────┐            │
│        │      Start Quick Tutorial         │ (Primary)  │
│        └───────────────────────────────────┘            │
│        ┌───────────────────────────────────┐            │
│        │      Skip and Explore             │ (Ghost)    │
│        └───────────────────────────────────┘            │
│                                                         │
│  □ Don't show this again                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**User Feedback:**
- Splash screen provides visual feedback that application is loading
- Progress bar shows loading completion percentage
- Loading messages indicate what's being initialized
- Professional branding establishes credibility

**Related Elements:**
- Components: `SplashScreen`, `LoadingProgress`
- Services: `AppInitializer`, `StorageService`
- Stores: `AppStateStore`, `SettingsStore`

### Step 3: Quick Start Tutorial Walkthrough

**User Actions:**
1. User clicks "Start Quick Tutorial"
2. User follows interactive tutorial steps (5 steps total)
3. User performs guided actions on canvas:
   - Place equipment from library
   - Connect equipment with ducts
   - View properties panel
   - Navigate canvas (pan/zoom)
   - Access help resources
4. User clicks "Next" to progress through steps
5. User completes tutorial or clicks "Skip Tutorial" if desired

**System Response:**
1. System transitions to Canvas page with tutorial overlay
2. System displays Tutorial Progress indicator: "Step 1 of 5" plus progress dots/bar
3. System shows semi-transparent overlay highlighting specific UI area
4. System displays tutorial tooltip with instructions and animation
5. System waits for user to complete the guided action
6. System validates action completion (e.g., equipment placed)
7. System provides positive feedback: "Great job!" with checkmark
8. System automatically advances to next step after 1 second
9. System repeats for all 5 tutorial steps:

   **Step 1: Equipment Placement**
   - Highlight: Left Sidebar equipment library
   - Instructions: "Drag the Air Handler Unit onto the canvas"
   - Validation: Detect EntityPlacedEvent with type "AHU"

   **Step 2: Duct Connection**
   - Highlight: Placed AHU and toolbar Duct Tool
   - Instructions: "Click the Duct Tool, then click the AHU to start drawing a duct"
   - Validation: Detect DuctCreatedEvent from AHU

   **Step 3: Properties Panel**
   - Highlight: Right Sidebar properties panel
   - Instructions: "Select the AHU to view its properties. Try changing the CFM value."
   - Validation: Detect PropertyChangedEvent for selected AHU

   **Step 4: Canvas Navigation**
   - Highlight: Canvas viewport
   - Instructions: "Use mouse wheel to zoom, and drag the canvas to pan"
   - Validation: Detect zoom level change AND pan offset change

   **Step 5: Help Access**
   - Highlight: Top toolbar Help icon
   - Instructions: "Click the Help icon to access documentation and support"
   - Validation: Detect help panel opened

10. System displays completion screen after Step 5
11. System awards completion badge: "Quick Start Complete!"
12. System saves tutorial completion flag to storage
13. System transitions to project creation screen

**Visual State (Tutorial Step Example):**

```
┌─────────────────────────────────────────────────────────────┐
│  (Filtered Backdrop / Overlay)                              │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ [Dialog Primitive]                                  │   │
│   │                                                     │   │
│   │  Equipment Placement                          [Skip]│   │
│   │  (Step 1 of 5)  ●●○○○                               │   │
│   │                                                     │   │
│   │  Drag the Air Handler Unit onto the canvas to       │   │
│   │  begin your design.                                 │   │
│   │                                                     │   │
│   │                [Next >]                             │   │
│   └─────────────────────────────────────────────────────┘   │
│            ↓                                                │
│   (Spotlight on Sidebar)                                    │
│  ┌───────────────┐                                          │
│  │ EQUIPMENT     │                                          │
│  │ [AHU] [VAV]   │                                          │
│  │ [Fan] [Duct]  │                                          │
│  └───────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**User Feedback:**
- Progress badge shows clear position in tutorial
- Highlighted UI areas focus attention on relevant elements
- Accessible dialog ensures focus management
- Clear "Next" and "Skip" actions for control

**Related Elements:**
- Components: `TutorialOverlay`, `Dialog`, `Canvas`, `Sidebar`
- Stores: `TutorialStore`
- Skip option always available for impatient users
- Completion badge rewards finishing the tutorial

**Related Elements:**
- Components: `TutorialOverlay`, `TutorialTooltip`, `TutorialProgress`
- Stores: `TutorialStore` (currentStep, completedSteps)
- Services: `TutorialService`, `EventValidationService`
- Events: `EntityPlacedEvent`, `DuctCreatedEvent`, `PropertyChangedEvent`

### Step 4: Project Creation Options

**User Actions:**
1. User reviews project creation options:
   - Start from Template (recommended for beginners)
   - Start with Blank Canvas (for experienced users)
2. User browses available templates if interested (optional)
3. User selects a template or blank canvas option
4. User optionally adjusts Quick Settings in the selected card:
   - Unit system (Imperial/Metric)
   - Grid size
5. User enters project name: "My First HVAC Project"
6. User enters project description (optional)
7. User configures initial settings:
   - Default equipment manufacturer preferences
   - Auto-save frequency
8. User clicks "Create Project" button

**System Response:**
1. System displays Project Creation screen after tutorial completion
2. System shows two main options with preview cards:

   **Option A: Start from Template**
   - Shows 3-4 template thumbnails with previews
   - Templates include: "Small Office", "Retail Space", "Warehouse", "Multi-Zone Building"
   - Each template shows preview image, description, and estimated completion time
   - Template sizes indicated: Small (< 5 equipment), Medium (5-15), Large (15+)

   **Option B: Start with Blank Canvas**
   - Shows empty canvas preview
   - Description: "Start fresh with unlimited creative freedom"
   - Best for: "Experienced designers or unique projects"

3. System displays inline Quick Settings on the selected card:
   - Unit System: Imperial (default) or Metric
   - Grid size: 12, 24 (default), 48
4. System displays project details form when option selected
5. System provides default project name: "Untitled Project [Date]"
6. System validates project name (required, 1-100 chars, unique)
7. System shows optional description field (up to 500 characters)
8. System displays initial settings panel with defaults:
   - Manufacturer: "All" (default) or specific brand
   - Auto-save: Every 5 minutes (default)
9. System pre-fills the full form from Quick Settings selections
10. System validates all inputs on blur
11. System enables "Create Project" button when valid
12. System creates new project in ProjectStore on button click
13. System initializes empty canvas or loads template
14. System saves project to localStorage
15. System navigates to Canvas page with new project loaded
16. System displays success toast: "Project created successfully!"

**Visual State:**

```
┌──────────────────────────────────────────────────────────┐
│  Create Your First Project                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Choose how to start:                                    │
│                                                          │
│  ┌────────────────────────┐  ┌──────────────────────┐   │
│  │ Start from Template    │  │ Blank Canvas         │   │
│  │ ┌──────────────────┐   │  │ ┌────────────────┐   │   │
│  │ │  [Template]      │   │  │ │                │   │   │
│  │ │  [Preview]       │   │  │ │  Empty Canvas  │   │   │
│  │ │  Small Office    │   │  │ │                │   │   │
│  │ └──────────────────┘   │  │ └────────────────┘   │   │
│  │                        │  │                      │   │
│  │ ⭐ Recommended for     │  │ For experienced      │   │
│  │    beginners           │  │ designers            │   │
│  │                        │  │                      │   │
│  │ [Select Template]      │  │ [Start Blank]        │   │
│  └────────────────────────┘  └──────────────────────┘   │
│                                                          │
│  ──────────────────────────────────────────────────      │
│                                                          │
│  Project Details:                                        │
│                                                          │
│  Project Name: *                                         │
│  ┌────────────────────────────────────────────────┐     │
│  │ My First HVAC Project                          │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Description: (optional)                                 │
│  ┌────────────────────────────────────────────────┐     │
│  │ Learning the HVAC Canvas App                   │     │
│  │                                                │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Initial Settings:                                       │
│  Unit System:    ⦿ Imperial  ○ Metric                   │
│  Manufacturer:   [All ▼]                                 │
│  Auto-save:      [Every 5 minutes ▼]                     │
│                                                          │
│              [Create Project]                            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**User Feedback:**
- Template previews help users understand starting options
- Recommendations guide beginners toward templates
- Real-time validation on project name field
- Default settings reduce configuration burden
- Clear "Create Project" action button
- Success toast confirms project creation

**Related Elements:**
- Components: `ProjectCreationScreen`, `TemplateSelector`, `ProjectDetailsForm`
- Stores: `ProjectStore`, `SettingsStore`, `TemplateStore`
- Services: `ProjectService`, `TemplateService`, `ValidationService`
- Types: `Project`, `ProjectMetadata`, `UserSettings`

### Step 5: First Canvas View with Contextual Help

**User Actions:**
1. User views the main Canvas page for the first time
2. User notices contextual help tooltips on key UI elements
3. User explores the interface:
   - Left Sidebar: Equipment library
   - Canvas: Main design area
   - Right Sidebar: Properties panel (initially empty)
   - Top Toolbar: Design tools
4. User optionally dismisses tooltips as they explore
5. User accesses persistent help resources:
   - Help menu in toolbar
   - Keyboard shortcuts reference (Ctrl+/)
   - Documentation link
6. User begins working on their first project

**System Response:**
1. System loads Canvas page with new project
2. System detects first-time canvas view (no `canvas.firstView` flag)
3. System displays contextual help tooltips on key areas:

   **Tooltip 1: Left Sidebar (Equipment Library)**
   - Position: Right of left sidebar, arrow pointing left
   - Content: "Browse and drag equipment onto your canvas"
   - Dismiss: Auto-dismiss after 5 seconds or manual close

   **Tooltip 2: Canvas Area**
   - Position: Center of canvas
   - Content: "Your design workspace. Pan with mouse drag, zoom with wheel."
   - Dismiss: Auto-dismiss after 5 seconds or manual close

   **Tooltip 3: Top Toolbar**
   - Position: Below toolbar, arrow pointing up
   - Content: "Access design tools, undo/redo, and project options"
   - Dismiss: Auto-dismiss after 5 seconds or manual close

   **Tooltip 4: Help Icon**
   - Position: Below help icon
   - Content: "Click here anytime for help and documentation"
   - Dismiss: Auto-dismiss after 8 seconds or manual close

4. System shows tooltips sequentially with a short delay (0.5s) and a "Next" control for user-driven pacing
5. System saves `canvas.firstView = true` flag after tooltips shown
6. System displays floating "Tips" panel in bottom-right corner:
   - Shows rotating helpful tips every 10 seconds
   - Examples: "Tip: Hold Shift to constrain duct angles to 90°"
   - Can be minimized or disabled in settings
7. System enables all canvas interactions
8. System monitors user's first actions for additional guidance:
   - If idle for 30 seconds, show hint: "Try dragging an Air Handler from the left sidebar"
   - If equipment placed but not connected, show hint: "Use the Duct Tool to connect equipment"
9. System provides Help menu in toolbar with quick access:
   - Keyboard Shortcuts (Ctrl+/)
   - Video Tutorials
   - Documentation
   - Report Issue
   - About

**Visual State:**

```
┌───────────────────────────────────────────────────────────────────┐
│ [File] [Edit] [View] [Help]     My First HVAC Project     [?] ☰  │
├───────────────────────────────────────────────────────────────────┤
│ [Line] [Duct] [Select] [Delete] [Undo] [Redo] │ Help              │
│      ↑                                                            │
│      └──────────────────────────────────────┐                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Access design tools, undo/redo,          │                 │  │
│  │ and project options                      │                 │  │
│  │                              [Got it]    │                 │  │
│  └──────────────────────────────────────────┘                 │  │
├──────┬────────────────────────────────────────────────┬──────────┤
│ Equip│                                                │Properties│
│ment  │         ┌──────────────────────────┐           │          │
│      │         │ Your design workspace.   │           │          │
│ [AHU]│         │ Pan with mouse drag,     │           │  No item │
│ [VAV]│         │ zoom with wheel.         │           │ selected │
│ [Fan]│         │                          │           │          │
│ [Duct│         │         [Got it]         │           │          │
│      │         └──────────────────────────┘           │          │
│      │                                                │          │
│      │            (Empty canvas)                      │          │
│      │                                                │          │
│      │                                                │          │
│      │                                                │          │
├──────┴────────────────────────────────────────────────┴──────────┤
│ Ready to design | Zoom: 100% | Grid: On                          │
│                                                                   │
│                                        ┌──────────────────┐       │
│                                        │ Tips 💡          │ [−]  │
│                                        │ ────────────     │      │
│                                        │ Hold Shift to    │      │
│                                        │ constrain duct   │      │
│                                        │ angles to 90°    │      │
│                                        └──────────────────┘       │
└───────────────────────────────────────────────────────────────────┘
```

**User Feedback:**
- Sequential tooltips prevent overwhelming user
- Contextual placement connects instructions to UI elements
- User-driven pacing keeps tips comfortable, with auto-dismiss as fallback
- Rotating tips provide ongoing learning
- Persistent help menu always accessible
- Idle hints gently nudge user toward first actions

**Related Elements:**
- Components: `CanvasPage`, `ContextualTooltip`, `TipsPanel`, `HelpMenu`
- Stores: `AppStateStore`, `ViewportStore`, `EntityStore`
- Services: `TooltipService`, `HelpService`
- Hooks: `useFirstTimeExperience`, `useContextualHelp`

## 5. Edge Cases and Handling

### Edge Case 1: User Exits During Tutorial

**Scenario:**
User starts the Quick Start tutorial but closes the browser window or navigates away before completing all 5 steps.

**Handling:**
1. System detects tutorial in progress via `TutorialStore.currentStep`
2. System saves tutorial progress to IndexedDB on each step completion
3. System saves partial progress state: `{currentStep: 3, completed: [1, 2], timestamp}`
4. On next launch, system checks for incomplete tutorial
5. System displays resume dialog: "Resume Tutorial?"
   - Option A: "Continue from Step 3" (primary)
   - Option B: "Start Over"
   - Option C: "Skip Tutorial" (dismiss)
6. If user selects "Continue", system loads Canvas with tutorial at Step 3
7. If user selects "Start Over", system resets progress and begins from Step 1
8. If user selects "Skip", system marks tutorial as skipped and proceeds to project creation
9. System tracks resume/abandon rate for analytics

**User Impact:**
- Minimal: User can resume where they left off
- Progress is not lost due to accidental closure
- User maintains control over tutorial experience

### Edge Case 2: Browser Doesn't Meet System Requirements

**Scenario:**
User launches application in an outdated browser (e.g., Internet Explorer 11, Chrome 80) that doesn't support required Canvas APIs or ES2020+ features.

**Handling:**
1. System performs browser compatibility check during initialization
2. System checks for:
   - Canvas API support: `document.createElement('canvas').getContext`
   - IndexedDB support: `window.indexedDB`
   - ES2020+ features: `Promise.allSettled`, `??`, `?.`
   - Minimum browser versions
3. If compatibility check fails, system displays error screen:
   - Title: "Browser Not Supported"
   - Message: "HVAC Canvas App requires a modern browser"
   - Supported browsers listed with minimum versions
   - Download links for Chrome, Firefox, Safari, Edge
4. System prevents application from loading further
5. System logs browser details for analytics
6. System provides fallback contact link for technical support

**User Impact:**
- High: User cannot use application until browser updated
- Clear communication prevents confusion
- Actionable instructions guide user toward resolution

### Edge Case 3: Network Failure During Template Load

**Scenario:**
User selects "Start from Template" option, but network connection is lost before template data fully downloads.

**Handling:**
1. System detects network failure during template fetch
2. System displays error message: "Unable to load template"
3. System offers three options:
   - "Retry" - Attempts to reload template
   - "Use Cached Template" - Uses last successfully loaded template (if available)
   - "Start with Blank Canvas" - Falls back to empty project
4. If user clicks "Retry", system attempts fetch with 3 retry attempts (exponential backoff)
5. If retries fail, system recommends blank canvas option
6. System caches successfully loaded templates in IndexedDB for offline use
7. System displays offline indicator in UI if network unavailable
8. System tracks network failure rate for infrastructure monitoring

**User Impact:**
- Medium: User may not get desired template
- Fallback options prevent complete blockage
- Offline capability through caching reduces future impact

### Edge Case 4: Local Storage Quota Exceeded

**Scenario:**
User attempts to save first-time launch flags or project data, but browser's IndexedDB quota is exceeded (rare but possible if user has many other apps using storage).

**Handling:**
1. System attempts to save onboarding state to IndexedDB
2. System catches QuotaExceededError exception
3. System calculates current storage usage: `navigator.storage.estimate()`
4. System displays warning dialog:
   - Title: "Storage Space Low"
   - Message: "Your browser's storage is nearly full. Some features may not work properly."
   - Current usage: "4.8 GB / 5 GB used"
5. System offers storage management options:
   - "Clear Old Projects" - Shows list of projects with last modified dates
   - "Continue Anyway" - Proceeds with in-memory only (data not persisted)
   - "Learn More" - Opens help article about storage management
6. System falls back to sessionStorage for temporary state if IndexedDB unavailable
7. System displays persistent warning banner until storage issue resolved
8. System automatically clears tutorial progress cache to free space (least critical data)

**User Impact:**
- Medium: Some features may not persist between sessions
- Clear communication about storage limits
- User empowered to manage storage through app

### Edge Case 5: User Rapidly Clicks Through Tutorial

**Scenario:**
User clicks "Next" button rapidly in tutorial without actually performing the guided actions, attempting to skip to the end quickly.

**Handling:**
1. System requires action validation before enabling "Next" button
2. Each tutorial step has required validation:
   - Step 1: Entity must be placed on canvas (EntityPlacedEvent)
   - Step 2: Duct must be created from entity (DuctCreatedEvent)
   - Step 3: Property must be modified (PropertyChangedEvent)
   - Step 4: Viewport must change (zoom or pan event)
   - Step 5: Help panel must open (HelpPanelOpenedEvent)
3. "Next" button remains disabled (gray, not clickable) until validation passes
4. System displays validation hint after 10 seconds of inactivity:
   - "Try placing the Air Handler on the canvas to continue"
5. System provides "Skip Tutorial" option as alternative to forced completion
6. If user clicks "Skip Tutorial" during rapid clicking:
   - Show confirmation: "Skip the rest of the tutorial?"
   - Mark tutorial as skipped (not completed) in analytics
7. System ensures tutorial integrity cannot be bypassed except through explicit skip

**User Impact:**
- Low: Ensures users actually learn during tutorial
- Skip option available for those who want to opt out
- Validation hints guide users who are stuck

## 6. Error Scenarios and Recovery

### Error Scenario 1: Equipment Library Fails to Load

**Error Condition:**
Equipment library data fails to load during application initialization due to corrupted local cache or failed network request.

**System Detection:**
1. EquipmentLibraryService.loadLibrary() throws exception
2. System catches error during splash screen loading phase
3. Error logged: "Failed to load equipment library: [error details]"

**Error Message:**
```
Title: Unable to Load Equipment Library
Message: The equipment library could not be loaded. The application may not function properly without it.
Error Code: ERR_LIBRARY_LOAD_FAILED
```

**Recovery Steps:**
1. System displays error dialog with recovery options:
   - **Primary Action**: "Retry Loading" - Attempts to reload library
   - **Secondary Action**: "Clear Cache and Reload" - Clears corrupted cache
   - **Tertiary Action**: "Use Minimal Library" - Loads basic equipment set only
2. If "Retry Loading" clicked:
   - System attempts to reload library from network
   - Shows loading indicator
   - Success: Proceeds with normal launch
   - Failure: Offers "Clear Cache" option
3. If "Clear Cache and Reload" clicked:
   - System clears IndexedDB equipment cache
   - System clears browser cache for app domain
   - System reloads entire application
4. If "Use Minimal Library" clicked:
   - System loads hardcoded minimal equipment set (5 basic items)
   - System displays warning banner: "Limited equipment library loaded"
   - System allows basic functionality to proceed
5. System sends error report to logging service with:
   - Error stack trace
   - Browser details
   - Library cache state
   - Network connectivity status

**User Recovery Actions:**
- Wait for automatic retry attempts
- Clear browser cache manually if issue persists
- Check network connection
- Contact support with error code if unresolved

**Prevention:**
- System validates library data integrity on save
- System maintains backup minimal library in application bundle
- System implements cache versioning to detect stale data

### Error Scenario 2: Tutorial State Corruption

**Error Condition:**
Tutorial state in IndexedDB becomes corrupted, causing tutorial to fail to load or display incorrect step.

**System Detection:**
1. TutorialService.loadState() reads invalid state structure
2. State validation fails: currentStep out of range or completedSteps malformed
3. Error logged: "Tutorial state validation failed: [details]"

**Error Message:**
```
Title: Tutorial Error
Message: The tutorial encountered an unexpected error. Would you like to reset and start over?
Error Code: ERR_TUTORIAL_STATE_INVALID
```

**Recovery Steps:**
1. System detects state validation failure
2. System displays error dialog with options:
   - **Primary Action**: "Reset Tutorial" - Clears state and restarts from Step 1
   - **Secondary Action**: "Skip Tutorial" - Bypasses tutorial entirely
3. If "Reset Tutorial" clicked:
   - System deletes corrupted state from IndexedDB
   - System initializes fresh tutorial state: `{currentStep: 1, completed: []}`
   - System restarts tutorial from Step 1
   - System logs reset event for debugging
4. If "Skip Tutorial" clicked:
   - System marks tutorial as skipped
   - System proceeds to project creation screen
   - System saves skip event for analytics
5. System implements state validation schema using Zod:
   - Validates currentStep is 1-5
   - Validates completedSteps is array of valid step numbers
   - Validates timestamp is valid date
6. On future state saves, system performs validation before writing

**User Recovery Actions:**
- Accept tutorial reset (recommended)
- Skip tutorial and proceed to main application
- No data loss as project data is separate from tutorial state

**Prevention:**
- Use schema validation (Zod) on all state reads/writes
- Implement state migration for schema changes
- Add integrity checks on critical state properties

### Error Scenario 3: Project Creation Fails

**Error Condition:**
Project creation fails when user clicks "Create Project" due to storage error, validation failure, or system exception.

**System Detection:**
1. ProjectService.createProject() throws exception
2. Possible causes:
   - IndexedDB write failure (QuotaExceededError)
   - Validation error on project data
   - Template loading failure
   - Store initialization error
3. Error logged with full stack trace and project data (sanitized)

**Error Message:**
```
Title: Unable to Create Project
Message: Your project could not be created due to a system error. Please try again.
Error Code: ERR_PROJECT_CREATE_FAILED
Details: [Specific error message, e.g., "Storage quota exceeded"]
```

**Recovery Steps:**
1. System catches exception during project creation
2. System determines specific error cause:

   **Case A: Storage Quota Exceeded**
   - Display storage management dialog
   - Offer to delete old projects or clear cache
   - Show current storage usage

   **Case B: Validation Error**
   - Display validation error messages
   - Highlight invalid fields in project form
   - Allow user to correct and retry

   **Case C: Template Loading Error**
   - Offer to start with blank canvas instead
   - Retry template download
   - Use cached template if available

3. System preserves user's form input (name, description, settings)
4. System provides "Try Again" button after error resolution
5. System rolls back any partial state changes:
   - Remove partially created project from ProjectStore
   - Clear any temporary files or cache entries
6. If repeated failures occur (3+ attempts):
   - System suggests restarting application
   - System provides link to report issue
   - System saves diagnostic report for support

**User Recovery Actions:**
- Correct validation errors in form
- Free up storage space if quota exceeded
- Try blank canvas if template fails
- Restart application if issue persists
- Contact support with error code

**Prevention:**
- Validate all inputs before submission
- Check storage availability before attempting save
- Implement transaction rollback for failed operations
- Pre-validate templates before offering to users

## 7. Keyboard Shortcuts

### Available in Welcome/Tutorial Screens

| Shortcut | Action | Context |
|----------|--------|---------|
| `Enter` | Primary action | Advances to next screen or confirms action |
| `Esc` | Cancel/Close | Closes dialogs or skips tutorial |
| `Space` | Next step | Advances to next tutorial step (when enabled) |
| `Ctrl+/` | Help menu | Opens help resources |
| `Tab` | Navigate | Cycles through interactive elements |
| `Shift+Tab` | Navigate back | Cycles backward through elements |

### Tutorial-Specific Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Right Arrow` | Next step | Advances to next tutorial step (when enabled) |
| `Left Arrow` | Previous step | Returns to previous tutorial step (if available) |
| `Ctrl+Q` | Quit tutorial | Exits tutorial with confirmation |
| `?` | Tutorial help | Shows additional guidance for current step |

### Project Creation Screen

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Enter` | Create project | Submits project creation form (when valid) |
| `Esc` | Cancel | Returns to previous screen |
| `Ctrl+N` | New blank project | Quick action to start blank canvas |
| `Ctrl+T` | Browse templates | Opens template selector |

**Note:** All keyboard shortcuts are displayed in tooltip hints when user hovers over relevant UI elements. Press `Ctrl+/` at any time to see complete shortcut reference.

## 8. Related Elements

### Components
- `SplashScreen`: Initial loading screen with progress indicator
  - Location: `src/components/app/SplashScreen.tsx`
  - Props: `progress`, `loadingMessage`

- `WelcomeScreen`: First-time user welcome with feature highlights
  - Location: `src/components/onboarding/WelcomeScreen.tsx`
  - Props: `onStartTutorial`, `onSkip`, `featureHighlights`

- `TutorialOverlay`: Interactive tutorial guidance system
  - Location: `src/components/onboarding/TutorialOverlay.tsx`
  - Props: `currentStep`, `totalSteps`, `onNext`, `onSkip`

- `TutorialTooltip`: Individual tutorial instruction tooltips
  - Location: `src/components/onboarding/TutorialTooltip.tsx`
  - Props: `content`, `position`, `target`, `onDismiss`

- `ProjectCreationScreen`: New project setup interface
  - Location: `src/components/projects/ProjectCreationScreen.tsx`
  - Props: `templates`, `onCreateProject`, `defaultSettings`

- `TemplateSelector`: Template browsing and selection
  - Location: `src/components/projects/TemplateSelector.tsx`
  - Props: `templates`, `onSelect`, `previewMode`

- `ContextualTooltip`: Canvas first-view guidance tooltips
  - Location: `src/components/help/ContextualTooltip.tsx`
  - Props: `message`, `position`, `autoDismiss`, `delay`

- `TipsPanel`: Rotating helpful tips panel
  - Location: `src/components/help/TipsPanel.tsx`
  - Props: `tips`, `rotationInterval`, `dismissible`

### Zustand Stores
- `AppStateStore`: Global application state including onboarding flags
  - Location: `src/stores/AppStateStore.ts`
  - State: `hasLaunched`, `onboardingComplete`, `firstCanvasView`
  - Actions: `markLaunched()`, `completeOnboarding()`, `markFirstCanvasView()`

- `TutorialStore`: Tutorial progress and state management
  - Location: `src/stores/TutorialStore.ts`
  - State: `currentStep`, `completedSteps`, `isActive`, `skipped`
  - Actions: `nextStep()`, `previousStep()`, `skipTutorial()`, `completeTutorial()`

- `ProjectStore`: Project data and management
  - Location: `src/stores/ProjectStore.ts`
  - State: `projects`, `currentProject`, `recentProjects`
  - Actions: `createProject()`, `loadProject()`, `deleteProject()`

- `SettingsStore`: User preferences and configuration
  - Location: `src/stores/SettingsStore.ts`
  - State: `unitSystem`, `defaultManufacturer`, `autoSaveFrequency`, `showTips`
  - Actions: `updateSettings()`, `resetToDefaults()`

- `TemplateStore`: Template library and management
  - Location: `src/stores/TemplateStore.ts`
  - State: `templates`, `cachedTemplates`, `templateCategories`
  - Actions: `loadTemplates()`, `cacheTemplate()`, `getTemplateById()`

### Hooks
- `useFirstTimeExperience`: Manages first-time user experience flow
  - Location: `src/hooks/useFirstTimeExperience.ts`
  - Returns: `isFirstLaunch`, `shouldShowWelcome`, `shouldShowTutorial`

- `useOnboarding`: Tutorial state management and progression
  - Location: `src/hooks/useOnboarding.ts`
  - Returns: `currentStep`, `progress`, `nextStep()`, `skipTutorial()`

- `useTutorialValidation`: Validates tutorial step completion
  - Location: `src/hooks/useTutorialValidation.ts`
  - Returns: `isStepComplete`, `validateAction()`, `validationState`

- `useContextualHelp`: Manages contextual tooltips and guidance
  - Location: `src/hooks/useContextualHelp.ts`
  - Returns: `activeTooltips`, `showTooltip()`, `dismissTooltip()`

### Services
- `AppInitializer`: Handles application startup and initialization
  - Location: `src/services/AppInitializer.ts`
  - Methods: `initialize()`, `checkBrowserCompatibility()`, `loadDependencies()`

- `OnboardingService`: Manages onboarding flow and persistence
  - Location: `src/services/OnboardingService.ts`
  - Methods: `checkFirstLaunch()`, `saveOnboardingState()`, `getResumeState()`

- `TutorialService`: Tutorial logic and validation
  - Location: `src/services/TutorialService.ts`
  - Methods: `loadState()`, `validateStep()`, `saveProgress()`, `resetTutorial()`

- `ProjectService`: Project creation and management logic
  - Location: `src/services/ProjectService.ts`
  - Methods: `createProject()`, `validateProjectData()`, `loadTemplate()`

- `TemplateService`: Template loading and caching
  - Location: `src/services/TemplateService.ts`
  - Methods: `loadTemplates()`, `getTemplate()`, `cacheTemplate()`, `applyTemplate()`

- `StorageService`: Local storage and IndexedDB management
  - Location: `src/services/StorageService.ts`
  - Methods: `save()`, `load()`, `clear()`, `checkQuota()`, `estimateUsage()`

- `ValidationService`: Input validation and sanitization
  - Location: `src/services/ValidationService.ts`
  - Methods: `validateProjectName()`, `validateDescription()`, `sanitizeInput()`

## 9. Visual Diagrams

### First Launch Flow

```
┌──────────────┐
│  User Opens  │
│ Application  │
└──────┬───────┘
       │
       v
┌──────────────┐
│   Splash     │
│   Screen     │  (2-3 seconds)
│  Loading...  │
└──────┬───────┘
       │
       v
    ┌──────┐
    │First?│ (Check storage)
    └──┬───┘
       │
  Yes  │  No
    ┌──┴──┐
    │     │
    v     v
┌────────┐ ┌────────────┐
│Welcome │ │Go directly │
│Screen  │ │to Canvas   │
└───┬────┘ │or Dashboard│
    │      └────────────┘
    v
┌────────────┐
│Start       │
│Tutorial?   │
└──┬─────┬───┘
   │     │
 Yes│    │No
   │     │
   v     v
┌──────┐ ┌────────┐
│Run   │ │Skip to │
│5-Step│ │Project │
│Tutor │ │Create  │
└───┬──┘ └───┬────┘
    │        │
    │        │
    v        v
┌────────────────┐
│Project Creation│
│  Template or   │
│Blank Canvas?   │
└────────┬───────┘
         │
         v
┌────────────────┐
│  Canvas Page   │
│with Contextual │
│    Tooltips    │
└────────────────┘
```

### Tutorial Step Progression

```
Step 1: Equipment Placement
┌─────────────────────────────────┐
│ Sidebar → Drag AHU → Canvas     │
│ [VALIDATE: EntityPlacedEvent]   │
└─────────────┬───────────────────┘
              │ ✓ Validated
              v
Step 2: Duct Connection
┌─────────────────────────────────┐
│ Toolbar → Duct Tool → Click AHU │
│ [VALIDATE: DuctCreatedEvent]    │
└─────────────┬───────────────────┘
              │ ✓ Validated
              v
Step 3: Properties Panel
┌─────────────────────────────────┐
│ Select AHU → Change CFM value   │
│ [VALIDATE: PropertyChanged]     │
└─────────────┬───────────────────┘
              │ ✓ Validated
              v
Step 4: Canvas Navigation
┌─────────────────────────────────┐
│ Zoom (wheel) + Pan (drag)       │
│ [VALIDATE: Viewport changed]    │
└─────────────┬───────────────────┘
              │ ✓ Validated
              v
Step 5: Help Access
┌─────────────────────────────────┐
│ Click Help icon in toolbar      │
│ [VALIDATE: HelpPanelOpened]     │
└─────────────┬───────────────────┘
              │ ✓ Validated
              v
┌─────────────────────────────────┐
│ Tutorial Complete! 🎉           │
│ [Award Badge + Save Progress]   │
└─────────────────────────────────┘
```

### Project Creation Decision Tree

```
                ┌──────────────────┐
                │Choose Starting   │
                │Point             │
                └────────┬─────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            v                         v
    ┌──────────────┐          ┌─────────────┐
    │  Template    │          │   Blank     │
    │  (Guided)    │          │  Canvas     │
    └──────┬───────┘          └──────┬──────┘
           │                         │
           v                         │
    ┌──────────────┐                 │
    │Browse        │                 │
    │Templates:    │                 │
    │- Small Office│                 │
    │- Retail Space│                 │
    │- Warehouse   │                 │
    │- Multi-Zone  │                 │
    └──────┬───────┘                 │
           │                         │
           │ (Select Template)       │
           │                         │
           └────────┬────────────────┘
                    │
                    v
           ┌────────────────┐
           │ Enter Project  │
           │ Details:       │
           │ - Name*        │
           │ - Description  │
           │ - Settings     │
           └────────┬───────┘
                    │
                    v
              ┌──────────┐
              │Validate  │
              │Inputs    │
              └────┬─────┘
                   │
        Valid      │      Invalid
           ┌───────┴────────┐
           │                │
           v                v
    ┌──────────┐     ┌─────────────┐
    │ Create   │     │Show Errors  │
    │ Project  │     │Allow Correct│
    └────┬─────┘     └──────┬──────┘
         │                  │
         v                  │
    ┌──────────┐            │
    │Navigate  │◄───────────┘
    │to Canvas │
    └──────────┘
```

### Onboarding State Persistence

```
┌─────────────────────────────────────────┐
│        IndexedDB / LocalStorage         │
├─────────────────────────────────────────┤
│                                         │
│  onboarding: {                          │
│    hasLaunched: true,                   │
│    welcomeShown: true,                  │
│    tutorialState: {                     │
│      currentStep: 3,                    │
│      completed: [1, 2],                 │
│      skipped: false,                    │
│      timestamp: "2025-01-15T..."        │
│    },                                   │
│    firstCanvasView: true,               │
│    contextualTooltipsShown: [          │
│      "sidebar",                         │
│      "canvas",                          │
│      "toolbar"                          │
│    ]                                    │
│  }                                      │
│                                         │
└─────────────────────────────────────────┘
            ↕ Read/Write
┌─────────────────────────────────────────┐
│        AppStateStore (Zustand)          │
├─────────────────────────────────────────┤
│  - hasLaunched                          │
│  - onboardingComplete                   │
│  - firstCanvasView                      │
└─────────────────────────────────────────┘
            ↕ Subscribe
┌─────────────────────────────────────────┐
│         React Components                │
│  - WelcomeScreen                        │
│  - TutorialOverlay                      │
│  - ContextualTooltip                    │
└─────────────────────────────────────────┘
```

## 10. Testing

### Unit Tests

**TutorialService Tests:**
```
describe('TutorialService', () => {
  test('loadState returns default state on first launch')
  test('saveProgress persists step completion to storage')
  test('validateStep correctly validates EntityPlacedEvent for Step 1')
  test('validateStep correctly validates DuctCreatedEvent for Step 2')
  test('validateStep correctly validates PropertyChangedEvent for Step 3')
  test('validateStep correctly validates viewport change for Step 4')
  test('validateStep correctly validates HelpPanelOpened for Step 5')
  test('resetTutorial clears all progress and state')
  test('handles corrupted state gracefully with validation')
  test('throws error when storage quota exceeded')
})
```

**OnboardingService Tests:**
```
describe('OnboardingService', () => {
  test('checkFirstLaunch returns true when no storage flag exists')
  test('checkFirstLaunch returns false when hasLaunched flag is true')
  test('saveOnboardingState persists correct structure to IndexedDB')
  test('getResumeState returns null when no incomplete tutorial')
  test('getResumeState returns correct state when tutorial interrupted')
  test('handles storage read errors gracefully')
  test('marks onboarding complete when all steps finished')
})
```

**ProjectService Tests:**
```
describe('ProjectService', () => {
  test('createProject successfully creates project with valid data')
  test('createProject validates required project name')
  test('createProject applies template correctly when selected')
  test('createProject initializes with default settings when not provided')
  test('createProject throws error when storage quota exceeded')
  test('createProject sanitizes description input')
  test('validateProjectData rejects names over 100 characters')
  test('validateProjectData rejects empty project names')
})
```

### Integration Tests

**Welcome to Tutorial Flow:**
```
describe('Welcome to Tutorial Integration', () => {
  test('clicking "Start Tutorial" transitions to Canvas with tutorial overlay')
  test('clicking "Skip" transitions directly to Project Creation screen')
  test('"Don\'t show again" checkbox persists setting to storage')
  test('tutorial progress saves after each completed step')
  test('tutorial can be resumed from interrupted state')
  test('tutorial completion marks all steps as done and shows badge')
  test('skipping tutorial during progression saves skip event')
})
```

**Project Creation Flow:**
```
describe('Project Creation Integration', () => {
  test('selecting template loads template preview and data')
  test('selecting blank canvas enables project form with empty state')
  test('form validation prevents submission with invalid name')
  test('successful creation saves project to IndexedDB')
  test('successful creation navigates to Canvas page')
  test('creation failure displays error and preserves form data')
  test('template loading failure offers blank canvas fallback')
})
```

**First Canvas View:**
```
describe('First Canvas View Integration', () => {
  test('contextual tooltips display sequentially on first view')
  test('tooltips auto-dismiss after configured timeout')
  test('manually dismissing tooltip prevents auto-reappear')
  test('firstCanvasView flag persists after tooltips shown')
  test('tips panel rotates messages at configured interval')
  test('tips panel can be minimized and re-opened')
  test('idle hint displays after 30 seconds of inactivity')
})
```

### End-to-End Tests

**Complete First Launch Experience:**
```
test('E2E: Complete first launch with tutorial', async () => {
  // 1. Launch application for first time
  await page.goto('http://localhost:3000')

  // 2. Verify splash screen appears
  await expect(page.locator('[data-testid="splash-screen"]')).toBeVisible()

  // 3. Wait for welcome screen
  await expect(page.locator('[data-testid="welcome-screen"]')).toBeVisible()

  // 4. Click "Start Tutorial"
  await page.click('[data-testid="start-tutorial-btn"]')

  // 5. Complete Step 1: Equipment Placement
  await expect(page.locator('[data-testid="tutorial-step-1"]')).toBeVisible()
  await page.dragAndDrop(
    '[data-testid="equipment-ahu"]',
    '[data-testid="canvas-area"]'
  )
  await expect(page.locator('[data-testid="tutorial-step-1-complete"]')).toBeVisible()

  // 6. Complete Step 2: Duct Connection
  await page.click('[data-testid="duct-tool-btn"]')
  await page.click('[data-testid="placed-ahu"]')
  await expect(page.locator('[data-testid="tutorial-step-2-complete"]')).toBeVisible()

  // 7. Complete Step 3: Properties Panel
  await page.click('[data-testid="placed-ahu"]')
  await page.fill('[data-testid="property-cfm-input"]', '5000')
  await expect(page.locator('[data-testid="tutorial-step-3-complete"]')).toBeVisible()

  // 8. Complete Step 4: Canvas Navigation
  await page.mouse.wheel(0, 100) // Zoom
  await page.mouse.move(400, 300)
  await page.mouse.down()
  await page.mouse.move(450, 350) // Pan
  await page.mouse.up()
  await expect(page.locator('[data-testid="tutorial-step-4-complete"]')).toBeVisible()

  // 9. Complete Step 5: Help Access
  await page.click('[data-testid="help-icon-btn"]')
  await expect(page.locator('[data-testid="tutorial-step-5-complete"]')).toBeVisible()

  // 10. Verify completion screen
  await expect(page.locator('[data-testid="tutorial-complete-badge"]')).toBeVisible()

  // 11. Click to proceed to project creation
  await page.click('[data-testid="continue-btn"]')

  // 12. Create project
  await page.click('[data-testid="blank-canvas-option"]')
  await page.fill('[data-testid="project-name-input"]', 'My First Project')
  await page.click('[data-testid="create-project-btn"]')

  // 13. Verify canvas loaded with contextual tooltips
  await expect(page.locator('[data-testid="canvas-page"]')).toBeVisible()
  await expect(page.locator('[data-testid="contextual-tooltip"]')).toBeVisible()

  // 14. Verify storage flags set
  const storage = await page.evaluate(() => localStorage.getItem('onboarding'))
  expect(JSON.parse(storage).hasLaunched).toBe(true)
  expect(JSON.parse(storage).tutorialState.completed).toHaveLength(5)
})
```

**First Launch with Tutorial Skip:**
```
test('E2E: First launch skipping tutorial', async () => {
  await page.goto('http://localhost:3000')
  await expect(page.locator('[data-testid="welcome-screen"]')).toBeVisible()

  // Skip tutorial
  await page.click('[data-testid="skip-tutorial-btn"]')

  // Verify jumped to project creation
  await expect(page.locator('[data-testid="project-creation-screen"]')).toBeVisible()

  // Create project and verify canvas loads
  await page.click('[data-testid="blank-canvas-option"]')
  await page.fill('[data-testid="project-name-input"]', 'Quick Start Project')
  await page.click('[data-testid="create-project-btn"]')
  await expect(page.locator('[data-testid="canvas-page"]')).toBeVisible()

  // Verify skip recorded in storage
  const storage = await page.evaluate(() => localStorage.getItem('onboarding'))
  expect(JSON.parse(storage).tutorialState.skipped).toBe(true)
})
```

## 11. Common Pitfalls and Solutions

### Pitfall 1: Tutorial Validation Too Strict

**Problem:**
Tutorial step validation is too strict, preventing users from completing steps even when they've performed the correct action. For example, Step 1 validates only for "AHU" entity type, but user might place a different equipment type first.

**Why It Happens:**
- Overly specific validation logic
- Not accounting for user experimentation
- Validation tied to exact entity types rather than general actions

**Solution:**
- Validate general actions rather than specific entity types
- For Step 1, accept ANY equipment placement, not just AHU
- Allow users to complete steps through alternative valid actions
- Provide hints if user seems stuck after 15 seconds

**Code Consideration:**
```
// Too strict:
validateStep1 = (event) => event.entityType === 'AHU'

// Better:
validateStep1 = (event) => event instanceof EntityPlacedEvent
```

### Pitfall 2: Storage Flag Race Conditions

**Problem:**
Multiple components try to read/write onboarding flags simultaneously during initialization, causing race conditions and inconsistent state.

**Why It Happens:**
- Asynchronous storage operations
- Multiple components mounting and checking flags concurrently
- No synchronization mechanism

**Solution:**
- Centralize storage operations in OnboardingService
- Use mutex/lock pattern for critical storage operations
- Load all onboarding state once during app initialization
- Use Zustand store as single source of truth, storage as persistence only
- Debounce rapid writes to storage

**Implementation:**
```
// Load once during initialization
await OnboardingService.initialize() // Loads all flags into AppStateStore

// All components read from store, not storage directly
const hasLaunched = useAppStateStore(state => state.hasLaunched)
```

### Pitfall 3: Tutorial Overlay Blocks Critical UI

**Problem:**
Tutorial overlay and tooltips sometimes block critical UI elements that users need to interact with, particularly on smaller screens or when tooltips are positioned poorly.

**Why It Happens:**
- Fixed tooltip positioning
- No responsive adjustments for screen size
- Z-index conflicts
- Overlay covers interactive elements

**Solution:**
- Implement smart tooltip positioning that avoids blocking target elements
- Use pointer-events: none on overlay backdrop for non-tutorial areas
- Calculate available space and adjust tooltip position dynamically
- Provide "Reposition" button in tooltips if user reports blocked UI
- Test on multiple screen sizes during development

**CSS Consideration:**
```
.tutorial-overlay-backdrop {
  pointer-events: none; /* Allow clicks through backdrop */
}

.tutorial-highlighted-element {
  pointer-events: auto; /* Only highlighted area receives clicks */
}
```

### Pitfall 4: Poor Template Loading Performance

**Problem:**
Template loading during project creation is slow, causing delays and poor user experience. Users may think the application is frozen.

**Why It Happens:**
- Templates not pre-loaded or cached
- Large template data fetched synchronously
- No loading indicators during fetch
- Template images not optimized

**Solution:**
- Pre-load popular templates during splash screen
- Cache templates in IndexedDB after first load
- Show loading skeleton/spinner during template fetch
- Lazy load template previews (thumbnails first, full data on selection)
- Optimize template data size (compress, remove unnecessary metadata)
- Implement progressive loading for template gallery

**Implementation Pattern:**
```
// Pre-load during initialization
AppInitializer.initialize() → TemplateService.preloadPopular()

// Show loading state
{isLoadingTemplate ? <TemplateSkeleton /> : <TemplatePreview />}

// Cache after load
TemplateService.loadTemplate(id) → cache in IndexedDB → return data
```

### Pitfall 5: Onboarding Never Completes Due to Bug

**Problem:**
A bug in validation logic or state management causes tutorial to never mark as complete, forcing users through tutorial on every launch.

**Why It Happens:**
- Validation logic has edge case bug
- Storage write failure not handled
- Flag checked before being set
- State not properly persisted between sessions

**Solution:**
- Add explicit "Mark Complete" fallback button in tutorial
- Implement admin/debug mode to manually reset onboarding state
- Add logging to track validation and storage operations
- Provide "Reset Tutorial" option in settings
- Set completion timeout: auto-complete after 10 minutes regardless of validation
- Monitor analytics for users stuck in onboarding loop

**Safety Mechanism:**
```
// Fallback: Auto-complete after timeout
useEffect(() => {
  if (tutorialActive && elapsedTime > 10 * 60 * 1000) {
    TutorialService.forceComplete()
    showWarning('Tutorial auto-completed due to extended duration')
  }
}, [tutorialActive, elapsedTime])
```

## 12. Performance Tips

### Tip 1: Lazy Load Tutorial Assets

Load tutorial videos, animations, and images only when tutorial is actually started, not during initial application load.

**Implementation:**
- Split tutorial assets into separate bundle
- Dynamic import tutorial components when "Start Tutorial" clicked
- Use React.lazy() for TutorialOverlay component

**Impact:** Reduces initial bundle size by ~200KB, improves splash screen load time

### Tip 2: Debounce Tutorial Validation Checks

Avoid running validation logic on every event. Debounce validation checks to reduce CPU usage during tutorial.

**Implementation:**
- Debounce validation by 200ms
- Cache validation results for identical events
- Use event listeners sparingly, remove when step complete

**Impact:** Reduces CPU usage during tutorial by 30-40%

### Tip 3: Optimize Equipment Library Loading

Load equipment library progressively: essential equipment first, then extended library in background.

**Implementation:**
- Load "starter kit" (5-10 essential items) immediately
- Background load full library while user explores
- Pre-render equipment thumbnails during idle time

**Impact:** Reduces perceived load time from 3s to under 1s

### Tip 4: Cache Welcome Screen Assets

Cache welcome screen images and icons to avoid re-fetching on repeated launches (users who uncheck "Don't show again").

**Implementation:**
- Use service worker to cache welcome assets
- Store in browser cache with long TTL
- Preload critical images during splash screen

**Impact:** Welcome screen appears instantly on subsequent launches

### Tip 5: Minimize Storage Operations

Batch multiple onboarding flag updates into single storage write operation.

**Implementation:**
- Queue flag updates in memory
- Write to storage on debounce (1 second) or on critical events (tutorial complete)
- Use single storage key for all onboarding state vs. multiple keys

**Impact:** Reduces IndexedDB operations by 70%, prevents write contention

## 13. Future Enhancements

1. **Video Tutorial Option**: Provide short video tutorials alongside interactive walkthrough for visual learners

2. **Role-Based Onboarding**: Customize tutorial based on user role (Designer, Engineer, Manager) with different focus areas

3. **Progressive Proficiency System**: Track user proficiency over time and offer advanced tutorials for power features

4. **Onboarding Analytics Dashboard**: Admin dashboard showing tutorial completion rates, drop-off points, and common failure steps

5. **In-App Tutorial Library**: Access to full tutorial library from help menu for learning specific features on-demand

6. **Contextual Micro-Tutorials**: Trigger brief tutorials when user first accesses advanced features (e.g., calculations panel)

7. **Community Templates Gallery**: Allow users to share and browse community-created templates during project creation

8. **Personalized Recommendations**: Suggest templates based on user's industry, project type, or previous work

9. **Interactive Onboarding Checklist**: Persistent checklist showing progress through recommended beginner tasks

10. **Gamification Elements**: Award badges, achievements, and progress tracking for completing tutorials and milestones
