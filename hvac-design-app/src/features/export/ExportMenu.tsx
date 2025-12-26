'use client';

import { useMemo } from 'react';
import styles from './ExportMenu.module.css';
import { exportProjectJSON, exportBOMtoCSV, exportProjectPDF, generateBOM } from './';
import { createEmptyProjectFile } from '@/core/schema';
import { useAllEntities } from '@/core/store/entityStore';
import { useCurrentProjectId, useProjectDetails } from '@/core/store/project.store';

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function ExportMenu() {
  const entities = useAllEntities();
  const projectId = useCurrentProjectId();
  const projectDetails = useProjectDetails();

  const project = useMemo(() => {
    if (!projectId) {
      return null;
    }
    const base = createEmptyProjectFile(projectId, projectDetails?.projectName ?? projectId);
    return { ...base, entities: { byId: {}, allIds: [] } };
  }, [projectDetails?.projectName, projectId]);

  const handleExportJson = () => {
    if (!project) {
      return;
    }
    const json = exportProjectJSON(project);
    download(json, `${project.projectName}.json`, 'application/json');
  };

  const handleExportCsv = () => {
    const bom = generateBOM(entities as any[]);
    const csv = exportBOMtoCSV(bom);
    download(csv, `${projectDetails?.projectName ?? 'project'}-bom.csv`, 'text/csv;charset=utf-8');
  };

  const handleExportPdf = async () => {
    if (!project) {
      return;
    }
    const pdfResult = await exportProjectPDF(project, { pageSize: 'letter' });
    if (pdfResult.success && pdfResult.data) {
      download(pdfResult.data, `${project.projectName}.pdf`, 'application/pdf');
    } else {
      alert(pdfResult.error ?? 'PDF export failed');
    }
  };

  return (
    <div className={styles.menu}>
      <span className={styles.label}>Export</span>
      <div className={styles.actions}>
        <button onClick={handleExportJson}>JSON</button>
        <button onClick={handleExportCsv}>CSV</button>
        <button onClick={handleExportPdf}>PDF</button>
      </div>
    </div>
  );
}

export default ExportMenu;
