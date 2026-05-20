# [UJ-FM-001] Manual Save (Tauri Offline)

## Overview
This user journey covers the workflow for manually saving an HVAC project in the **Native Desktop Environment**. "Saving" commits the project state directly to the file system (`.hvac` JSON file).

## Prerequisites
- **File Handle**: Project may have an associated file path (if opened previously).
- **Permissions**: App allows File System Write access.

## User Journey Steps

### Step 1: Trigger Manual Save
**User Action**: Press `Ctrl+S` (Windows) / `Cmd+S` (macOS) or Toolbar Save.
**System Response**:
- **Check**: Does project have an existing file path?
  - **Yes**: Write directly to that path.
  - **No**: Trigger "Save As" flow ([UJ-FM-003](./UJ-FM-003-SaveAs.md)).

### Step 2: Write Operation
**System Action**:
1. Serialize `ProjectFile` from stores.
2. **Native FS**: Use `tauri::fs::write_text_file`.
3. **Atomic Write**: Write to temporary file -> Rename to target (prevents corruption on crash).
4. Update Window Title (remove dirty flag `*`).
5. Toast: "Saved to D:\Projects\MyDesign.hvac".

## Edge Cases

### 1. File Locked / Permission Denied
**Scenario**: File is open in another app or user lacks write permission.
**Handling**:
- **Error Dialog**: "Unable to save file. Permission denied."
- **Prompt**: Offer "Save As..." to a new location.

### 2. Disk Full
**Scenario**: Drive C: is full.
**Handling**:
- **Error**: "Disk Full".
- **Safety**: Atomic write ensures the original file is preserved.

## Related Documentation
- [Save As](./UJ-FM-003-SaveAs.md)
- [Load Project](./UJ-FM-004-LoadProjectFromFile.md)

## Related Elements

### Stores
- [ProjectStore](../../../../elements/02-stores/projectStore.md)

### Services
- [ProjectIO](../../../../elements/10-persistence/ProjectIO.md)
- [FileSystem](../../../../elements/10-persistence/FileSystem.md)
