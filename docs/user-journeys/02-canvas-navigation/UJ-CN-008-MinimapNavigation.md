# UJ-CN-008: Minimap Navigation

## Overview

This user journey describes how users navigate the canvas using the minimap thumbnail view. The minimap provides a bird's-eye view of the entire project with a viewport rectangle indicator, allowing quick navigation to distant areas and spatial awareness of the overall design layout.

## PRD References

- **FR-CN-008**: Minimap thumbnail view with interactive navigation
- **FR-CN-009**: Real-time minimap updates reflecting canvas changes
- **US-CN-008**: As a user, I want a minimap showing my entire project so that I can quickly navigate to different areas
- **AC-CN-008-01**: Minimap displays entire project content in thumbnail (200x150px default size)
- **AC-CN-008-02**: Viewport rectangle overlays minimap showing current visible area
- **AC-CN-008-03**: Clicking minimap jumps viewport to clicked location (animated)
- **AC-CN-008-04**: Dragging viewport rectangle in minimap pans canvas in real-time
- **AC-CN-008-05**: Minimap updates automatically when entities added/removed/moved
- **AC-CN-008-06**: Minimap can be collapsed, resized, and repositioned

## Prerequisites

- User has Canvas page open with active project
- Project contains entities (minimap shows empty state if zero entities)
- Minimap panel visible in UI (bottom-right corner by default)
- Understanding of basic canvas navigation concepts

## User Journey Steps

### Step 1: View Minimap Overview

**User Actions**:
1. User opens project with existing entities
2. User locates minimap panel (bottom-right corner of canvas)
3. User observes minimap thumbnail showing entire project
4. User identifies viewport rectangle indicating current view
5. User notices minimap updates as they pan/zoom main canvas

**System Response**:
- Minimap panel rendered in bottom-right corner (default position)
- Entire project content rendered to thumbnail (200x150px)
- Content scaled to fit minimap dimensions with 10% padding
- Viewport rectangle overlaid in blue (semi-transparent, 30% opacity)
- Entity colors preserved but simplified (no labels, reduced detail)
- Background color matches canvas background (white or dark mode)
- Minimap border indicates focus state (subtle highlight)

**Validation**:
- All project entities visible in minimap bounds
- Viewport rectangle accurately represents current canvas view
- Minimap aspect ratio matches canvas aspect ratio
- Minimap render performance <16ms for 60fps updates

**Data**:

```
Project Content:
- Entities: 47
- Content bounds: (50, 100) to (4500, 3200)
- Content dimensions: 4450 x 3100

Minimap Configuration:
- Size: 200 x 150px (width x height)
- Position: bottom-right corner
- Offset: 20px from edges
- Padding: 10% of content dimensions
- Background: #FFFFFF

Minimap Scale Calculation:
- Content padded: 4895 x 3410 (4450*1.1, 3100*1.1)
- Available space: 200 x 150
- Horizontal scale: 200 / 4895 = 0.0409
- Vertical scale: 150 / 3410 = 0.0440
- Selected scale: min(0.0409, 0.0440) = 0.0409 (4.09%)
- Final minimap content: 182 x 127px (centered in 200x150)

Current Viewport:
- Canvas: 1920 x 1080px
- Zoom: 1.0 (100%)
- Pan: { x: -200, y: -100 }
- Visible bounds in world: (200, 100) to (2120, 1180)

Viewport Rectangle in Minimap:
- World bounds scaled to minimap: (8.2, 4.1) to (86.7, 48.3)
- Rectangle dimensions: 78.5 x 44.2px
- Position in minimap: (8, 4) top-left
- Color: rgba(0, 120, 255, 0.3) (blue, 30% opacity)
- Border: 2px solid rgba(0, 120, 255, 0.8)
```

**Substeps**:
1. Minimap component mounts in UI
2. Subscribe to ViewportStore and EntityStore
3. Retrieve content bounds from ViewportStore
4. Calculate minimap scale from content and minimap dimensions
5. Render entities to offscreen canvas at minimap scale
6. Composite thumbnail to minimap panel
7. Calculate viewport rectangle position/size
8. Overlay viewport rectangle on minimap
9. Register mouse event listeners on minimap

### Step 2: Click Minimap to Navigate

**User Actions**:
1. User identifies area of interest in minimap (cluster of entities)
2. User clicks on that area in minimap
3. Observes smooth animation of main canvas to clicked location
4. Viewport rectangle in minimap animates to clicked position
5. Main canvas now centered on clicked area

**System Response**:
- Detect click event on minimap panel
- Calculate click position in minimap coordinates (0-200, 0-150)
- Transform minimap coords to world coords using scale factor
- Calculate target pan offset to center clicked world point in canvas
- Validate target pan is within viewport bounds
- Animate main viewport from current to target position
- Animation duration: 300ms
- Easing: ease-in-out cubic
- Viewport rectangle in minimap follows main canvas animation
- Update cursor to pointer on minimap hover

**Validation**:
- Click position accurately maps to world coordinates
- Target viewport shows clicked area centered
- Animation smooth and complete
- Viewport rectangle in minimap matches main canvas view
- Undo command created for navigation

**Data**:

