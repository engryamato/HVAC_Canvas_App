# [UJ-CN-007] Viewport Bounds (Tauri Offline)

## Overview
This user journey covers restricting the viewport navigation within specific limits in the **Native Desktop Environment**.

## Prerequisites
- **Units**: Physical Pixels or Logical Points (OS Dependent).

## User Journey Steps

### Step 1: Pan Limits
**User Action**: Drag past edge.
**System Response**:
- **Constraint**: Hard stop at defined World Borders.
- **Feedback**: None (Standard desktop CAD behavior) or optional subtle bounce.

## Edge Cases

### 1. Window Resize
**Scenario**: Maximizing window.
**Handling**:
- **Bounds**: Valid movement area expands immediately.

## Related Elements

### Stores
- [viewportStore](../../../../elements/02-stores/viewportStore.md)

## Related Journeys
- [Pan Canvas](./UJ-CN-001-PanCanvas.md)
