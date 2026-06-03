import type { EngineeringLimits } from '@/core/schema/calculation-settings.schema';
import type { DuctProps, DuctSizeProvenance, DuctSizeProvenanceValue } from '@/core/schema/duct.schema';
import type { DuctRunProps } from '@/core/schema/duct-run.schema';
import { isEnabled } from '@/core/flags/featureFlags';
import { engineeringCalculator } from '@/core/services/calculations/engineeringCalculator';
import {
  STANDARD_RECTANGULAR_INCREMENTS,
  STANDARD_ROUND_SIZES,
} from '@/core/services/automation/autoSizingService';

export type SizeField = 'width' | 'height' | 'diameter' | 'equivalentDiameter' | 'gauge';

export type SizableDuctProps = DuctProps | DuctRunProps;

export interface SizeEditOptions {
  targetVelocity?: number;
  limits?: EngineeringLimits;
}

type SizeShape = 'round' | 'rectangular' | 'flat_oval' | 'flexible';

const DEFAULT_TARGET_VELOCITY = 1500;
const MIN_RECTANGULAR_DIMENSION = 4;
const MAX_RECTANGULAR_DIMENSION = 96;

export function isSizingProvenanceEnabled(): boolean {
  return isEnabled('WS5_MANUAL_SIZING_PROVENANCE');
}

export function getSizeProvenance(
  props: Partial<SizableDuctProps>,
  field: SizeField
): DuctSizeProvenanceValue {
  return props.provenance?.[field] ?? 'computed';
}

export function isSpecifiedSizeField(props: Partial<SizableDuctProps>, field: SizeField): boolean {
  return getSizeProvenance(props, field) === 'specified';
}

export function withDefaultSizeProvenance<TProps extends SizableDuctProps>(props: TProps): TProps {
  if (!isSizingProvenanceEnabled()) {
    return props;
  }

  const provenance: DuctSizeProvenance = {
    ...props.provenance,
  };

  if (props.shape === 'round' || props.shape === 'flexible') {
    provenance.diameter ??= 'computed';
  } else {
    provenance.width ??= 'computed';
    provenance.height ??= props.height === 8 ? 'default' : 'computed';
  }

  if (typeof props.gauge === 'number') {
    provenance.gauge ??= 'computed';
  }

  return {
    ...props,
    provenance,
  };
}

export function snapSizeToQuarterInch(value: number): number {
  return Number((Math.round(value / 0.25) * 0.25).toFixed(2));
}

export function snapToNearestStandardSize(field: Extract<SizeField, 'width' | 'height' | 'diameter'>, value: number): number {
  const source = field === 'diameter' ? STANDARD_ROUND_SIZES : STANDARD_RECTANGULAR_INCREMENTS;
  return source.reduce((previous, current) =>
    Math.abs(current - value) < Math.abs(previous - value) ? current : previous
  );
}

export function getStandardNominalSizes(field: Extract<SizeField, 'width' | 'height' | 'diameter'>): readonly number[] {
  return field === 'diameter' ? STANDARD_ROUND_SIZES : STANDARD_RECTANGULAR_INCREMENTS;
}

export function getLastKnownEquivalentDiameter(props: Partial<SizableDuctProps>): number | undefined {
  if (typeof props.equivalentDiameter === 'number' && props.equivalentDiameter > 0) {
    return props.equivalentDiameter;
  }

  if (typeof props.engineeringData?.equivalentDiameter === 'number' && props.engineeringData.equivalentDiameter > 0) {
    return props.engineeringData.equivalentDiameter;
  }

  if ((props.shape === 'round' || props.shape === 'flexible') && typeof props.diameter === 'number') {
    return props.diameter;
  }

  if (typeof props.width === 'number' && typeof props.height === 'number') {
    return engineeringCalculator.calculateEquivalentDiameter(props.width, props.height);
  }

  return undefined;
}

export function applyUserSizeEdit<TProps extends SizableDuctProps>(
  props: TProps,
  field: SizeField,
  value: number | null | undefined,
  options: SizeEditOptions = {}
): TProps {
  if (!isSizingProvenanceEnabled()) {
    return {
      ...props,
      [field]: value ?? undefined,
    } as TProps;
  }

  const targetEquivalentDiameter = getLastKnownEquivalentDiameter(props);
  const provenance: DuctSizeProvenance = {
    ...props.provenance,
    [field]: value === null || value === undefined ? 'computed' : 'specified',
  };
  const nextProps = {
    ...props,
    provenance,
    [field]: value === null || value === undefined ? undefined : snapSizeToQuarterInch(value),
  } as TProps;

  if (field === 'gauge') {
    return nextProps;
  }

  return maintainEquivalentDiameter(nextProps, targetEquivalentDiameter, options);
}

