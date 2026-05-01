import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DuctRun, DuctSegment, FabricationProfileEntry } from '@/core/schema';
import { updateEntity as updateEntityCommand } from '@/core/commands/entityCommands';
import { useSelectionStore } from '../../store/selectionStore';
import { useFabricationProfileStore } from '@/core/store/fabricationProfileStore';
import { getActiveSectionLength } from '@/features/duct-runs/utils/getActiveSectionLength';
import { recomputeDuctRunSegments } from '@/features/duct-runs/utils/recomputeDuctRunSegments';
import { summarizeDuctRunQuantity } from '@/features/duct-runs/utils/summarizeDuctRunQuantity';
import { resolveDuctFabricationFamily } from '@/core/schema/fabrication-profile.schema';

interface DuctRunInspectorProps {
  entity: DuctRun;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </h4>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">{children}</div>;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900">
        {value}
      </div>
    </div>
  );
}

function formatFeet(value: number): string {
  return `${Number(value.toFixed(2))} ft`;
}

function getRunSizeLabel(run: DuctRun): string {
  if (run.props.shape === 'round' || run.props.shape === 'flexible') {
    return `${run.props.diameter}" dia.`;
  }

  return `${run.props.width}" x ${run.props.height}"`;
}

function getFamilyProfile(entry: FabricationProfileEntry): string {
  return `${entry.name} (${formatFeet(entry.defaultSectionLength)} default)`;
}

function getSelectedSegmentsForRun(selectedSegments: Array<{ runId: string; segmentIndex: number }>, runId: string) {
  return selectedSegments
    .filter((segment) => segment.runId === runId)
    .map((segment) => segment.segmentIndex)
    .sort((left, right) => left - right);
}

function getSegmentLabel(segment: DuctSegment): string {
  return segment.isPartial ? `Partial piece ${segment.index + 1}` : `Full piece ${segment.index + 1}`;
}

