# UJ-CN-004: Reset View/Fit to Window

## Overview

This user journey describes how users reset the canvas viewport to fit all entities within the visible area. The "Fit to Window" operation automatically calculates the optimal zoom level and pan position to display all project content, providing a quick way to view the entire design regardless of current viewport state.

## PRD References

- **FR-CN-002**: Canvas viewport management with pan and zoom
- **FR-CN-003**: Viewport bounds and fit-to-content operations
- **US-CN-004**: As a user, I want to reset the view to see all content so that I can quickly orient myself after zooming or panning
- **AC-CN-004-01**: Fit to Window calculates bounding box of all entities
- **AC-CN-004-02**: Viewport adjusts to show all content with 10% padding
- **AC-CN-004-03**: Minimum zoom level of 10% applied for sparse layouts
- **AC-CN-004-04**: Maximum zoom level of 400% applied for small layouts
- **AC-CN-004-05**: Keyboard shortcut Ctrl+0 (zero) triggers fit operation
- **AC-CN-004-06**: Animation smoothly transitions viewport over 300ms

## Prerequisites

- User has Canvas page open with active project
- Project contains at least one entity (room, duct, equipment, fitting, or note)
- Viewport may be at any zoom level or pan position
- Understanding of canvas navigation basics

## User Journey Steps

### Step 1: Trigger Fit to Window Operation

**User Actions**:
1. Identify need to view entire design (after zooming in on detail, importing content, or opening project)
2. Choose trigger method:
   - Press `Ctrl+0` (zero) keyboard shortcut, OR
   - Click "View" menu in top menu bar, OR
   - Right-click on canvas background to open context menu
3. Select "Fit to Window" menu item if using menu method
4. Observe viewport animation beginning

**System Response**:
- Keyboard shortcut detected via global event listener
- Menu click triggers fit operation immediately
- Context menu closes after selection
- Animation state initialized with current viewport values
- Cursor changes to hourglass during calculation (if >1000 entities)
- Status bar displays "Fitting to window..." message

**Validation**:
- Current viewport state (zoom, pan) captured for animation start
- Entity count verified (operation skipped if zero entities)
- Animation frame request scheduled
- Undo system captures pre-fit viewport state as ViewportCommand

**Data**:

```
Trigger Input:
- Method: keyboard | menu | contextMenu
- Timestamp: 2025-12-29T14:32:15.234Z

Initial Viewport State:
- zoom: 0.75
- pan: { x: -420, y: 850 }
- canvasWidth: 1920
- canvasHeight: 1080
```

**Substeps**:
1. Event listener captures trigger (keyboard handler or menu click)
2. ViewportStore.fitToWindow() method invoked
3. Current viewport state saved for undo operation
4. Entity bounding box calculation initiated
5. Animation parameters computed

### Step 2: Calculate Entity Bounding Box

**User Actions**:
- User observes brief calculation phase (imperceptible for <100 entities)
- Status bar shows entity count being processed for large projects
- Cursor remains as hourglass during calculation

**System Response**:
- Iterate through all entities in EntityStore
- Calculate bounding box encompassing all entity positions and dimensions
- Include entity rotation in bounds calculation
- Consider duct path points and bezier curve bounds
- Exclude hidden layers if "Fit Visible Only" preference enabled
- Add 10% padding margin around content bounds

**Validation**:
- Minimum one entity exists (operation aborts with message if zero)
- Bounding box has valid width and height (non-zero, non-negative)
- Padding calculation doesn't exceed canvas dimensions
- Invisible entities excluded based on layer visibility

**Data**:

```
Entity Iteration Results:
- Total entities: 47
- Visible entities: 43 (4 on hidden layer)
- Bounding box before padding:
  - minX: 50, maxX: 2400
  - minY: 100, maxY: 1800
  - width: 2350, height: 1700

Padded Bounding Box:
  - minX: -185, maxX: 2635
  - minY: -70, maxY: 1970
  - width: 2820, height: 2040
  - padding: 10% of content dimensions
```

**Substeps**:
1. Initialize bounds with first entity position
2. Iterate all visible entities, expanding bounds
3. For each room: include corner points after rotation
4. For each duct: include all path points and control points
5. For each equipment: include bounding circle after rotation
6. For each note: include text bounds and leader line endpoint
7. Apply 10% padding to final bounds
8. Validate bounds are within reasonable limits

### Step 3: Compute Optimal Zoom and Pan

**User Actions**:
- User sees canvas briefly flash or update (visual feedback of calculation)
- Viewport begins smooth transition animation
- All content becomes visible gradually

**System Response**:
- Calculate zoom level to fit padded bounding box within canvas dimensions
- Choose smaller of (canvasWidth / boundWidth) and (canvasHeight / boundHeight)
- Clamp zoom to min 0.1 (10%) and max 4.0 (400%)
- Calculate pan offset to center bounding box in viewport
- Pan calculation: centerX = -(boundCenterX * zoom - canvasWidth / 2)
- Pan calculation: centerY = -(boundCenterY * zoom - canvasHeight / 2)

