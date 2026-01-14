'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { exportProjectPDF } from '@/features/export/pdf';
import { createEmptyProjectFile } from '@/core/schema';
import { useCurrentProjectId, useProjectDetails } from '@/core/store/project.store';

export interface ExportReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export type ReportType = 'full' | 'summary' | 'bom' | 'calculations';
export type PaperSize = 'letter' | 'a4';
export type Orientation = 'portrait' | 'landscape';

export interface ExportOptions {
    reportType: ReportType;
    includeDetails: boolean;
    includeEntities: boolean;
    includeCalculations: boolean;
    includeBOM: boolean;
    includeScreenshot: boolean;
    paperSize: PaperSize;
    orientation: Orientation;
}

function download(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

export function ExportReportDialog({ open, onOpenChange }: ExportReportDialogProps) {
    const projectId = useCurrentProjectId();
    const projectDetails = useProjectDetails();

    const [options, setOptions] = useState<ExportOptions>({
        reportType: 'full',
        includeDetails: true,
        includeEntities: true,
        includeCalculations: true,
        includeBOM: true,
        includeScreenshot: true,
        paperSize: 'letter',
        orientation: 'portrait',
    });

    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');

    const handleReportTypeChange = (type: ReportType) => {
        const newOptions = { ...options, reportType: type };

        // Auto-select sections based on report type
        switch (type) {
            case 'full':
                newOptions.includeDetails = true;
                newOptions.includeEntities = true;
                newOptions.includeCalculations = true;
                newOptions.includeBOM = true;
                newOptions.includeScreenshot = true;
                break;
            case 'summary':
                newOptions.includeDetails = true;
                newOptions.includeEntities = false;
                newOptions.includeCalculations = false;
                newOptions.includeBOM = false;
                newOptions.includeScreenshot = false;
                break;
            case 'bom':
                newOptions.includeDetails = false;
                newOptions.includeEntities = false;
                newOptions.includeCalculations = false;
                newOptions.includeBOM = true;
                newOptions.includeScreenshot = false;
                break;
            case 'calculations':
                newOptions.includeDetails = false;
                newOptions.includeEntities = false;
                newOptions.includeCalculations = true;
                newOptions.includeBOM = false;
                newOptions.includeScreenshot = false;
                break;
        }

        setOptions(newOptions);
    };

    const handleExport = async () => {
        if (!projectId) {
            return;
        }

        setExporting(true);
        setProgress(0);
        setStatus('Collecting project data...');

        try {
            // Simulate progress stages
            setProgress(20);
            setStatus('Generating calculations...');
            await new Promise((r) => setTimeout(r, 300));

            setProgress(50);
            setStatus('Creating PDF...');
            await new Promise((r) => setTimeout(r, 300));

            // Create project file for export
            const project = createEmptyProjectFile(
                projectId,
                projectDetails?.projectName ?? 'Untitled Project'
            );

            setProgress(80);
            setStatus('Finalizing report...');

            const result = await exportProjectPDF(project, {
                pageSize: options.paperSize,
            });

            setProgress(100);
            setStatus('Complete!');

            if (result.success && result.data) {
                download(
                    result.data,
                    `${projectDetails?.projectName ?? 'project'}-report.pdf`,
                    'application/pdf'
                );
                setTimeout(() => {
                    onOpenChange(false);
                    setExporting(false);
                    setProgress(0);
                    setStatus('');
                }, 500);
            } else {
                throw new Error(result.error ?? 'Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
            setStatus('Export failed');
            setExporting(false);
        }
    };

    const handleCancel = () => {
        if (!exporting) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-md"
                data-testid="export-report-dialog"
            >
                <DialogHeader>
                    <DialogTitle>Export Project Report</DialogTitle>
                </DialogHeader>

                {exporting ? (
                    <div className="py-8 space-y-4">
                        <p className="text-center font-medium">Generating Report...</p>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-center text-sm text-slate-500">{status}</p>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* Report Type */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Report Type
                            </label>
                            <select
                                value={options.reportType}
                                onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                data-testid="report-type-select"
                            >
                                <option value="full">Full Report (all sections)</option>
                                <option value="summary">Summary Report</option>
                                <option value="bom">BOM Only</option>
                                <option value="calculations">Calculations Only</option>
                            </select>
                        </div>

                        {/* Include Sections */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Include Sections
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={options.includeDetails}
                                        onChange={(e) =>
                                            setOptions({ ...options, includeDetails: e.target.checked })
                                        }
                                        data-testid="include-details-checkbox"
                                    />
                                    Project Details
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={options.includeEntities}
                                        onChange={(e) =>
                                            setOptions({ ...options, includeEntities: e.target.checked })
                                        }
                                        data-testid="include-entities-checkbox"
                                    />
                                    Entity List
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={options.includeCalculations}
                                        onChange={(e) =>
                                            setOptions({ ...options, includeCalculations: e.target.checked })
                                        }
                                        data-testid="include-calculations-checkbox"
                                    />
                                    HVAC Calculations
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={options.includeBOM}
                                        onChange={(e) =>
                                            setOptions({ ...options, includeBOM: e.target.checked })
                                        }
                                        data-testid="include-bom-checkbox"
                                    />
                                    Bill of Materials
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={options.includeScreenshot}
                                        onChange={(e) =>
                                            setOptions({ ...options, includeScreenshot: e.target.checked })
                                        }
                                        data-testid="include-screenshot-checkbox"
                                    />
                                    Canvas Screenshot
                                </label>
                            </div>
                        </div>

                        {/* Paper Size & Orientation */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Paper Size
                                </label>
                                <select
                                    value={options.paperSize}
                                    onChange={(e) =>
                                        setOptions({ ...options, paperSize: e.target.value as PaperSize })
                                    }
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    data-testid="paper-size-select"
                                >
                                    <option value="letter">Letter (8.5&quot; × 11&quot;)</option>
                                    <option value="a4">A4</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Orientation
                                </label>
                                <select
                                    value={options.orientation}
                                    onChange={(e) =>
                                        setOptions({ ...options, orientation: e.target.value as Orientation })
                                    }
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    data-testid="orientation-select"
                                >
                                    <option value="portrait">Portrait</option>
                                    <option value="landscape">Landscape</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={handleCancel}
                        disabled={exporting}
                        data-testid="export-cancel-btn"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={exporting}
                        data-testid="export-btn"
                    >
                        {exporting ? 'Exporting...' : 'Export'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ExportReportDialog;
