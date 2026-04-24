# Export & Print

## Overview

The export feature provides a unified dialog for PDF/PNG/SVG exports and a print dialog that mirrors the design system (Technical Blue primary actions, Slate controls). It integrates analytics, edge-case handling, and both Tauri/native and web download workflows.

## Export Dialog

### UI
- Two-column layout with options on the left and a live preview on the right.
- Preview uses [`captureCanvasSnapshot()`](hvac-design-app/src/features/export/canvasSnapshot.ts:9) and updates on option changes (debounced).
- Progress indicator appears when exports exceed 500ms.

### Options
- **Format:** PDF / PNG / SVG
- **PNG Quality:** Low (72 DPI), Medium (150 DPI), High (300 DPI)
- **PDF Page Size:** Letter, A4, Custom (custom width/height in inches)
- **Include:** Grid, Dimensions, Labels

### Edge Cases
- **Empty canvas:** Confirmation dialog before exporting a blank file.
- **Unsaved changes:** Confirmation dialog before exporting latest state.
- **Large files:** Warning dialog when estimated size exceeds 50MB.
- **Export failures:** Error dialog with retry.

### Usage
```tsx
import { EnhancedExportDialog } from '@/features/export/components/EnhancedExportDialog';

<EnhancedExportDialog
  open={open}
  onOpenChange={setOpen}
  onExport={(options) => exportProject(projectFile, options)}
/>
```

## Print Dialog

The print dialog provides orientation, scale, and margin controls with a preview snapshot.

### Options
- **Orientation:** Portrait / Landscape
- **Scale:** Fit to page / Actual size / Custom (% input)
- **Margins:** Normal (1 in), Narrow (0.5 in), Wide (1.5 in)

### Usage
```tsx
import { PrintDialog } from '@/features/export/components/PrintDialog';

<PrintDialog
  open={open}
  onOpenChange={setOpen}
  onPrint={(options) => print(options)}
/>
```

## Hooks

### `useExport`
Handles PDF/PNG/SVG export, edge-case confirmations, progress, and analytics.

```ts
import { useExport } from '@/features/export/hooks/useExport';

const {
  exportProject,
  isExporting,
  showProgress,
  emptyCanvasOpen,
  unsavedOpen,
  largeFileOpen,
  exportErrorOpen,
  handleConfirmEmptyCanvas,
  handleConfirmUnsaved,
  handleConfirmLargeFile,
  handleRetryExport,
} = useExport();
```

### `usePrint`
Injects print styles and triggers `window.print()`.

```ts
import { usePrint } from '@/features/export/hooks/usePrint';

const { print, isPrinting } = usePrint();
```

## Analytics

Events are tracked via [`useAnalytics`](hvac-design-app/src/hooks/useAnalytics.ts:1) and [`ActionEventName`](hvac-design-app/src/utils/analytics/events.ts:1):

- `EXPORT_INITIATED`
- `EXPORT_COMPLETED`
- `EXPORT_FAILED`
- `PRINT_INITIATED`

## Format Implementations

- PDF: [`exportProjectPDF()`](hvac-design-app/src/features/export/pdf.ts:22)
- PNG: [`exportCanvasToPNG()`](hvac-design-app/src/features/export/png.ts:17)
- SVG: [`exportCanvasToSVG()`](hvac-design-app/src/features/export/svg.ts:10)

## Tests

- Unit tests: [`export.test.ts`](hvac-design-app/src/features/export/__tests__/export.test.ts)
- PNG export tests: [`png.test.ts`](hvac-design-app/src/features/export/__tests__/png.test.ts)
- SVG export tests: [`svg.test.ts`](hvac-design-app/src/features/export/__tests__/svg.test.ts)
- Dialog tests: [`EnhancedExportDialog.test.tsx`](hvac-design-app/src/features/export/__tests__/EnhancedExportDialog.test.tsx), [`PrintDialog.test.tsx`](hvac-design-app/src/features/export/__tests__/PrintDialog.test.tsx)
- E2E: [`export-dialog.spec.ts`](hvac-design-app/e2e/export-print/export-dialog.spec.ts), [`print-dialog.spec.ts`](hvac-design-app/e2e/export-print/print-dialog.spec.ts), [`edge-cases.spec.ts`](hvac-design-app/e2e/export-print/edge-cases.spec.ts)
- Updated E2E flow: [`uj-pm-008-export-report.spec.ts`](hvac-design-app/e2e/01-project-management/uj-pm-008-export-report.spec.ts)

## Notes

- The export pipeline supports both Tauri and web download paths.
- Custom PDF sizes use millimeter conversion in the PDF layer.
- Preview size estimates are approximate based on snapshot data URLs.
