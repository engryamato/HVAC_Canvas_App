'use client';

import type { DuctEndType, DuctRunShape, InsulationType } from '@/core/schema';
import { useDuctDrawSettings, useToolActions, useToolStore } from '@/core/store/canvas.store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getStandardNominalSizes,
  isSizingProvenanceEnabled,
  snapSizeToQuarterInch,
  type SizeField,
} from '@/core/services/sizing/sizingProvenance';

const INSULATION_OPTIONS: Array<{ value: InsulationType | 'none'; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'wrap', label: 'Wrap' },
  { value: 'liner', label: 'Liner' },
  { value: 'double_wall_perforated', label: 'Double Wall Perf.' },
  { value: 'double_wall_non_perforated', label: 'Double Wall Solid' },
];

const END_OPTIONS: Array<{ value: DuctEndType; label: string }> = [
  { value: 'flange', label: 'Flange' },
  { value: 'raw', label: 'Raw' },
  { value: 'crimped', label: 'Crimped' },
  { value: 'coupled', label: 'Coupled' },
];

export function DuctToolOptionsPanel() {
  const settings = useDuctDrawSettings();
  const activeToolDefinition = useToolStore((state) => state.activeToolDefinition);
  const { setDuctDrawSettings } = useToolActions();
  const shape = settings.shape ?? ((activeToolDefinition?.metadata?.shape as DuctRunShape | undefined) ?? 'rectangular');
  const isRound = shape === 'round' || shape === 'flexible';
  const isFlexible = shape === 'flexible';
  const ws5Enabled = isSizingProvenanceEnabled();
  const sizeStep = ws5Enabled ? 0.25 : 1;

  const setSize = (field: Extract<SizeField, 'width' | 'height' | 'diameter'>, value: number) => {
    const next = ws5Enabled ? snapSizeToQuarterInch(value) : value;
    if (Number.isFinite(next)) {
      setDuctDrawSettings({ shape, [field]: next });
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duct Size</div>

      {isRound ? (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-slate-600" htmlFor="duct-tool-diameter">
            Diameter (in)
          </Label>
          <Input
            id="duct-tool-diameter"
            max={isFlexible ? 24 : 60}
            min={4}
            step={sizeStep}
            type="number"
            value={settings.diameter}
            onChange={(event) => {
              const next = Number(event.target.value);
              setSize('diameter', next);
            }}
          />
          {ws5Enabled ? (
            <NominalSizeSelect
              field="diameter"
              value={settings.diameter}
              onChange={(diameter) => setSize('diameter', diameter)}
            />
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-slate-600" htmlFor="duct-tool-width">
              Width (in)
            </Label>
            <Input
              id="duct-tool-width"
              max={96}
              min={4}
              step={sizeStep}
              type="number"
              value={settings.width}
              onChange={(event) => {
                const next = Number(event.target.value);
                setSize('width', next);
              }}
            />
            {ws5Enabled ? (
              <NominalSizeSelect
                field="width"
                value={settings.width}
                onChange={(width) => setSize('width', width)}
              />
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-slate-600" htmlFor="duct-tool-height">
              Height (in)
            </Label>
            <Input
              id="duct-tool-height"
              max={96}
              min={4}
              step={sizeStep}
              type="number"
              value={settings.height}
              onChange={(event) => {
                const next = Number(event.target.value);
                setSize('height', next);
              }}
            />
            {ws5Enabled ? (
              <NominalSizeSelect
                field="height"
                value={settings.height}
                onChange={(height) => setSize('height', height)}
              />
            ) : null}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <EndSelect
          label="Start End"
          value={settings.startEndType}
          onChange={(value) => setDuctDrawSettings({ startEndType: value })}
        />
        <EndSelect
          label="End End"
          value={settings.endEndType}
          onChange={(value) => setDuctDrawSettings({ endEndType: value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-slate-600">Insulation</Label>
          <Select
            value={settings.insulationType ?? 'none'}
            onValueChange={(value) =>
              setDuctDrawSettings({ insulationType: value === 'none' ? null : (value as InsulationType) })
            }
          >
            <SelectTrigger className="h-9 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INSULATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-slate-600" htmlFor="duct-tool-insulation-thickness">
            Thickness (in)
          </Label>
          <Input
            id="duct-tool-insulation-thickness"
            max={6}
            min={0.5}
            step={0.5}
            type="number"
            value={settings.insulationThickness}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) {
                setDuctDrawSettings({ insulationThickness: next });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

function NominalSizeSelect({
  field,
  onChange,
  value,
}: {
  field: Extract<SizeField, 'width' | 'height' | 'diameter'>;
  onChange: (value: number) => void;
  value?: number;
}) {
  return (
    <Select value={value ? String(value) : ''} onValueChange={(next) => onChange(Number(next))}>
      <SelectTrigger className="h-8 bg-white text-xs text-slate-500">
        <SelectValue placeholder="Nominal" />
      </SelectTrigger>
      <SelectContent>
        {getStandardNominalSizes(field).map((size) => (
          <SelectItem key={size} value={String(size)}>
            {size}"
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EndSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DuctEndType;
  onChange: (value: DuctEndType) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-slate-600">{label}</Label>
      <Select value={value} onValueChange={(next) => onChange(next as DuctEndType)}>
        <SelectTrigger className="h-9 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {END_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default DuctToolOptionsPanel;
