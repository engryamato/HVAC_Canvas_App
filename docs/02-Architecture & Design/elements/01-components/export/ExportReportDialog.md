# ExportReportDialog

## Overview

The ExportReportDialog component renders a modal that lets users configure a project report (PDF) export and then generates/saves the PDF via the `useExport` hook.

It is the dialog opened from the app-level **File** menu (“Export Report...”).

## Location

```
src/features/export/ExportReportDialog.tsx
```

## Purpose

- Provide a single entry-point UI for exporting a PDF report
- Let users choose a report type and which sections to include
- Aggregate the current project snapshot from multiple Zustand stores
- Trigger export in **Tauri** mode (native save dialog) or **Web** mode (browser download)
- Show progress (exporting) and error feedback

## Dependencies

- `Dialog` primitives from [dialog](../ui/dialog.md)
- [Button](../ui/button.md)
- `useExport` (`src/features/export/hooks/useExport.ts`)
- Stores (data aggregation)
  - [entityStore](../../02-stores/entityStore.md)
  - [projectStore](../../02-stores/projectStore.md)
  - [preferencesStore](../../02-stores/preferencesStore.md)
  - [viewportStore](../../02-stores/viewportStore.md)
  - [historyStore](../../02-stores/historyStore.md)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | Yes | - | Controls whether the dialog is open |
| `onOpenChange` | `(open: boolean) => void` | Yes | - | Called when dialog open state changes |

## State Management

### Local State

The dialog keeps an `options` object in local state:

```ts
export interface ExportOptions {
  reportType: 'full' | 'summary' | 'bom' | 'calculations';
  includeDetails: boolean;
  includeEntities: boolean;
  includeCalculations: boolean;
  includeBOM: boolean;
  includeScreenshot: boolean;
  paperSize: 'letter' | 'a4';
  orientation: 'portrait' | 'landscape';
}
```

### Store Reads (Snapshot)

When exporting, the component reads from stores via `getState()` to create a point-in-time snapshot:

- Entities: `useEntityStore.getState()`
- Viewport: `useViewportStore.getState()`
- Preferences: `usePreferencesStore.getState()`
- Command history: `useHistoryStore.getState()`
- Project metadata: `useProjectStore((s) => ...)`

## Behavior

### Report Type Presets

Changing `reportType` runs a preset routine that toggles the include flags.

Examples:
- `full`: turns on most sections (details/entities/calculations/BOM/screenshot)
- `summary`: keeps details only
- `bom`: BOM-only
- `calculations`: calculations-only

### Export Flow

1. Validate that `currentProjectId` and `projectDetails` exist
2. Aggregate a `Project` object from stores
3. Call `exportProject(project, reportOptions)` from `useExport`
4. In Tauri mode, the hook shows a save dialog and writes the PDF
5. In Web mode, the hook triggers a browser download

### Loading State

While `isExporting` is true, the dialog shows a progress UI (“Generating Report...”).

### Error State

If `useExport` returns an error, it is rendered at the top of the dialog content.

## Usage Example

`ExportReportDialog` is typically mounted once and controlled by menu state:

```tsx
const [exportOpen, setExportOpen] = useState(false);

<ExportReportDialog open={exportOpen} onOpenChange={setExportOpen} />
```

## Accessibility

- Uses the shared dialog primitives for focus trapping and keyboard handling
- Close behavior is handled by the underlying `Dialog` component and `onOpenChange`

## Related Elements

- [FileMenu](../layout/FileMenu.md) - Opens this dialog via “Export Report...”
- [ExportDialog](./ExportDialog.md) - Simpler report-options dialog (unused in current File menu)

## Testing

No dedicated test file is currently documented for this component.

Recommended coverage:
- Renders dialog title and form controls when `open`
- Presets update include flags when switching report types
- Calls export flow when user confirms
- Shows loading UI when `isExporting`
- Shows error message when `error` is set

