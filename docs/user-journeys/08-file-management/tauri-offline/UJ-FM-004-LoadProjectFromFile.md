# [UJ-FM-004] Load Project (Tauri Offline)

## Overview
This user journey covers opening a project file (`.hvac`) from the local file system using Native Dialogs.

## Prerequisites
- **API**: `tauri::api::dialog::open`.

## User Journey Steps

### Step 1: Trigger Open
**User Action**: `Ctrl + O`.
**System Response**:
- **Dialog**: Opens Native OS File Open Dialog.
- **Filter**: `*.hvac`.

### Step 2: File Read
**User Action**: User selects file and confirms.
**System Response**:
- **Action**: App reads file content properties (metadata) first if possible, or full content.
- **Validation**: JSON Schema Check.
- **Path Storage**: App remembers this file path for future "Quick Saves" (`Ctrl+S`).

## Edge Cases

### 1. File Locked
**Scenario**: File is open in another editor (locked by OS).
**Handling**:
- **Error**: "Cannot read file. It is being used by another process."

## Related Documentation
- [Manual Save](./UJ-FM-001-ManualSave.md)