```
Click Event:
- Minimap position: (120, 80) in minimap pixel coords
- Minimap dimensions: 200 x 150px
- Click within bounds: ✓

World Coordinate Calculation:
- Minimap scale: 0.0409 (4.09%)
- Content offset in minimap: (9, 11) [centering padding]
- Adjusted click: (111, 69) [relative to content]
- World coords: (111 / 0.0409, 69 / 0.0409) = (2713, 1687)

Target Viewport Calculation:
- Canvas dimensions: 1920 x 1080px
- Current zoom: 1.0
- Clicked world point: (2713, 1687)
- Target: Center (2713, 1687) in viewport
- Target pan calculation:
  - panX = -(worldX - canvasWidth / 2) = -(2713 - 960) = -1753
  - panY = -(worldY - canvasHeight / 2) = -(1687 - 540) = -1147
- Target pan: { x: -1753, y: -1147 }

Bounds Validation:
- minPan: { x: -1950, y: -1900 }
- maxPan: { x: 6500, y: 5200 }
- Target within bounds: ✓

Animation:
- Start pan: { x: -200, y: -100 }
- End pan: { x: -1753, y: -1147 }
- Duration: 300ms
- Easing: cubic ease-in-out
- Frames: ~18 at 60fps

Undo Command:
- type: ViewportCommand
- commandName: "Navigate via Minimap"
- previousPan: { x: -200, y: -100 }
- newPan: { x: -1753, y: -1147 }
```

**Substeps**:
1. User clicks on minimap
2. Click event handler receives mouse event
3. Extract click position (event.offsetX, event.offsetY)
4. Adjust for minimap content offset (centering padding)
5. Scale minimap coords to world coords: world = minimap / scale
6. Calculate target pan to center world point
7. Validate target pan within bounds
8. Capture current viewport for undo
9. Start animation to target viewport
10. Update viewport each frame
11. Animate viewport rectangle in minimap
12. Finalize viewport at target
13. Create ViewportCommand for undo

### Step 3: Drag Viewport Rectangle to Pan

**User Actions**:
1. User hovers over viewport rectangle in minimap
2. Cursor changes to grab/hand icon
3. User clicks and holds on viewport rectangle
4. User drags rectangle to new position in minimap
5. Observes main canvas panning in real-time during drag
6. Releases mouse to finalize pan position
7. Viewport rectangle settles at new position

**System Response**:
- Detect mouse hover over viewport rectangle (hit test)
- Change cursor to grab icon (cursor: grab)
- On mousedown, change cursor to grabbing (cursor: grabbing)
- Track mouse position during drag (mousemove events)
- Calculate rectangle position delta each frame
- Transform minimap delta to world delta using scale
- Update main viewport pan in real-time (no animation)
- Viewport rectangle follows mouse position exactly
- Clamp rectangle position to minimap content bounds
- On mouseup, finalize pan and create undo command

**Validation**:
- Viewport rectangle drag feels responsive (updates every frame)
- Main canvas pans smoothly without lag
- Rectangle cannot be dragged outside minimap content area
- Releasing mouse stops drag immediately
- Single undo command created for entire drag sequence

**Data**:

```
Drag Sequence:

Initial State:
- Viewport rectangle position: (8, 4) in minimap
- Viewport rectangle size: 78.5 x 44.2px
- Main canvas pan: { x: -200, y: -100 }

Mousedown Event:
- Position: (50, 25) in minimap
- Within rectangle: ✓
- Start drag mode
- Capture initial mouse position
- Cursor: grabbing

Mousemove Events (drag in progress):
Frame 1 (16ms):
  - Mouse position: (55, 28)
  - Delta: (5, 3) in minimap coords
  - World delta: (5 / 0.0409, 3 / 0.0409) = (122, 73)
  - New pan: { x: -200 + 122, y: -100 + 73 } = { x: -78, y: -27 }
  - Update main canvas immediately
  - Move viewport rectangle to (13, 7)

Frame 2 (32ms):
  - Mouse position: (62, 33)
  - Delta: (7, 5) from frame 1
  - World delta: (171, 122)
  - New pan: { x: 93, y: 95 }
  - Update main canvas
  - Move rectangle to (20, 12)

... (continues for duration of drag)

Mouseup Event:
- Final mouse position: (120, 80)
- Total drag delta: (70, 55) in minimap
- Total world delta: (1711, 1344)
- Final pan: { x: -200 + 1711, y: -100 + 1344 } = { x: 1511, y: 1244 }
- End drag mode
- Cursor: grab (hover) or default (if moved away)

Undo Command:
- type: PanCommand
- commandName: "Pan via Minimap Drag"
- previousPan: { x: -200, y: -100 }
- newPan: { x: 1511, y: 1244 }
- duration: 350ms (drag duration)
```

**Substeps**:
1. User hovers over viewport rectangle
2. Hit test determines mouse within rectangle bounds
3. Cursor changes to grab icon
4. User presses mouse button (mousedown)
5. Cursor changes to grabbing icon
6. Drag state initialized, capture initial mouse and pan
7. User moves mouse (mousemove events)
8. On each mousemove:
   - Calculate delta from last position
   - Scale delta to world coordinates
   - Update main canvas pan (no animation, immediate)
   - Update viewport rectangle position in minimap
   - Clamp rectangle to minimap bounds
9. User releases mouse (mouseup)
10. Drag state finalized
11. Create PanCommand for undo
12. Cursor returns to grab (if still hovering) or default

### Step 4: Observe Real-Time Minimap Updates

**User Actions**:
1. User adds new entity to canvas via toolbar
2. User moves existing entity by dragging
3. User deletes entity via Delete key
4. User zooms or pans main canvas
5. Observes minimap updating automatically for all changes
6. Viewport rectangle adjusts size/position as viewport changes

**System Response**:
- Subscribe to EntityStore change events
- On entity add/remove/modify:
  - Recalculate content bounds
  - Recalculate minimap scale if bounds changed
  - Re-render minimap thumbnail (debounced to 100ms)
- Subscribe to ViewportStore viewport changes
- On viewport pan/zoom:
  - Recalculate viewport rectangle position/size
  - Update rectangle immediately (no debounce)
  - Smooth rectangle animation if zoom changed
- Maintain 60fps minimap updates during active operations
- Throttle full minimap re-render to 10fps during rapid changes

**Validation**:
- Minimap reflects current project state within 100ms
- Viewport rectangle updates every frame during pan/zoom
- No visual lag or stuttering in minimap
- Performance impact <5ms per update

**Data**:

