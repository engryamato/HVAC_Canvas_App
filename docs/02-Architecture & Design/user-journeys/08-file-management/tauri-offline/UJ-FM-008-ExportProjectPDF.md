# [UJ-FM-008] Export Project PDF (Tauri Offline)

## Overview
This user journey covers exporting the current view or sheet as a PDF file in the **Native Desktop Environment**.

## Prerequisites
- **Library**: `print-js` or Rust-based PDF generation (e.g. `lopdf`).
- **Dialog**: `tauri::api::dialog::save`.

## User Journey Steps

### Step 1: Trigger Export
**User Action**: Click File > Export > PDF.
**System Response**:
- **Dialog**: Native Save Dialog filtered to `*.pdf`.
- **Default**: `ProjectName.pdf`.

### Step 2: Generation
**User Action**: User selects path and confirms.
**System Response**:
- **Action**: Generates PDF binary.
- **Write**: Writes directly to selected path.
- **Feedback**: Options to "Open Containing Folder" or "Open PDF".

## Edge Cases

### 1. Write Error
**Scenario**: Permission denied.
**Handling**:
- **Error**: Native Message Box.

## Related Documentation
- [Manual Save](./UJ-FM-001-ManualSave.md)
