'use client';

import { useMemo, useState } from 'react';
import styles from './ExportMenu.module.css';
import { exportProjectJSON, exportBOMtoCSV, generateBOM } from './';
import { createEmptyProjectFile } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import { useCurrentProjectId, useProjectDetails } from '@/core/store/project.store';
import { downloadFile } from './download';
import { buildProjectFileFromStores } from '@/features/canvas/hooks/useAutoSave';
import { EnhancedExportDialog } from '@/features/export/components/EnhancedExportDialog';
import { PrintDialog } from '@/features/export/components/PrintDialog';
import { EmptyCanvasDialog, ExportErrorDialog, LargeFileWarningDialog, UnsavedChangesDialog } from '@/features/export/components/ExportConfirmationDialogs';
import { useExport } from '@/features/export/hooks/useExport';
import { usePrint } from '@/features/export/hooks/usePrint';
import type { ExportOptions } from '@/features/export/types';

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[/\\?%*:|"<>\s]/g, '_');
}

export function ExportMenu() {
  const entitiesById = useEntityStore((state) => state.byId);
  const entityIds = useEntityStore((state) => state.allIds);
  const projectId = useCurrentProjectId();
  const projectDetails = useProjectDetails();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  const {
    exportProject,
    isExporting,
    showProgress,
    emptyCanvasOpen,
    largeFileOpen,
    largeFileEstimate,
    unsavedOpen,
    exportErrorOpen,
    exportErrorMessage,
    handleConfirmEmptyCanvas,
    handleConfirmLargeFile,
    handleConfirmUnsaved,
    handleRetryExport,
    dismissEmptyCanvas,
    dismissLargeFile,
    dismissUnsaved,
    dismissExportError,
  } = useExport();
  const { print, isPrinting } = usePrint();

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

  const handleExport = async (options: ExportOptions) => {
    const projectFile = buildProjectFileFromStores();
    if (!projectFile) {
      return { success: false, error: 'No project loaded' };
    }
    return exportProject(projectFile, options);
  };

  const handleConfirmExport = async (handler: (project: NonNullable<ReturnType<typeof buildProjectFileFromStores>>) => Promise<unknown>) => {
    const projectFile = buildProjectFileFromStores();
    if (!projectFile) {
      return;
    }
    await handler(projectFile);
  };

  const handlePrint = async (options: Parameters<typeof print>[0]) => {
    await print(options);
    setPrintDialogOpen(false);
  };

  return (
    <div className={styles.menu}>
      <span className={styles.label}>Export</span>
      <div className={styles.actions}>
        <button onClick={handleExportJson}>JSON</button>
        <button onClick={handleExportCsv}>CSV</button>
        <button onClick={() => setExportDialogOpen(true)} disabled={isExporting}>Export...</button>
        <button onClick={() => setPrintDialogOpen(true)} disabled={isPrinting}>Print...</button>
      </div>

      <EnhancedExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
      />

      <PrintDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        onPrint={handlePrint}
      />

      <EmptyCanvasDialog
        open={emptyCanvasOpen}
        onCancel={dismissEmptyCanvas}
        onConfirm={() => handleConfirmExport(handleConfirmEmptyCanvas)}
      />
      <LargeFileWarningDialog
        open={largeFileOpen}
        onCancel={dismissLargeFile}
        onConfirm={() => handleConfirmExport(handleConfirmLargeFile)}
        estimatedSize={largeFileEstimate ?? '50 MB+'}
      />
      <UnsavedChangesDialog
        open={unsavedOpen}
        onCancel={dismissUnsaved}
        onConfirm={() => handleConfirmExport(handleConfirmUnsaved)}
      />
      <ExportErrorDialog
        open={exportErrorOpen}
        message={exportErrorMessage}
        onCancel={dismissExportError}
        onConfirm={() => handleConfirmExport(handleRetryExport)}
      />
    </div>
  );
}

export default ExportMenu;