```
Entity Addition:
Event: New room entity added at (5000, 3500)
- Previous content bounds: (50, 100) to (4500, 3200)
- New content bounds: (50, 100) to (5000, 3500)
- Bounds changed: ✓
- Trigger minimap scale recalculation
- New scale: 0.0378 (was 0.0409)
- Debounced re-render scheduled (100ms delay)
- Re-render executes: Full minimap thumbnail updated

Viewport Pan:
Event: User drags canvas right 200px
- Pan changed: { x: -200, y: -100 } → { x: 0, y: -100 }
- Viewport rectangle update:
  - Previous position: (8, 4)
  - New position: (16, 4)
  - Update immediate (no debounce)
- Minimap thumbnail unchanged (content same)

Viewport Zoom:
Event: User zooms to 150%
- Zoom changed: 1.0 → 1.5
- Viewport rectangle update:
  - Previous size: 78.5 x 44.2px
  - New size: (1920/1.5*0.0409) x (1080/1.5*0.0409)
           = 52.3 x 29.4px
  - Size animation: 78.5→52.3 over 100ms
  - Position adjusted to maintain center
- Minimap thumbnail unchanged

Update Performance:
- Entity change: 100ms debounce → 15ms render time
- Viewport change: 0ms debounce → 1ms update time
- Total impact: <5ms per frame during active editing
```

**Substeps**:
1. EntityStore emits entity-changed event
2. Minimap component receives event notification
3. Check if content bounds changed:
   - If yes: Recalculate scale, schedule full re-render (debounced 100ms)
   - If no: Re-render only changed entity (optimized)
4. ViewportStore emits viewport-changed event
5. Minimap component receives viewport notification
6. Recalculate viewport rectangle position and size
7. Update rectangle immediately (requestAnimationFrame)
8. If zoom changed, animate rectangle size transition
9. Composite updated rectangle over existing thumbnail

### Step 5: Customize Minimap Display

**User Actions**:
1. User right-clicks on minimap panel
2. Context menu appears with customization options:
   - Resize minimap (Small, Medium, Large)
   - Reposition minimap (corners: TL, TR, BL, BR)
   - Toggle minimap visibility (Show/Hide)
   - Lock minimap position (prevent accidental drag)
3. User selects "Large" size option
4. Minimap expands to 300x225px
5. User selects "Top-Right" position option
6. Minimap moves to top-right corner with animation

**System Response**:
- Display context menu on right-click
- Apply selected size:
  - Small: 150x112px
  - Medium: 200x150px (default)
  - Large: 300x225px
  - Custom: User-specified dimensions
- Animate resize over 200ms (smooth scale transition)
- Recalculate minimap scale for new dimensions
- Re-render thumbnail at new size
- Apply selected position:
  - Animate movement to new corner over 300ms
  - Update position preference in SettingsStore
- Toggle visibility:
  - Fade out minimap over 200ms
  - Set display: none after fade
  - Show/hide minimap button in toolbar

**Validation**:
- Resize maintains aspect ratio and content fit
- Repositioning doesn't overlap critical UI elements
- Preferences persist across sessions
- Visibility toggle accessible via keyboard shortcut

**Data**:

```
Resize Operation:
- Previous size: 200 x 150px
- Selected size: Large (300 x 225px)
- Scale factor: 1.5x

Animation:
- Duration: 200ms
- Easing: ease-in-out
- Frames: ~12 at 60fps
- Frame 0ms: 200x150
- Frame 100ms: 250x187.5
- Frame 200ms: 300x225

Scale Recalculation:
- Content padded: 4895 x 3410
- New available space: 300 x 225
- New scale: min(300/4895, 225/3410) = min(0.0613, 0.0660) = 0.0613
- Thumbnail content: 273 x 190px (centered in 300x225)

Reposition Operation:
- Previous position: bottom-right (BR)
- Selected position: top-right (TR)
- Previous coordinates: (canvasWidth - 220, canvasHeight - 170)
                      = (1700, 910) for 1920x1080 canvas
- New coordinates: (canvasWidth - 320, 20) = (1600, 20)

Animation:
- Duration: 300ms
- Path: (1700, 910) → (1600, 20)
- Easing: ease-in-out cubic

Preference Storage:
- minimapSize: "large"
- minimapPosition: "top-right"
- minimapVisible: true
- minimapLocked: false
- Saved to SettingsStore
- Persisted to localStorage
```

**Substeps**:
1. User right-clicks minimap
2. Context menu component renders
3. User selects size option
4. MinimapStore.setSize(size) called
5. Animate minimap dimensions to new size
6. Recalculate scale and re-render thumbnail
7. User selects position option
8. MinimapStore.setPosition(position) called
9. Calculate new coordinates for selected corner
10. Animate minimap panel to new position
11. Update SettingsStore with preferences
12. Persist preferences to localStorage

## Edge Cases

### Edge Case 1: Empty Canvas Minimap

**Scenario**: User opens new project or deletes all entities, minimap shows no content.

**Expected Behavior**:
- Minimap displays empty state placeholder
- Shows centered icon (magnifying glass or canvas icon)
- Text: "No content to display"
- Viewport rectangle hidden (no meaningful reference)
- Minimap still interactive (clicking centers viewport on origin)
- Default bounds visualized (faint grid or outline)

**Handling**:
- Check entity count in minimap render
- If zero: render empty state UI instead of entity thumbnail
- Viewport rectangle opacity set to 0%
- Click handler still functional (centers on origin)
- Minimap background shows subtle grid pattern

### Edge Case 2: Viewport Larger Than Content

**Scenario**: Small project (500x400px) viewed at low zoom on large canvas (1920x1080).

**Expected Behavior**:
- Minimap shows entire content area with substantial padding
- Viewport rectangle larger than content area in minimap
- Rectangle encompasses entire content and beyond
- Panning has limited effect (content always visible)
- Minimap still provides spatial reference

