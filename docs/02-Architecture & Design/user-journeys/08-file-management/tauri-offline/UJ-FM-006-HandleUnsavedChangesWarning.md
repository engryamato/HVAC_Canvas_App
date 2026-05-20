# [UJ-FM-006] Handle Unsaved Changes (Tauri Offline)

## Overview
This user journey covers preventing data loss when a user attempts to close the application window in the **Native Desktop Environment**.

## Prerequisites
- **Event**: `tauri://close-requested`.

## User Journey Steps

### Step 1: Window Close Trigger
**User Action**: User clicks "X" on Window.
**System Response**:
- **Interception**: Rust backend / Frontend listener catches `CloseRequested`.
- **Check**: `hasUnsavedChanges`.
- **Action**: Prevent Window Close.

### Step 2: Warning Dialog
**System Action**:
1. Show Native Message Box (using `tauri::api::dialog`).
   - Title: "Unsaved Changes"
   - Body: "Do you want to save your changes before quitting?"
   - Buttons: "Save", "Don't Save", "Cancel".
2. **Handle Choice**:
   - Save: Trigger Save -> Close Window.
   - Don't Save: Close Window immediately.
   - Cancel: Keep Window open.

## Related Documentation
- [Close Project](./UJ-FM-005-CloseProject.md)
