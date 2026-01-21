# [UJ-CN-002] Zoom Canvas (Hybrid/Web)

## Overview
This user journey covers zooming the canvas viewport in the **Web Environment**. Critically, it describes how to intercept Browser Native Zoom (`Ctrl + Scroll`) to ensure only the Canvas scales.

## Prerequisites
- **Browser**: Modern Chrome/Edge/Firefox.
- **Event Listeners**: Attached to `window` with `{ passive: false }` to prevent default browser zooming.

## User Journey Steps

### Step 1: Initial Zoom State
**User Action**: User loads canvas.
**System Response**:
- **Meta Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">` enforces 1:1 initial scale.
- **Device Pixel Ratio**: Canvas detects `window.devicePixelRatio` for sharp text rendering.

### Step 2: Zoom with Mouse Wheel
**User Action**: Scroll wheel up (Zoom In).
**System Response**:
- **Interception**: `wheel` listener checks for `e.ctrlKey`.
- **Logic**: If `Ctrl` is pressed, `e.preventDefault()` prevents Browser Page Zoom.
- **Scaling**: Pure Canvas scaling applied.

### Step 3: Zoom with Touch (Pinch)
**User Action**: Two-finger pinch on Trackpad/Touchscreen.
**System Response**:
- **Gesture Event**: WebKit browsers map this to `wheel` with `e.ctrlKey`.
- **Handling**: `e.preventDefault()` stops "Pinch to Zoom Page".
- **Visuals**: Canvas content scales centered on gesture midpoint.

## Edge Cases (Web Specific)

### 1. Browser Interface Zoom
**Scenario**: User uses Browser Menu > Zoom.
**Handling**:
- **Detection**: `window.visualViewport.scale` or `devicePixelRatio` changes.
- **Response**: App UI scales up, but Canvas internal resolution re-adjusts to match new pixel ratio.

### 2. Double-Tap Zoom
**Scenario**: Double-tap on Mobile/Tablet.
**Handling**: CSS `touch-action: none` prevents Browser "Smart Zoom".

## Performance
- **CSS Transforms**: Used for "preview" zoom during rapid gestures to stay responsive.
- **Re-Rasterization**: High-quality re-draw happens debounced (100ms after gesture ends) to save battery.

## Related Documentation
- [Pan Canvas](./UJ-CN-001-PanCanvas.md)

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
- Floating zoom buttons interaction
- Cursor-based zoom centering
- Grid visibility at different zooms

**Assertions**:
- Canvas content scales visually
- Zoom percentage updates in UI
- Floating controls reflect zoom level
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
