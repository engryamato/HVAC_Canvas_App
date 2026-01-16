# [UJ-CN-006] Pan with Keyboard (Tauri Offline)

## Overview
This user journey covers panning the canvas using keyboard controls in the **Native Desktop Environment**.

## Prerequisites
- **Input**: Raw Keyboard Events (Scan Codes preferred for WASD layout independence).

## User Journey Steps

### Step 1: Directional Panning
**User Action**: Hold `Arrow` keys or `WASD`.
**System Response**:
- **Logic**: Input vector accumulation.
- **Physics**: Velocity-based movement (acceleration/friction) for smooth feel.

### Step 2: Spacebar Drag
**User Action**: Hold `Space`.
**System Response**:
- **Cursor**: Hides cursor and locks it in place (Infinite Pan) if supported, or standard Grab cursor.

## Edge Cases

### 1. Key Conflicts
**Scenario**: User presses `Ctrl + Arrow` (System Shortcut).
**Handling**:
- **Priority**: System shortcuts (Window Snap) take precedence. App pauses panning logic.

## Related Documentation
- [Pan Canvas](./UJ-CN-001-PanCanvas.md)
