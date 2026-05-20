# User Journey: Export To PDF

## 1. Overview

### Purpose
This user journey describes how a user exports the current canvas as a PDF document.

### Scope
- Clicking "File" > "Export" > "PDF"
- Configuring print bounds (Fit to View vs. Whole Canvas)
- System generates blob and triggers download

### User Personas
- **Primary**: HVAC Designer
- **Secondary**: Project Manager

### Success Criteria
- PDF file is successfully generated
- Download is initiated automatically with correct dimensions
- Export menu reflects current canvas state

## 2. PRD References

### Related PRD Sections
- **Section 4.1: File Export Options** - This document implements the PDF export option under the main "File" menu.

### Key Requirements Addressed
- REQ-EXP-001: User must be able to export canvas as PDF
- REQ-EXP-002: Export should allow choosing between Fit View or Whole Canvas scale

## 3. Prerequisites

### User Prerequisites
- A project is open and canvas is visible

### System Prerequisites
- Canvas component is active with entities displayed

### Data Prerequisites
- Entities present on the canvas

### Technical Prerequisites
- ExportMenu component initialized
- pdf.ts service available

## 4. User Journey Steps

### Step 1: Open Export Menu
**User Actions:**
1. Click "File" menu in toolbar
2. Select "Export"
3. Choose "PDF"

**System Response:**
1. Menu opens and displays export options
2. PDF option is highlighted
3. System prepares for PDF generation

**Visual State:**
```
[Toolbar]
  File ->
    Export ->
      [PDF] <- Selected
      CSV
      JSON
```

**User Feedback:**
- Menu dropdown appears with options
- Visual indication of selected export type

**Related Elements:**
- Components: `ExportMenu`, `Canvas`
- Stores: None
- Services: `pdf.ts` (export service)
- Events: `onExportPDFClick`

### Step 2: Configure Print Bounds
**User Actions:**
1. Select "Fit to View" or "Whole Canvas"

**System Response:**
1. System caches selected bounds option
2. Applies scaling settings during PDF creation
3. Updates UI with current selection feedback

**Visual State:**
```
[Export Menu]
  Export Settings:
    [Fit to View] ✓
    Whole Canvas
```

**User Feedback:**
- Selection is highlighted in the menu
- Toggle between options updates real-time preview if available

**Related Elements:**
- Components: `ExportMenu`, `Canvas`
- Stores: None
- Services: `pdf.ts` (export service)
- Events: `onBoundsChange`

### Step 3: Generate PDF Blob and Download
**User Actions:**
1. Click "Export" after selecting bounds

**System Response:**
1. System initiates PDF generation from canvas content
2. Applies configured scaling options during generation
3. Generates blob in browser memory
4. Triggers automatic download with timestamped filename (e.g., `SizeWise_2025-04-05.pdf`)

**Visual State:**
```
[Canvas]
  [PDF Generation Progress Indicator] 
  [Download Starts Automatically] 
```

**User Feedback:**
- Visual loading indicator during generation
- Automatic browser download with timestamped filename
- Toast notification confirming successful export

**Related Elements:**
- Components: `ExportMenu`, `Canvas`
- Stores: None
- Services: `pdf.ts` (export service)
- Events: `onPDFDownloadClick`

### Step 4: Post Export Confirmation
**User Actions:**
1. Observe download completion in browser interface

**System Response:**
1. No additional UI changes after successful download
2. Notification toast appears briefly if enabled
3. System logs export activity for audit trail (optional)

**Visual State:**
```
[Browser Download Bar]
  [Download Started] 
  [File: SizeWise_2025-04-05.pdf] 
```

**User Feedback:**
- Browser downloads the file to default location
- Optional notification of export success in UI (if applicable)

**Related Elements:**
- Components: `ExportMenu`, `Canvas`
- Stores: None
- Services: `pdf.ts` (export service), `downloadService`
- Events: `onDownloadComplete`

### Step 5: Error Handling During Export
**User Actions:**
1. Generate PDF with large or complex canvas elements

**System Response:**
1. Displays error message if generation fails due to memory constraints
2. Shows retry option in UI (if available)
3. Logs error for diagnostics and debugging purposes

