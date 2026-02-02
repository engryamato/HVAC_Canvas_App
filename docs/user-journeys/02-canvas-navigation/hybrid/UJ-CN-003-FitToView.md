# [UJ-CN-003] Fit to View (Hybrid/Web)

## Overview
This user journey covers automatically adjusting the viewport to fit entities in the **Web Environment**. It accounts for dynamic browser behaviors like address bar resizing and mobile orientation changes.

## Prerequisites
- **Viewport Unit**: Application container uses `100dvh` to account for mobile browser address bars.
- **Observer**: `ResizeObserver` monitors container size changes.

## User Journey Steps

### Step 1: Trigger Fit All
**User Action**: Press `Shift + 1` (Mapped to avoid Browser `Ctrl+1` Tab switching).
**System Response**:
- **Calculation**: Standard bounding box logic.
- **Viewport Check**: Uses `visualViewport.height` if available to account for on-screen keyboards.
- **Animation**: Uses CSS transitions or `requestAnimationFrame` for smooth browser-compatible effects.

### Step 2: Browser Window Resize
**User Action**: User resizes browser window / rotates mobile device.
**System Response**:
- **Event**: `ResizeObserver` fires.
- **Logic**:
  - If in "Fit All" mode (flag active), auto-recalculate fit.
  - If not, adjust Pan to keep center point stable relative to new center.

## Edge Cases (Web Specific)

### 1. Mobile Address Bar Hiding
**Scenario**: User scrolls, address bar retracts, changing viewport height.
**Handling**:
- **CSS**: `dvh` units adjust background automatically.
- **Canvas**: `resize` event listener updates projection matrix without full re-render if possible.

### 2. Browser Zoom Interaction
**Scenario**: User has Browser Zoom set to 125%.
**Handling**:
- **Math**: fit logic reads `window.devicePixelRatio` to ensure 10% padding is physical pixels, not just logical pixels.

## Performance
- **Debounce**: Resize events debounced (e.g. 100ms) to prevent Thrashing during drag-resize.

## Related Elements

### Components
- [ZoomControls](../../../../elements/01-components/canvas/ZoomControls.md)

### Stores
- [viewportStore](../../../../elements/02-stores/viewportStore.md)

## Related Journeys
- [Zoom Canvas](./UJ-CN-002-ZoomCanvas.md)
