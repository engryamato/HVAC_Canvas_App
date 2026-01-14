# [UJ-PM-008] Export Project Report

## Overview

### Purpose
This document describes how users export comprehensive project reports that include metadata, entity summaries, calculations, and BOM details for client delivery.

### Scope
**In Scope:**
- Opening the export dialog from the canvas
- Configuring report options and sections
- Generating the PDF report
- Saving or downloading the generated file

**Out of Scope:**
- CSV or Excel exports (see 09-export journeys)
- Automated scheduled reporting
- Emailing reports directly from the app

### User Personas
- **Primary**: HVAC designers delivering reports to clients
- **Secondary**: Project managers reviewing project documentation
- **Tertiary**: Sales or estimating teams packaging deliverables

### Success Criteria
- Export dialog opens from the File menu or shortcut
- Report options apply correctly with clear previews
- PDF generation completes with progress feedback
- Exported file is saved or downloaded successfully
- Report content matches selected sections and branding

## Platform Context

This journey applies to both Tauri Desktop and Web Browser deployments. Key differences are handled through platform detection and storage backends.

### Platform Detection
- Runtime check: `typeof window !== 'undefined' && '__TAURI__' in window`
- UI adapts for native dialogs and file operations in Tauri
- Web mode uses browser storage and download flows

### Feature Parity Summary
| Feature | Tauri Desktop | Web Browser | Notes |
| --- | --- | --- | --- |
| Project storage | File system (.sws) | IndexedDB/localStorage | Web storage quotas apply |
| File dialogs | Native OS dialogs | Browser download/upload | Different UX patterns |
| Offline work | Full offline | Limited (cache/PWA) | Tauri supports true offline |
| Auto-backup | `.sws.bak` file | Export recommended | Tauri maintains backups |

### Platform-Specific Components
| Component | Tauri Desktop | Web Browser |
| --- | --- | --- |
| Storage service | `@tauri-apps/api/fs` | IndexedDB/localStorage |
| File picker | Tauri dialog APIs | `<input type="file">` |
| Export handler | Native save | Browser download |

### Related Platform Docs
- [UJ-GS-006-EnvironmentDetection.md](../00-getting-started/UJ-GS-006-EnvironmentDetection.md)
- [UJ-GS-002-DeviceCompatibility.md](../00-getting-started/UJ-GS-002-DeviceCompatibility.md)

## PRD References

- **FR-PM-008**: User shall be able to export project reports
- **US-PM-008**: As a designer, I want to export reports so that I can share project details with clients
- **AC-PM-008-001**: Export accessible from canvas editor File menu
- **AC-PM-008-002**: Report includes project metadata, entity summary, and calculations
- **AC-PM-008-003**: PDF format with company branding
- **AC-PM-008-004**: Export progress indicator shown
- **AC-PM-008-005**: Generated PDF opens automatically or saves to chosen location

## Prerequisites

### User Prerequisites
| Requirement | Description |
| --- | --- |
| Canvas access | User is in the Canvas Editor |
| Report intent | User knows which report sections to include |

### System Prerequisites
| Requirement | Description |
| --- | --- |
| Export dialog available | File menu exposes export report action |
| PDF generator ready | PDF library loaded and initialized |
| Calculation data ready | BOM and calculation data accessible |

### Data Prerequisites
| Requirement | Description |
| --- | --- |
| Project entities | At least one entity exists for meaningful output |
| Project metadata | Name, client, and identifiers available |

### Technical Prerequisites
| Component | Purpose | Location |
| --- | --- | --- |
| `ExportDialog` | Collects export options | `src/components/canvas/ExportDialog.tsx` |
| `ReportGenerator` | Builds PDF output | `src/lib/ReportGenerator.ts` |
| `entityStore` | Supplies entity data | `src/stores/entityStore.ts` |

## User Journey Steps

### Step 1: Initiate Export

**User Action**: Click File menu → "Export Report" OR press `Ctrl/Cmd+P`