**Visual State:**
```
[Canvas]
  [Error Modal Appears] 
    "Export failed: Memory Limit Exceeded"
    Retry Button
    Cancel Button
```

**User Feedback:**
- Error toast appears with details
- Option to retry or cancel export

**Related Elements:**
- Components: `ExportMenu`, `ErrorBoundary`
- Stores: None
- Services: `pdf.ts` (export service)
- Events: `onPDFGenerationError`

## 5. Edge Cases and Handling

1. **No Entities Present**
   - **Scenario**: User attempts to export without any entities on canvas
   - **Handling**: System shows alert indicating empty canvas cannot be exported
   - **Test Case**: `tests/e2e/export/pdf/no-entities`

2. **Large Canvas Export Error**
   - **Scenario**: Attempting to generate PDF from extremely large canvas (>50MB)
   - **Handling**: System displays error with option to reduce resolution or simplify view
   - **Test Case**: `tests/e2e/export/pdf/large-canvas`

3. **Export Timeout**
   - **Scenario**: Export process takes longer than 15 seconds
   - **Handling**: System shows timeout dialog with retry button
   - **Test Case**: `tests/e2e/export/pdf/timeout`

4. **File System Permission Error**
   - **Scenario**: Browser cannot save to user's default download location
   - **Handling**: Shows error modal and suggests manual download path
   - **Test Case**: `tests/e2e/export/pdf/permission-error`

5. **Invalid Configuration Settings**
   - **Scenario**: User selects invalid scale settings (e.g., negative value)
   - **Handling**: System validates inputs and resets to default if necessary
   - **Test Case**: `tests/e2e/export/pdf/invalid-configs`

## 6. Error Scenarios and Recovery

1. **PDF Generation Failed**
   - **Scenario**: An unhandled exception occurs during PDF generation (e.g., browser crash)
   - **Recovery**: System displays error message in modal with option to retry or cancel the action
   - **User Feedback**: "Failed to export PDF: Please check your internet connection and try again."

2. **Memory Limit Exceeded**
   - **Scenario**: Export process exceeds browser memory limits due to high-resolution canvas elements
   - **Recovery**: System notifies user of limited resources, suggests reducing resolution or simplifying design before retrying export
   - **User Feedback**: "Export failed: Memory limit exceeded. Please simplify your canvas and try again."

3. **Download Failure**
   - **Scenario**: Download fails due to browser restrictions or corrupted file output
   - **Recovery**: System attempts to regenerate the blob and retry download, with user notification if it happens more than twice
   - **User Feedback**: "Download failed. Retrying..."

## 7. Performance Considerations
- PDF generation should complete within 20 seconds for standard canvases (≤10MB)
- Memory usage should be under 500MB during export process to prevent browser freezing
- Canvas zoom level is maintained as part of print scaling when "Fit to View" selected

## 8. Keyboard Shortcuts
| Action | Shortcut | Context |
|--------|----------|---------|
| Export PDF (when menu open) | Ctrl + P | When File > Export submenu is active |

## 9. Accessibility & Internationalization
- All buttons in export dialog are labeled with ARIA attributes for screen readers
- Keyboard focus navigates correctly through export options in menus
- Language support includes English, Spanish, French as per UI localization standards

## 10. Key UI Components & Interactions
- `ExportMenu`: Dropdown menu that allows user to choose between PDF/CSV/JSON exports
- `Canvas`: Renders the visual content for PDF export
- `pdf.ts` service: Handles conversion logic and triggers download via browser API

## 11. Related Documentation
- [Prerequisites]: ../08-file-management/UJ-FIL-001-OpenProject.md
- [Related Elements]: ./ExportMenu, pdf.ts
- [Next Steps]: None specified

## 12. Automation & Testing

### Unit Tests
- `src/__tests__/features/export/pdf.test.ts`

### Integration Tests
- `src/__tests__/integration/export/pdf.integration.test.ts`

### E2E Tests
- `tests/e2e/export/pdf/export-pdf.e2e.js`

## 13. Notes
- Exported PDF files are stored temporarily in browser memory before download starts
- If user selects "Whole Canvas", all elements must be scaled to fit within printable area dimensions
- The system handles multi-page PDFs automatically based on canvas size