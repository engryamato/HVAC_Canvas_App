'use client';

import { useState } from 'react';
import styles from './ExportMenu.module.css';
import { exportProjectJSON, exportBOMtoCSV, generateBOM } from './';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectDetails } from '@/core/store/project.store';
import { downloadFile } from './download';
import type { PdfPageSize } from './pdf';
import { ExportDialog, ExportDialogOptions } from './ExportDialog';
import { useExport } from './hooks/useExport';
import { buildExportProjectSnapshot } from './buildExportProjectSnapshot';

const PDF_PAGE_SIZES: Array<{ label: string; value: PdfPageSize }> = [
  { label: 'Letter', value: 'letter' },
  { label: 'Legal', value: 'legal' },
  { label: 'Tabloid', value: 'tabloid' },
  { label: 'A0', value: 'a0' },
  { label: 'A1', value: 'a1' },
  { label: 'A2', value: 'a2' },
  { label: 'A3', value: 'a3' },
];

function pushToast(message: string, type: 'success' | 'error' | 'warning' | 'info') {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent('sws:toast', { detail: { message, type } }));
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[/\\?%*:|"<>\s]/g, '_');
}

export function ExportMenu() {
  const entitiesById = useEntityStore((state) => state.byId);
  const entityIds = useEntityStore((state) => state.allIds);
  const projectDetails = useProjectDetails();
  const [pdfPageSize, setPdfPageSize] = useState<PdfPageSize>('letter');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { exportProject } = useExport();

  const handleExportJson = () => {
    const project = buildExportProjectSnapshot();
    if (!project) {
      return;
    }
    const json = exportProjectJSON(project);
    downloadFile(json, `${sanitizeFileName(project.projectName)}.json`, 'application/json');
  };

  const handleExportCsv = () => {
    const bom = generateBOM(
      entityIds
        .map((id) => entitiesById[id])
        .filter((entity): entity is NonNullable<typeof entity> => entity !== undefined)
    );
    const csv = exportBOMtoCSV(bom);
    downloadFile(
      csv,
      `${sanitizeFileName(projectDetails?.projectName ?? 'project')}-bom.csv`,
      'text/csv;charset=utf-8'
    );
  };

  const handleExportPdf = async () => {
    const project = buildExportProjectSnapshot();
    if (!project) {
      return;
    }

    const result = await exportProject(project, {
      format: 'pdf',
      includeMetadata: true,
      includeCalculations: true,
      includeEntities: true,
      includeBOM: true,
      orientation: 'portrait',
      includeCanvasSnapshot: true,
      paperSize: pdfPageSize,
    });

    if (!result.success && !result.cancelled) {
      pushToast(result.error ?? 'PDF export failed', 'error');
      return;
    }
  };

  return (
    <div className={styles.menu}>
      <span className={styles.label}>Export</span>
      <div className={styles.actions}>
        <button onClick={handleExportJson}>JSON</button>
        <button onClick={handleExportCsv}>CSV</button>
        <select
          className={styles.sizeSelect}
          value={pdfPageSize}
          onChange={(e) => setPdfPageSize(e.target.value as PdfPageSize)}
          aria-label="PDF page size"
        >
          {PDF_PAGE_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
        <button onClick={() => void handleExportPdf()}>PDF</button>
        <button onClick={() => setExportDialogOpen(true)}>Export...</button>
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={async (options: ExportDialogOptions) => {
          setIsExporting(true);
          try {
            const project = buildExportProjectSnapshot();
            if (options.format === 'csv' && project) {
              const bom = generateBOM(
                entityIds
                  .map((id) => entitiesById[id])
                  .filter((e): e is NonNullable<typeof e> => e !== undefined)
              );
              const csv = exportBOMtoCSV(bom);
              downloadFile(
                csv,
                `${sanitizeFileName(projectDetails?.projectName ?? 'project')}-bom.csv`,
                'text/csv;charset=utf-8'
              );
            }
          } finally {
            setIsExporting(false);
            setExportDialogOpen(false);
          }
        }}
        isExporting={isExporting}
      />
    </div>
  );
}

export default ExportMenu;
