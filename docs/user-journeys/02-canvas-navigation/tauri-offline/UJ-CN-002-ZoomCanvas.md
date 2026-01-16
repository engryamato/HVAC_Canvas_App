# [UJ-CN-002] Zoom Canvas (Tauri Offline)

## Overview
This user journey covers zooming the canvas in the **Native Desktop Environment**. It uses direct hardware acceleration and supports standard desktop shortcuts without browser conflicts.

## Prerequisites
- **Input**: Mouse Wheel or Touchscreen.
- **Hardware**: GPU support for smooth interpolation at non-integer scales.

## User Journey Steps

### Step 1: Zoom with Mouse Wheel
**User Action**: Scroll wheel up.
**System Response**:
- **Event**: Native `wheel` event passed directly to Viewport Controller.
- **Scaling**: Immediate application of scale matrix.
- **Precision**: high-precision `deltaY` from gaming mice is supported.

### Step 2: Native Pinch Zoom (Touchpad/Touchscreen)
**User Action**: Two-finger pinch.
**System Response**:
- **API**: Uses OS-level Gesture API (e.g. `NSEventTypeMagnify` on macOS, `WM_GESTURE` on Windows).
- **Behavior**: Extremely smooth, pixel-perfect 1:1 finger tracking.
- **Inertia**: Native momentum continues zoom slightly after release.

## Edge Cases (Native Specific)

### 1. 4K/Retina Display
**Scenario**: User drags window between 1080p and 4K screens.
**Handling**:
- App handles DPI scaling automatically via Tauri/OS windows.
- Canvas re-computes `devicePixelRatio` on `window-monitor-changed` event to maintain physical scale.

### 2. Maximum Zoom Performance
**Scenario**: Zooming in to 5000% on a large texture.
**Handling**:
- **Mipmapping**: GPU automatically selects lower-res texture mips for performance if implemented, or uses Nearest-Neighbor for pixel art precision at high zoom.

## Performance
- **Render Loop**: Decoupled from Event Loop.
- **Latency**: Sub-frame latency for input-to-render.

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
