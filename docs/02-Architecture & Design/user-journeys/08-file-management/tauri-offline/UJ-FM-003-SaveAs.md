# [UJ-FM-003] Save As (Tauri Offline)

## Overview
This user journey covers saving the current project to a new file location in the **Native Desktop Environment**.

## Prerequisites
- **API**: `tauri::api::dialog::save`.

## User Journey Steps

### Step 1: Trigger Save As
**User Action**: `Ctrl + Shift + S`.
**System Response**:
- **Dialog**: Opens Native OS File Save Dialog.
- **Filter**: `*.hvac`.
- **Default Name**: Current Project Name.

### Step 2: Confirmation
**User Action**: User selects path `D:\Backup\MyDesign_v2.hvac` and clicks Save.
**System Response**:
- **Action**: Writes file to disk.
- **Update**:
  - Updates `ProjectFile.filePath` to new path.
  - Updates Window Title.
  - Subsequent `Ctrl+S` saves to this NEW path.

## Edge Cases

### 1. Overwrite Prompt
**Scenario**: User selects existing file.
**Handling**:
- **OS**: Native Dialog handles "File already exists. Replace?" prompt naturally.

## Related Documentation
- [Manual Save](./UJ-FM-001-ManualSave.md)