export function applyComputedSizing<TProps extends SizableDuctProps>(
  props: TProps,
  computedSize: { diameter?: number; width?: number; height?: number },
  source: 'computed' | 'default' = 'computed'
): TProps {
  if (!isSizingProvenanceEnabled()) {
    return {
      ...props,
      ...computedSize,
      autoSized: true,
    } as TProps;
  }

  const shape = props.shape as SizeShape;
  const provenance: DuctSizeProvenance = { ...props.provenance };
  const targetEquivalentDiameter = getTargetEquivalentDiameter(computedSize, shape);
  let next = { ...props, provenance } as TProps;

  if (shape === 'round' || shape === 'flexible') {
    if (!isSpecifiedSizeField(next, 'diameter') && typeof computedSize.diameter === 'number') {
      next = {
        ...next,
        diameter: clampRoundDiameter(computedSize.diameter, shape),
        equivalentDiameter: clampRoundDiameter(computedSize.diameter, shape),
        provenance: {
          ...next.provenance,
          diameter: source,
          equivalentDiameter: 'computed',
        },
      } as TProps;
    }
    return {
      ...next,
      autoSized: true,
    } as TProps;
  }

  if (!targetEquivalentDiameter) {
    return {
      ...next,
      autoSized: true,
    } as TProps;
  }

  next = maintainEquivalentDiameter(next, targetEquivalentDiameter);

  if (!isSpecifiedSizeField(next, 'width') && typeof computedSize.width === 'number' && !isSpecifiedSizeField(next, 'height')) {
    next = {
      ...next,
      width: clampRectangularDimension(computedSize.width),
      provenance: { ...next.provenance, width: source },
    } as TProps;
  }

  if (!isSpecifiedSizeField(next, 'height') && typeof computedSize.height === 'number' && !isSpecifiedSizeField(props, 'width')) {
    next = {
      ...next,
      height: clampRectangularDimension(computedSize.height),
      provenance: { ...next.provenance, height: source },
    } as TProps;
  }

  next = maintainEquivalentDiameter(next, targetEquivalentDiameter);
  return {
    ...next,
    autoSized: true,
  } as TProps;
}

/**
 * Equipment-driven sizing (WS5 STEP 5): size a duct's `computed`/`default`
 * fields from the airflow demand at a target velocity, never touching
 * `specified` fields. This pure engine is complete and unit-tested.
 *
 * DEFERRED WIRING: it is intentionally NOT called from the entityStore flow
 * recompute. Doing so created an ESM import cycle
 * (entityStore → sizingProvenance → autoSizingService → parametricUpdateService
 * → fittingGeneration → entityCommands → entityStore) AND a second cycle via
 * settingsStore (which imports useEntityStore). The correct call-site is the
 * equipment placement/connection path (a leaf that imports the store, not one
 * imported by it). Tracked as a WS5 follow-up; see
 * docs/ductwork-program/WS5-followups.md.
 */
export function applyEquipmentCapacitySizing<TProps extends SizableDuctProps>(
  props: TProps,
  airflow: number,
  limits: EngineeringLimits,
  targetVelocity = DEFAULT_TARGET_VELOCITY
): TProps {
  if (!isSizingProvenanceEnabled() || airflow <= 0) {
    return props;
  }

  const shape = props.shape === 'round' || props.shape === 'flexible' ? 'round' : 'rectangular';
  const sized = engineeringCalculator.autoSizeDuct(
    airflow,
    targetVelocity,
    shape,
    props.material ?? 'galvanized',
    limits
  );

  return applyComputedSizing(props, {
    diameter: sized.diameter,
    width: sized.width,
    height: sized.height,
  });
}

export function deriveEquivalentDiameter<TProps extends SizableDuctProps>(props: TProps): TProps {
  const equivalentDiameter = getLastKnownEquivalentDiameter(props);
  if (!equivalentDiameter) {
    return props;
  }

  return {
    ...props,
    equivalentDiameter,
    provenance: {
      ...props.provenance,
      equivalentDiameter: 'computed',
    },
  } as TProps;
}