**Validation**:
- Zoom level within allowed range [0.1, 4.0]
- Pan coordinates are finite numbers (not NaN or Infinity)
- Resulting viewport shows all entities with padding
- Viewport doesn't exceed maximum pan bounds

**Data**:

```
Zoom Calculation:
- Canvas dimensions: 1920 x 1080
- Content dimensions (padded): 2820 x 2040
- Horizontal scale: 1920 / 2820 = 0.681
- Vertical scale: 1080 / 2040 = 0.529
- Selected zoom: min(0.681, 0.529) = 0.529 (52.9%)
- Clamped zoom: 0.529 (within [0.1, 4.0])

Pan Calculation:
- Bound center: (1225, 950) in world coordinates
- Bound center scaled: (648, 502) at 0.529 zoom
- Canvas center: (960, 540)
- Pan offset: (312, 38) to center content
- Final pan: { x: 312, y: 38 }
```

**Substeps**:
1. Calculate horizontal scale factor (canvas width / bound width)
2. Calculate vertical scale factor (canvas height / bound height)
3. Select minimum of two scale factors
4. Clamp result to [0.1, 4.0] range
5. Calculate world-space center of bounding box
6. Scale center point by computed zoom
7. Calculate pan offset to center scaled content
8. Store target viewport state for animation

### Step 4: Animate Viewport Transition

**User Actions**:
- User observes smooth camera movement and zoom transition
- Content gradually becomes fully visible
- Animation takes 300ms by default
- User can interact with canvas during animation (cancels animation)

**System Response**:
- Easing function applied (ease-in-out cubic)
- RequestAnimationFrame loop updates viewport 60 times per second
- Interpolate zoom from current to target over duration
- Interpolate pan.x and pan.y from current to target over duration
- Canvas re-renders each frame with updated viewport
- Grid updates to match new zoom level
- Minimap updates to show new viewport position

**Validation**:
- Animation completes within 300ms ± 16ms (frame timing variance)
- Final viewport state matches calculated target exactly
- No visual artifacts or flickering during transition
- Performance maintains 60fps (16.67ms per frame)

**Data**:

```
Animation Timeline (300ms duration):
Frame 0ms (start):
  - zoom: 0.750, pan: { x: -420, y: 850 }

Frame 50ms (16.7%):
  - zoom: 0.726, pan: { x: -297, y: 716 }
  - easing: 0.093

Frame 150ms (50%):
  - zoom: 0.640, pan: { x: 54, y: 444 }
  - easing: 0.500

Frame 250ms (83.3%):
  - zoom: 0.554, pan: { x: 270, y: 172 }
  - easing: 0.907

Frame 300ms (end):
  - zoom: 0.529, pan: { x: 312, y: 38 }
  - easing: 1.000

Easing Function (Cubic ease-in-out):
  - t < 0.5: 4t³
  - t >= 0.5: 1 - 4(1-t)³
```

**Substeps**:
1. Record animation start timestamp
2. Schedule first animation frame via requestAnimationFrame
3. On each frame callback:
   - Calculate elapsed time
   - Compute easing progress (0.0 to 1.0)
   - Interpolate zoom: current + (target - current) * easing
   - Interpolate pan.x and pan.y similarly
   - Update ViewportStore with interpolated values
   - Trigger canvas re-render
   - Schedule next frame if not complete
4. On final frame, set exact target values
5. Cancel animation frame requests
6. Emit "viewport-fit-complete" event

### Step 5: Finalize and Provide Feedback

**User Actions**:
- User sees entire design visible with appropriate padding
- User can immediately interact with canvas (zoom, pan, select)
- User notices updated zoom percentage in status bar
- User can undo fit operation to restore previous viewport

**System Response**:
- Viewport state updated in ViewportStore
- Zoom percentage displayed in status bar: "Zoom: 53%"
- Grid renders at appropriate density for new zoom level
- Entity labels render at appropriate size
- Minimap updates to show viewport rectangle position
- Status bar clears "Fitting to window..." message
- Undo stack contains ViewportCommand for reverting fit

**Validation**:
- All entities visible within canvas bounds
- Padding visible on all sides (10% of content size)
- Viewport state persisted to project file on next save
- Undo operation correctly restores previous viewport
- Performance metrics logged for analytics

**Data**:

```
Final Viewport State:
- zoom: 0.529
- pan: { x: 312, y: 38 }
- visibleBounds:
  - minX: -590, maxX: 2450
  - minY: -72, maxY: 1904
  - width: 3040, height: 1976
- allEntitiesVisible: true
- paddingMargin: 10%

Undo Command:
- type: ViewportCommand
- previousState: { zoom: 0.75, pan: { x: -420, y: 850 } }
- newState: { zoom: 0.529, pan: { x: 312, y: 38 } }
- timestamp: 2025-12-29T14:32:15.534Z

Performance Metrics:
- Calculation time: 4ms
- Animation time: 301ms
- Total operation time: 305ms
- Entity count: 47
- Canvas size: 1920x1080
```

