# [UJ-FM-010] Import Reference Image (Tauri Offline)

## Overview
This user journey covers importing an image file as a background reference in the **Native Desktop Environment**.

## Prerequisites
- **API**: `tauri::api::dialog::open`.

## User Journey Steps

### Step 1: Trigger Import
**User Action**: Click "Import Image" button.
**System Response**:
- **Dialog**: Native File Open Dialog.
- **Filter**: `*.jpg; *.png; *.svg`.

### Step 2: Processing
**User Action**: Select file.
**System Response**:
- **Read**: App reads file directly from path.
- **Optimization**: Can potentially stream or reference file directly without full Base64 conversion if using `asset://` protocol.

## Related Documentation
- [Load Project](./UJ-FM-004-LoadProjectFromFile.md)
