# [UJ-WF-001] Small Office Design (Tauri Offline)

## Overview
This user journey describes an end-to-end workflow for designing an HVAC system for a small office in the **Native Desktop Environment**.

## Prerequisites
- **App**: SizeWise v2.0 Installed.
- **Environment**: Windows / macOS / Linux.

## Workflow Steps

### Step 1: Launch & Create
**User Action**: Open `SizeWise.exe` -> Click "New Project".
**System Response**:
- **Action**: Opens Main Window.
- **State**: New blank project in memory.

### Step 2: Draw Boundaries
**User Action**: Select Room Tool -> Draw 20x30ft Rectangle.
**System Response**:
- **Feedback**: Snaps to Grid (GPU Accelerated).
- **Store**: Adds Room Entity.

### Step 3: Place Equipment (Mouse)
**User Action**: Drag RTU from Sidebar.
**System Response**:
- **Cursor**: Grabbing Hand.
- **Drop**: Entity added at Release Point.

### Step 4: Save & Export
**User Action**: File > Save As -> "Office.hvac".
**System Response**:
- **Dialog**: Native Save Prompt.
- **Action**: Writes Project File.

**User Action**: File > Export > PDF.
**System Response**:
- **Dialog**: Native Save Prompt ("Office.pdf").
- **Action**: Writes PDF to Disk.

## Edge Cases

### 1. File System Lock
**Scenario**: Saving to a read-only folder.
**Handling**:
- **Dialog**: Error "Permission Denied".
- **Action**: Prompt for new location.

## Related Documentation
- [Canvas Navigation](../02-canvas-navigation/tauri-offline/INDEX.md)