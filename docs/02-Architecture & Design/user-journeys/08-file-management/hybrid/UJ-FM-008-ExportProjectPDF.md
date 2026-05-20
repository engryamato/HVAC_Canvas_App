# [UJ-FM-008] Export Project PDF (Hybrid/Web)

## Overview
This user journey covers exporting the current view or sheet as a PDF file in the **Web Environment**.

## Prerequisites
- **Library**: `jsPDF` or `html2canvas`.
- **Method**: Client-side generation (no server required).

## User Journey Steps

### Step 1: Trigger Export
**User Action**: Click File > Export > PDF.
**System Response**:
- **Dialog**: "Export Settings" (Scale, Paper Size).
- **Action**: Generates Blob.
- **Download**: Triggers browser download `project.pdf`.

## Edge Cases

### 1. Large Canvas
**Scenario**: Huge drawing at high DPI.
**Handling**:
- **Tiling**: Split into multiple pages or warn about size.
- **Performance**: Use Web Worker to prevent UI freeze.

## Related Documentation
- [Manual Save](./UJ-FM-001-ManualSave.md)