**Expected Result**:
- Export Report Dialog opens
- Dialog shows export options:
  - **Report Type**: (dropdown)
    - Full Report (all sections)
    - Summary Report (metadata + totals only)
    - BOM Only (materials list)
    - Calculations Only (HVAC calcs)
  - **Include**:  (checkboxes)
    - ✓ Project Details
    - ✓ Entity List
    - ✓ HVAC Calculations
    - ✓ Bill of Materials
    - ✓ Canvas Screenshot
  - **Format**: PDF (future: Excel, CSV)
  - **Paper Size**: Letter (8.5" × 11") / A4
  - **Orientation**: Portrait / Landscape
- "Export" button enabled
- "Cancel" button enabled

**Validation Method**: E2E test
```typescript
await page.click('button:has-text("File")');
await page.click('button:has-text("Export Report")');

await expect(page.locator('dialog h2')).toHaveText('Export Project Report');
await expect(page.locator('select[name="reportType"]')).toBeVisible();
```

---

### Step 2: Configure Export Options

**User Action**: Select "Full Report", ensure all sections checked, choose "Landscape" orientation

**Expected Result**:
- Options update in dialog
- Preview thumbnail updates (optional)
- Estimated page count shown: "~8 pages"
- File size estimate: "~2.5 MB"
- Export button remains enabled

**Validation Method**: Unit test
```typescript
it('calculates page count based on selected sections', () => {
  const options = {
    reportType: 'full',
    includeSections: ['details', 'entities', 'calculations', 'bom', 'screenshot'],
    orientation: 'landscape'
  };

  const pageCount = estimatePageCount(mockProject, options);

  expect(pageCount).toBeGreaterThan(5);
});
```

---

### Step 3: Generate Report

**User Action**: Click "Export" button

**Expected Result**:
- Export begins
- Progress dialog replaces options:
  - Title: "Generating Report..."
  - Progress bar: 0% → 100%
  - Status messages:
    - "Collecting project data..."
    - "Generating calculations..."
    - "Creating PDF..."
    - "Finalizing..."
- Buttons disabled during export
- Cannot cancel once started (or "Cancel" available)

**Validation Method**: Integration test
```typescript
it('generates PDF report with all sections', async () => {
  const options = {
    reportType: 'full',
    includeSections: ['details', 'entities', 'calculations', 'bom'],
    format: 'pdf'
  };

  const pdfBlob = await generateReport(mockProject, options);

  expect(pdfBlob).toBeInstanceOf(Blob);
  expect(pdfBlob.type).toBe('application/pdf');
  expect(pdfBlob.size).toBeGreaterThan(1000); // At least 1KB
});
```

---

### Step 4: Save or Open PDF

**User Action**: (Automatic - triggered by export completion)

**Expected Result**:
- **Desktop App**: Native save dialog opens
  - Default name: "{ProjectName}_Report_{Date}.pdf"
  - Default location: User's Documents folder
  - User chooses location and clicks Save
- **Web App**: Browser download initiated
  - File downloads to default Downloads folder
  - Download notification shown
- Progress dialog shows: "Report generated successfully!"
- "Open File" button appears
- "Close" button available

**Validation Method**: E2E test (Desktop)
```typescript
await page.click('button:has-text("Export")');

await waitFor(() => {
  expect(invoke).toHaveBeenCalledWith('save_file_dialog', expect.objectContaining({
    defaultPath: expect.stringContaining('_Report_'),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  }));
});
```

---

### Step 5: View Generated Report

**User Action**: Click "Open File" button (or navigate to saved location)

