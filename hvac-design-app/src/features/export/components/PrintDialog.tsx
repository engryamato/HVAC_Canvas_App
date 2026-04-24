'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { captureCanvasSnapshot } from '@/features/export/canvasSnapshot';
import type { PrintMargins, PrintOrientation, PrintOptions, PrintScale } from '@/features/export/types';

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (options: PrintOptions) => Promise<void>;
}

const MARGIN_OPTIONS: Array<{ label: string; value: PrintMargins }> = [
  { label: 'Normal (1 inch)', value: 'normal' },
  { label: 'Narrow (0.5 inch)', value: 'narrow' },
  { label: 'Wide (1.5 inch)', value: 'wide' },
];

export function PrintDialog({ open, onOpenChange, onPrint }: PrintDialogProps) {
  const [orientation, setOrientation] = useState<PrintOrientation>('portrait');
  const [scale, setScale] = useState<PrintScale>('fit');
  const [customScale, setCustomScale] = useState(100);
  const [margins, setMargins] = useState<PrintMargins>('normal');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      setPreviewError(null);
      const snapshot = await captureCanvasSnapshot();
      if (!snapshot) {
        setPreviewUrl(null);
        setPreviewError('Preview unavailable');
        return;
      }

      setPreviewUrl(snapshot.dataUrl);
    }, 200);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [open, orientation, scale, customScale, margins]);

  const printOptions: PrintOptions = {
    orientation,
    scale,
    customScale: scale === 'custom' ? customScale : undefined,
    margins,
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    await onPrint(printOptions);
    setIsPrinting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl" data-testid="print-dialog">
        <DialogHeader>
          <DialogTitle>Print</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">Orientation</label>
              <RadioGroup value={orientation} onValueChange={(value) => setOrientation(value as PrintOrientation)}>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <RadioGroupItem value="portrait" />
                  Portrait
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <RadioGroupItem value="landscape" />
                  Landscape
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">Scale</label>
              <RadioGroup value={scale} onValueChange={(value) => setScale(value as PrintScale)}>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <RadioGroupItem value="fit" />
                  Fit to page
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <RadioGroupItem value="actual" />
                  Actual size
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <RadioGroupItem value="custom" />
                  Custom
                </label>
              </RadioGroup>

              {scale === 'custom' && (
                <div className="space-y-1 pl-6">
                  <label className="text-xs font-medium text-slate-600">Scale (%)</label>
                  <Input
                    type="number"
                    min={10}
                    max={200}
                    step={1}
                    value={customScale}
                    onChange={(event) => setCustomScale(Number(event.target.value))}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">Margins</label>
              <Select value={margins} onValueChange={(value) => setMargins(value as PrintMargins)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select margins" />
                </SelectTrigger>
                <SelectContent>
                  {MARGIN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
              <span className="text-xs text-slate-500">{orientation === 'portrait' ? '8.5" × 11"' : '11" × 8.5"'}</span>
            </div>
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-slate-200 bg-white">
              {previewUrl ? (
                <img src={previewUrl} alt="Print preview" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-sm text-slate-500">{previewError ?? 'No preview available'}</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPrinting}>
            Cancel
          </Button>
          <Button onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? 'Printing…' : 'Print'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PrintDialog;
