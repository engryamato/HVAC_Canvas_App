# [UJ-PM-008] Export Project Report (Hybrid/Web)

## 1. Overview

### Purpose
This document describes exporting project reports in the browser, including PDF generation, download flow, and user feedback.

### Scope
- Opening the export dialog from the canvas
- Configuring report options
- Generating PDF client-side
- Triggering browser download

### User Personas
- **Primary**: Designers delivering reports to clients
- **Secondary**: Project managers reviewing documentation
- **Tertiary**: Sales teams packaging deliverables

### Success Criteria
- Export dialog opens with correct options
- PDF generated without errors
- Browser download starts successfully
- User sees success feedback

### Platform Summary (Hybrid/Web)
- Generation: Client-side PDF (e.g., jsPDF)
- Delivery: Blob → Object URL → download
- Offline: Works offline with local data
- Limits: Browser memory and download restrictions

## 2. PRD References

### Related PRD Sections
- **Section 4.1: Project Management** - Export reports
- **Section 5.4: Reporting** - Report content

### Key Requirements Addressed
- FR-PM-008: Export project reports
- AC-PM-008-002: Include metadata and calculations
- AC-PM-008-004: Export progress indicator

## 3. Prerequisites

### User Prerequisites
- User is in Canvas Editor
- User knows which sections to include

### System Prerequisites
- Export dialog available
- PDF generator loaded

### Data Prerequisites
- Project metadata and entities available
- Calculations/BOM data ready

### Technical Prerequisites
- `ExportDialog` available
- `ReportGenerator` configured

## 4. User Journey Steps

### Step 1: Initiate Export

**User Actions:**
1. Click File menu → Export Report

**System Response:**
1. Export dialog opens with report type, sections, orientation

**Visual State:**
```
┌──────────────────────────────┐
│ Export Report                │
│ Type: [PDF]                  │
│ [x] Full Report              │
│ Orientation: (o) Landscape   │
│ [Cancel] [Export]            │
└──────────────────────────────┘
```

---

### Step 2: Configure Options

**User Actions:**
1. Select Full Report and Landscape

**System Response:**
1. Update preview and estimated page count

---

### Step 3: Generate Report

**User Actions:**
1. Click Export

**System Response:**
1. Collect metadata and entity data
2. Generate PDF in memory
3. Show progress indicator

---

### Step 4: Download PDF

**System Response:**
1. Create Blob and Object URL
2. Trigger download with `<a download>`
3. Show success toast

**Hybrid-Specific Behavior:**
- File name may be adjusted by browser download rules

## 5. Edge Cases and Handling

### Edge Case 1: Download Blocked
- Show "Download blocked" guidance and retry button

### Edge Case 2: Large Report Size
- Warn if report exceeds memory threshold

### Edge Case 3: Missing Assets
- If logo/fonts not bundled, fall back to default styling

## 6. Error Scenarios and Recovery

### Error Scenario 1: PDF Generation Failure
- Message: "Unable to generate report"
- Recovery: Retry with fewer sections

### Error Scenario 2: Download Failure
- Message: "Download failed"
- Recovery: Provide manual "Save As" option

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Export Dialog | `Ctrl/Cmd + P` |
| Confirm Export | `Enter` |

## 8. Related Elements

### Components
- `ExportDialog`
- `ReportPreview`

### Stores
- `ProjectStore`
- `EntityStore`

### Services
- `ReportGenerator`
- `DownloadService`

## 9. Visual Diagrams

### Export Report Flow (Hybrid/Web)
```
Canvas → Export Dialog → PDF Blob → Browser Download
```

## Related Base Journey
- [Export Project Report](../UJ-PM-008-ExportProjectReport.md)
