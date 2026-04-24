'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { captureCanvasSnapshot } from '@/features/export/canvasSnapshot';
import type { ExportOptions, ExportResult, ExportIncludeOptions, ExportFormat, PngQuality, PdfPageSize } from '@/features/export/types';

interface EnhancedExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => Promise<ExportResult>;
}

const DEFAULT_INCLUDE: ExportIncludeOptions = {
  grid: true,
  dimensions: true,
  labels: true,
};

const FORMAT_OPTIONS: Array<{ label: string; value: ExportFormat }> = [
  { label: 'PDF', value: 'pdf' },
  { label: 'PNG', value: 'png' },
  { label: 'SVG', value: 'svg' },
];

const QUALITY_OPTIONS: Array<{ label: string; value: PngQuality }> = [
  { label: 'Low (72 DPI)', value: 'low' },
  { label: 'Medium (150 DPI)', value: 'medium' },
  { label: 'High (300 DPI)', value: 'high' },
];

const PAGE_SIZE_OPTIONS: Array<{ label: string; value: PdfPageSize }> = [
  { label: 'Letter', value: 'letter' },
  { label: 'A4', value: 'a4' },
  { label: 'Custom', value: 'custom' },
];

const PROGRESS_DELAY_MS = 500;

export function EnhancedExportDialog({ open, onOpenChange, onExport }: EnhancedExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [quality, setQuality] = useState<PngQuality>('medium');
  const [pageSize, setPageSize] = useState<PdfPageSize>('letter');
  const [customDimensions, setCustomDimensions] = useState<{ width: number; height: number }>({ width: 8.5, height: 11 });
  const [include, setInclude] = useState<ExportIncludeOptions>(DEFAULT_INCLUDE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{ widthPx: number; heightPx: number; sizeEstimate: number } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressStatus, setProgressStatus] = useState('Preparing export...');

  const debounceRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  const exportOptions: ExportOptions = useMemo(
    () => ({
      format,
      quality: format === 'png' ? quality : undefined,
      pageSize: format === 'pdf' ? pageSize : undefined,
      customDimensions: pageSize === 'custom' ? customDimensions : undefined,
      include,
    }),
    [format, quality, pageSize, customDimensions, include]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      setIsPreviewLoading(true);
      setPreviewError(null);

      const snapshot = await captureCanvasSnapshot();
      if (!snapshot) {
        setPreviewUrl(null);
        setPreviewMeta(null);
        setPreviewError('Preview unavailable');
        setIsPreviewLoading(false);
        return;
      }

      const sizeEstimate = Math.round((snapshot.dataUrl.length * 3) / 4);
      setPreviewUrl(snapshot.dataUrl);
      setPreviewMeta({
        widthPx: snapshot.widthPx,
        heightPx: snapshot.heightPx,
        sizeEstimate,
      });
      setIsPreviewLoading(false);
    }, 250);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [open, format, quality, pageSize, customDimensions, include]);

  useEffect(() => {
    if (!open) {
      setIsExporting(false);
      setShowProgress(false);
      setProgressValue(0);
      setProgressStatus('Preparing export...');
    }
  }, [open]);

  const handleIncludeChange = (key: keyof ExportIncludeOptions, value: boolean) => {
    setInclude((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgressValue(0);
    setProgressStatus('Preparing export...');

    if (progressTimerRef.current) {
      window.clearTimeout(progressTimerRef.current);
    }

    progressTimerRef.current = window.setTimeout(() => {
      setShowProgress(true);
      setProgressValue(55);
      setProgressStatus('Exporting...');
    }, PROGRESS_DELAY_MS);

    const result = await onExport(exportOptions);

    if (progressTimerRef.current) {
      window.clearTimeout(progressTimerRef.current);
    }

    if (showProgress) {
      setProgressValue(100);
      setProgressStatus(result.success ? 'Export complete' : 'Export failed');
    }

    setIsExporting(false);
    setShowProgress(false);

    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl" data-testid="enhanced-export-dialog">
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">Format</label>
              <Select value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {format === 'png' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Quality</label>
                <Select value={quality} onValueChange={(value) => setQuality(value as PngQuality)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {format === 'pdf' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Page Size</label>
                <Select value={pageSize} onValueChange={(value) => setPageSize(value as PdfPageSize)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select page size" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {pageSize === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Width (in)</label>
                      <Input
                        type="number"
                        min={1}
                        step={0.1}
                        value={customDimensions.width}
                        onChange={(event) =>
                          setCustomDimensions((prev) => ({
                            ...prev,
                            width: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Height (in)</label>
                      <Input
                        type="number"
                        min={1}
                        step={0.1}
                        value={customDimensions.height}
                        onChange={(event) =>
                          setCustomDimensions((prev) => ({
                            ...prev,
                            height: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-900">Include</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox checked={include.grid} onCheckedChange={(value) => handleIncludeChange('grid', Boolean(value))} />
                  Grid
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={include.dimensions}
                    onCheckedChange={(value) => handleIncludeChange('dimensions', Boolean(value))}
                  />
                  Dimensions
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={include.labels}
                    onCheckedChange={(value) => handleIncludeChange('labels', Boolean(value))}
                  />
                  Labels
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
              {isPreviewLoading && <span className="text-xs text-slate-500">Updating…</span>}
            </div>
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-slate-200 bg-white">
              {previewUrl ? (
                <img src={previewUrl} alt="Canvas preview" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-sm text-slate-500">{previewError ?? 'No preview available'}</span>
              )}
            </div>
            {previewMeta && (
              <div className="text-xs text-slate-600">
                <div>Preview size: {previewMeta.widthPx} × {previewMeta.heightPx}px</div>
                <div>Estimated file size: {(previewMeta.sizeEstimate / 1024).toFixed(1)} KB</div>
              </div>
            )}
          </div>
        </div>

        {showProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>{progressStatus}</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} />
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting…' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EnhancedExportDialog;