**Expected Result**:
- PDF opens in default PDF viewer
- Report contains:
  - **Page 1: Cover Page**
    - Project name (large heading)
    - Client name
    - Project number
    - Date generated
    - Company logo (if configured)
  - **Page 2: Project Details**
    - Metadata table
    - Location
    - Entity count
    - Total CFM
  - **Page 3-4: Entity List**
    - Table of all rooms with dimensions, ACH, CFM
    - Table of all ducts with size, length, CFM
    - Equipment list with specs
  - **Page 5-6: HVAC Calculations**
    - Room ventilation calculations
    - Duct sizing calculations
    - Pressure drop calculations
  - **Page 7: Bill of Materials**
    - Itemized list of all components
    - Quantities
    - Specifications
  - **Page 8: Canvas Screenshot**
    - Full project layout image
    - Scale indicator
- Professional formatting
- Page numbers
- Header/footer with project name

**Validation Method**: Manual verification (PDF content inspection)

---

## Edge Cases

### 1. Export Empty Project

**User Action**: Export project with 0 entities

**Expected Behavior**:
- Warning dialog:
  - "Project has no entities."
  - "Export anyway?" (Yes/No)
- If Yes → Generate minimal report (only project details)
- If No → Return to canvas

**Test**:
```typescript
it('warns when exporting empty project', () => {
  const emptyProject = { ...mockProject, entityCount: 0 };

  const result = validateExport(emptyProject);

  expect(result.warnings).toContainEqual(expect.stringContaining('no entities'));
});
```

---

### 2. Very Large Report (50+ Pages)

**User Action**: Export project with 500 entities (generates 50+ page report)

**Expected Behavior**:
- Export takes 10-30 seconds
- Progress updates frequently (every 5%)
- File size warning: "Report will be large (~15 MB). Continue?"
- PDF generation completes successfully
- Memory usage managed (stream to disk, not all in memory)

---

### 3. Export During Unsaved Changes

**User Action**: Make changes, then export without saving

**Expected Behavior**:
- Warning in export dialog:
  - "⚠️ You have unsaved changes."
  - "Report will reflect latest changes."
  - Checkbox: "Save project before exporting" (checked by default)
- If checked → Auto-save project, then export
- If unchecked → Export current state only

---

### 4: Custom Company Branding

**User Action**: Configure company logo/colors in settings, then export

**Expected Behavior**:
- PDF includes custom branding:
  - Company logo on cover page and headers
  - Custom color scheme (primary/secondary colors)
  - Company contact info in footer
- Branding settings persist across exports

---

### 5: Export to Different Formats (Future)

**User Action**: Select "Excel" format instead of PDF

**Expected Behavior**:
- Generate .xlsx file with:
  - Multiple sheets (Project Details, Rooms, Ducts, Equipment, BOM)
  - Formatted tables with headers
  - Formulas for calculations
  - No screenshots (Excel limitation)

---

## Error Scenarios

### 1: PDF Generation Library Error

**Scenario**: PDF library throws exception during generation

**Expected Handling**:
- Error caught during generation
- Progress dialog shows error:
  - "Failed to generate report. Please try again."
  - Error details in console
- "Retry" button available
- "Close" button returns to canvas
- No partial PDF created

**Test**:
```typescript
it('handles PDF generation errors gracefully', async () => {
  vi.mocked(generatePDF).mockRejectedValueOnce(new Error('PDF error'));

  await expect(generateReport(mockProject, options)).rejects.toThrow();

  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to generate'));
});
```

---

### 2: File System Write Permission Error

**Scenario**: Cannot write PDF to selected location

**Expected Handling**:
- Save dialog fails with permission error
- Error toast: "Cannot save report. Permission denied."
- "Save As..." dialog reopens
- User can choose different location
- PDF data retained in memory (can retry)

---

### 3: Out of Memory (Very Large Project)

**Scenario**: Generating report for 2000-entity project exhausts memory

**Expected Handling**:
- Detect memory pressure during generation
- Switch to disk-based generation (stream to file)
- Progress may slow down (acceptable)
- Alternatively: Show error, suggest exporting in sections

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Export Dialog | `Ctrl/Cmd + P` |
| Quick Export (last settings) | `Ctrl/Cmd + Shift + P` |

---

## Related Elements

