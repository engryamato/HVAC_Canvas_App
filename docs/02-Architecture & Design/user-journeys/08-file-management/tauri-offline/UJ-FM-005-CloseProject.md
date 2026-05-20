# [UJ-FM-005] Close Project (Tauri Offline)

## Overview
This user journey covers closing the current project in the **Native Desktop Environment**.

## Prerequisites
- **Shortcut**: `Ctrl + W` (Close Project, not Window).

## User Journey Steps

### Step 1: Trigger Close
**User Action**: Press `Ctrl + W` or File > Close.
**System Response**:
- **Check**: Are there unsaved changes?
  - **Yes**: Show Native Modal Dialog (System Level).
  - **No**: Proceed.

### Step 2: Dashboard Return
**System Action**:
1. Clear Stores.
2. Navigate to Dashboard View (Start Screen).
3. Unlock any file handles if necessary.

## Edge Cases

### 1. Window Close
**Scenario**: User clicks "X" on Window or `Alt + F4`.
**Handling**:
- **Event**: `CloseRequested`.
- **Warning**: "You have unsaved changes. Save before quitting?" (Yes / No / Cancel).

## Related Documentation
- [Unsaved Changes Warning](./UJ-FM-006-HandleUnsavedChangesWarning.md)
