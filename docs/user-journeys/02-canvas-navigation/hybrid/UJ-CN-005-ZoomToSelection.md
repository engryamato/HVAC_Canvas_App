# [UJ-CN-005] Zoom to Selection (Hybrid/Web)

## Overview
This user journey covers fitting only the *selected* entities to the viewport in the **Web Environment**.

## Prerequisites
- **Selection**: Entities selected.
- **Shortcut**: `Shift + 2` (Recommended to avoid `Ctrl+2` Browser tab conflicts).

## User Journey Steps

### Step 1: Trigger
**User Action**: Press `Shift + 2`.
**System Response**:
- **Calculation**: Bounding box of `selectedIds`.
- **Fit**: Same logic as [Fit to View](./UJ-CN-003-FitToView.md) but restricted to selection bounds.

### Step 2: Edge Cases
**Scenario**: Selecting a text input field on Canvas.
**Handling**:
- **Focus**: Ensure Canvas keeps focus or re-acquires it after button click to capture shortcut.

## Related Documentation
- [Fit to View](./UJ-CN-003-FitToView.md)