**Substeps**:
1. ViewportStore state finalized with target values
2. Grid recalculated for new zoom level
3. Entity render passes update with new transforms
4. Minimap viewport rectangle repositioned
5. Status bar zoom percentage updated
6. Undo command pushed to history stack
7. Analytics event logged with performance metrics
8. Viewport state marked dirty for next project save

## Edge Cases

### Edge Case 1: Empty Canvas

**Scenario**: User triggers Fit to Window when no entities exist in project.

**Expected Behavior**:
- Operation detects zero entities during bounding box calculation
- Toast notification displays: "No content to fit. Add entities to your project."
- Viewport remains unchanged (current zoom and pan preserved)
- No animation occurs
- No undo command created
- Status bar shows "Canvas empty" message briefly

**Handling**:
- Early return from fitToWindow() method after entity count check
- User can immediately add entities and retry fit operation
- Default viewport (zoom: 1.0, pan: {0, 0}) maintained if never changed

### Edge Case 2: Single Entity

**Scenario**: Canvas contains only one small entity (e.g., single diffuser).

**Expected Behavior**:
- Bounding box calculated around single entity
- 10% padding applied to entity dimensions
- Zoom level calculated to fit padded bounds
- Maximum zoom cap (400%) prevents over-magnification
- Single entity centered in viewport with comfortable margins
- Animation proceeds normally

**Handling**:
- For 100px entity: padded bounds = 120px
- On 1920x1080 canvas: max zoom = 1080 / 120 = 9.0
- Clamped to 4.0 (400%) maximum zoom
- Entity appears centered with substantial margins
- User sees clear focus on single element

### Edge Case 3: Extremely Large Design

**Scenario**: Project contains hundreds of entities spanning 50,000px x 30,000px area.

**Expected Behavior**:
- Bounding box calculation handles large coordinates correctly
- Minimum zoom cap (10%) applied to prevent excessive zoom-out
- All entities visible but very small
- Grid switches to coarse density to avoid clutter
- Performance optimization skips intermediate animation frames if needed
- Calculation phase shows progress indicator

**Handling**:
- Content dimensions: 55,000px x 33,000px (with padding)
- Calculated zoom: 1920 / 55000 = 0.035
- Clamped to 0.1 (10%) minimum zoom
- At 10% zoom, not all content visible without panning
- Toast notification: "Design is very large. Zoom set to minimum (10%)."
- User can manually zoom out further if needed (down to 5% hard minimum)

### Edge Case 4: Fit During Active Animation

**Scenario**: User triggers Fit to Window while viewport is already animating from another operation.

**Expected Behavior**:
- Current animation immediately cancelled
- Current viewport state captured mid-animation
- New fit operation begins from interrupted state
- No visual glitch or jump
- Smooth transition from current mid-animation position to new target
- Previous animation's undo command remains in history

**Handling**:
- cancelAnimationFrame() called on existing animation ID
- New fit operation uses current viewport values (mid-animation)
- New undo command created referencing interrupted state
- User can undo twice to restore original position before both animations
- Animation queue cleared before starting new transition

### Edge Case 5: Hidden Layers Affect Bounds

**Scenario**: User has hidden layers with entities far outside visible content area.

**Expected Behavior**:
- If "Fit Visible Only" preference is enabled:
  - Hidden layer entities excluded from bounding box
  - Only visible entities considered for bounds calculation
  - Viewport fits to visible content only
- If "Fit All Content" preference is enabled:
  - Hidden entities included in bounding box
  - Viewport may show large empty areas where hidden content exists
  - User can toggle layer visibility to see excluded content

**Handling**:
- Preference setting checked at start of calculation
- Entity iteration skips entities on hidden layers if "Fit Visible Only"
- Layer visibility state retrieved from LayerStore
- Toast notification shows: "Fitted to 23 visible entities (12 hidden excluded)"
- User can change preference in Settings and re-trigger fit operation

## Error Scenarios

### Error 1: Invalid Entity Coordinates

**Scenario**: Entity in EntityStore has corrupted position data (NaN or Infinity coordinates).

**Error Message**: "Unable to fit to window: invalid entity coordinates detected. Please check entities for errors."

**Recovery**:
1. Bounding box calculation detects NaN or Infinity during iteration
2. Operation aborts before setting viewport
3. Error logged to console with entity ID
4. Toast notification displays error message
5. Entity validation report generated listing corrupted entities
6. User prompted to open Entity Inspector to fix corrupted entities
7. Fallback: user can manually delete corrupted entities
8. Viewport remains unchanged

### Error 2: Animation Frame Timeout

**Scenario**: RequestAnimationFrame callbacks stop firing due to browser tab suspension or system resource constraints.

**Error Message**: "Viewport animation timed out. View has been reset."

