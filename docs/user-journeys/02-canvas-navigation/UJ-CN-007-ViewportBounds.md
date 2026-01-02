# UJ-CN-007: Viewport Bounds Management

## Overview

This user journey describes how the application manages viewport boundaries to prevent users from navigating too far from project content. Viewport bounds provide intelligent constraints on pan and zoom operations, ensuring users maintain orientation while allowing reasonable exploration beyond visible content.

## PRD References

- **FR-CN-006**: Intelligent viewport boundary management based on content
- **FR-CN-007**: Configurable pan limits and zoom constraints
- **US-CN-007**: As a user, I want reasonable limits on how far I can pan so that I don't get lost in empty space
- **AC-CN-007-01**: Pan bounds calculated dynamically from project content bounding box
- **AC-CN-007-02**: Default margin of 2000px beyond content in all directions
- **AC-CN-007-03**: Zoom bounds enforce minimum 5% and maximum 1000% zoom levels
- **AC-CN-007-04**: Visual feedback when approaching or reaching bounds
- **AC-CN-007-05**: "Return to Content" command centers viewport on content
- **AC-CN-007-06**: Bounds update automatically when content added/removed

## Prerequisites

- User has Canvas page open with active project
- Project may contain any number of entities (including zero for empty canvas)
- Viewport can be at any zoom level or pan position
- Understanding of basic canvas navigation (pan, zoom)

## User Journey Steps

### Step 1: Calculate Content Bounding Box

**User Actions**:
- User opens project or adds/removes entities
- No explicit action required from user (automatic system process)
- Content bounds update transparently in background

**System Response**:
- Iterate through all entities in EntityStore
- Calculate axis-aligned bounding box (AABB) encompassing all entities
- Account for entity dimensions, rotations, and connection points
- Store content bounds in ViewportStore
- Trigger viewport bounds recalculation
- Update minimap to reflect content area

**Validation**:
- Bounding box has valid dimensions (non-negative width/height)
- For empty canvas, use default origin-centered bounds
- Bounds update atomically (no partial updates)
- Content bounds version incremented for cache invalidation

**Data**:

```
Entity Inventory:
- Room entities: 12
- Duct entities: 24
- Equipment entities: 8
- Fitting entities: 15
- Note entities: 3
- Total: 62 entities

Content Bounding Box Calculation:
Iteration results:
  - minX: 50 (leftmost entity edge)
  - maxX: 4500 (rightmost entity edge)
  - minY: 100 (topmost entity edge)
  - maxY: 3200 (bottommost entity edge)

Content Bounds:
  - x: 50, y: 100
  - width: 4450, height: 3100
  - center: (2275, 1750)

Stored in ViewportStore:
- contentBounds: {
    minX: 50, maxX: 4500,
    minY: 100, maxY: 3200,
    width: 4450, height: 3100,
    center: { x: 2275, y: 1750 }
  }
- boundsVersion: 47
- lastUpdated: 2025-12-29T17:15:42.234Z
```

**Substeps**:
1. EntityStore emits content-changed event
2. ViewportStore.recalculateContentBounds() triggered
3. Retrieve all entities from EntityStore
4. Initialize bounds with first entity position
5. Iterate remaining entities, expanding bounds
6. Finalize content bounds object
7. Store in ViewportStore.contentBounds
8. Increment boundsVersion
9. Emit bounds-updated event

### Step 2: Calculate Viewport Bounds from Content

**User Actions**:
- No explicit user action (automatic calculation)
- System transparently manages bounds based on content changes

**System Response**:
- Take content bounding box from Step 1
- Apply configurable margin (default: 2000px) in all directions
- Calculate minimum and maximum pan offsets
- Account for canvas dimensions and current zoom
- Store viewport bounds in ViewportStore
- Visual bounds indicator updated in minimap (optional)

**Validation**:
- Viewport bounds encompass entire content bounds plus margin
- Bounds are symmetric around content (equal margin all sides)
- Bounds adjust for different zoom levels appropriately
- Empty canvas gets default bounds (e.g., ±5000px from origin)

**Data**:

```
Content Bounds (from Step 1):
  - minX: 50, maxX: 4500
  - minY: 100, maxY: 3200

Configuration:
  - Pan margin: 2000px
  - Zoom: 1.0 (current)

Viewport Bounds Calculation:
  minPanX = contentMinX - margin = 50 - 2000 = -1950
  maxPanX = contentMaxX + margin = 4500 + 2000 = 6500
  minPanY = contentMinY - margin = 100 - 2000 = -1900
  maxPanY = contentMaxY + margin = 3200 + 2000 = 5200

Viewport Bounds:
  - minPan: { x: -1950, y: -1900 }
  - maxPan: { x: 6500, y: 5200 }
  - totalArea: (6500-(-1950)) × (5200-(-1900))
               = 8450 × 7100 = 59,995,000 px²

Empty Canvas Default Bounds:
  - minPan: { x: -5000, y: -5000 }
  - maxPan: { x: 5000, y: 5000 }
  - totalArea: 10,000 × 10,000 = 100,000,000 px²
```

**Substeps**:
1. Retrieve contentBounds from ViewportStore
2. Check if content exists (non-zero entities)
3. If content exists:
   - Calculate minPan = contentMin - margin
   - Calculate maxPan = contentMax + margin
