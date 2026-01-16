# [UJ-EXP-003] Export To JSON (Hybrid/Web)

## Overview
This user journey covers exporting the raw project data as a JSON file in the **Web Environment**.

## Prerequisites
- **Data**: Full Project State (Stores).

## User Journey Steps

### Step 1: Trigger Export
**User Action**: File > Export > JSON (Debug/Backup).
**System Response**:
- **Action**: `JSON.stringify` state.
- **Download**: Creates Blob -> `<a download="Project_Dump.json">`.

## Related Documentation
- [Export PDF](./UJ-EXP-001-ExportToPDF.md)