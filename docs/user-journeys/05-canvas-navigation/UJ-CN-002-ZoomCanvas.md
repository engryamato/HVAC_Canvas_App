# [UJ-CN-002] Zoom Canvas

## Overview

This user journey covers zooming in and out of the canvas viewport to view details or get an overview, including mouse wheel zoom, keyboard shortcuts, zoom limits, and zoom-to-cursor behavior.

## PRD References

- **FR-CN-002**: User shall be able to zoom the canvas viewport
- **US-CN-002**: As a designer, I want to zoom the canvas so that I can see fine details or get an overview
- **AC-CN-002-001**: Mouse wheel scroll zooms in/out
- **AC-CN-002-002**: Zoom centers on mouse cursor position
- **AC-CN-002-003**: Ctrl/Cmd + Plus/Minus keys zoom in/out
- **AC-CN-002-004**: Zoom range: 10% to 500% (configurable)
- **AC-CN-002-005**: Zoom level indicator visible in UI
- **AC-CN-002-006**: Smooth zoom transitions without lag

## Prerequisites

- User is in Canvas Editor
- Canvas workspace loaded and rendered
- Mouse wheel or keyboard available for zoom input
- At least some content exists for meaningful zoom

## User Journey Steps

### Step 1: Initial Zoom State

**User Action**: (Starting state - user viewing canvas)

**Expected Result**:
- Current zoom level: 100% (1.0x, default)
- Viewport state:
  - Pan offset: (0, 0) - centered on origin
  - Zoom scale: 1.0 - no magnification
  - Zoom center: Canvas center or last zoom point
- Visual indicators:
  - Zoom percentage displayed: "100%" in status bar or toolbar
  - Zoom slider visible (optional UI element)
  - Grid spacing at default scale
- Entity rendering:
  - All entities at actual size
  - 1 canvas pixel = 1 design unit (at 100% zoom)
  - Text readable at default size
- Zoom limits:
  - Minimum zoom: 0.1 (10%)
  - Maximum zoom: 5.0 (500%)
  - Current: Well within limits

**Validation Method**: Unit test - Verify default zoom state

---

### Step 2: Zoom In with Mouse Wheel

**User Action**: Position mouse at (500, 300), scroll wheel up (3 notches)

**Expected Result**:
- Mouse wheel scroll detected:
  - Scroll direction: Up (positive delta)
  - Notches: 3 wheel detents
  - Mouse position: (500, 300) screen coordinates
- Zoom calculation:
  - Zoom increment per notch: 1.1x (10% increase)
  - Starting zoom: 1.0
  - After 3 notches: 1.0 × 1.1³ = 1.331 (133.1% zoom)
- Zoom-to-cursor behavior:
  - World coordinates at mouse: Calculated from current viewport
  - Example: World (500, 300) at 100% zoom
  - After zoom: Same world point remains under mouse
  - Viewport pan adjusted to maintain cursor position
- Viewport state updated:
  - `viewportStore.setZoom(1.331)`
  - Zoom scale: 1.331
  - Pan offset: Adjusted to keep (500, 300) world point at mouse
- Visual updates:
  - Canvas zooms in smoothly (if animation enabled)
  - All entities appear larger
  - Grid spacing increases proportionally
  - Text scales up (may become pixelated if raster)
- Zoom indicator updates:
  - Status bar: "133%"
  - Zoom slider moves right
  - Tooltip shows exact percentage
- Rendering performance:
  - Re-renders at 60fps during zoom
  - Smooth transition
  - No stuttering

**Validation Method**: Integration test - Verify zoom calculation and cursor tracking

---

### Step 3: Continue Zooming In

**User Action**: Scroll wheel up 10 more notches rapidly

**Expected Result**:
- Rapid zoom operations:
  - 10 wheel events in ~1 second
  - Each notch: 1.1x zoom multiplier
  - Total: 1.331 × 1.1¹⁰ = 3.45 (345% zoom)
- Zoom limit check:
  - Maximum zoom: 5.0 (500%)
  - Current: 3.45 (345%)
  - Within limits, zoom applied
