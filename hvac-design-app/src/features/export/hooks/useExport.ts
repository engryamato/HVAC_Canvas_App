import { useCallback, useRef, useState } from 'react';
import type { ProjectFile } from '@/core/schema';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useIsDirty } from '@/core/store/project.store';
import { captureCanvasSnapshot } from '@/features/export/canvasSnapshot';
import { exportProjectPDF } from '@/features/export/pdf';
import { downloadFile } from '@/features/export/download';
import { exportCanvasToPNG } from '@/features/export/png';
import { exportCanvasToSVG } from '@/features/export/svg';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ActionEventName } from '@/utils/analytics/events';
import type { ExportOptions, ExportResult } from '@/features/export/types';

const LARGE_FILE_BYTES = 50 * 1024 * 1024;
const PROGRESS_DELAY_MS = 500;

const formatExtensions: Record<ExportOptions['format'], string> = {
  pdf: 'pdf',
  png: 'png',
  svg: 'svg',
};

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isTauri = useAppStateStore((state) => state.isTauri);
  const isDirty = useIsDirty();
  const { trackAction } = useAnalytics();

  const [emptyCanvasOpen, setEmptyCanvasOpen] = useState(false);
  const [largeFileOpen, setLargeFileOpen] = useState(false);
  const [largeFileEstimate, setLargeFileEstimate] = useState<string | null>(null);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [exportErrorOpen, setExportErrorOpen] = useState(false);
  const [exportErrorMessage, setExportErrorMessage] = useState('');
  const [pendingOptions, setPendingOptions] = useState<ExportOptions | null>(null);

  const progressTimerRef = useRef<number | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const countEntities = () => useEntityStore.getState().allIds.length;

  const sanitizeFileName = (name: string) => name.replace(/[/\\?%*:|"<>\s]/g, '_');

  const estimateLargeFile = (bytes: number | null) => (bytes ?? 0) > LARGE_FILE_BYTES;

  const estimateSnapshotBytes = (dataUrl: string) => Math.round((dataUrl.length * 3) / 4);

  const estimateLargeFileBytes = async (options: ExportOptions): Promise<number | null> => {
    const snapshot = await captureCanvasSnapshot();
    if (!snapshot) {
      return null;
    }

    if (options.format === 'png') {
      const scale = options.quality === 'high' ? 3 : options.quality === 'medium' ? 1.5 : 0.75;
      return Math.round(estimateSnapshotBytes(snapshot.dataUrl) * scale * scale);
    }

    return estimateSnapshotBytes(snapshot.dataUrl);
  };

  const startProgressDelay = () => {
    if (progressTimerRef.current) {
      window.clearTimeout(progressTimerRef.current);
    }
    progressTimerRef.current = window.setTimeout(() => {
      setShowProgress(true);
    }, PROGRESS_DELAY_MS);
  };

  const resetProgressDelay = () => {
    if (progressTimerRef.current) {
      window.clearTimeout(progressTimerRef.current);
    }
    setShowProgress(false);
  };

  const finalizeExport = async (project: ProjectFile, options: ExportOptions): Promise<ExportResult> => {
    const startTime = performance.now();
    setIsExporting(true);
    setError(null);
    startProgressDelay();

    try {
      trackAction(ActionEventName.EXPORT_INITIATED, {
        format: options.format,
        elementCount: countEntities(),
      });

      let result: ExportResult;

      if (options.format === 'pdf') {
        const snapshot = await captureCanvasSnapshot();
        const pdfResult = await exportProjectPDF(project, {
          pageSize: options.pageSize === 'custom' ? 'letter' : options.pageSize,
          customDimensions: options.pageSize === 'custom' ? convertInchesToMm(options.customDimensions) : undefined,
          snapshot: snapshot ?? undefined,
        });
        result = pdfResult.success
          ? { success: true, data: pdfResult.data, fileSize: pdfResult.data?.byteLength }
          : { success: false, error: pdfResult.error };
      } else if (options.format === 'png') {
        result = await exportCanvasToPNG({
          quality: options.quality ?? 'medium',
          includeGrid: options.include.grid,
          includeDimensions: options.include.dimensions,
          includeLabels: options.include.labels,
        });
      } else {
        result = await exportCanvasToSVG({
          includeGrid: options.include.grid,
          includeDimensions: options.include.dimensions,
          includeLabels: options.include.labels,
        });
      }

      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Export failed');
      }

      const fileNameBase = sanitizeFileName(project.projectName || 'project');
      const extension = formatExtensions[options.format];
      const fileName = `${fileNameBase}.${extension}`;

      if (isTauri) {
        const { TauriFileSystem } = await import('@/core/persistence/TauriFileSystem');
        const filePath = await TauriFileSystem.saveFileDialog({
          defaultPath: fileName,
          title: 'Export Project',
          filters: [{ name: extension.toUpperCase(), extensions: [extension] }],
        });

        if (!filePath) {
          resetProgressDelay();
          setIsExporting(false);
          return { success: false, error: 'Export cancelled' };
        }

        if (result.data instanceof Blob) {
          const buffer = new Uint8Array(await result.data.arrayBuffer());
          await TauriFileSystem.writeBinaryFile(filePath, buffer);
        } else {
          await TauriFileSystem.writeBinaryFile(filePath, result.data);
        }
      } else {
        if (result.data instanceof Blob) {
          downloadFile(await result.data.arrayBuffer().then((buffer) => new Uint8Array(buffer)), fileName, result.data.type);
        } else {
          const mime = options.format === 'svg' ? 'image/svg+xml' : options.format === 'png' ? 'image/png' : 'application/pdf';
          downloadFile(result.data, fileName, mime);
        }
      }

      const duration = performance.now() - startTime;
      trackAction(ActionEventName.EXPORT_COMPLETED, {
        format: options.format,
        duration,
        elementCount: countEntities(),
      });

      resetProgressDelay();
      setIsExporting(false);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      setExportErrorMessage(message);
      setExportErrorOpen(true);
      trackAction(ActionEventName.EXPORT_FAILED, { format: options.format, error: message });
      resetProgressDelay();
      setIsExporting(false);
      return { success: false, error: message };
    }
  };

  const exportProject = useCallback(
    async (project: ProjectFile, options: ExportOptions) => {
      if (countEntities() === 0) {
        setPendingOptions(options);
        setEmptyCanvasOpen(true);
        return { success: false, error: 'Empty canvas' };
      }

      if (isDirty) {
        setPendingOptions(options);
        setUnsavedOpen(true);
        return { success: false, error: 'Unsaved changes' };
      }

      const estimatedBytes = await estimateLargeFileBytes(options);
      if (estimateLargeFile(estimatedBytes)) {
        setPendingOptions(options);
        setLargeFileEstimate(formatBytes(estimatedBytes ?? 0));
        setLargeFileOpen(true);
        return { success: false, error: 'Large file warning' };
      }

      const result = await finalizeExport(project, options);
      return result;
    },
    [isDirty]
  );

  const handleConfirmEmptyCanvas = async (project: ProjectFile) => {
    if (!pendingOptions) {
      return { success: false, error: 'No pending export' };
    }
    setEmptyCanvasOpen(false);
    return finalizeExport(project, pendingOptions);
  };

  const handleConfirmUnsaved = async (project: ProjectFile) => {
    if (!pendingOptions) {
      return { success: false, error: 'No pending export' };
    }
    setUnsavedOpen(false);
    return finalizeExport(project, pendingOptions);
  };

  const handleConfirmLargeFile = async (project: ProjectFile) => {
    if (!pendingOptions) {
      return { success: false, error: 'No pending export' };
    }
    setLargeFileOpen(false);
    setLargeFileEstimate(null);
    return finalizeExport(project, pendingOptions);
  };

  const handleRetryExport = async (project: ProjectFile) => {
    if (!pendingOptions) {
      return { success: false, error: 'No pending export' };
    }
    setExportErrorOpen(false);
    return finalizeExport(project, pendingOptions);
  };

  return {
    exportProject,
    isExporting,
    error,
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
    dismissEmptyCanvas: () => setEmptyCanvasOpen(false),
    dismissLargeFile: () => {
      setLargeFileOpen(false);
      setLargeFileEstimate(null);
    },
    dismissUnsaved: () => setUnsavedOpen(false),
    dismissExportError: () => setExportErrorOpen(false),
  };
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function convertInchesToMm(dimensions?: { width: number; height: number }) {
  if (!dimensions) {
    return undefined;
  }
  const toMm = (value: number) => value * 25.4;
  return {
    width: toMm(dimensions.width),
    height: toMm(dimensions.height),
  };
}