**Recovery**:
1. Timeout timer (1000ms) started when animation begins
2. If timeout fires before animation completes:
   - Animation cancelled
   - Viewport immediately set to target state (skip animation)
   - Warning logged to console
   - Toast shows timeout message
3. User sees instant transition instead of smooth animation
4. Viewport reaches correct final state despite timeout
5. Undo functionality remains intact

### Error 3: Extreme Zoom Calculation

**Scenario**: Bounding box calculation produces zoom level outside safe floating-point range.

**Error Message**: "Viewport calculation error: zoom level out of range."

**Recovery**:
1. Zoom calculation produces value < 0.001 or > 1000
2. System detects invalid zoom before applying
3. Fallback zoom level applied: 1.0 (100%)
4. Fallback pan applied: center of bounding box
5. Error logged with diagnostic data
6. Toast notification: "Viewport calculation error. Using default zoom."
7. User can manually zoom and pan to desired view
8. Bug report prompt shown for submitting diagnostic data

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+0` | Fit to Window | Canvas focused, any viewport state |
| `Ctrl+Shift+0` | Fit to Selection | Canvas focused, entities selected |
| `Ctrl+1` | Reset to 100% Zoom | Canvas focused, any viewport state |
| `Ctrl+2` | Set 200% Zoom (center) | Canvas focused, any viewport state |
| `Ctrl+9` | Zoom to Previous View | After fit operation, restores previous viewport |
| `Home` | Pan to Origin (0, 0) | Canvas focused, maintains current zoom |
| `Esc` | Cancel Active Animation | During viewport animation |

## Related Elements

### Components
- **CanvasViewport.tsx**: Main canvas component managing viewport state and rendering
- **ViewMenu.tsx**: Top menu bar View menu with Fit to Window item
- **CanvasContextMenu.tsx**: Right-click context menu with viewport options
- **Minimap.tsx**: Thumbnail view showing viewport rectangle and fit operation results
- **StatusBar.tsx**: Displays zoom percentage and fit operation status messages
- **GridOverlay.tsx**: Grid rendering that adapts to zoom level changes

### Stores
- **ViewportStore**: Central state for zoom, pan, and viewport bounds
  - `fitToWindow()`: Main method implementing fit operation
  - `zoom`: Current zoom level (0.05 to 10.0)
  - `pan`: Current pan offset { x, y }
  - `animateViewport()`: Handles smooth transitions
- **EntityStore**: Source of entity data for bounding box calculation
  - `getAllEntities()`: Returns all entities for bounds iteration
  - `getVisibleEntities()`: Returns only entities on visible layers
- **LayerStore**: Layer visibility state for "fit visible only" mode
  - `isLayerVisible(layerId)`: Checks if layer should be included in bounds
- **HistoryStore**: Manages undo/redo for viewport operations
  - Stores ViewportCommand instances for fit operations

### Hooks
- **useViewportAnimation**: Manages requestAnimationFrame loop for smooth transitions
  - Handles easing curves and interpolation
  - Cancels animation on user interaction
  - Reports animation completion
- **useKeyboardShortcuts**: Global keyboard event handler for Ctrl+0 and other shortcuts
- **useBoundingBox**: Utility hook for calculating entity bounds
  - Handles rotation transforms
  - Includes bezier curve bounds for ducts
  - Applies padding margins

### Commands
- **ViewportCommand**: Undo/redo command for viewport state changes
  - `execute()`: Applies new viewport state with animation
  - `undo()`: Restores previous viewport state with reverse animation
  - Serializes viewport state for persistence

### Services
- **ViewportCalculator.ts**: Pure functions for bounds and viewport math
  - `calculateEntityBounds(entity)`: Computes axis-aligned bounds for entity
  - `calculateBoundingBox(entities)`: Computes overall bounds for entity list
  - `calculateFitViewport(bounds, canvasSize)`: Computes optimal zoom and pan
  - `clampZoom(zoom)`: Applies min/max limits to zoom level

## Visual Diagrams

### Fit to Window Operation Flow

```
User Trigger (Ctrl+0)
        |
        v
  Capture Current
  Viewport State
  (for undo)
        |
        v
  Iterate All
  Entities
        |
        v
  Calculate
  Bounding Box
  (min/max X/Y)
        |
        v
  Apply 10%
  Padding Margin
        |
        v
  Calculate Optimal
  Zoom Level
  (min of H/V scale)
        |
        v
  Clamp Zoom to
  [0.1, 4.0]
        |
        v
  Calculate Pan
  to Center Content
        |
        v
  Start Animation
  (300ms, ease-in-out)
        |
        v
  Update Viewport
  60fps
        |
        v
  Finalize State
  & Push Undo
```

### Bounding Box Calculation

```
Entity Set:
  Room A: (100, 100) -> (400, 300)
  Room B: (500, 150) -> (800, 450)
  Duct C: path [(200, 350), (600, 350)]
  Equipment D: center (700, 200), radius 50