- Visual progression:
  - Canvas progressively zooms in
  - Entities become very large
  - Fine details visible
  - Grid cells large (if grid enabled)
- Performance maintained:
  - 60fps rendering throughout
  - Smooth zoom despite rapid input
  - No lag or dropped frames
- Zoom indicator:
  - Updates continuously: "133%" → "200%" → "345%"
  - Smooth percentage changes
- Cursor position:
  - Same world point remains under cursor throughout
  - No content "drift" during zoom

**Validation Method**: Performance test - Verify rapid zoom handling

---

### Step 4: Zoom Out with Keyboard

**User Action**: Press Ctrl/Cmd + Minus key 5 times

**Expected Result**:
- Keyboard zoom triggered:
  - Shortcut detected: Ctrl/Cmd + Minus
  - Zoom direction: Out (decrease)
  - Presses: 5 key presses
- Zoom calculation:
  - Keyboard zoom: 0.9x per press (10% decrease)
  - Starting: 345% (3.45x)
  - After 5 presses: 3.45 × 0.9⁵ = 2.03 (203% zoom)
- Zoom center:
  - Keyboard zoom centers on viewport center
  - Not on mouse cursor (no mouse position)
  - Canvas center point used as zoom origin
- Viewport updates:
  - Zoom: 2.03
  - Pan: Adjusted to keep canvas center in view
- Visual feedback:
  - Canvas zooms out incrementally
  - Entities become smaller with each press
  - More canvas visible in viewport
- Zoom indicator:
  - Updates: "345%" → "310%" → "280%" → ... → "203%"
  - Discrete steps visible
- Alternative: Holding keys
  - Hold Ctrl + Minus: Continuous zoom out
  - Key repeat rate: 10-15 zooms/second
  - Smooth continuous zoom effect

**Validation Method**: E2E test - Verify keyboard zoom shortcuts

---

### Step 5: Reach Zoom Limit

**User Action**: Continue zooming out (Ctrl+Minus) until limit reached

**Expected Result**:
- Zoom decreasing:
  - Current: 203% (2.03x)
  - User presses Ctrl+Minus 20 more times
  - Target: 2.03 × 0.9²⁰ = 0.247 (24.7%)
- Minimum zoom limit:
  - Configured minimum: 0.1 (10%)
  - Requested: 0.247 (24.7%)
  - Within limits, zoom applied
- Attempt to zoom below minimum:
  - User continues pressing Ctrl+Minus
  - Calculated zoom: 0.05 (5%)
  - Limit enforcement: Clamped to 0.1 (10%)
  - Zoom set to minimum: 0.1
- Visual feedback at limit:
  - Canvas at maximum zoom-out (10%)
  - Very small entities, wide overview
  - Grid very fine (may be hidden at this zoom)
  - Further zoom attempts ignored
- Zoom indicator:
  - Shows: "10%"
  - Visual indication at minimum (slider at left edge)
  - Tooltip: "Minimum zoom reached"
- Optional feedback:
  - Subtle animation: Canvas "bounces" at limit
  - Or: No response to further zoom attempts
  - Status bar: "Minimum zoom (10%)"

**Validation Method**: Unit test - Verify zoom limit clamping

---

## Edge Cases

### 1. Zoom with Ctrl+Scroll Wheel (Alternative Method)

**User Action**: Hold Ctrl key, scroll mouse wheel

**Expected Behavior**:
- Ctrl+Scroll detected:
  - Modifier key: Ctrl held
  - Scroll wheel: Same as normal zoom
- Zoom behavior same as wheel-only:
  - Zooms in/out
  - Centers on cursor
  - Same increment (1.1x per notch)
- Useful for:
  - Alternative zoom method (some users prefer)
  - Prevents accidental zoom (requires modifier)
  - Standard CAD/design software convention
- Configuration option:
  - Setting: "Require Ctrl for wheel zoom"
  - If enabled: Plain scroll pans instead of zooms
  - Prevents unintended zoom while scrolling