4. If no content (empty canvas):
   - Use default bounds (±5000px from origin)
5. Store viewportBounds in ViewportStore
6. Update minimap bounds indicator
7. Emit viewport-bounds-updated event

### Step 3: Enforce Bounds During Pan Operations

**User Actions**:
1. User attempts to pan viewport using any method:
   - Mouse drag (hand tool)
   - Arrow keys
   - Trackpad gesture
   - Pan to specific location programmatically
2. Pan may attempt to move beyond calculated bounds
3. User observes pan stops at boundary or provides feedback

**System Response**:
- Intercept pan update in ViewportStore.setPan()
- Calculate new pan position from user input
- Clamp pan.x to [minPanX, maxPanX]
- Clamp pan.y to [minPanY, maxPanY]
- If clamped, trigger bounds feedback:
  - Visual: Brief red flash on canvas border
  - Audio: Subtle "thud" sound effect (if enabled)
  - Haptic: Vibration feedback on supported devices
  - Toast: "Boundary reached" (if pan exceeds by >500px)
- Apply clamped pan position
- Update viewport rendering

**Validation**:
- Pan position never exceeds bounds (guaranteed constraint)
- Feedback triggers only when clamping occurs
- Clamping doesn't create visual jumps or jarring behavior
- Undo system captures intended pan, not clamped result

**Data**:

```
Pan Operation Example:

User Action: Drag right to pan viewport

Attempted Pan:
  - Current: { x: 6400, y: 2000 }
  - Delta: { x: +200, y: 0 }
  - Calculated new: { x: 6600, y: 2000 }

Bounds Check:
  - maxPanX: 6500
  - newPan.x (6600) > maxPanX (6500) → CLAMP

Clamping:
  - clampedX = Math.min(6600, 6500) = 6500
  - clampedY = 2000 (within bounds)
  - Final pan: { x: 6500, y: 2000 }

Feedback Triggered:
  - Visual: Red border flash (200ms)
  - Audio: "thud.mp3" (50ms, 30% volume)
  - Toast: "Pan boundary reached" (2s duration)
  - Cursor: Briefly changes to "not-allowed" icon

Applied Pan:
  - viewportPan: { x: 6500, y: 2000 }
  - Viewport renders at boundary
  - User cannot pan further right
```

**Substeps**:
1. User initiates pan operation
2. Pan delta calculated from input
3. New pan = current pan + delta
4. ViewportStore.setPan(newPan) called
5. Bounds check performed:
   - clampedX = Math.max(minPanX, Math.min(maxPanX, newPan.x))
   - clampedY = Math.max(minPanY, Math.min(maxPanY, newPan.y))
6. Check if clamping occurred:
   - if (clampedX !== newPan.x || clampedY !== newPan.y)
7. If clamped, trigger feedback (visual/audio/haptic)
8. Apply clamped pan to viewport
9. Trigger canvas re-render

### Step 4: Enforce Bounds During Zoom Operations

**User Actions**:
1. User attempts to zoom in or out:
   - Mouse wheel scroll
   - Pinch gesture on trackpad
   - Zoom slider in toolbar
   - Keyboard shortcuts (Ctrl++, Ctrl+-)
2. Zoom may attempt to exceed minimum or maximum limits
3. User observes zoom clamping and feedback

**System Response**:
- Intercept zoom update in ViewportStore.setZoom()
- Calculate new zoom level from user input
- Clamp zoom to [minZoom, maxZoom] range:
  - minZoom: 0.05 (5%)
  - maxZoom: 10.0 (1000%)
- If clamped, trigger feedback:
  - Visual: Zoom percentage flashes in status bar
  - Audio: Subtle "click" sound (if enabled)
  - Toast: "Minimum zoom (5%)" or "Maximum zoom (1000%)"
- Apply clamped zoom level
- Adjust pan position to maintain zoom center point
- Update viewport rendering

**Validation**:
- Zoom never exceeds [0.05, 10.0] range
- Zoom center point (mouse position or viewport center) preserved
- Smooth transition even when clamped
- Status bar reflects actual zoom, not attempted zoom

**Data**:

```
Zoom Operation Example:

User Action: Scroll wheel to zoom in

Attempted Zoom:
  - Current zoom: 9.5
  - Scroll delta: +0.8 (zoom in)
  - Calculated new: 10.3

Bounds Check:
  - maxZoom: 10.0
  - newZoom (10.3) > maxZoom (10.0) → CLAMP

Clamping:
  - clampedZoom = Math.min(10.3, 10.0) = 10.0
  - Zoom clamped to maximum

Feedback Triggered:
  - Visual: Status bar zoom flashes yellow (500ms)
  - Audio: "zoom-limit.mp3" (100ms)
  - Toast: "Maximum zoom (1000%) reached"

Pan Adjustment (maintain center):
  - Zoom center: mouse position (750, 400) screen coords
  - World coords at old zoom: (750/9.5, 400/9.5) = (78.9, 42.1)
  - World coords at new zoom: (750/10.0, 400/10.0) = (75.0, 40.0)
  - Pan adjustment: maintain (78.9, 42.1) at screen (750, 400)

Applied Zoom:
  - viewportZoom: 10.0 (1000%)
  - Pan adjusted to preserve zoom center
  - User cannot zoom in further
```