Iteration:
  Room A: minX=100, maxX=400, minY=100, maxY=300
  Room B: minX=100, maxX=800, minY=100, maxY=450
  Duct C: minX=100, maxX=800, minY=100, maxY=450
  Equipment D: minX=100, maxX=850, minY=100, maxY=450

Bounding Box (before padding):
  minX=100, maxX=850 -> width=750
  minY=100, maxY=450 -> height=350

Apply 10% Padding:
  paddingX = 750 * 0.10 = 75
  paddingY = 350 * 0.10 = 35

Padded Bounding Box:
  minX=25, maxX=925 -> width=900
  minY=65, maxY=485 -> height=420
```

### Zoom and Pan Calculation

```
Canvas Size: 1920 x 1080
Padded Bounds: 900 x 420 (center: 475, 275)

Zoom Calculation:
  Horizontal scale: 1920 / 900 = 2.133
  Vertical scale: 1080 / 420 = 2.571
  Selected zoom: min(2.133, 2.571) = 2.133
  Clamped: min(max(2.133, 0.1), 4.0) = 2.133 (213.3%)

Pan Calculation:
  Bound center in world: (475, 275)
  Bound center scaled: (475 * 2.133, 275 * 2.133) = (1013, 587)
  Canvas center: (960, 540)
  Pan offset: (960 - 1013, 540 - 587) = (-53, -47)

Final Viewport:
  zoom: 2.133
  pan: { x: -53, y: -47 }

Verification:
  Top-left visible: (25, 65) in world coords
  Bottom-right visible: (925, 485) in world coords
  All entities within viewport: ✓
```

### Viewport Animation Timeline

```
Time:     0ms         75ms        150ms       225ms       300ms
          |           |           |           |           |
Zoom:   [0.75]----[0.98]----[1.44]----[1.89]----[2.13]
          |           |           |           |           |
Pan X:  [-420]----[-321]----[-187]----[-92]-----[-53]
          |           |           |           |           |
Pan Y:  [850]-----[639]-----[300]-----[26]------[-47]
          |           |           |           |           |
Easing: [0.00]----[0.17]----[0.50]----[0.83]----[1.00]
          |           |           |           |           |
          Start     25%         50%         75%         End

Easing Curve (Cubic ease-in-out):
    1.0 |                    ________
        |                  /
    0.5 |                /
        |              /
    0.0 |___________/
        0        0.5        1.0
             Normalized Time

Interpolation Formula:
  value(t) = start + (end - start) * easing(t)

Where easing(t) =
  t < 0.5: 4t³
  t >= 0.5: 1 - 4(1-t)³
```

### UI State During Fit Operation

```
Before Fit:
┌─────────────────────────────────────┐
│  Menu Bar: View > Fit to Window     │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         [Small visible area]        │
│             Room A                  │
│              [=]                    │
│                                     │
│                                     │
│     (Most content off-screen)       │
│                                     │
├─────────────────────────────────────┤
│  Zoom: 75%             Minimap: █   │
└─────────────────────────────────────┘

After Fit (Animated):
┌─────────────────────────────────────┐
│  Menu Bar                           │
├─────────────────────────────────────┤
│    [Padding 10%]                    │
│  ┌─────────────────────────────┐   │
│  │  Room A    Room B            │   │
│  │   [=]       [=]              │   │
│  │       Duct C                 │   │
│  │   ─────────────              │   │
│  │           Equipment D        │   │
│  │              (•)             │   │
│  └─────────────────────────────┘   │
│    [Padding 10%]                    │
├─────────────────────────────────────┤
│  Zoom: 213%            Minimap: ███ │
└─────────────────────────────────────┘
```

### Minimap View Update

```
Before Fit:
┌─────────────────┐
│ · · · ·         │  Minimap showing entire project
│ · A B ·         │  Small viewport rectangle (left side)
│ · ─── ·         │  Most content not visible
│ · · D ·         │
│ [█]             │  <- Viewport position indicator
└─────────────────┘

