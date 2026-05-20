# [UJ-ERR-001] Application Recovery (Tauri Offline)

## Overview
This user journey covers how the Native Desktop Application handles runtime failures and critical errors.

## Prerequisites
- **Hooks**: Rust Panic Hook (`std::panic::set_hook`).
- **Frontend**: Window Error Listeners.

## User Journey Steps

### Step 1: Rust Panic (Backend Crash)
**User Action**: Internal Rust logic fails (e.g. unwrap on None).
**System Response**:
- **Hook**: Catches panic.
- **Log**: Writes to `crash.log`.
- **Dialog**: Native Error Box "Critical Error. application must restart."
- **Action**: Relaunches App.

### Step 2: JS Crash (Frontend)
**User Action**: UI Component throws error.
**System Response**:
- **Boundary**: React Error Boundary catches it.
- **Action**: "Reload Window" (Webview Refresh).
- **State**: Tries to preserve Rust-side state if possible.

## Edge Cases

### 1. File Corruption
**Scenario**: Config file corrupted.
**Handling**:
- **Backup**: Revert to default config if parsing fails.
- **Notify**: "Settings reset to defaults due to corruption."

## Related Documentation
- [Auto-Save Recovery](../08-file-management/tauri-offline/UJ-FM-009-RecoverAutosavedProject.md)