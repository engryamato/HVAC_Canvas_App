# [UJ-CN-003] Fit to View (Tauri Offline)

## Overview
This user journey covers automatically adjusting the viewport to fit entities in the **Native Desktop Environment**. It accounts for high-performance window resizing and multi-monitor setups.

## Prerequisites
- **Window**: Native OS window (resizable).
- **Shortcut**: `Ctrl+1` (Standard Desktop Mapping).

## User Journey Steps

### Step 1: Trigger Fit All
**User Action**: Press `Ctrl + 1` or Toolbar Button.
**System Response**:
- **Calculation**: Native bounding box parallelized if needed (using Rayon in Rust backend / WebAssembly).
- **Update**: Immediate viewport matrix update.
- **Animation**: 144hz compliant spring animation if enabled.

### Step 2: Window Maximization
**User Action**: User double-clicks window title bar to maximize.
**System Response**:
- **Event**: `tauri://resize` or standard window resize.
- **Behavior**: Canvas buffer resizes instantly (zero latency). Center point of view is preserved relative to the content content.

## Edge Cases (Native Specific)

### 1. Multi-Monitor Drag
**Scenario**: User drags window from 4K monitor to 1080p monitor.
**Handling**:
- **DPI Change**: App detects `scale-factor-changed`.
- **Fit**: If "Fit All" was active, it re-evaluates bound calculation to ensure padding remains physically consistent (e.g. 20px padding visually same on both screens).

### 2. Ultrawide Monitors
**Scenario**: User maximizes on 32:9 Aspect Ratio monitor.
**Handling**:
- **Aspect Ratio**: Fit Logic ensures logic uses `min(scaleX, scaleY)` correctly handling extreme aspect ratios.
- **Culling**: Frustum culling updates to include wider horizontal FOV.

## Performance
- **Resize Loop**: Tightly coupled with Render Loop. No `requestAnimationFrame` lag.

## Related Elements

### Components
- [ZoomControls](../../../../elements/01-components/canvas/ZoomControls.md)

### Stores
- [viewportStore](../../../../elements/02-stores/viewportStore.md)

## Related Journeys
- [Zoom Canvas](./UJ-CN-002-ZoomCanvas.md)