**Substeps**:
1. User initiates zoom operation
2. Zoom delta calculated from input
3. New zoom = current zoom + delta
4. ViewportStore.setZoom(newZoom) called
5. Bounds check:
   - clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom))
6. Check if clamping occurred:
   - if (clampedZoom !== newZoom)
7. If clamped, trigger feedback
8. Calculate pan adjustment to preserve zoom center
9. Apply clamped zoom and adjusted pan
10. Trigger canvas re-render

### Step 5: Provide "Return to Content" Navigation

**User Actions**:
1. User navigates far from content (near viewport bounds)
2. User wants to quickly return to main project area
3. User triggers "Return to Content" command:
   - Press Home key, OR
   - Click "View > Return to Content" menu item, OR
   - Click "Return to Content" button in status bar (appears when far from content)
4. Observe smooth animation back to content center

**System Response**:
- Calculate center of content bounding box
- Calculate optimal zoom to fit content (similar to Fit to Window)
- Animate viewport from current position to content center
- Animation duration: 500ms (longer than normal pan for dramatic effect)
- Easing: ease-in-out cubic
- Status bar shows: "Returning to content..."
- Undo command created for return operation

**Validation**:
- Content center calculated correctly
- Animation smooth and complete
- Final viewport shows all or most content
- Undo restores pre-return viewport position

**Data**:

```
Return to Content Operation:

Current Viewport (user is lost):
  - pan: { x: 8000, y: -3000 } (far outside content)
  - zoom: 0.3 (zoomed out)

Content Bounds:
  - center: { x: 2275, y: 1750 }
  - dimensions: 4450 x 3100

Target Viewport:
  - Calculate zoom to fit content with 10% padding
  - Canvas: 1920 x 1080
  - Content padded: 4895 x 3410
  - Zoom: min(1920/4895, 1080/3410) = 0.316
  - Pan to center content at (2275, 1750)
  - Target pan: { x: -500, y: 100 } (approx)

Animation:
  - Start: { zoom: 0.3, pan: { x: 8000, y: -3000 } }
  - End: { zoom: 0.316, pan: { x: -500, y: 100 } }
  - Duration: 500ms
  - Easing: cubic ease-in-out
  - Frames: ~30 (60fps)

Undo Command:
  - type: ViewportCommand
  - commandName: "Return to Content"
  - previousState: { zoom: 0.3, pan: { x: 8000, y: -3000 } }
  - newState: { zoom: 0.316, pan: { x: -500, y: 100 } }
```

**Substeps**:
1. User triggers "Return to Content" command
2. Retrieve contentBounds from ViewportStore
3. Calculate content center and dimensions
4. Calculate optimal zoom (fit content with padding)
5. Calculate pan to center content in viewport
6. Capture current viewport for undo
7. Start animation to target viewport
8. Update viewport each frame (60fps)
9. Finalize viewport at target state
10. Create ViewportCommand for undo
11. Display completion message

## Edge Cases

### Edge Case 1: Empty Canvas (No Content)

**Scenario**: User opens new project or deletes all entities, leaving canvas empty.

**Expected Behavior**:
- Content bounding box has zero area
- System uses default viewport bounds (±5000px from origin)
- Pan operations clamped to default bounds
- Zoom operations still clamped to [0.05, 10.0]
- "Return to Content" command centers on origin (0, 0) at 100% zoom
- Toast notification: "Canvas is empty. Add entities to define content area."

**Handling**:
- Check entity count in contentBounds calculation
- If zero entities, set contentBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 }
- Apply default bounds: minPan = {-5000, -5000}, maxPan = {5000, 5000}
- First entity added triggers bounds recalculation
- User can explore default area freely

### Edge Case 2: Single Entity (Very Small Content Area)

**Scenario**: Canvas contains only one small entity (e.g., single 100px diffuser).

**Expected Behavior**:
- Content bounding box calculated around single entity
- 2000px margin applied (much larger than entity)
- Viewport bounds: entity center ±2000px in all directions
- User has comfortable exploration area around entity
- "Return to Content" zooms to ~400% to focus on single entity
- Bounds expand when additional entities added

**Handling**:
- Content bounds: single entity AABB (e.g., 100x100px)
- Applied margin: ±2000px
- Resulting viewport bounds: ~4000x4000px exploration area
- Prevents user from getting lost even with minimal content

### Edge Case 3: Content Changes During Pan Operation

**Scenario**: User is actively panning when another user (collaborative mode) or background process adds/removes entities.

**Expected Behavior**:
- Content bounds recalculated asynchronously
- Current pan operation completes with old bounds
- New bounds apply to subsequent pan operations
- If current pan position now outside new bounds:
  - No immediate clamping (jarring)
  - Gentle animation (2s) to move viewport into new bounds
  - Toast: "Content area changed. Adjusting viewport."
- Undo system preserves pre-adjustment state

**Handling**:
- Bounds recalculation doesn't interrupt active operations
- Flag set: boundsUpdatePending
- After current operation completes, check if viewport exceeds new bounds
- If yes, animate viewport to nearest valid position within new bounds
- Smooth user experience despite background changes

### Edge Case 4: Extreme Zoom Levels at Bounds

**Scenario**: User at 1000% zoom (maximum) attempts to pan beyond bounds.