**Validation Method**: E2E test - Verify Ctrl+Scroll zoom

---

### 2. Zoom to Specific Percentage

**User Action**: Click zoom indicator, type "250", press Enter

**Expected Behavior**:
- Zoom input field:
  - Click on "133%" in status bar
  - Field becomes editable text input
  - Current value: "133" selected
- User types "250":
  - Input: "250"
  - Validation: 250 is within 10-500% range
  - Valid input
- Press Enter:
  - Zoom applied: 2.5 (250%)
  - Centers on canvas center (no cursor reference)
  - Viewport updates immediately
  - Or: Smooth animated zoom to 250%
- Input validation:
  - Min: 10%, Max: 500%
  - Values outside range: Clamped
  - Non-numeric: Rejected, keeps current zoom
  - Decimal: Accepted (e.g., "125.5" → 125.5%)
- Visual feedback:
  - Canvas zooms to specified level
  - Indicator updates: "250%"
  - Slider matches percentage

**Validation Method**: E2E test - Verify manual zoom input

---

### 3. Zoom During Active Drawing

**User Action**: While drawing duct, zoom in to see detail, continue drawing

**Expected Behavior**:
- Duct tool active:
  - Start point placed at (100, 100) world coordinates
  - Mouse at (300, 200), about to place end point
- User zooms in (scroll wheel):
  - Zoom: 100% → 200%
  - Duct start point stays at (100, 100) world
  - Start point appears at different screen position
  - Mouse cursor position updated
- Drawing state preserved:
  - Start point remembered in world coordinates
  - Duct preview line updates for new zoom
  - Can continue drawing at new zoom level
- Click to place end point:
  - End point: Current mouse world coordinates
  - Duct created with correct world positions
  - Zoom didn't affect entity placement
- Seamless workflow:
  - Zoom in for precision
  - Place end point accurately
  - Zoom out for overview
  - All while mid-operation

**Validation Method**: Integration test - Verify zoom preserves tool state

---

### 4. Zoom with Pinch Gesture (Touchpad)

**User Action**: Pinch-to-zoom gesture on trackpad (two fingers)

**Expected Behavior**:
- Pinch gesture detected:
  - Two-finger distance increasing: Zoom in
  - Two-finger distance decreasing: Zoom out
  - Continuous gesture (not discrete)
- Zoom calculation:
  - Gesture delta converted to zoom factor
  - Pinch speed affects zoom speed
  - Fast pinch: Rapid zoom change
  - Slow pinch: Gradual zoom change
- Zoom center:
  - Centers on gesture midpoint (between two fingers)
  - Same as cursor-based zoom
  - Natural zooming behavior
- Smooth zooming:
  - Sub-pixel zoom precision
  - Very smooth transitions
  - Momentum (optional): Slight zoom continuation after release
- Platform support:
  - macOS: Native trackpad pinch
  - Windows: Precision touchpad pinch
  - Touch screen: Pinch-to-zoom

**Validation Method**: E2E test - Verify pinch-to-zoom gesture

---

### 5. Zoom and Grid Visibility

**User Action**: Zoom out to 10%, observe grid behavior

**Expected Behavior**:
- At high zoom (200%+):
  - Grid visible and prominent
  - Grid lines well-spaced (e.g., 48px at 200%)
  - Grid labels readable
- At medium zoom (50-150%):
  - Grid visible, normal spacing
  - Grid lines 12-24px apart
  - Standard appearance
- At low zoom (10-30%):
  - Grid becomes very dense
  - Too many grid lines (visual clutter)
  - Grid automatically hidden:
    - Threshold: Hide grid below 25% zoom
    - Prevents performance issues
    - Maintains clean appearance
- Grid hide threshold:
  - Configurable: 25% default
  - Optional: Adaptive grid (fewer lines at low zoom)
  - Or: Multi-scale grid (major/minor lines)
- User can force grid visibility:
  - Setting: "Always show grid"
  - Overrides automatic hiding

