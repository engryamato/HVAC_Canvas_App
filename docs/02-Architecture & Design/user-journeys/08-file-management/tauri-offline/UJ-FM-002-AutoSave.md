# [UJ-FM-002] Auto-Save (Tauri Offline)

## Overview
This user journey covers the automatic background saving of project changes to the **File System**.

## Prerequisites
- **File Path**: Project must have a valid file path (Saved at least once).
- **Settings**: Auto-Save Enabled (Default: On).

## User Journey Steps

### Step 1: Change Detection
**User Action**: User modifies an Entity.
**System Response**:
- **Timer**: 300-second interval (Configurable).

### Step 2: Write Execution
**System Action**: Timer fires.
**System Response**:
- **Atomic Write**:
  1. Write to `ProjectName.sws.tmp`.
  2. Rename `ProjectName.sws.tmp` -> `ProjectName.sws`.
- **Status**: Small indicator "Saved" in status bar.
- **Safety**: If file is locked, retries 3 times before warning user.

## Edge Cases

### 1. New Project (No Path)
**Scenario**: User creates "Untitled" and relies on AutoSave.
**Handling**:
- **Temp Save**: Application saves to `%APPDATA%/SizeWise/AutoSaves/Untitled_{Date}.sws`.
- **Restoration**: If app crashes, "Untitled" works are recovered from this temp folder.

## Related Documentation
- [Manual Save](./UJ-FM-001-ManualSave.md)
