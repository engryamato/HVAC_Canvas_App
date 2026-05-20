# ExportDialog

## Overview

The ExportDialog component is a focused modal that collects report export options (full vs BOM-only, included sections, page orientation) and delegates the actual export work to a caller-provided `onExport` callback.

This component lives under the export feature but is not currently wired into the app-level File menu.

## Location

```
src/features/export/components/ExportDialog.tsx
```

## Purpose

- Provide a simple UI for configuring report options
- Emit a `ReportOptions` object to the parent via `onExport`
- Disable actions and show “Exporting...” state while exporting

## Dependencies

- `Dialog` primitives from [dialog](../ui/dialog.md)
- `ReportOptions` type from `src/features/export/services/ReportGenerator.ts`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | Yes | - | Controls dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | Yes | - | Called when dialog open state changes |
| `onExport` | `(options: ReportOptions) => void` | Yes | - | Called when user confirms export |
| `isExporting` | `boolean` | No | `false` | Disables controls and shows exporting UI |

## State Management

Local state tracks the currently selected options:

- `reportType`: `'full' | 'bom'`
- `includeMetadata`, `includeCalculations`, `includeEntities`, `includeBOM`
- `orientation`: `'portrait' | 'landscape'`

When `reportType` is `bom`, the dialog forces a BOM-only report by disabling the other include flags.

## Behavior

### Confirm Export

On “Export PDF”, the dialog composes a `ReportOptions` object and calls `onExport(options)`.

The include flags are normalized to match the chosen report type:
- Full report: uses user-selected toggles
- BOM-only: disables metadata/calculations/entities and enables BOM

### Cancel

Clicking “Cancel” calls `onOpenChange(false)`.

## Usage Example

```tsx
const [open, setOpen] = useState(false);
const { exportProject, isExporting } = useExport();

<ExportDialog
  open={open}
  onOpenChange={setOpen}
  isExporting={isExporting}
  onExport={(options) => {
    // Parent is responsible for collecting project data.
    exportProject(project, options);
  }}
/>
```

## Related Elements

- [ExportReportDialog](./ExportReportDialog.md) - Integrated dialog used by the File menu
- [FileMenu](../layout/FileMenu.md) - Current export entry-point

