# [UJ-CN-001] Pan Canvas

## Overview

This user journey covers panning (scrolling) the canvas viewport to navigate around the design workspace, including mouse drag panning, keyboard navigation, and pan limits for large projects.

## PRD References

- **FR-CN-001**: User shall be able to pan the canvas viewport
- **US-CN-001**: As a designer, I want to pan the canvas so that I can view different areas of my design
- **AC-CN-001-001**: Middle mouse button drag pans viewport
- **AC-CN-001-002**: Spacebar + drag pans viewport (alternative method)
- **AC-CN-001-003**: Arrow keys pan viewport in small increments
- **AC-CN-001-004**: Pan tool available in toolbar for dedicated panning
- **AC-CN-001-005**: Smooth panning motion without lag
- **AC-CN-001-006**: Pan limits prevent scrolling beyond reasonable bounds

## Prerequisites

- User is in Canvas Editor
- Canvas workspace loaded and rendered
- At least some content exists (or empty canvas for initial positioning)
- Mouse and keyboard input available

## User Journey Steps

### Step 1: Initiate Pan with Middle Mouse Button

**User Action**: Click and hold middle mouse button (wheel button)

**Expected Result**:
- Middle mouse button down detected
- Pan mode activated
- Cursor changes to pan cursor (hand icon, grabbing)
- Starting state recorded:
  - Current viewport pan: (0, 0) - no offset
  - Mouse starting position: (500, 300) in screen coordinates
  - Canvas world coordinates at mouse: (500, 300)
- Visual feedback:
  - Cursor changes from default to grab hand (open hand)
  - On drag start: Changes to grabbing hand (closed fist)
  - Canvas remains static until mouse moves
- Other tools temporarily suspended:
  - Select tool inactive during pan
  - Drawing tools paused
  - Pan takes priority
- Status bar: "Pan: Drag to navigate" (brief hint)

**Validation Method**: E2E test - Verify middle mouse button activates pan mode

---

### Step 2: Drag to Pan Viewport

**User Action**: Drag mouse 200px to the right and 100px down (delta: +200, +100)

**Expected Result**:
- Mouse movement tracked continuously
- Pan offset calculated:
  - Delta X: +200px (mouse moved right)
  - Delta Y: +100px (mouse moved down)
  - Viewport pan: (-200, -100) - inverse of mouse movement
  - Canvas moves opposite to mouse drag (natural scrolling)
- Viewport state updated:
  - `viewportStore.setPan({ x: -200, y: -100 })`
  - Camera position shifted
  - World coordinates offset
- Canvas re-renders at 60fps:
  - All entities shift visually left and up
  - Mouse appears to "grab" the canvas
  - Smooth continuous motion
  - No stuttering or lag
- World coordinate transformation:
  - Screen (500, 300) now maps to world (700, 400)
  - Offset applied to all rendering
- Visual feedback during drag:
  - Canvas content follows mouse movement
  - Cursor remains as grabbing hand
  - No entity selection during pan
  - Grid (if visible) shifts with content
- Performance maintained:
  - 60fps rendering
  - No dropped frames
  - Responsive to rapid mouse movement

**Validation Method**: Integration test - Verify viewport pan offset updates

---

### Step 3: Release to Finalize Pan

**User Action**: Release middle mouse button

**Expected Result**:
- Mouse button up detected
- Pan mode deactivated
- Cursor returns to previous tool cursor:
  - Was select tool → Returns to arrow
  - Was drawing tool → Returns to crosshair
- Final viewport position:
  - Pan offset: (-200, -100)
  - Persisted in viewport store
  - Canvas remains at panned position
- Tools re-enabled:
  - Select tool active again
  - Can interact with entities at new viewport position
  - Drawing tools functional
- No command created (pan not undoable):
  - Pan is navigation, not a design change
  - Viewport position doesn't affect project data
  - Undo/redo stack unchanged
