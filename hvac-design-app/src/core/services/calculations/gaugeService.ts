import type { DuctRunShape } from '@/core/schema/duct-run.schema';
import {
  DEFAULT_PRESSURE_CLASS,
  DEFAULT_SEAL_CLASS,
  type PressureClass,
  type SealClass,
} from '@/core/schema/duct.schema';
import type { SizableDuctProps } from '@/core/services/sizing/sizingProvenance';
import type { GaugeWeightRecord } from './gaugeWeightTable';

/**
 * WS6b — SMACNA gauge auto-derivation from duct size + pressure class.
 *
 * Gauge materially drives weight (WS6a-A3) and cost (WS7), and per SMACNA is
 * *derived* from the largest cross-section dimension and the construction
 * pressure class — heavier (lower-number) gauge for larger ducts and higher
 * pressure. This module is the single derivation point feeding WS6a/WS7.
 *
 * RATIFIED 2026-06-04 (user) per SMACNA source for the RECTANGULAR schedule:
 * pressure classes group into 0.5/1/2" (low) and 4/6/10" (high) tiers, with 3"
 * (medium) taking the high tier conservatively (its rectangular gauge is not
 * separately tabulated in the source). Companion weight table ratified 2026-06-03
 * (+16 ga added 2026-06-04). Seal class is derived from pressure per SMACNA
 * (>=4"→A, 3"→B, <=2"→C) via {@link deriveSealClass}.
 *
 * ROUND: ratified 2026-06-04 (user, SMACNA positive-pressure SPIRAL schedule —
 * the common, lighter round construction; longitudinal-seam/fitting gauges are
 * heavier and handled with WS6a fitting weight). Round/flexible use the round
 * schedule; flat-oval keeps the (conservative) rectangular schedule.
 *
 * Still exposed as a pure function for WS6a/WS7; live auto-wiring into cost/BOM
 * is the next step.
 */

export type DerivableGauge = GaugeWeightRecord['gauge']; // 26 | 24 | 22 | 20 | 18 | 16

interface GaugeBreak {
  /** Inclusive upper bound on the largest cross-section dimension, inches. */
  maxDimensionIn: number;
  gauge: DerivableGauge;
}

/**
 * Largest-dimension → gauge breakpoints per pressure class (SMACNA rectangular,
 * ratified 2026-06-04). Two tiers per the source: low (0.5/1/2") share one
 * schedule; high (4/6/10") share a heavier one; medium (3") takes the high tier
 * (its rectangular gauge is not separately tabulated). Within a class the gauge
 * gets heavier as the duct grows; across classes it gets heavier as pressure
 * rises (both monotonic — asserted in the unit tests). `Infinity` = heaviest band.
 */
const LOW_PRESSURE_RECT: GaugeBreak[] = [
  { maxDimensionIn: 12, gauge: 26 },
  { maxDimensionIn: 30, gauge: 24 },
  { maxDimensionIn: 54, gauge: 22 },
  { maxDimensionIn: 84, gauge: 20 },
  { maxDimensionIn: Infinity, gauge: 18 },
];

const HIGH_PRESSURE_RECT: GaugeBreak[] = [
  { maxDimensionIn: 12, gauge: 24 },
  { maxDimensionIn: 30, gauge: 22 },
  { maxDimensionIn: 42, gauge: 20 },
  { maxDimensionIn: 84, gauge: 18 },
  { maxDimensionIn: Infinity, gauge: 16 },
];

const GAUGE_SELECTION_SCHEDULE: Record<PressureClass, GaugeBreak[]> = {
  '0.5': LOW_PRESSURE_RECT,
  '1': LOW_PRESSURE_RECT,
  '2': LOW_PRESSURE_RECT,
  '3': HIGH_PRESSURE_RECT,
  '4': HIGH_PRESSURE_RECT,
  '6': HIGH_PRESSURE_RECT,
  '10': HIGH_PRESSURE_RECT,
};

/**
 * SMACNA round duct (positive-pressure, spiral lockseam), ratified 2026-06-04.
 * Sampled by the source at 2"/4"/10" w.g.; mapped low (0.5/1/2)→2", medium
 * (3/4)→4", high (6/10)→10". Breakpoints (inclusive diameter, inches) collapse
 * the source's per-diameter rows. `Infinity` extends the largest sourced band
 * (>84") to the heaviest gauge conservatively.
 */
const ROUND_LOW: GaugeBreak[] = [
  { maxDimensionIn: 22, gauge: 26 },
  { maxDimensionIn: 30, gauge: 24 },
  { maxDimensionIn: 36, gauge: 22 },
  { maxDimensionIn: 60, gauge: 20 },
  { maxDimensionIn: 84, gauge: 18 },
  { maxDimensionIn: Infinity, gauge: 16 },
];

const ROUND_MED: GaugeBreak[] = [
  { maxDimensionIn: 18, gauge: 26 },
  { maxDimensionIn: 26, gauge: 24 },
  { maxDimensionIn: 36, gauge: 22 },
  { maxDimensionIn: 50, gauge: 20 },
  { maxDimensionIn: 84, gauge: 18 },
  { maxDimensionIn: Infinity, gauge: 16 },
];

