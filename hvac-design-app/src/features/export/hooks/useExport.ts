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
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
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
