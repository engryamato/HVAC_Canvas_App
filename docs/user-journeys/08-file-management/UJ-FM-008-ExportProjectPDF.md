# [UJ-FM-008] Export Project to PDF

## Overview

This user journey covers exporting the current canvas design to a PDF document, including layout options, scale settings, page sizing, layer visibility, and embedded metadata for professional documentation.

## PRD References

- **FR-FM-008**: User shall be able to export project to PDF format
- **US-FM-008**: As a designer, I want to export to PDF so that I can share designs with clients and contractors
- **AC-FM-008-001**: File → Export → PDF opens export dialog
- **AC-FM-008-002**: PDF includes all visible entities at specified scale
- **AC-FM-008-003**: User can choose page size (Letter, A4, Tabloid, Custom)
- **AC-FM-008-004**: PDF includes title block, project info, and page numbers
- **AC-FM-008-005**: Exported PDF maintains accurate dimensions and scale
- **AC-FM-008-006**: Notes and annotations included in export

## Prerequisites

- User is in Canvas Editor with project open
- Project contains at least one entity to export
- PDF export library available (e.g., jsPDF, PDFKit)
- Sufficient disk space for PDF file

## User Journey Steps

### Step 1: Initiate PDF Export

**User Action**: Click File menu → Export → PDF

**Expected Result**:
- Export PDF dialog opens (modal)
- Dialog title: "Export to PDF"
- Export settings panel displayed:
  - **Page Settings**:
    - Page size: Letter (default), A4, Tabloid, Arch D, Custom
    - Orientation: Portrait, Landscape
    - Margins: 0.5" all sides (default, editable)
  - **Scale Settings**:
    - Scale: 1/4" = 1'-0" (default architectural scale)
    - Or: 1:48 (ratio format)
    - Custom scale option: Enter numerator/denominator
  - **Content Options**:
    - Include layers: All (default), Selected only
    - Include notes: Yes (checked), No
    - Include grid: No (default), Yes
    - Include dimensions: Yes (checked), No
  - **Title Block**:
    - Project name: Auto-filled from project
    - Designer: User name or editable
    - Date: Current date
    - Drawing number: Editable field
  - **Output**:
    - Filename: "{ProjectName}.pdf" (editable)
    - Save location: Last used folder
- Preview pane (right side):
  - Thumbnail of PDF layout
  - Shows how canvas fits on page
  - Updates in real-time with settings changes
- Action buttons:
  - "Export" (primary, blue)
  - "Cancel" (secondary)

**Validation Method**: E2E test - Verify export dialog opens with correct settings

---

### Step 2: Configure Export Settings

**User Action**: Change page size to Tabloid, orientation to Landscape, scale to 1/8"=1'-0"

**Expected Result**:
- Page size updated:
  - Tabloid: 11" × 17"
  - Orientation: Landscape → 17" × 11"
  - Canvas area: 17" - 1" margins = 16" wide × 10" tall
- Scale updated:
  - 1/8" = 1'-0" means 1 inch on page = 8 feet in design
  - Scale ratio: 1:96
  - Affects entity sizing on PDF
- Preview updates:
  - Canvas content scaled to fit on Tabloid landscape
  - All entities visible within page bounds
  - Scale notation shown on preview: "1/8\"=1'-0\""
- Dimension calculations:
  - If Room A is 20' × 15' in design:
    - PDF size: 2.5" × 1.875" (20'/8 × 15'/8)
- Settings saved:
  - User preferences persist for next export
  - Scale selection remembered per project
- Validation:
  - Check if content fits on page with selected scale
  - Warn if content too large: "Content may be cropped at this scale"

**Validation Method**: Unit test - Verify scale calculations correct

---

### Step 3: Generate PDF Document

**User Action**: Click "Export" button in dialog

**Expected Result**:
- Export process initiated
- Progress indicator shown:
  - Modal overlay with progress bar
  - Stage 1: "Rendering canvas..." (40%)
  - Stage 2: "Generating PDF..." (60%)
  - Stage 3: "Writing file..." (80%)
  - Stage 4: "Finalizing..." (100%)
- PDF generation steps:
  - **Canvas Rendering**:
    - Capture canvas at specified scale
    - Render all visible entities
    - Apply scale transformations
    - Include notes and annotations
  - **Page Layout**:
    - Create PDF document with page size
    - Draw title block border and fields
    - Position canvas render on page
    - Add margins and spacing
  - **Metadata Embedding**:
    - PDF title: Project name
    - Author: User name
    - Subject: HVAC design drawing
    - Creator: SizeWise v1.0
    - Keywords: HVAC, design, layout
  - **Content Layers**:
    - Layer 1: Grid (if enabled)
    - Layer 2: Entities (rooms, ducts, equipment)
    - Layer 3: Notes and annotations
    - Layer 4: Dimensions and labels
    - Layer 5: Title block
