# SizeWise HVAC Canvas App: End-to-End User Journey

This comprehensive guide walks through the complete user experience of the SizeWise HVAC Canvas application, from launching the dashboard to exporting finished designs. It covers project management, canvas editing, and file operations with detailed references to the underlying components and stores.

---

## Table of Contents

- [1. Dashboard Journey](#1-dashboard-journey)
  - [1.1 Viewing the Project List](#11-viewing-the-project-list)
  - [1.2 Creating a New Project](#12-creating-a-new-project)
  - [1.3 Opening an Existing Project](#13-opening-an-existing-project)
  - [1.4 Managing Projects](#14-managing-projects)
- [2. Canvas Editor Journey](#2-canvas-editor-journey)
  - [2.1 Canvas Overview](#21-canvas-overview)
  - [2.2 Viewport Navigation](#22-viewport-navigation)
  - [2.3 Creating Rooms](#23-creating-rooms)
  - [2.4 Drawing Ducts](#24-drawing-ducts)
  - [2.5 Placing Equipment](#25-placing-equipment)
  - [2.6 Selection and Manipulation](#26-selection-and-manipulation)
  - [2.7 Property Editing](#27-property-editing)
  - [2.8 Undo/Redo Operations](#28-undoredo-operations)
- [3. Project Management Journey](#3-project-management-journey)
  - [3.1 Auto-Save Functionality](#31-auto-save-functionality)
  - [3.2 Manual Saving](#32-manual-saving)
  - [3.3 Dirty State Tracking](#33-dirty-state-tracking)
- [4. Export Journey](#4-export-journey)
  - [4.1 JSON Export](#41-json-export)
  - [4.2 CSV Export (Bill of Materials)](#42-csv-export-bill-of-materials)
  - [4.3 PDF Export](#43-pdf-export)

---

## 1. Dashboard Journey

The dashboard is the central hub for managing all HVAC projects. Users can view, create, organize, and access their projects from this interface.

### 1.1 Viewing the Project List

1. **Launch the application** – Navigate to the dashboard to see all projects displayed in a card-based grid layout.

2. **Browse active projects** – The default view shows active (non-archived) projects sorted by last modified date. Each project card displays:
   - Project name
   - Client name (if specified)
   - Project number (if specified)
   - Last modified date
   - Action menu (three dots)

3. **Switch to archived projects** – Click the "Archived" tab to view projects that have been archived. The tab shows a count badge indicating the number of projects in each category.

4. **Search and filter** – Use the search input to filter projects by name, client name, or project number. Results update in real-time as you type.

5. **Sort projects** – Change the sort order using the dropdown (Last Modified, Date Created, Name) and toggle ascending/descending order.

**Related Components**: [DashboardPage](elements/12-pages/DashboardPage.md), [ProjectCard](elements/01-components/dashboard/ProjectCard.md), [projectListStore](elements/02-stores/projectListStore.md)

### 1.2 Creating a New Project

1. **Open the new project dialog** – Click the "New Project" button in the dashboard header or use **Ctrl/Cmd + N**.

2. **Enter project details** – Fill in the project metadata:
   - **Project Name** (required) – A descriptive name for the HVAC design
   - **Project Number** (optional) – An identifier like "2024-001"
   - **Client Name** (optional) – The client or company name

3. **Validate and submit** – The project name is validated in real-time. Names must be non-empty and under 100 characters. Click "Create" to proceed.

4. **Navigate to the canvas** – Upon successful creation, you're automatically redirected to the canvas editor for the new project.

```
User clicks "New Project"
    └─> NewProjectDialog opens
         └─> User fills form
              └─> Validation passes
                   └─> addProject() to store
                        └─> Navigate to /canvas/[projectId]
```

**Related Components**: [NewProjectDialog](elements/01-components/dashboard/NewProjectDialog.md), [projectListStore](elements/02-stores/projectListStore.md)

### 1.3 Opening an Existing Project

1. **Click a project card** – Single-click any project card to open it in the canvas editor. The application navigates to `/canvas/[projectId]`.

2. **Use the context menu** – Click the three-dot menu on a project card and select "Open" for the same result.

3. **Keyboard navigation** – Use Tab to navigate between project cards and Enter to open the focused project.

**Visual Layout**:
```
┌─────────────────────────────────────┐
│  ┌─────┐                        ⋮  │  <- Click to open menu
│  │ 📁  │  Project Name              │  <- Click anywhere to open
│  └─────┘                            │
│                                     │
│  Client: [Client Name]              │
│  Modified: Dec 28, 2025             │
└─────────────────────────────────────┘
```

### 1.4 Managing Projects

#### Renaming Projects
- Double-click the project name on a card to enter inline edit mode
- Type the new name and press Enter to save, or Escape to cancel
- Changes are immediately persisted to the project list store

#### Duplicating Projects
- Click the context menu (⋮) and select "Duplicate"
- A copy is created with "(Copy)" appended to the name
- The duplicate appears at the top of the project list

#### Archiving Projects
- Click the context menu and select "Archive"
- The project moves to the Archived tab
- Archived projects can be restored by clicking "Restore" in the Archived view

#### Deleting Projects
1. Click the context menu and select "Delete"
2. A confirmation dialog appears to prevent accidental deletion
3. Confirm to permanently remove the project from the list

```
User clicks "Delete"
    └─> ConfirmDialog opens
         └─> "Are you sure you want to delete [Project Name]?"
              └─> User confirms
                   └─> removeProject() from store
                        └─> Toast notification shown
```

**Related Components**: [ConfirmDialog](elements/01-components/dashboard/ConfirmDialog.md), [ProjectCard](elements/01-components/dashboard/ProjectCard.md)

---

## 2. Canvas Editor Journey

The canvas editor is where HVAC layouts are designed. This section covers the complete workflow from viewport navigation to entity manipulation.

### 2.1 Canvas Overview

**Launch the canvas from the dashboard** – Open the "Canvas Editor" and land on the workspace with:
- Toolbar on the left
- Canvas in the center
- Zoom controls bottom-right
- Status bar showing cursor coordinates

**Review the default view** – The grid is visible and the view is centered; pan/zoom state comes from the viewport store defaults (pan 0,0 and 100% zoom).

### 2.2 Viewport Navigation

1. **Pan to working area** – Hold **Space** and drag (or use the middle mouse button) to move the view; the viewport hook tracks panning and updates `panX/panY` so the grid and entities move under the cursor.

2. **Zoom in for detail** – Scroll the mouse wheel to zoom on the cursor or tap the zoom buttons; the viewport store clamps the zoom, and the canvas re-renders with the new scale and pan so geometry stays aligned.

3. **Use zoom-to-fit when needed** – If the layout drifts off-screen, trigger fit-to-content/reset from the zoom controls to recenter the scene (pan reset and zoom returns to default).

**Related Components**: [viewportStore](elements/02-stores/viewportStore.md), [ZoomControls](elements/01-components/canvas/ZoomControls.md), [useViewport](elements/07-hooks/useViewport.md)

### 2.3 Creating Rooms

1. **Switch to the Room tool (R)** – Click the Room icon or press **R**; the toolbar updates the active tool and the canvas cursor becomes a crosshair for placement.

2. **Create the office boundary** – First click sets the starting corner, moving the mouse previews the rectangle with dashed edges, and the second click commits the room if it meets the 12" minimum in both directions (invalid sizes preview red).

3. **Name and sizing defaults** – The created room auto-names (Room 1, Room 2, …) and calculates area, volume, and required CFM based on default dimensions and ACH so the design starts with meaningful loads.

**Related Components**: [RoomTool](elements/04-tools/RoomTool.md), [RoomRenderer](elements/05-renderers/RoomRenderer.md), [RoomDefaults](elements/08-entities/RoomDefaults.md)

### 2.4 Drawing Ducts

1. **Draw a perimeter duct run (D)** – Switch to the Duct tool (shortcut **D**). Click to start, drag to preview, and release to place a duct segment; previews turn red if the drawn length is under 1 ft, and finalized ducts carry length/rotation plus airflow labels.

2. **Inspect duct calculations and velocity risk** – Each duct stores shape, size, airflow, and derived area/velocity/friction. High velocities (derived from airflow ÷ area) surface in the calculated values so the Inspector can flag warnings when limits are exceeded.

**Related Components**: [DuctTool](elements/04-tools/DuctTool.md), [DuctRenderer](elements/05-renderers/DuctRenderer.md), [DuctDefaults](elements/08-entities/DuctDefaults.md)

### 2.5 Placing Equipment

1. **Place diffusers and equipment (E)** – Activate the Equipment tool (shortcut **E**). Hover shows a preview box sized to the selected type defaults, and a click drops the unit centered on the pointer (e.g., diffusers along the duct, a fan/air handler near the supply).

2. **Cycle equipment types** – Choose among hood, fan, diffuser, damper, or air_handler; each type uses its own default capacity, static pressure, and dimensions so the canvas preview matches expected footprint and ratings.

**Related Components**: [EquipmentTool](elements/04-tools/EquipmentTool.md), [EquipmentRenderer](elements/05-renderers/EquipmentRenderer.md), [EquipmentDefaults](elements/08-entities/EquipmentDefaults.md)

### 2.6 Selection and Manipulation

1. **Return to Select tool (V) for cleanup** – Press **V** to re-enter selection mode. Click once to select a single entity, Shift-click to add/remove items, or drag a marquee to multi-select grouped objects (rooms, ducts, equipment).

2. **See selection styling** – Selected rooms show thicker outlines and handles; ducts/equipment swap to blue strokes so it's obvious what will be modified on the next action.

3. **Move entities precisely** – Drag selections directly on the canvas or nudge with arrow keys; holding **Shift** steps faster (1 ft vs 1 in) while respecting grid snap if enabled. Multi-select moves all chosen items together.

4. **Duplicate for repetitive layouts** – Press **Ctrl+D** with one or more entities selected to clone them offset from the originals, keeping types and properties intact so you can rapidly place identical diffusers or rooms.

5. **Delete mistakes quickly** – Hit **Delete/Backspace** to remove selected items; the selection store clears afterward to avoid accidental edits on removed entities.

**Related Components**: [SelectTool](elements/04-tools/SelectTool.md), [selectionStore](elements/02-stores/selectionStore.md), [SelectionMarquee](elements/01-components/canvas/SelectionMarquee.md)

### 2.7 Property Editing

1. **Edit properties in the Inspector panel** – With entities selected, adjust dimensions, airflow, occupancy, or equipment capacity. Changes flow through the Zod schemas and calculators so derived metrics (room area/CFM, duct velocity/friction) refresh live; schema constraints (e.g., room sizes, duct shape requirements) surface validation errors until values are fixed.

2. **Resolve validation issues** – If a room entry drops below 1" width/length or ACH above 100, the schema rejects it and the Inspector highlights the offending field; correcting the input clears the error and immediately updates calculations and render sizing.

3. **Check calculations after edits** – After moving or resizing, the underlying calculated fields (room volumes/CFM, duct velocity/friction, equipment ratings) remain aligned with current properties, keeping the design balanced.

**Related Components**: [InspectorPanel](elements/01-components/inspector/InspectorPanel.md), [RoomInspector](elements/01-components/inspector/RoomInspector.md), [DuctInspector](elements/01-components/inspector/DuctInspector.md)

### 2.8 Undo/Redo Operations

1. **Undo/redo design changes** – Use **Ctrl+Z** to step back through create/update/delete actions and **Ctrl+Y** to reapply them; the history store keeps bounded stacks of reversible commands so layout changes remain recoverable.

2. **Viewport finishing pass** – Zoom out to overview the system, then reset/fit the view to ensure everything is within the canvas for final review.

3. **Final clean-up** – Use marquee select plus Delete to remove temporary construction lines, then nudge remaining elements into alignment. The status bar continues to show live cursor coordinates for precise placement.

**Related Components**: [historyStore](elements/02-stores/historyStore.md), [EntityCommands](elements/09-commands/EntityCommands.md), [useUndoRedo](elements/07-hooks/useUndoRedo.md)

---

## 3. Project Management Journey

Project persistence ensures that work is never lost. The application provides both automatic and manual saving mechanisms.

### 3.1 Auto-Save Functionality

The application automatically saves your work to prevent data loss:

1. **Debounced auto-save** – Changes to entities or viewport state trigger an auto-save after 2 seconds of inactivity. This prevents excessive writes while ensuring timely persistence.

2. **Change detection** – The auto-save hook monitors:
   - Entity store changes (additions, updates, deletions)
   - Viewport store changes (pan position, zoom level)

3. **Save on page close** – When you navigate away or close the browser, any unsaved changes are automatically saved using the `beforeunload` event.

```
Change detected → Clear timer → Wait 2s → Save to localStorage
                                   ↑
New change → Reset timer ──────────┘
```

**Saved Data Structure**:
```typescript
interface StoredProject {
  projectId: string;
  projectName: string;
  projectNumber: string;
  clientName: string;
  createdAt: string;
  modifiedAt: string;
  entities: { byId: Record<string, Entity>; allIds: string[] };
  viewportState: { panX: number; panY: number; zoom: number };
  settings: { unitSystem: 'imperial' | 'metric'; gridSize: number; gridVisible: boolean };
}
```

**Storage Key**: `hvac-project-{projectId}`

**Related Components**: [useAutoSave](elements/07-hooks/useAutoSave.md), [projectStore](elements/02-stores/projectStore.md), [ProjectIO](elements/10-persistence/ProjectIO.md)

### 3.2 Manual Saving

For explicit control over when projects are saved:

1. **Trigger manual save** – Use the save button or keyboard shortcut to immediately persist the current state.

2. **Save confirmation** – A toast notification confirms successful saves or reports any errors.

3. **Save-as functionality** – Export the project with a different name or to a different location using the export options.

### 3.3 Dirty State Tracking

The application tracks whether there are unsaved changes:

1. **Dirty indicator** – When changes are pending, a visual indicator shows "Unsaved changes" in the interface.

2. **Unsaved changes warning** – Attempting to close a project or navigate away with unsaved changes triggers a confirmation dialog.

3. **State reset** – After a successful save, the dirty state is cleared.

```typescript
// Dirty state is true when:
// - Entities have been modified since last save
// - Viewport has changed since last save
const { isDirty, save } = useAutoSave();
```

---

## 4. Export Journey

The export system allows users to share and document their HVAC designs in multiple formats.

### 4.1 JSON Export

Export complete project data for backup or import into other tools:

1. **Click the JSON button** in the export menu located in the canvas toolbar.

2. **Download triggers automatically** – The browser downloads a JSON file named after your project (e.g., `My HVAC Layout.json`).

3. **File contents** include:
   - Version information
   - Project ID and metadata
   - All entities with their properties and calculated values
   - Timestamps (created, modified)

**Output Example**:
```json
{
  "version": "1.0.0",
  "projectId": "uuid-here",
  "projectName": "My HVAC Layout",
  "entities": {
    "byId": { ... },
    "allIds": [ ... ]
  },
  "createdAt": "2025-12-29T10:00:00Z",
  "modifiedAt": "2025-12-29T12:30:00Z"
}
```

**Use Cases**: Backup, version control, importing into other tools

### 4.2 CSV Export (Bill of Materials)

Export a bill of materials for material ordering and cost estimation:

1. **Click the CSV button** in the export menu.

2. **Download the BOM file** – Named `[Project Name]-bom.csv`.

3. **Open in spreadsheet software** – The CSV is compatible with Excel, Google Sheets, and Numbers.

**Output Example**:
```csv
Category,Item,Quantity,Unit,Specification
Ductwork,Round Duct,45,ft,"12"" diameter, galvanized"
Ductwork,Rectangular Duct,30,ft,"16""x8"", galvanized"
Equipment,AHU,1,ea,"5000 CFM, 2.5"" SP"
Equipment,Exhaust Fan,2,ea,"1000 CFM each"
Fittings,90° Elbow,8,ea,"12"" round"
```

**Use Cases**: Material ordering, cost estimation, spreadsheet analysis

### 4.3 PDF Export

Generate a printable document with the project layout and bill of materials:

1. **Click the PDF button** in the export menu.

2. **Wait for generation** – PDF creation may take a moment for complex layouts.

3. **Download the PDF** – Named `[Project Name].pdf`.

4. **PDF Contents**:
   - **Page 1**: Project title, metadata, canvas layout (scaled to fit)
   - **Page 2+**: Bill of materials table

**Output Specifications**:
- Page size: Letter (8.5" × 11")
- File size: ~50-500 KB depending on layout complexity
- Includes embedded canvas image

**Error Handling**:
- If the canvas is too large or memory is insufficient, an error message is displayed
- Users can try reducing canvas complexity or splitting the layout

**Use Cases**: Printing, client presentations, documentation

**Related Components**: [ExportMenu](elements/01-components/export/ExportMenu.md), [BOMPanel](elements/01-components/canvas/BOMPanel.md), [useBOM](elements/07-hooks/useBOM.md)

---

## Summary

This journey covers the complete user experience of the SizeWise HVAC Canvas application:

| Journey Phase | Key Actions | Keyboard Shortcuts |
|---------------|-------------|-------------------|
| **Dashboard** | View, create, manage projects | Ctrl+N (new), Ctrl+F (search) |
| **Canvas Navigation** | Pan, zoom, fit-to-view | Space+drag, scroll wheel |
| **Entity Creation** | Rooms, ducts, equipment | R, D, E |
| **Selection** | Select, multi-select, marquee | V, Shift+click, drag |
| **Editing** | Move, duplicate, delete | Arrow keys, Ctrl+D, Delete |
| **History** | Undo, redo | Ctrl+Z, Ctrl+Y |
| **Saving** | Auto-save, manual save | Automatic after 2s |
| **Export** | JSON, CSV, PDF | Via toolbar buttons |

This comprehensive workflow exercises every implemented entity type, tool, interaction model, validation path, calculation update, persistence mechanism, and export capability in the SizeWise HVAC Canvas application.
