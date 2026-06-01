import { ArrowLeftToLine, ArrowRightToLine, ArrowRightLeft, Layers, Minus, Plus, Ruler } from 'lucide-react';
import { useMemo } from 'react';
import type { DuctEndType, DuctRun, DuctSegment, DuctRunShape, InsulationType } from '@/core/schema';
import { updateEntity as updateEntityCommand } from '@/core/commands/entityCommands';
import { useSelectionStore } from '../../store/selectionStore';
import { getActiveSectionLength } from '@/features/duct-runs/utils/getActiveSectionLength';
import { recomputeDuctRunSegments } from '@/features/duct-runs/utils/recomputeDuctRunSegments';

interface DuctRunInspectorProps {
  entity: DuctRun;
}

const INSULATION_OPTIONS: Array<{ value: InsulationType; label: string }> = [
  { value: 'liner', label: 'Duct liner' },
  { value: 'wrap', label: 'Fiberglass wrap' },
  { value: 'double_wall_perforated', label: 'Double wall - perforated' },
  { value: 'double_wall_non_perforated', label: 'Double wall - non-perf.' },
];

const FLEX_INSULATION_OPTIONS: Array<{ value: InsulationType; label: string }> = [
  { value: 'wrap', label: 'Factory wrap' },
];

const END_OPTIONS: Array<{ value: DuctEndType; label: string }> = [
  { value: 'flange', label: 'Flange (TDC / TDF)' },
  { value: 'raw', label: 'Raw / open' },
  { value: 'crimped', label: 'Crimped' },
  { value: 'coupled', label: 'Coupled' },
];

const SHAPE_OPTIONS: Array<{ value: DuctRunShape; label: string }> = [
  { value: 'round', label: 'Round' },
  { value: 'rectangular', label: 'Rectangular' },
  { value: 'flat_oval', label: 'Flat Oval' },
  { value: 'flexible', label: 'Flexible' },
];

