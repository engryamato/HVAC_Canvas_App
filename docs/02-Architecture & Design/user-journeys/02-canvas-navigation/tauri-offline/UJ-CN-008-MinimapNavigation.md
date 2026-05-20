# [UJ-CN-008] Minimap Navigation (Tauri Offline)

## Overview
This user journey covers the minimap navigation in the **Native Desktop Environment**. It leverages desktop class GPU performance for smooth, constant-framerate updates.

## Prerequisites
- **Hardware**: Dedicated or Integrated GPU.
- **Windowing**: Single or Multi-window support (Pop-out minimap).

## User Journey Steps

### Step 1: Render Minimap
**User Action**: Project Loads.
**System Response**:
- **Technique**: High-frequency render pass.
- **Optimization**: Uses simplified shaders for minimap view to handle millions of entities.

### Step 2: Pop-Out Minimap (Optional)
**User Action**: User clicks "Undock" icon on minimap.
**System Response**:
- **Window Creation**: Spawns a new Tauri Window (`minimap-window`).
- **Sync**: State is synchronized via Rust backend (Shared Memory) or IPC.
- **Monitor**: User can drag minimap to a second monitor.

## Edge Cases (Native Specific)

### 1. Window Focus
**Scenario**: User clicks inside Minimap Window.
**Handling**:
- **Focus**: Application focus logic ensures Key Events (like ESC) still route to the Active Tool or Global Handler.

### 2. GPU Resource Limit
**Scenario**: VRAM exhausted.
**Handling**:
- **Fallback**: Texture compression or lower resolution minimap texture.

## Performance
- **Sync**: Minimap renders continuously in sync with Main Canvas (VSync).

## Related Elements

### Components
- [Minimap](../../../../elements/01-components/canvas/Minimap.md)

## Related Journeys
- [Zoom Canvas](./UJ-CN-002-ZoomCanvas.md)
