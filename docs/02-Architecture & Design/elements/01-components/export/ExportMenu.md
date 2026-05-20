# ExportMenu

## Overview

The ExportMenu component provides a toolbar menu with buttons to export the current project in multiple formats: JSON (project data), CSV (bill of materials), and PDF (printable layout).

## Location

```
src/features/export/ExportMenu.tsx
```

## Purpose

- Export project data as JSON file
- Export bill of materials (BOM) as CSV
- Export project layout as PDF
- Trigger browser file downloads
- Display export options in canvas toolbar
- Handle export errors gracefully

## Dependencies

- Export utilities:
  - `exportProjectJSON` - Serializes project to JSON
  - `exportBOMtoCSV` - Converts BOM to CSV format
  - `exportProjectPDF` - Generates PDF document
  - `generateBOM` - Calculates bill of materials
- [entityStore](../../02-stores/entityStore.md) - Entity state
- [projectStore](../../02-stores/projectStore.md) - Project metadata
- `createEmptyProjectFile` from schema
- React `useMemo` hook

## Props

This component has no props. It reads state from Zustand stores.

## State Sources

| Hook | Returns | Purpose |
|------|---------|---------|
| `useEntityStore()` | `{ byId, allIds }` | Normalized entity state for export |
| `useCurrentProjectId()` | `string \| null` | Current project ID |
| `useProjectDetails()` | `ProjectDetails \| null` | Project name and metadata |

## Layout

```
┌──────────────────────────────────┐
│ Export  [JSON] [CSV] [PDF]       │
└──────────────────────────────────┘
    ↑        ↑      ↑     ↑
  label    buttons (3 export options)
```

Integration in canvas toolbar:

```
┌─────────────────────────────────────────────────────┐
│ [Select] [Room] [Duct] ... │ Export [JSON][CSV][PDF]│
└─────────────────────────────────────────────────────┘
```

## Behavior

### 1. JSON Export

Exports complete project data (entities, metadata, version):

```typescript
const handleExportJson = () => {
  if (!project) return;

  const json = exportProjectJSON(project);
  download(json, `${project.projectName}.json`, 'application/json');
};
```

**Output file**: `My HVAC Layout.json`

**Contents**:
```json
{
  "version": "1.0.0",
  "projectId": "uuid-here",
  "projectName": "My HVAC Layout",
  "entities": {
    "byId": { ... },
    "allIds": [ ... ]
  },
  "createdAt": "2025-12-29T10:00:00Z",
  "modifiedAt": "2025-12-29T12:30:00Z"
}
```

### 2. CSV Export

Exports bill of materials as spreadsheet-compatible CSV:

```typescript
const handleExportCsv = () => {
  const bom = generateBOM(entities as any[]);
  const csv = exportBOMtoCSV(bom);
  download(
    csv,
    `${projectDetails?.projectName ?? 'project'}-bom.csv`,
    'text/csv;charset=utf-8'
  );
};
```

**Output file**: `My HVAC Layout-bom.csv`

**Contents**:
```csv
Category,Item,Quantity,Unit,Specification
Ductwork,Round Duct,45,ft,"12"" diameter, galvanized"
Ductwork,Rectangular Duct,30,ft,"16""x8"", galvanized"
Equipment,AHU,1,ea,"5000 CFM, 2.5"" SP"
Equipment,Exhaust Fan,2,ea,"1000 CFM each"
Fittings,90° Elbow,8,ea,"12"" round"
```

### 3. PDF Export

Generates printable PDF with project layout and BOM.

The PDF includes:
- Page 1: Project title + generated timestamp + embedded canvas snapshot (scaled to fit)
- Page 2: Entity summary table
- Page 3+: Bill of materials table (if it overflows)

```typescript
const handleExportPdf = async () => {
  if (!project) return;

  const snapshot = await captureCanvasSnapshot();
  const pdfResult = await exportProjectPDF(project, {
    pageSize: selectedPageSize,
    snapshot: snapshot ?? undefined,
  });

  if (pdfResult.success && pdfResult.data) {
    downloadFile(pdfResult.data, `${project.projectName}.pdf`, 'application/pdf');
  } else {
    toast.error(pdfResult.error ?? 'PDF export failed');
  }
};
```

**Output file**: `My HVAC Layout.pdf`

### 4. Download Helper

Internal function to trigger browser file download:

```typescript
function downloadFile(content: string | Uint8Array, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href); // Clean up memory
}
```

### 5. Project Memo

Creates a minimal project object for export:

```typescript
const project = useMemo(() => {
  if (!projectId) return null;

  const base = createEmptyProjectFile(projectId, projectDetails?.projectName ?? projectId);
  return { ...base, entities: { byId: entitiesById, allIds: entityIds } };
}, [entitiesById, entityIds, projectDetails?.projectName, projectId]);
```

**Note**: The memo includes the current normalized entity store state.

## Component Implementation

