import { useCallback, useMemo, useState } from 'react';
import PropertyField from './PropertyField';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { useFieldValidation } from '../../hooks/useFieldValidation';
import type { Duct, Fitting } from '@/core/schema';
import {
  DEFAULT_RECTANGULAR_DUCT_PROPS,
  DEFAULT_ROUND_DUCT_PROPS,
} from '@/core/schema/duct.schema';
import { useEntityStore } from '@/core/store/entityStore';
import { updateEntity as updateEntityCommand, updateEntities as updateEntitiesCommand } from '@/core/commands/entityCommands';
import { AutoSizingControls } from '@/components/canvas/AutoSizingControls';
import type { SizingSuggestion } from '@/core/services/automation/autoSizingService';
import { ValidationDisplay } from '@/components/canvas/ValidationDisplay';
import { parametricUpdateService } from '@/core/services/parametric/parametricUpdateService';
import { useSettingsStore } from '@/core/store/settingsStore';
import {
  generateDeterministicSuggestions,
  type ValidationViolation,
} from '@/core/services/validation/constraintValidator';

interface DuctInspectorProps {
  entity: Duct;
}

// ---- Sub-components --------------------------------------------------------

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </h4>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
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

// ---- Main Component --------------------------------------------------------

export function DuctInspector({ entity }: DuctInspectorProps) {
  const { errors, validateField } = useFieldValidation(entity);
  const engineeringLimits = useSettingsStore((state) => state.calculationSettings.engineeringLimits);
  const [suggestionFeedback, setSuggestionFeedback] = useState<{
    state: 'cleared' | 'mitigated' | 'unchanged';
    message: string;
  } | null>(null);

  const applySuggestionFeedback = useCallback(
    (
      priorIssueCount: number,
      nextConstraintStatus?: Duct['props']['constraintStatus']
    ) => {
      const nextIssueCount = (nextConstraintStatus?.violations ?? []).filter(
        (violation) => violation.severity === 'error' || violation.severity === 'warning'
      ).length;

      if (priorIssueCount === 0 && nextIssueCount === 0) {
        setSuggestionFeedback(null);
        return;
      }

      if (nextIssueCount === 0 && priorIssueCount > 0) {
        setSuggestionFeedback({
          state: 'cleared',
          message: 'Suggestion applied. All warning/error violations cleared.',
        });
        return;
      }

      if (nextIssueCount < priorIssueCount) {
        setSuggestionFeedback({
          state: 'mitigated',
          message: 'Suggestion applied. Violation severity/count was mitigated.',
        });
        return;
      }

      setSuggestionFeedback({
        state: 'unchanged',
        message: 'Suggestion applied, but warning/error violations remain.',
      });
    },
    []
  );

  // ---- Validation normalization -------------------------------------------

  const validationStatusForDisplay = useMemo(() => {
    const status = entity.props.constraintStatus;
    if (!status) {
      return status;
    }

    const typedViolations = status.violations as unknown as ValidationViolation[];
    const deterministicSuggestions = generateDeterministicSuggestions(typedViolations);

    const suggestionByViolationKey = new Map(
      deterministicSuggestions.map((suggestion) => [
        `${suggestion.violationType}::${suggestion.message}::${suggestion.severity}`,
        suggestion.fix,
      ])
    );

    const normalizedViolations = [...typedViolations]
      .sort((a, b) => {
        const severityOrder: Record<'error' | 'warning' | 'info', number> = {
          error: 0,
          warning: 1,
          info: 2,
        };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) {
          return severityDiff;
        }

        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }

        return a.message.localeCompare(b.message);
      })
      .map((violation) => {
        const key = `${violation.type}::${violation.message}::${violation.severity}`;
        const deterministicFix = suggestionByViolationKey.get(key);

        return {
          ...violation,
          suggestedFix: deterministicFix ?? undefined,
        };
      });

    return {
      ...status,
      violations: normalizedViolations,
    };
  }, [entity.props.constraintStatus]);

  // ---- Commit helpers -----------------------------------------------------

  const commit = useCallback(
    <K extends keyof Duct['props']>(field: K, value: Duct['props'][K]) => {
      const { byId } = useEntityStore.getState();
      const current = byId[entity.id];
      if (!current || current.type !== 'duct') {
        return;
      }

      const previous = JSON.parse(JSON.stringify(current)) as Duct;
      const nextProps = { ...current.props, [field]: value };
      const nextEntity: Duct = {
        ...current,
        props: nextProps,
        modifiedAt: new Date().toISOString(),
      };

      const isValid = validateField(field as string, nextEntity);
      if (!isValid) {
        return;
      }

      const ducts = Object.values(byId).filter((item): item is Duct => item?.type === 'duct');
      const fittings = Object.values(byId).filter((item): item is Fitting => item?.type === 'fitting');

      void parametricUpdateService
        .scheduleDuctPropertyChange(
          entity.id,
          { [field]: value } as Partial<Duct['props']>,
          { ducts, fittings },
          engineeringLimits,
          'input',
          500
        )
        .then((result) => {
          if (result.entityUpdates && result.entityUpdates.length > 0) {
            updateEntitiesCommand(result.entityUpdates);
            return;
          }

          updateEntityCommand(entity.id, { props: nextProps, modifiedAt: nextEntity.modifiedAt }, previous);
        });
    },
    [engineeringLimits, entity.id, validateField]
  );

  const handleShapeChange = useCallback(
    (shape: 'round' | 'rectangular') => {
      const { byId } = useEntityStore.getState();
      const current = byId[entity.id];
      if (!current || current.type !== 'duct') {
        return;
      }

      const previous = JSON.parse(JSON.stringify(current)) as Duct;

      const nextProps =
        shape === 'round'
          ? {
              ...current.props,
              shape: 'round' as const,
              diameter: current.props.diameter ?? DEFAULT_ROUND_DUCT_PROPS.diameter,
              width: undefined,
              height: undefined,
            }
          : {
              ...current.props,
              shape: 'rectangular' as const,
              width: current.props.width ?? DEFAULT_RECTANGULAR_DUCT_PROPS.width,
              height: current.props.height ?? DEFAULT_RECTANGULAR_DUCT_PROPS.height,
              diameter: undefined,
            };

      const nextEntity: Duct = {
        ...current,
        props: nextProps,
        modifiedAt: new Date().toISOString(),
      };

      const isValid = validateField('shape', nextEntity);
      if (!isValid) {
        return;
      }

      updateEntityCommand(entity.id, { props: nextProps, modifiedAt: nextEntity.modifiedAt }, previous);
    },
    [entity.id, validateField]
  );

  const handleSizeApplied = useCallback(
    (option: SizingSuggestion) => {
      const { byId } = useEntityStore.getState();
      const current = byId[entity.id];
      if (!current || current.type !== 'duct') {return;}

      const previous = JSON.parse(JSON.stringify(current)) as Duct;
      const newSizeProps = {
        diameter: option.size.diameter,
        width: option.size.width,
        height: option.size.height,
        autoSized: true,
      } as Partial<Duct['props']>;
      const nextProps = { ...current.props, ...newSizeProps } as Duct['props'];
      const modifiedAt = new Date().toISOString();
      const priorIssueCount = (current.props.constraintStatus?.violations ?? []).filter(
        (violation) => violation.severity === 'error' || violation.severity === 'warning'
      ).length;
      const ducts = Object.values(byId).filter((item): item is Duct => item?.type === 'duct');
      const fittings = Object.values(byId).filter((item): item is Fitting => item?.type === 'fitting');

      void parametricUpdateService
        .scheduleDuctPropertyChange(
          entity.id,
          newSizeProps,
          { ducts, fittings },
          engineeringLimits,
          'input',
          0
        )
        .then((result) => {
          const updatedPrimary = result.entityUpdates?.find((update) => update.id === entity.id);

          if (result.entityUpdates && result.entityUpdates.length > 0) {
            updateEntitiesCommand(result.entityUpdates);
          } else {
            updateEntityCommand(entity.id, { props: nextProps, modifiedAt }, previous);
          }

          const nextConstraintStatus = (updatedPrimary?.updates as Partial<Duct> | undefined)?.props
            ?.constraintStatus ?? current.props.constraintStatus;

          applySuggestionFeedback(priorIssueCount, nextConstraintStatus);
        });
    },
    [applySuggestionFeedback, engineeringLimits, entity.id]
  );

  const handleFixSuggestion = useCallback(
    (fix: { property: string; value: number }) => {
      const { byId } = useEntityStore.getState();
      const current = byId[entity.id];
      if (!current || current.type !== 'duct') {
        return;
      }

      const previous = JSON.parse(JSON.stringify(current)) as Duct;
      const nextProps = { ...current.props, [fix.property]: fix.value } as Duct['props'];
      const nextEntity: Duct = {
        ...current,
        props: nextProps,
        modifiedAt: new Date().toISOString(),
      };

      const field = fix.property as keyof Duct['props'];
      const isValid = validateField(String(field), nextEntity);
      if (!isValid) {
        return;
      }

      const priorIssueCount = (current.props.constraintStatus?.violations ?? []).filter(
        (violation) => violation.severity === 'error' || violation.severity === 'warning'
      ).length;

      const ducts = Object.values(byId).filter((item): item is Duct => item?.type === 'duct');
      const fittings = Object.values(byId).filter((item): item is Fitting => item?.type === 'fitting');

      void parametricUpdateService
        .scheduleDuctPropertyChange(
          entity.id,
          { [field]: fix.value } as Partial<Duct['props']>,
          { ducts, fittings },
          engineeringLimits,
          'input',
          0
        )
        .then((result) => {
          const updatedPrimary = result.entityUpdates?.find((update) => update.id === entity.id);

          if (result.entityUpdates && result.entityUpdates.length > 0) {
            updateEntitiesCommand(result.entityUpdates);
          } else {
            updateEntityCommand(entity.id, { props: nextProps, modifiedAt: nextEntity.modifiedAt }, previous);
          }

          const nextConstraintStatus = (updatedPrimary?.updates as Partial<Duct> | undefined)?.props
            ?.constraintStatus ?? current.props.constraintStatus;

          applySuggestionFeedback(priorIssueCount, nextConstraintStatus);
        });
    },
    [applySuggestionFeedback, engineeringLimits, entity.id, validateField]
  );

  // ---- Derived display values ---------------------------------------------

  const isRound = entity.props.shape === 'round';
  const engineeringData = entity.props.engineeringData;
  const displayArea = engineeringData
    ? engineeringData.velocity > 0
      ? (engineeringData.airflow / engineeringData.velocity) * 144
      : entity.calculated.area
    : entity.calculated.area;
  const displayVelocity = engineeringData?.velocity ?? entity.calculated.velocity;
  const displayFrictionLoss = engineeringData?.pressureDrop ?? entity.calculated.frictionLoss;

  const hasViolations =
    (entity.props.constraintStatus?.violations ?? []).filter(
      (v) => v.severity === 'error' || v.severity === 'warning'
    ).length > 0;

  // ---- Render -------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4" data-testid="duct-inspector">

      {/* ── Header card ────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="mb-1 block text-xs font-medium text-slate-500">Name</span>
            <ValidatedInput
              id="duct-name"
              type="text"
              value={entity.props.name}
              error={errors['name']}
              onChange={(val) => commit('name', val as string)}
            />
          </div>
          <div className="mt-5 shrink-0">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isRound
                  ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                  : 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
              }`}
            >
              {isRound ? 'Round' : 'Rectangular'}
            </span>
          </div>
        </div>
      </Card>

      {/* ── Dimensions ─────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader>Dimensions</SectionHeader>
        <div className="flex flex-col gap-3">
          <PropertyField label="Shape" htmlFor="duct-shape">
            <ValidatedInput
              id="duct-shape"
              type="select"
              value={entity.props.shape}
              onChange={(val) => handleShapeChange(val as 'round' | 'rectangular')}
              options={[
                { value: 'round', label: 'Round' },
                { value: 'rectangular', label: 'Rectangular' },
              ]}
            />
          </PropertyField>

          <AutoSizingControls duct={entity.props} onSizeApplied={handleSizeApplied} />

          {isRound ? (
            <PropertyField label="Diameter (in)" htmlFor="duct-diameter">
              <ValidatedInput
                id="duct-diameter"
                type="number"
                min={4}
                max={60}
                step={1}
                value={entity.props.diameter ?? DEFAULT_ROUND_DUCT_PROPS.diameter}
                error={errors['diameter']}
                onChange={(val) => commit('diameter', Number(val))}
              />
            </PropertyField>
          ) : (
            <>
              <PropertyField label="Width (in)" htmlFor="duct-width">
                <ValidatedInput
                  id="duct-width"
                  type="number"
                  min={4}
                  max={96}
                  step={1}
                  value={entity.props.width ?? DEFAULT_RECTANGULAR_DUCT_PROPS.width}
                  error={errors['width']}
                  onChange={(val) => commit('width', Number(val))}
                />
              </PropertyField>
              <PropertyField label="Height (in)" htmlFor="duct-height">
                <ValidatedInput
                  id="duct-height"
                  type="number"
                  min={4}
                  max={96}
                  step={1}
                  value={entity.props.height ?? DEFAULT_RECTANGULAR_DUCT_PROPS.height}
                  error={errors['height']}
                  onChange={(val) => commit('height', Number(val))}
                />
              </PropertyField>
            </>
          )}

          <PropertyField label="Length (ft)" htmlFor="duct-length">
            <ValidatedInput
              id="duct-length"
              type="number"
              min={0.1}
              max={1000}
              step={0.1}
              value={entity.props.length}
              error={errors['length']}
              onChange={(val) => commit('length', Number(val))}
            />
          </PropertyField>
        </div>
      </Card>

      {/* ── Engineering ────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader>Engineering</SectionHeader>
        <div className="flex flex-col gap-3">
          <PropertyField label="Material" htmlFor="duct-material">
            <ValidatedInput
              id="duct-material"
              type="select"
              value={entity.props.material}
              onChange={(val) => commit('material', val as Duct['props']['material'])}
              options={[
                { value: 'galvanized', label: 'Galvanized' },
                { value: 'stainless', label: 'Stainless' },
                { value: 'aluminum', label: 'Aluminum' },
                { value: 'flex', label: 'Flex' },
              ]}
            />
          </PropertyField>

          <PropertyField label="Airflow (CFM)" htmlFor="duct-airflow">
            <ValidatedInput
              id="duct-airflow"
              type="number"
              min={1}
              max={100000}
              step={10}
              value={entity.props.airflow}
              error={errors['airflow']}
              onChange={(val) => commit('airflow', Number(val))}
            />
          </PropertyField>

          <PropertyField label="Static Pressure (in.w.g.)" htmlFor="duct-static-pressure">
            <ValidatedInput
              id="duct-static-pressure"
              type="number"
              min={0}
              max={20}
              step={0.05}
              value={entity.props.staticPressure}
              error={errors['staticPressure']}
              onChange={(val) => commit('staticPressure', Number(val))}
            />
          </PropertyField>

          {/* Calculated read-only values */}
          <div className="mt-1 border-t border-slate-100 pt-3">
            <span className="mb-2 block text-xs font-medium text-slate-500">Calculated</span>
            <div className="grid grid-cols-3 gap-2">
              <ReadOnlyField label="Area" value={`${displayArea.toFixed(2)} sq in`} />
              <ReadOnlyField label="Velocity" value={`${displayVelocity.toFixed(0)} FPM`} />
              <ReadOnlyField label="Friction" value={`${displayFrictionLoss.toFixed(4)}`} />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Validation ─────────────────────────────────────────────────── */}
      {(hasViolations || suggestionFeedback) && (
        <Card>
          <SectionHeader>Validation</SectionHeader>

          {suggestionFeedback && (
            <div
              className={`mb-3 rounded-md border px-3 py-2 text-xs ${
                suggestionFeedback.state === 'cleared'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : suggestionFeedback.state === 'mitigated'
                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
              data-testid="duct-suggestion-feedback"
            >
              {suggestionFeedback.message}
            </div>
          )}

          <ValidationDisplay
            constraintStatus={validationStatusForDisplay as Duct['props']['constraintStatus']}
            onFixSuggestion={handleFixSuggestion}
          />
        </Card>
      )}

      {/* ── Costing ────────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader>Costing</SectionHeader>
        <div className="flex flex-col gap-3 text-sm text-slate-500">
          <p className="text-xs text-slate-400">
            Cost estimates are calculated based on material, labor rates, and markup settings.
          </p>
          <ReadOnlyField label="Material Cost" value="Calculated from component library" />
          <ReadOnlyField label="Labor Hours" value="Calculated from dimensions" />
          <ReadOnlyField label="Total Estimate" value="See BOM panel for details" />
        </div>
      </Card>

    </div>
  );
}

export default DuctInspector;