- Duration: 2-10 seconds depending on complexity
- Memory efficient: Stream to file (not full in-memory buffer)

**Validation Method**: Integration test - Verify PDF generation completes

---

### Step 4: Save PDF File

**User Action**: (Automatic after generation, or user chooses save location)

**Expected Result**:
- File save dialog opens (native OS dialog):
  - Default filename: "Office HVAC.pdf"
  - Default location: Last used export folder
  - File type: PDF Document (*.pdf)
- User confirms save location
- PDF written to disk:
  - File size: Varies (typical 50KB - 5MB)
  - Compressed PDF format
  - Includes all embedded data
- File operations:
  - Atomic write (temp file + rename)
  - Verify write successful
  - Check disk space before writing
- Save complete:
  - Success message: "PDF exported successfully"
  - File path shown: "Saved to: /path/to/Office HVAC.pdf"
  - Option to "Open PDF" (launches default PDF viewer)
  - Option to "Show in Folder" (reveals file)
- Dialog closes automatically after save
- Export settings saved for next export

**Validation Method**: Integration test - Verify PDF file written to disk

---

### Step 5: Verify PDF Content

**User Action**: Click "Open PDF" button to view exported file

**Expected Result**:
- PDF opens in default viewer (Adobe, Preview, Chrome, etc.)
- PDF content verified:
  - **Page 1 (Main Drawing)**:
    - Title block at bottom:
      - Project: "Office HVAC"
      - Designer: "John Smith"
      - Date: "2025-01-15"
      - Scale: "1/8\" = 1'-0\""
      - Drawing #: "M-1"
    - Canvas content:
      - All rooms rendered with correct dimensions
      - Ducts shown with connection lines
      - Equipment symbols visible
      - Notes positioned correctly
      - Grid shown (if enabled)
    - Dimensions accurate:
      - 20' room measures 2.5" on page (20' / 8 = 2.5")
      - Scaled correctly
    - Visual quality:
      - Crisp lines (vector graphics)
      - Clear text (embedded fonts)
      - Professional appearance
  - **Page 2+ (If Multi-Page)**:
    - Continuation pages for large drawings
    - Page numbers: "Page 2 of 3"
    - Consistent title block on each page
- PDF metadata visible (File → Properties):
  - Title: Office HVAC
  - Author: John Smith
  - Creator: SizeWise HVAC Design v1.0
  - Created: 2025-01-15
- PDF functional:
  - Zoomable (vector graphics scale smoothly)
  - Printable with accurate dimensions
  - Selectable text in notes
  - Searchable (if text embedded)

**Validation Method**: E2E test - Verify PDF content matches canvas

---

## Edge Cases

### 1. Very Large Canvas (Multi-Page Export)

**User Action**: Export canvas with 500ft × 500ft design at 1/4"=1'-0" scale

**Expected Behavior**:
- Single page calculation:
  - 500ft at 1/4"=1'-0" = 125" (500/4)
  - Letter page: 8.5" × 11" (minus margins)
  - Content exceeds single page significantly
- Multi-page handling:
  - Option A: Scale down to fit single page
    - Warn: "Content scaled to 1/32\"=1'-0\" to fit"
    - User confirms or adjusts
  - Option B: Split into multiple pages (tiled)
    - Create 3×3 grid of pages (9 pages total)
    - Each page shows portion of design
    - Match marks between pages for alignment
  - Option C: Use larger page size
    - Suggest: "Use Arch D (24\"×36\") size instead?"
- Default: Option A (auto-scale to fit)
- User can override with manual page selection

**Validation Method**: Integration test - Verify large canvas handling

---

### 2. Export with Hidden Layers

**User Action**: Hide equipment layer, export to PDF

**Expected Behavior**:
- Layer visibility respected:
  - Equipment layer hidden in canvas
  - Export checks layer visibility flags
  - Hidden layers excluded from PDF
- PDF content:
  - Rooms: Visible (included)
  - Ducts: Visible (included)
  - Equipment: Hidden (excluded)
  - Notes: Visible (included)
- Export dialog option:
  - "Include hidden layers: No" (default)
  - "Include hidden layers: Yes" - overrides visibility
- Useful for creating multiple PDF variants:
  - Equipment-only PDF
  - Layout-only PDF
  - Full design PDF

**Validation Method**: Unit test - Verify layer visibility filtering

---

### 3. Export with Custom Page Size

