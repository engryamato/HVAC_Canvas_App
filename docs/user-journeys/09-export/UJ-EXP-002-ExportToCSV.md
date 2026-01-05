# User Journey: Export To CSV

## 1. Overview

### Purpose
This user journey describes how a user exports the Bill of Materials (BOM) as a CSV file for external use.

### Scope
- Opening BOM Panel in UI
- Clicking "Export CSV" button within panel
- Verifying columns in exported CSV file (Item, Qty, Details)

### User Personas
- **Primary**: HVAC Designer
- **Secondary**: Project Manager

### Success Criteria
- CSV file is successfully generated with correct structure
- Download is initiated automatically with timestamped filename
- Export reflects current BOM data at time of export

## 2. PRD References

### Related PRD Sections
- **Section 4.1: File Export Options** - This document implements the CSV export option under the main "File" menu.
- **Section 3.2: Bill of Materials (BOM)** - The BOM panel is a key element in generating this report

### Key Requirements Addressed
- REQ-EXP-003: User must be able to export BOM as CSV
- REQ-EXP-004: Export should include Item, Qty, and Details columns

## 3. Prerequisites

### User Prerequisites
- A project is open with at least one entity on canvas

### System Prerequisites
- Canvas component is active with entities displayed
- BOM panel can be accessed from sidebar or main menu

### Data Prerequisites
- Entities have properties that populate the BOM table (e.g., Item Name, Quantity)

### Technical Prerequisites
- `BOMPanel` component initialized and visible
- `csv.ts` service available for data transformation

## 4. User Journey Steps

### Step 1: Open BOM Panel
**User Actions:**
1. Click "BOM" button in toolbar or sidebar
2. Hover over project title or click on BOM tab

**System Response:**
1. BOM panel slides open from left side of UI
2. Displays current entities and calculated quantities
3. Panel shows real-time data updated with canvas changes

**Visual State:**
```
[Left Sidebar]
  [BOM Panel] 
    Item | Qty | Details
    RTU1 | 2   | Type: X
    Duct | 5   | Size: 10"
```

**User Feedback:**
- Smooth animation of panel sliding open
- Live update when entity changes on canvas

**Related Elements:**
- Components: `BOMPanel`, `Canvas`
- Stores: `EntityStore` (for real-time data)
- Services: None
- Events: `onBOMOpen`

### Step 2: Click "Export CSV"
**User Actions:**
1. Locate "Export CSV" button in BOM Panel toolbar
2. Click the download icon or label

**System Response:**
1. Button activates and shows loading spinner briefly
2. System prepares raw data for export (entities & their properties)
3. Generates CSV string with headers
4. Triggers automatic browser download

**Visual State:**
```
[Toolbar]
  [Export CSV] 
    [Loading...] 
    [Download Starts Automatically]
```

**User Feedback:**
- Spinner appears while generating data
- Browser downloads file with timestamped name (e.g., `SizeWise_BOM_2025-04-05.csv`)
- Toast confirmation message on successful download

**Related Elements:**
- Components: `BOMPanel`, `Canvas`
- Stores: None
- Services: `csv.ts` (export service)
- Events: `onExportCSVClick`

### Step 3: Verify CSV Columns and Data
**User Actions:**
1. Open exported .csv file in spreadsheet application
2. Check column headers and data rows