**Handling**:
- Calculate viewport rectangle normally
- If rectangle larger than content bounds in minimap:
  - Render rectangle with distinct style (dashed border)
  - Indicate "full view" state in tooltip
- Dragging rectangle still functional but limited range
- Clicking outside content area pans to that empty space

### Edge Case 3: Extreme Zoom Levels

**Scenario**: User zooms to 1000% (maximum), viewport shows tiny portion of single entity.

**Expected Behavior**:
- Minimap still shows entire project
- Viewport rectangle extremely small (few pixels)
- Minimum rectangle size enforced (8x8px) for visibility
- Rectangle color intensifies for visibility (brighter blue)
- Tooltip shows exact zoom percentage when hovering rectangle

**Handling**:
- Calculate viewport rectangle size normally
- If either dimension < 8px:
  - Clamp to minimum 8px
  - Render as circle instead of rectangle (indicates "point view")
  - Border thickness increased (3px vs 2px)
- Rectangle remains interactive despite small size

### Edge Case 4: Minimap During Active Entity Drag

**Scenario**: User drags entity in main canvas, entity moves across minimap view.

**Expected Behavior**:
- Minimap updates in real-time during drag
- Dragged entity visible in minimap, position updates each frame
- Slight transparency on dragged entity (60% opacity) for feedback
- Drop finalizes, minimap fully updates
- No performance degradation during drag

**Handling**:
- Subscribe to entity drag events
- During drag, update only dragged entity in minimap (not full re-render)
- Render dragged entity to separate layer, composite over thumbnail
- On drag end, trigger full minimap re-render (debounced 100ms)
- Optimized render path for interactive operations

### Edge Case 5: Rapid Content Changes (Bulk Import)

**Scenario**: User imports 500 entities via CSV, entities added rapidly in sequence.

**Expected Behavior**:
- Minimap updates deferred until import completes
- Progress indicator on minimap during import
- Text: "Updating minimap... (347/500 entities)"
- Full minimap re-render after all entities added
- Content bounds recalculated once at end
- Smooth transition to final minimap state

**Handling**:
- Detect bulk import operation (rapid entity additions)
- Suppress intermediate minimap updates
- Show import progress overlay on minimap
- After last entity added, trigger single full re-render
- Prevents 500 expensive re-render operations
- User sees smooth final result instead of flickering updates

## Error Scenarios

### Error 1: Minimap Render Timeout

**Scenario**: Project with 50,000 entities causes minimap render to exceed 5-second timeout.

**Error Message**: "Minimap rendering taking too long. Switching to simplified view."

**Recovery**:
1. Minimap render runs in background with 5s timeout
2. If timeout, terminate render operation
3. Switch to simplified minimap mode:
   - Render only content bounds outline (no entities)
   - Viewport rectangle still functional
   - Text: "Simplified view (large project)"
4. User can manually enable full render in settings
5. Warning notification shown
6. Full render attempted again after content changes settle

### Error 2: Invalid Viewport Rectangle Calculation

**Scenario**: Minimap scale calculation produces NaN or Infinity, viewport rectangle cannot render.

**Error Message**: "Minimap display error. Resetting view."

**Recovery**:
1. Detect NaN/Infinity in rectangle position/size calculation
2. Log error with diagnostic data (content bounds, viewport state, minimap size)
3. Reset minimap to default state:
   - Recalculate content bounds from scratch
   - Use default minimap size (200x150)
   - Render with fallback scale (0.05)
4. Toast notification explains reset
5. User can continue using minimap normally
6. Error report offered for debugging

### Error 3: Minimap Click Outside Bounds

**Scenario**: User clicks minimap at position that maps to world coordinates outside viewport bounds.

**Error Message**: "Cannot navigate outside project bounds."

**Recovery**:
1. Click handler calculates world coordinates
2. Detects target outside viewport bounds
3. Calculate nearest valid position within bounds
4. Animate to nearest valid position instead
5. Toast notification: "Adjusted navigation to stay within project bounds"
6. Viewport rectangle in minimap shows final position
7. User understands bounds constraint visually

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `M` | Toggle Minimap Visibility | Canvas focused |
| `Shift+M` | Toggle Minimap Size (cycle S/M/L) | Canvas focused |
| `Ctrl+M` | Focus Minimap (for keyboard navigation) | Canvas focused |
| `Arrow Keys` | Navigate viewport via minimap (when minimap focused) | Minimap focused |
| `Enter` | Center viewport on minimap center | Minimap focused |
| `Esc` | Unfocus minimap, return to canvas | Minimap focused |

## Related Elements

### Components
- **Minimap.tsx**: Main minimap panel component
  - Renders thumbnail of entire project
  - Overlays viewport rectangle
  - Handles click and drag interactions
  - Manages resize and repositioning
- **MinimapCanvas.tsx**: Offscreen canvas for minimap rendering
  - Renders entities at minimap scale
  - Optimized rendering pipeline
  - Caches thumbnail between updates
- **MinimapControls.tsx**: Context menu and customization UI
  - Size selection (S/M/L/Custom)
  - Position selection (corners)
  - Visibility toggle
  - Lock position option
- **ViewportRectangle.tsx**: Draggable viewport indicator overlay
  - Renders semi-transparent rectangle
  - Handles drag interactions
  - Animates size changes on zoom
  - Shows tooltip with viewport info

### Stores
- **MinimapStore**: State management for minimap configuration
  - `size`: Minimap dimensions { width, height }
  - `position`: Corner placement (TL/TR/BL/BR)
  - `visible`: Visibility state (boolean)
  - `locked`: Lock position (prevent drag)
  - `scale`: Current minimap scale factor
  - `thumbnail`: Cached minimap image data
  - `setSize(size)`: Update minimap dimensions
  - `setPosition(position)`: Update minimap placement
  - `toggleVisibility()`: Show/hide minimap
  - `updateThumbnail()`: Trigger minimap re-render
