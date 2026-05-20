# [UJ-EXP-003] Export To JSON (Tauri Offline)

## Overview
This user journey covers exporting the raw project data as a JSON file in the **Native Desktop Environment**.

## Prerequisites
- **Dialog**: `tauri::api::dialog::save`.

## User Journey Steps

### Step 1: Trigger Export
**User Action**: File > Export > JSON.
**System Response**:
- **Dialog**: Native Save As `*.json`.

### Step 2: Write
**User Action**: Confirm.
**System Response**:
- **Action**: Writes formatted JSON to disk.

## Related Documentation
- [Export PDF](./UJ-EXP-001-ExportToPDF.md)