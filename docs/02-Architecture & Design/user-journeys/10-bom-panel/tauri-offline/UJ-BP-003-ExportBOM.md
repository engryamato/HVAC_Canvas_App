# UJ-BP-003: Export BOM

## Overview

This user journey describes how users export the Bill of Materials to various file formats (CSV, Excel, PDF) for sharing with stakeholders, integration with procurement systems, or printing. Export functionality transforms the BOM into professional, shareable documents suitable for quoting, ordering, and project documentation.

## PRD References

- **FR-BOM-007**: BOM export to CSV, Excel (XLSX), and PDF formats
- **FR-BOM-008**: Export includes project metadata, line items, and totals
- **FR-BOM-009**: Export respects current filters and sort order
- **US-BOM-003**: As a user, I want to export the BOM so that I can share it with suppliers, contractors, and stakeholders
- **AC-BOM-003-01**: Export button accessible in BOM panel header
- **AC-BOM-003-02**: Export dialog offers format selection (CSV, XLSX, PDF)
- **AC-BOM-003-03**: Export includes project name, date, and user information in header
- **AC-BOM-003-04**: PDF export formatted for printing with company branding
- **AC-BOM-003-05**: Excel export includes formulas for subtotals and grand total
- **AC-BOM-003-06**: CSV export compatible with Excel and Google Sheets

## Prerequisites

- User has BOM panel open with calculated line items
- Project contains at least one equipment/fitting entity (non-empty BOM)
- User has write permissions to local file system
- Understanding of different export formats and their use cases

## User Journey Steps

### Step 1: Initiate BOM Export

**User Actions**:
1. User reviews BOM and confirms it's ready for export
2. User identifies export need (send to supplier, print for job site, import to accounting)
3. User clicks "Export" button (download icon) in BOM panel header
4. Export dialog opens showing format options

**System Response**:
- Export dialog modal opens (centered on screen)
- Display format selection:
  - CSV (.csv) - "For spreadsheets and data import"
  - Excel (.xlsx) - "Formatted spreadsheet with formulas"
  - PDF (.pdf) - "Print-ready document with branding"
- Show export options:
  - "Include filtered items only" checkbox (if filters active)
  - "Include project metadata" checkbox (enabled by default)
  - "Include entity details" checkbox (specifications, notes)
- Preview section shows estimated file size and row count
- "Export" and "Cancel" buttons at bottom

**Validation**:
- Export dialog renders correctly
- Format options available and selectable
- Current BOM state captured (filters, sort order)
- Export button enabled only when format selected

**Data**:

```
Export Dialog State:
- visible: true
- selectedFormat: null (user must choose)
- exportOptions:
  - includeFilteredOnly: false (export all by default)
  - includeMetadata: true
  - includeEntityDetails: true
  - includeCosts: true (option to hide costs)

BOM State Snapshot:
- lineItemCount: 12
- filteredItemCount: 12 (no active filters)
- sortColumn: null
- sortDirection: null
- grandTotal: $19,560.00
- projectName: "Commercial Office HVAC"
- projectDate: "2025-12-29"
- userName: "John Smith"

Export Preview:
- Format: (none selected)
- Rows: 12 line items + headers + totals = ~20 rows
- Estimated size: ~15 KB (CSV), ~25 KB (Excel), ~50 KB (PDF)

Dialog Layout:
┌───────────────────────────────────────┐
│ Export Bill of Materials              │
├───────────────────────────────────────┤
│                                       │
│ Select Format:                        │
│ ( ) CSV (.csv)                        │
│     For spreadsheets and data import  │
│                                       │
│ ( ) Excel (.xlsx)                     │
│     Formatted with formulas           │
│                                       │
│ ( ) PDF (.pdf)                        │
│     Print-ready with branding         │
│                                       │
│ Options:                              │
│ ☑ Include project metadata            │
│ ☑ Include entity details              │
│ ☑ Include costs                       │
│                                       │
│ Preview:                              │
│ Rows: 20 | Est. size: varies by fmt  │
│                                       │
│          [Cancel]  [Export]           │
└───────────────────────────────────────┘
```

**Substeps**:
1. User clicks Export button in BOM header
2. ExportDialog component mounts
3. Capture current BOM state (items, filters, sort)
4. Capture project metadata (name, date, user)
5. Initialize export options (default values)
6. Calculate preview statistics (row count, file size estimate)
7. Render dialog modal
8. Focus on first format option (CSV radio button)

### Step 2: Select Export Format (CSV)

**User Actions**:
1. User decides to export as CSV for supplier data import
2. User clicks CSV radio button
3. Reviews export options, leaves defaults selected
4. Clicks "Export" button

**System Response**:
- CSV radio button selected (highlighted)
- Export button becomes enabled
- On Export button click:
  - Generate CSV content from BOM line items
  - Format: comma-separated values, quoted strings
  - Header row: column names
  - Data rows: one per line item, category headers included
  - Footer row: grand total
  - Trigger browser download with filename: "BOM_ProjectName_Date.csv"
  - Show success notification: "BOM exported to BOM_Commercial_Office_HVAC_2025-12-29.csv"
  - Close export dialog

**Validation**:
- CSV file downloads to user's default download folder
- File opens correctly in Excel, Google Sheets, Numbers
- Data integrity maintained (no corruption, encoding issues)
- Numeric values formatted correctly (costs with decimal places)

**Data**:

```
CSV Generation:

Header Row:
"Item #","Description","Specifications","Quantity","Unit","Unit Cost","Total Cost","Category"

Data Rows:
1,"AHU - York MCA","5000 CFM, 3-ton",2,"ea","$3,450.00","$6,900.00","Air Handling Units"
2,"AHU - Carrier 48TC","7500 CFM, 5-ton",1,"ea","$5,200.00","$5,200.00","Air Handling Units"
"","Subtotal: Air Handling Units","","","","","$12,100.00",""
3,"VAV - Trane TZHS","400-1200 CFM",5,"ea","$875.00","$4,375.00","VAV Boxes"
4,"VAV - Price SC","600-1800 CFM",2,"ea","$1,120.00","$2,240.00","VAV Boxes"
"","Subtotal: VAV Boxes","","","","","$6,615.00",""
5,"Diffuser - 4-way","24""x24"", 500 CFM",8,"ea","$125.00","$1,000.00","Diffusers"
6,"Diffuser - Linear","48"", 300 CFM",4,"ea","$180.00","$720.00","Diffusers"
"","Subtotal: Diffusers","","","","","$1,720.00",""
7,"Grille - Return","24""x12""",6,"ea","$85.00","$510.00","Grilles"
"","Subtotal: Grilles","","","","","$510.00",""
"","TOTAL PROJECT COST","","","","","$19,560.00",""

Metadata (if includeMetadata enabled):
"Project:","Commercial Office HVAC","","","","","",""
"Date:","2025-12-29","","","","","",""
"Exported by:","John Smith","","","","","",""
"","","","","","","",""
(followed by header row above)

File Details:
- Filename: "BOM_Commercial_Office_HVAC_2025-12-29.csv"
- Encoding: UTF-8 with BOM (for Excel compatibility)
- Line endings: CRLF (Windows-compatible)
- Delimiter: comma (,)
- Quote character: double-quote (") for strings with commas
- File size: ~1.2 KB (12 line items)

Download Trigger:
- Blob created with CSV content
- Temporary download link: <a href="blob:..." download="BOM_...csv">
- Link clicked programmatically
- Browser download initiated
- Link removed from DOM
```

**Substeps**:
1. User selects CSV radio button
2. selectedFormat = "csv"
3. Export button enabled
4. User clicks Export button
5. Generate CSV content:
   - Add metadata header (if enabled)
   - Add column header row
   - Iterate line items, format as CSV rows
   - Add category subtotals
   - Add grand total row
6. Create Blob with CSV content (text/csv MIME type)
7. Create temporary download link with filename
8. Trigger download via programmatic click
9. Show success notification
10. Close export dialog
11. Clean up temporary link

### Step 3: Select Export Format (Excel)

**User Actions**:
1. User wants formatted spreadsheet with formulas
2. User selects Excel (.xlsx) radio button
3. Reviews options, enables "Include entity details"
4. Clicks "Export" button

