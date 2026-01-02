# UJ-CN-005: Zoom to Selection

## Overview

This user journey describes how users zoom the viewport to focus on currently selected entities. The "Zoom to Selection" operation calculates the bounding box of selected entities and adjusts the viewport to display them with appropriate padding, providing a quick way to focus on specific content without manually panning and zooming.

## PRD References

- **FR-CN-004**: Zoom to selection with automatic viewport adjustment
- **FR-SM-002**: Selection state management for multiple entities
- **US-CN-005**: As a user, I want to zoom to my selected entities so that I can quickly focus on specific parts of my design
- **AC-CN-005-01**: Zoom to Selection requires at least one entity selected
- **AC-CN-005-02**: Viewport adjusts to show all selected entities with 20% padding
- **AC-CN-005-03**: Zoom range clamped to 50% minimum and 400% maximum for selection
- **AC-CN-005-04**: Keyboard shortcut Ctrl+Shift+0 triggers zoom to selection
- **AC-CN-005-05**: Animation smoothly transitions viewport over 250ms
- **AC-CN-005-06**: Operation aborts with message if no entities selected

## Prerequisites

- User has Canvas page open with active project
- At least one entity is selected (room, duct, equipment, fitting, or note)
- Selected entities have valid position and dimension data
- Understanding of selection mechanics (click, marquee, Ctrl+A)

## User Journey Steps

### Step 1: Select Target Entities

**User Actions**:
1. Click on individual entity to select (single selection), OR
2. Drag marquee rectangle across multiple entities (multi-selection), OR
3. Ctrl+Click to add entities to selection, OR
4. Press Ctrl+A to select all visible entities
5. Observe selected entities highlighted with selection bounds (blue outline)
6. Verify selection count in status bar: "3 entities selected"

**System Response**:
- Selected entities stored in SelectionStore
- Selection bounds calculated around each selected entity
- Selection overlay rendered (blue outline, 2px stroke)
- Selection handles displayed for transform operations
- Multi-select shows combined bounding box
- Status bar updates with selection count

**Validation**:
- At least one entity selected (selectionStore.count > 0)
- All selected entities have valid coordinates
- Selected entities exist in EntityStore (not deleted)
- Selection state synchronized between stores

**Data**:

```
Selection State:
- Selected entity IDs: ["entity-1", "entity-3", "entity-7"]
- Entity types: [Room, Duct, Equipment]
- Selection count: 3
- Selection timestamp: 2025-12-29T15:45:22.100Z

Entity Positions:
entity-1 (Room):
  - position: { x: 200, y: 300 }
  - dimensions: { width: 400, height: 300 }
  - rotation: 0

entity-3 (Duct):
  - path: [(350, 600), (650, 800)]
  - width: 12
  - rotation: 0

entity-7 (Equipment):
  - position: { x: 500, y: 150 }
  - radius: 40
  - rotation: 0
```

**Substeps**:
1. User initiates selection via click, drag, or keyboard
2. SelectionStore.addEntity() or .setSelection() called
3. Selected entities added to selection set
4. Selection bounds calculated for each entity
5. Canvas re-renders with selection overlay
6. Status bar updates with count
7. Selection handles positioned at bounds corners

### Step 2: Trigger Zoom to Selection

**User Actions**:
1. Verify entities selected (blue outlines visible)
2. Choose trigger method:
   - Press `Ctrl+Shift+0` keyboard shortcut, OR
   - Click "View" menu in top menu bar, OR
   - Right-click on selected entity to open context menu
3. Select "Zoom to Selection" menu item if using menu method
4. Observe viewport animation beginning

**System Response**:
- Keyboard shortcut detected via global event listener
- Selection count validated (must be > 0)
- If no selection, toast notification: "No entities selected. Select entities to zoom to."
- If selection exists, viewport calculation begins
- Current viewport state captured for undo
- Animation initialization started
- Status bar displays: "Zooming to 3 selected entities..."

**Validation**:
- Selection count > 0 (operation aborts if zero)
- All selected entities have valid bounds
- Current viewport state captured for undo command
- Menu items enabled/disabled based on selection state

**Data**:

```
Trigger Input:
- Method: keyboard (Ctrl+Shift+0)
- Timestamp: 2025-12-29T15:45:24.567Z
- Selection count: 3

Current Viewport State (for undo):
- zoom: 1.25
- pan: { x: -300, y: -150 }
- canvasSize: { width: 1920, height: 1080 }

Operation Context:
- Operation: zoomToSelection
- Padding percentage: 20%
- Animation duration: 250ms
```

**Substeps**:
1. Event listener captures Ctrl+Shift+0 keypress
2. SelectionStore.getSelectedEntities() called
3. Selection count checked (must be > 0)
4. If zero, abort with toast notification
5. If valid, ViewportStore.zoomToSelection() invoked
6. Current viewport captured for undo
7. Bounding box calculation initiated

### Step 3: Calculate Selection Bounding Box

**User Actions**:
- User observes brief calculation phase (imperceptible for <50 selected entities)
- Viewport remains stable during calculation
- Selection highlights remain visible