const ROUND_HIGH: GaugeBreak[] = [
  { maxDimensionIn: 14, gauge: 26 },
  { maxDimensionIn: 26, gauge: 24 },
  { maxDimensionIn: 36, gauge: 22 },
  { maxDimensionIn: 50, gauge: 20 },
  { maxDimensionIn: 84, gauge: 18 },
  { maxDimensionIn: Infinity, gauge: 16 },
];

const ROUND_SELECTION_SCHEDULE: Record<PressureClass, GaugeBreak[]> = {
  '0.5': ROUND_LOW,
  '1': ROUND_LOW,
  '2': ROUND_LOW,
  '3': ROUND_MED,
  '4': ROUND_MED,
  '6': ROUND_HIGH,
  '10': ROUND_HIGH,
};

/** Round and flexible duct use the round schedule; flat-oval keeps rectangular. */
function isRoundLike(shape: DuctRunShape): boolean {
  return shape === 'round' || shape === 'flexible';
}

/**
 * Derive the SMACNA gauge for a duct's largest cross-section dimension (inches),
 * shape, and pressure class. Round/flexible use the (lighter) round spiral
 * schedule; rectangular and flat-oval use the rectangular schedule.
 */
export function deriveGauge(
  largestDimensionInches: number,
  shape: DuctRunShape,
  pressureClass: PressureClass = DEFAULT_PRESSURE_CLASS
): DerivableGauge {
  const schedule = isRoundLike(shape)
    ? ROUND_SELECTION_SCHEDULE[pressureClass]
    : GAUGE_SELECTION_SCHEDULE[pressureClass];
  const dimension = Number.isFinite(largestDimensionInches) && largestDimensionInches > 0
    ? largestDimensionInches
    : 0;
  for (const band of schedule) {
    if (dimension <= band.maxDimensionIn) {
      return band.gauge;
    }
  }
  // Unreachable: the last band is Infinity. Heaviest as a safe fallback.
  return schedule[schedule.length - 1]!.gauge;
}

/** Effective pressure class for a run: its own value → project default → '2'. */
export function resolveEffectivePressureClass(
  runValue: PressureClass | undefined,
  projectDefault: PressureClass | undefined
): PressureClass {
  return runValue ?? projectDefault ?? DEFAULT_PRESSURE_CLASS;
}

/** Effective seal class for a run: its own value → project default → 'A'. */
export function resolveEffectiveSealClass(
  runValue: SealClass | undefined,
  projectDefault: SealClass | undefined
): SealClass {
  return runValue ?? projectDefault ?? DEFAULT_SEAL_CLASS;
}

/**
 * SMACNA-derived seal class from pressure class (source-ratified 2026-06-04):
 * `>=4"` → A (all joints/seams/penetrations), `3"` → B (transverse + seams),
 * `2"` → C (transverse joints), `<2"` → `unsealed`, EXCEPT VAV (≥0.5"
 * upstream of terminal boxes) → C. This is the
 * ratified default logic; a project/run may still manually override to a
 * stricter blanket class (e.g. owner-mandated Seal A) — that override wins via
 * the stored `sealClass` and `resolveEffectiveSealClass`.
 *
 * NOTE: supersedes the blanket `DEFAULT_SEAL_CLASS='A'` posture as the *derived*
 * default; the live-default switch lands with WS6a/WS7 wiring.
 */
export function deriveSealClass(pressureClass: PressureClass, opts?: { isVAV?: boolean }): SealClass {
  if (pressureClass === '4' || pressureClass === '6' || pressureClass === '10') {
    return 'A';
  }
  if (pressureClass === '3') {
    return 'B';
  }
  if (pressureClass === '2') {
    return 'C';
  }
  return opts?.isVAV ? 'C' : 'unsealed';
}

/** Largest cross-section dimension (inches) for a duct of the given props. */
export function largestDimensionOf(props: Partial<SizableDuctProps>): number {
  const candidates = [
    (props as { width?: number }).width,
    (props as { height?: number }).height,
    (props as { diameter?: number }).diameter,
    (props as { equivalentDiameter?: number }).equivalentDiameter,
  ].filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
  return candidates.length > 0 ? Math.max(...candidates) : 0;
}

export interface ResolvedGauge {
  gauge: DerivableGauge;
  provenance: 'computed';
}

/**
 * WS5-guarded gauge derivation. Returns the computed gauge UNLESS the duct's
 * gauge is user-`specified` — in which case it returns `null` and the existing
 * gauge must be left untouched (never overwrite a specified gauge). The caller
 * persists `{ gauge, provenance: { gauge: 'computed' } }`.
 */
export function resolveComputedGauge(
  props: Partial<SizableDuctProps>,
  shape: DuctRunShape,
  effectivePressureClass: PressureClass
): ResolvedGauge | null {
  // Inline of the WS5 provenance check (provenance.gauge defaults to 'computed')
  // — kept dependency-free so the calculation layer stays store-cycle-safe.
  if (props.provenance?.gauge === 'specified') {
    return null;
  }
  const dimension = largestDimensionOf(props);
  return { gauge: deriveGauge(dimension, shape, effectivePressureClass), provenance: 'computed' };
}

export { GAUGE_SELECTION_SCHEDULE };
