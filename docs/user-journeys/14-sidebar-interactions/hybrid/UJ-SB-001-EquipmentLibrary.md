# [UJ-SB-001] Equipment Library (Hybrid/Web)

## Overview
This user journey covers dragging equipment from the sidebar to the canvas in the **Web Environment**.

## Prerequisites
- **Input**: Mouse or Touch.
- **Library**: HTML5 Drag and Drop API (with Mobile Polyfill).

## User Journey Steps

### Step 1: Browse Items
**User Action**: Tap/Click Category.
**System Response**:
- **Mobile**: Expands Accordion (Full Height).
- **Desktop**: Expands List.

### Step 2: Drag Start
**User Action**: Long-press (Touch) or Click+Drag (Mouse).
**System Response**:
- **Event**: `dragstart` / `touchstart`.
- **Feedback**: Ghost Image generated via `setDragImage` or custom DOM Overlay (for Mobile Safari support).
- **Scroll**: Auto-scroll of sidebar disabled during drag.

### Step 3: Drop
**User Action**: Release over Canvas.
**System Response**:
- **Event**: `drop` / `touchend`.
- **Action**: Add Entity at (ClientX, ClientY) converted to World Coordinates.

## Edge Cases

### 1. Mobile Safari Scroll
**Scenario**: Dragging triggers page scroll.
**Handling**:
- **CSS**: `touch-action: none` on drag handles.
- **JS**: `e.preventDefault()` on `touchmove`.

## Related Documentation
- [Canvas Navigation](../02-canvas-navigation/hybrid/INDEX.md)