- **ViewportStore**: Provides viewport state for rectangle calculation
  - Emits viewport-changed events
  - Provides current pan and zoom
- **EntityStore**: Source of entity data for minimap rendering
  - Emits entity-changed events
  - Provides entity list for thumbnail render

### Hooks
- **useMinimapScale**: Calculates minimap scale from content bounds and minimap size
  - Returns scale factor for coordinate transforms
  - Recalculates on content or size changes
  - Memoized for performance
- **useMinimapRender**: Manages minimap thumbnail rendering
  - Debounces render calls (100ms)
  - Renders to offscreen canvas
  - Caches result between updates
  - Returns thumbnail image data
- **useViewportRectangle**: Calculates viewport rectangle position/size in minimap
  - Transforms viewport bounds to minimap coordinates
  - Handles zoom-based size changes
  - Returns rectangle geometry
- **useMinimapInteraction**: Handles click and drag events
  - Transforms minimap coords to world coords
  - Triggers viewport navigation
  - Manages drag state
  - Returns interaction handlers

### Services
- **MinimapRenderer.ts**: Entity rendering for minimap thumbnail
  - `renderEntity(entity, ctx, scale)`: Draws single entity at minimap scale
  - `renderThumbnail(entities, size)`: Renders full minimap thumbnail
  - `optimizeForScale(entity, scale)`: Simplifies entity for small scale
  - Handles entity colors, shapes, connections
  - Skips labels and fine details at minimap scale
- **CoordinateTransform.ts**: Coordinate system conversions
  - `minimapToWorld(point, scale, offset)`: Minimap coords → world coords
  - `worldToMinimap(point, scale, offset)`: World coords → minimap coords
  - `viewportToMinimapRect(viewport, scale)`: Viewport bounds → minimap rectangle
  - Accounts for minimap centering and padding

## Visual Diagrams

### Minimap Layout and Components

```
Canvas (1920 x 1080):
┌──────────────────────────────────────────┐
│  Toolbar                                 │
├──────────────────────────────────────────┤
│                                          │
│                                          │
│     Main Canvas Content                  │
│     (Entities, Grid, Viewport)           │
│                                          │
│                                          │
│                                          │
│                                    ┌─────┤
│                                    │ M   │
│                                    │ i   │
│                                    │ n   │
│                                    │ i   │
│                                    │ m   │
│                                    │ a   │
│                                    │ p   │
│                                    └─────┤
└──────────────────────────────────────────┘

Minimap Detail (200 x 150px, bottom-right):
┌────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━┓ │ <- Border (1px)
│ ┃                      ┃ │
│ ┃  [Thumbnail of       ┃ │
│ ┃   entire project]    ┃ │
│ ┃                      ┃ │
│ ┃   ╔═══════╗          ┃ │ <- Viewport Rectangle
│ ┃   ║       ║          ┃ │    (blue, 30% opacity)
│ ┃   ║  You  ║          ┃ │
│ ┃   ║  Are  ║          ┃ │
│ ┃   ║  Here ║          ┃ │
│ ┃   ╚═══════╝          ┃ │
│ ┃                      ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━┛ │
└────────────────────────────┘
  [Resize Handle] [Context Menu Icon]
```

### Minimap Scale Calculation

```
Project Content:
  Content bounds: (50, 100) to (4500, 3200)
  Content dimensions: 4450 x 3100

Minimap Size: 200 x 150px

Step 1: Add Padding (10%)
  Padded width: 4450 * 1.1 = 4895px
  Padded height: 3100 * 1.1 = 3410px

Step 2: Calculate Scale Factors
  Horizontal scale: 200 / 4895 = 0.0409
  Vertical scale: 150 / 3410 = 0.0440

Step 3: Select Minimum Scale (fit all content)
  Scale = min(0.0409, 0.0440) = 0.0409 (4.09%)

Step 4: Calculate Actual Thumbnail Size
  Thumbnail width: 4895 * 0.0409 = 200px
  Thumbnail height: 3410 * 0.0409 = 139.4px

Step 5: Center in Minimap
  Horizontal offset: (200 - 200) / 2 = 0px
  Vertical offset: (150 - 139.4) / 2 = 5.3px

Final Layout:
┌─────────────────┐
│   [5.3px gap]   │
│ ┏━━━━━━━━━━━━━┓ │
│ ┃ Thumbnail   ┃ │ <- 139.4px tall
│ ┃ (200x139.4) ┃ │
│ ┃             ┃ │
│ ┗━━━━━━━━━━━━━┛ │
│   [5.3px gap]   │
└─────────────────┘
```

### Coordinate Transform (Click to Navigate)

```
User Clicks Minimap at (120, 80):

Step 1: Adjust for Content Offset
  Minimap size: 200 x 150
  Thumbnail size: 200 x 139.4
  Vertical offset: 5.3px
  Adjusted Y: 80 - 5.3 = 74.7
  Adjusted click: (120, 74.7) in thumbnail coords

Step 2: Scale to World Coordinates
  Minimap scale: 0.0409
  World X: 120 / 0.0409 = 2933
  World Y: 74.7 / 0.0409 = 1826
  World point: (2933, 1826)

Step 3: Calculate Target Pan
  Canvas: 1920 x 1080
  Current zoom: 1.0
  Center world point in viewport:
    Target pan X: -(2933 - 1920/2) = -(2933 - 960) = -1973
    Target pan Y: -(1826 - 1080/2) = -(1826 - 540) = -1286
  Target pan: { x: -1973, y: -1286 }

Step 4: Animate Viewport
  Start: current pan
  End: { x: -1973, y: -1286 }
  Duration: 300ms
  Main canvas pans to show clicked area centered

Visual Result:
Minimap Before Click:          Minimap After Navigation:
┌─────────────┐                ┌─────────────┐
│ ╔═══╗       │                │       ╔═══╗ │
│ ║ █ ║       │  Click here -> │       ║ █ ║ │
│ ╚═══╝     × │  Animation     │       ╚═══╝ │
│             │  ───────────>  │             │
└─────────────┘                └─────────────┘
  Rectangle                      Rectangle
  at start                       at clicked
  position                       position
```