**Validation Method**: Integration test - Verify grid visibility at different zooms

---

## Error Scenarios

### 1. Zoom Calculation Overflow

**Scenario**: Rapid zoom produces extremely large zoom value (>1000x)

**Expected Handling**:
- Overflow detection:
  - Validate calculated zoom before applying
  - Check for values > maximum (5.0)
  - Check for NaN, Infinity
- Clamping:
  - Zoom clamped to maximum: 5.0 (500%)
  - Invalid values rejected
  - Previous valid zoom maintained
- Error logging:
  - "Zoom overflow detected, clamped to maximum"
  - Technical details logged
- User experience:
  - Zoom stops at 500%
  - No visual glitches
  - Can continue zooming normally
  - No crash or error dialog

**Validation Method**: Unit test - Verify zoom overflow protection

---

### 2. Zoom-to-Cursor Math Error

**Scenario**: Pan adjustment calculation fails during zoom-to-cursor

**Expected Handling**:
- Zoom-to-cursor calculation error
- Fallback to center-based zoom:
  - Use canvas center as zoom origin
  - Ignore cursor position
  - Apply zoom normally
- Warning logged:
  - "Zoom-to-cursor failed, using center zoom"
- User sees:
  - Zoom works but doesn't track cursor
  - Slightly unexpected behavior
  - Can retry zoom (may succeed)
  - No crash

**Validation Method**: Unit test - Verify zoom fallback on error

---

### 3. Zoom During Background Operation

**Scenario**: User zooms while auto-save is writing file

**Expected Handling**:
- Zoom operation independent of save:
  - Zoom updates viewport (view state)
  - Save writes entity data (design state)
  - No conflict
- Both complete successfully:
  - Zoom applied immediately
  - Save continues in background
- Performance maintained:
  - Zoom doesn't block save
  - Save doesn't block zoom
  - Smooth user experience

**Validation Method**: Integration test - Verify zoom during background tasks

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Zoom In | `Ctrl/Cmd + Plus` or `Ctrl/Cmd + =` |
| Zoom Out | `Ctrl/Cmd + Minus` or `Ctrl/Cmd + -` |
| Reset Zoom to 100% | `Ctrl/Cmd + 0` |
| Zoom to Fit All | `Ctrl/Cmd + 1` |
| Zoom to Selection | `Ctrl/Cmd + 2` |
| Zoom with Wheel | `Scroll Wheel` or `Ctrl + Scroll` |

---

## Related Elements

- [viewportStore](../../elements/02-stores/viewportStore.md) - Zoom state management
- [CanvasRenderer](../../elements/03-rendering/CanvasRenderer.md) - Zoom rendering
- [ZoomControls](../../elements/01-components/canvas/ZoomControls.md) - Zoom UI controls
- [InputHandler](../../elements/08-systems/InputHandler.md) - Zoom input handling
- [UJ-CN-001](./UJ-CN-001-PanCanvas.md) - Pan navigation (related)
- [UJ-CN-003](./UJ-CN-003-FitToView.md) - Fit all content (related)

---

## Visual Diagram

