import { useState } from 'react';
import type { Project } from '@/types/project';
import type { ReportOptions } from '../services/ReportGenerator';
import { useAppStateStore } from '@/stores/useAppStateStore';

/**
 * Hook for handling project export to PDF
 * Implements UJ-PM-008: Export Project Report
 * 
 * Handles both Tauri (native file save) and Web (browser download) modes
 */
export function useExport() {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isTauri = useAppStateStore((state) => state.isTauri);

    const exportProject = async (project: Project, options: ReportOptions) => {
        setIsExporting(true);
        setError(null);

        try {
            const format = options.format ?? 'pdf';
            const entities = project.entities;
            if (!entities) {
                throw new Error('Project has no entities to export');
            }

            if (format !== 'pdf') {
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
                const mime = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/vnd.ms-excel;charset=utf-8';
                const extension = format === 'csv' ? 'csv' : 'xls';

                const blob = new Blob([body], { type: mime });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${project.projectName.replace(/[^a-z0-9]/gi, '_')}_Report.${extension}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setIsExporting(false);
                return { success: true };
            }

            // Generate PDF
            const { reportGenerator } = await import('../services/ReportGenerator');
            const pdfBytes = await reportGenerator.generatePDF(project, options);

            if (isTauri) {
                // Tauri mode: Use native save dialog
                const { TauriFileSystem } = await import('@/core/persistence/TauriFileSystem');
                
                // Show native save dialog
                const defaultFileName = `${project.projectName.replace(/[^a-z0-9]/gi, '_')}_Report.pdf`;
                const filePath = await TauriFileSystem.saveFileDialog({
                    defaultPath: defaultFileName,
                    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
                });

                if (!filePath) {
                    // User cancelled
                    setIsExporting(false);
                    return { success: false, cancelled: true };
                }

                // Write file to disk
                await TauriFileSystem.writeBinaryFile(filePath, pdfBytes);

                // Show success notification
                // TODO: Replace with proper toast notification
                alert(`Report exported successfully to:\n${filePath}`);

                setIsExporting(false);
                return { success: true, filePath };
            } else {
                // Web mode: Trigger browser download
                const arrayBuffer = pdfBytes.buffer.slice(
                    pdfBytes.byteOffset,
                    pdfBytes.byteOffset + pdfBytes.byteLength
                ) as ArrayBuffer;
                const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${project.projectName.replace(/[^a-z0-9]/gi, '_')}_Report.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                setIsExporting(false);
                return { success: true };
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            setIsExporting(false);
            console.error('[useExport] Failed to export project:', err);
            return { success: false, error: errorMessage };
        }
    };

    return {
        exportProject,
        isExporting,
        error,
    };
}
