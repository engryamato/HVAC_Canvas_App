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
import { TabbedPropertiesPanel } from './TabbedPropertiesPanel';
import { AutoSizingControls } from '@/components/canvas/AutoSizingControls';
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

export function DuctInspector({ entity }: DuctInspectorProps) {
  const { errors, validateField } = useFieldValidation(entity);
  const engineeringLimits = useSettingsStore((state) => state.calculationSettings.engineeringLimits);
  const [suggestionFeedback, setSuggestionFeedback] = useState<{
    state: 'cleared' | 'mitigated' | 'unchanged';
    message: string;
  } | null>(null);

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
    (newSize: { diameter?: number; width?: number; height?: number }) => {
      const { byId } = useEntityStore.getState();
      const current = byId[entity.id];
      if (!current || current.type !== 'duct') {return;}

      const previous = JSON.parse(JSON.stringify(current)) as Duct;
      const nextProps = { ...current.props, ...newSize };
      
      updateEntityCommand(
        entity.id,
        { props: nextProps, modifiedAt: new Date().toISOString() },
        previous
      );
    },
    [entity.id]
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
            ?.constraintStatus;
          const nextIssueCount = (nextConstraintStatus?.violations ?? []).filter(
            (violation) => violation.severity === 'error' || violation.severity === 'warning'
          ).length;

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
        });
    },
    [engineeringLimits, entity.id, validateField]
  );

  const isRound = entity.props.shape === 'round';
  const readonlyClass = "px-2.5 py-2 rounded-md bg-slate-100 border border-slate-200 text-sm text-slate-900";
  const engineeringData = entity.props.engineeringData;
  const displayArea = engineeringData
    ? engineeringData.velocity > 0
      ? (engineeringData.airflow / engineeringData.velocity) * 144
      : entity.calculated.area
    : entity.calculated.area;
  const displayVelocity = engineeringData?.velocity ?? entity.calculated.velocity;
  const displayFrictionLoss = engineeringData?.pressureDrop ?? entity.calculated.frictionLoss;

  const tabs = [
    {
      id: 'dimensions',
      label: 'Dimensions',
      content: (
        <div className="space-y-4">
          <PropertyField label="Name" htmlFor="duct-name">
            <ValidatedInput
              id="duct-name"
              type="text"
              value={entity.props.name}
              error={errors['name']}
              onChange={(val) => commit('name', val as string)}
            />
          </PropertyField>
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
          <div className="mb-4">
            <AutoSizingControls duct={entity.props} onSizeApplied={handleSizeApplied} />
          </div>
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
      ),
    },
    {
      id: 'engineering',
      label: 'Engineering',
      content: (
        <div className="space-y-4">
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
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h5 className="text-sm font-semibold text-slate-700 mb-2">Calculated Values</h5>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Area:</span>
                <div className={readonlyClass}>{displayArea.toFixed(2)} sq in</div>
              </div>
              <div>
                <span className="text-slate-500">Velocity:</span>
                <div className={readonlyClass}>{displayVelocity.toFixed(2)} FPM</div>
              </div>
              <div>
                <span className="text-slate-500">Friction:</span>
                <div className={readonlyClass}>{displayFrictionLoss.toFixed(4)} in.w.g./100ft</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'costing',
      label: 'Costing',
      content: (
        <div className="space-y-4">
          <div className="text-sm text-slate-600">
            Cost estimates are calculated based on material, labor rates, and markup settings.
          </div>
          <PropertyField label="Material Cost">
            <div className={readonlyClass}>Calculated from component library</div>
          </PropertyField>
          <PropertyField label="Labor Hours">
            <div className={readonlyClass}>Calculated from dimensions</div>
          </PropertyField>
          <PropertyField label="Total Estimate">
            <div className={readonlyClass}>See BOM panel for details</div>
          </PropertyField>
        </div>
      ),
    },
  ];

  return (
    <div>
      <TabbedPropertiesPanel entityType="duct" tabs={tabs} defaultTab="dimensions" />
    </div>
  );
}

export default DuctInspector;
