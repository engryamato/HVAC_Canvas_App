# [UJ-PM-008] Export Project Report (Hybrid/Web)

## Overview

### Purpose
Describe exporting project reports in the browser with download-based output.

### Scope
**In Scope:**
- Export dialog configuration
- PDF generation
- Browser download flow

**Out of Scope:**
- Native save dialogs (see Tauri version)

### Key Differences (Hybrid/Web)
- Output delivered via browser download
- File name managed by browser download prompt

## Primary Flow Notes (Hybrid/Web)
- Generate PDF in memory and trigger download.
- Provide user feedback when download completes.

## Related Base Journey
- [Export Project Report](../UJ-PM-008-ExportProjectReport.md)

## Related Components
- `ExportDialog`
- `ReportGenerator`
- `DownloadService`
