# [UJ-CN-008] Minimap Navigation (Hybrid/Web)

## Overview
This user journey covers the minimap navigation in the **Web Environment**. It utilizes `OffscreenCanvas` (where supported) to prevent UI freezing during thumbnail generation.

## Prerequisites
- **API Support**: Checks for `window.OffscreenCanvas` support. Falls back to main-thread Canvas if missing.
- **Performance**: Uses `requestIdleCallback` for thumbnail updates.

## User Journey Steps

### Step 1: Render Minimap
**User Action**: Project Loads.
**System Response**:
- **Technique**:
  - If `OffscreenCanvas` supported: Worker thread generates thumbnail.
  - If not: Main thread generates thumbnail in chunks (time-sliced) to avoid blocking interaction.
- **Responsiveness**: Minimap updates are low priority compared to Main Canvas interaction.

### Step 2: Interaction
**User Action**: Dragging Viewport Rect.
**System Response**:
- **Event**: Mouse/Touch events.
- **Browser Constraints**: Touch events require `touch-action: none` CSS to prevent browser scrolling while dragging minimap.

## Edge Cases (Web Specific)

### 1. Context Loss
**Scenario**: User switches tabs, Browser discards Canvas Context to save memory.
**Handling**:
- **Detection**: `contextlost` event.
- **Recovery**: Auto-regenerate thumbnail when tab becomes active (`visibilitychange`).

### 2. High-DPI Screens (Mobile)
**Scenario**: Retina/OLED mobile screens.
**Handling**:
- **Resolution**: Minimap renders at `1x` scale (ignore DPI) to save performance, as it is a preview only.

## Performance
- **Throttling**: Thumbnail updates throttled to 1fps when Minimap is hidden or User is performing high-cost actions (like pan/zoom).

## Related Documentation
- [Zoom Canvas](./UJ-CN-002-ZoomCanvas.md)