**System Response**:
- Iterate through selected entities only (not all entities)
- Calculate individual bounds for each selected entity
- For rooms: corner points transformed by rotation
- For ducts: all path points and width offset
- For equipment: bounding circle around center
- For notes: text bounds and leader line endpoint
- Combine individual bounds into overall selection bounding box
- Apply 20% padding margin (larger than fit-all's 10%)

**Validation**:
- All selected entities have valid coordinates (no NaN/Infinity)
- Bounding box has positive width and height
- Padding calculation produces valid results
- Padded bounds don't produce extreme zoom levels

**Data**:

```
Individual Entity Bounds:
entity-1 (Room at 200, 300, 400x300):
  - minX: 200, maxX: 600
  - minY: 300, maxY: 600

entity-3 (Duct path [(350,600), (650,800)], width 12):
  - minX: 344, maxX: 656
  - minY: 594, maxY: 806

entity-7 (Equipment at 500, 150, radius 40):
  - minX: 460, maxX: 540
  - minY: 110, maxY: 190

Combined Bounding Box (before padding):
  - minX: 200, maxX: 656
  - minY: 110, maxY: 806
  - width: 456, height: 696
  - center: (428, 458)

Apply 20% Padding:
  - paddingX: 456 * 0.20 = 91.2
  - paddingY: 696 * 0.20 = 139.2

Padded Bounding Box:
  - minX: 108.8, maxX: 747.2
  - minY: -29.2, maxY: 945.2
  - width: 638.4, height: 974.4
  - center: (428, 458) [unchanged]
```

**Substeps**:
1. Initialize bounds with first selected entity
2. For each selected entity:
   - Get entity from EntityStore by ID
   - Calculate entity-specific bounds
   - Expand overall bounds to include entity
3. Validate combined bounds (width > 0, height > 0)
4. Calculate 20% padding in both dimensions
5. Expand bounds by padding amount
6. Calculate center point of padded bounds
7. Store padded bounds for viewport calculation

### Step 4: Calculate Optimal Viewport for Selection

**User Actions**:
- User sees viewport beginning to move
- Selected entities remain highlighted during animation
- Other entities fade slightly during focus operation (optional effect)

**System Response**:
- Calculate zoom to fit padded selection bounds within canvas
- Horizontal scale: canvasWidth / paddedWidth
- Vertical scale: canvasHeight / paddedHeight
- Select smaller scale factor (limiting dimension)
- Clamp zoom to [0.5, 4.0] range (tighter than fit-all's [0.1, 4.0])
- Calculate pan offset to center selection in viewport
- Pan X: -(boundCenterX * zoom - canvasWidth / 2)
- Pan Y: -(boundCenterY * zoom - canvasHeight / 2)

**Validation**:
- Zoom level within [0.5, 4.0] range
- Pan coordinates are finite numbers
- Resulting viewport shows all selected entities
- Selection centered in viewport (not offset)

**Data**:

```
Zoom Calculation:
- Canvas: 1920 x 1080
- Padded bounds: 638.4 x 974.4
- Horizontal scale: 1920 / 638.4 = 3.006
- Vertical scale: 1080 / 974.4 = 1.108
- Selected zoom: min(3.006, 1.108) = 1.108 (110.8%)
- Clamped zoom: 1.108 (within [0.5, 4.0])

Pan Calculation:
- Selection center: (428, 458) in world coordinates
- Selection center scaled: (428 * 1.108, 458 * 1.108) = (474, 507)
- Canvas center: (960, 540)
- Pan offset: (960 - 474, 540 - 507) = (486, 33)

Target Viewport:
- zoom: 1.108
- pan: { x: 486, y: 33 }
```

**Substeps**:
1. Retrieve canvas dimensions from ViewportStore
2. Calculate horizontal scale (canvas width / padded width)
3. Calculate vertical scale (canvas height / padded height)
4. Select minimum scale (limiting dimension)
5. Apply zoom clamps: max(0.5, min(4.0, calculatedZoom))
6. Calculate selection center in world coordinates
7. Scale center by calculated zoom
8. Calculate pan offset to center scaled selection
9. Store target viewport state for animation

### Step 5: Animate Viewport Transition

**User Actions**:
- User observes smooth zoom and pan transition
- Selected entities move toward center of viewport
- Zoom level increases or decreases to fit selection
- Animation completes in 250ms (faster than fit-all's 300ms)
- User can interact during animation to cancel

**System Response**:
- Easing function applied (ease-in-out cubic)
- RequestAnimationFrame loop updates viewport 60 times per second
- Interpolate zoom from current to target
- Interpolate pan.x and pan.y from current to target
- Canvas re-renders each frame
- Selection overlay remains visible and scaled
- Grid updates to match zoom level
- Non-selected entities render at reduced opacity (60%) during animation

**Validation**:
- Animation completes within 250ms ± 16ms
- Final viewport exactly matches calculated target
- 60fps maintained (16.67ms per frame)
- Selection remains highlighted throughout

**Data**:

```
Animation Timeline (250ms duration):
Frame 0ms (start):
  - zoom: 1.250, pan: { x: -300, y: -150 }
  - selectionOpacity: 1.0
  - otherOpacity: 1.0

Frame 42ms (16.7%):
  - zoom: 1.235, pan: { x: -197, y: -121 }
  - easing: 0.093
  - selectionOpacity: 1.0
  - otherOpacity: 0.85

Frame 125ms (50%):
  - zoom: 1.179, pan: { x: 93, y: -59 }
  - easing: 0.500
  - selectionOpacity: 1.0
  - otherOpacity: 0.60

Frame 208ms (83.3%):
  - zoom: 1.122, pan: { x: 383, y: 3 }
  - easing: 0.907
  - selectionOpacity: 1.0
  - otherOpacity: 0.85

Frame 250ms (end):
  - zoom: 1.108, pan: { x: 486, y: 33 }
  - easing: 1.000
  - selectionOpacity: 1.0
  - otherOpacity: 1.0

Easing Function: Cubic ease-in-out
  - Same as fit-all operation
```

**Substeps**:
1. Record animation start timestamp
2. Set non-selected entities to 60% opacity
3. Schedule first animation frame
4. On each frame callback:
   - Calculate elapsed time and progress (0.0 to 1.0)
   - Apply easing function to progress
   - Interpolate zoom and pan
   - Update ViewportStore
   - Trigger canvas re-render
   - Update selection overlay position
   - Schedule next frame if incomplete
5. On final frame:
   - Set exact target viewport values
   - Restore non-selected opacity to 100%
   - Cancel animation frame requests
   - Emit "zoom-to-selection-complete" event

### Step 6: Finalize and Maintain Selection

**User Actions**:
- User sees selected entities centered and clearly visible
- Selected entities remain highlighted (selection not cleared)
- User can immediately begin editing properties or transforming selection
- User can undo zoom operation to restore previous viewport
- User can deselect entities with Esc or click on background

**System Response**:
- Viewport state finalized in ViewportStore
- Selection state preserved in SelectionStore (not cleared)
- Zoom percentage displayed in status bar: "Zoom: 111%"
- Status bar shows: "3 entities selected"
- Grid rendered at appropriate density
- Undo command created: ViewportCommand with previous state
- Selection handles remain visible for transform operations
- Inspector panel shows properties of selected entities

**Validation**:
- All selected entities fully visible within viewport
- 20% padding visible around selection bounds
- Selection state unchanged from before zoom
- Viewport state persisted to project file on next save
- Undo operation correctly restores previous viewport

**Data**:

```
Final Viewport State:
- zoom: 1.108
- pan: { x: 486, y: 33 }
- visibleBounds:
  - minX: -438, maxX: 1294
  - minY: -30, maxY: 945
  - width: 1732, height: 975

Selection State (preserved):
- Selected IDs: ["entity-1", "entity-3", "entity-7"]
- Selection count: 3
- Selection bounds (at new zoom):
  - minX: 200, maxX: 656 (world coordinates)
  - minY: 110, maxY: 806 (world coordinates)
  - Screen position: centered with 20% padding

Undo Command:
- type: ViewportCommand
- commandName: "Zoom to Selection"
- previousState: { zoom: 1.25, pan: { x: -300, y: -150 } }
- newState: { zoom: 1.108, pan: { x: 486, y: 33 } }
- timestamp: 2025-12-29T15:45:24.817Z

Performance Metrics:
- Calculation time: 2ms (3 entities)
- Animation time: 251ms
- Total operation time: 253ms
```

**Substeps**:
1. Finalize viewport in ViewportStore
2. Verify selection state preserved
3. Update status bar with zoom and selection count
4. Re-render grid at new zoom level
5. Update selection handles for new viewport
6. Push ViewportCommand to undo stack
7. Log analytics event with metrics
8. Mark viewport dirty for next save

## Edge Cases

### Edge Case 1: Single Entity Selected

**Scenario**: User selects one small entity (e.g., single diffuser fitting) and triggers zoom to selection.

**Expected Behavior**:
- Bounding box calculated around single entity
- 20% padding applied to entity dimensions
- Zoom level calculated to fit padded bounds
- Maximum zoom (400%) may be applied for very small entities
- Single entity appears large and centered with comfortable margins
- Animation proceeds normally

**Handling**:
- For 80px diameter diffuser:
  - Bounds: 80px circle
  - Padded: 96px (80 * 1.2)
  - On 1920x1080 canvas: zoom = 1080 / 96 = 11.25
  - Clamped to 4.0 (400%) maximum
  - Entity appears very large and centered
- Toast notification: "Zoomed to maximum (400%) for small entity"

### Edge Case 2: Selection Spans Entire Canvas

**Scenario**: User selects all entities (Ctrl+A) spanning very large area, then zooms to selection.

**Expected Behavior**:
- Behaves identically to Fit to Window operation
- Calculates bounds of all entities (all selected)
- Applies 20% padding (more than fit-all's 10%)
- Minimum zoom (50%) applied if content very large
- Result similar to fit-all but with more padding
- User sees all content with extra breathing room

**Handling**:
- If selection bounds match or exceed fit-all bounds:
  - Toast notification: "Selection includes all content. Consider using Fit to Window (Ctrl+0)."
  - Operation proceeds with 20% padding
- If minimum zoom reached:
  - Toast: "Selection is very large. Zoom set to minimum (50%)."
  - Some content may be outside viewport even after zoom

### Edge Case 3: Selection with Extreme Aspect Ratio

**Scenario**: User selects long horizontal duct spanning 5000px wide but only 20px tall.

**Expected Behavior**:
- Bounding box: 5000px x 20px
- Padded: 6000px x 24px (20% padding)
- Vertical scale (1080 / 24 = 45.0) much larger than horizontal (1920 / 6000 = 0.32)
- Horizontal scale selected (limiting dimension)
- Zoom set to 0.32 (32%)
- Duct appears horizontally filling viewport with large vertical margins
- Padding visible on left/right (20% of duct width)

**Handling**:
- Selection centered vertically in viewport
- Large empty space above/below duct (not a bug)
- User can manually adjust zoom or pan if needed
- Grid visible at appropriate density for 32% zoom

### Edge Case 4: Zoom to Selection During Active Pan

**Scenario**: User is actively panning canvas (mouse down, dragging) when Ctrl+Shift+0 pressed accidentally.

**Expected Behavior**:
- Pan operation takes priority (user has mouse button down)
- Keyboard shortcut ignored or queued until pan ends
- Toast notification: "Release mouse button to zoom to selection"
- After pan ends, user can retry Ctrl+Shift+0
- Prevents jarring interruption of active interaction

**Handling**:
- Check for active interaction (isPanning, isRotating, isResizing) before triggering zoom
- If active interaction detected, ignore shortcut and show toast
- Menu items disabled during active interactions
- After interaction ends, shortcut becomes available again

### Edge Case 5: Selection Includes Off-Canvas Entities

**Scenario**: Some selected entities are far outside current viewport (imported from another project, pasted with offset).

**Expected Behavior**:
- Bounding box includes all selected entities regardless of visibility
- Zoom level calculated to fit all selected entities
- Viewport may zoom out significantly to show off-canvas entities
- Large pan offset applied to center entire selection
- All selected entities become visible after operation
- User realizes some selected entities were off-screen

**Handling**:
- Toast notification after operation: "Zoomed to 5 selected entities (3 were off-screen)"
- Helps user understand why viewport changed dramatically
- Selection count includes all selected entities (visible or not)
- User can deselect off-canvas entities if unwanted

## Error Scenarios

### Error 1: No Selection

**Scenario**: User triggers Zoom to Selection (Ctrl+Shift+0) when no entities selected.

**Error Message**: "No entities selected. Select one or more entities to zoom to selection."

**Recovery**:
1. Operation aborted immediately (no calculation performed)
2. Toast notification displays error message
3. Viewport remains unchanged
4. Status bar shows: "No selection"
5. User prompted to select entities first
6. Menu items show disabled state when no selection
7. Keyboard shortcut triggers toast message

### Error 2: Selected Entities Deleted Mid-Operation

**Scenario**: User selects entities, triggers zoom, but entities deleted by undo operation during animation.

**Error Message**: "Selected entities no longer exist. Zoom operation cancelled."

**Recovery**:
1. Animation detects missing entities during frame update
2. Animation immediately cancelled
3. Viewport frozen at current mid-animation state
4. Toast notification displays error message
5. Selection cleared automatically (entities don't exist)
6. User can undo deletion to restore entities
7. Partial undo command created (records viewport change up to cancellation point)

### Error 3: Invalid Entity Bounds in Selection

**Scenario**: Selected entity has corrupted position data (NaN or Infinity coordinates).

**Error Message**: "Invalid entity coordinates detected in selection. Cannot calculate zoom bounds."

**Recovery**:
1. Bounding box calculation detects NaN/Infinity during iteration
2. Operation aborted before viewport changes
3. Error logged with entity ID for debugging
4. Toast notification shows error message
5. Entity validation report generated
6. Inspector panel highlights entity with invalid data
7. User prompted to fix or delete corrupted entity
8. Fallback: user can deselect corrupted entity and retry

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Shift+0` | Zoom to Selection | Canvas focused, entities selected |
| `Ctrl+0` | Fit to Window (all content) | Canvas focused, any state |
| `Ctrl+Shift+Z` | Undo Zoom to Selection | After zoom operation |
| `Esc` | Clear Selection | After zoom, deselects entities |
| `Ctrl+A` | Select All, then Auto-Zoom | Canvas focused, if preference enabled |
| `Z` | Zoom Tool (toggle) | Canvas focused, then click selection |
| `F` | Frame Selection (alternate) | Canvas focused, entities selected |

## Related Elements

### Components
- **CanvasViewport.tsx**: Viewport rendering and zoom/pan state management
- **SelectionOverlay.tsx**: Renders selection bounds and handles during zoom operation
- **ViewMenu.tsx**: Menu bar with "Zoom to Selection" menu item
- **CanvasContextMenu.tsx**: Right-click context menu on selected entities
- **StatusBar.tsx**: Shows zoom level and selection count
- **Minimap.tsx**: Updates viewport rectangle during zoom animation

### Stores
- **ViewportStore**: Manages zoom, pan, and viewport bounds
  - `zoomToSelection()`: Main method implementing zoom to selection
  - `animateViewport()`: Handles smooth transition animation
  - `zoom`: Current zoom level [0.5, 4.0] for selection
  - `pan`: Current pan offset { x, y }
- **SelectionStore**: Manages selected entity set
  - `getSelectedEntities()`: Returns array of selected entity IDs
  - `getSelectionBounds()`: Calculates bounding box of selection
  - `selectedIds`: Set of selected entity IDs
  - `count`: Number of selected entities
- **EntityStore**: Source of entity position and dimension data
  - `getEntity(id)`: Retrieves entity by ID for bounds calculation
  - `entities`: Map of all entities in project
- **HistoryStore**: Manages undo/redo for viewport operations
  - Stores ViewportCommand for zoom operations

### Hooks
- **useViewportAnimation**: Manages requestAnimationFrame for smooth zoom
  - Returns animation progress and completion status
  - Handles easing curves and interpolation
  - Cancels animation on user interaction
- **useSelectionBounds**: Calculates bounding box for selected entities
  - Accounts for rotation, paths, and shapes
  - Caches bounds for performance
  - Invalidates cache on selection change
- **useKeyboardShortcuts**: Global keyboard handler for Ctrl+Shift+0
  - Checks for active selection before triggering
  - Disabled during active interactions
- **useOpacityTransition**: Animates non-selected entity opacity during zoom
  - Fades non-selected to 60% during animation
  - Restores to 100% on completion

### Commands
- **ViewportCommand**: Undo/redo command for viewport changes
  - `execute()`: Applies new viewport with animation
  - `undo()`: Restores previous viewport with reverse animation
  - `commandName`: "Zoom to Selection" for history display

### Services
- **BoundsCalculator.ts**: Pure functions for entity bounds calculation
  - `calculateEntityBounds(entity)`: Returns AABB for single entity
  - `calculateSelectionBounds(entities)`: Returns combined bounding box
  - `applyPadding(bounds, percentage)`: Expands bounds by padding
- **ViewportCalculator.ts**: Viewport math utilities
  - `calculateZoomToFit(bounds, canvas, minZoom, maxZoom)`: Computes optimal zoom
  - `calculatePanToCenter(bounds, zoom, canvas)`: Computes centering pan offset

## Visual Diagrams

### Zoom to Selection Operation Flow

```
User Selects
Entities
    |
    v
User Triggers
Ctrl+Shift+0
    |
    v
Validate
Selection > 0
    |
    +--[No]--> Show Toast
    |          "No selection"
    |
    +--[Yes]
        |
        v
  Iterate Selected
  Entities Only
        |
        v
  Calculate
  Selection Bounds
        |
        v
  Apply 20%
  Padding
        |
        v
  Calculate Zoom
  [0.5, 4.0]
        |
        v
  Calculate Pan
  to Center
        |
        v
  Start 250ms
  Animation
        |
        v
  Update Viewport
  60fps
        |
        v
  Preserve
  Selection State
        |
        v
  Finalize &
  Push Undo
```

### Selection Bounding Box Calculation

```
Selected Entities:
  Entity 1: Room at (200, 300), 400x300
  Entity 2: Duct path [(350,600), (650,800)]
  Entity 3: Equipment at (500, 150), radius 40

Step 1: Individual Bounds
┌─────────────────────────────────┐
│                                 │
│    Entity 3: (460,110)-(540,190)│
│         (•)                     │
│                                 │
│  Entity 1: (200,300)-(600,600)  │
│   ┌──────────────────┐          │
│   │                  │          │
│   │      Room A      │          │
│   │                  │          │
│   └──────────────────┘          │
│         Entity 2:               │
│    (344,594)-(656,806)          │
│           ──────                │
│                                 │
└─────────────────────────────────┘

Step 2: Combined Bounds (before padding)
  minX = min(200, 344, 460) = 200
  maxX = max(600, 656, 540) = 656
  minY = min(300, 594, 110) = 110
  maxY = max(600, 806, 190) = 806
  width = 456, height = 696

Step 3: Apply 20% Padding
  paddingX = 456 * 0.2 = 91.2
  paddingY = 696 * 0.2 = 139.2

  Padded bounds:
  minX = 200 - 91.2 = 108.8
  maxX = 656 + 91.2 = 747.2
  minY = 110 - 139.2 = -29.2
  maxY = 806 + 139.2 = 945.2
```

### Zoom Calculation Comparison

```
Fit to Window (all entities):
  Padding: 10%
  Zoom range: [0.1, 4.0]
  Target: Show all content

  Example:
    Content: 2000x1500
    Padded: 2200x1650
    Canvas: 1920x1080
    Zoom: min(1920/2200, 1080/1650) = 0.654 (65.4%)

Zoom to Selection (selected only):
  Padding: 20%
  Zoom range: [0.5, 4.0]
  Target: Focus on selection

  Example:
    Selection: 800x600
    Padded: 960x720
    Canvas: 1920x1080
    Zoom: min(1920/960, 1080/720) = 1.500 (150%)

Result: Zoom to Selection produces closer view
```

### Viewport Animation with Opacity Transition

```
Timeline (250ms):

0ms (Start):
┌──────────────────────────────────┐
│ [Other entities at 100% opacity] │
│                                  │
│   Selected entities visible      │
│   but not centered               │
│                                  │
│  Zoom: 125%                      │
└──────────────────────────────────┘

125ms (Midpoint):
┌──────────────────────────────────┐
│ [Other entities at 60% opacity]  │
│                                  │
│        Selected entities         │
│        moving to center          │
│                                  │
│  Zoom: 117.9%                    │
└──────────────────────────────────┘

250ms (End):
┌──────────────────────────────────┐
│ [Other entities at 100% opacity] │
│                                  │
│     Selected entities centered   │
│     with 20% padding visible     │
│                                  │
│  Zoom: 110.8%                    │
└──────────────────────────────────┘

Opacity Transition:
Non-selected entities:
  100% -> 60% (0-125ms, ease out)
  60% -> 100% (125-250ms, ease in)

Selected entities:
  100% throughout (no change)
```

### Keyboard Shortcut Comparison

```
Viewport Operations Shortcuts:

Ctrl+0
  └─> Fit to Window (all entities)
      - 10% padding
      - Zoom: [0.1, 4.0]
      - 300ms animation
      - Requires: Project has entities

Ctrl+Shift+0
  └─> Zoom to Selection
      - 20% padding
      - Zoom: [0.5, 4.0]
      - 250ms animation
      - Requires: Entities selected

Ctrl+1
  └─> Reset to 100% Zoom
      - Maintains pan position
      - Instant (no animation)

Ctrl+Shift+Z
  └─> Undo Zoom Operation
      - Restores previous viewport
      - 250ms reverse animation
```

### UI State During Zoom to Selection

```
Before Zoom:
┌────────────────────────────────────┐
│ View > Zoom to Selection (enabled) │
├────────────────────────────────────┤
│                                    │
│   [Entity A]                       │
│   [Entity B] <-- Selected (blue)   │
│                                    │
│                                    │
│   [Entity C] <-- Selected (blue)   │
│                                    │
│ (Entities off-screen at current    │
│  zoom/pan position)                │
├────────────────────────────────────┤
│ Zoom: 125% | 2 selected | Minimap █│
└────────────────────────────────────┘

During Zoom (125ms elapsed):
┌────────────────────────────────────┐
│ Status: Zooming to 2 selected...   │
├────────────────────────────────────┤
│   [Entity A] <-- Faded to 60%      │
│                                    │
│        [Entity B] <-- 100% opacity │
│                                    │
│        [Entity C] <-- 100% opacity │
│                                    │
│ (Selected entities moving to       │
│  center, viewport animating)       │
├────────────────────────────────────┤
│ Zoom: 117.9% | 2 selected | Minimap│
└────────────────────────────────────┘

After Zoom:
┌────────────────────────────────────┐
│ View > Zoom to Selection (enabled) │
├────────────────────────────────────┤
│  [20% padding]                     │
│    ┌─────────────────────┐         │
│    │  [Entity B]         │         │
│    │                     │         │
│    │  [Entity C]         │         │
│    └─────────────────────┘         │
│  [20% padding]                     │
│                                    │
│  [Entity A] <-- Visible in corner  │
├────────────────────────────────────┤
│ Zoom: 110.8% | 2 selected | Minimap│
└────────────────────────────────────┘
```

## Testing

### Unit Tests

**Test Suite**: ViewportStore.zoomToSelection()

1. **Test: Calculate correct zoom for selected entities**
   - Setup: Select 3 entities with combined bounds 800x600
   - Canvas: 1920x1080
   - Action: Call zoomToSelection()
   - Assert: Zoom is 1080 / (600 * 1.2) = 1.5 (150%)

2. **Test: Apply 20% padding to selection bounds**
   - Setup: Select entities with bounds 400x300
   - Action: Call zoomToSelection()
   - Assert: Padded bounds are 480x360 (400*1.2, 300*1.2)

3. **Test: Clamp zoom to minimum 50% for large selections**
   - Setup: Select entities spanning 10,000x8,000
   - Canvas: 1920x1080
   - Action: Call zoomToSelection()
   - Assert: Zoom clamped to 0.5 (50%) minimum

4. **Test: Clamp zoom to maximum 400% for small selections**
   - Setup: Select single 40px entity
   - Canvas: 1920x1080
   - Action: Call zoomToSelection()
   - Assert: Zoom clamped to 4.0 (400%) maximum

5. **Test: Center selection in viewport**
   - Setup: Select entities with center at (500, 400)
   - Calculated zoom: 2.0
   - Canvas: 1920x1080
   - Action: Call zoomToSelection()
   - Assert: Pan centers (1000, 800) at canvas center (960, 540)

6. **Test: Abort operation when no selection**
   - Setup: Empty selection (0 entities selected)
   - Action: Call zoomToSelection()
   - Assert: Operation aborts, toast shown, viewport unchanged

7. **Test: Handle single selected entity**
   - Setup: Select single room 300x200
   - Action: Call zoomToSelection()
   - Assert: Bounds calculated correctly with 20% padding
   - Assert: Zoom calculated to fit padded bounds

8. **Test: Preserve selection state after zoom**
   - Setup: Select 3 entities
   - Action: Call zoomToSelection()
   - Assert: Selection count remains 3 after operation
   - Assert: Same entity IDs selected before and after

### Integration Tests

**Test Suite**: Zoom to Selection Workflow

1. **Test: Smooth animation from current to target viewport**
   - Setup: Viewport at zoom=0.8, pan={-200, 100}
   - Select entities requiring zoom=2.0, pan={300, -50}
   - Action: Trigger zoomToSelection(), monitor frames
   - Assert: Animation completes in 250ms ± 16ms
   - Assert: At least 12 frames rendered (60fps * 0.25s)
   - Assert: Final state exactly matches target

2. **Test: Cancel animation on user pan**
   - Setup: Start zoom to selection animation
   - Action: After 100ms, user clicks and drags to pan
   - Assert: Animation immediately cancelled
   - Assert: User pan takes control
   - Assert: Partial undo command created

3. **Test: Opacity transition for non-selected entities**
   - Setup: Canvas with 10 entities, select 2
   - Action: Trigger zoomToSelection(), monitor rendering
   - Assert: Non-selected entities fade to 60% opacity at midpoint
   - Assert: Non-selected entities restore to 100% at end
   - Assert: Selected entities maintain 100% throughout

4. **Test: Undo restores previous viewport**
   - Setup: Viewport at zoom=1.0, pan={0, 0}
   - Action: Select entities, zoom to selection (new state: zoom=2.5, pan={400, 200})
   - Action: Trigger undo (Ctrl+Z)
   - Assert: Viewport animates back to zoom=1.0, pan={0, 0}
   - Assert: Selection preserved during undo

5. **Test: Menu item enabled/disabled based on selection**
   - Setup: No entities selected
   - Assert: "Zoom to Selection" menu item disabled
   - Action: Select entity
   - Assert: "Zoom to Selection" menu item enabled
   - Action: Clear selection (Esc)
   - Assert: "Zoom to Selection" menu item disabled

### End-to-End Tests

**Test Suite**: User Zoom to Selection Workflow

1. **Test: User selects multiple entities and zooms via keyboard**
   - Setup: Open project with 10 scattered entities
   - Action: User drag-selects 3 entities in one area
   - Assert: 3 entities highlighted with blue outline
   - Assert: Status bar shows "3 entities selected"
   - Action: User presses Ctrl+Shift+0
   - Assert: Viewport smoothly zooms and pans to show 3 entities
   - Assert: Entities centered with visible padding
   - Assert: Zoom percentage updated in status bar

2. **Test: User zooms to selection via context menu**
   - Setup: Project with entities
   - Action: User right-clicks on selected entity
   - Assert: Context menu appears with "Zoom to Selection" option
   - Action: User clicks "Zoom to Selection"
   - Assert: Menu closes
   - Assert: Viewport animates to fit selection

3. **Test: User attempts zoom with no selection**
   - Setup: Project with entities, none selected
   - Action: User presses Ctrl+Shift+0
   - Assert: Toast notification appears: "No entities selected..."
   - Assert: Viewport unchanged
   - Assert: Status bar shows "No selection"

4. **Test: User selects single small entity and zooms**
   - Setup: Project with various entities
   - Action: User clicks on small diffuser fitting (80px)
   - Action: User presses Ctrl+Shift+0
   - Assert: Viewport zooms to 400% (maximum)
   - Assert: Diffuser appears large and centered
   - Assert: Toast: "Zoomed to maximum (400%) for small entity"

5. **Test: User selects all entities and zooms**
   - Setup: Project with 20 entities across large area
   - Action: User presses Ctrl+A (select all)
   - Assert: All 20 entities highlighted
   - Action: User presses Ctrl+Shift+0
   - Assert: Viewport fits all entities with 20% padding
   - Assert: Toast: "Selection includes all content. Consider using Fit to Window..."
   - Assert: Result similar to Fit to Window but more padding

6. **Test: User zooms to selection then edits properties**
   - Setup: Project with entities
   - Action: User selects room, presses Ctrl+Shift+0
   - Assert: Viewport zooms to show room clearly
   - Assert: Room remains selected (blue outline visible)
   - Action: User edits room width in Inspector panel
   - Assert: Room updates in centered viewport
   - Assert: Selection maintained during editing

## Common Pitfalls

### Pitfall 1: Confusing Zoom to Selection with Fit to Window

**Problem**: Developers expect Zoom to Selection to behave identically to Fit to Window (Ctrl+0).

**Symptom**: Confusion when Zoom to Selection shows more padding (20% vs 10%) and uses different zoom range ([0.5, 4.0] vs [0.1, 4.0]).

**Solution**: Document differences explicitly:
- Fit to Window: All entities, 10% padding, [0.1, 4.0] zoom range, 300ms animation
- Zoom to Selection: Selected only, 20% padding, [0.5, 4.0] zoom range, 250ms animation
- Use cases: Fit for overview, Zoom to Selection for focus work

### Pitfall 2: Not Preserving Selection State

**Problem**: Implementation clears selection after zoom operation completes.

**Symptom**: User expects to edit selected entities after zoom but finds nothing selected, must reselect entities.

**Solution**: Preserve SelectionStore state throughout zoom operation:
- Don't call clearSelection() after zoom
- Maintain selectedIds set unchanged
- Keep selection overlay visible after animation
- Only clear selection on explicit user action (Esc, click background)

### Pitfall 3: Incorrect Padding Application

**Problem**: Padding applied as absolute pixels instead of percentage of selection size.

**Symptom**: Small selections get excessive padding, large selections get minimal padding.

**Solution**: Calculate padding as percentage of selection dimensions:
- paddingX = selectionWidth * 0.20 (not fixed 100px)
- paddingY = selectionHeight * 0.20
- This scales appropriately for any selection size

### Pitfall 4: Ignoring Entity Rotation in Bounds

**Problem**: Bounding box calculated from unrotated entity dimensions.

**Symptom**: Rotated rooms or equipment appear clipped after zoom because axis-aligned bounding box was too small.

**Solution**: Transform all entity points by rotation before calculating bounds:
- For rooms: Transform all four corners by rotation matrix
- For equipment: Use bounding circle (rotation doesn't affect circles)
- For ducts: Transform all path points and control points
- Calculate min/max X/Y from transformed points

### Pitfall 5: Not Handling Off-Canvas Selection

**Problem**: Some selected entities are far outside viewport, user unaware they're selected.

**Symptom**: Zoom to Selection produces unexpected dramatic viewport change, user confused why zoom went to "empty" area.

**Solution**: Provide feedback about off-canvas selection:
- After zoom, show toast: "Zoomed to 5 selected entities (2 were off-screen)"
- Optionally highlight newly-visible entities briefly
- Consider "Zoom to Visible Selection Only" preference option
- Provide "Select Visible Entities Only" command to filter selection

## Performance Tips

### Tip 1: Cache Selection Bounds

Recalculating selection bounds on every frame during animation is wasteful. Cache bounds when selection changes:

**Implementation**: Store calculatedBounds in SelectionStore with version number. Invalidate when selectedIds changes. During animation, reuse cached bounds.

**Benefit**: Reduces zoom calculation from 10ms to <1ms for large selections (100+ entities).

### Tip 2: Reduce Render Quality During Animation

Zoom to Selection animation is fast (250ms). Temporarily reduce render quality to maintain 60fps:

**Implementation**:
- Set renderQuality flag to "low" during animation
- Skip entity shadows and anti-aliasing
- Use simplified entity shapes (rectangles instead of detailed paths)
- Restore full quality on final frame

**Benefit**: Maintains smooth 60fps even on slower hardware, final frame appears high-quality.

### Tip 3: Batch Selection Bounds Updates

If user is rapidly changing selection (Ctrl+Click repeatedly), debounce bounds recalculation:

**Implementation**: Track selection change events, recalculate bounds after 100ms of no changes. During rapid selection, skip intermediate calculations.

**Benefit**: Prevents excessive CPU usage during rapid selection changes, improves responsiveness.

### Tip 4: Use Bounding Circles for Equipment

Circular equipment entities can use simple distance calculation instead of full rotation transform:

**Implementation**: For equipment, bounds = center ± radius. No rotation matrix needed since circles are rotation-invariant.

**Benefit**: Faster bounds calculation for equipment-heavy selections (HVAC equipment layouts).

### Tip 5: Progressive Opacity Transition

Smoothly transitioning non-selected entity opacity requires re-rendering all entities each frame. Optimize with layered rendering:

**Implementation**:
- Render non-selected entities to offscreen canvas once at start
- During animation, composite offscreen canvas at varying opacity
- Selected entities rendered normally on top
- Avoids re-rendering hundreds of non-selected entities each frame

**Benefit**: Reduces frame render time from 25ms to 8ms for projects with 500+ entities.

## Future Enhancements

### Enhancement 1: Zoom to Selection with Aspect Ratio Lock

**Description**: Add option to lock viewport aspect ratio when zooming to selection, preventing extreme aspect ratios.

**User Value**: Ensures consistent viewport proportions, useful for presentations and screencasts.

**Implementation**:
- User preference: "Lock Aspect Ratio" (default: off)
- Calculate optimal zoom as usual
- Expand bounds to match canvas aspect ratio before applying zoom
- Results in letterboxing/pillarboxing around selection

### Enhancement 2: Animated Selection Highlight After Zoom

**Description**: After zoom completes, briefly pulse selection outline to draw attention to selected entities.

**User Value**: Provides clear visual confirmation of which entities are selected, especially helpful after dramatic viewport changes.

**Implementation**:
- After zoom animation ends, trigger 1-second pulse animation
- Selection outline scales from 100% to 120% and back
- Color intensifies from blue to bright cyan
- Helps users visually locate selection in new viewport

### Enhancement 3: Zoom to Selection Presets

**Description**: Store named zoom presets for frequently-used selections ("Kitchen Equipment", "Second Floor Supply", etc.).

**User Value**: Quick access to predefined views without manually selecting and zooming each time.

**Implementation**:
- "Save Selection as Preset" command stores selection IDs and name
- Presets appear in View menu and keyboard shortcuts (F1-F9)
- Selecting preset automatically selects entities and zooms
- Presets persist in project file

### Enhancement 4: Stacked Selection Zoom

**Description**: Zoom to multiple independent selections in sequence, creating animation path through design.

**User Value**: Useful for project walkthroughs, reviews, and presentations showing multiple areas.

**Implementation**:
- Select multiple entity groups, assign order
- Trigger "Zoom Tour" command
- Automatically zoom to each selection in sequence (3 seconds each)
- User can pause, skip, or exit tour
- Export tour as video or animated GIF

### Enhancement 5: Zoom to Selection with Smart Rotation

**Description**: Automatically rotate viewport to align with primary axis of selected entities.

**User Value**: Optimizes viewport orientation for viewing elongated selections (long ducts, hallways).

**Implementation**:
- Calculate principal axis of selection (longest dimension)
- Rotate viewport to align principal axis with horizontal
- Zoom to fit rotated selection
- Undo restores both zoom and rotation
- User preference to enable/disable auto-rotation

### Enhancement 6: Selection Zoom History

**Description**: Maintain history of previous zoom-to-selection operations, navigate with Ctrl+[ and Ctrl+].

**User Value**: Quick way to jump between recently-viewed selections without re-selecting.

**Implementation**:
- Store last 10 zoom-to-selection viewport states
- Ctrl+[: Previous selection view
- Ctrl+]: Next selection view
- Independent of main undo stack
- Visual timeline in sidebar showing selection thumbnails

### Enhancement 7: Zoom to Selection with Exclude Mode

**Description**: Zoom to show all entities except selected ones, useful for context viewing.

**User Value**: Allows user to focus on surrounding context while selected entities are temporarily hidden.

**Implementation**:
- New command: "Zoom to Non-Selected" (Ctrl+Shift+Alt+0)
- Calculate bounds of all non-selected entities
- Temporarily hide selected entities (0% opacity)
- Zoom to fit non-selected content
- Undo or Esc restores selected entities and viewport

### Enhancement 8: Adaptive Padding Based on Selection Size

**Description**: Adjust padding percentage based on number of selected entities - more padding for single entities, less for large selections.

**User Value**: Provides comfortable margins for small selections, maximizes visibility for large selections.

**Implementation**:
- 1 entity: 30% padding (very comfortable)
- 2-5 entities: 20% padding (current default)
- 6-20 entities: 15% padding
- 21+ entities: 10% padding (match fit-all)
- User preference to override with fixed padding

### Enhancement 9: Zoom to Selection with Mini-Map Preview

**Description**: Show animated path in mini-map indicating zoom trajectory before operation executes.

**User Value**: Helps user predict viewport change, provides visual confirmation of operation intent.

**Implementation**:
- After Ctrl+Shift+0 pressed, show 500ms preview in mini-map
- Animated line from current viewport to target viewport
- User can cancel during preview (Esc or click)
- Auto-execute after preview unless cancelled

### Enhancement 10: Collaborative Selection Zoom

**Description**: In multi-user mode, allow users to share their viewport by broadcasting zoom-to-selection to other users.

**User Value**: Facilitates collaboration by allowing one user to guide others' attention to specific areas.

**Implementation**:
- "Share View" button sends current viewport state to other users
- Receiving users see notification: "User A is viewing Kitchen Area"
- Click notification to sync viewport to shared selection
- Opt-in feature, can ignore shared views
- Works across network with minimal latency