**User Action**: Select "Custom" page size, enter 24" × 36"

**Expected Behavior**:
- Custom page size option:
  - Width input: 24 inches
  - Height input: 36 inches
  - Validation: Min 1", Max 200"
- PDF generation:
  - Creates non-standard page size
  - 24" × 36" PDF page
  - May require large-format printer
- Preview updates:
  - Shows custom page dimensions
  - Canvas fits within 24" × 36"
- Warning for non-standard sizes:
  - "Custom size may not print on standard printers"
  - Suggest: "Use Arch D (24\"×36\") for standard size"
- PDF metadata:
  - Page size: 24" × 36" (custom)
  - Flagged as large format

**Validation Method**: Unit test - Verify custom page size handling

---

### 4. Export Empty Canvas

**User Action**: Export project with no entities (empty canvas)

**Expected Behavior**:
- Empty canvas detected
- Export dialog shows warning:
  - "Canvas is empty. PDF will only contain title block."
  - Continue anyway? Yes/No
- If user continues:
  - PDF generated with title block only
  - Large blank area where canvas would be
  - Valid PDF (not an error)
- If user cancels:
  - Export aborted
  - Return to canvas
- Useful for template creation:
  - Blank title block PDF
  - User can sketch manually

**Validation Method**: E2E test - Verify empty canvas export

---

### 5. Export with Special Characters in Project Name

**User Action**: Export project named "Office #1 (Main) - 50% Complete"

**Expected Behavior**:
- Project name sanitization:
  - Invalid filename characters removed/replaced
  - `#` → `-` (hyphen)
  - `/` → `-`
  - `:` → `-`
  - `%` → `percent`
- Suggested filename: "Office-1-(Main)-50-percent-Complete.pdf"
- User can edit before saving
- Title block shows original name:
  - "Office #1 (Main) - 50% Complete" (unsanitized)
- No errors from special characters

**Validation Method**: Unit test - Verify filename sanitization

---

## Error Scenarios

### 1. Insufficient Disk Space

**Scenario**: Export large PDF but disk has only 10MB free

**Expected Handling**:
- PDF generation starts
- File write fails: "Insufficient disk space"
- Error dialog:
  - "Cannot save PDF. Insufficient disk space."
  - "Required: ~50MB, Available: 10MB"
  - Options: "Free Space" (opens disk manager), "Cancel"
- Partial file cleaned up:
  - Temp file deleted
  - No corrupted PDF left on disk
- User must free space and retry export

**Validation Method**: Integration test - Verify disk space check

---

### 2. PDF Generation Timeout

**Scenario**: Extremely complex canvas (10,000 entities) takes >60 seconds to export

**Expected Handling**:
- Export progress shown
- After 60 seconds: Timeout warning
  - "Export taking longer than expected..."
  - "Continue waiting or cancel?"
  - Options: Wait, Cancel
- If user waits:
  - Export continues (extended timeout to 5 minutes)
  - Progress updates every 10 seconds
- If user cancels:
  - Export aborted
  - Temp files cleaned up
- Suggest optimization:
  - "Try hiding some layers to reduce complexity"
  - "Or export at smaller scale"

**Validation Method**: Performance test - Verify timeout handling

---

### 3. PDF Library Failure

**Scenario**: PDF generation library throws error (rare)

**Expected Handling**:
- Error caught during PDF generation
- Error dialog:
  - "PDF export failed. Technical error occurred."
  - Details: Technical error message
  - Options: "Report Bug", "Retry", "Cancel"
- Fallback export attempt:
  - Try alternative PDF method (canvas-to-image-to-PDF)
  - Lower quality but functional
  - Warn: "Using fallback export method (raster images)"
- If fallback fails:
  - Suggest alternative: Export → PNG (always works)
  - User can convert PNG to PDF externally

**Validation Method**: Unit test - Verify error handling and fallback

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Export Dialog | `Ctrl/Cmd + Shift + E` |
| Quick Export (Last Settings) | `Ctrl/Cmd + E` |

---

## Related Elements

- [ExportPDF](../../elements/10-persistence/ExportPDF.md) - PDF export implementation
- [CanvasRenderer](../../elements/03-rendering/CanvasRenderer.md) - Canvas to PDF rendering
- [TitleBlock](../../elements/01-components/export/TitleBlock.md) - Title block component
- [ScaleCalculator](../../elements/06-calculations/ScaleCalculator.md) - Dimension scaling
- [FileDialog](../../elements/01-components/dialogs/FileDialog.md) - Save dialog
- [projectStore](../../elements/02-stores/projectStore.md) - Project metadata
- [UJ-FM-003](./UJ-FM-003-SaveProjectFile.md) - File save operations (related)