- Canvas state:
  - All entities at new visual positions
  - Entity world coordinates unchanged (only viewport moved)
  - Rendering stable at final position
- Status bar: Returns to default state

**Validation Method**: E2E test - Verify pan mode releases correctly

---

### Step 4: Pan with Spacebar + Drag (Alternative)

**User Action**: Hold Spacebar, click and drag with left mouse button

**Expected Result**:
- Spacebar key down detected
- Temporary pan mode activated:
  - Overrides current tool
  - Left mouse button becomes pan trigger
  - Works with any active tool
- Cursor changes to pan cursor (hand)
- Drag operation same as middle mouse:
  - Canvas pans with mouse movement
  - Smooth 60fps motion
  - Viewport offset updated
- Release spacebar:
  - Pan mode immediately deactivated
  - Returns to previous tool
  - Cursor returns to tool cursor
- Useful when:
  - Middle mouse button unavailable (trackpad)
  - Dedicated pan tool not selected
  - Quick pan during other operations
- Common workflow:
  - Drawing duct (duct tool active)
  - Hold spacebar to pan view
  - Release spacebar, continue drawing
  - Seamless tool switching

**Validation Method**: E2E test - Verify spacebar pan mode

---

### Step 5: Pan with Arrow Keys

**User Action**: Press arrow keys (Right arrow 5 times, Down arrow 3 times)

**Expected Result**:
- Arrow key presses detected
- Incremental pan applied:
  - Each arrow key press: 50px pan (configurable)
  - Right arrow ×5: Pan viewport -250px X (canvas moves right)
  - Down arrow ×3: Pan viewport -150px Y (canvas moves down)
  - Total offset: (-250, -150) added to existing pan
- Viewport updates:
  - Each key press triggers single pan increment
  - Viewport store updated per press
  - Canvas re-renders smoothly
- Visual feedback:
  - Canvas shifts by fixed increment per press
  - Discrete steps (not continuous like drag)
  - Visible entity movement
- Keyboard repeat handling:
  - Hold arrow key: Continuous panning
  - OS key repeat rate applies (10-15 pans/second)
  - Smooth motion despite discrete updates
- Modifier keys:
  - Shift + Arrow: Larger increment (200px)
  - Ctrl/Cmd + Arrow: Smaller increment (10px)
  - For precise or rapid navigation
- Useful for:
  - Precise viewport positioning
  - Keyboard-only navigation
  - Accessibility (mouse-free operation)

**Validation Method**: Unit test - Verify arrow key pan increments

---

## Edge Cases

### 1. Pan Beyond Canvas Bounds (Limits)

**User Action**: Pan very far to the left (attempt to pan -10,000px X)

**Expected Behavior**:
- Pan limit enforcement:
  - Maximum pan distance: ±5000px from origin (configurable)
  - Prevents infinite scrolling into empty space
  - Clamps pan offset to valid range
- Pan clamped:
  - Attempted: (-10,000, 0)
  - Clamped to: (-5,000, 0)
  - User cannot pan further
- Visual feedback:
  - Canvas stops moving even if mouse continues dragging
  - Rubber-band effect (optional): Slight resistance at edge
  - Edge glow or visual indicator (optional)
