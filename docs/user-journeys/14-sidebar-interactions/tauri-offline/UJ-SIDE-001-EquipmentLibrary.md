# User Journey: Equipment Library

## 1. Overview

### Purpose
This user journey describes how a user accesses and interacts with the equipment library to place HVAC components onto the canvas.

### Scope
- Browsing categories in Left Sidebar
- Dragging items from sidebar to canvas
- Visual feedback during drag (ghost image)
- Drop event triggering EntityStore.addEntity()

### User Personas
- **Primary**: HVAC Designer
- **Secondary**: Project Manager

### Success Criteria
- Equipment items appear correctly when dragged and dropped onto the canvas
- UI shows visual feedback (ghost image) while dragging items from library 
- Item placement is accurate based on canvas coordinate system

## 2. PRD References

### Related PRD Sections
- **Section 3.4: Sidebar Components** - This document implements sidebar interactions and drag-drop functionality for placing components.

### Key Requirements Addressed
- REQ-SIDE-001: User must be able to browse equipment by category in the left sidebar
- REQ-SIDE-002: Users must be able to drag items from library and drop them on canvas
- REQ-SIDE-003: Library items should render visual feedback while being dragged 

## 3. Prerequisites

### User Prerequisites
- A project is open with canvas visible and active

### System Prerequisites
- Sidebar component initialized and rendered on left side of UI
- Equipment library panel accessible via sidebar tab or icon
- Canvas component ready to receive dropped items

### Data Prerequisites
- Equipment item data loaded from `equipmentCatalog.json` (or similar source)
- Category metadata exists for organizing components into groups

### Technical Prerequisites
- `EquipmentLibrary.tsx` component initialized with proper drag handlers
- `Canvas` component has drop target area defined
- EntityStore service ready to receive new entities via addEntity() method

## 4. User Journey Steps

### Step 1: Open Equipment Library Sidebar Panel
**User Actions:**
1. Click "Equipment" or "Library" tab/button in the left sidebar
2. Wait for panel to slide open from side of UI (if animated)

**System Response:**
1. Sidebar opens and displays equipment categories as tabs/accordion sections
2. Each category shows icon with list of items available under it 
3. UI provides visual indication that library is ready for use

**Visual State:**
```
[Left Sidebar]
  [Equipment Library] <- Opened
    [Categories: RTUs, Ducts, Vents ...]
      RTU-01 | RTU-02 |
      Duct-123 | Duct-456 |
```

**User Feedback:**
- Smooth animation of sidebar sliding open 
- Hover effects on category tabs showing content when hovered

**Related Elements:**
- Components: `EquipmentLibrary`, `Sidebar` 
- Stores: None
- Services: None
- Events: `onEquipmentLibraryOpen`

### Step 2: Browse Categories and Select Item
**User Actions:**
1. Click on a category (e.g., "RTUs") in the sidebar
2. Hover over an item within that category to preview it
3. Click or double-click an item to begin drag action

**System Response:**
1. Sidebar expands to show items under selected category 
2. Visual feedback appears for hovered item (e.g., highlight)
3. Drag handler initiates with proper start position and cursor style change

**Visual State:**
```
[Left Sidebar]
  [Equipment Library] <- Opened
    RTUs: 
      [RTU-01] Highlighted 
        [Ghost Image Appears]
```

**User Feedback:**
- Cursor changes to drag icon (e.g., hand or arrow)
- Hover preview shows item details and render mockup

**Related Elements:**
- Components: `EquipmentLibrary`, `Sidebar` 
- Stores: None
- Services: None
- Events: `onCategoryClick`, `onItemHover`, `onDragStart`

### Step 3: Drag Item to Canvas
**User Actions:**
1. Hold down mouse button and drag item from sidebar towards canvas area
2. Move cursor over the canvas until drop target is clear 

**System Response:**
1. Ghost image of item appears under cursor during drag (visual feedback)
2. Canvas displays visual cues showing valid drop zones or placement guides
3. Drag event continues with cursor tracking in real-time based on mouse movement

**Visual State:**
```
[Canvas]
  [Ghost Image] 
    Moving over canvas area 
      Drop Preview: [RTU-01]
```

**User Feedback:**
- Ghost image updates with every cursor move during drag
- Canvas provides drop zone highlighting when hovering over valid placement area

**Related Elements:**
- Components: `Canvas`, `EquipmentLibrary` 
- Stores: None
- Services: None
- Events: `onDragOver`, `onDragEnter`, `onMouseMove`

### Step 4: Drop Item Onto Canvas
**User Actions:**
1. Release mouse button when cursor is positioned on desired drop location
2. Ensure canvas area is valid for placement (e.g., not outside bounds)

**System Response:**
1. DragEnd event fires and entity data is read from dragSource 
2. `EntityStore.addEntity()` method called with parsed item data 
3. Canvas updates to display new element at correct coordinate position
4. Drop feedback animation or icon appears (if implemented)

**Visual State:**
```
[Canvas]
  [RTU-01] Placed
    New Entity Added To Viewport
```

**User Feedback:**
- Element appears with correct render and properties on canvas
- Tooltips or icons indicate successful drop (optional)

