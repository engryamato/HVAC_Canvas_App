# [UJ-PM-008] Export Project Report (Tauri Offline)

## 1. Overview

### Purpose
This document describes exporting project reports on desktop, including native save dialogs, disk writes, and user feedback.

### Scope
- Opening the export dialog from the canvas
- Configuring report options
- Generating PDF
- Saving file to disk via native dialog

### User Personas
- **Primary**: Designers delivering reports to clients
- **Secondary**: Project managers reviewing documentation
- **Tertiary**: Sales teams packaging deliverables

### Success Criteria
- Export dialog opens with correct options
- PDF generated without errors
- Native save dialog completes successfully
- File written to disk and user notified

### Platform Summary (Tauri Offline)
- Generation: Client-side PDF
- Delivery: Native save dialog → disk write
- Offline: Full offline support
- Permissions: Save location controlled by OS

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
- File system permissions granted

### Data Prerequisites
- Project metadata and entities available
- Calculations/BOM data ready

### Technical Prerequisites
- `ExportDialog` available
- `ReportGenerator` configured
- `FileDialogService` and `ProjectIO` available

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

### Step 4: Save PDF (Native Dialog)

**User Actions:**
1. Select destination folder in native dialog
2. Enter filename (or accept default)
3. Click "Save"

**System Response:**
1. Open native save dialog
2. Receive file path from OS
3. Write PDF bytes to disk
4. Show success toast and "Show in Folder" action

**Tauri-Specific Behavior:**
- User chooses file name/location before write

## 5. Edge Cases and Handling

### Edge Case 1: Save Canceled
- Abort export and return to dialog

### Edge Case 2: Permission Denied
- Show "Access denied" and allow retry

### Edge Case 3: Disk Full
- Show "Storage full" error

## 6. Error Scenarios and Recovery

### Error Scenario 1: PDF Generation Failure
- Message: "Unable to generate report"
- Recovery: Retry with fewer sections

### Error Scenario 2: Disk Write Failure
- Message: "Unable to save report"
- Recovery: Choose a different location

## 7. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Export Dialog | `Ctrl/Cmd + P` |
| Confirm Export | `Enter` |

## 8. Related Elements

### Components
- [ExportDialog](../../../elements/01-components/export/ExportDialog.md)
- `ReportPreview`

### Stores
- [projectStore](../../../elements/02-stores/projectStore.md)
- [entityStore](../../../elements/02-stores/entityStore.md)

### Services
- `ReportGenerator`
- `FileDialogService`
- [ProjectIO](../../../elements/10-persistence/ProjectIO.md)

## 9. Visual Diagrams

### Export Report Flow (Tauri Offline)
```
Canvas → Export Dialog → Native Save → Disk Write
```

## Related Base Journey
- [Export Project Report](../UJ-PM-008-ExportProjectReport.md)
