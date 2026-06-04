import type { DuctProps } from '@/core/schema/duct.schema';
import type { SealClass } from '@/core/schema/duct.schema';
import type { DuctRunShape } from '@/core/schema/duct-run.schema';
import { isEnabled } from '@/core/flags/featureFlags';
import type { SizableDuctProps } from '@/core/services/sizing/sizingProvenance';
import { EngineeringCalculator } from './engineeringCalculator';
import { GAUGE_WEIGHT_TABLE, type GaugeWeightRecord } from './gaugeWeightTable';
import {
  deriveSealClass,
  resolveComputedGauge,
  resolveEffectivePressureClass,
} from './gaugeService';
import { getDuctConstructionDefaults } from './ductConstructionProvider';

/**
 * WS6b/WS6a wiring — derive a duct's construction (gauge, seal class, surface
 * area, weight) from its size + the effective pressure class. Pure: reads the
 * project defaults through {@link getDuctConstructionDefaults} (cycle-safe),
 * never the store. Gated by WS6_CONSTRUCTION_DERIVATION — returns `null` when
 * off so callers keep prior behavior.
 *
 * Provenance (WS5): gauge is only computed when not user-`specified`; a
 * specified gauge is preserved. Seal class follows SMACNA derivation unless the
 * run carries its own `sealClass` (manual override) or a project default is set.
 * Weight is `undefined` ("—") when no ratified gauge is resolvable — never 0.
 */

const TABLE_GAUGES = new Set<number>(GAUGE_WEIGHT_TABLE.map((r) => r.gauge));

export interface DuctConstructionDerivation {
  /** Effective gauge to store (computed or preserved specified); may be undefined. */
  gauge?: number;
  /** Set only when the gauge was (re)computed — caller writes provenance.gauge. */
  gaugeProvenance?: 'computed';
  /** Effective seal class (override → project default → SMACNA-derived). */
  sealClass: SealClass;
  /** Lateral surface area in sq ft. */
  surfaceAreaSquareFeet: number;
  /** Fabricated weight in lb; undefined when gauge is unresolved ("—", never 0). */
  weightPounds?: number;
}

function isTableGauge(gauge: number | undefined): gauge is GaugeWeightRecord['gauge'] {
  return typeof gauge === 'number' && TABLE_GAUGES.has(gauge);
}

function ductSurfaceArea(props: Partial<DuctProps>, shape: DuctRunShape): number {
  // Legacy Duct carries `length`; DuctRun carries `installLength` — accept both.
  const lengthFeet =
    props.length ?? (props as { installLength?: number }).installLength ?? 0;
  const toFeet = (inches: number | undefined): number => (inches ?? 0) / 12;

  switch (shape) {
    case 'rectangular':
      return EngineeringCalculator.calculateSurfaceArea({
        shape: 'rectangular',
        widthFeet: toFeet(props.width),
        heightFeet: toFeet(props.height),
        lengthFeet,
      });
    case 'flat_oval': {
      // Major/minor are the larger/smaller cross-section dimension — do not
      // assume width >= height (a rotated oval may carry width < height).
      const major = Math.max(props.width ?? 0, props.height ?? 0);
      const minor = Math.min(props.width ?? 0, props.height ?? 0);
      return EngineeringCalculator.calculateSurfaceArea({
        shape: 'flat_oval',
        majorFeet: major / 12,
        minorFeet: minor / 12,
        lengthFeet,
      });
    }
    case 'flexible':
      return EngineeringCalculator.calculateSurfaceArea({
        shape: 'flexible',
        diameterFeet: toFeet(props.diameter),
        lengthFeet,
      });
    case 'round':
    default:
      return EngineeringCalculator.calculateSurfaceArea({
        shape: 'round',
        diameterFeet: toFeet(props.diameter),
        lengthFeet,
      });
  }
}

export function deriveDuctConstruction(
  props: Partial<DuctProps>
): DuctConstructionDerivation | null {
  if (!isEnabled('WS6_CONSTRUCTION_DERIVATION')) {
    return null;
  }

  const shape = (props.shape ?? 'round') as DuctRunShape;
  const defaults = getDuctConstructionDefaults();
  const effectivePressure = resolveEffectivePressureClass(props.pressureClass, defaults.defaultPressureClass);

  // Gauge — WS5 guarded. resolveComputedGauge returns null when `specified`.
  // Also preserve a gauge that exists WITHOUT a provenance record (imported /
  // migrated / pre-WS5 data): treat it as user intent, never silently recompute.
  const gaugePresentButUnprovenanced =
    props.gauge !== undefined && props.provenance?.gauge === undefined;
  const computed = gaugePresentButUnprovenanced
    ? null
    : resolveComputedGauge(props as Partial<SizableDuctProps>, shape, effectivePressure);
  const gauge = computed ? computed.gauge : props.gauge;
  const gaugeProvenance = computed ? ('computed' as const) : undefined;

  // Seal class — manual override → explicit project default → SMACNA derivation.
  const sealClass = props.sealClass ?? defaults.defaultSealClass ?? deriveSealClass(effectivePressure);

  const surfaceAreaSquareFeet = ductSurfaceArea(props, shape);
  const weightPounds = isTableGauge(gauge)
    ? EngineeringCalculator.calculateDuctWeight({ areaSquareFeet: surfaceAreaSquareFeet, gauge })
    : undefined;

  return { gauge, gaugeProvenance, sealClass, surfaceAreaSquareFeet, weightPounds };
}
