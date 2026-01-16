# [UJ-WF-001] Small Office Design (Hybrid/Web)

## Overview
This user journey describes an end-to-end workflow for designing an HVAC system for a small office in the **Web Environment**.

## Prerequisites
- **Access**: Web Browser (Chrome/Edge).
- **Network**: Online (for initial load).

## Workflow Steps

### Step 1: Launch & Create
**User Action**: Go to `app.sizewise.com` -> Click "New Project".
**System Response**:
- **Action**: Initializes App Shell.
- **Route**: `/canvas/new`.

### Step 2: Draw Boundaries
**User Action**: Select Room Tool -> Draw 20x30ft Rectangle.
**System Response**:
- **Feedback**: Snaps to Grid.
- **Store**: Adds Room Entity.

### Step 3: Place Equipment (Touch/Mouse)
**User Action**: Drag RTU from Sidebar.
**System Response**:
- **Feedback**: Ghost Image.
- **Drop**: Entity added at Release Point.

### Step 4: Save & Export
**User Action**: Click "Export PDF".
**System Response**:
- **Action**: Generates PDF Blob.
- **Download**: Browser downloads `SmallOffice.pdf`.

## Edge Cases

### 1. Network Loss
**Scenario**: User goes offline during design.
**Handling**:
- **UI**: "Offline Mode" badge.
- **Save**: Queues to IndexedDB.

## Related Documentation
- [Canvas Navigation](../02-canvas-navigation/hybrid/INDEX.md)