- [ExportDialog](../../elements/01-components/canvas/ExportDialog.md) - Export options dialog
- [ReportGenerator](../../elements/11-libraries/ReportGenerator.md) - PDF generation logic
- [BOMPanel](../../elements/01-components/canvas/BOMPanel.md) - BOM data source
- [entityStore](../../elements/02-stores/entityStore.md) - Entity data
- [VentilationCalculator](../../elements/06-calculators/VentilationCalculator.md) - Calculation data

---

## Test Implementation

### Unit Tests
- `src/__tests__/utils/reportGenerator.test.ts`
  - PDF structure
  - Content formatting
  - Page layout

### Integration Tests
- `src/__tests__/integration/project-export.test.ts`
  - End-to-end generation
  - Data collection
  - File I/O

### E2E Tests
- `e2e/project-management/export-report.spec.ts`
  - Complete export workflow
  - All report types
  - Save dialog interaction

---

## Notes

### Implementation

```typescript
// reportGenerator.ts
export async function generateReport(
  project: Project,
  options: ExportOptions
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: options.orientation,
    unit: 'in',
    format: options.paperSize
  });

  let currentY = 1;

  // Cover page
  if (options.includeSections.includes('cover')) {
    currentY = addCoverPage(doc, project, currentY);
    doc.addPage();
    currentY = 1;
  }

  // Project details
  if (options.includeSections.includes('details')) {
    currentY = addProjectDetails(doc, project, currentY);
  }

  // Entity lists
  if (options.includeSections.includes('entities')) {
    currentY = addEntityLists(doc, project, currentY);
  }

  // Calculations
  if (options.includeSections.includes('calculations')) {
    currentY = addCalculations(doc, project, currentY);
  }

  // BOM
  if (options.includeSections.includes('bom')) {
    currentY = addBOM(doc, project, currentY);
  }

  // Canvas screenshot
  if (options.includeSections.includes('screenshot')) {
    currentY = await addCanvasScreenshot(doc, project, currentY);
  }

  // Add page numbers and footers
  addPageNumbers(doc, project.name);

  return doc.output('blob');
}

function addCoverPage(doc: jsPDF, project: Project, y: number): number {
  // Logo
  if (settings.companyLogo) {
    doc.addImage(settings.companyLogo, 'PNG', 3, y, 2, 0.5);
    y += 1;
  }

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(project.name, 4.25, y, { align: 'center' });
  y += 0.5;

  // Client
  if (project.clientName) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(project.clientName, 4.25, y, { align: 'center' });
    y += 0.4;
  }

  // Date
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 4.25, y, { align: 'center' });

  return y;
}
```

### PDF Libraries

**Options**:
- **jsPDF**: Client-side PDF generation (lightweight, 100KB)
- **pdfmake**: More features, complex layouts
- **Puppeteer**: HTML → PDF (server-side, high quality)

**Recommendation**: jsPDF for desktop app (no server needed)

### Report Sections

**Cover Page**: Branding, project name, client, date
**Project Details**: Metadata, location, summary stats
**Entity Lists**: Tables of rooms, ducts, equipment
**Calculations**: Detailed HVAC calculations with formulas
**BOM**: Materials list with quantities
**Canvas Screenshot**: Visual project layout
**Appendices**: Notes, assumptions, codes referenced

### Performance

**Typical Generation Times**:
- Small project (< 50 entities): 1-3 seconds
- Medium project (50-200 entities): 3-10 seconds
- Large project (200-1000 entities): 10-30 seconds

### Accessibility

- Export dialog fully keyboard accessible
- Progress announced to screen readers
- Generated PDF has proper structure (headings, tables)
- PDF is searchable and screen-reader friendly

### Future Enhancements

- **Excel Export**: Multi-sheet workbooks with formulas
- **Word Export**: Editable reports
- **Custom Templates**: User-defined report layouts
- **Scheduled Reports**: Auto-generate weekly/monthly
- **Email Integration**: Send report directly to client
- **Cloud Storage**: Save to Google Drive/Dropbox
