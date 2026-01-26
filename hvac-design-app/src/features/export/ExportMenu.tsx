'use client';

import { useMemo, useState } from 'react';
import styles from './ExportMenu.module.css';
import { exportProjectJSON, exportBOMtoCSV, exportProjectPDF, generateBOM } from './';
import { createEmptyProjectFile } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import { useCurrentProjectId, useProjectDetails } from '@/core/store/project.store';
import { downloadFile } from './download';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { TauriFileSystem } from '@/core/persistence/TauriFileSystem';
import type { PdfPageSize } from './pdf';

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
  const projectId = useCurrentProjectId();
  const projectDetails = useProjectDetails();
  const isTauri = useAppStateStore((state) => state.isTauri);
  const [pdfPageSize, setPdfPageSize] = useState<PdfPageSize>('letter');

  const project = useMemo(() => {
    if (!projectId) {
      return null;
    }
    const base = createEmptyProjectFile(projectId, projectDetails?.projectName ?? projectId);
    return { ...base, entities: { byId: entitiesById, allIds: entityIds } };
  }, [entitiesById, entityIds, projectDetails?.projectName, projectId]);

  const handleExportJson = () => {
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
    if (!project) {
      return;
    }

    const pdfResult = await exportProjectPDF(project, { pageSize: pdfPageSize });
    if (!pdfResult.success || !pdfResult.data) {
      pushToast(pdfResult.error ?? 'PDF export failed', 'error');
      return;
    }

    const pdfFileName = `${sanitizeFileName(project.projectName)}.pdf`;

    if (isTauri) {
      const filePath = await TauriFileSystem.saveFileDialog({
        defaultPath: pdfFileName,
        title: 'Export Project PDF',
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      });

      if (!filePath) {
        pushToast('Export cancelled', 'warning');
        return;
      }

      await TauriFileSystem.writeBinaryFile(filePath, pdfResult.data);
      return;
    }

    downloadFile(pdfResult.data, pdfFileName, 'application/pdf');
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
        <button onClick={handleExportPdf}>PDF</button>
      </div>
    </div>
  );
}

export default ExportMenu;