```tsx
'use client';

import { useMemo } from 'react';
import styles from './ExportMenu.module.css';
import { exportProjectJSON, exportBOMtoCSV, exportProjectPDF, generateBOM } from './';
import { createEmptyProjectFile } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import { useCurrentProjectId, useProjectDetails } from '@/core/store/project.store';
import { captureCanvasSnapshot } from './canvasSnapshot';

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function ExportMenu() {
  const entitiesById = useEntityStore((state) => state.byId);
  const entityIds = useEntityStore((state) => state.allIds);
  const projectId = useCurrentProjectId();
  const projectDetails = useProjectDetails();

  const project = useMemo(() => {
    if (!projectId) return null;
    const base = createEmptyProjectFile(projectId, projectDetails?.projectName ?? projectId);
    return { ...base, entities: { byId: entitiesById, allIds: entityIds } };
  }, [entitiesById, entityIds, projectDetails?.projectName, projectId]);

  const handleExportJson = () => { /* ... */ };
  const handleExportCsv = () => { /* ... */ };
  const handleExportPdf = async () => { /* ... */ };

  return (
    <div className={styles.menu}>
      <span className={styles.label}>Export</span>
      <div className={styles.actions}>
        <button onClick={handleExportJson}>JSON</button>
        <button onClick={handleExportCsv}>CSV</button>
        <select aria-label="PDF page size">{/* Letter, Legal, Tabloid, A0-A3 */}</select>
        <button onClick={handleExportPdf}>PDF</button>
      </div>
    </div>
  );
}

export default ExportMenu;
```

## Usage Example

```tsx
import { ExportMenu } from '@/features/export/ExportMenu';

function CanvasToolbar() {
  return (
    <div className={styles.toolbar}>
      <div className={styles.tools}>
        {/* Tool buttons */}
      </div>

      <div className={styles.actions}>
        <ExportMenu />
      </div>
    </div>
  );
}
```

## Export Format Details

### JSON Format

- **Use case**: Backup, version control, import into other tools
- **Size**: ~1-10 KB for typical project
- **Includes**: All entity data, properties, calculated values, metadata
- **Human-readable**: Yes (formatted JSON)

### CSV Format

- **Use case**: Material ordering, cost estimation, spreadsheet analysis
- **Size**: ~1-5 KB
- **Includes**: BOM only (grouped by category)
- **Opens in**: Excel, Google Sheets, Numbers

### PDF Format

- **Use case**: Printing, client presentations, documentation
- **Size**: ~50-500 KB (includes embedded canvas image)
- **Includes**:
  - Page 1: Canvas snapshot image (scaled to fit)
  - Page 2+: Entity summary + BOM tables
  - Title + generated timestamp
- **Page sizes (dropdown)**: `Letter`, `Legal`, `Tabloid`, `A0`, `A1`, `A2`, `A3`
- **Page size**: Letter (8.5" × 11")

## Error Handling

### JSON Export

No error handling needed (synchronous, always succeeds).

### CSV Export

No error handling needed (synchronous, always succeeds).

### PDF Export

Displays toast/notification on failure:

```typescript
if (pdfResult.success && pdfResult.data) {
  download(pdfResult.data, `${project.projectName}.pdf`, 'application/pdf');
} else {
  toast.error(pdfResult.error ?? 'PDF export failed');
}
```

Common PDF errors:
- Canvas too large to render
- Insufficient memory
- Browser API not supported

## Styling

```css
.menu {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-left: 1px solid #e5e7eb;
}

.label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 4px;
}

.actions button {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.actions button:hover {
  background: #f3f4f6;
}

.actions button:active {
  background: #e5e7eb;
}
```

## Related Elements

- [BOMPanel](../canvas/BOMPanel.md) - Displays BOM in UI
- [BOMTable](../canvas/BOMTable.md) - BOM table component
- [Toolbar](../canvas/Toolbar.md) - Canvas toolbar
- [CanvasContainer](../canvas/CanvasContainer.md) - Canvas rendering
- [projectStore](../../02-stores/projectStore.md) - Project metadata

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportMenu } from './ExportMenu';
import { useAllEntities, useCurrentProjectId, useProjectDetails } from '@/core/store';

vi.mock('@/core/store/entityStore');
vi.mock('@/core/store/project.store');

describe('ExportMenu', () => {
  beforeEach(() => {
    vi.mocked(useCurrentProjectId).mockReturnValue('test-project-id');
    vi.mocked(useProjectDetails).mockReturnValue({
      projectName: 'Test Project',
      projectNumber: '001',
    });
    vi.mocked(useAllEntities).mockReturnValue([
      { type: 'room', id: '1', props: { name: 'Room 1' }, calculated: {} },
    ]);
  });

  it('renders export buttons', () => {
    render(<ExportMenu />);

    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('triggers JSON export on button click', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const createElementSpy = vi.spyOn(document, 'createElement');

    render(<ExportMenu />);
    fireEvent.click(screen.getByText('JSON'));

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(createObjectURLSpy).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
    createElementSpy.mockRestore();
  });

  it('triggers CSV export on button click', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

    render(<ExportMenu />);
    fireEvent.click(screen.getByText('CSV'));

    expect(createObjectURLSpy).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
  });

  it('handles PDF export with error', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.mocked(exportProjectPDF).mockResolvedValue({
      success: false,
      error: 'Canvas too large',
    });

    render(<ExportMenu />);
    fireEvent.click(screen.getByText('PDF'));

    await vi.waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Canvas too large');
    });

    alertSpy.mockRestore();
  });
});
```