```
Zoom Levels Visualization
┌────────────────────────────────────────────────────────┐
│  10% Zoom (Minimum):                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Tiny room]  [Tiny room]  [Tiny room]           │  │
│  │ [Tiny room]  [Tiny room]  [Tiny room]           │  │
│  │ ... (many entities visible, very small)          │  │
│  └──────────────────────────────────────────────────┘  │
│  Overview - see entire large project                   │
│                                                        │
│  100% Zoom (Default):                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ┌───────┐    ┌───────┐                          │  │
│  │  │ Room1 │    │ Room2 │                          │  │
│  │  └───────┘    └───────┘                          │  │
│  │                                                   │  │
│  │  ┌───────┐                                        │  │
│  │  │ Room3 │                                        │  │
│  │  └───────┘                                        │  │
│  └──────────────────────────────────────────────────┘  │
│  Normal view - comfortable working scale               │
│                                                        │
│  500% Zoom (Maximum):                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ┌────────────────────                           │  │
│  │  │                                                │  │
│  │  │   Room 1                                       │  │
│  │  │   (only corner visible)                        │  │
│  │  │                                                │  │
│  │  │                                                │  │
│  └──────────────────────────────────────────────────┘  │
│  Detail view - see fine details, small area visible    │
└────────────────────────────────────────────────────────┘

Zoom-to-Cursor Behavior:
┌────────────────────────────────────────────────────────┐
│  Before Zoom:                                          │
│  Viewport at zoom 1.0, pan (0, 0)                      │
│  Mouse at screen (500, 300)                            │
│  World coords at mouse: (500, 300)                     │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │         ┌──────┐                                 │  │
│  │         │ Room │                                 │  │
│  │         └──────┘                                 │  │
│  │                  × ← Mouse at (500, 300)         │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ↓ Zoom in 2x (mouse wheel up)                         │
│                                                        │
│  After Zoom:                                           │
│  Viewport at zoom 2.0, pan adjusted                    │
│  Mouse still at screen (500, 300)                      │
│  Same world coords at mouse: (500, 300)                │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │                                                  │  │
│  │                                                  │  │
│  │                  × ← Mouse at (500, 300)         │  │
│  │              ┌────────────┐                       │  │
│  │              │    Room    │ ← 2x larger           │  │
│  │              └────────────┘                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  World point (500, 300) stays under mouse cursor       │
│  Pan automatically adjusted: (-500, -300)              │
└────────────────────────────────────────────────────────┘

Zoom Calculation Formula:
┌────────────────────────────────────────────────────────┐
│  Mouse Wheel Zoom:                                     │
│  newZoom = currentZoom × (1.1 ^ scrollDelta)           │
│                                                        │
│  Example:                                              │
│  - Current zoom: 1.0 (100%)                            │
│  - Scroll up 3 notches: delta = +3                     │
│  - New zoom: 1.0 × (1.1^3) = 1.331 (133.1%)            │
│                                                        │
│  Keyboard Zoom:                                        │
│  Zoom In:  newZoom = currentZoom × 1.1                 │
│  Zoom Out: newZoom = currentZoom × 0.9                 │
│                                                        │
│  Pan Adjustment (zoom-to-cursor):                      │
│  worldX = (screenX - panX) / zoom                      │
│  worldY = (screenY - panY) / zoom                      │
│                                                        │
│  After zoom, maintain same world coords at cursor:     │
│  newPanX = screenX - (worldX × newZoom)                │
│  newPanY = screenY - (worldY × newZoom)                │
└────────────────────────────────────────────────────────┘

Zoom Indicator UI:
┌────────────────────────────────────────────────────────┐
│  Status Bar:                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [...] [🔍 133%] [Grid: 12"]  [...]              │  │
│  │         ↑                                        │  │
│  │    Clickable zoom indicator                      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Zoom Slider (optional):                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [-]  ━━━━●━━━━━━━━  [+]                        │  │
│  │       10%  ↑  500%                               │  │
│  │          133%                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Zoom Presets (buttons):                               │
│  [10%] [25%] [50%] [100%] [200%] [Fit All]             │
└────────────────────────────────────────────────────────┘

Zoom Limits:
┌────────────────────────────────────────────────────────┐
│  Zoom Range: 10% (0.1) to 500% (5.0)                   │
│                                                        │
│   0.1         1.0         5.0                          │
│    │──────────●──────────│                             │
│   Min      Default      Max                            │
│   10%       100%       500%                            │
│                                                        │
│  Beyond Min: Clamped to 0.1                            │
│  Beyond Max: Clamped to 5.0                            │
│  Visual feedback at limits (bounce, tooltip)           │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/stores/viewportStore.zoom.test.ts`

**Test Cases**:
- Set zoom level
- Zoom clamping to min/max
- Zoom increment calculation
- Zoom-to-cursor pan adjustment
- Zoom limit enforcement
- Zoom coordinate transformations