### Viewport Rectangle Drag

```
User Drags Rectangle in Minimap:

Initial State:
  Rectangle position: (20, 15) in minimap
  Rectangle size: 78 x 44px
  Main canvas pan: { x: -200, y: -100 }

Drag Sequence:
  Mousedown at (30, 25) [within rectangle]
  Drag to (50, 40) [delta: +20, +15]

Calculate Pan Delta:
  Minimap delta: (20, 15)
  Minimap scale: 0.0409
  World delta: (20/0.0409, 15/0.0409) = (489, 367)

Update Main Canvas:
  New pan: { x: -200 + 489, y: -100 + 367 }
         = { x: 289, y: 267 }
  Apply immediately (no animation)

Minimap Rectangle Updates:
  New position: (40, 30) [moved by drag delta]

Visual:
Frame 0 (mousedown):           Frame N (during drag):
┌─────────────┐                ┌─────────────┐
│   ╔═══╗     │                │     ╔═══╗   │
│   ║   ║     │   Dragging --> │     ║   ║   │
│   ╚═══╝     │   Rectangle    │     ╚═══╝   │
│             │                │             │
└─────────────┘                └─────────────┘

Main Canvas:
  Pans in real-time as rectangle dragged
  Content shifts opposite to drag direction
  (Drag rectangle right → content moves right in viewport)
```

### Minimap Update on Entity Change

```
Timeline of Minimap Updates:

0ms: User adds entity at (5000, 3500)
     └─> EntityStore emits entity-added event

1ms: Minimap receives event
     └─> Content bounds changed: (50,100)-(4500,3200) -> (50,100)-(5000,3500)
     └─> Trigger scale recalculation
     └─> Schedule re-render (debounced 100ms)

2ms-99ms: User continues editing
     └─> Additional entity changes queue up
     └─> Re-render timer resets on each change

100ms: Debounce timer expires
     └─> Begin minimap thumbnail re-render
     └─> Render all entities at new scale

115ms: Re-render complete (15ms render time)
     └─> Update minimap thumbnail display
     └─> Viewport rectangle recalculated for new scale
     └─> User sees updated minimap

Optimization:
  Without debouncing:
    - 10 entity changes = 10 re-renders = 150ms total
    - Flickering, poor performance

  With debouncing (100ms):
    - 10 entity changes = 1 re-render = 15ms total
    - Smooth, final result shown
    - 90% reduction in render time
```

### Minimap Resize Animation

```
User Selects "Large" Size:

Initial: 200 x 150px           Target: 300 x 225px
┌─────────────┐                ┌──────────────────┐
│ ┏━━━━━━━━┓ │                │ ┏━━━━━━━━━━━━━━┓ │
│ ┃ Mini   ┃ │   Animate      │ ┃ Minimap      ┃ │
│ ┃ map    ┃ │   200ms        │ ┃ (enlarged)   ┃ │
│ ┃        ┃ │   ────────>    │ ┃              ┃ │
│ ┗━━━━━━━━┛ │                │ ┃              ┃ │
└─────────────┘                │ ┗━━━━━━━━━━━━━━┛ │
                               └──────────────────┘

Animation Frames (60fps):
  Frame 0ms (0%):     200 x 150
  Frame 50ms (25%):   225 x 169
  Frame 100ms (50%):  250 x 187
  Frame 150ms (75%):  275 x 206
  Frame 200ms (100%): 300 x 225

Scale Recalculation:
  Old scale: 0.0409
  New scale: min(300/4895, 225/3410) = 0.0613

  Thumbnail re-rendered at new scale
  More detail visible in larger minimap
  Viewport rectangle proportionally adjusted
```

## Testing

### Unit Tests

**Test Suite**: CoordinateTransform

1. **Test: Minimap to world coordinate transform**
   - Setup: Minimap scale 0.05, content offset (10, 10)
   - Action: minimapToWorld({x: 60, y: 35}, scale, offset)
   - Assert: Result {x: 1000, y: 500} (scaled correctly)

2. **Test: World to minimap coordinate transform**
   - Setup: Minimap scale 0.05, content offset (10, 10)
   - Action: worldToMinimap({x: 1000, y: 500}, scale, offset)
   - Assert: Result {x: 60, y: 35}

3. **Test: Viewport to minimap rectangle**
   - Setup: Viewport (200, 100) to (2120, 1180), scale 0.05
   - Action: viewportToMinimapRect(viewport, scale)
   - Assert: Rectangle {x: 10, y: 5, width: 96, height: 54}

4. **Test: Bidirectional transform consistency**
   - Action: world → minimap → world
   - Assert: Result equals original world coords

5. **Test: Handle scale edge cases**
   - Action: Transform with scale 0 (divide by zero)
   - Assert: Returns default values, no error thrown

### Integration Tests

**Test Suite**: Minimap Interaction

1. **Test: Click minimap navigates viewport**
   - Setup: Minimap rendered with content
   - Action: Simulate click at (120, 80) in minimap
   - Assert: Viewport animation starts
   - Assert: Target pan centers clicked world point
   - Assert: Animation completes in 300ms
   - Assert: Viewport rectangle in minimap matches final viewport

2. **Test: Drag viewport rectangle pans canvas**
   - Setup: Minimap with viewport rectangle
   - Action: Simulate mousedown, mousemove (+20, +15), mouseup
   - Assert: Main canvas pan updates in real-time
   - Assert: Pan delta calculated correctly from minimap scale
   - Assert: Viewport rectangle follows mouse
   - Assert: Single undo command created for drag sequence

