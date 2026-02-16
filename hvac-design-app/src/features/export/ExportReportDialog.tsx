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
import { useExport } from '@/features/export/hooks/useExport';
import { useEntityStore } from '@/core/store/entityStore';
import { useProjectStore } from '@/core/store/project.store';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useViewportStore } from '@/features/canvas/store/viewportStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { useValidationStore } from '@/core/store/validationStore';
import { type Project } from '@/types/project';
import { useShallow } from 'zustand/react/shallow';

export interface ExportReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export type ReportType = 'full' | 'summary' | 'bom' | 'calculations';
export type PaperSize = 'letter' | 'a4';
export type Orientation = 'portrait' | 'landscape';

export interface ExportOptions {
    format: 'pdf' | 'csv' | 'excel';
    groupBy: 'category' | 'systemType' | 'zone' | 'flat';
    includePricing: boolean;
    includeEngineeringNotes: boolean;
    includeCanvasSnapshot: boolean;
    templateId?: string;
    reportType: ReportType;
    includeDetails: boolean;
    includeEntities: boolean;
    includeCalculations: boolean;
    includeBOM: boolean;
    paperSize: PaperSize;
    orientation: Orientation;
}

// Helper removed in favor of useExport hook

export function ExportReportDialog({ open, onOpenChange }: ExportReportDialogProps) {
    const [options, setOptions] = useState<ExportOptions>({
        format: 'pdf',
        groupBy: 'category',
        includePricing: true,
        includeEngineeringNotes: true,
        includeCanvasSnapshot: true,
        templateId: undefined,
        reportType: 'full',
        includeDetails: true,
        includeEntities: true,
        includeCalculations: true,
        includeBOM: true,
        paperSize: 'letter',
        orientation: 'portrait',
    });

    const { exportProject, isExporting, error } = useExport();
    const warningViolations = useValidationStore(
        useShallow((state) =>
            Object.values(state.validationResults).flatMap((result) =>
                result.violations.filter((violation) => violation.severity === 'warning')
            )
        )
    );
    
    // Store selectors for data aggregation
    const currentProjectId = useProjectStore((state) => state.currentProjectId);
    const projectDetails = useProjectStore((state) => state.projectDetails);

    const handleReportTypeChange = (type: ReportType) => {
        const newOptions = { ...options, reportType: type };

        // Auto-select sections based on report type
        switch (type) {
            case 'full':
                newOptions.includeDetails = true;
                newOptions.includeEntities = true;
                newOptions.includeCalculations = true;
                newOptions.includeBOM = true;
                newOptions.includeCanvasSnapshot = true;
                break;
            case 'summary':
                newOptions.includeDetails = true;
                newOptions.includeEntities = false;
                newOptions.includeCalculations = false;
                newOptions.includeBOM = false;
                newOptions.includeCanvasSnapshot = false;
                break;
            case 'bom':
                newOptions.includeDetails = false;
                newOptions.includeEntities = false;
                newOptions.includeCalculations = false;
                newOptions.includeBOM = true;
                newOptions.includeCanvasSnapshot = false;
                break;
            case 'calculations':
                newOptions.includeDetails = false;
                newOptions.includeEntities = false;
                newOptions.includeCalculations = true;
                newOptions.includeBOM = false;
                newOptions.includeCanvasSnapshot = false;
                break;
        }

        setOptions(newOptions);
    };

    const handleExport = async () => {
        if (!currentProjectId || !projectDetails) {
            return;
        }
        if (warningViolations.length > 0 && options.includeEngineeringNotes) {
            const shouldContinue = window.confirm(
                `Design has ${warningViolations.length} warning(s). Include them in engineering notes and continue export?`
            );
            if (!shouldContinue) {
                return;
            }
        }

        // Aggregate project data from stores
        const entityStore = useEntityStore.getState();
        const viewportStore = useViewportStore.getState();
        const preferences = usePreferencesStore.getState();
        const historyStore = useHistoryStore.getState();

        const project: Project = {
            projectId: currentProjectId,
            projectName: projectDetails.projectName,
            projectNumber: projectDetails.projectNumber || undefined,
            clientName: projectDetails.clientName || undefined,
            location: projectDetails.location || undefined,
            createdAt: projectDetails.createdAt,
            modifiedAt: new Date().toISOString(),
            entities: {
                byId: entityStore.byId,
                allIds: entityStore.allIds,
            },
            viewportState: {
                panX: viewportStore.panX,
                panY: viewportStore.panY,
                zoom: viewportStore.zoom,
            },
            settings: {
                unitSystem: preferences.unitSystem,
                gridSize: preferences.gridSize,
                gridVisible: viewportStore.gridVisible,
            },
            commandHistory: {
                commands: historyStore.past,
                currentIndex: Math.max(historyStore.past.length - 1, 0),
            },
            scope: {
                projectType: 'HVAC Design', // Default
                details: [],
            },
            siteConditions: {
                // TODO: Add site conditions to store
            }
        };

        const result = await exportProject(project, {
            format: options.format,
            groupBy: options.groupBy,
            includePricing: options.includePricing,
            includeEngineeringNotes: options.includeEngineeringNotes,
            includeCanvasSnapshot: options.includeCanvasSnapshot,
            templateId: options.templateId,
            includeMetadata: options.includeDetails,
            includeCalculations: options.includeCalculations,
            includeEntities: options.includeEntities,
            includeBOM: options.includeBOM,
            orientation: options.orientation,
        });

        if (result.success) {
            onOpenChange(false);
        }
    };

    const handleCancel = () => {
        if (!isExporting) {
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

                {isExporting ? (
                    <div className="py-8 space-y-4">
                        <p className="text-center font-medium">Generating Report...</p>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full animate-pulse"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <p className="text-center text-sm text-slate-500">Please wait...</p>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                                Error: {error}
                            </div>
                        )}
                        {/* Report Type */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Format
                            </label>
                            <select
                                value={options.format}
                                onChange={(e) => setOptions({ ...options, format: e.target.value as ExportOptions['format'] })}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="pdf">PDF</option>
                                <option value="csv">CSV</option>
                                <option value="excel">Excel</option>
                            </select>
                        </div>

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
                                        checked={options.includeCanvasSnapshot}
                                        onChange={(e) =>
                                            setOptions({ ...options, includeCanvasSnapshot: e.target.checked })
                                        }
                                        data-testid="include-screenshot-checkbox"
                                    />
                                    Canvas Screenshot
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={options.includePricing}
                                        onChange={(e) =>
                                            setOptions({ ...options, includePricing: e.target.checked })
                                        }
                                    />
                                    Include Pricing
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={options.includeEngineeringNotes}
                                        onChange={(e) =>
                                            setOptions({ ...options, includeEngineeringNotes: e.target.checked })
                                        }
                                    />
                                    Engineering Notes
                                </label>
                            </div>
                        </div>

                        {/* Paper Size & Orientation */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Group By
                                </label>
                                <select
                                    value={options.groupBy}
                                    onChange={(e) => setOptions({ ...options, groupBy: e.target.value as ExportOptions['groupBy'] })}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="category">Category</option>
                                    <option value="systemType">System Type</option>
                                    <option value="zone">Zone</option>
                                    <option value="flat">Flat List</option>
                                </select>
                            </div>
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
                        disabled={isExporting}
                        data-testid="export-cancel-btn"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        data-testid="export-btn"
                    >
                        {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ExportReportDialog;