**Assertions**:
- Zoom stored correctly
- Values clamped to 0.1-5.0 range
- Wheel zoom: multiply by 1.1^delta
- Pan adjusted to keep cursor point stable
- Cannot zoom beyond limits
- Screen ↔ world conversion at different zooms

---

### Integration Tests
**File**: `src/__tests__/integration/zoom-canvas.test.ts`

**Test Cases**:
- Complete zoom workflow (wheel)
- Keyboard zoom shortcuts
- Manual zoom input
- Zoom during other tool operations
- Zoom with large project (1000+ entities)
- Zoom limit boundary behavior

**Assertions**:
- Viewport zoom updates in store
- Canvas re-renders at new zoom
- Keyboard shortcuts trigger zoom
- Manual input applies correct zoom
- Tool state preserved during zoom
- Performance maintained (60fps)

---

### E2E Tests
**File**: `e2e/canvas-navigation/zoom-canvas.spec.ts`

**Test Cases**:
- Visual zoom with mouse wheel
- Visual zoom with keyboard (Ctrl +/-)
- Zoom indicator updates
- Zoom slider interaction
- Cursor-based zoom centering
- Grid visibility at different zooms

**Assertions**:
- Canvas content scales visually
- Zoom percentage updates in UI
- Slider position matches zoom level
- World point stays under cursor during zoom
- Grid hidden at very low zoom
- Smooth zoom transitions

---

## Common Pitfalls

### ❌ Don't: Zoom without adjusting pan (cursor doesn't track)
**Problem**: Content jumps away from cursor during zoom

**Solution**: Calculate and apply pan adjustment to keep cursor world point stable

---

### ❌ Don't: Use linear zoom increments
**Problem**: Zoom feels inconsistent (10% increment huge at low zoom, tiny at high zoom)

**Solution**: Use multiplicative zoom (1.1x per increment) for exponential scaling

---

### ❌ Don't: Allow unlimited zoom
**Problem**: Extreme zoom causes rendering issues, performance problems

**Solution**: Enforce min 10% and max 500% zoom limits

---

### ✅ Do: Provide visual zoom percentage indicator
**Benefit**: User knows exact zoom level, can return to 100% easily

---

### ✅ Do: Support multiple zoom methods (wheel, keyboard, pinch)
**Benefit**: Accessibility and user preference accommodation

---

## Performance Tips

### Optimization: Viewport Culling at Low Zoom
**Problem**: Rendering 10,000 tiny entities at 10% zoom lags

**Solution**: Cull very small entities below pixel threshold
- Calculate entity screen size at current zoom
- Skip rendering if <2px
- Maintains 60fps even with massive projects

---

### Optimization: LOD (Level of Detail) Based on Zoom
**Problem**: Rendering complex entity details at 10% zoom wastes GPU

**Solution**: Simplify rendering at low zoom levels
- High zoom (200%+): Full detail (rounded corners, gradients)
- Medium zoom (50-150%): Normal detail
- Low zoom (<50%): Simplified (rectangles, no text)
- 3x faster rendering at low zoom

---

### Optimization: Cache Zoom Transformations
**Problem**: Recalculating zoom matrix every frame is expensive

**Solution**: Cache transformation matrix, recalculate only on zoom change
- Pre-calculate scale matrix
- Reuse for all entity rendering
- 10% performance improvement

---

## Future Enhancements

- **Smooth Zoom Animation**: Animated transitions between zoom levels
- **Zoom History**: Navigate through zoom/pan history (back/forward)
- **Focus Zoom**: Click entity, press F to zoom and center on it
- **Zoom Presets**: Save favorite zoom levels for quick access
- **Adaptive Grid**: Multi-scale grid that adjusts density with zoom
- **Zoom Extent**: Auto-calculate optimal zoom for all content
- **Magnifier Tool**: Temporary zoom lens for detail inspection
- **Zoom Lock**: Prevent accidental zoom changes
- **Synchronized Zoom**: Multiple viewports zoom together
- **Zoom to Percentage**: Right-click zoom indicator for preset menu