- Rationale:
  - Prevent getting lost in empty space
  - Maintain reasonable navigation bounds
  - Performance (don't render extreme offsets)
- User can return to center:
  - Press Home key → Reset pan to (0, 0)
  - Or use "Fit All" to center on content

**Validation Method**: Unit test - Verify pan clamping to bounds

---

### 2. Pan During Active Drawing

**User Action**: While drawing duct, hold spacebar and pan, then continue drawing

**Expected Behavior**:
- Duct tool active, duct partially drawn:
  - Start point placed at (100, 100)
  - Mouse at (300, 200) - not yet clicked
- Spacebar pressed:
  - Pan mode activated (temporary override)
  - Duct drawing paused (not cancelled)
  - State preserved: Start point remembered
- Pan viewport:
  - Canvas shifts, start point moves visually
  - Start point world coordinates unchanged (100, 100)
  - Mouse follows viewport shift
- Release spacebar:
  - Return to duct tool
  - Resume drawing from saved state
  - Click to place end point
- Result:
  - Duct created with correct world coordinates
  - Pan didn't affect entity positioning
  - Seamless workflow integration

**Validation Method**: Integration test - Verify pan preserves tool state

---

### 3. Rapid Pan (Performance Test)

**User Action**: Rapidly drag mouse back and forth for 5 seconds

**Expected Behavior**:
- Continuous rapid mouse movement
- Pan updates at mouse sample rate:
  - Mouse events: 60-120 Hz typical
  - Pan calculations: Every mouse move event
  - Rendering: 60fps (throttled from mouse rate)
- Performance maintained:
  - Canvas renders at stable 60fps
  - No dropped frames
  - No visible lag or stutter
- Rendering optimizations:
  - Request animation frame throttling
  - Coalesces rapid pan updates
  - Renders at monitor refresh rate
- Large project handling:
  - 1000+ entities: Still smooth panning
  - Viewport culling: Only render visible entities
  - Spatial indexing: Fast entity lookup
- Memory stable:
  - No memory leaks during rapid pan
  - Garbage collection minimal
  - CPU usage reasonable (<50%)

**Validation Method**: Performance test - Verify smooth pan with large project

---

### 4. Pan with Trackpad (Two-Finger Scroll)

**User Action**: Two-finger scroll gesture on trackpad (macOS/Windows)

**Expected Behavior**:
- Trackpad scroll event detected
- Pan applied from scroll delta:
  - Horizontal scroll → X pan offset
  - Vertical scroll → Y pan offset
  - Natural scrolling direction (configurable)
- Smooth scrolling:
  - Momentum scrolling supported (macOS)
  - Inertia continues pan after fingers lift
  - Smooth deceleration
- Precision scrolling:
  - Pixel-perfect pan values (not discrete steps)
  - Sub-pixel rendering for smooth motion
- Works like middle mouse drag:
  - Same pan limits
  - Same viewport store updates
  - Same rendering pipeline
- Platform differences:
  - macOS: Natural scrolling default (content moves with fingers)
  - Windows: Reverse scrolling default (content moves opposite)
  - User preference setting available

**Validation Method**: E2E test - Verify trackpad scroll panning

---

### 5. Pan with Pan Tool Selected

**User Action**: Select Pan tool from toolbar, then click-drag with left mouse button

**Expected Behavior**:
- Pan tool selected from toolbar:
  - Tool icon highlighted (active state)
  - Cursor changes to hand icon immediately
  - Left mouse button becomes pan trigger
- Click and drag:
  - Same behavior as middle mouse drag
  - Canvas pans with mouse movement
  - Smooth 60fps rendering
- Dedicated pan mode:
  - Pan tool remains active until deselected
  - No need to hold modifier keys
  - Useful for extended navigation sessions
- Switch tools:
  - Press V → Select tool (pan tool deactivated)
  - Press R → Room tool
  - Pan tool icon no longer highlighted
- Keyboard shortcut:
  - Press H → Activate pan tool
  - Quick toggle for navigation

**Validation Method**: E2E test - Verify pan tool from toolbar

---

## Error Scenarios

### 1. Pan Calculation Overflow

**Scenario**: Pan offset calculation produces extremely large value (>1,000,000px)

**Expected Handling**:
- Overflow detection:
  - Pan delta validation before applying
  - Check for NaN, Infinity, or unreasonable values
- Clamping to safe limits:
  - Maximum pan: ±10,000px (safety limit)
  - Clamp calculated offset
- Error prevention:
  - Invalid pan rejected
  - Previous valid pan maintained
  - No visual glitches
- Error logged:
  - "Pan calculation overflow detected, clamped to safe value"
  - Technical details for debugging
- User sees:
  - Pan stops at limit
  - No crash or error dialog
  - Can continue working normally

**Validation Method**: Unit test - Verify pan overflow protection

---

### 2. Pan During Zoom Operation

**Scenario**: User pans while simultaneously zooming (wheel scroll during middle mouse drag)

**Expected Handling**:
- Concurrent operations:
  - Pan active (middle mouse drag)
  - Zoom triggered (scroll wheel)
- Operation priority:
  - Both operations processed
  - Pan updates viewport offset
  - Zoom updates viewport scale
  - No conflict between operations
- Combined effect:
  - Viewport pans AND zooms simultaneously
  - Zoom center follows mouse position
  - Pan offset adjusted for zoom
- Visual result:
  - Smooth combined navigation
  - No glitches or jumps
  - Predictable behavior
- Common use case:
  - Pan to area of interest
  - Zoom in while panning
  - One fluid motion

**Validation Method**: Integration test - Verify pan/zoom combination

---

### 3. Pan State Corruption

**Scenario**: Viewport store pan values become corrupted (NaN)

**Expected Handling**:
- Corruption detection:
  - Validate pan values before rendering
  - Check for NaN, undefined, null
- Recovery:
  - Reset pan to (0, 0) - safe default
  - Or use last known valid pan
  - Continue rendering with valid values
- Error notification:
  - Warning toast: "Viewport reset due to error"
  - Suggest: "Use 'Fit All' to recenter on content"
- Error logged:
  - Full details for debugging
  - Stack trace captured
- User experience:
  - Brief viewport jump to reset position
  - Can continue working
  - No data loss

**Validation Method**: Unit test - Verify pan state validation

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Pan with Mouse | `Middle Mouse Button + Drag` |
| Temporary Pan | `Spacebar + Left Mouse Drag` |
| Pan Right | `→` (Right Arrow) |
| Pan Left | `←` (Left Arrow) |
| Pan Down | `↓` (Down Arrow) |
| Pan Up | `↑` (Up Arrow) |
| Pan Large Increment | `Shift + Arrow Keys` |
| Pan Small Increment | `Ctrl/Cmd + Arrow Keys` |
| Activate Pan Tool | `H` |
| Reset Pan to Origin | `Home` |

---

## Related Elements

- [PanTool](../../elements/04-tools/PanTool.md) - Dedicated pan tool implementation
- [viewportStore](../../elements/02-stores/viewportStore.md) - Viewport state management
- [CanvasRenderer](../../elements/03-rendering/CanvasRenderer.md) - Pan offset rendering
- [InputHandler](../../elements/08-systems/InputHandler.md) - Mouse/keyboard input
- [UJ-CN-002](./UJ-CN-002-ZoomCanvas.md) - Zoom navigation (related)
- [UJ-CN-003](./UJ-CN-003-FitToView.md) - Fit all content (related)

---

## Visual Diagram

```
Pan Operation Visualization
┌────────────────────────────────────────────────────────┐
│  Before Pan (Viewport at origin):                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Viewport (0, 0)                                  │  │
│  │  ┌─────┐                                         │  │
│  │  │ RM1 │ (100, 100) ← World coordinates          │  │
│  │  └─────┘                                         │  │
│  │         ┌─────┐                                  │  │
│  │         │ RM2 │ (300, 200)                       │  │
│  │         └─────┘                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  User drags mouse right (+200px) and down (+100px)     │
│  ↓                                                     │
│                                                        │
│  After Pan (Viewport offset -200, -100):               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Viewport (-200, -100)                            │  │
│  │                                                  │  │
│  │                                                  │  │
│  │                    ┌─────┐                       │  │
│  │                    │ RM1 │ ← Still (100, 100)    │  │
│  │                    └─────┘    in world coords    │  │
│  │                           ┌─────┐               │  │
│  │                           │ RM2 │ (300, 200)    │  │
│  │                           └─────┘               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Entities appear to move left/up (viewport moved)      │
│  But world coordinates remain unchanged                │
└────────────────────────────────────────────────────────┘

Pan Direction Mapping:
┌────────────────────────────────────────────────────────┐
│  Mouse Movement  →  Viewport Offset  →  Canvas Visual  │
│  ───────────────────────────────────────────────────── │
│  Right (+200px)  →  X: -200          →  Canvas left    │
│  Left (-200px)   →  X: +200          →  Canvas right   │
│  Down (+100px)   →  Y: -100          →  Canvas up      │
│  Up (-100px)     →  Y: +100          →  Canvas down    │
│                                                        │
│  Inverse relationship (natural scrolling):             │
│  Moving mouse right → Canvas content moves left        │
│  Like grabbing physical paper and dragging             │
└────────────────────────────────────────────────────────┘

Coordinate Transformation:
┌────────────────────────────────────────────────────────┐
│  Screen to World Coordinate Conversion:                │
│                                                        │
│  worldX = screenX - viewportPanX                       │
│  worldY = screenY - viewportPanY                       │
│                                                        │
│  Example:                                              │
│  - Viewport pan: (-200, -100)                          │
│  - Mouse at screen: (500, 300)                         │
│  - World coordinates: (500 - (-200), 300 - (-100))     │
│                     = (700, 400)                       │
│                                                        │
│  World to Screen (for rendering):                      │
│  screenX = worldX + viewportPanX                       │
│  screenY = worldY + viewportPanY                       │
│                                                        │
│  Example:                                              │
│  - Entity at world: (100, 100)                         │
│  - Viewport pan: (-200, -100)                          │
│  - Screen position: (100 + (-200), 100 + (-100))       │
│                   = (-100, 0) ← Off left edge          │
└────────────────────────────────────────────────────────┘

Pan Limits Visualization:
┌────────────────────────────────────────────────────────┐
│  Maximum Pan Bounds (±5000px):                         │
│                                                        │
│      (-5000, -5000)                (+5000, -5000)      │
│           ┌──────────────────────────────┐            │
│           │                              │            │
│           │        Allowed Pan           │            │
│           │         Region               │            │
│           │                              │            │
│           │         (0, 0)               │            │
│           │           ●  ← Origin        │            │
│           │                              │            │
│           │                              │            │
│           └──────────────────────────────┘            │
│      (-5000, +5000)                (+5000, +5000)      │
│                                                        │
│  Attempting to pan beyond limits:                      │
│  - Pan clamped to boundary                             │
│  - Visual feedback (can't scroll further)              │
│  - Prevents getting lost in infinite space             │
└────────────────────────────────────────────────────────┘

Pan Tool Cursor States:
┌────────────────────────────────────────────────────────┐
│  1. Pan Tool Not Active:                               │
│     Cursor: → (default arrow or tool cursor)           │
│                                                        │
│  2. Pan Tool Active / Middle Mouse Down:               │
│     Cursor: ✋ (open hand - ready to pan)              │
│                                                        │
│  3. Panning (Dragging):                                │
│     Cursor: ✊ (closed hand - grabbing)                │
│                                                        │
│  4. At Pan Limit:                                      │
│     Cursor: 🚫 (no entry - can't pan further)         │
└────────────────────────────────────────────────────────┘

Spacebar Pan Override:
┌────────────────────────────────────────────────────────┐
│  Active Tool: Select (V)                               │
│  Cursor: → (arrow)                                     │
│     ↓                                                  │
│  User holds Spacebar                                   │
│     ↓                                                  │
│  Temporary Pan Mode:                                   │
│  Cursor: ✋ (hand)                                     │
│  Left mouse → Pan (not select)                         │
│     ↓                                                  │
│  User releases Spacebar                                │
│     ↓                                                  │
│  Return to Select Tool:                                │
│  Cursor: → (arrow)                                     │
│  Left mouse → Select (normal behavior)                 │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/stores/viewportStore.pan.test.ts`

**Test Cases**:
- Set pan offset
- Pan clamping to bounds
- Pan delta calculation
- Arrow key pan increments
- Pan limit enforcement
- Coordinate transformations

**Assertions**:
- Pan offset stored correctly
- Values clamped to ±5000px
- Delta = mouseEnd - mouseStart
- Arrow key pans 50px per press
- Cannot pan beyond limits
- Screen ↔ world conversion accurate

---

### Integration Tests
**File**: `src/__tests__/integration/pan-canvas.test.ts`

**Test Cases**:
- Complete pan workflow (middle mouse)
- Spacebar + drag pan
- Arrow key navigation
- Pan during other tool operations
- Pan with large project (1000+ entities)
- Pan limit boundary behavior

**Assertions**:
- Viewport offset updates in store
- Canvas re-renders with new offset
- Spacebar activates/deactivates pan
- Arrow keys increment pan correctly
- Tool state preserved during pan
- Performance maintained (60fps)

---

### E2E Tests
**File**: `e2e/canvas-navigation/pan-canvas.spec.ts`

**Test Cases**:
- Visual pan with middle mouse drag
- Visual pan with spacebar + drag
- Pan tool selection from toolbar
- Arrow key pan visual movement
- Cursor changes during pan
- Status bar pan feedback

**Assertions**:
- Canvas content shifts visually with drag
- Hand cursor visible during pan
- Pan tool icon highlighted when active
- Arrow keys move canvas incrementally
- Cursor changes to grabbing hand
- Status bar shows pan mode

---

## Common Pitfalls

### ❌ Don't: Apply pan offset incorrectly to entities
**Problem**: Entities actually move in world coordinates instead of just viewport shift

**Solution**: Apply pan only to rendering, not entity positions

---

### ❌ Don't: Forget to invert mouse delta for natural scrolling
**Problem**: Canvas moves in same direction as mouse (feels wrong)

**Solution**: Viewport offset = -(mouse delta) for natural grab behavior

---

### ❌ Don't: Pan without limits
**Problem**: Users get lost thousands of pixels from content

**Solution**: Enforce reasonable pan bounds (±5000px from origin)

---

### ✅ Do: Provide visual feedback when at pan limit
**Benefit**: User understands why they can't pan further

---

### ✅ Do: Support multiple pan methods (middle mouse, spacebar, tool)
**Benefit**: Accessibility and user preference accommodation

---

## Performance Tips

### Optimization: Viewport Culling
**Problem**: Rendering all 1000 entities when only 20 visible wastes GPU

**Solution**: Only render entities within viewport bounds
- Calculate visible region from pan + zoom
- Filter entities by bounding box intersection
- Render only visible subset
- 50x faster rendering for large projects

---

### Optimization: Coalesce Rapid Pan Updates
**Problem**: 120 mouse events/second causes 120 re-renders

**Solution**: Throttle rendering to 60fps via requestAnimationFrame
- Track pan offset from all mouse events
- Render only on animation frame
- Smooth motion at monitor refresh rate
- Half the render calls

---

### Optimization: Subpixel Pan Precision
**Problem**: Integer pan values cause jittery motion

**Solution**: Use floating-point pan offsets
- Store pan as float: (-200.5, -100.3)
- Canvas transform supports subpixel rendering
- Smooth continuous motion
- Especially important for trackpad scrolling

---

## Future Enhancements

- **Mini-Map**: Small overview showing pan position in full canvas
- **Pan Presets**: Save frequently used viewport positions
- **Smooth Pan Animation**: Animated pan to target position
- **Pan Boundaries**: Auto-fit pan limits to content bounds
- **Touch Gestures**: Two-finger pan on touchscreen devices
- **Pan Speed Curve**: Acceleration for long-distance panning
- **Pan Lock**: Lock pan to horizontal or vertical axis (with Shift)
- **Return to Last Position**: Jump back to previous pan location
- **Pan History**: Navigate through pan position history
- **Magnetic Pan**: Snap pan to align with grid or entities
