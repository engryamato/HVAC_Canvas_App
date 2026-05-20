# Phase 4.3: Multi-Format Export System (PDF, CSV, Excel)


## Overview

Implement comprehensive export system supporting PDF, CSV, and Excel formats with customizable options and validation before export.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 8: Project Export for Bidding)

## Scope

**In Scope**:
- PDF export with formatting, company branding, cost summary
- CSV export for material ordering
- Excel export with multi-sheet workbook (Summary, Ducts, Fittings, Equipment, Labor)
- Export dialog with options (format, include pricing, grouping, show images)
- Validation before export (check for constraint violations)
- Export history tracking

**Out of Scope**:
- Custom export templates (future enhancement)
- Email integration (not in scope)

## Key Files

**Modify**:
- `file:hvac-design-app/src/features/export/bom.ts` - Enhance CSV export
- `file:hvac-design-app/src/features/export/index.ts` - Export orchestration

**Create**:
- `file:hvac-design-app/src/features/export/pdf.ts` - PDF generation with jsPDF
- `file:hvac-design-app/src/features/export/excel.ts` - Excel generation with ExcelJS
- `file:hvac-design-app/src/features/export/ExportDialog.tsx` - Export options UI
- `file:hvac-design-app/src/features/export/exportValidation.ts` - Pre-export validation

## Acceptance Criteria

- [ ] CSV export generates flat table (Item, Qty, Unit Cost, Labor, Total)
- [ ] PDF export generates formatted document with project header, BOM, cost summary
- [ ] Excel export generates multi-sheet workbook with separate sheets per category
- [ ] Export dialog shows format options (PDF, CSV, Excel)
- [ ] Export dialog shows content options (include pricing, include images, grouping)
- [ ] Pre-export validation checks for constraint violations
- [ ] Warning dialog if violations exist: "Design has 3 violations. Include in export notes?"
- [ ] Export history tracked (who, when, format)
- [ ] Success notification: "Export complete: ProjectName_BOM_2024-02-11.pdf"
- [ ] Error handling: disk space, file permissions, file exists

## Dependencies

- **Requires**: Phase 4.2 (enhanced BOM data)
- **Requires**: Phase 2.3 (validation store for pre-export validation)

## Technical Notes

**Export Formats**:
- **CSV**: Simple flat table, importable to Excel/ERP
- **PDF**: Formatted document with jsPDF, company letterhead
- **Excel**: Multi-sheet with ExcelJS, formulas for totals