**System Response**:
- Excel radio button selected
- On Export button click:
  - Generate Excel workbook using library (e.g., ExcelJS, SheetJS)
  - Create worksheet with formatted table
  - Apply formatting:
    - Header row: bold, background color
    - Category headers: bold, light blue background
    - Subtotal rows: italic, light gray background
    - Grand total: bold, dark blue background, white text
    - Currency columns: currency format ($#,##0.00)
    - Numeric columns: number format with decimals
  - Add formulas for subtotals (SUM function)
  - Add metadata sheet (if includeMetadata enabled)
  - Trigger download with filename: "BOM_ProjectName_Date.xlsx"
  - Success notification shown

**Validation**:
- Excel file downloads successfully
- Opens in Excel, Google Sheets, LibreOffice Calc
- Formulas calculate correctly
- Formatting preserved (colors, fonts, number formats)
- Cell widths auto-sized for readability

**Data**:

```
Excel Workbook Structure:

Sheet 1: "Bill of Materials"

Row 1 (Metadata, if enabled):
  A1: "Project:" (Bold)
  B1: "Commercial Office HVAC"
  E1: "Date:" (Bold)
  F1: "2025-12-29"

Row 3 (Header Row):
  Style: Bold, Blue Background (#4472C4), White Text
  A3: "Item #"
  B3: "Description"
  C3: "Specifications"
  D3: "Quantity"
  E3: "Unit"
  F3: "Unit Cost"
  G3: "Total Cost"

Row 4 (Category Header):
  Style: Bold, Light Blue Background (#D9E2F3)
  A4-G4: "AIR HANDLING UNITS" (merged cells)

Row 5 (Line Item):
  A5: 1
  B5: "AHU - York MCA"
  C5: "5000 CFM, 3-ton"
  D5: 2
  E5: "ea"
  F5: $3,450.00 (Currency format)
  G5: =D5*F5 (Formula: =$6,900.00)

Row 6:
  A6: 2
  B6: "AHU - Carrier 48TC"
  C6: "7500 CFM, 5-ton"
  D6: 1
  E6: "ea"
  F6: $5,200.00
  G6: =D6*F6 (=$5,200.00)

Row 7 (Subtotal):
  Style: Italic, Light Gray Background (#F2F2F2)
  A7-F7: "Subtotal: Air Handling Units" (merged)
  G7: =SUM(G5:G6) (Formula: =$12,100.00)

... (additional categories and line items)

Row 20 (Grand Total):
  Style: Bold, Dark Blue Background (#1F4E78), White Text
  A20-F20: "TOTAL PROJECT COST" (merged)
  G20: =SUM(G7,G11,G14,G16) (Formula: =$19,560.00)
        (Sum of all subtotals)

Column Widths:
  A: 8 (Item #)
  B: 25 (Description)
  C: 30 (Specifications)
  D: 10 (Quantity)
  E: 8 (Unit)
  F: 12 (Unit Cost)
  G: 12 (Total Cost)

Sheet 2: "Metadata" (if includeMetadata enabled)
  Project information, entity count, export timestamp, etc.

File Details:
- Filename: "BOM_Commercial_Office_HVAC_2025-12-29.xlsx"
- Format: Office Open XML (.xlsx)
- File size: ~25 KB
- Compatible with: Excel 2007+, Google Sheets, LibreOffice Calc
```

**Substeps**:
1. User selects Excel radio button
2. selectedFormat = "xlsx"
3. User clicks Export button
4. Initialize Excel workbook (ExcelJS library)
5. Create "Bill of Materials" worksheet
6. Add metadata rows (if enabled)
7. Add and style header row
8. Iterate BOM line items:
   - Add category headers with styling
   - Add line item rows with data and formulas
   - Add subtotal rows with SUM formulas
9. Add grand total row with formula
10. Auto-size columns for readability
11. Create metadata worksheet (if enabled)
12. Generate Excel file buffer
13. Create Blob with file content
14. Trigger download
15. Show success notification
16. Close dialog

### Step 4: Select Export Format (PDF)

**User Actions**:
1. User needs printable document for job site
2. User selects PDF (.pdf) radio button
3. Enables "Include costs" (for internal use)
4. Clicks "Export" button

**System Response**:
- PDF radio button selected
- On Export button click:
  - Generate PDF using library (e.g., jsPDF, pdfmake)
  - Apply professional formatting:
    - Company logo/header (if configured)
    - Project title and metadata
    - Formatted table with borders
    - Page breaks for long BOMs
    - Footer with page numbers, export date
  - Landscape orientation for wider columns
  - Font: Professional (Helvetica, Arial)
  - Trigger download: "BOM_ProjectName_Date.pdf"
  - Success notification shown

**Validation**:
- PDF downloads successfully
- Opens in Adobe Reader, browser PDF viewer, mobile apps
- Prints correctly on standard paper (8.5x11" or A4)
- All data visible and readable
- Multi-page BOMs paginated properly

**Data**:

```
PDF Document Structure:

Page Layout:
- Orientation: Landscape (11" x 8.5")
- Margins: 0.5" all sides
- Font: Helvetica 10pt (body), 12pt (headers)

Header Section:
┌─────────────────────────────────────────────────┐
│ [Company Logo]     BILL OF MATERIALS            │
│                    Commercial Office HVAC       │
│                    Date: December 29, 2025      │
└─────────────────────────────────────────────────┘

Table Section:
┌───┬──────────────┬────────────────┬─────┬──────┬────────┬───────────┐
│ # │ Description  │ Specifications │ Qty │ Unit │  Unit  │   Total   │
│   │              │                │     │      │  Cost  │   Cost    │
├───┼──────────────┼────────────────┼─────┼──────┼────────┼───────────┤
│   │ AIR HANDLING UNITS                                              │
├───┼──────────────┼────────────────┼─────┼──────┼────────┼───────────┤
│ 1 │ AHU - York   │ 5000 CFM,      │  2  │  ea  │ $3,450 │  $6,900   │
│   │ MCA          │ 3-ton          │     │      │        │           │
├───┼──────────────┼────────────────┼─────┼──────┼────────┼───────────┤
│ 2 │ AHU - Carrier│ 7500 CFM,      │  1  │  ea  │ $5,200 │  $5,200   │
│   │ 48TC         │ 5-ton          │     │      │        │           │
├───┴──────────────┴────────────────┴─────┴──────┴────────┼───────────┤
│ Subtotal: Air Handling Units                            │ $12,100   │
├───┬──────────────┬────────────────┬─────┬──────┬────────┼───────────┤
│   │ VAV BOXES                                                       │
├───┼──────────────┼────────────────┼─────┼──────┼────────┼───────────┤
│ 3 │ VAV - Trane  │ 400-1200 CFM   │  5  │  ea  │  $875  │  $4,375   │
│   │ TZHS         │                │     │      │        │           │
├───┼──────────────┼────────────────┼─────┼──────┼────────┼───────────┤
... (additional categories and items)

├───┴──────────────────────────────────────────────────────┴───────────┤
│ TOTAL PROJECT COST:                                       $19,560    │
└──────────────────────────────────────────────────────────────────────┘

Footer Section:
┌─────────────────────────────────────────────────┐
│ Exported by: John Smith                         │
│ Export Date: 2025-12-29 18:45:32               │
│                               Page 1 of 1       │
└─────────────────────────────────────────────────┘

Styling:
- Header row: Bold, light gray background
- Category headers: Bold, light blue background
- Subtotals: Italic
- Grand total: Bold, dark background, white text
- Alternating row colors (white/very light gray)
- Border: 1pt black lines for table

Multi-Page Handling:
- If BOM exceeds one page, repeat header on each page
- Category headers don't break across pages
- Footer shows "Page N of M"
- Grand total always on last page

File Details:
- Filename: "BOM_Commercial_Office_HVAC_2025-12-29.pdf"
- Format: PDF 1.4 or later
- File size: ~50 KB
- Compression: Enabled (smaller file size)
```

**Substeps**:
1. User selects PDF radio button
2. selectedFormat = "pdf"
3. User clicks Export button
4. Initialize PDF document (jsPDF or pdfmake)
5. Set page size and orientation (landscape)
6. Add header section:
   - Company logo (if configured)
   - Document title
   - Project metadata
7. Create table:
   - Define column widths and styles
   - Add header row
   - Iterate line items, add rows
   - Handle page breaks (multi-page)
   - Add category headers and subtotals
8. Add grand total section
9. Add footer with page numbers and export info
10. Generate PDF buffer
11. Create Blob and trigger download
12. Show success notification
13. Close dialog

### Step 5: Handle Export with Active Filters

**User Actions**:
1. User has filtered BOM to show only "Diffusers" (3 items visible of 12 total)
2. User clicks Export button
3. Dialog shows option: "Include filtered items only" (checked by default since filters active)
4. User reviews filtered item count: "Exporting 3 of 12 items"
5. User selects CSV format and exports

**System Response**:
- Export dialog detects active filters
- "Include filtered items only" checkbox visible and checked
- Preview shows: "Rows: 3 line items (filtered)"
- On export:
  - Export only the 3 visible filtered items
  - Include filter summary in metadata:
    "Filters applied: Categories=Diffusers"
  - Filename includes "(Filtered)": "BOM_ProjectName_Date_(Filtered).csv"
  - Exported grand total reflects filtered items only: $1,720.00
  - Success notification: "Exported 3 filtered items"

**Validation**:
- Only filtered items included in export
- Filter summary documented in export
- Filename clearly indicates filtered export
- Totals accurate for filtered selection

**Data**:

```
Filter State:
- activeFilters: { categories: ["Diffusers"] }
- filteredItemCount: 3
- totalItemCount: 12

Export Options (Filters Active):
- includeFilteredOnly: true (auto-checked)
- Checkbox label: "Include filtered items only (3 of 12 items)"
- Preview: "Exporting 3 items with filters applied"

CSV Export (Filtered):

Metadata Header:
"Project:","Commercial Office HVAC"
"Date:","2025-12-29"
"Filters applied:","Categories: Diffusers"
"Items:","3 of 12 (filtered)"
""

Header Row:
"Item #","Description","Specifications","Quantity","Unit","Unit Cost","Total Cost"

Data Rows (Filtered Items Only):
5,"Diffuser - 4-way","24""x24"", 500 CFM",8,"ea","$125.00","$1,000.00"
6,"Diffuser - Linear","48"", 300 CFM",4,"ea","$180.00","$720.00"
"","Subtotal: Diffusers","","","","","$1,720.00"
"","FILTERED TOTAL","","","","","$1,720.00"

Filename:
"BOM_Commercial_Office_HVAC_2025-12-29_(Filtered).csv"

Success Notification:
"Exported 3 filtered items to BOM_Commercial_Office_HVAC_2025-12-29_(Filtered).csv"
```

**Substeps**:
1. User clicks Export button
2. Export dialog opens
3. Detect active filters in BOMStore
4. Show "Include filtered items only" checkbox (checked)
5. Update preview: "3 of 12 items"
6. User selects format and clicks Export
7. Check includeFilteredOnly option
8. If true:
   - Use filteredItems array instead of lineItems
   - Add filter summary to metadata
   - Append "(Filtered)" to filename
   - Calculate totals from filtered items only
9. Generate export file with filtered data
10. Trigger download
11. Show notification indicating filtered export

## Edge Cases

### Edge Case 1: Export Empty BOM

**Scenario**: User attempts to export BOM when no equipment entities exist (empty BOM).

**Expected Behavior**:
- Export button disabled or shows warning
- If clicked, dialog shows message: "BOM is empty. Add equipment to export."
- Export button in dialog disabled
- Or: Allow export of empty BOM with header only and message row

**Handling**:
- Detect BOMStore.lineItems.length === 0
- Disable export button with tooltip explaining
- If dialog opens, show warning banner
- Optionally allow export with "No items" message for documentation purposes

### Edge Case 2: Export Very Large BOM (1000+ Items)

**Scenario**: Commercial project with 1,500 line items resulting in large export file.

**Expected Behavior**:
- Export process shows progress indicator
- "Generating export... 523/1500 items"
- PDF may be split into multiple pages (50-100 items per page)
- CSV/Excel export completes but file size warning shown
- "Export file is 2.5 MB. Large file may take time to open."
- Export completes successfully

**Handling**:
- Show progress indicator for exports >100 items
- PDF: Paginate intelligently (don't break categories across pages)
- Excel: Use streaming for large workbooks (memory efficiency)
- CSV: Chunk writing if needed
- Warning if file size >5 MB

### Edge Case 3: Export with Special Characters in Descriptions

**Scenario**: Equipment descriptions contain special characters (commas, quotes, line breaks).

**Expected Behavior**:
- CSV: Special characters properly escaped with quotes
  - "Diffuser, 4-way" → "Diffuser, 4-way" (quoted)
  - 'Unit (24")' → "Unit (24"")" (doubled quotes)
- Excel: Characters preserved as-is (no escaping needed)
- PDF: Characters rendered correctly (Unicode support)
- No data corruption or formatting issues

**Handling**:
- CSV: Implement proper quoting and escaping (RFC 4180)
- Excel: Native character support, no escaping needed
- PDF: Use UTF-8 encoding, ensure font supports characters

### Edge Case 4: Export Fails (Insufficient Permissions)

**Scenario**: User's browser/OS denies file write permissions or download folder is inaccessible.

**Expected Behavior**:
- Browser download prompt appears, user may deny
- If denied or error, show error notification
- "Export failed: Unable to save file. Check permissions."
- Offer alternative: "Copy to Clipboard" or "Try Again"
- Error logged for debugging

**Handling**:
- Catch download errors
- Display user-friendly error message
- Offer fallback: copy CSV content to clipboard
- Log error details for support

### Edge Case 5: Concurrent Export Requests

**Scenario**: User double-clicks Export button, triggering two simultaneous exports.

**Expected Behavior**:
- First export proceeds normally
- Second export ignored or queued
- Only one export dialog open at a time
- Prevent duplicate downloads
- Success notification shows once

**Handling**:
- Disable Export button immediately on click
- Set exporting flag to prevent concurrent exports
- Re-enable button only after export completes or fails
- Debounce export action (500ms)

## Error Scenarios

### Error 1: Export Library Failure

**Scenario**: Excel generation library (ExcelJS) fails to load or throws error during workbook creation.

**Error Message**: "Export failed: Excel library error. Please try CSV format or refresh the page."

**Recovery**:
1. Catch library exception during export
2. Display error notification with message
3. Suggest fallback format (CSV)
4. Offer "Try Again" button
5. Log error with stack trace for debugging
6. Export state reset, dialog remains open

### Error 2: PDF Generation Out of Memory

**Scenario**: Large BOM (2000+ items) causes PDF library to exhaust browser memory.

**Error Message**: "PDF export failed: File too large. Try exporting filtered results or use CSV format."

**Recovery**:
1. Catch out-of-memory exception
2. Display error with suggestion to reduce export size
3. Offer filter options to reduce items
4. Suggest alternative formats (CSV doesn't use much memory)
5. "Export First 500 Items" button as fallback
6. Log error for memory profiling

### Error 3: Invalid Filename Characters

**Scenario**: Project name contains characters invalid for filenames (/, \, :, *, ?, ", <, >, |).

**Error Message**: (Silent handling, no error shown)

**Recovery**:
1. Sanitize filename before download
2. Replace invalid characters with underscores or remove
3. "Project/Name" → "Project_Name"
4. Ensure filename is valid across all OS (Windows, Mac, Linux)
5. Fallback: "BOM_Export_Date.csv" if project name empty
6. No error shown to user (transparent handling)

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+E` | Open Export Dialog | BOM panel visible |
| `Ctrl+Shift+E` | Quick Export as CSV (skip dialog) | BOM panel visible |
| `Esc` | Close Export Dialog | Export dialog open |
| `Enter` | Confirm Export (after format selected) | Export dialog open |
| `↑/↓` | Navigate Format Options | Export dialog focused |

## Related Elements

### Components
- **ExportDialog.tsx**: Modal dialog for export configuration
  - Format selection radio buttons
  - Export options checkboxes
  - Preview section
  - Export/Cancel buttons
- **FormatSelector.tsx**: Radio button group for format selection
  - CSV, Excel, PDF options with descriptions
- **ExportOptions.tsx**: Checkbox controls for export configuration
  - Include metadata, entity details, costs, etc.
- **ExportPreview.tsx**: Shows estimated file size and row count
- **ExportProgress.tsx**: Progress indicator for large exports

### Stores
- **ExportStore**: Manages export state and operations
  - `exportFormat`: Selected format (csv|xlsx|pdf)
  - `exportOptions`: Configuration object
  - `exportInProgress`: Boolean flag
  - `exportBOM(format, options)`: Main export method
  - `generateCSV(items)`: CSV generation
  - `generateExcel(items)`: Excel generation
  - `generatePDF(items)`: PDF generation

### Hooks
- **useExport**: Hook providing export functionality
  - Returns export methods and state
  - Handles file download triggers
- **useFileDownload**: Manages browser download mechanism
  - Creates Blob and download link
  - Triggers download programmatically
  - Cleans up temporary resources

### Services
- **CSVExporter.ts**: CSV generation logic
  - `generateCSV(items, options)`: Creates CSV string
  - `escapeCSVValue(value)`: Proper quoting and escaping
  - `formatCurrency(value)`: Currency formatting
- **ExcelExporter.ts**: Excel workbook generation
  - `generateExcel(items, options)`: Creates .xlsx file
  - `styleHeader(row)`: Apply header formatting
  - `addFormulas(cell, formula)`: Insert Excel formulas
  - Uses ExcelJS library
- **PDFExporter.ts**: PDF document generation
  - `generatePDF(items, options)`: Creates PDF file
  - `renderTable(doc, items)`: Draw formatted table
  - `addPageBreaks(doc, items)`: Handle pagination
  - Uses jsPDF or pdfmake library
- **FilenameGenerator.ts**: Creates valid export filenames
  - `generateFilename(project, date, format, filtered)`: Build filename
  - `sanitizeFilename(name)`: Remove invalid characters
  - `formatDate(date)`: Format date for filename (YYYY-MM-DD)

## Visual Diagrams

### Export Dialog

```
Export Dialog Modal:

┌───────────────────────────────────────────────┐
│ Export Bill of Materials                  [×] │
├───────────────────────────────────────────────┤
│                                               │
│ Select Format:                                │
│                                               │
│ ○ CSV (.csv)                                  │
│   For spreadsheets and data import            │
│   Compatible with Excel, Google Sheets        │
│                                               │
│ ● Excel (.xlsx)                               │  ← Selected
│   Formatted spreadsheet with formulas         │
│   Includes styling and calculations           │
│                                               │
│ ○ PDF (.pdf)                                  │
│   Print-ready document with branding          │
│   Professional formatting for presentations   │
│                                               │
│ ─────────────────────────────────────────────│
│                                               │
│ Options:                                      │
│ ☑ Include project metadata                   │
│ ☑ Include entity details                     │
│ ☑ Include costs                               │
│ ☐ Include filtered items only (0 filters)    │  ← Disabled (no filters)
│                                               │
│ ─────────────────────────────────────────────│
│                                               │
│ Preview:                                      │
│ • 12 line items + headers + totals           │
│ • Estimated size: ~25 KB                     │
│ • Filename: BOM_Commercial_Office_...xlsx    │
│                                               │
│                    [Cancel]    [Export]       │
└───────────────────────────────────────────────┘
```

### CSV Export Format

```
CSV File Contents:

Line 1 (Metadata):
Project:,Commercial Office HVAC,Date:,2025-12-29,Exported by:,John Smith

Line 2 (Blank separator):


Line 3 (Header Row):
Item #,Description,Specifications,Quantity,Unit,Unit Cost,Total Cost,Category

Line 4 (Category Header):
,AIR HANDLING UNITS,,,,,,

Line 5 (Line Item):
1,"AHU - York MCA","5000 CFM, 3-ton",2,ea,"$3,450.00","$6,900.00",Air Handling Units

Line 6:
2,"AHU - Carrier 48TC","7500 CFM, 5-ton",1,ea,"$5,200.00","$5,200.00",Air Handling Units

Line 7 (Subtotal):
,Subtotal: Air Handling Units,,,,,,"$12,100.00",

Line 8 (Category):
,VAV BOXES,,,,,,

Line 9-10 (VAV items):
...

Line 18 (Grand Total):
,TOTAL PROJECT COST,,,,,,"$19,560.00",

Special Character Handling:
- Commas in values: "5000 CFM, 3-ton" (quoted)
- Quotes in values: "Unit (24"")" (doubled quotes)
- Currency: "$3,450.00" (quoted, includes $ symbol)
```

### Excel Export Layout

```
Excel Workbook (Sheet: "Bill of Materials"):

     A          B              C               D      E     F          G
┌─────────┬──────────────┬───────────────┬────────┬──────┬──────────┬───────────┐
│         │ Project: Commercial Office HVAC │    │      │ Date: 2025-12-29     │
│         │              │               │        │      │          │           │
├─────────┼──────────────┼───────────────┼────────┼──────┼──────────┼───────────┤
│ Item #  │ Description  │ Specifications│ Qty    │ Unit │ Unit Cost│ Total Cost│ ← Header
├─────────┼──────────────┼───────────────┼────────┼──────┼──────────┼───────────┤  (Bold, Blue BG)
│         │ AIR HANDLING UNITS                                                  │ ← Category
├─────────┼──────────────┼───────────────┼────────┼──────┼──────────┼───────────┤  (Bold, Lt Blue)
│    1    │ AHU - York   │ 5000 CFM,     │   2    │  ea  │ $3,450.00│ $6,900.00 │
│         │ MCA          │ 3-ton         │        │      │          │ =D4*F4    │ ← Formula
├─────────┼──────────────┼───────────────┼────────┼──────┼──────────┼───────────┤
│    2    │ AHU - Carrier│ 7500 CFM,     │   1    │  ea  │ $5,200.00│ $5,200.00 │
│         │ 48TC         │ 5-ton         │        │      │          │ =D5*F5    │
├─────────┴──────────────┴───────────────┴────────┴──────┴──────────┼───────────┤
│ Subtotal: Air Handling Units                                      │$12,100.00 │ ← Subtotal
│                                                                    │=SUM(G4:G5)│  (Italic, Gray)
├─────────┬──────────────┬───────────────┬────────┬──────┬──────────┼───────────┤
│         │ VAV BOXES                                                           │
├─────────┼──────────────┼───────────────┼────────┼──────┼──────────┼───────────┤
...

├─────────┴──────────────────────────────────────────────────────────┴───────────┤
│ TOTAL PROJECT COST:                                                │$19,560.00 │ ← Grand Total
│                                                                     │=SUM(all   │  (Bold, Dark Blue,
│                                                                     │ subtotals)│   White Text)
└─────────────────────────────────────────────────────────────────────┴───────────┘

Cell Formats:
- F4:F5 (Unit Cost): Currency ($#,##0.00)
- G4:G5 (Total Cost): Currency with formula
- D4:D5 (Quantity): Number (0)
- A4:A20 (Item #): Number (0)

Column Widths (Auto-sized):
- A: 8 characters
- B: 25 characters
- C: 30 characters
- D: 10 characters
- E: 8 characters
- F: 12 characters
- G: 12 characters
```

### PDF Export Layout

```
PDF Document (Landscape, 11" × 8.5"):

╔═══════════════════════════════════════════════════════════════════════╗
║ [Logo]                    BILL OF MATERIALS                           ║
║                      Commercial Office HVAC                           ║
║                        December 29, 2025                              ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║ ┌───┬──────────────┬──────────────┬─────┬──────┬──────────┬─────────┐║
║ │ # │ Description  │ Specs        │ Qty │ Unit │ Unit Cost│  Total  │║
║ ├───┼──────────────┼──────────────┼─────┼──────┼──────────┼─────────┤║
║ │   │ AIR HANDLING UNITS (Category Header - Bold, Light Blue BG)   │║
║ ├───┼──────────────┼──────────────┼─────┼──────┼──────────┼─────────┤║
║ │ 1 │ AHU - York   │ 5000 CFM,    │  2  │  ea  │ $3,450   │ $6,900  │║
║ │   │ MCA          │ 3-ton        │     │      │          │         │║
║ ├───┼──────────────┼──────────────┼─────┼──────┼──────────┼─────────┤║
║ │ 2 │ AHU - Carrier│ 7500 CFM,    │  1  │  ea  │ $5,200   │ $5,200  │║
║ │   │ 48TC         │ 5-ton        │     │      │          │         │║
║ ├───┴──────────────┴──────────────┴─────┴──────┴──────────┼─────────┤║
║ │ Subtotal: Air Handling Units (Italic, Gray BG)          │$12,100  │║
║ ├───┬──────────────┬──────────────┬─────┬──────┬──────────┼─────────┤║
║ │   │ VAV BOXES                                                     │║
║ ├───┼──────────────┼──────────────┼─────┼──────┼──────────┼─────────┤║
║ │...                                                                 │║
║ ├───┴───────────────────────────────────────────────────────────────┤║
║ │ TOTAL PROJECT COST: (Bold, Dark Blue BG, White Text)  │$19,560   │║
║ └────────────────────────────────────────────────────────┴──────────┘║
║                                                                       ║
╠═══════════════════════════════════════════════════════════════════════╣
║ Exported by: John Smith                        Page 1 of 1          ║
║ Export Date: 2025-12-29 18:45:32                                    ║
╚═══════════════════════════════════════════════════════════════════════╝

Multi-Page Example (if BOM > 1 page):
Page 1: Items 1-40 with header
Page 2: Items 41-80 with repeated header
Page 3: Items 81-120 with header + Grand Total

Page Break Rules:
- Don't break categories across pages (keep category header with items)
- Repeat table header on each page
- Grand total only on last page
```

### Filtered Export Indication

```
Export with Active Filters:

Export Dialog:
┌───────────────────────────────────────────┐
│ Export Bill of Materials                  │
├───────────────────────────────────────────┤
│ ⚠ Filters Active                          │  ← Warning banner
│ Currently showing 3 of 12 items           │
├───────────────────────────────────────────┤
│ Select Format:                            │
│ ● CSV (.csv)                              │
│                                           │
│ Options:                                  │
│ ☑ Include filtered items only (3 items)  │  ← Auto-checked
│ ☑ Include project metadata                │
│                                           │
│ Preview:                                  │
│ • 3 filtered line items                  │
│ • Filters: Categories=Diffusers           │
│ • Filename: ..._Date_(Filtered).csv       │  ← Indicates filtered
│                                           │
│              [Cancel]    [Export]         │
└───────────────────────────────────────────┘

Exported CSV Header:
Project:,Commercial Office HVAC
Date:,2025-12-29
Filters applied:,Categories: Diffusers
Items:,3 of 12 (filtered)

Exported Filename:
BOM_Commercial_Office_HVAC_2025-12-29_(Filtered).csv
                                            └──────────┘
                                            Clear indication
```

## Testing

### Unit Tests

**Test Suite**: CSVExporter

1. **Test: Generate valid CSV format**
   - Setup: 3 line items
   - Action: generateCSV(items)
   - Assert: Valid CSV with header row + 3 data rows
   - Assert: Proper quoting for special characters

2. **Test: Escape commas in values**
   - Setup: Item description "Diffuser, 4-way"
   - Action: escapeCSVValue(description)
   - Assert: Returns '"Diffuser, 4-way"' (quoted)

3. **Test: Escape quotes in values**
   - Setup: Item spec '24" diameter'
   - Action: escapeCSVValue(spec)
   - Assert: Returns '"24"" diameter"' (doubled quotes)

4. **Test: Include metadata in CSV**
   - Setup: items, options.includeMetadata = true
   - Action: generateCSV(items, options)
   - Assert: CSV starts with project name, date, user

5. **Test: Exclude metadata when disabled**
   - Setup: options.includeMetadata = false
   - Action: generateCSV(items, options)
   - Assert: CSV starts with header row (no metadata)

**Test Suite**: ExcelExporter

1. **Test: Generate Excel workbook**
   - Setup: 12 line items
   - Action: generateExcel(items)
   - Assert: Valid .xlsx file created
   - Assert: Workbook has "Bill of Materials" sheet

2. **Test: Apply cell formatting**
   - Action: Generate Excel, inspect cells
   - Assert: Header row bold and colored
   - Assert: Currency cells have currency format
   - Assert: Category headers styled correctly

3. **Test: Insert formulas**
   - Setup: Line item qty=5, unitCost=$100
   - Action: generateExcel([item])
   - Assert: Total cost cell contains formula =D*F
   - Assert: Formula evaluates to $500

4. **Test: Auto-size columns**
   - Action: generateExcel(items)
   - Assert: Column widths adjusted for content
   - Assert: Description column wider than Qty column

**Test Suite**: PDFExporter

1. **Test: Generate PDF document**
   - Setup: 8 line items
   - Action: generatePDF(items)
   - Assert: Valid PDF file created
   - Assert: File size reasonable (<100 KB)

2. **Test: Handle page breaks**
   - Setup: 100 line items (multi-page)
   - Action: generatePDF(items)
   - Assert: PDF has multiple pages
   - Assert: Header repeated on each page
   - Assert: Grand total on last page only

3. **Test: Render table borders**
   - Action: generatePDF(items)
   - Assert: Table has visible borders
   - Assert: Rows and columns properly aligned

### Integration Tests

**Test Suite**: Export Workflow

1. **Test: CSV export downloads file**
   - Setup: BOM with 12 items
   - Action: Select CSV format, click Export
   - Assert: File downloads to browser
   - Assert: Filename matches pattern BOM_*_*.csv
   - Assert: File contains 12 line items + headers

2. **Test: Excel export opens in spreadsheet app**
   - Action: Export as Excel, open file
   - Assert: File opens in Excel/Google Sheets
   - Assert: Formatting preserved
   - Assert: Formulas calculate correctly

3. **Test: PDF export prints correctly**
   - Action: Export as PDF, open and print
   - Assert: PDF renders in viewer
   - Assert: All content visible (not clipped)
   - Assert: Print preview shows proper layout

4. **Test: Filtered export includes only visible items**
   - Setup: Filter to 3 items
   - Action: Export with "Include filtered only" checked
   - Assert: Export contains 3 items, not 12
   - Assert: Filename includes "(Filtered)"
   - Assert: Filter summary in metadata

5. **Test: Export options affect output**
   - Setup: Disable "Include metadata"
   - Action: Export CSV
   - Assert: CSV has no metadata rows
   - Assert: Starts directly with header row

### End-to-End Tests

**Test Suite**: User Export Workflow

1. **Test: User exports BOM as CSV**
   - Setup: BOM panel open with 12 items
   - Action: User clicks Export button
   - Assert: Export dialog appears
   - Action: User selects CSV, clicks Export
   - Assert: File downloads successfully
   - Assert: Success notification shown
   - Assert: Dialog closes

2. **Test: User exports filtered BOM as Excel**
   - Setup: Filter active (3 items visible)
   - Action: User clicks Export
   - Assert: Dialog shows filter warning
   - Assert: "Include filtered only" auto-checked
   - Action: User selects Excel, clicks Export
   - Assert: Filtered Excel file downloads
   - Assert: Filename includes "(Filtered)"

3. **Test: User exports as PDF for printing**
   - Action: User selects PDF format
   - Action: User clicks Export
   - Assert: PDF downloads
   - Action: User opens PDF
   - Assert: PDF formatted for printing
   - Assert: All items visible and readable

4. **Test: User cancels export**
   - Setup: Export dialog open
   - Action: User clicks Cancel button
   - Assert: Dialog closes
   - Assert: No file downloaded
   - Assert: BOM panel remains visible

5. **Test: User exports large BOM**
   - Setup: BOM with 500 items
   - Action: User exports as Excel
   - Assert: Progress indicator shown
   - Assert: "Generating export... N/500"
   - Assert: Export completes successfully
   - Assert: File size warning if >5 MB

## Common Pitfalls

### Pitfall 1: Not Escaping Special Characters in CSV

**Problem**: Commas and quotes in descriptions break CSV parsing.

**Symptom**: CSV columns misaligned when opened in Excel. Description "Diffuser, 4-way" appears in two columns.

**Solution**: Properly quote and escape values:
- Quote values containing commas: "Diffuser, 4-way"
- Double internal quotes: 24" becomes "24"""
- Use RFC 4180 CSV standard

### Pitfall 2: Excel Formulas Not Calculating

**Problem**: Excel cells show formula text instead of calculated values.

**Symptom**: Total cost cell displays "=D5*F5" instead of $1,000.

**Solution**: Ensure formula strings formatted correctly:
- Use equals sign prefix: =SUM(...)
- Reference cells correctly: =D5*F5
- Set cell type to formula, not string

### Pitfall 3: PDF Content Clipped on Print

**Problem**: PDF appears correct on screen but right edge clipped when printed.

**Symptom**: Last column (Total Cost) cut off on printed page.

**Solution**: Account for printer margins:
- Use landscape orientation for wide tables
- Set PDF page margins (0.5" all sides)
- Test with print preview before export
- Reduce font size or column widths if needed

### Pitfall 4: Filename with Invalid Characters

**Problem**: Project name contains characters invalid for filenames (/, :, etc.).

**Symptom**: Download fails with error or filename corrupted.

**Solution**: Sanitize filename before download:
- Replace invalid chars: / \ : * ? " < > |
- Use underscores or remove invalid chars
- Fallback to generic filename if empty
- Test on Windows (strictest filename rules)

### Pitfall 5: Large Exports Freeze Browser

**Problem**: Exporting 5000+ items freezes browser tab during generation.

**Symptom**: UI unresponsive for 10+ seconds, browser shows "Page Unresponsive" warning.

**Solution**: Optimize for large exports:
- Show progress indicator immediately
- Use Web Worker for generation (offload from main thread)
- Stream/chunk export for very large files
- Offer pagination: "Export items 1-1000 first"

## Performance Tips

### Tip 1: Use Streaming for Large Excel Exports

Generating entire workbook in memory is memory-intensive:

**Implementation**: Use streaming Excel writer (ExcelJS stream mode). Write rows incrementally instead of building entire workbook first.

**Benefit**: Reduces memory usage from 50 MB to <5 MB for 5000-item export.

### Tip 2: Generate Exports in Web Worker

CSV/Excel generation on main thread blocks UI:

**Implementation**: Offload export generation to Web Worker. Pass data to worker, receive generated file back.

**Benefit**: UI remains responsive during export. User can continue working.

### Tip 3: Cache Generated Exports

Repeatedly exporting same BOM is wasteful:

**Implementation**: Cache generated export blob indexed by BOM version. Reuse if BOM unchanged.

**Benefit**: Instant export on repeat requests (no regeneration needed).

### Tip 4: Lazy Load Export Libraries

Excel/PDF libraries are large (100-500 KB):

**Implementation**: Dynamically import libraries only when export needed. Use code splitting for library bundles.

**Benefit**: Reduces initial page load by 300+ KB. Libraries load only on first export.

### Tip 5: Compress PDF Output

Default PDF generation creates large files:

**Implementation**: Enable PDF compression options. Reduce image quality for logos. Use efficient fonts.

**Benefit**: 50% file size reduction (100 KB → 50 KB for typical BOM).

## Future Enhancements

### Enhancement 1: Email Export

**Description**: Send exported BOM directly via email from application.

**User Value**: Share BOM without downloading, uploading, and attaching manually.

**Implementation**:
- "Email" button in export dialog
- Email form: To, CC, Subject, Message
- Attach generated BOM file
- Send via backend email service (SendGrid, AWS SES)

### Enhancement 2: Cloud Storage Integration

**Description**: Export BOM directly to Google Drive, Dropbox, OneDrive.

**User Value**: Automatic backup and sharing via cloud platforms.

**Implementation**:
- Connect cloud storage accounts in settings
- "Save to Drive" option in export
- OAuth authentication for cloud services
- Direct upload via cloud APIs

### Enhancement 3: Scheduled Recurring Exports

**Description**: Automatically export BOM on schedule (daily, weekly) for archival.

**User Value**: Automated record-keeping and version tracking.

**Implementation**:
- Schedule configuration: frequency, format, destination
- Background job generates exports
- Email notification when export complete
- Cloud storage or local folder destination

### Enhancement 4: Custom Export Templates

**Description**: User-defined export templates with custom columns, formatting, logos.

**User Value**: Match company standards and branding requirements.

**Implementation**:
- Template editor for defining columns and styles
- Upload company logo for PDF header
- Save templates for reuse across projects
- Share templates with team

### Enhancement 5: Multi-Format Export Package

**Description**: Export BOM in multiple formats simultaneously (CSV + PDF + Excel).

**User Value**: One-click generation of all needed formats.

**Implementation**:
- "Export Package" option in dialog
- Generates all three formats
- Downloads as ZIP archive
- Configurable package contents

### Enhancement 6: Export with Embedded Images

**Description**: Include equipment photos/diagrams in Excel and PDF exports.

**User Value**: Visual reference for material identification.

**Implementation**:
- Embed equipment images from database
- Image column in Excel
- Thumbnail images in PDF table
- Configurable image size and placement

### Enhancement 7: Live Linked Exports

**Description**: Generate exports with links back to web application for live updates.

**User Value**: Shared exports stay current as project changes.

**Implementation**:
- Export contains unique URL links to BOM
- Opening link shows current BOM state
- Recipients always see latest version
- Access control for shared links

### Enhancement 8: Export History and Versioning

**Description**: Track all previous exports with version comparison.

**User Value**: Audit trail of BOM changes over time.

**Implementation**:
- Store export snapshots in database
- "Export History" panel shows past exports
- Compare versions side-by-side
- Download historical exports

### Enhancement 9: Export to Procurement Systems

**Description**: Direct integration with supplier procurement platforms (API export).

**User Value**: Streamlined ordering process, eliminate manual data entry.

**Implementation**:
- Configure supplier API credentials
- Map BOM columns to supplier fields
- "Submit to Supplier" button
- Order confirmation integration

### Enhancement 10: Export Analytics

**Description**: Track export activity (frequency, formats, recipients).

**User Value**: Understand how BOM is being used and shared.

**Implementation**:
- Log all export events
- Dashboard showing export metrics
- Popular formats, frequent exporters
- Usage trends over time