function maintainEquivalentDiameter<TProps extends SizableDuctProps>(
  props: TProps,
  targetEquivalentDiameter: number | undefined,
  options: SizeEditOptions = {}
): TProps {
  const shape = props.shape as SizeShape;
  if (shape === 'round' || shape === 'flexible') {
    const equivalentDiameter = typeof props.diameter === 'number' ? props.diameter : targetEquivalentDiameter;
    return equivalentDiameter
      ? ({
          ...props,
          ...(!isSpecifiedSizeField(props, 'diameter')
            ? {
                diameter: clampRoundDiameter(equivalentDiameter, shape),
              }
            : {}),
          equivalentDiameter,
          provenance: {
            ...props.provenance,
            ...(!isSpecifiedSizeField(props, 'diameter') ? { diameter: 'computed' as const } : {}),
            equivalentDiameter: 'computed',
          },
        } as TProps)
      : props;
  }

  if (!targetEquivalentDiameter) {
    return applyVelocityFallback(props, options);
  }

  let next = { ...props } as TProps;
  const widthSpecified = isSpecifiedSizeField(next, 'width');
  const heightSpecified = isSpecifiedSizeField(next, 'height');

  if (widthSpecified && !heightSpecified && typeof next.width === 'number') {
    next = {
      ...next,
      height: solveRectangularDimensionForEquivalentDiameter(next.width, targetEquivalentDiameter),
      provenance: {
        ...next.provenance,
        height: 'computed',
      },
    } as TProps;
  } else if (heightSpecified && !widthSpecified && typeof next.height === 'number') {
    next = {
      ...next,
      width: solveRectangularDimensionForEquivalentDiameter(next.height, targetEquivalentDiameter),
      provenance: {
        ...next.provenance,
        width: 'computed',
      },
    } as TProps;
  } else if (!widthSpecified && !heightSpecified) {
    const currentWidth = (next as { width?: number }).width;
    const currentHeight = (next as { height?: number }).height;
    if (typeof currentWidth === 'number') {
      next = {
        ...next,
        height: solveRectangularDimensionForEquivalentDiameter(currentWidth, targetEquivalentDiameter),
        provenance: {
          ...next.provenance,
          height: 'computed',
        },
      } as TProps;
    } else if (typeof currentHeight === 'number') {
      next = {
        ...next,
        width: solveRectangularDimensionForEquivalentDiameter(currentHeight, targetEquivalentDiameter),
        provenance: {
          ...next.provenance,
          width: 'computed',
        },
      } as TProps;
    }
  }

  if (typeof next.width === 'number' && typeof next.height === 'number') {
    const equivalentDiameter = engineeringCalculator.calculateEquivalentDiameter(next.width, next.height);
    return {
      ...next,
      equivalentDiameter,
      provenance: {
        ...next.provenance,
        equivalentDiameter: 'computed',
      },
    } as TProps;
  }

  return applyVelocityFallback(next, options);
}

function applyVelocityFallback<TProps extends SizableDuctProps>(props: TProps, options: SizeEditOptions): TProps {
  if (!options.limits || !props.airflow) {
    return deriveEquivalentDiameter(props);
  }

  return applyEquipmentCapacitySizing(props, props.airflow, options.limits, options.targetVelocity);
}

function getTargetEquivalentDiameter(
  computedSize: { diameter?: number; width?: number; height?: number },
  shape: SizeShape
): number | undefined {
  if (shape === 'round' || shape === 'flexible') {
    return computedSize.diameter;
  }

  if (typeof computedSize.width === 'number' && typeof computedSize.height === 'number') {
    return engineeringCalculator.calculateEquivalentDiameter(computedSize.width, computedSize.height);
  }

  return undefined;
}

function solveRectangularDimensionForEquivalentDiameter(fixedDimension: number, targetEquivalentDiameter: number): number {
  let low = MIN_RECTANGULAR_DIMENSION;
  let high = MAX_RECTANGULAR_DIMENSION;

  for (let index = 0; index < 40; index += 1) {
    const mid = (low + high) / 2;
    const equivalentDiameter = engineeringCalculator.calculateEquivalentDiameter(fixedDimension, mid);

    if (equivalentDiameter < targetEquivalentDiameter) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return clampRectangularDimension(snapSizeToQuarterInch((low + high) / 2));
}

function clampRectangularDimension(value: number): number {
  return Math.min(MAX_RECTANGULAR_DIMENSION, Math.max(MIN_RECTANGULAR_DIMENSION, snapSizeToQuarterInch(value)));
}

function clampRoundDiameter(value: number, shape: SizeShape): number {
  const max = shape === 'flexible' ? 24 : 60;
  return Math.min(max, Math.max(4, snapSizeToQuarterInch(value)));
}
