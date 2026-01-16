# [UJ-EXP-001] Export To PDF (Tauri Offline)

## Overview
This user journey covers exporting the current canvas as a PDF document in the **Native Desktop Environment**.

## Prerequisites
- **Dialog**: `tauri::api::dialog::save`.
- **Generation**: Rust-based (lopdf) or Headless Render.

## User Journey Steps

### Step 1: Trigger Export
**User Action**: File > Export > PDF.
**System Response**:
- **Dialog**: Native Save As.
- **Filter**: `Data Export (*.pdf)`.

### Step 2: Generation
**User Action**: User confirms path.
**System Response**:
- **Action**: Generates PDF binary.
- **Write**: Writes to disk.
- **Feedback**: "Export Successful". Open Folder?

## Related Documentation
- [Export CSV](./UJ-EXP-002-ExportToCSV.md)