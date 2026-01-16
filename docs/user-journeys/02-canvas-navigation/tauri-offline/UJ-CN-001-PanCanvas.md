# [UJ-CN-001] Pan Canvas (Tauri Offline)

## Overview
This user journey covers panning (scrolling) the canvas viewport in the **Native Desktop Environment**. It leverages direct hardware input and OS-level touch gestures for maximum performance.

## PRD References
- **FR-CN-001**: User shall be able to pan the canvas viewport

## Prerequisites
- **Input**: Mouse or Touchscreen Device.
- **Driver**: GPU Drivers installed for smooth 60fps+ rendering.

## User Journey Steps

### Step 1: Initiate Pan with Middle Mouse Button
**User Action**: Click and hold middle mouse button.

**System Response:**
- **Event Handling**: Native `mousedown` event captured immediately. No browser default behaviors (like Auto-Scroll) exist to block.
- **Cursor**: Changes to `grabbing` instantly.
- **Performance**: Direct input polling ensures zero input lag.

### Step 2: Native Touch Panning
**User Action**: Two-finger drag on Touchscreen.

**System Response:**
- **Gesture Support**: Uses OS Touch API (Windows Pointer Events / macOS Touch).
- **Smoothing**: Native inertia and friction algorithms applied.
- **Multi-tasking**: Supports multi-touch (e.g., Pan + Zoom simultaneously).

## Edge Cases (Native Specific)

### 1. High-DPI Mouse Polling
**Scenario**: User has a 1000Hz Gaming Mouse.
**Handling**:
- App processes events in batches if needed (Though Rust backend handles high frequency well).
- ensures render loop is decoupled from Input loop.

### 2. Window Resize
**Scenario**: User resizes window.
**Handling**: Viewport automatically adjusts aspect ratio without "Layout Thrashing" common in browsers.

## Performance
- **Rendering**: WebGPU / WebGL context specifically tuned for Desktop.
- **Throttling**: None. Runs at monitor refresh rate (144Hz supported).

## Related Documentation
- [Zoom Canvas](./UJ-CN-002-ZoomCanvas.md)
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
