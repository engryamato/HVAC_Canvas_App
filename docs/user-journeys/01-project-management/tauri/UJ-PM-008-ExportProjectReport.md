# [UJ-PM-008] Export Project Report (Tauri Desktop)

## Overview

### Purpose
Describe exporting reports with a native save dialog in Tauri.

### Scope
**In Scope:**
- Export dialog flow in the canvas
- PDF generation
- Native save dialog and file write

**Out of Scope:**
- Browser download behavior (see hybrid version)

### Key Differences (Tauri)
- Native save dialog for output location
- File written directly to disk

## Primary Flow Notes (Tauri)
- Use Tauri dialog APIs to choose output path.
- Write PDF to disk and show success feedback.

## Related Base Journey
- [Export Project Report](../UJ-PM-008-ExportProjectReport.md)

## Related Components
- `ExportDialog`
- `ReportGenerator`
- `FileDialogService`