**Expected Behavior**:
- Pan bounds enforced regardless of zoom level
- At high zoom, small pan in world coords = large pan in screen coords
- Clamping still applies correctly
- Visual feedback consistent across zoom levels
- User sees content edge clearly at high zoom when at bound

**Handling**:
- Bounds always calculated in world coordinates (zoom-independent)
- Clamping formula: clamp(pan, minPan, maxPan) [world coords]
- Screen-space feedback scales with zoom for consistency
- User understands bounds are absolute, not zoom-relative

### Edge Case 5: Bounds Smaller Than Viewport

**Scenario**: Very small content (100x100px) with default margin (2000px) at low zoom, viewport larger than bounded area.

**Expected Behavior**:
- Viewport can display entire bounded area at once
- Pan bounds still enforced (prevent centering content at arbitrary positions)
- "Return to Content" fits bounded area, not just content
- User can explore full bounded area but not beyond
- No visual indication of bounds since entire area visible

**Handling**:
- Bounds apply even when viewport encompasses entire area
- Prevents "floating" content (user panning content to edge of screen)
- Maintains consistent behavior across zoom levels
- At higher zoom, bounds become relevant as area exceeds viewport

## Error Scenarios

### Error 1: Corrupted Content Bounds Data

**Scenario**: Content bounds stored with NaN or Infinity values due to corrupted entity data.

**Error Message**: "Content bounds invalid. Resetting to default area."

**Recovery**:
1. Detect NaN/Infinity during bounds calculation
2. Identify corrupted entities (log IDs)
3. Exclude corrupted entities from bounds
4. If all entities corrupted, use default bounds (±5000px)
5. Toast notification with error message
6. Entity validation report offered
7. User can fix/delete corrupted entities
8. Bounds recalculate after fix

### Error 2: Viewport Pan State Becomes Invalid

**Scenario**: ViewportStore.pan contains NaN or Infinity after arithmetic operation error.

**Error Message**: "Viewport position invalid. Resetting to content center."