3. **Test: Minimap updates on entity addition**
   - Setup: Minimap rendered with 10 entities
   - Action: Add entity to EntityStore
   - Assert: Minimap thumbnail re-renders (after debounce)
   - Assert: New entity visible in minimap
   - Assert: Scale recalculated if bounds changed

4. **Test: Viewport rectangle updates on zoom**
   - Setup: Viewport at zoom 1.0
   - Action: Change zoom to 2.0
   - Assert: Viewport rectangle size decreases (50% of original)
   - Assert: Rectangle position adjusted to maintain center
   - Assert: Size change animates smoothly

5. **Test: Minimap resize recalculates scale**
   - Setup: Minimap at 200x150
   - Action: Resize to 300x225
   - Assert: Scale recalculated for new dimensions
   - Assert: Thumbnail re-rendered at new scale
   - Assert: Resize animates smoothly over 200ms

### End-to-End Tests

**Test Suite**: User Minimap Workflow

1. **Test: User navigates large project via minimap**
   - Setup: Open project with entities spread across 10,000x8,000px
   - Action: User clicks far corner of minimap
   - Assert: Viewport smoothly animates to clicked area
   - Assert: Clicked entities become visible in main canvas
   - Assert: Viewport rectangle in minimap shows new position

2. **Test: User drags viewport rectangle for precision pan**
   - Setup: Minimap visible, viewport rectangle draggable
   - Action: User clicks and drags rectangle to new position
   - Assert: Main canvas pans smoothly during drag
   - Assert: No lag or stuttering
   - Assert: Releasing mouse finalizes pan
   - Assert: Ctrl+Z undoes drag to previous position

3. **Test: User resizes minimap for better detail**
   - Setup: Minimap at default medium size
   - Action: User right-clicks minimap, selects "Large"
   - Assert: Minimap smoothly expands to 300x225
   - Assert: More entity detail visible in larger minimap
   - Assert: Viewport rectangle proportionally adjusted

4. **Test: User repositions minimap to preferred corner**
   - Setup: Minimap in bottom-right corner
   - Action: User right-clicks, selects "Top-Left"
   - Assert: Minimap animates to top-left corner
   - Assert: Preference saved (persists on reload)

5. **Test: User toggles minimap visibility**
   - Setup: Minimap visible
   - Action: User presses 'M' key
   - Assert: Minimap fades out smoothly
   - Action: User presses 'M' again
   - Assert: Minimap fades back in
   - Assert: State and position preserved during toggle

## Common Pitfalls

### Pitfall 1: Not Clamping Viewport Rectangle to Minimap Bounds

**Problem**: Viewport rectangle can be dragged outside minimap content area.

**Symptom**: Rectangle partially or fully disappears, main canvas pans to invalid location.

**Solution**: Clamp rectangle position during drag:
- Calculate maximum rectangle position: minimap size - rectangle size
- Clamp drag delta before applying: x = max(0, min(maxX, x))
- Prevent rectangle from exceeding minimap bounds
- Provides tactile "edge" feeling during drag

### Pitfall 2: Synchronous Minimap Rendering Blocking UI

**Problem**: Minimap thumbnail rendered synchronously on main thread, freezing UI.

**Symptom**: UI becomes unresponsive during minimap updates, especially with large projects (1000+ entities).

**Solution**: Render minimap asynchronously:
- Use requestAnimationFrame for render loop
- Render to offscreen canvas in background
- Swap in new thumbnail when complete
- Show loading indicator during render (if >100ms)
- User can continue interacting with main canvas during render

### Pitfall 3: Ignoring Minimap Aspect Ratio

**Problem**: Minimap always uses fixed 4:3 aspect ratio regardless of canvas/content aspect.

**Symptom**: Minimap shows distorted view, entities appear squished or stretched.

**Solution**: Match minimap aspect ratio to canvas:
- Calculate canvas aspect: width / height
- Apply same aspect to minimap dimensions
- If user resizes minimap, maintain aspect ratio
- Optionally allow free aspect in "Custom" size mode

### Pitfall 4: No Debouncing on Rapid Entity Changes

**Problem**: Every entity change triggers immediate minimap re-render.

**Symptom**: During bulk import or rapid editing, minimap flickers constantly, performance degrades.

**Solution**: Debounce minimap updates:
- Wait 100ms after last entity change before re-rendering
- Queue updates during rapid changes
- Single render captures all changes
- Show "Updating..." indicator if debounce >500ms
- 90% reduction in render calls during bulk operations

### Pitfall 5: Viewport Rectangle Too Small at High Zoom

**Problem**: At 1000% zoom, viewport rectangle in minimap becomes 1-2 pixels, invisible.

**Symptom**: User can't see where they are in minimap, loses spatial awareness.

**Solution**: Enforce minimum rectangle size:
- Minimum dimensions: 8x8 pixels
- If calculated size < 8px, clamp to 8px
- Change visual style: render as circle instead of rectangle
- Increase border thickness (3px vs 2px)
- Tooltip shows exact zoom percentage on hover

## Performance Tips

### Tip 1: Cache Minimap Thumbnail Between Updates

Re-rendering entire minimap from scratch on every frame is expensive:

**Implementation**: Render minimap to offscreen canvas once. Cache ImageData. Reuse cached thumbnail until entities change. Re-render only on entity add/remove/move.

**Benefit**: Reduces minimap render cost from 15ms every frame to 15ms only on changes. 99% reduction in render time during static periods.

### Tip 2: Simplify Entity Rendering at Minimap Scale

Full entity detail (labels, fine lines, gradients) invisible at 4% scale:

**Implementation**: Use simplified entity rendering for minimap:
- Rooms: Simple filled rectangles (no room labels)
- Ducts: Single lines (no width visualization)
- Equipment: Solid circles (no icons)
- Skip notes entirely at <5% scale

**Benefit**: Reduces per-entity render time from 2ms to 0.2ms. 10x faster minimap rendering.