---

## Visual Diagram

```
PDF Export Flow
┌────────────────────────────────────────────────────────┐
│  1. User: File → Export → PDF                         │
│     ↓                                                  │
│  2. Export Dialog Opens                               │
│     - Page size: Tabloid (11×17)                       │
│     - Orientation: Landscape                           │
│     - Scale: 1/8" = 1'-0"                              │
│     - Include notes: Yes                               │
│     ↓                                                  │
│  3. User Clicks "Export"                               │
│     ↓                                                  │
│  4. PDF Generation                                     │
│     Stage 1: Render canvas at scale ───→ [Canvas PNG]  │
│     Stage 2: Create PDF document ───→ [PDF Object]     │
│     Stage 3: Add title block ───→ [PDF + Title]        │
│     Stage 4: Embed metadata ───→ [Complete PDF]        │
│     ↓                                                  │
│  5. Save to Disk                                       │
│     File: "Office HVAC.pdf"                            │
│     Size: 1.2 MB                                       │
│     ↓                                                  │
│  6. Success Message                                    │
│     "PDF exported successfully"                        │
│     [Open PDF] [Show in Folder] [Close]                │
└────────────────────────────────────────────────────────┘

PDF Page Layout (Tabloid Landscape):
┌────────────────────────────────────────────────────────┐
│  17" width                                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 0.5" margin                                      │ │
│  │  ┌────────────────────────────────────────────┐ │ │
│  │  │                                            │ │ │
│  │  │         CANVAS CONTENT                     │ │ │
│  │  │         (Scaled to fit)                    │ │ │
│  │  │                                            │ │ │
│  │  │  All entities, ducts, equipment, notes     │ │ │
│  │  │                                            │ │ │
│  │  └────────────────────────────────────────────┘ │ │
│  │                                                  │ │
│  │  ┌────────────────────────────────────────────┐ │ │
│  │  │ TITLE BLOCK                                │ │ │
│  │  │ Project: Office HVAC  | Scale: 1/8"=1'-0" │ │ │
│  │  │ Designer: John Smith  | Date: 2025-01-15   │ │ │
│  │  │ Drawing #: M-1        | Page: 1 of 1       │ │ │
│  │  └────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────┘ │
│  11" height                                            │
└────────────────────────────────────────────────────────┘

Scale Calculation Example:
┌────────────────────────────────────────────────────────┐
│  Design Dimensions:                                    │
│  Room A: 20 feet × 15 feet                             │
│                                                        │
│  Selected Scale: 1/8" = 1'-0"                          │
│  Meaning: 1 inch on paper = 8 feet in reality          │
│  Ratio: 1:96                                           │
│                                                        │
│  PDF Dimensions:                                       │
│  Room A width: 20 ft ÷ 8 = 2.5 inches                  │
│  Room A height: 15 ft ÷ 8 = 1.875 inches               │
│                                                        │
│  Verification:                                         │
│  2.5" × 96 = 240" = 20 ft ✓                            │
│  1.875" × 96 = 180" = 15 ft ✓                          │
└────────────────────────────────────────────────────────┘

Export Dialog Layout:
┌────────────────────────────────────────────────────────┐
│  Export to PDF                                    [×]  │
│  ────────────────────────────────────────────────────  │
│  ┌─────────────────────┬──────────────────────────┐   │
│  │ Settings            │ Preview                  │   │
│  │                     │                          │   │
│  │ Page Size:          │  ┌────────────────────┐  │   │
│  │ [Tabloid ▼]         │  │                    │  │   │
│  │                     │  │   [Canvas Thumb]   │  │   │
│  │ Orientation:        │  │                    │  │   │
│  │ ○ Portrait          │  │   Scale: 1/8"=1'   │  │   │
│  │ ● Landscape         │  └────────────────────┘  │   │
│  │                     │                          │   │
│  │ Scale:              │  17" × 11"               │   │
│  │ [1/8" = 1'-0" ▼]    │  Tabloid Landscape       │   │
│  │                     │                          │   │
│  │ Include:            │                          │   │
│  │ ☑ Notes             │                          │   │
│  │ ☐ Grid              │                          │   │
│  │ ☑ Dimensions        │                          │   │
│  │                     │                          │   │
│  │ File:               │                          │   │
│  │ [Office HVAC.pdf]   │                          │   │
│  │ [Browse...]         │                          │   │
│  └─────────────────────┴──────────────────────────┘   │
│                                                        │
│                           [Cancel] [Export PDF]        │
└────────────────────────────────────────────────────────┘

Multi-Page Export (Large Canvas):
┌────────────────────────────────────────────────────────┐
│  Canvas too large for single page at scale             │
│                                                        │
│  Page 1 of 4:          Page 2 of 4:                    │
│  ┌─────────────┐      ┌─────────────┐                 │
│  │ NW Quadrant │      │ NE Quadrant │                 │
│  │   [A] [B]   │ ──→  │   [C] [D]   │                 │
│  └─────────────┘      └─────────────┘                 │
│         ↓                     ↓                        │
│  Page 3 of 4:          Page 4 of 4:                    │
│  ┌─────────────┐      ┌─────────────┐                 │
│  │ SW Quadrant │      │ SE Quadrant │                 │
│  │   [E] [F]   │      │   [G] [H]   │                 │
│  └─────────────┘      └─────────────┘                 │
│                                                        │
│  Match marks at edges for alignment when printed       │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/export/ExportPDF.test.ts`

