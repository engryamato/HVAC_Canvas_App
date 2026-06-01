import { useCallback, useState, type ReactNode } from 'react';

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

const ANGLE_STEP_OPTIONS = [
  { value: 1, label: '1 deg' },
  { value: 5, label: '5 deg' },
];

const END_TYPE_OPTIONS = [
  { value: 'raw', label: 'Raw' },
  { value: 'flange', label: 'Flange' },
  { value: 'crimped', label: 'Crimped' },
  { value: 'coupled', label: 'Coupled' },
  { value: 'slip_joint', label: 'Slip joint' },
];

const INSULATED_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
];

const DEFAULT_RADIUS_RATIO = 1.5;

function clampRadiusRatio(value: number): number {
  return Math.min(3, Math.max(0.5, value));
}

function clampAngle(value: number): number {
  return Math.min(180, Math.max(0, value));
}

function roundAngleToStep(value: number, step: number): number {
  return clampAngle(Math.round(value / step) * step);
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">{children}</div>;
}

function SectionHeader({ children }: { children: ReactNode }) {
  return <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</h4>;
}

export function FittingInspector({ entity }: FittingInspectorProps) {
  const [angleStep, setAngleStep] = useState(1);
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

  const commitAngle = useCallback(
    (value: string | number) => {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) {
        return;
      }

      commit('angle', roundAngleToStep(numericValue, angleStep));
    },
    [angleStep, commit]
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
  const isElbow = supportsAngle;
  const hasOutlet = entity.props.fittingType !== 'cap';
  const radiusRatio = entity.props.radiusRatio ?? DEFAULT_RADIUS_RATIO;
  const insulated = entity.props.insulated ?? false;

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
            <div className="grid grid-cols-2 gap-3">
              <PropertyField label="Angle (deg)" htmlFor="fitting-angle">
                <ValidatedInput
                  id="fitting-angle"
                  type="number"
                  min={0}
                  max={180}
                  step={angleStep}
                  value={entity.props.angle ?? 90}
                  onChange={commitAngle}
                />
              </PropertyField>
              <PropertyField label="Angle Step" htmlFor="fitting-angle-step">
                <ValidatedInput
                  id="fitting-angle-step"
                  type="select"
                  value={angleStep}
                  onChange={(val) => setAngleStep(Number(val))}
                  options={ANGLE_STEP_OPTIONS}
                />
              </PropertyField>
            </div>
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

      <Card>
        <SectionHeader>Geometry</SectionHeader>
        <div className="flex flex-col gap-3">
          {isElbow ? (
            <PropertyField label={`Radius ratio (R/W) — ${radiusRatio.toFixed(2)}`} htmlFor="fitting-radius-ratio">
              <input
                id="fitting-radius-ratio"
                type="range"
                min={0.5}
                max={3}
                step={0.1}
                value={radiusRatio}
                onChange={(event) => commit('radiusRatio', clampRadiusRatio(Number(event.target.value)))}
                className="w-full accent-blue-600"
                data-testid="fitting-radius-ratio"
              />
            </PropertyField>
          ) : null}
          <PropertyField label="Neck length (in)" htmlFor="fitting-neck-length">
            <ValidatedInput
              id="fitting-neck-length"
              type="number"
              min={0}
              max={120}
              step={0.5}
              value={entity.props.neckLength ?? 0}
              onChange={(val) => {
                const numeric = Number(val);
                if (Number.isFinite(numeric)) {
                  commit('neckLength', Math.max(0, numeric));
                }
              }}
            />
          </PropertyField>
        </div>
      </Card>

      <Card>
        <SectionHeader>Insulation</SectionHeader>
        <div className="flex flex-col gap-3">
          <PropertyField label="Insulated" htmlFor="fitting-insulated">
            <ValidatedInput
              id="fitting-insulated"
              type="select"
              value={insulated ? 'yes' : 'no'}
              onChange={(val) => commit('insulated', val === 'yes')}
              options={INSULATED_OPTIONS}
            />
          </PropertyField>
          {insulated ? (
            <PropertyField label="Thickness (in)" htmlFor="fitting-insulation-thickness">
              <ValidatedInput
                id="fitting-insulation-thickness"
                type="number"
                min={0}
                max={12}
                step={0.25}
                value={entity.props.insulationThickness ?? 0}
                onChange={(val) => {
                  const numeric = Number(val);
                  if (Number.isFinite(numeric)) {
                    commit('insulationThickness', Math.max(0, numeric));
                  }
                }}
              />
            </PropertyField>
          ) : null}
        </div>
      </Card>

      <Card>
        <SectionHeader>End Types</SectionHeader>
        <div className={hasOutlet ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'}>
          <PropertyField label="Inlet" htmlFor="fitting-end-inlet">
            <ValidatedInput
              id="fitting-end-inlet"
              type="select"
              value={entity.props.endTypeInlet ?? 'raw'}
              onChange={(val) => commit('endTypeInlet', val as Fitting['props']['endTypeInlet'])}
              options={END_TYPE_OPTIONS}
            />
          </PropertyField>
          {hasOutlet ? (
            <PropertyField label="Outlet" htmlFor="fitting-end-outlet">
              <ValidatedInput
                id="fitting-end-outlet"
                type="select"
                value={entity.props.endTypeOutlet ?? 'raw'}
                onChange={(val) => commit('endTypeOutlet', val as Fitting['props']['endTypeOutlet'])}
                options={END_TYPE_OPTIONS}
              />
            </PropertyField>
          ) : null}
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
