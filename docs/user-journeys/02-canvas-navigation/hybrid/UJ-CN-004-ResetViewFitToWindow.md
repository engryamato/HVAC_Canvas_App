# [UJ-CN-004] Reset View / Fit to Window (Hybrid/Web)

## Overview
This user journey describes how users reset the canvas viewport to fit all entities. In the **Web Environment**, this respects the dynamic browser viewport (address bar, keyboard).

## Prerequisites
- **API**: `window.visualViewport` (preferred) or `window.innerWidth/Height`.
- **Keyboard**: Standard `Ctrl + 0`.

## User Journey Steps

### Step 1: Trigger Reset
**User Action**: Press `Ctrl + 0`.
**System Response**:
- **Rect Calculation**: Uses `visualViewport` to determine the "Safe Area" for rendering.
- **Insets**: Adds extra padding at bottom if standard Browser UI elements are detected overlaying content.

### Step 2: Orientation Change (Mobile)
**User Action**: Rotate Device.
**System Response**:
- **Auto-Fit**: If `Fit Mode` was active, re-triggers fit operation.

## Edge Cases (Web Specific)

### 1. Virtual Keyboard
**Scenario**: User has virtual keyboard open on Mobile.
**Handling**:
- **Fit**: Logic accounts for reduced vertical height (`visualViewport.height`) to ensures content is not hidden behind keyboard.

## Related Elements

### Components
- [ZoomControls](../../../../elements/01-components/canvas/ZoomControls.md)

### Stores
- [viewportStore](../../../../elements/02-stores/viewportStore.md)

## Related Journeys
- [Fit to View](./UJ-CN-003-FitToView.md)
