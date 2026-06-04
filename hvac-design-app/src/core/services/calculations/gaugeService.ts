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
 * ⚠️ PROVISIONAL TABLE — pending D11 gauge-SELECTION ratification.
 * `GAUGE_SELECTION_SCHEDULE` below reproduces a standard SMACNA rectangular
 * gauge schedule, but the exact breakpoints are the user's engineering-truth
 * call (the companion weight table in `gaugeWeightTable.ts` was D11-ratified by
 * the user on 2026-06-03; this selection schedule still needs the same sign-off).
 * It is therefore NOT yet auto-wired into the live cost/BOM path — derivation is
 * exposed as a pure function for WS6a/WS7 to consume once ratified. Ratifying =
 * editing the constants here; the mechanism and provenance handling are final.
 */

export type DerivableGauge = GaugeWeightRecord['gauge']; // 26 | 24 | 22 | 20 | 18

interface GaugeBreak {
  /** Inclusive upper bound on the largest cross-section dimension, inches. */
  maxDimensionIn: number;
  gauge: DerivableGauge;
}

/**
 * Largest-dimension → gauge breakpoints per pressure class. Within a class the
 * gauge gets heavier as the duct grows; across classes it gets heavier as the
 * pressure rises (both columns are monotonic — asserted in the unit tests).
 * `Infinity` is the catch-all heaviest band.
 */
const GAUGE_SELECTION_SCHEDULE: Record<PressureClass, GaugeBreak[]> = {
  '0.5': [
    { maxDimensionIn: 12, gauge: 26 },
    { maxDimensionIn: 30, gauge: 26 },
    { maxDimensionIn: 54, gauge: 24 },
    { maxDimensionIn: 84, gauge: 22 },
    { maxDimensionIn: Infinity, gauge: 20 },
  ],
  '1': [
    { maxDimensionIn: 12, gauge: 26 },
    { maxDimensionIn: 30, gauge: 24 },
    { maxDimensionIn: 54, gauge: 22 },
    { maxDimensionIn: 84, gauge: 22 },
    { maxDimensionIn: Infinity, gauge: 20 },
  ],
  '2': [
    { maxDimensionIn: 12, gauge: 26 },
    { maxDimensionIn: 30, gauge: 24 },
    { maxDimensionIn: 54, gauge: 22 },
    { maxDimensionIn: 84, gauge: 20 },
    { maxDimensionIn: Infinity, gauge: 18 },
  ],
  '3': [
    { maxDimensionIn: 12, gauge: 24 },
    { maxDimensionIn: 30, gauge: 22 },
    { maxDimensionIn: 54, gauge: 20 },
    { maxDimensionIn: 84, gauge: 18 },
    { maxDimensionIn: Infinity, gauge: 18 },
  ],
  '4': [
    { maxDimensionIn: 12, gauge: 24 },
    { maxDimensionIn: 30, gauge: 22 },
    { maxDimensionIn: 54, gauge: 20 },
    { maxDimensionIn: 84, gauge: 18 },
    { maxDimensionIn: Infinity, gauge: 18 },
  ],
  '6': [
    { maxDimensionIn: 12, gauge: 22 },
    { maxDimensionIn: 30, gauge: 20 },
    { maxDimensionIn: 54, gauge: 18 },
    { maxDimensionIn: 84, gauge: 18 },
    { maxDimensionIn: Infinity, gauge: 18 },
  ],
  '10': [
    { maxDimensionIn: 12, gauge: 20 },
    { maxDimensionIn: 30, gauge: 18 },
    { maxDimensionIn: 54, gauge: 18 },
    { maxDimensionIn: 84, gauge: 18 },
    { maxDimensionIn: Infinity, gauge: 18 },
  ],
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
