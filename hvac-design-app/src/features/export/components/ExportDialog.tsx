'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ReportOptions } from '../services/ReportGenerator';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExport: (options: ReportOptions) => void;
    isExporting?: boolean;
}

/**
 * Export Dialog Component
 * Implements UJ-PM-008: Export Project Report
 * 
 * Allows users to configure report options before exporting
 */
export function ExportDialog({ open, onOpenChange, onExport, isExporting = false }: ExportDialogProps) {
    const [reportType, setReportType] = useState<'full' | 'bom'>('full');
    const [includeMetadata, setIncludeMetadata] = useState(true);
    const [includeCalculations, setIncludeCalculations] = useState(true);
    const [includeEntities, setIncludeEntities] = useState(true);
    const [includeBOM, setIncludeBOM] = useState(true);
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

    const handleExport = () => {
        const options: ReportOptions = {
            includeMetadata: reportType === 'full' ? includeMetadata : false,
            includeCalculations: reportType === 'full' ? includeCalculations : false,
            includeEntities: reportType === 'full' ? includeEntities : false,
            includeBOM: reportType === 'bom' || includeBOM,
            orientation,
        };

        onExport(options);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Export Project Report</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Report Type Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Report Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="full"
                                    checked={reportType === 'full'}
                                    onChange={(e) => setReportType(e.target.value as 'full')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Full Report</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="bom"
                                    checked={reportType === 'bom'}
                                    onChange={(e) => setReportType(e.target.value as 'bom')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">BOM Only</span>
                            </label>
                        </div>
                    </div>

                    {/* Section Toggles (only for Full Report) */}
                    {reportType === 'full' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Include Sections</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeMetadata}
                                        onChange={(e) => setIncludeMetadata(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Project Metadata</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeCalculations}
                                        onChange={(e) => setIncludeCalculations(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Calculations</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeEntities}
                                        onChange={(e) => setIncludeEntities(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Entity Summary</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeBOM}
                                        onChange={(e) => setIncludeBOM(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Bill of Materials</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Orientation Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Page Orientation</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="portrait"
                                    checked={orientation === 'portrait'}
                                    onChange={(e) => setOrientation(e.target.value as 'portrait')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Portrait</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="landscape"
                                    checked={orientation === 'landscape'}
                                    onChange={(e) => setOrientation(e.target.value as 'landscape')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">Landscape</span>
                            </label>
                        </div>
                    </div>

                    {/* Preview/Estimate */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-600">
                            📄 Estimated pages: {reportType === 'bom' ? '1-2' : '3-5'}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => onOpenChange(false)}
                        disabled={isExporting}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isExporting ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Exporting...
                            </>
                        ) : (
                            <>
                                📄 Export PDF
                            </>
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
