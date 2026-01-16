# [UJ-PM-008] Export Project Report (Hybrid/Web)

## Overview

### Purpose
This document describes how users export project reports in the Hybrid/Web platform.

### Scope
- Generating PDFs using `jsPDF`
- Browser-based download flow

### User Personas
- **Primary**: Designers delivering reports

### Success Criteria
- PDF generated client-side
- Browser initiates file download

### Platform Summary (Hybrid/Web)
- **Generation**: Client-side (jsPDF)
- **Delivery**: Blob -> Object URL -> `<a download>` click
- **Limits**: Browser memory limits for Blob size (~500MB, usually sufficient)

## Prerequisites
- Project loaded in Canvas

## User Journey Steps

### Step 1: Initiate Export
**User Action**: Click "Export Report".
**System Response**: Show Options Dialog.

### Step 2: Configure & Generate
**User Action**: Click "Export".
**System Response**:
1. Collect Data.
2. Generate PDF in memory (ArrayBuffer).
3. Create Blob.

### Step 3: Download
**System Response**:
1. Create Object URL.
2. Trigger invisible link click.
3. Browser downloads file to default Downloads folder.
4. Show Success Toast.

## Edge Cases
- **Popup Blocker**: Should not trigger if initiated by user click.
- **Mobile Save**: Behavior varies by mobile browser (Open vs Download).

## Related Elements
- `ExportDialog`
- `ReportGenerator`