**Recovery**:
1. Detect invalid pan state before rendering
2. Calculate content center as fallback position
3. Reset pan to content center
4. Reset zoom to 1.0 if also invalid
5. Toast notification explains reset
6. Error logged with stack trace for debugging
7. User can manually navigate from reset position
8. Undo stack preserved (reset doesn't clear history)

### Error 3: Bounds Calculation Timeout

**Scenario**: Project with 100,000+ entities causes bounds calculation to exceed timeout (5s).

**Error Message**: "Content area calculation taking too long. Using approximate bounds."

**Recovery**:
1. Bounds calculation runs in Web Worker with 5s timeout
2. If timeout, worker terminated
3. Approximate bounds estimated from sample of entities (first 1000)
4. Warning flag set: boundsApproximate
5. Toast notification shows warning
6. Background task continues full calculation
7. When complete, bounds updated and viewport adjusted if needed
8. User experiences minimal disruption

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Home` | Return to Content (center and fit) | Canvas focused, any viewport position |
| `End` | Navigate to Last Added Entity | Canvas focused |
| `Ctrl+Home` | Reset to Origin (0, 0) at 100% zoom | Canvas focused |
| `Ctrl+B` | Toggle Bounds Visualization | Canvas focused (debug mode) |
| `Alt+Left` | Navigate to Previous Viewport Bookmark | Canvas focused |
| `Alt+Right` | Navigate to Next Viewport Bookmark | Canvas focused |

## Related Elements

### Components
- **CanvasViewport.tsx**: Main canvas managing viewport state and bounds enforcement
- **BoundsIndicator.tsx**: Visual overlay showing viewport bounds in debug mode
- **Minimap.tsx**: Displays content area and viewport bounds as rectangles
- **StatusBar.tsx**: Shows distance from content center, "Return to Content" button when far
- **ViewportDebugPanel.tsx**: Developer tool showing bounds values and constraint status

### Stores
- **ViewportStore**: Central viewport state management
  - `contentBounds`: Bounding box of all project content
  - `viewportBounds`: Allowed pan range (content + margin)
  - `pan`: Current pan offset, clamped to viewportBounds
  - `zoom`: Current zoom level, clamped to [0.05, 10.0]
  - `recalculateContentBounds()`: Updates bounds from entities
  - `setPan(newPan, clamp=true)`: Updates pan with optional bounds clamping
  - `setZoom(newZoom, clamp=true)`: Updates zoom with optional bounds clamping
  - `returnToContent()`: Animates viewport to content center
- **EntityStore**: Source of entity data for bounds calculation
  - Emits content-changed events triggering bounds update
  - `getAllEntities()`: Returns all entities for iteration
- **SettingsStore**: User preferences for bounds behavior
  - `panMargin`: Margin beyond content for pan bounds (default: 2000px)
  - `enableBoundsVisualFeedback`: Visual/audio feedback on bounds (default: true)
  - `enableBoundsClamping`: Enforce bounds vs warning only (default: true)
  - `defaultBoundsSize`: Bounds for empty canvas (default: ±5000px)

### Hooks
- **useContentBounds**: Hook providing current content bounds
  - Subscribes to bounds updates
  - Triggers recalculation on entity changes
  - Returns contentBounds and viewportBounds
- **useViewportConstraints**: Hook enforcing pan/zoom constraints
  - Wraps setPan/setZoom with clamping logic
  - Triggers feedback on bounds reached
  - Returns constrained setter functions
- **useBoundsFeedback**: Hook managing visual/audio bounds feedback
  - Triggers border flash effect
  - Plays sound effects (if enabled)
  - Shows toast notifications

### Services
- **BoundsCalculator.ts**: Pure functions for bounds calculations
  - `calculateEntityBounds(entity)`: Returns AABB for single entity
  - `calculateContentBounds(entities)`: Returns overall content bounds
  - `calculateViewportBounds(contentBounds, margin)`: Returns pan limits
  - `clampPan(pan, bounds)`: Clamps pan to bounds, returns clamped value
  - `clampZoom(zoom, min, max)`: Clamps zoom to range
- **ViewportAnimator.ts**: Handles return-to-content animation
  - `animateToViewport(target, duration, easing)`: Animates viewport transition
  - `calculateFitViewport(bounds, canvas)`: Calculates optimal fit viewport

### Commands
- **ViewportCommand**: Undo/redo for viewport operations (including return-to-content)
  - Stores previousState and newState
  - Animates transitions on execute/undo

## Visual Diagrams

### Content Bounds Calculation

```
Project Entities:
┌─────────────────────────────────────────┐
│                                         │
│    E1 (50, 100)                         │
│     ┌─────┐                             │
│     │  R  │                             │
│     └─────┘                             │
│                                         │
│           E2 (800, 600)                 │
│            ┌──────┐                     │
│            │  R   │                     │
│            └──────┘                     │
│                                         │
│                       E3 (4000, 3000)   │
│                        ┌────┐           │
│                        │ Eq │           │
│                        └────┘           │
│                                         │
└─────────────────────────────────────────┘

Content Bounding Box:
  minX = min(50, 800, 4000) = 50
  maxX = max(450, 1400, 4500) = 4500
  minY = min(100, 600, 3000) = 100
  maxY = max(400, 900, 3200) = 3200

┌─────────────────────────────────────────┐
│ (50, 100)                               │
│  ╔══════════════════════════════════╗  │
│  ║  Content Bounding Box            ║  │
│  ║  Width: 4450                     ║  │
│  ║  Height: 3100                    ║  │
│  ║                                  ║  │
│  ║        Center (2275, 1750)       ║  │
│  ║              ●                   ║  │
│  ║                                  ║  │
│  ╚══════════════════════════════════╝  │
│                              (4500, 3200)│
└─────────────────────────────────────────┘
```

### Viewport Bounds with Margin

```
Content Bounds:
  (50, 100) to (4500, 3200)

Apply 2000px Margin:
┌─────────────────────────────────────────────┐
│ (-1950, -1900)   2000px margin              │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃     ╔═══════════════════════╗       ┃   │
│  ┃     ║  Content Bounds       ║       ┃   │
│  ┃     ║  (50,100)-(4500,3200) ║       ┃   │
│  ┃     ║                       ║       ┃   │
│  ┃     ║        ●              ║       ┃   │
│  ┃     ║     center            ║       ┃   │
│  ┃     ╚═══════════════════════╝       ┃   │
│  ┃                                     ┃   │
│  ┃  Viewport Bounds                    ┃   │
│  ┃  minPan: (-1950, -1900)             ┃   │
│  ┃  maxPan: (6500, 5200)               ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                              (6500, 5200)   │
└─────────────────────────────────────────────┘

User can pan anywhere within dashed rectangle.
Attempts to pan beyond are clamped.
```

### Pan Clamping at Boundary

```
User Attempts to Pan Right Beyond Bound:

Current State:
  pan.x = 6400 (near right boundary)
  maxPanX = 6500

User Action: Drag right +200px
  Attempted: pan.x = 6600

Clamping:
  newPan.x = Math.min(6600, 6500) = 6500
             ↑                ↑
          attempted        clamped

Visual Result:
┌──────────────────────────────────┐
│  Viewport                    │▓▓▓│ <- Can't pan further
│                              │▓▓▓│    (boundary reached)
│    [Content visible]         │▓▓▓│
│                              │▓▓▓│
│                              │▓▓▓│
└──────────────────────────────────┘
        ↑                       ↑
    Pan moves             Stops at bound
    toward bound          (red flash)

Status Bar:
  "Pan boundary reached" (toast)
  Position: (6500, 2000) | Zoom: 100%
```

### Zoom Clamping at Limits

```
Zoom Out Attempt Beyond Minimum:

Current State:
  zoom = 0.08 (8%, near minimum)
  minZoom = 0.05 (5%)

User Action: Scroll to zoom out further
  Attempted: zoom = 0.03 (3%)

Clamping:
  newZoom = Math.max(0.03, 0.05) = 0.05
            ↑              ↑
         attempted      clamped

Status Bar Feedback:
┌──────────────────────────────────┐
│ Zoom: [05%] ← Flashes yellow     │
└──────────────────────────────────┘

Toast Notification:
  "Minimum zoom (5%) reached"

Zoom In Attempt Beyond Maximum:

Current State:
  zoom = 9.8 (980%, near maximum)
  maxZoom = 10.0 (1000%)

User Action: Ctrl++ to zoom in
  Attempted: zoom = 11.0 (1100%)

Clamping:
  newZoom = Math.min(11.0, 10.0) = 10.0

Toast Notification:
  "Maximum zoom (1000%) reached"
```

### Return to Content Animation

```
User Lost in Empty Space:

Initial Viewport:
┌─────────────────────────────────┐
│                                 │
│   Empty area                    │
│   (far from content)            │
│                                 │
│   Current position:             │
│   pan (8000, -3000)             │
│   zoom 0.3 (30%)                │
│                                 │
└─────────────────────────────────┘

User Presses Home Key:
  "Return to Content" triggered

Animation (500ms):
  Frame 0ms:  pan (8000, -3000), zoom 0.30
  Frame 100ms: pan (5200, -1600), zoom 0.31
  Frame 250ms: pan (2600, -800), zoom 0.315
  Frame 400ms: pan (200, -100), zoom 0.316
  Frame 500ms: pan (-500, 100), zoom 0.316

Final Viewport:
┌─────────────────────────────────┐
│  ╔═══════════════════════╗      │
│  ║                       ║      │
│  ║   Content Bounds      ║      │
│  ║   All content         ║      │
│  ║   visible with        ║      │
│  ║   padding             ║      │
│  ║                       ║      │
│  ╚═══════════════════════╝      │
│                                 │
└─────────────────────────────────┘
  pan (-500, 100), zoom 0.316

Status Bar:
  "Returned to content" (confirmation)
```

### Bounds Visualization (Debug Mode)

```
Ctrl+B to Toggle Bounds Visualization:

Canvas with Bounds Overlay:
┌─────────────────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ Red dashed line: Viewport Bounds ┃  │
│ ┃                                  ┃  │
│ ┃  ╔═══════════════════════╗       ┃  │
│ ┃  ║ Green solid: Content  ║       ┃  │
│ ┃  ║      Bounds           ║       ┃  │
│ ┃  ║                       ║       ┃  │
│ ┃  ║   [Project entities]  ║       ┃  │
│ ┃  ║                       ║       ┃  │
│ ┃  ╚═══════════════════════╝       ┃  │
│ ┃                                  ┃  │
│ ┃  Yellow highlight: 2000px margin ┃  │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
└─────────────────────────────────────────┘

Debug Info Panel:
  Content Bounds:
    Min: (50, 100)
    Max: (4500, 3200)
    Size: 4450 x 3100

  Viewport Bounds:
    Min Pan: (-1950, -1900)
    Max Pan: (6500, 5200)
    Margin: 2000px

  Current Viewport:
    Pan: (2000, 1500)
    Zoom: 1.0 (100%)
    Within Bounds: ✓
```

## Testing

### Unit Tests

**Test Suite**: BoundsCalculator

1. **Test: Calculate content bounds from entities**
   - Setup: Create 5 entities at various positions
   - Action: calculateContentBounds(entities)
   - Assert: Bounds encompass all entities
   - Assert: minX/minY are minimum entity positions
   - Assert: maxX/maxY are maximum entity positions

2. **Test: Apply margin to content bounds**
   - Setup: Content bounds (0, 0) to (1000, 800)
   - Action: calculateViewportBounds(contentBounds, 200)
   - Assert: Viewport bounds (-200, -200) to (1200, 1000)

3. **Test: Default bounds for empty canvas**
   - Setup: Zero entities
   - Action: calculateContentBounds([])
   - Assert: Returns default bounds (−5000, −5000) to (5000, 5000)

4. **Test: Clamp pan to bounds**
   - Setup: Bounds (-1000, -1000) to (3000, 2000)
   - Action: clampPan({x: 3500, y: 1500}, bounds)
   - Assert: Result {x: 3000, y: 1500} (x clamped, y unchanged)

5. **Test: Clamp zoom to range**
   - Action: clampZoom(15.0, 0.05, 10.0)
   - Assert: Result 10.0 (clamped to max)
   - Action: clampZoom(0.01, 0.05, 10.0)
   - Assert: Result 0.05 (clamped to min)

### Integration Tests

**Test Suite**: Viewport Bounds Enforcement

1. **Test: Pan clamped to bounds during drag**
   - Setup: Viewport near right boundary
   - Action: User drags right 500px (would exceed bound)
   - Assert: Pan clamped to maxPanX
   - Assert: Visual feedback triggered (red flash)
   - Assert: Toast notification shown

2. **Test: Zoom clamped to minimum**
   - Setup: Viewport at zoom 0.06
   - Action: User scrolls to zoom out (attempted 0.03)
   - Assert: Zoom clamped to 0.05
   - Assert: Status bar shows 5%
   - Assert: Toast: "Minimum zoom (5%) reached"

3. **Test: Bounds update when entity added**
   - Setup: Project with entities, bounds calculated
   - Action: Add entity far outside current bounds
   - Assert: Content bounds recalculated
   - Assert: Viewport bounds expanded to include new entity
   - Assert: boundsVersion incremented

4. **Test: Return to Content animation**
   - Setup: Viewport at pan (8000, -3000), zoom 0.3
   - Action: Press Home key
   - Assert: Animation starts immediately
   - Assert: Viewport animates to content center over 500ms
   - Assert: Final viewport fits all content
   - Assert: Undo command created

5. **Test: Bounds feedback disabled via preference**
   - Setup: Set enableBoundsVisualFeedback = false
   - Action: Pan beyond bounds
   - Assert: Pan clamped correctly
   - Assert: No visual flash, no sound, no toast
   - Assert: Silent clamping

### End-to-End Tests

**Test Suite**: User Bounds Interaction

1. **Test: User pans to boundary and receives feedback**
   - Setup: Open project with content
   - Action: User drags canvas toward edge repeatedly
   - Assert: Viewport pans smoothly until boundary
   - Assert: At boundary, red border flash visible
   - Assert: Pan stops despite continued drag
   - Assert: Toast notification appears

2. **Test: User attempts to zoom beyond limits**
   - Setup: Project open at normal zoom
   - Action: User scrolls mouse wheel to zoom in excessively
   - Assert: Zoom increases to 1000%
   - Assert: Further scroll attempts have no effect
   - Assert: Status bar shows "1000%" (not higher)
   - Assert: Toast: "Maximum zoom (1000%) reached"

3. **Test: User gets lost and returns to content**
   - Setup: User pans far from content (near boundary)
   - Action: User presses Home key
   - Assert: Smooth animation back to content
   - Assert: Animation takes ~500ms
   - Assert: Content centered and visible with padding
   - Assert: Status bar confirms "Returned to content"

4. **Test: User works with empty canvas**
   - Setup: Create new project (no entities)
   - Action: User pans around empty canvas
   - Assert: Pan clamped to default bounds (±5000px)
   - Action: User presses Home
   - Assert: Viewport centers on origin (0, 0) at 100% zoom

5. **Test: Collaborative bounds update**
   - Setup: Two users viewing same project
   - User A adds large entity outside current bounds
   - Assert: User B sees bounds update notification
   - Assert: User B's viewport adjusted if outside new bounds
   - Assert: Smooth adjustment animation (not jarring)

## Common Pitfalls

### Pitfall 1: Not Accounting for Zoom in Pan Bounds

**Problem**: Pan bounds calculated in screen coordinates instead of world coordinates.

**Symptom**: At high zoom, user can pan much further than intended. At low zoom, bounds feel too restrictive.

**Solution**: Always calculate bounds in world coordinates:
- Bounds independent of current zoom level
- Pan offset represents world-space translation
- Clamping formula uses world coords: clamp(pan, minPan, maxPan)

### Pitfall 2: Immediate Viewport Snap on Bounds Update

**Problem**: When bounds change (entity added/removed), viewport immediately snaps to new bounds if currently outside.

**Symptom**: Jarring, disorienting viewport jump without user action.

**Solution**: Smoothly animate viewport into new bounds over 2 seconds:
- Detect if current viewport outside new bounds
- Calculate nearest valid position within new bounds
- Animate viewport to valid position with ease-in-out
- Show toast explaining adjustment

### Pitfall 3: Forgetting to Recalculate Bounds on Entity Changes

**Problem**: Bounds calculated once on project load, never updated when entities added/removed.

**Symptom**: Bounds too restrictive (new entities clipped) or too permissive (deleted entities still considered).

**Solution**: Subscribe to EntityStore content-changed events:
- Trigger recalculateContentBounds() on entity add/remove/modify
- Debounce calculation (wait 500ms after last change)
- Update viewportBounds based on new contentBounds
- Emit bounds-updated event for UI components

### Pitfall 4: No Visual Feedback at Bounds

**Problem**: Bounds enforced silently, user confused why panning stops.

**Symptom**: User repeatedly attempts to pan, doesn't understand limit.

**Solution**: Provide multi-modal feedback:
- Visual: Red border flash (200ms) on canvas edge
- Audio: Subtle "thud" sound effect (if enabled)
- Haptic: Vibration on mobile/trackpad (if supported)
- Toast: "Pan boundary reached" (after 3 consecutive attempts)
- Cursor changes to "not-allowed" icon briefly

### Pitfall 5: Bounds Prevent Seeing Entity at Edge

**Problem**: Margin too small, entity at content edge clipped by viewport bounds.

**Symptom**: User can't center entity near edge, always partially off-screen.

**Solution**: Ensure adequate margin (2000px default):
- Margin should be > max(canvasWidth, canvasHeight) / 2
- This guarantees any entity can be centered in viewport
- Configurable margin in settings for user preference
- Minimum margin enforced (500px) to prevent edge clipping

## Performance Tips

### Tip 1: Cache Content Bounds Between Entity Changes

Recalculating bounds from 1000+ entities every frame is expensive:

**Implementation**: Store calculated bounds with version number. Increment version only when entities change. Check version before recalculating.

**Benefit**: Reduces bounds calculation from every frame (16ms) to only on entity changes (rare), freeing CPU for rendering.

### Tip 2: Use Spatial Index for Bounds Calculation

Iterating all entities for bounds is O(n):

**Implementation**: Maintain R-tree or quadtree spatial index in EntityStore. Query index for overall bounds in O(log n).

**Benefit**: For 10,000+ entity projects, reduces bounds calculation from 50ms to <1ms.

### Tip 3: Debounce Bounds Recalculation During Bulk Operations

Adding 100 entities triggers 100 bounds recalculations:

**Implementation**: Debounce recalculateContentBounds() to 500ms after last entity change. During bulk import, calculate once at end.

**Benefit**: Eliminates redundant calculations during rapid changes, improves bulk import performance by 10x.

### Tip 4: Lazy Viewport Bounds Calculation

Don't recalculate viewport bounds until actually needed for clamping:

**Implementation**: Mark viewportBounds as "dirty" when contentBounds change. Recalculate only when setPan() or setZoom() called. Most bounds changes don't affect viewport immediately.

**Benefit**: Reduces unnecessary calculations when user not actively panning/zooming.

### Tip 5: Optimize Bounds Feedback Rendering

Rendering border flash every frame during animation is expensive:

**Implementation**: Render feedback to separate canvas layer or use CSS overlay. Composite feedback layer over main canvas without re-rendering main content.

**Benefit**: Feedback rendering cost <1ms vs 10ms if mixed with main rendering.

## Future Enhancements

### Enhancement 1: Adaptive Margin Based on Zoom Level

**Description**: Adjust pan margin dynamically based on current zoom level - larger margin at low zoom, smaller at high zoom.

**User Value**: Provides more exploration space when zoomed out, tighter constraints when zoomed in for precision.

**Implementation**:
- Margin = baseMargin / sqrt(zoom)
- At zoom 0.1: margin = 2000 / 0.316 = 6325px
- At zoom 10.0: margin = 2000 / 3.162 = 632px
- Smooth transition as zoom changes

### Enhancement 2: Soft Bounds with Resistance

**Description**: Allow panning slightly beyond bounds with increasing resistance (rubber-band effect).

**User Value**: Provides tactile feedback of boundary without hard stop, more natural feel.

**Implementation**:
- Calculate pan delta normally
- If would exceed bounds, apply resistance factor
- delta *= 1.0 / (1.0 + overshoot * 0.01)
- Visual: Canvas content "stretches" slightly
- On release, smoothly bounce back to bound

### Enhancement 3: Bounds Presets for Different Workflows

**Description**: Predefined bounds configurations for different use cases (tight, normal, expansive, unlimited).

**User Value**: Power users can customize bounds behavior to their workflow preferences.

**Implementation**:
- Tight: 500px margin, [0.1, 4.0] zoom range
- Normal: 2000px margin, [0.05, 10.0] zoom range (default)
- Expansive: 5000px margin, [0.01, 20.0] zoom range
- Unlimited: No bounds (expert mode)
- Saved per-project or per-user

### Enhancement 4: Content-Aware Asymmetric Bounds

**Description**: Apply different margins in different directions based on content distribution.

**User Value**: Optimizes exploration area for non-centered content layouts.

**Implementation**:
- Calculate content density in each direction
- Apply larger margin toward sparse areas
- Smaller margin toward dense areas
- Example: Floor plan with expansion room on right gets larger right margin

### Enhancement 5: Animated Bounds Indicator

**Description**: Subtle pulsing outline showing content bounds and margins in canvas.

**User Value**: Helps users visualize boundaries without cluttering view.

**Implementation**:
- Faint dashed line at content bounds (green, 50% opacity)
- Faint dashed line at viewport bounds (red, 30% opacity)
- Gentle pulse animation (1-second cycle)
- Toggle with Ctrl+B
- Auto-hide after 5 seconds of no boundary interaction

### Enhancement 6: Bounds History and Waypoints

**Description**: Track historical bounds as content evolves, create waypoints for easy navigation.

**User Value**: Allows reviewing design evolution, navigating to past content areas.

**Implementation**:
- Store bounds snapshot on major content changes
- Timeline slider shows bounds evolution
- Click waypoint to animate to that bounds state
- Useful for time-lapse visualization

### Enhancement 7: Multi-Content Region Bounds

**Description**: Support multiple disconnected content regions with separate bounds areas.

**User Value**: Projects with multiple separate zones (different floors, buildings) each have appropriate bounds.

**Implementation**:
- Detect disconnected content clusters (gap > threshold)
- Calculate bounds for each cluster
- Union of cluster bounds = overall viewport bounds
- "Jump Between Regions" command navigates clusters

### Enhancement 8: Bounds-Based Auto-Zoom

**Description**: Automatically adjust zoom level as user approaches bounds to reveal more content.

**User Value**: Prevents "hitting wall" feeling, smoothly shows broader context.

**Implementation**:
- As pan approaches boundary (within 500px), gradually zoom out
- Zoom out factor proportional to distance from bound
- At boundary, zoomed to show content + significant margin
- User can override by manually zooming back in

### Enhancement 9: Collaborative Bounds Negotiation

**Description**: In multi-user sessions, negotiate shared bounds that accommodate all users' viewports.

**User Value**: Prevents user A's edits from disrupting user B's viewport bounds.

**Implementation**:
- Each user's viewport contributes to global bounds calculation
- Global bounds = union of content bounds + all active viewports
- Bounds updates coordinated to avoid disrupting any user
- Users notified before bounds changed by others

### Enhancement 10: Exportable Bounds Configurations

**Description**: Save and share bounds configurations as presets for different project types.

**User Value**: Teams can standardize bounds behavior across projects.

**Implementation**:
- Export bounds config as JSON
- Import config applies margin, zoom limits, feedback preferences
- Community library of bounds presets (CAD-like, Illustration-like, etc.)
- Per-project or per-user application
