'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DuctRunShape } from '@/core/schema';
import type { DuctDrawSettings } from '@/core/store/canvas.store';

interface DuctSizePromptDialogProps {
  open: boolean;
  toolShape: DuctRunShape;
  currentSettings: DuctDrawSettings;
  onConfirm: (updates: Partial<DuctDrawSettings>) => void;
  onCancel: () => void;
}

const SHAPE_OPTIONS: Array<{ value: DuctRunShape; label: string }> = [
  { value: 'rectangular', label: 'Rectangular' },
  { value: 'round', label: 'Round / Spiral' },
  { value: 'flat_oval', label: 'Flat Oval' },
  { value: 'flexible', label: 'Flexible' },
];

export function DuctSizePromptDialog({
  open,
  toolShape,
  currentSettings,
  onConfirm,
  onCancel,
}: DuctSizePromptDialogProps) {
  const [shape, setShape] = useState<DuctRunShape>(toolShape);
  const [diameter, setDiameter] = useState(currentSettings.diameter);
  const [width, setWidth] = useState(currentSettings.width);
  const [height, setHeight] = useState(currentSettings.height);

  useEffect(() => {
    setShape(toolShape);
  }, [toolShape]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDiameter(currentSettings.diameter);
    setWidth(currentSettings.width);
    setHeight(currentSettings.height);
  }, [currentSettings.diameter, currentSettings.height, currentSettings.width, open]);

  const isRound = shape === 'round' || shape === 'flexible';

  const handleConfirm = () => {
    onConfirm({ shape, diameter, width, height });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-[320px]" data-testid="duct-size-prompt-dialog">
        <DialogHeader>
          <DialogTitle className="text-base">Set Duct Size</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-slate-600">Shape</Label>
            <Select value={shape} onValueChange={(value) => setShape(value as DuctRunShape)}>
              <SelectTrigger className="h-9 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHAPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isRound ? (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-slate-600" htmlFor="size-prompt-diameter">
                Diameter (in)
              </Label>
              <Input
                autoFocus
                id="size-prompt-diameter"
                max={shape === 'flexible' ? 24 : 60}
                min={4}
                step={1}
                type="number"
                value={diameter}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isFinite(value)) {
                    setDiameter(value);
                  }
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-slate-600" htmlFor="size-prompt-width">
                  Width (in)
                </Label>
                <Input
                  autoFocus
                  id="size-prompt-width"
                  max={96}
                  min={4}
                  step={1}
                  type="number"
                  value={width}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value)) {
                      setWidth(value);
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-slate-600" htmlFor="size-prompt-height">
                  Height (in)
                </Label>
                <Input
                  id="size-prompt-height"
                  max={96}
                  min={4}
                  step={1}
                  type="number"
                  value={height}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value)) {
                      setHeight(value);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button data-testid="duct-size-prompt-confirm" size="sm" onClick={handleConfirm}>
            Draw
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DuctSizePromptDialog;