function getEndTypeLabel(value: DuctEndType): string {
  return END_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getSelectedSegmentsForRun(selectedSegments: Array<{ runId: string; segmentIndex: number }>, runId: string) {
  return selectedSegments
    .filter((segment) => segment.runId === runId)
    .map((segment) => segment.segmentIndex)
    .sort((left, right) => left - right);
}

function getResolvedSegmentSettings(entity: DuctRun, segment?: DuctSegment) {
  const insulationType =
    entity.props.shape === 'flexible' && segment?.insulationType && segment.insulationType !== 'wrap'
      ? undefined
      : segment?.insulationType ?? entity.props.insulationType;

  return {
    insulationType,
    insulationThickness: segment?.insulationThickness ?? entity.props.insulationThickness ?? 1.5,
    startEndType: segment?.startEndType ?? entity.props.startEndType ?? 'flange',
    endEndType: segment?.endEndType ?? entity.props.endEndType ?? 'flange',
  };
}

function clampToStep(value: number, min: number, max: number, step: number): number {
  const rounded = Math.round(value / step) * step;
  return Math.min(max, Math.max(min, Number(rounded.toFixed(3))));
}

function formatNumber(value: number, digits = 0): string {
  return Number(value.toFixed(digits)).toString();
}

function getShapeBadgeClass(shape: DuctRunShape): string {
  if (shape === 'round') {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  if (shape === 'flexible') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (shape === 'flat_oval') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-purple-200 bg-purple-50 text-purple-700';
}

function getShapeBadgeLabel(shape: DuctRunShape): string {
  return SHAPE_OPTIONS.find((option) => option.value === shape)?.label ?? 'Rectangular';
}

function getShapeRunName(shape: DuctRunShape, currentName: string): string {
  const generatedNameMatch = /^(Rectangular|Round|Flat Oval|Flexible) Duct Run (.+)$/.exec(currentName);
  if (!generatedNameMatch) {
    return currentName;
  }

  return `${getShapeBadgeLabel(shape)} Duct Run ${generatedNameMatch[2]}`;
}

function getRunDefaults(entity: DuctRun) {
  return {
    insulationType: entity.props.insulationType,
    insulationThickness: entity.props.insulationThickness,
    startEndType: entity.props.startEndType,
    endEndType: entity.props.endEndType,
  };
}

function sanitizeRunDefaultsForShape(shape: DuctRunShape, entity: DuctRun) {
  const defaults = getRunDefaults(entity);

  if (shape !== 'flexible' || !defaults.insulationType || defaults.insulationType === 'wrap') {
    return defaults;
  }

  return { ...defaults, insulationType: undefined };
}

function getDuctMaterialForShape(shape: DuctRunShape, currentMaterial: DuctRun['props']['material']): DuctRun['props']['material'] {
  if (shape === 'flexible') {
    return 'flex';
  }

  return currentMaterial === 'flex' ? 'galvanized' : currentMaterial;
}

function calculateEquivalentRoundDiameter(width: number, height: number): number {
  return 1.3 * Math.pow(width * height, 0.625) / Math.pow(width + height, 0.25);
}

function getCurrentPrimarySize(props: DuctRun['props']): number {
  const dimensions = props as Record<string, unknown>;

  if (typeof dimensions.diameter === 'number') {
    return dimensions.diameter;
  }

  if (typeof dimensions.width === 'number') {
    return dimensions.width;
  }

  if (typeof dimensions.height === 'number') {
    return dimensions.height;
  }

  return 12;
}

function getRectangularDimensions(props: DuctRun['props']): { width: number; height: number } | null {
  const dimensions = props as Record<string, unknown>;

  if (typeof dimensions.width === 'number' && typeof dimensions.height === 'number') {
    return {
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  return null;
}

function getPreviousRectangularDimensions(props: DuctRun['props']): { width: number; height: number } | null {
  const dimensions = props as Record<string, unknown>;

  if (
    typeof dimensions.previousRectangularWidth === 'number' &&
    typeof dimensions.previousRectangularHeight === 'number'
  ) {
    return {
      width: dimensions.previousRectangularWidth,
      height: dimensions.previousRectangularHeight,
    };
  }

  return null;
}

function SectionHeader({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-slate-600">
      <Icon aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />
      <span>{children}</span>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-white px-4 py-3.5 shadow-sm">{children}</div>;
}

function Field({ children, label, htmlFor }: { children: React.ReactNode; label: string; htmlFor?: string }) {
  return (
    <div className="mb-3 flex flex-col gap-1 last:mb-0">
      <label className="text-xs font-medium text-slate-900" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="mt-0.5 text-[11px] text-slate-400">{children}</div>;
}

function Stepper({
  decrementLabel,
  incrementLabel,
  max,
  min,
  onChange,
  step,
  unit,
  value,
  valueDigits = 0,
}: {
  decrementLabel: string;
  incrementLabel: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  unit: string;
  value: number;
  valueDigits?: number;
}) {
  const update = (delta: number) => onChange(clampToStep(value + delta, min, max, step));

  return (
    <div className="flex h-[35px] items-center overflow-hidden rounded-md border border-slate-300 bg-white">
      <button
        aria-label={decrementLabel}
        className="flex h-full w-9 shrink-0 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
        disabled={value <= min}
        type="button"
        onClick={() => update(-step)}
      >
        <Minus aria-hidden="true" className="h-4 w-4" />
      </button>
      <div className="flex h-full flex-1 items-center justify-center gap-1 border-x border-slate-200 px-1 text-center text-[13px] font-medium text-slate-900">
        <span>{formatNumber(value, valueDigits)}</span>
        <span className="text-[11px] font-normal text-slate-400">{unit}</span>
      </div>
      <button
        aria-label={incrementLabel}
        className="flex h-full w-9 shrink-0 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
        disabled={value >= max}
        type="button"
        onClick={() => update(step)}
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}

function NativeSelect<TValue extends string>({
  id,
  onChange,
  options,
  value,
}: {
  id: string;
  onChange: (value: TValue) => void;
  options: Array<{ value: TValue; label: string }>;
  value: TValue;
}) {
  return (
    <select
      className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as TValue)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function DuctRunInspector({ entity }: DuctRunInspectorProps) {
  const selectedSegments = useSelectionStore((state) => state.selectedSegments);
  const selectedIndexes = useMemo(
    () => getSelectedSegmentsForRun(selectedSegments, entity.id),
    [entity.id, selectedSegments]
  );
  const selectedRunSegments = selectedIndexes
    .map((index) => entity.props.segments[index])
    .filter((segment): segment is DuctSegment => Boolean(segment));
  const editableSegment = selectedRunSegments[0] ?? entity.props.segments[0];
  const editableSegmentSettings = getResolvedSegmentSettings(entity, editableSegment);
  const selectedInsulation = editableSegmentSettings.insulationType;
  const isInsulated = Boolean(selectedInsulation);
  const isFlexible = entity.props.shape === 'flexible';
  const isRound = entity.props.shape === 'round' || entity.props.shape === 'flexible';
  const insulationOptions = isFlexible ? FLEX_INSULATION_OPTIONS : INSULATION_OPTIONS;
  const activeSectionLength = getActiveSectionLength(entity);
  const hasSymmetricEnds = editableSegmentSettings.startEndType === editableSegmentSettings.endEndType;

  const updateRun = (nextProps: DuctRun['props']) => {
    const previous = structuredClone(entity);
    updateEntityCommand(entity.id, {
      props: nextProps,
      modifiedAt: new Date().toISOString(),
    }, previous);
  };

  const updateRunProps = (updates: Partial<DuctRun['props']>) => {
    updateRun({ ...entity.props, ...updates } as DuctRun['props']);
  };

  const applySegmentProps = (
    updates: Pick<Partial<DuctSegment>, 'insulationType' | 'insulationThickness' | 'startEndType' | 'endEndType'>
  ) => {
    const sanitizedUpdates = { ...updates };
    if ('insulationType' in updates) {
      sanitizedUpdates.insulationType =
        isFlexible && updates.insulationType && updates.insulationType !== 'wrap'
          ? undefined
          : updates.insulationType;
    }

    const targetIndexes = new Set(
      selectedIndexes.length > 0 ? selectedIndexes : entity.props.segments.map((segment) => segment.index)
    );
    const nextSegments = entity.props.segments.map((segment, index) =>
      targetIndexes.has(segment.index) || targetIndexes.has(index)
        ? { ...segment, ...sanitizedUpdates }
        : segment
    );

    updateRun({
      ...entity.props,
      ...(selectedIndexes.length === 0 ? sanitizedUpdates : {}),
      segments: nextSegments,
    } as DuctRun['props']);
  };

  const setSectionLength = (sectionLength: number) => {
    if (!Number.isFinite(sectionLength)) {
      return;
    }

    const nextLength = Math.min(1000, Math.max(0.1, sectionLength));

    updateRun({
      ...entity.props,
      sectionLengthOverride: nextLength,
      segments: recomputeDuctRunSegments(entity.props.installLength, nextLength, getRunDefaults(entity)),
    } as DuctRun['props']);
  };

  const setRunLength = (runLength: number) => {
    if (!Number.isFinite(runLength)) {
      return;
    }

    const nextInstallLength = Math.min(1000, Math.max(0.1, runLength));
    updateRun({
      ...entity.props,
      installLength: nextInstallLength,
      segments: recomputeDuctRunSegments(nextInstallLength, activeSectionLength, getRunDefaults(entity)),
    } as DuctRun['props']);
  };

  const setShape = (shape: DuctRunShape) => {
    if (shape === entity.props.shape) {
      return;
    }

    const defaults = sanitizeRunDefaultsForShape(shape, entity);
    const baseProps = {
      ...entity.props,
      shape,
      name: getShapeRunName(shape, entity.props.name),
      material: getDuctMaterialForShape(shape, entity.props.material),
      insulationType: defaults.insulationType,
      insulationThickness: defaults.insulationThickness,
      startEndType: defaults.startEndType,
      endEndType: defaults.endEndType,
      segments: recomputeDuctRunSegments(entity.props.installLength, activeSectionLength, defaults),
    };
    const primarySize = getCurrentPrimarySize(entity.props);
    const currentRectangularDimensions = getRectangularDimensions(entity.props);
    const previousRectangularDimensions = getPreviousRectangularDimensions(entity.props);
    const rememberedRectangularDimensions = currentRectangularDimensions ?? previousRectangularDimensions;
    const equivalentRoundDiameter = currentRectangularDimensions
      ? calculateEquivalentRoundDiameter(currentRectangularDimensions.width, currentRectangularDimensions.height)
      : primarySize;

    const nextProps = shape === 'round' || shape === 'flexible'
      ? ({
          ...baseProps,
          ...(rememberedRectangularDimensions
            ? {
                previousRectangularWidth: rememberedRectangularDimensions.width,
                previousRectangularHeight: rememberedRectangularDimensions.height,
              }
            : {}),
          diameter: shape === 'flexible' ? Math.min(24, equivalentRoundDiameter) : equivalentRoundDiameter,
          width: undefined,
          height: undefined,
        } as DuctRun['props'])
      : ({
          ...baseProps,
          width: rememberedRectangularDimensions?.width ?? primarySize,
          height: rememberedRectangularDimensions?.height ?? primarySize,
          diameter: undefined,
        } as DuctRun['props']);

    updateRun(nextProps);
  };

  const setDimension = (updates: Partial<DuctRun['props']>) => {
    updateRunProps(updates);
  };

  const aspectRatio = !isRound && 'width' in entity.props && 'height' in entity.props
    ? entity.props.width / entity.props.height
    : null;

  return (
    <div className="flex w-full flex-col gap-3 bg-slate-50 text-sm" data-testid="duct-run-inspector">
      <Card>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 text-[10px] font-medium text-slate-400">Name</div>
            <div className="truncate text-[13px] font-medium text-slate-900">{entity.props.name}</div>
          </div>
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${getShapeBadgeClass(entity.props.shape)}`}>
            {getShapeBadgeLabel(entity.props.shape)}
          </span>
        </div>
      </Card>

      <Card>
        <SectionHeader icon={Ruler}>Dimensions</SectionHeader>

        <div className="mb-3 grid grid-cols-2 gap-1 rounded-md border border-slate-200 bg-slate-100 p-0.5" role="radiogroup" aria-label="Duct shape">
          {SHAPE_OPTIONS.map((option) => {
            const isActive = entity.props.shape === option.value;

            return (
              <button
                key={option.value}
                aria-checked={isActive}
                className={`rounded-[6px] py-1.5 text-[11px] font-medium transition ${
                  isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
                role="radio"
                type="button"
                onClick={() => setShape(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {isRound ? (
          <Field label="Diameter">
            <Stepper
              decrementLabel="Decrease diameter"
              incrementLabel="Increase diameter"
              max={isFlexible ? 24 : 60}
              min={4}
              step={1}
              unit="in"
              value={'diameter' in entity.props ? entity.props.diameter : 12}
              onChange={(diameter) => setDimension({ diameter, width: undefined, height: undefined } as Partial<DuctRun['props']>)}
            />
            <Hint>SMACNA range: 4-60 in.</Hint>
          </Field>
        ) : (
          <>
            <Field label="Width">
              <Stepper
                decrementLabel="Decrease width"
                incrementLabel="Increase width"
                max={96}
                min={4}
                step={2}
                unit="in"
                value={'width' in entity.props ? entity.props.width : 12}
                onChange={(width) => setDimension({ width, diameter: undefined } as Partial<DuctRun['props']>)}
              />
            </Field>
            <Field label="Height">
              <Stepper
                decrementLabel="Decrease height"
                incrementLabel="Increase height"
                max={96}
                min={4}
                step={2}
                unit="in"
                value={'height' in entity.props ? entity.props.height : 8}
                onChange={(height) => setDimension({ height, diameter: undefined } as Partial<DuctRun['props']>)}
              />
            </Field>
            {aspectRatio !== null ? (
              <div
                className={`mt-1 rounded-md border px-2.5 py-2 text-[11px] ${
                  aspectRatio > 4 ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {aspectRatio > 4
                  ? `Aspect ratio ${aspectRatio.toFixed(1)}:1 - exceeds SMACNA 4:1 limit`
                  : `Aspect ratio: ${aspectRatio.toFixed(1)}:1`}
              </div>
            ) : null}
          </>
        )}

        <Field htmlFor="duct-run-section-length" label="Section Length">
          <div className="flex items-center gap-2">
            <input
              className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-[13px] text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              id="duct-run-section-length"
              max={1000}
              min={0.1}
              step={0.5}
              type="number"
              value={formatNumber(activeSectionLength, 1)}
              onChange={(event) => setSectionLength(Number(event.target.value))}
            />
            <span className="text-xs text-slate-400">ft</span>
          </div>
          <Hint>Length of each fabrication section in feet</Hint>
        </Field>

        <Field htmlFor="duct-run-length" label="Run Length">
          <div className="flex items-center gap-2">
            <input
              className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-[13px] text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              id="duct-run-length"
              max={1000}
              min={0.1}
              step={0.5}
              type="number"
              value={formatNumber(entity.props.installLength, 1)}
              onChange={(event) => setRunLength(Number(event.target.value))}
            />
            <span className="text-xs text-slate-400">ft</span>
          </div>
          <Hint>Total length of the duct run in feet</Hint>
        </Field>
      </Card>

      <Card>
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <SectionHeader icon={Layers}>Insulation</SectionHeader>
          <button
            aria-checked={isInsulated}
            aria-label="Toggle insulation"
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              isInsulated ? 'bg-blue-500' : 'bg-slate-300'
            }`}
            role="switch"
            type="button"
            onClick={() =>
              applySegmentProps({
                insulationType: isInsulated ? undefined : 'wrap',
                insulationThickness: editableSegmentSettings.insulationThickness,
              })
            }
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                isInsulated ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {isInsulated ? (
          <>
            <Field htmlFor="duct-run-insulation-type" label="Insulation type">
              <NativeSelect
                id="duct-run-insulation-type"
                options={insulationOptions}
                value={selectedInsulation ?? 'wrap'}
                onChange={(insulationType) => applySegmentProps({ insulationType })}
              />
            </Field>
            <Field label="Thickness">
              <Stepper
                decrementLabel="Decrease thickness"
                incrementLabel="Increase thickness"
                max={6}
                min={0.5}
                step={0.5}
                unit="in"
                value={editableSegmentSettings.insulationThickness}
                valueDigits={1}
                onChange={(insulationThickness) => applySegmentProps({ insulationThickness })}
              />
              <Hint>Range: 0.5-6 in., adjusts in 0.5 in. increments</Hint>
            </Field>
          </>
        ) : (
          <p className="text-[11px] italic text-slate-400">No insulation applied to this duct.</p>
        )}
      </Card>

      <Card>
        <SectionHeader icon={ArrowRightLeft}>End Types</SectionHeader>
        <Field htmlFor="duct-run-start-end" label="Start end">
          <div className="flex items-center gap-2">
            <ArrowLeftToLine aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
            <NativeSelect
              id="duct-run-start-end"
              options={END_OPTIONS}
              value={editableSegmentSettings.startEndType}
              onChange={(startEndType) => applySegmentProps({ startEndType })}
            />
          </div>
        </Field>
        <Field htmlFor="duct-run-finish-end" label="Finish end">
          <div className="flex items-center gap-2">
            <ArrowRightToLine aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
            <NativeSelect
              id="duct-run-finish-end"
              options={END_OPTIONS}
              value={editableSegmentSettings.endEndType}
              onChange={(endEndType) => applySegmentProps({ endEndType })}
            />
          </div>
        </Field>
        {hasSymmetricEnds ? (
          <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
            Both ends are {getEndTypeLabel(editableSegmentSettings.startEndType)} - symmetric connection.
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default DuctRunInspector;
