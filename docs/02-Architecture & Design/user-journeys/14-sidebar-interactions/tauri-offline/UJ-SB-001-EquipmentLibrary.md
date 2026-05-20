# [UJ-SB-001] Equipment Library (Tauri Offline)

## Overview
This user journey covers dragging equipment from the sidebar to the canvas in the **Native Desktop Environment**.

## Prerequisites
- **Input**: Mouse / Trackpad.

## User Journey Steps

### Step 1: Browse Items
**User Action**: Click Category.
**System Response**:
- **Action**: Expands Category.
- **Hover**: Shows Tooltip with metadata (Size/Power).

### Step 2: Drag Start
**User Action**: Click and Drag Item.
**System Response**:
- **Event**: `dragstart`.
- **Cursor**: `grabbing`.
- **Feedback**: High-fidelity Ghost Image (Opalescent).

### Step 3: Drop
**User Action**: Release Left Mouse Button.
**System Response**:
- **Action**: Snap to Grid placement.
- **Modify**: Hold `Shift` to disable snap.

## Related Documentation
- [Canvas Navigation](../02-canvas-navigation/tauri-offline/INDEX.md)
