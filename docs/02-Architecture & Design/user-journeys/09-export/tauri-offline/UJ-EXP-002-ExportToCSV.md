# [UJ-EXP-002] Export To CSV (Tauri Offline)

## Overview
This user journey covers exporting project data (Bill of Materials) as a CSV file in the **Native Desktop Environment**.

## Prerequisites
- **Dialog**: `tauri::api::dialog::save`.

## User Journey Steps

### Step 1: Trigger Export
**User Action**: File > Export > CSV (BOM).
**System Response**:
- **Dialog**: Native Save As `*.csv`.

### Step 2: Write
**User Action**: Confirm.
**System Response**:
- **Action**: Writes UTF-8 CSV with BOM (Byte Order Mark) to disk.

## Related Documentation
- [Export PDF](./UJ-EXP-001-ExportToPDF.md)