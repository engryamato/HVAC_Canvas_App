# [UJ-CN-007] Viewport Bounds (Hybrid/Web)

## Overview
This user journey covers restricting the viewport navigation within specific limits in the **Web Environment**.

## Prerequisites
- **Units**: Uses `CSS Pixel` logical units.
- **Safe Area**: accounts for `safe-area-inset-*` (Mobile Notches).

## User Journey Steps

### Step 1: Pan Limits
**User Action**: User attempts to Pan infinitely.
**System Response**:
- **Constraint**: Clamped to `Content Bounds + Margin`.
- **Feedback**: Elastic effect (Rubber-banding) on Mac/iOS trackpads (if supported/emulated) or hard stop.

### Step 2: Resize Bounds
**User Action**: Browser Resized.
**System Response**:
- **Updates**: `Clamp` function re-run to ensure center point is still valid within new aspect ratio.

## Edge Cases (Web Specific)

### 1. Address Bar
**Scenario**: Mobile Address Bar expands/collapses.
**Handling**:
- **Dynamic Monitoring**: Logic uses `visualViewport` to update Bottom Clamp limit in real-time.

## Related Documentation
- [Pan Canvas](./UJ-CN-001-PanCanvas.md)
