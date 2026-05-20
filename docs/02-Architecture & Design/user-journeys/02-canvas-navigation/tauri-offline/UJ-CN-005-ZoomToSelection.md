# [UJ-CN-005] Zoom to Selection (Tauri Offline)

## Overview
This user journey covers fitting only the *selected* entities to the viewport in the **Native Desktop Environment**.

## Prerequisites
- **Selection**: Entities selected.
- **Shortcut**: `Ctrl + 2`.

## User Journey Steps

### Step 1: Trigger
**User Action**: Press `Ctrl + 2`.
**System Response**:
- **Calculation**: Native Bounding Box.
- **Animation**: Physics-based spring animation to target.

## Edge Cases

### 1. No Selection
**Scenario**: User presses `Ctrl+2` with empty selection.
**Handling**:
- **Fallback**: Briefly shakes viewport or shows toast "No Selection". Does *not* fallback to Fit All to avoid user confusion.

## Related Elements

### Components
- [ZoomControls](../../../../elements/01-components/canvas/ZoomControls.md)

### Stores
- [viewportStore](../../../../elements/02-stores/viewportStore.md)

## Related Journeys
- [Fit to View](./UJ-CN-003-FitToView.md)
