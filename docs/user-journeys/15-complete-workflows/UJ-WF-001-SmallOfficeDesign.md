# User Journey: Small Office Design

## 1. Overview

### Purpose
This user journey describes a day-in-the-life workflow for an HVAC designer creating a small office space design using the SizeWise HVAC Canvas App.

### Scope
- Creating new project from dashboard 
- Setting grid to 1ft (for precision)
- Drawing room boundaries on canvas
- Placing RTU from equipment library
- Drawing ducts and connecting them via canvas tools
- Undoing a mistake using keyboard shortcuts
- Exporting the final design as PDF for client presentation

### User Personas
- **Primary**: HVAC Designer
- **Secondary**: Project Manager

### Success Criteria
- Entire workflow completes successfully from start to finish with no errors or issues 
- All steps reflect realistic application behavior and user interactions in context
- Final export matches expected format and quality standards for professional use

## 2. PRD References

### Related PRD Sections
- **Section 3.1: Project Creation & Management** - This workflow involves opening a new project from dashboard.
- **Section 5.2: Canvas Editing Tools** - The design process includes drawing room boundaries and placing ducts/RTUs via tools.

### Key Requirements Addressed
- REQ-WF-001: User must be able to create a new project and begin designing 
- REQ-WF-002: Designer should have access to all canvas interaction capabilities (drawing, placement)
- REQ-WF-003: Application must support undo/redo functionality for error correction
- REQ-WF-004: Export capability is needed for final deliverable sharing

## 3. Prerequisites

### User Prerequisites
- A project is open with canvas visible and active

### System Prerequisites
- Dashboard component initialized with project creation options 
- Canvas editor rendered correctly with tools available
- Sidebar equipment library accessible via toggle button or tab

### Data Prerequisites
- None required (this journey starts from scratch)

### Technical Prerequisites
- `Dashboard` component handles project initialization and routing to canvas view
- `Canvas` and `Toolbar` components are initialized with state management support 
- EntityStore is ready for adding/removing elements 
- Export service available for PDF generation 

## 4. User Journey Steps

### Step 1: Create Project From Dashboard
**User Actions:**
1. Launch the application from desktop or browser
2. Click "New Project" button in dashboard view
3. Enter project name (e.g., "Small Office Design") and click "Create"

**System Response:**
1. Application navigates to new canvas page with blank state 
2. Default grid size is set automatically based on user preference (default: 1ft)
3. Canvas initializes cleanly with no existing entities or data
4. Toolbar displays available tools in standard layout for design work 

**Visual State:**
```
[Dashboard]
  [New Project] <- Selected
    Name: Small Office Design 
      [Create Button]

[Canvas]
  Grid Set To: 1ft (Default)
    Blank Canvas Ready For Editing
```

**User Feedback:**
- Clean transition from dashboard to canvas view
- Toast notification confirming successful project creation and initialization

**Related Elements:**
- Components: `Dashboard`, `Canvas` 
- Stores: None (initialization handled by routing)
- Services: None
- Events: `onProjectCreated`, `onCanvasInitialized`

### Step 2: Set Grid to 1ft for Precision
**User Actions:**
1. Open settings menu or toolbar from main navigation
2. Navigate to "Grid" settings panel 
3. Select grid spacing of "1 foot"
4. Confirm setting in UI dropdown or input field

**System Response:**
1. Grid is updated dynamically on canvas with new dimensions (e.g., 1ft spacing)
2. All elements placed will snap to this grid when moved or drawn 
3. Canvas renders new grid lines and labels for visual reference 
4. Existing entities retain their positions but are snapped according to new grid rules

**Visual State:**
```
[Settings Panel]
  Grid Size: [1 ft] <- Selected
    [0.5 ft] 
    [1 ft] ✓
    [2 ft] 

[Canvas]
  Grid Lines Visible At 1ft Intervals
```

**User Feedback:**
- Canvas immediately redraws with new grid settings 
- Tooltips show updated grid size in real-time during placement

**Related Elements:**
- Components: `SettingsModal`, `Canvas` 
- Stores: `preferencesStore.ts` (for storing grid preference)
- Services: None
- Events: `onGridSizeChanged`, `onGridApplied`

### Step 3: Draw Room Boundaries on Canvas
**User Actions:**
1. Select "Room Tool" from the toolbar 
2. Click and drag to define room dimensions (e.g., 10ft x 15ft)
3. Release mouse button when finished drawing boundary lines
4. Verify room is correctly snapped to grid at start point and end point

**System Response:**
1. Tool begins drawing new polygon for the room boundary on canvas 
2. Lines snap to nearest valid grid coordinate during drawing (e.g., 0,0 -> 10ft,15ft)
3. Canvas updates with room entity added to `EntityStore` state
4. New entity appears visually in correct location and dimensions

**Visual State:**
```
[Canvas]
  [Room Entity Placed] 
    Dimensions: 10 ft x 15 ft
      Snapped To Grid At (0,0) -> (10ft, 15ft)
```

**User Feedback:**
- Room boundary drawn as solid black line with visible snapping points
- Immediate visual feedback during drawing process (e.g., cursor follows grid)