### Tip 3: Use Offscreen Canvas for Minimap Rendering

Rendering directly to visible canvas causes flicker and layout thrashing:

**Implementation**: Render minimap to OffscreenCanvas or hidden canvas element. Once complete, swap ImageData to visible minimap canvas via single drawImage() call.

**Benefit**: Eliminates flickering, reduces paint time by 60%. User sees smooth, atomic updates.

### Tip 4: Throttle Viewport Rectangle Updates

Updating rectangle position every frame during 60fps pan is wasteful:

**Implementation**: Update viewport rectangle at 30fps during active pan:
- Every other frame: Update rectangle position
- On pan end: Force immediate update to final position
- User won't perceive 30fps vs 60fps for small rectangle

**Benefit**: Halves rectangle update CPU cost, frees resources for main canvas rendering.

### Tip 5: Progressive Minimap Loading for Large Projects

Rendering 10,000 entities to minimap all at once freezes UI:

**Implementation**: Render minimap progressively:
- Frame 1: Render first 100 entities
- Frame 2: Render next 100 entities
- Continue until all entities rendered
- Show progress indicator: "Loading minimap... (500/10000)"
- Total time spread across multiple frames

**Benefit**: Maintains responsive UI during large project load. User sees incremental progress instead of freeze.

## Future Enhancements

### Enhancement 1: Minimap Layer Filtering

**Description**: Toggle visibility of specific layers in minimap (show only Supply, hide Return, etc.).

**User Value**: Focus minimap on relevant content, reduce clutter in complex projects.

**Implementation**:
- Minimap context menu: "Show Layers..."
- Layer checkboxes (Supply, Return, Equipment, etc.)
- Only selected layers rendered in minimap
- Main canvas layers unaffected
- Viewport rectangle shows all content (not filtered)

### Enhancement 2: Minimap Zoom (Magnified Minimap)

**Description**: Allow zooming minimap itself to show more detail of specific area.

**User Value**: Large projects may have too much content to see detail in minimap thumbnail.

**Implementation**:
- Scroll wheel on minimap zooms minimap content (not main canvas)
- Minimap zoom range: 100% (default) to 400%
- Zoomed minimap shows subset of project (not entire content)
- Pan minimap with click-drag to navigate zoomed minimap
- Reset button returns to 100% (full project view)

### Enhancement 3: Minimap Annotations

**Description**: Add temporary markers or highlights in minimap for collaboration or reference.

**User Value**: Point out areas of interest to collaborators or mark areas for later review.

**Implementation**:
- Right-click minimap: "Add Marker"
- Place labeled pin at clicked location
- Markers visible in minimap, clickable to navigate
- Marker list sidebar shows all markers
- Delete marker via context menu or marker list

### Enhancement 4: Minimap History Scrubber

**Description**: Timeline slider below minimap showing project evolution, scrub through history.

**User Value**: Visualize design evolution, review changes over time.

**Implementation**:
- Horizontal timeline below minimap (timestamps)
- Drag slider to scrub through project history
- Minimap updates to show project state at selected time
- Main canvas optionally syncs (show historical state)
- Useful for time-lapse visualization and change review

### Enhancement 5: Multi-Viewport Minimap (Split View)

**Description**: Show multiple viewport rectangles in minimap for split-screen or multi-user sessions.

**User Value**: Coordinate between multiple views of same project, useful in collaboration.

**Implementation**:
- Each viewport (user or split pane) gets distinct rectangle color
- Viewport labels show owner ("User A", "View 1")
- Click rectangle to focus that viewport
- Drag rectangle updates corresponding viewport
- Useful for collaborative design reviews

### Enhancement 6: Minimap Heatmap Overlay

**Description**: Overlay heatmap showing areas of high activity (edits, views) or entity density.

**User Value**: Identify frequently-edited areas or dense regions of design.

**Implementation**:
- Toggle heatmap mode in context menu
- Color gradient: Blue (low) → Red (high)
- Activity heatmap: Track edit locations over session
- Density heatmap: Visualize entity concentration
- Helps identify "hot spots" for optimization or review

### Enhancement 7: Minimap Camera Shake on Bounds

**Description**: When viewport hits bounds, minimap shakes briefly to provide tactile feedback.

**User Value**: Reinforces boundary limitation, adds polish to interaction.

**Implementation**:
- On bounds reached, trigger shake animation
- 3-frame shake: offset ±3px horizontally
- Duration: 150ms
- Pairs with existing border flash feedback
- User preference to enable/disable

### Enhancement 8: Minimap Screenshot Export

**Description**: Export minimap thumbnail as high-resolution image for documentation or presentation.

**User Value**: Quick way to create overview image of entire project.

**Implementation**:
- Context menu: "Export Minimap..."
- Options: Size (current, 2x, 4x), format (PNG, JPG, SVG)
- Render at high resolution (e.g., 1600x1200 for 4x)
- Download or copy to clipboard
- Include viewport rectangle or not (toggle)

### Enhancement 9: Minimap Diff View (Collaborative)

**Description**: Show differences between local and remote project state in minimap.

**User Value**: Visualize collaborators' changes before pulling/merging.

**Implementation**:
- Minimap shows overlay highlighting changed areas
- Green: Additions, Red: Deletions, Yellow: Modifications
- Click highlighted area to navigate and review change
- "Accept" or "Reject" change inline
- Useful for collaborative workflow and change review

### Enhancement 10: Minimap AI Insights

**Description**: AI-powered analysis overlays in minimap (balance, density, flow issues).

**User Value**: Get design feedback visualized spatially without detailed inspection.

**Implementation**:
- AI analyzes design, identifies issues (unbalanced zones, bottlenecks)
- Overlay icons in minimap at issue locations
- Click icon to navigate to issue and see details
- Issues categorized: Critical, Warning, Info
- Helps catch design problems early
