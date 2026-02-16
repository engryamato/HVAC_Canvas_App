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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettingsStore } from '@/core/store/settingsStore';

export type ExportFormat = 'csv' | 'pdf' | 'excel';
export type ExportContent = 'bom' | 'entities' | 'calculations' | 'all';
export type GroupByOption = 'category' | 'systemType' | 'zone' | 'none';

export interface ExportDialogOptions {
  format: ExportFormat;
  content: ExportContent;
  groupBy: GroupByOption;
  includePricing: boolean;
  includeCanvasSnapshot: boolean;
  templateId?: string;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportDialogOptions) => void;
  isExporting?: boolean;
}

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  isExporting = false,
}: ExportDialogProps) {
  const templates = useSettingsStore((state) => state.templates);

  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [content, setContent] = useState<ExportContent>('all');
  const [groupBy, setGroupBy] = useState<GroupByOption>('category');
  const [includePricing, setIncludePricing] = useState(true);
  const [includeCanvasSnapshot, setIncludeCanvasSnapshot] = useState(true);
  const [templateId, setTemplateId] = useState<string>('');

  const handleExport = () => {
    const options: ExportDialogOptions = {
      format,
      content,
      groupBy,
      includePricing,
      includeCanvasSnapshot,
      templateId: templateId || undefined,
    };
    onExport(options);
  };

  const handleCancel = () => {
    if (!isExporting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="export-dialog">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
        </DialogHeader>

        {isExporting ? (
          <div className="py-8 space-y-4">
            <p className="text-center font-medium">Exporting...</p>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full animate-pulse"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="export-format">Export Format</Label>
              <Select
                value={format}
                onValueChange={(value) => setFormat(value as ExportFormat)}
              >
                <SelectTrigger id="export-format" data-testid="export-format-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                  <SelectItem value="excel">Excel Workbook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="export-content">Content to Export</Label>
              <Select
                value={content}
                onValueChange={(value) => setContent(value as ExportContent)}
              >
                <SelectTrigger id="export-content" data-testid="export-content-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="bom">Bill of Materials Only</SelectItem>
                  <SelectItem value="entities">Entities Only</SelectItem>
                  <SelectItem value="calculations">Calculations Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="export-groupby">Group By</Label>
              <Select
                value={groupBy}
                onValueChange={(value) => setGroupBy(value as GroupByOption)}
              >
                <SelectTrigger id="export-groupby" data-testid="export-groupby-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="systemType">System Type</SelectItem>
                  <SelectItem value="zone">Zone</SelectItem>
                  <SelectItem value="none">No Grouping</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="export-template">Template (Optional)</Label>
              <Select
                value={templateId}
                onValueChange={(value) => setTemplateId(value)}
              >
                <SelectTrigger id="export-template" data-testid="export-template-select">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Use Current Settings)</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-pricing"
                    checked={includePricing}
                    onCheckedChange={(checked) => setIncludePricing(checked === true)}
                    data-testid="include-pricing-checkbox"
                  />
                  <Label htmlFor="include-pricing" className="font-normal cursor-pointer">
                    Include Pricing
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-snapshot"
                    checked={includeCanvasSnapshot}
                    onCheckedChange={(checked) => setIncludeCanvasSnapshot(checked === true)}
                    data-testid="include-snapshot-checkbox"
                  />
                  <Label htmlFor="include-snapshot" className="font-normal cursor-pointer">
                    Include Canvas Screenshot
                  </Label>
                </div>
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
            data-testid="export-confirm-btn"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
