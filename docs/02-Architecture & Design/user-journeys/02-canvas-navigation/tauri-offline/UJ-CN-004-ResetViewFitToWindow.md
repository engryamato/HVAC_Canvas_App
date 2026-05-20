# [UJ-CN-004] Reset View / Fit to Window (Tauri Offline)

## Overview
This user journey describes how users reset the canvas viewport to fit all entities in the **Native Desktop Environment**.

## Prerequisites
- **API**: `WebviewWindow.innerSize()`.
- **Keyboard**: `Ctrl + 0` (Global Shortcut).

## User Journey Steps

### Step 1: Trigger Reset
**User Action**: Press `Ctrl + 0`.
**System Response**:
- **Calculation**: Uses current Window Logical Size.
- **Padding**: Standard 10% padding.

### Step 2: Window Snapping
**User Action**: User snaps window to half-screen (Windows Aero Snap).
**System Response**:
- **Event**: `tauri://resize`.
- **Logic**: Viewport Aspect Ratio updates instantly. "Fit" operation re-runs if previously active to maintain "Full View".

## Edge Cases (Native Specific)

### 1. Multi-DPI dragging
**Scenario**: Dragging half-snapped window to another monitor.
**Handling**:
- **Scale Factor**: App listens for `scale-factor-changed` to adjust zoom level so content *physically* remains similar size if desired, or *logically* scales to match OS preference.

## Related Elements

### Components
- [ZoomControls](../../../../elements/01-components/canvas/ZoomControls.md)

### Stores
- [viewportStore](../../../../elements/02-stores/viewportStore.md)

## Related Journeys
- [Fit to View](./UJ-CN-003-FitToView.md)