**Related Elements:**
- Components: `Canvas`, `Toolbar` 
- Stores: `EntityStore` (for adding new room entity)
- Services: None
- Events: `onRoomDrawStarted`, `onRoomAdded`

### Step 4: Place RTU from Equipment Library
**User Actions:**
1. Click "Equipment" or sidebar tab to open library panel 
2. Browse categories and select "RTUs"
3. Drag an RTU item (e.g., "RTU-01") from the list to canvas area
4. Release mouse button near room boundary to drop it at desired location

**System Response:**
1. Equipment library opens with category view active
2. Ghost image of dragged element appears under cursor during drag 
3. On drop, `EntityStore.addEntity()` is called with RTU data 
4. RTU appears on canvas with correct properties and placement snapped to grid
5. BOM panel updates automatically to reflect new entity count

**Visual State:**
```
[Canvas]
  [RTU-01] Placed At (2ft, 3ft)
    Grid Snapped To: (2ft, 3ft) 
      [BOM Panel Shows RTU-01 With Qty=1]

[Equipment Library]
  [RTUs Category Opened]
```

**User Feedback:**
- Element placed immediately with correct dimensions and render style
- Visual feedback from BOM panel update (e.g., toast or auto-scroll)

**Related Elements:**
- Components: `Canvas`, `EquipmentLibrary`, `BOMPanel` 
- Stores: `EntityStore` (for adding RTU entity)
- Services: None
- Events: `onRTUDragStart`, `onEntityDropped`

### Step 5: Draw Ducts and Connect Them to RTUs via Canvas Tools
**User Actions:**
1. Switch to "Duct Tool" from toolbar 
2. Click on RTU (e.g., "RTU-01") to begin drawing duct path
3. Drag cursor through desired routing path around room
4. Release when ending at intended location (e.g., near window)
5. Validate duct connections match expected layout in BOM or UI visualization 

**System Response:**
1. Duct tool activates with appropriate visual feedback on toolbar
2. Drawing begins from selected RTU position and extends along user path
3. Line is drawn as free-form shape that snaps to grid when released
4. System calculates duct length and properties based on distance and placement
5. New duct entity added to `EntityStore` state 
6. Connection logic triggers automatically (if enabled) or via manual link in UI
7. Canvas updates with new duct element rendered correctly

**Visual State:**
```
[Canvas]
  [RTU-01] 
    [Duct-234] Connected To RTU From (2ft,3ft)
      Length: 5 ft
        Duct Path Snapped To Grid
          [Connection Point On RTU]

[BOM Panel]
  Item | Qty | Details
  RTU1 | 1   | Type: X 
  Duct | 1   | Size: 8"
```

**User Feedback:**
- Duct appears with correct visual styling and connection points highlighted
- BOM panel updates instantly to include new duct entity in list

**Related Elements:**
- Components: `Canvas`, `Toolbar` 
- Stores: `EntityStore` (for adding duct entity)
- Services: None
- Events: `onDuctDrawStarted`, `onDuctAdded`

### Step 6: Undo a Mistake Using Keyboard Shortcuts
**User Actions:**
1. Make an error by clicking and dragging too far outside intended area when placing duct 
2. Press "Ctrl" key + "Z" to undo last action (duct placement)
3. Observe the change on canvas with immediate visual feedback
4. Optionally press "Ctrl+Y" to redo the action if needed

**System Response:**
1. System tracks all actions in stack of undo/redo history
2. When Ctrl+Z is pressed, the last action (duct placement) is reverted 
3. Canvas reflects removal of duct from entity store and updates visual display
4. Undo operation triggers immediate UI refresh to show previous state without duct
5. Visual indicator shows undo availability in toolbar or status bar if present

**Visual State:**
```
[Canvas]
  [RTU-01] Still Present At (2ft,3ft)
    No Duct Connected Yet <- Undo Was Performed

[Toolbar]
  Undo/Redo Icons Updated: 
    Undo: Enabled | Redo: Available
```

**User Feedback:**
- Element disappears immediately when undo is performed
- Toolbar buttons show updated state reflecting available actions

**Related Elements:**
- Components: `Canvas`, `Toolbar` 
- Stores: None (undo/redo handled internally)
- Services: `useKeyboardShortcuts.ts`
- Events: `onUndoAction`, `onRedoAction`

### Step 7: Export PDF for Client Presentation
**User Actions:**
1. Click "File" menu in toolbar 
2. Select "Export" submenu and then "PDF"
3. Configure print bounds (e.g., "Fit to View") if needed
4. Click "Export" to generate and download PDF file
5. Wait for completion of automatic download process

**System Response:**
1. Menu opens with export options displayed 
2. System prepares blob in browser memory from current canvas state
3. Applies configured print bounds (e.g., Fit to View)
4. Triggers automatic download using default browser behavior (e.g., file dialog shown)
5. File downloads to user's default location with timestamped name like "SizeWise_2025-04-05.pdf"

**Visual State:**
```
[Export Menu]
  Export Settings:
    [Fit to View] ✓
    Whole Canvas 

[Browser Download Bar]
  [Download Started] 
    File: SizeWise_2025-04-05.pdf
```