**Test Cases**:
- Scale calculation (design units to PDF units)
- Page size calculation (Letter, A4, Tabloid)
- Canvas fitting algorithm (auto-scale to fit)
- Title block text generation
- Filename sanitization
- Metadata embedding

**Assertions**:
- 20ft room at 1/8"=1' scale = 2.5" on PDF
- Letter portrait = 8.5" × 11"
- Content scales to fit selected page size
- Title block contains project metadata
- Special characters removed from filename
- PDF metadata matches project info

---

### Integration Tests
**File**: `src/__tests__/integration/pdf-export.test.ts`

**Test Cases**:
- Complete PDF export workflow
- PDF file written to disk
- PDF contains all visible entities
- Multi-page export for large canvas
- Layer visibility filtering
- Custom page size handling

**Assertions**:
- PDF file exists at specified path
- File size > 0 bytes
- All entities rendered in PDF
- Large canvas splits into multiple pages
- Hidden layers excluded from PDF
- Custom page dimensions applied

---

### E2E Tests
**File**: `e2e/file-management/export-pdf.spec.ts`

**Test Cases**:
- Visual export dialog opening
- Settings configuration in dialog
- Preview thumbnail updates
- Export button click
- Success message display
- Open PDF button launches viewer

**Assertions**:
- Export dialog visible with settings
- Preview shows canvas content
- Settings persist between exports
- "PDF exported successfully" message shown
- PDF opens in default viewer

---

## Common Pitfalls

### ❌ Don't: Export at inconsistent scales
**Problem**: PDF dimensions don't match industry standards

**Solution**: Provide preset architectural scales (1/8", 1/4", etc.)

---

### ❌ Don't: Embed raster images when vector graphics possible
**Problem**: Blurry when zooming in PDF, large file sizes

**Solution**: Use vector graphics (SVG paths) for entities, text as text

---

### ❌ Don't: Forget to include scale notation
**Problem**: User can't verify dimensions when printing

**Solution**: Always include scale in title block and on page

---

### ✅ Do: Validate content fits on page before export
**Benefit**: Prevents cropped or distorted output

---

### ✅ Do: Offer "Open PDF" after export
**Benefit**: User can immediately verify export quality

---

## Performance Tips

### Optimization: Render to Canvas First, Then PDF
**Problem**: Direct SVG-to-PDF rendering is slow for complex designs

**Solution**: Render entities to HTML canvas, export canvas to PDF
- 10x faster rendering
- Consistent output quality
- Better browser compatibility

---

### Optimization: Progressive Rendering for Large PDFs
**Problem**: Generating 50-page PDF freezes UI for minutes

**Solution**: Render pages incrementally with progress updates
- Render page 1, update progress (10%)
- Render page 2, update progress (20%)
- Keep UI responsive between pages
- User can cancel mid-export

---

### Optimization: Compress PDF with Deflate
**Problem**: Uncompressed PDF with vector graphics is 20MB

**Solution**: Enable PDF compression (Deflate algorithm)
- 90% size reduction typical
- No quality loss
- Faster file transfer

---

## Future Enhancements

- **Export to DWG**: CAD-compatible format for AutoCAD
- **Export to SVG**: Scalable vector graphics for web
- **Batch Export**: Export multiple projects to PDF at once
- **Email PDF**: Send PDF directly from app
- **Cloud Upload**: Upload PDF to Google Drive, Dropbox
- **3D PDF**: Embed 3D models in PDF (ISO 32000-2 standard)
- **Layer-Aware PDF**: Preserve layers in PDF for viewer control
- **Password Protection**: Encrypt PDF with password
- **Digital Signature**: Sign PDF for authentication
- **Accessibility**: PDF/UA compliant for screen readers