export function DuctRunInspector({ entity }: DuctRunInspectorProps) {
  const selectedSegments = useSelectionStore((state) => state.selectedSegments);
  const committedProfile = useFabricationProfileStore((state) => state.committed);
  const selectedIndexes = useMemo(
    () => getSelectedSegmentsForRun(selectedSegments, entity.id),
    [entity.id, selectedSegments]
  );

  const quantitySummary = useMemo(() => {
    if (entity.props.shape === 'round' || entity.props.shape === 'flexible') {
      return summarizeDuctRunQuantity({
        engineeringSystem: entity.props.engineeringSystem,
        shape: entity.props.shape,
        segments: entity.props.segments,
        diameter: entity.props.diameter,
      });
    }

    return summarizeDuctRunQuantity({
      engineeringSystem: entity.props.engineeringSystem,
      shape: entity.props.shape,
      segments: entity.props.segments,
      width: entity.props.width,
      height: entity.props.height,
    });
  }, [entity.props]);

  const fabricationFamily = resolveDuctFabricationFamily(entity.props.shape);
  const profileEntry = committedProfile.profiles[fabricationFamily];
  const usesOverride = typeof entity.props.sectionLengthOverride === 'number';
  const activeSectionLength = getActiveSectionLength(entity);
  const singleSelectedSegment =
    selectedIndexes.length === 1 ? entity.props.segments[selectedIndexes[0] ?? -1] : undefined;
  const multiSelectedSegments =
    selectedIndexes.length > 1
      ? selectedIndexes
          .map((index) => entity.props.segments[index])
          .filter((segment): segment is DuctSegment => Boolean(segment))
      : [];

  const applySectionLength = (nextSectionLength?: number) => {
    const previous = structuredClone(entity);
    const nextProps = {
      ...entity.props,
      sectionLengthOverride: nextSectionLength,
      segments: recomputeDuctRunSegments(
        entity.props.installLength,
        nextSectionLength ?? profileEntry.defaultSectionLength
      ),
    };

    updateEntityCommand(entity.id, {
      props: nextProps,
      modifiedAt: new Date().toISOString(),
    }, previous);
  };

  const multiSelectionLength = multiSelectedSegments.reduce((total, segment) => total + segment.length, 0);
  const multiSelectionPartialCount = multiSelectedSegments.filter((segment) => segment.isPartial).length;

  return (
    <div className="flex flex-col gap-4" data-testid="duct-run-inspector">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-900">{entity.props.name}</div>
            <div className="text-xs text-slate-500">
              {entity.props.engineeringSystem.replace(/_/g, ' ')} · {getRunSizeLabel(entity)}
            </div>
          </div>
          <Badge
            className={usesOverride ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-700'}
            variant="outline"
          >
            {usesOverride ? 'Custom section rule' : 'Using global default'}
          </Badge>
        </div>
      </Card>

      <Card>
        <SectionHeader>Section Rule</SectionHeader>
        <div className="flex flex-col gap-3">
          <ReadOnlyField label="Fabrication Profile" value={getFamilyProfile(profileEntry)} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500" htmlFor="section-length-override">
              Section Length Override (ft)
            </label>
            <Input
              data-testid="duct-run-section-length-override"
              id="section-length-override"
              max={profileEntry.maxSectionLength}
              min={profileEntry.minSectionLength}
              step={0.5}
              type="number"
              value={entity.props.sectionLengthOverride ?? ''}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === '') {
                  applySectionLength(undefined);
                  return;
                }

                const parsed = Number(nextValue);
                if (
                  Number.isFinite(parsed) &&
                  parsed >= profileEntry.minSectionLength &&
                  parsed <= profileEntry.maxSectionLength
                ) {
                  applySectionLength(parsed);
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {profileEntry.allowedSectionLengths.map((length) => (
              <Button
                key={length}
                size="sm"
                type="button"
                variant={activeSectionLength === length && usesOverride ? 'default' : 'outline'}
                onClick={() => applySectionLength(length)}
              >
                {formatFeet(length)}
              </Button>
            ))}
            <Button size="sm" type="button" variant="ghost" onClick={() => applySectionLength(undefined)}>
              Use global default
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader>{selectedIndexes.length === 0 ? 'Run Summary' : selectedIndexes.length === 1 ? 'Segment Detail' : 'Multi-Segment Summary'}</SectionHeader>
        {selectedIndexes.length === 0 ? (
          <div className="grid grid-cols-2 gap-3">
            <ReadOnlyField label="Install Length" value={formatFeet(entity.props.installLength)} />
            <ReadOnlyField label="Active Section Length" value={formatFeet(activeSectionLength)} />
            <ReadOnlyField label="Total Pieces" value={String(quantitySummary.totalPieces)} />
            <ReadOnlyField label="Full Pieces" value={String(quantitySummary.fullPieceCount)} />
            <ReadOnlyField label="Partial Pieces" value={String(quantitySummary.partialPieceCount)} />
            <ReadOnlyField
              label="Partial Lengths"
              value={quantitySummary.partialLengths.length > 0 ? quantitySummary.partialLengths.map(formatFeet).join(', ') : 'None'}
            />
          </div>
        ) : null}

        {singleSelectedSegment ? (
          <div className="grid grid-cols-2 gap-3" data-testid="duct-run-single-segment-state">
            <ReadOnlyField label="Piece" value={getSegmentLabel(singleSelectedSegment)} />
            <ReadOnlyField label="Length" value={formatFeet(singleSelectedSegment.length)} />
            <ReadOnlyField label="Start Station" value={formatFeet(singleSelectedSegment.startStation)} />
            <ReadOnlyField label="End Station" value={formatFeet(singleSelectedSegment.endStation)} />
            <ReadOnlyField label="Piece Type" value={singleSelectedSegment.isPartial ? 'Partial' : 'Full'} />
            <ReadOnlyField label="Active Rule" value={usesOverride ? `Override · ${formatFeet(activeSectionLength)}` : `Global · ${formatFeet(activeSectionLength)}`} />
          </div>
        ) : null}

        {multiSelectedSegments.length > 0 ? (
          <div className="grid grid-cols-2 gap-3" data-testid="duct-run-multi-segment-state">
            <ReadOnlyField label="Selected Segments" value={String(multiSelectedSegments.length)} />
            <ReadOnlyField label="Combined Length" value={formatFeet(multiSelectionLength)} />
            <ReadOnlyField label="Partial Segments" value={String(multiSelectionPartialCount)} />
            <ReadOnlyField label="Full Segments" value={String(multiSelectedSegments.length - multiSelectionPartialCount)} />
            <ReadOnlyField label="Segment Indexes" value={selectedIndexes.map((index) => index + 1).join(', ')} />
            <ReadOnlyField label="Active Rule" value={usesOverride ? `Override · ${formatFeet(activeSectionLength)}` : `Global · ${formatFeet(activeSectionLength)}`} />
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default DuctRunInspector;
