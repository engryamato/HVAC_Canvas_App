# [UJ-PM-008] Export Project Report (Tauri Offline)

## Overview

### Purpose
This document describes how users export project reports in the Tauri Desktop platform.

### Scope
- Generating PDFs using `jsPDF`
- Native Save File Dialog
- File System Write

### User Personas
- **Primary**: Designers delivering reports

### Success Criteria
- PDF generated client-side
- Native Save Dialog allows path selection
- File written to disk

### Platform Summary (Tauri Offline)
- **Generation**: Client-side (jsPDF) -> `Uint8Array`
- **Delivery**: `dialog.save()` -> `fs.writeBinaryFile()`
- **Benefit**: User chooses location/name *before* saving.

## Prerequisites
- Project loaded in Canvas

## User Journey Steps

### Step 1: Initiate Export
**User Action**: Click "Export Report".
**System Response**: Show Options Dialog.

### Step 2: Configure & Generate
**User Action**: Click "Export".
**System Response**:
1. Show Native "Save As" Dialog.
2. User selects path.
3. Generate PDF in memory.
4. Write binary data to selected path.
5. Show "Report Saved" Toast.
6. Open "Show in Folder" option.

## Edge Cases
- **Permission Denied**: If saving to protected folder.
- **Cancel Save**: User cancels dialog -> Abort generation.

## Related Elements
- `ExportDialog`
- `ReportGenerator`
- `FileSystemService`
