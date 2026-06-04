import type { DuctRunShape } from '@/core/schema/duct-run.schema';
import {
  DEFAULT_PRESSURE_CLASS,
  DEFAULT_SEAL_CLASS,
  type PressureClass,
  type SealClass,
} from '@/core/schema/duct.schema';
import type { SizableDuctProps } from '@/core/services/sizing/sizingProvenance';
import { getSizeProvenance } from '@/core/services/sizing/sizingProvenance';
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
 * ⚠️ ROUND/flat-oval: the source tabulates round gauge only for medium pressure;
 * a complete cross-pressure round schedule is still pending. Round therefore
 * still resolves through the (heavier, conservative) rectangular schedule — see
 * {@link deriveGauge}. This OVERSTATES round weight/cost slightly until the round
 * table is ratified; it never under-builds.
 *
 * Still exposed as a pure function for WS6a/WS7; live auto-wiring into cost/BOM
 * is the next step.
 */

export type DerivableGauge = GaugeWeightRecord['gauge']; // 26 | 24 | 22 | 20 | 18

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
 * Derive the SMACNA gauge for a duct's largest cross-section dimension (inches)
 * and pressure class. `shape` is accepted for future per-shape schedules; round
 * and flat-oval currently share the rectangular schedule keyed on their largest
 * dimension (diameter / major axis), which is conservative (never lighter).
 */
export function deriveGauge(
  largestDimensionInches: number,
  _shape: DuctRunShape,
  pressureClass: PressureClass = DEFAULT_PRESSURE_CLASS
): DerivableGauge {
  const schedule = GAUGE_SELECTION_SCHEDULE[pressureClass];
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
 * `<=2"` → C (transverse joints). SMACNA leaves `<2"` technically unsealed, but
 * we floor at C (the lightest sealed class) so every run carries a valid class.
 *
 * NOTE: this supersedes the blanket `DEFAULT_SEAL_CLASS='A'` posture — see the
 * open decision in the WS6b memory before wiring it as the live default.
 */
export function deriveSealClass(pressureClass: PressureClass): SealClass {
  if (pressureClass === '4' || pressureClass === '6' || pressureClass === '10') {
    return 'A';
  }
  if (pressureClass === '3') {
    return 'B';
  }
  return 'C';
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
  if (getSizeProvenance(props, 'gauge') === 'specified') {
    return null;
  }
  const dimension = largestDimensionOf(props);
  return { gauge: deriveGauge(dimension, shape, effectivePressureClass), provenance: 'computed' };
}

export { GAUGE_SELECTION_SCHEDULE };
