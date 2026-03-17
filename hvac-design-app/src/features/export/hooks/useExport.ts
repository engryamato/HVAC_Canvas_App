import { useState } from 'react';
import type { Project } from '@/types/project';
import type { ReportOptions } from '../services/ReportGenerator';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { captureCanvasSnapshot } from '../canvasSnapshot';

type ExportFormat = NonNullable<ReportOptions['format']>;
type TabularFormat = Exclude<ExportFormat, 'pdf'>;

function sanitizeProjectName(projectName: string): string {
    return projectName.replace(/[^a-z0-9]/gi, '_');
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

function triggerBrowserDownload(content: BlobPart, mimeType: string, fileName: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function dispatchToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    window.dispatchEvent(new CustomEvent('sws:toast', { detail: { message, type } }));
}

function buildTabularExportContent(
    entities: NonNullable<Project['entities']>,
    format: TabularFormat
): { body: string; mimeType: string; extension: 'csv' | 'xls' } {
    const rows = entities.allIds
        .map((id) => entities.byId[id])
        .filter(Boolean)
        .map((entity, index) => [
            String(index + 1),
            entity.type,
            entity.id,
            (entity.properties?.model as string | undefined) ?? 'N/A',
            '1',
        ]);
    const header = ['#', 'Type', 'ID', 'Model', 'Qty'];
    const separator = format === 'csv' ? ',' : '\t';
    const body = [header, ...rows].map((row) => row.join(separator)).join('\n');

    if (format === 'csv') {
        return { body, mimeType: 'text/csv;charset=utf-8', extension: 'csv' };
    }

    return { body, mimeType: 'application/vnd.ms-excel;charset=utf-8', extension: 'xls' };
}

/**
 * Hook for handling project export to PDF
 * Implements UJ-PM-008: Export Project Report
 * 
 * Handles both Tauri (native file save) and Web (browser download) modes
 */
export function useExport() {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [snapshotWarning, setSnapshotWarning] = useState<string | null>(null);
    const isTauri = useAppStateStore((state) => state.isTauri);

    const exportProject = async (project: Project, options: ReportOptions) => {
        setIsExporting(true);
        setError(null);
        setSnapshotWarning(null);

        try {
            const format: ExportFormat = options.format ?? 'pdf';
            const entities = project.entities;
            if (!entities) {
                throw new Error('Project has no entities to export');
            }
            const sanitizedProjectName = sanitizeProjectName(project.projectName);

            if (format !== 'pdf') {
                const { body, mimeType, extension } = buildTabularExportContent(entities, format);
                triggerBrowserDownload(body, mimeType, `${sanitizedProjectName}_Report.${extension}`);
                return { success: true };
            }

            // Generate PDF
            const { reportGenerator } = await import('../services/ReportGenerator');
            let snapshot;
            if (options.includeCanvasSnapshot) {
                const warningMessage = 'Canvas screenshot could not be captured - export will proceed without it.';
                try {
                    snapshot = await captureCanvasSnapshot();
                    if (!snapshot) {
                        setSnapshotWarning(warningMessage);
                        dispatchToast(warningMessage, 'warning');
                    }
                } catch {
                    snapshot = undefined;
                    setSnapshotWarning(warningMessage);
                    dispatchToast(warningMessage, 'warning');
                }
            }

            const pdfBytes = await reportGenerator.generatePDF(project, options, snapshot ?? undefined);

            if (isTauri) {
                // Tauri mode: Use native save dialog
                const { TauriFileSystem } = await import('@/core/persistence/TauriFileSystem');
                
                // Show native save dialog
                const defaultFileName = `${sanitizedProjectName}_Report.pdf`;
                const filePath = await TauriFileSystem.saveFileDialog({
                    defaultPath: defaultFileName,
                    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
                });

                if (!filePath) {
                    // User cancelled
                    return { success: false, cancelled: true };
                }

                // Write file to disk
                await TauriFileSystem.writeBinaryFile(filePath, pdfBytes);

                dispatchToast(`Report exported successfully to ${filePath}`, 'success');

                return { success: true, filePath };
            }

            // Web mode: Trigger browser download
            triggerBrowserDownload(
                toArrayBuffer(pdfBytes),
                'application/pdf',
                `${sanitizedProjectName}_Report.pdf`
            );
            dispatchToast('Report exported successfully', 'success');
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            console.error('[useExport] Failed to export project:', err);
            return { success: false, error: errorMessage };
        } finally {
            setIsExporting(false);
        }
    };

    return {
        exportProject,
        isExporting,
        error,
        snapshotWarning,
    };
}
