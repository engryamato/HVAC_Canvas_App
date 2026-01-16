# [UJ-CN-006] Pan with Keyboard (Hybrid/Web)

## Overview
This user journey covers panning the canvas using keyboard controls (Arrows/Space) in the **Web Environment**.

## Prerequisites
- **Focus**: Canvas element must have focus (`tabindex="0"`) or Global Window Listener.
- **Event Handling**: `e.preventDefault()` required to stop Browser Page Scroll.

## User Journey Steps

### Step 1: Arrow Key Pan
**User Action**: Press `ArrowRight`.
**System Response**:
- **Interception**: Listener detects KeyDown. Calls `e.preventDefault()` immediately.
- **Action**: Pans viewport.
- **Repeat**: Uses `requestAnimationFrame` loop while key is held to ensure smooth 60fps movement (avoiding OS key-repeat jitter).

### Step 2: Spacebar Drag
**User Action**: Hold `Space`.
**System Response**:
- **Cursor**: Changes to `Grab`.
- **Input**: Mouse movement now maps 1:1 to pan delta.
- **Browser**: Prevents "Page Down" scroll behavior of Spacebar.

## Edge Cases (Web Specific)

### 1. Form Inputs
**Scenario**: User typing in a Text Box overlaid on Canvas.
**Handling**:
- **Filter**: Key listener checks `e.target` is not `<input>` or `<textarea>` before panning.

## Related Documentation
- [Pan Canvas](./UJ-CN-001-PanCanvas.md)