**System Response:**
1. CSV generated with correct columns:
   - Item Name (e.g., "RTU-01")
   - Quantity (Integer)
   - Details (String, e.g., Type: X, Size: 8")
2. Data rows accurately reflect entities and properties
3. Format compliant with standard CSV specifications

**Visual State:**
```
[CSV File]
Item | Qty | Details
RTU1 | 2   | Type: X
Duct | 5   | Size: 10"
```

**User Feedback:**
- Exported file contains expected data in proper format
- No warnings or errors during download process

**Related Elements:**
- Components: `BOMPanel`, `Canvas`
- Stores: None
- Services: `csv.ts` (export service)
- Events: `onCSVExportComplete`

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
  [File: SizeWise_BOM_2025-04-05.csv] 
```

**User Feedback:**
- Browser downloads the file to default location
- Optional notification of export success in UI (if applicable)

**Related Elements:**
- Components: `BOMPanel`, `Canvas`
- Stores: None
- Services: `csv.ts` (export service), `downloadService`
- Events: `onDownloadComplete`

### Step 5: Error Handling During Export
**User Actions:**
1. Click export when BOM panel is empty or contains invalid data

**System Response:**
1. System displays error message if generation fails due to missing data or malformed properties
2. Shows retry option in UI (if available)
3. Logs error for diagnostics and debugging purposes

**Visual State:**
```
[BOM Panel]
  [Error Modal Appears] 
    "Export failed: No valid BOM entries found"
    Retry Button
    Cancel Button
```

**User Feedback:**
- Error toast appears with details
- Option to retry or cancel export

**Related Elements:**
- Components: `BOMPanel`, `ErrorBoundary`
- Stores: None
- Services: `csv.ts` (export service)
- Events: `onCSVGenerationError`

## 5. Edge Cases and Handling

1. **Empty BOM Panel**
   - **Scenario**: User attempts to export CSV when no items are present in the BOM panel
   - **Handling**: System shows alert indicating empty BOM cannot be exported
   - **Test Case**: `tests/e2e/export/csv/empty-bom`

2. **Large Entity Count**
   - **Scenario**: User has 100+ unique items in their project which must all be exported as CSV
   - **Handling**: System processes data efficiently without hanging UI or browser tab
   - **Test Case**: `tests/e2e/export/csv/large-bom`

3. **Complex Property Data**
   - **Scenario**: Entities contain nested property structures in details that need to be flattened
   - **Handling**: System properly flattens properties into consistent columns for CSV export
   - **Test Case**: `tests/e2e/export/csv/complex-data`

4. **File System Permission Error**
   - **Scenario**: Browser cannot save to user's default download location
   - **Handling**: Shows error modal and suggests manual download path
   - **Test Case**: `tests/e2e/export/csv/permission-error`

5. **Invalid Data in Entities**
   - **Scenario**: Some entities have malformed or missing properties needed for export
   - **Handling**: System skips invalid entries with warning but allows rest of data to be exported
   - **Test Case**: `tests/e2e/export/csv/invalid-data`

## 6. Error Scenarios and Recovery

1. **CSV Generation Failed**
   - **Scenario**: An unhandled exception occurs during CSV generation (e.g., malformed property)
   - **Recovery**: System displays error message in modal with option to retry or cancel the action
   - **User Feedback**: "Failed to export CSV: Please check entity properties and try again."

2. **Data Integrity Error**
   - **Scenario**: Export process detects inconsistency between BOM data and system state
   - **Recovery**: System validates all entities before export, skipping invalid ones but proceeding with valid entries
   - **User Feedback**: "Export completed with warnings: Some items skipped due to missing properties"

3. **Download Failure**
   - **Scenario**: Download fails due to browser restrictions or corrupted file output
   - **Recovery**: System attempts to regenerate the CSV and retry download, with user notification if it happens more than twice
   - **User Feedback**: "Download failed. Retrying..."

## 7. Performance Considerations
- CSV generation should complete within 10 seconds for large BOMs (up to 500 items)
- Memory usage should be under 200MB during export process to prevent browser freezing
- All data must be collected and serialized in real-time from the active `EntityStore`

## 8. Keyboard Shortcuts
| Action | Shortcut | Context |
|--------|----------|---------|
| Export CSV (when BOM panel open) | Ctrl + Shift + E | When BOM Panel is active |

## 9. Accessibility & Internationalization
- All buttons in export dialog are labeled with ARIA attributes for screen readers
- Keyboard focus navigates correctly through BOM data fields and export options
- Language support includes English, Spanish, French as per UI localization standards

## 10. Key UI Components & Interactions
- `BOMPanel`: Displays list of entities in structured table format with property data
- `csv.ts` service: Transforms entity properties into CSV string for download via browser API

## 11. Related Documentation
- [Prerequisites]: ../08-file-management/UJ-FIL-001-OpenProject.md
- [Related Elements]: ./BOMPanel, csv.ts
- [Next Steps]: None specified

## 12. Automation & Testing

### Unit Tests
- `src/__tests__/features/export/csv.test.ts`

### Integration Tests
- `src/__tests__/integration/export/csv.integration.test.ts`

### E2E Tests
- `tests/e2e/export/csv/export-csv.e2e.js`

## 13. Notes
- Exported CSV files are stored temporarily in browser memory before download starts
- All entity properties that exist on canvas are included in the export regardless of whether they're displayed in BOM panel
- The system flattens complex nested properties into top-level columns for simple CSV format