**User Feedback:**
- Toast notification appears confirming successful export and download start
- Browser downloads file to standard location with timestamped filename

**Related Elements:**
- Components: `ExportMenu`, `Canvas` 
- Stores: None
- Services: `pdf.ts` (export service)
- Events: `onPDFExportInitiated`, `onDownloadComplete`

## 5. Edge Cases and Handling

1. **Too Many Ducts Placed**
   - **Scenario**: User adds several duct entities to canvas causing performance issues 
   - **Handling**: System throttles rendering updates with visual loading indicators during complex scene processing, provides warning if too many elements are present at once
   - **Test Case**: `tests/e2e/workflow/too-many-ducts`

2. **Grid Snapping Issues**
   - **Scenario**: User draws shape that snaps incorrectly to grid (e.g., room boundary doesn't align properly)
   - **Handling**: System uses snapping tolerance algorithm and corrects minor misalignments; logs issue for improvement if snapping appears faulty 
   - **Test Case**: `tests/e2e/workflow/grid-snapping`

3. **Crash During Export**
   - **Scenario**: User clicks export while canvas is still processing many elements (e.g., high-res drawing)
   - **Handling**: System prevents crash by adding timeout or pausing operations until ready to handle export, shows notification if needed 
   - **Test Case**: `tests/e2e/workflow/crash-during-export`

4. **Undo History Overflow**
   - **Scenario**: User performs hundreds of actions without saving or resetting state
   - **Handling**: System limits undo history to last 100 steps and warns user if reaching limit 
   - **Test Case**: `tests/e2e/workflow/undo-history`

5. **Invalid Equipment Data**
   - **Scenario**: User selects invalid item from equipment library (e.g., broken link or corrupted data)
   - **Handling**: System filters out invalid items and shows error dialog with option to retry or select another element 
   - **Test Case**: `tests/e2e/workflow/invalid-equipment`

## 6. Error Scenarios and Recovery

1. **Canvas Freezing During Drawing**
   - **Scenario**: User starts drawing room boundary but app becomes unresponsive during the action (i.e., freezing)
   - **Recovery**: System detects freeze, shows error screen with option to reload application or try again 
   - **User Feedback**: "App is unresponsive. Click Reload to continue"

2. **Export Generation Fails**
   - **Scenario**: An unexpected issue occurs while generating PDF from canvas elements (e.g., memory overuse)
   - **Recovery**: System displays error modal with guidance, suggests simplifying design or reducing resolution before retrying export 
   - **User Feedback**: "PDF Export Failed. Try reducing canvas complexity and re-export"

3. **Undo/Redo Stack Corruption**
   - **Scenario**: Undo history is corrupted due to state inconsistency from bad interaction with tools
   - **Recovery**: System detects invalid undo state, resets internal stack to default and shows warning in UI if necessary 
   - **User Feedback**: "Undo/redo system reset. Current actions may not be recoverable"

## 7. Performance Considerations
- All drawing tools should respond within 50ms of user input for smooth experience during room or duct creation
- Canvas rendering must maintain at least 30fps even with multiple entities present 
- Export process should complete within 30 seconds for medium-sized projects (up to 20MB)

## 8. Keyboard Shortcuts
| Action | Shortcut | Context |
|--------|----------|---------|
| Undo Last Change | Ctrl + Z | Canvas view has focus |
| Redo Last Undo | Ctrl + Y | Canvas view has focus |
| Save Project | Ctrl + S | App is active |
| Export PDF | Ctrl + P | When File menu is open |

## 9. Accessibility & Internationalization
- All actions in workflow are available via both mouse and keyboard shortcuts for accessibility compliance 
- Tooltips and labels are localized to match UI language preferences (English, Spanish, French)
- Screen reader support enabled across all interactive components using ARIA attributes

## 10. Key UI Components & Interactions
- `Dashboard`: Handles project creation and navigation to canvas view
- `Canvas`: Core editor where room boundaries, ducts, and RTUs are placed 
- `Toolbar`: Provides access to drawing tools, undo/redo, and export functions 
- `EquipmentLibrary`: Panel for browsing components like RTUs that can be dragged onto canvas
- `ExportMenu`: Dropdown menu with options to save or download project in various formats (PDF, CSV, JSON)

## 11. Related Documentation
- [Prerequisites]: ../08-file-management/UJ-FIL-001-OpenProject.md
- [Related Elements]: ./Dashboard, Canvas, Toolbar, EquipmentLibrary, ExportMenu 
- [Next Steps]: None specified

## 12. Automation & Testing

### Unit Tests
- `src/__tests__/features/canvas/tools/roomTool.test.ts`
- `src/__tests__/features/export/pdf.test.ts`

### Integration Tests
- `src/__tests__/integration/workflow/integration.test.ts` 

### E2E Tests
- `tests/e2e/workflow/small-office-design.e2e.js`

## 13. Notes
- This workflow is designed to simulate a typical HVAC designer's use case with realistic complexity and feature coverage
- The full end-to-end journey ensures integration of multiple core application features including drawing, editing, undo/redo, and export capabilities 
- All actions are tested to ensure they behave predictably under various conditions