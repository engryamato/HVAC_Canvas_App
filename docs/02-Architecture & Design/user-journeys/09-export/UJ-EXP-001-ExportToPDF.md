# User Journey: Export to PDF

## 1. Overview

### Purpose
To document the process of exporting the current canvas view or the entire drawing area to a PDF file for printing, sharing, or archival.

### Scope
- Accessing the export menu
- Configuring PDF export settings
- Generating and saving the PDF file

### User Personas
- **Primary**: HVAC Designer (Sharing designs with clients/contractors)
- **Secondary**: Project Manager (Reviewing deliverables)

### Success Criteria
- User can successfully generate a PDF file
- PDF contains the expected visual elements from the canvas
- User can control the print bounds (viewport vs. entire drawing)

## 2. PRD References

### Related PRD Sections
- **Section 6.1: Output Formats** - PDF generation requirements.

### Key Requirements Addressed
- REQ-OUT-001: System must export drawings to PDF.
- REQ-OUT-002: Export must support standard paper sizes (Letter, A4, etc.).

## 3. Prerequisites

### User Prerequisites
- A project must be open.
- Entities should be placed on the canvas (for a meaningful export).

### System Prerequisites
- `ProjectStore` must be initialized.
- `ViewportStore` must track current bounds.

### Data Prerequisites
- Valid project data loaded.

### Technical Prerequisites
- `pdf.ts` module loaded.

## 4. User Journey Steps

### Step 1: Access Export Menu

**User Actions:**
1. Click the "File" menu in the top toolbar.
2. Hover over "Export".
3. Select "PDF" from the submenu.

**System Response:**
1. System closes main menu.
2. System opens the "Export to PDF" dialog/modal.

**Visual State:**
```
[Menu] -> [Export >] -> [PDF]
                        [CSV]
                        [JSON]
```

**Related Elements:**
- Components: `TopToolbar`, `ExportMenu`

### Step 2: Configure Export Settings

**User Actions:**
1. User selects "Fit to View" or "Whole Canvas" from options.
2. (Optional) User adjusts paper size or orientation.
3. Click "Export".

**System Response:**
1. System validates settings.
2. System calls `pdf.ts` generation function.
3. System triggers browser download prompt.

**Visual State:**
```
[Export to PDF Dialog]
(*) Fit to View
( ) Whole Canvas
[Export Button]
```

**Related Elements:**
- Components: `ExportDialog` (if applicable)

### Step 3: File Generation and Download

**User Actions:**
1. User chooses save location (if browser configured to ask).
2. User opens downloaded PDF to verify.

**System Response:**
1. `pdf.ts` generates Blob.
2. `download.ts` handles file saving.

**Related Elements:**
- Modules: `src/features/export/pdf.ts`, `src/features/export/download.ts`

## 5. Edge Cases and Handling

1. **Empty Canvas**
   - **Scenario**: User tries to export a blank project.
   - **Handling**: System generates an empty PDF or shows a toast warning "Canvas is empty".

2. **Large Drawings**
   - **Scenario**: Drawing exceeds standard page bounds.
   - **Handling**: Scaling content to fit or multi-page export (depending on implementation).

## 6. Error Scenarios and Recovery

1. **Generation Failure**
   - **Scenario**: PDF generation script crashes (e.g., memory limit).
   - **Recovery**: Catch error in `try/catch` block, display "Export Failed" toast.
   - **User Feedback**: "Failed to generate PDF. Please try again."

## 11. Related Documentation
- [UJ-EXP-002: Export to CSV](UJ-EXP-002-ExportToCSV.md)
- [UJ-EXP-003: Export to JSON](UJ-EXP-003-ExportToJSON.md)
