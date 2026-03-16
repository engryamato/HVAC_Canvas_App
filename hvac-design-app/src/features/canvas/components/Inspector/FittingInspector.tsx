import { useCallback, type ReactNode } from 'react';

import PropertyField from './PropertyField';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { Button } from '@/components/ui/button';
import type { Fitting } from '@/core/schema';
import { updateEntity as updateEntityCommand } from '@/core/commands/entityCommands';
import { useEntityStore } from '@/core/store/entityStore';
import { FITTING_TYPE_LABELS } from '../../entities/fittingDefaults';
import { fittingInsertionService } from '@/core/services/automation/fittingInsertionService';

interface FittingInspectorProps {
  entity: Fitting;
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">{children}</div>;
}

function SectionHeader({ children }: { children: ReactNode }) {
  return <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</h4>;
}

export function FittingInspector({ entity }: FittingInspectorProps) {
  const commit = useCallback(
    <K extends keyof Fitting['props']>(field: K, value: Fitting['props'][K]) => {
      const current = useEntityStore.getState().byId[entity.id];
      if (!current || current.type !== 'fitting') {
        return;
      }

      const previous = JSON.parse(JSON.stringify(current)) as Fitting;
      const shouldLock = Boolean(current.props.autoInserted);

      updateEntityCommand(entity.id, {
        props: {
          ...current.props,
          [field]: value,
          manualOverride: shouldLock ? true : current.props.manualOverride,
        },
        modifiedAt: new Date().toISOString(),
      }, previous);
    },
    [entity.id]
  );

  const handleResetToAuto = useCallback(() => {
    const reset = fittingInsertionService.planManualOverrideReset(entity.id);
    if (!reset) {
      return;
    }

    updateEntityCommand(
      reset.next.id,
      {
        props: reset.next.props,
        transform: reset.next.transform,
        modifiedAt: reset.next.modifiedAt,
      },
      reset.previous,
      {
        selectionBefore: [entity.id],
        selectionAfter: [entity.id],
      }
    );
  }, [entity.id]);

  const connectedDuctCount = new Set([
    entity.props.inletDuctId,
    entity.props.outletDuctId,
    ...(entity.props.connectionPoints?.map((point) => point.ductId) ?? []),
  ].filter(Boolean)).size;

  const fittingTypeOptions = Object.entries(FITTING_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  const supportsAngle = entity.props.fittingType.startsWith('elbow');

  return (
    <div className="flex flex-col gap-4" data-testid="fitting-inspector">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-500">Name</span>
            <ValidatedInput
              id="fitting-name"
              type="text"
              value={entity.props.name ?? ''}
              onChange={(val) => commit('name', val as string)}
            />
          </div>
          <div className="mt-5 flex flex-col items-end gap-1">
            {entity.props.autoInserted ? (
              <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                Auto
              </span>
            ) : null}
            {entity.props.manualOverride ? (
              <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                Locked Override
              </span>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader>Fitting</SectionHeader>
        <div className="flex flex-col gap-3">
          <PropertyField label="Type" htmlFor="fitting-type">
            <ValidatedInput
              id="fitting-type"
              type="select"
              value={entity.props.fittingType}
              onChange={(val) => commit('fittingType', val as Fitting['props']['fittingType'])}
              options={fittingTypeOptions}
            />
          </PropertyField>

          {supportsAngle ? (
            <PropertyField label="Angle (deg)" htmlFor="fitting-angle">
              <ValidatedInput
                id="fitting-angle"
                type="number"
                min={0}
                max={180}
                step={1}
                value={entity.props.angle ?? 90}
                onChange={(val) => commit('angle', Number(val))}
              />
            </PropertyField>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-xs text-slate-500">Connected Ducts</div>
              <div className="text-sm font-medium text-slate-900">{connectedDuctCount}</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-xs text-slate-500">Service</div>
              <div className="truncate text-sm font-medium text-slate-900">
                {entity.props.serviceId ? 'Assigned' : 'Unassigned'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {entity.props.manualOverride ? (
        <Card>
          <SectionHeader>Override</SectionHeader>
          <p className="mb-3 text-sm text-slate-600">
            This fitting is locked and will be preserved during auto-fitting re-runs until reset.
          </p>
          <Button type="button" variant="outline" className="w-full" onClick={handleResetToAuto}>
            Reset to Auto
          </Button>
        </Card>
      ) : null}
    </div>
  );
}

export default FittingInspector;