After Fit:
┌─────────────────┐
│                 │  Minimap showing entire project
│   A   B         │  Larger viewport rectangle (centered)
│   ─────         │  All content visible in viewport
│       D         │
│   [█████]       │  <- Viewport position indicator
└─────────────────┘
```

## Testing

### Unit Tests

**Test Suite**: ViewportStore.fitToWindow()

1. **Test: Calculate correct zoom for horizontal content**
   - Setup: Create entities spanning 2000px width x 500px height
   - Canvas: 1920px x 1080px
   - Action: Call fitToWindow()
   - Assert: Zoom is 1080 / (500 * 1.1) = 1.964 (vertical constraint)

2. **Test: Calculate correct zoom for vertical content**
   - Setup: Create entities spanning 500px width x 2000px height
   - Canvas: 1920px x 1080px
   - Action: Call fitToWindow()
   - Assert: Zoom is 1920 / (500 * 1.1) = 3.491, clamped to 4.0 max

3. **Test: Apply minimum zoom clamp for large designs**
   - Setup: Create entities spanning 50,000px x 30,000px
   - Canvas: 1920px x 1080px
   - Action: Call fitToWindow()
   - Assert: Zoom is 0.1 (10%) minimum applied

4. **Test: Apply maximum zoom clamp for small designs**
   - Setup: Create single entity 50px x 50px
   - Canvas: 1920px x 1080px
   - Action: Call fitToWindow()
   - Assert: Zoom is 4.0 (400%) maximum applied

5. **Test: Center content correctly in viewport**
   - Setup: Create entities with bounding box (100, 100) to (300, 200)
   - Canvas: 1920px x 1080px
   - Action: Call fitToWindow()
   - Assert: Pan centers (200, 150) world coordinate at canvas center

6. **Test: Exclude hidden layer entities when preference enabled**
   - Setup: Create 5 visible entities and 5 entities on hidden layer
   - Preference: "Fit Visible Only" enabled
   - Action: Call fitToWindow()
   - Assert: Bounding box calculated from 5 visible entities only

7. **Test: Include all entities regardless of visibility when preference disabled**
   - Setup: Create 5 visible entities and 5 entities on hidden layer
   - Preference: "Fit All Content" enabled
   - Action: Call fitToWindow()
   - Assert: Bounding box calculated from all 10 entities

8. **Test: Handle empty canvas gracefully**
   - Setup: Empty EntityStore (zero entities)
   - Action: Call fitToWindow()
   - Assert: Operation aborts, toast shown, viewport unchanged

### Integration Tests

**Test Suite**: Fit to Window Animation

1. **Test: Smooth viewport transition over 300ms**
   - Setup: Set viewport to zoom=0.5, pan={-500, -500}
   - Create entities requiring zoom=2.0, pan={100, 100}
   - Action: Trigger fitToWindow(), monitor animation frames
   - Assert: Animation completes in 300ms ± 16ms
   - Assert: At least 15 frames rendered (60fps target)
   - Assert: Final state exactly matches calculated target

2. **Test: Cancel animation on user interaction**
   - Setup: Start fit operation (300ms animation)
   - Action: After 150ms, user clicks and drags to pan
   - Assert: Animation immediately cancelled
   - Assert: User pan operation takes control
   - Assert: Viewport follows user input smoothly

3. **Test: Undo restores previous viewport**
   - Setup: Set viewport to zoom=1.5, pan={200, 300}
   - Action: Trigger fitToWindow() (new state: zoom=0.8, pan={-50, 100})
   - Action: Trigger undo (Ctrl+Z)
   - Assert: Viewport animates back to zoom=1.5, pan={200, 300}
   - Assert: Animation uses same 300ms duration

4. **Test: Consecutive fit operations chain correctly**
   - Setup: Viewport at zoom=1.0, pan={0, 0}
   - Action: Add entity at (1000, 1000), trigger fit (State A)
   - Action: Add entity at (5000, 5000), trigger fit (State B)
   - Action: Undo once -> returns to State A
   - Action: Undo twice -> returns to original zoom=1.0, pan={0, 0}
   - Assert: Each undo step correctly restores previous viewport

5. **Test: Fit operation updates minimap viewport indicator**
   - Setup: Minimap component rendered
   - Action: Trigger fitToWindow()
   - Assert: Minimap viewport rectangle animates to new position
   - Assert: Rectangle size changes to reflect new zoom level
   - Assert: Final rectangle accurately represents visible area

### End-to-End Tests

**Test Suite**: User Fit Workflow

1. **Test: User fits to window after zooming in on detail**
   - Setup: Open project with multiple rooms
   - Action: User zooms to 300% on specific room
   - Action: User presses Ctrl+0
   - Assert: Viewport animates to show all rooms
   - Assert: All entities visible with 10% padding
   - Assert: Status bar shows updated zoom percentage

2. **Test: User fits to window via menu**
   - Setup: Open project with scattered entities
   - Action: User clicks "View" in top menu bar
   - Action: User clicks "Fit to Window" menu item
   - Assert: Menu closes
   - Assert: Viewport animates to fit all content
   - Assert: Toast confirmation (if enabled in preferences)

3. **Test: User fits to window via context menu**
   - Setup: Open project, right-click on canvas background
   - Action: Context menu appears with "Fit to Window" option
   - Action: User clicks "Fit to Window"
   - Assert: Context menu closes
   - Assert: Viewport animates to fit all content

4. **Test: User toggles hidden layer and re-fits**
   - Setup: Project with entities on "Supply" and "Return" layers
   - Action: User hides "Return" layer
   - Action: User triggers fitToWindow()
   - Assert: Viewport fits only to visible "Supply" layer entities
   - Action: User shows "Return" layer
   - Action: User triggers fitToWindow()
   - Assert: Viewport expands to include "Return" layer entities

5. **Test: User imports large image and fits to see it**
   - Setup: Open empty project
   - Action: User imports 5000x3000px reference image
   - Action: User triggers fitToWindow()
   - Assert: Viewport zooms out to show entire image
   - Assert: Zoom level may be below 100% to fit large image
   - Assert: User can see full image bounds with padding

## Common Pitfalls

### Pitfall 1: Not Accounting for Padding in Manual Calculations

**Problem**: Developers manually calculate zoom assuming bounding box equals visible area, forgetting 10% padding.

**Symptom**: Manual zoom calculations produce viewport where entities touch canvas edges, while fitToWindow() shows comfortable margins.

**Solution**: Always add 10% padding to content dimensions before calculating zoom:
- Padded width = contentWidth * 1.1
- Padded height = contentHeight * 1.1
- Then calculate zoom = min(canvasWidth / paddedWidth, canvasHeight / paddedHeight)

### Pitfall 2: Forgetting Zoom Clamps

**Problem**: Calculated zoom level appears correct mathematically but gets clamped, causing unexpected viewport state.

**Symptom**: For very small content (one entity), expected zoom is 10.0, but actual zoom is 4.0. For very large content, expected zoom is 0.02, but actual zoom is 0.1.

**Solution**: Always apply clamps after calculation:
- After calculating optimal zoom, apply: `Math.max(0.1, Math.min(4.0, calculatedZoom))`
- Check if clamping occurred and notify user for extreme cases
- Consider adjusting zoom limits in preferences for specialized use cases

### Pitfall 3: Ignoring Entity Rotation in Bounds

**Problem**: Bounding box calculated from entity center and dimensions, ignoring rotation transform.

**Symptom**: Rotated rectangular rooms appear clipped after fit operation because axis-aligned bounds were too small.

**Solution**: Calculate axis-aligned bounding box (AABB) that encompasses rotated entity:
- For rotated rectangle: transform all four corners, find min/max X/Y
- For rotated equipment: calculate bounding circle radius, extend in all directions
- For ducts: include all control points, not just endpoints

### Pitfall 4: Not Handling Empty Canvas

**Problem**: fitToWindow() called on empty canvas, causing NaN or Infinity in calculations.

**Symptom**: Viewport breaks, canvas shows blank screen, zoom controls non-functional.

**Solution**: Add early return at start of fitToWindow():
- Check entityStore.getCount() > 0
- If zero, show toast: "No content to fit"
- Return early without modifying viewport
- Optionally reset to default viewport (zoom=1.0, pan={0,0})

### Pitfall 5: Animation Performance with Many Entities

**Problem**: Fit operation on project with 1000+ entities causes animation to stutter or drop frames.

**Symptom**: Animation appears jerky, takes longer than 300ms, user sees frame drops.

**Solution**: Optimize rendering during animation:
- Set "animating" flag to reduce render quality temporarily
- Skip expensive operations (shadows, anti-aliasing) during transition
- Use requestAnimationFrame timing to skip frames if behind schedule
- Consider instant transition (no animation) for projects >5000 entities
- Show progress indicator during bounding box calculation if >1000 entities

## Performance Tips

### Tip 1: Cache Bounding Box for Static Content

If project content hasn't changed since last fit operation, cache the calculated bounding box to avoid re-iteration:

**Implementation**: Store bounding box in ViewportStore with version number matching EntityStore version. Invalidate cache when entities added/removed/modified.

**Benefit**: Reduces fit operation time from 50ms to <1ms for large static projects when user repeatedly triggers fit.

### Tip 2: Use Spatial Index for Large Projects

For projects with >1000 entities, maintain a spatial index (quadtree or R-tree) to quickly query bounding box:

**Implementation**: EntityStore maintains quadtree that updates on entity changes. fitToWindow() queries quadtree.getBounds() instead of iterating.

**Benefit**: Reduces bounding box calculation from O(n) to O(log n), critical for very large projects (10,000+ entities).

### Tip 3: Debounce Fit During Rapid Changes

If user is rapidly adding entities (e.g., importing CSV data) and auto-fit is enabled, debounce fit operations:

**Implementation**: Track last fit timestamp. Ignore fit triggers within 1000ms of previous fit. Queue single fit for 500ms after last change.

**Benefit**: Prevents excessive fit operations during bulk imports, reducing CPU usage and improving responsiveness.

### Tip 4: Progressive Animation Quality

Start animation with lower render quality (no anti-aliasing, simplified entities), progressively increase quality as animation completes:

**Implementation**:
- Frames 0-100ms: Render entities as simple rectangles/circles
- Frames 100-200ms: Render with basic styling, no shadows
- Frames 200-300ms: Render with full quality
- Final frame: Force full-quality render

**Benefit**: Maintains 60fps during animation even on slower hardware, final state appears high-quality.

### Tip 5: Predictive Bounding Box

For operations that will trigger fit (import, paste), calculate bounding box before adding entities to allow instant fit:

**Implementation**: Import operation calculates bounds of incoming entities, adds entities to store, then calls fitToWindow() with pre-calculated bounds.

**Benefit**: Eliminates bounding box calculation delay, user sees instant fit after import completes.

## Future Enhancements

### Enhancement 1: Fit to Selection

**Description**: Extend fit operation to focus on selected entities only, ignoring unselected content.

**User Value**: Allows quick zoom to selected entities for detailed work, then fit to all content when needed.

**Implementation**:
- New method: `fitToSelection()` triggered by Ctrl+Shift+0
- Calculate bounding box from selected entities only
- Zoom closer than fit-all (less padding needed)
- Undo/redo support with same ViewportCommand pattern

### Enhancement 2: Smart Padding Based on Zoom Level

**Description**: Adjust padding percentage based on resulting zoom level - more padding at high zoom, less at low zoom.

**User Value**: Provides more comfortable margins when zoomed in on small content, reduces wasted space when viewing large content.

**Implementation**:
- Zoom > 2.0: Use 20% padding (more breathing room)
- Zoom 0.5 - 2.0: Use 10% padding (current default)
- Zoom < 0.5: Use 5% padding (maximize content visibility)
- Padding calculated after initial zoom, zoom recalculated with new padding

### Enhancement 3: Fit Undo Cycle

**Description**: Make repeated Ctrl+0 presses cycle between fit-all, fit-visible-layers, and previous view.

**User Value**: Quick way to toggle between different view contexts without menu interaction.

**Implementation**:
- First Ctrl+0: Fit to all content
- Second Ctrl+0 (within 2 seconds): Fit to visible layers only
- Third Ctrl+0 (within 2 seconds): Restore previous view before first fit
- After 2 seconds: Reset cycle, next Ctrl+0 starts from fit-all

### Enhancement 4: Animated Padding Overlay

**Description**: Briefly show colored overlay indicating padding margin area after fit completes.

**User Value**: Helps users understand padding and provides visual confirmation of fit operation completion.

**Implementation**:
- After animation completes, render semi-transparent border (green, 20% opacity)
- Border drawn at padding boundary (10% inside visible bounds)
- Fade out over 1 second
- User preference to enable/disable overlay

### Enhancement 5: Fit History Navigation

**Description**: Maintain stack of previous viewport states, allow navigation with Ctrl+[ and Ctrl+].

**User Value**: Quick navigation between different view contexts without relying on undo stack.

**Implementation**:
- ViewportStore maintains viewportHistory array (max 20 entries)
- Each fit, zoom, or pan operation pushes to history
- Ctrl+[: Navigate to previous viewport
- Ctrl+]: Navigate to next viewport
- Independent of undo system (viewport-only history)

### Enhancement 6: Fit Presets for Common Ratios

**Description**: Add "Fit to 16:9", "Fit to 4:3", "Fit to Square" menu options that adjust content bounds to specific aspect ratios.

**User Value**: Useful for preparing layouts for export to specific image sizes or presentation formats.

**Implementation**:
- Calculate bounding box as usual
- Expand bounds to match target aspect ratio (centered)
- Apply fit operation to expanded bounds
- Content appears with appropriate letterboxing/pillarboxing

### Enhancement 7: Multi-Monitor Fit Awareness

**Description**: Detect when canvas spans multiple monitors, adjust fit calculation to account for visible area on primary monitor only.

**User Value**: Prevents fit operation from using off-screen area on secondary monitor, focuses on user's primary viewing area.

**Implementation**:
- Use window.screen API to detect monitor configuration
- Calculate canvas area visible on primary monitor
- Use visible area dimensions for fit calculation instead of full canvas
- Fallback to full canvas if multi-monitor detection unavailable

### Enhancement 8: Gesture-Based Fit

**Description**: Support double-tap (touch) or double-right-click (mouse) on canvas background to trigger fit operation.

**User Value**: Provides intuitive gesture for quick fit without keyboard or menu, especially useful on touch devices.

**Implementation**:
- Track tap/click timestamps and positions
- Two taps/clicks within 300ms at same position (<10px movement) triggers fit
- Maintain existing Ctrl+0 and menu options
- Gesture can be disabled in preferences

### Enhancement 9: Fit with Smooth Zoom Levels

**Description**: After calculating optimal zoom, round to nearest "nice" zoom level (10%, 25%, 50%, 75%, 100%, 125%, 150%, 200%, etc.).

**User Value**: Results in cleaner zoom percentages, easier to remember and communicate ("fit to 150%" vs "fit to 147.3%").

**Implementation**:
- Define array of preferred zoom levels
- After calculating optimal zoom, find nearest preferred level
- If preferred level doesn't fit all content, use next higher level
- Add user preference to enable/disable rounding

### Enhancement 10: Fit Animation Customization

**Description**: Allow users to customize animation duration, easing curve, and whether animation occurs at all.

**User Value**: Power users can disable animation for instant fit, or slow animation for presentations.

**Implementation**:
- Settings panel with animation controls:
  - Duration slider: 0ms (instant) to 1000ms
  - Easing dropdown: Linear, Ease-in-out (current), Ease-in, Ease-out
  - Enable/disable checkbox
- Store preferences in user settings
- Apply settings when triggering fit operation
