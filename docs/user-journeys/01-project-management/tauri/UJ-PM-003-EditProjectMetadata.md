# [UJ-PM-003] Edit Project Metadata (Tauri Desktop)

## Overview

### Purpose
Describe Tauri-specific persistence and file updates when editing project metadata.

### Scope
**In Scope:**
- Editing metadata from the canvas sidebar
- Writing updates to the `.sws` file
- Updating dashboard metadata from disk

**Out of Scope:**
- Browser storage quotas (see hybrid version)

### Key Differences (Tauri)
- Metadata saves directly to the file system
- `.sws.bak` backup updated on save
- No storage quota limitations

## Primary Flow Notes (Tauri)
- Save operations call Tauri file APIs.
- Updates propagate to the dashboard list from disk metadata.

## Related Base Journey
- [Edit Project Metadata](../UJ-PM-003-EditProjectMetadata.md)

## Related Components
- `EditProjectDialog`
- `ProjectService` (file persistence)
- `projectListStore` (dashboard sync)