**Related Elements:**
- Components: `Canvas`, `EquipmentLibrary` 
- Stores: `EntityStore` (for adding new entities)
- Services: None
- Events: `onDrop`, `onAddItemToCanvas`

### Step 5: Validate Placement and State Changes
**User Actions:**
1. Observe newly placed element on canvas
2. Interact with the item to verify it works correctly (e.g., select, move)
3. Close library panel or click outside to return to normal view

**System Response:**
1. Canvas updates its internal state showing new entity in layout
2. Entity is accessible from other components like BOM panel and property editor 
3. UI reflects correct element placement with appropriate data bindings
4. Sidebar closes gracefully (if selected)

**Visual State:**
```
[Canvas]
  [RTU-01] 
    Placed At Coord: [X=5, Y=7]
    [BOM Panel Shows RTU-01 With Qty=1]
```

**User Feedback:**
- Element is visible on canvas with correct properties and location
- BOM panel reflects updated item count automatically 
- No error or warning messages appear during operation

**Related Elements:**
- Components: `Canvas`, `BOMPanel`, `EquipmentLibrary` 
- Stores: `EntityStore` (for entity state)
- Services: None
- Events: `onCanvasUpdate`, `onEntityAdded`

## 5. Edge Cases and Handling

1. **Invalid Drop Zone**
   - **Scenario**: User drags item but releases over a non-drop zone area
   - **Handling**: System resets drag operation without adding entity to canvas, shows error toast if needed 
   - **Test Case**: `tests/e2e/sidebar/invalid-drop`

2. **Large Number of Items**
   - **Scenario**: Library has 100+ items across categories
   - **Handling**: System uses virtual scrolling or pagination to prevent performance issues during browsing
   - **Test Case**: `tests/e2e/sidebar/large-library`

3. **Missing Equipment Data**
   - **Scenario**: Item in catalog is missing metadata (name, image, properties)
   - **Handling**: System filters out invalid items or shows default placeholder instead of crashing 
   - **Test Case**: `tests/e2e/sidebar/missing-data`

4. **Drag During Animation**
   - **Scenario**: User starts dragging while sidebar panel is still animating open
   - **Handling**: System defers drag start until animation completes or handles race condition gracefully 
   - **Test Case**: `tests/e2e/sidebar/drag-while-animation`

5. **Touch Devices**
   - **Scenario**: User interacts with library on touch screen device (tablet/mobile)
   - **Handling**: System maps touch events to equivalent drag actions and provides visual feedback 
   - **Test Case**: `tests/e2e/sidebar/touch-support`

## 6. Error Scenarios and Recovery

1. **Item Placement Fails**
   - **Scenario**: An unhandled exception occurs during item placement on canvas (e.g., data corruption)
   - **Recovery**: System displays error message in modal with option to retry or cancel, prevents malformed entities from being added 
   - **User Feedback**: "Failed to place item: Please check entity properties and try again."

2. **Library Load Failure**
   - **Scenario**: Equipment library fails to load due to network connectivity issues 
   - **Recovery**: System loads fallback content or shows error dialog with retry button
   - **User Feedback**: "Library failed to load: Check internet connection and try again"

3. **Invalid Data in Catalog**
   - **Scenario**: The equipment catalog JSON contains malformed data (e.g., missing fields)
   - **Recovery**: System filters invalid entries or logs errors for debugging without crashing the whole app 
   - **User Feedback**: "Warning: Some items not loaded due to corrupted configuration"

## 7. Performance Considerations
- Library panel should open/close within 200ms to maintain responsive UI experience
- Drag operations must update ghost image position in real-time with <50fps refresh rate 
- All library item rendering uses optimized virtualization techniques for better performance

## 8. Keyboard Shortcuts
| Action | Shortcut | Context |
|--------|----------|---------|
| Open Equipment Library Sidebar | Ctrl + E | When main toolbar is visible |

## 9. Accessibility & Internationalization
- All categories and items are labeled appropriately using ARIA attributes for screen readers
- Visual indicators appear when focused via keyboard navigation 
- Language support includes English, Spanish, French as per UI localization standards

## 10. Key UI Components & Interactions
- `EquipmentLibrary.tsx`: Displays categorized list of equipment with drag handlers
- `Canvas`: Accepts dropped items and adds them to its state 

## 11. Related Documentation
- [Prerequisites]: ../08-file-management/UJ-FIL-001-OpenProject.md
- [Related Elements]: ./EquipmentLibrary, Canvas
- [Next Steps]: None specified

## 12. Automation & Testing

### Unit Tests
- `src/__tests__/features/canvas/components/EquipmentLibrary.test.ts`

### Integration Tests
- `src/__tests__/integration/sidebar/equipment-library.integration.test.ts`

### E2E Tests
- `tests/e2e/sidebar/equipment-library.e2e.js`

## 13. Notes
- The ghost image during drag uses a semi-transparent version of the actual item icon for better visual feedback 
- Sidebar panel can be collapsed or pinned in fixed position if user wants quick access to equipment library
- All items are normalized before being stored in `EntityStore` for consistent rendering on canvas